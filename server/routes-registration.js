const { randomUUID } = require('node:crypto');
const { db, q } = require('./db');
const A = require('./auth');
const { route, fail, role, now, J, LEVELS } = require('./router');

function checkRegistration(parentId, schoolId) {
  const draft = parentId
    ? A.registrationPending(parentId)
    : q.get("SELECT 1 FROM customer_registrations r JOIN users u ON u.id = r.user_id WHERE u.school_id = ? AND u.role = 'school_admin' AND r.completed IS NULL", schoolId);
  if (draft) fail(409, 'This customer must complete registration first.');
}

function issueRegistrationInvoice(user, registration) {
  if (!registration?.completed || A.accessStatus(user) !== 'pending') return;
  const schoolId = user.role === 'school_admin' ? user.school_id : null;
  const parentId = schoolId ? null : user.id;
  const plans = J(q.get("SELECT value FROM settings WHERE key = 'plans'")?.value) || {};
  const school = schoolId ? q.get('SELECT type FROM schools WHERE id = ?', schoolId) : null;
  const amount = Math.round(school ? Number(plans.school_student_term) * registration.student_count : Number(plans.parent_month));
  if (!Number.isSafeInteger(amount) || amount <= 0) return;
  const plan = school?.type === 'tutor' ? 'HUGO KID Tutor' : school ? 'HUGO KID School' : 'HUGO KID Parent';
  q.run(`INSERT INTO invoices(school_id, parent_id, plan, amount, period, created)
    SELECT ?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM invoices WHERE ${school ? 'school_id' : 'parent_id'} = ?)`,
  schoolId, parentId, plan, amount, school ? 'First term' : 'First month', now(), schoolId || parentId);
}

function issueWaitingInvoices() {
  const users = q.all('SELECT u.*, r.completed, r.student_count FROM users u JOIN customer_registrations r ON r.user_id = u.id WHERE r.completed IS NOT NULL');
  for (const user of users) issueRegistrationInvoice(user, user);
}

const field = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const grades = ['Sijaanza shule', ...LEVELS];
const dateIsValid = birth => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return false;
  const date = new Date(birth);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === birth && date <= new Date();
};

route('GET', '/api/registration', user => {
  role(user, 'parent', 'school_admin');
  const saved = J(q.get('SELECT draft FROM customer_registrations WHERE user_id = ?', user.id)?.draft) || {};
  return { draft: saved, levels: LEVELS, grades };
});

route('PUT', '/api/registration', (user, body) => {
  role(user, 'parent', 'school_admin');
  const existing = q.get('SELECT completed FROM customer_registrations WHERE user_id = ?', user.id);
  if (!existing || existing.completed) return { user: A.publicUser(user) };
  const parent = user.role === 'parent';
  const draft = parent ? {
    children: (Array.isArray(body.children) ? body.children : []).slice(0, 25).map(child => ({
      name: field(child?.name, 100), birth: field(child?.birth, 10), grade: field(child?.grade, 60),
    })),
  } : {
    name: field(body.name, 100), region: field(body.region, 80), district: field(body.district, 80),
    levels: Array.isArray(body.levels) ? LEVELS.filter(level => body.levels.includes(level)) : [],
    studentCount: field(String(body.studentCount ?? ''), 8),
  };
  if (body.complete !== true) {
    q.run('UPDATE customer_registrations SET draft = ? WHERE user_id = ? AND completed IS NULL', JSON.stringify(draft), user.id);
    return { ok: true };
  }
  if (A.accessStatus(user) !== 'pending') fail(409, 'Contact HUGO TECH to complete this registration.');
  const count = parent ? draft.children.length : Number(draft.studentCount);
  if (parent) {
    if (!count || draft.children.some(c => !c.name || !dateIsValid(c.birth) || !grades.includes(c.grade))) fail(400, 'Enter the name, date of birth and grade for each child.');
  } else if (!draft.name || !draft.region || !draft.district || !draft.levels.length || !Number.isSafeInteger(count) || count < 1 || count > 10000) {
    fail(400, 'Enter the school or centre name, location, classes and number of students (1–10,000).');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const completed = now();
    q.run("UPDATE customer_registrations SET draft = '{}', completed = ?, student_count = ? WHERE user_id = ?", completed, count, user.id);
    if (parent) {
      for (const child of draft.children) q.run('INSERT INTO children(name,birth,parent_id,local_id,progress,created) VALUES (?,?,?,?,?,?)',
        child.name, child.birth, user.id, randomUUID(), JSON.stringify({ profile: { grade: child.grade } }), completed);
    } else {
      const school = q.get('SELECT type FROM schools WHERE id = ?', user.school_id);
      q.run('UPDATE schools SET name = ?, region = ?, district = ?, levels = ? WHERE id = ?', draft.name, draft.region, draft.district, JSON.stringify(draft.levels), user.school_id);
      for (const level of draft.levels) {
        q.run(`INSERT INTO classes(school_id, level, teacher_id, created) SELECT ?,?,?,?
          WHERE NOT EXISTS (SELECT 1 FROM classes WHERE school_id=? AND level=? AND stream='')`,
        user.school_id, level, school.type === 'tutor' ? user.id : null, completed, user.school_id, level);
      }
    }
    issueRegistrationInvoice(user, { completed, student_count: count });
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { user: A.publicUser(user) };
});

module.exports = { issueWaitingInvoices, checkRegistration };
