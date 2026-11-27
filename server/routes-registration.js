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
const ages = Array.from({ length: 11 }, (_, index) => index + 3);

function registrationAge(child) {
  if (child?.age !== undefined) {
    const value = typeof child.age === 'number' || typeof child.age === 'string' ? Number(child.age) : NaN;
    return ages.includes(value) ? value : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(child?.birth || '')) return null;
  const birth = new Date(child.birth);
  const today = new Date();
  if (Number.isNaN(birth.getTime()) || birth.toISOString().slice(0, 10) !== child.birth || birth > today) return null;
  const beforeBirthday = today.toISOString().slice(5, 10) < child.birth.slice(5);
  const age = today.getUTCFullYear() - birth.getUTCFullYear() - Number(beforeBirthday);
  return age >= ages[0] ? Math.min(age, ages[ages.length - 1]) : null;
}

function registrationChild(child) {
  const avatar = /^[1-6]$/.test(field(child?.avatar, 8)) ? child.avatar.trim() : '';
  const religion = ['values', 'islam', 'christian'].includes(child?.religion) ? child.religion : 'values';
  const needs = Array.isArray(child?.needs) ? ['vision', 'hearing', 'dyslexia', 'attention'].filter(need => child.needs.includes(need)) : [];
  return {
    name: field(child?.name, 100), age: registrationAge(child), grade: field(child?.grade, 60),
    avatar, religion, faithOn: child?.faithOn !== false, needs,
  };
}

// Existing learning levels use a reference date internally to calculate age.
function referenceDateForAge(age) {
  const date = new Date();
  date.setUTCFullYear(date.getUTCFullYear() - age);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

route('GET', '/api/registration', user => {
  role(user, 'parent', 'school_admin');
  const saved = J(q.get('SELECT draft FROM customer_registrations WHERE user_id = ?', user.id)?.draft) || {};
  if (Array.isArray(saved.children)) saved.children = saved.children.map(registrationChild);
  return { draft: saved, levels: LEVELS, grades, ages };
});

route('PUT', '/api/registration', (user, body) => {
  role(user, 'parent', 'school_admin');
  const existing = q.get('SELECT completed FROM customer_registrations WHERE user_id = ?', user.id);
  if (!existing || existing.completed) return { user: A.publicUser(user) };
  const parent = user.role === 'parent';
  const draft = parent ? {
    children: (Array.isArray(body.children) ? body.children : []).slice(0, 25).map(registrationChild),
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
    if (!count || draft.children.some(c => !c.name || c.age === null || !grades.includes(c.grade))) fail(400, 'Enter the name, choose the age and select a grade for each child.');
  } else if (!draft.name || !draft.region || !draft.district || !draft.levels.length || !Number.isSafeInteger(count) || count < 1 || count > 10000) {
    fail(400, 'Enter the school or centre name, location, classes and number of students (1–10,000).');
  }

  db.exec('BEGIN IMMEDIATE');
  try {
    const completed = now();
    q.run("UPDATE customer_registrations SET draft = '{}', completed = ?, student_count = ? WHERE user_id = ?", completed, count, user.id);
    if (parent) {
      for (const child of draft.children) q.run('INSERT INTO children(name,birth,parent_id,local_id,progress,created) VALUES (?,?,?,?,?,?)',
        child.name, referenceDateForAge(child.age), user.id, randomUUID(), JSON.stringify({ profile: { grade: child.grade, avatar: child.avatar, religion: child.religion, faithOn: child.faithOn, needs: child.needs } }), completed);
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
