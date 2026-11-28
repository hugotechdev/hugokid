
const { db, q } = require('./db');
const A = require('./auth');
const hub = require('./hub');
const { route, fail, need, J, now, role, classFor, childFor, className, childOut, hwOut, uniqueLinkCode, LEVELS, TERMS_VERSION } = require('./router');

function accountContact(body) {
  if ((body.phone != null && typeof body.phone !== 'string') || (body.email != null && typeof body.email !== 'string')) {
    fail(400, 'Enter a valid phone number or email.');
  }
  const phone = (body.phone || '').replace(/\s+/g, '');
  const email = (body.email || '').trim().toLowerCase();
  if (phone && !/^\+?\d{7,20}$/.test(phone)) fail(400, 'Enter a valid phone number.');
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) fail(400, 'Enter a valid email address.');
  return { phone, email };
}

function suppliedPassword(value) {
  return typeof value === 'string' && value.length >= 6 && value.length <= 128;
}

route('POST', '/api/register', (u, b) => {
  const kind = need(b.kind, "Choose an account type");
  if (!['parent', 'school', 'tutor'].includes(kind)) fail(400, "Invalid type");
  if (b.terms !== TERMS_VERSION) fail(400, "Accept the terms first");
  const name = need(b.name, "Enter a name");
  if (typeof name !== 'string' || name.length > 100) fail(400, 'Enter a name of up to 100 characters.');
  const { phone, email } = accountContact(b);
  if (!phone && !email) fail(400, "Enter a phone number or email");
  if (!suppliedPassword(b.password)) fail(400, 'Choose a password between 6 and 128 characters.');
  if (phone && q.get('SELECT id FROM users WHERE phone = ?', phone)) fail(409, 'This phone number is already registered.');
  if (email && q.get('SELECT id FROM users WHERE email = ?', email)) fail(409, "This email is already registered");
  db.exec('BEGIN IMMEDIATE');
  try {
    let schoolId = null;
    if (kind !== 'parent') {
      const school = b.school || {};
      if (['name', 'region', 'district'].some(key => school[key] != null && typeof school[key] !== 'string')) {
        fail(400, 'Enter valid school details.');
      }
      const levels = Array.isArray(school.levels) ? LEVELS.filter(level => school.levels.includes(level)) : [];
      schoolId = Number(q.run("INSERT INTO schools(name, type, region, district, phone, levels, created, status) VALUES (?,?,?,?,?,?,?,'pending')",
        school.name || name, kind, school.region || '', school.district || '', phone, JSON.stringify(levels), now()).lastInsertRowid);
    }
    const id = Number(q.run('INSERT INTO users(role, name, phone, email, pass, school_id, terms, created, access_status) VALUES (?,?,?,?,?,?,?,?,?)',
      kind === 'parent' ? 'parent' : 'school_admin', name, phone || null, email || null, A.hashPass(b.password), schoolId, JSON.stringify({ v: TERMS_VERSION, at: now() }), now(), kind === 'parent' ? 'pending' : 'active').lastInsertRowid);
    q.run('INSERT INTO customer_registrations(user_id) VALUES (?)', id);
    const result = { token: A.newToken(id), user: A.publicUser(q.get('SELECT * FROM users WHERE id = ?', id)) };
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
});

const tries = new Map();
const loginWindow = 15 * 60_000;
setInterval(() => {
  const cutoff = Date.now() - loginWindow;
  for (const [key, value] of tries) if (value.at <= cutoff) tries.delete(key);
}, loginWindow).unref();
route('POST', '/api/login', (u, b) => {
  if (typeof b.login !== 'string' || b.login.length > 254 || !b.login.trim()) fail(400, 'Enter a phone or email.');
  if (typeof b.password !== 'string' || b.password.length > 128) fail(400, 'Enter a valid password.');
  const login = b.login.replace(/\s+/g, '').toLowerCase();
  const t = tries.get(login) || { n: 0, at: Date.now() };
  if (Date.now() - t.at > loginWindow) { t.n = 0; t.at = Date.now(); }
  if (t.n >= 8) fail(429, 'Too many sign-in attempts. Try again in 15 minutes.');
  const user = q.get('SELECT * FROM users WHERE phone = ? OR lower(email) = ?', login, login);
  if (!user || !A.checkPass(b.password, user.pass)) {
    if (!tries.has(login) && tries.size >= 5000) tries.delete(tries.keys().next().value);
    t.n++; tries.set(login, t);
    fail(401, 'Wrong sign-in details');
  }
  tries.delete(login);
  return { token: A.newToken(user.id), user: A.publicUser(user) };
});
route('POST', '/api/logout', (u, b, req) => { q.run('DELETE FROM sessions WHERE token = ?', A.tokenOf(req)); return { ok: true }; });
route('GET', '/api/me', u => { if (!u) fail(401, "Sign in first"); return { user: A.publicUser(u), levels: LEVELS }; });
route('POST', '/api/password', (u, b, req) => {
  if (!u) fail(401, "Sign in first");
  if (typeof b.old !== 'string' || b.old.length > 128 || !A.checkPass(b.old, u.pass)) fail(400, 'The old password is wrong');
  if (!suppliedPassword(b.new)) fail(400, 'Choose a password between 6 and 128 characters.');
  db.exec('BEGIN IMMEDIATE');
  try {
    q.run('UPDATE users SET pass = ?, must_change = 0 WHERE id = ?', A.hashPass(b.new), u.id);
    q.run('DELETE FROM sessions WHERE user_id = ? AND token <> ?', u.id, A.tokenOf(req));
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  hub.closeUser(u.id);
  return { ok: true };
});

route('GET', '/api/school', u => {
  role(u, 'school_admin', 'teacher');
  const s = q.get('SELECT * FROM schools WHERE id = ?', u.school_id);
  return {
    school: { ...s, levels: J(s.levels) },
    counts: {
      classes: q.get('SELECT count(*) n FROM classes WHERE school_id = ?', s.id).n,
      teachers: q.get(`SELECT count(*) n FROM users WHERE school_id = ? AND role = 'teacher'`, s.id).n,
      students: q.get('SELECT count(*) n FROM children WHERE school_id = ?', s.id).n,
      parents: q.get('SELECT count(DISTINCT parent_id) n FROM children WHERE school_id = ? AND parent_id IS NOT NULL', s.id).n,
      homework: q.get('SELECT count(*) n FROM homework h JOIN classes c ON c.id = h.class_id WHERE c.school_id = ?', s.id).n,
    },
    levels: LEVELS,
  };
});
route('PUT', '/api/school', (u, b) => {
  role(u, 'school_admin');
  const s = q.get('SELECT * FROM schools WHERE id = ?', u.school_id);
  const levels = Array.isArray(b.levels) ? b.levels.filter(l => typeof l === 'string' && l.trim()).slice(0, 30) : J(s.levels);
  q.run('UPDATE schools SET name = ?, region = ?, district = ?, levels = ? WHERE id = ?', b.name || s.name, b.region ?? s.region, b.district ?? s.district, JSON.stringify(levels), s.id);
  return { ok: true };
});

/* Madarasa */
route('GET', '/api/classes', u => {
  role(u, 'school_admin', 'teacher');
  const rows = u.role === 'teacher'
    ? q.all('SELECT * FROM classes WHERE teacher_id = ? ORDER BY level, stream', u.id)
    : q.all('SELECT * FROM classes WHERE school_id = ? ORDER BY level, stream', u.school_id);
  return rows.map(c => ({
    ...c, name: className(c),
    teacher: c.teacher_id ? (q.get('SELECT name FROM users WHERE id = ?', c.teacher_id) || {}).name : null,
    students: q.get('SELECT count(*) n FROM children WHERE class_id = ?', c.id).n,
  }));
});
route('POST', '/api/classes', (u, b) => {
  role(u, 'school_admin');
  const level = need(b.level, "Choose a class");
  const teacher = b.teacher_id ? q.get(`SELECT id FROM users WHERE id = ? AND school_id = ? AND role IN ('teacher','school_admin')`, +b.teacher_id, u.school_id) : null;
  if (b.teacher_id && !teacher) fail(400, 'Choose a teacher from this school.');
  const sch = q.get('SELECT type FROM schools WHERE id = ?', u.school_id);
  const id = q.run('INSERT INTO classes(school_id, level, stream, teacher_id, created) VALUES (?,?,?,?,?)', u.school_id, level, (b.stream || '').trim(), teacher ? teacher.id : (sch.type === 'tutor' ? u.id : null), now()).lastInsertRowid;
  return { id: Number(id) };
});
route('PUT', '/api/classes/:id', (u, b, req, p) => {
  role(u, 'school_admin');
  const c = classFor(u, p.id);
  const teacher = b.teacher_id ? q.get(`SELECT id FROM users WHERE id = ? AND school_id = ? AND role IN ('teacher','school_admin')`, +b.teacher_id, u.school_id) : null;
  if (b.teacher_id && !teacher) fail(400, 'Choose a teacher from this school.');
  const teacherId = b.teacher_id === undefined ? c.teacher_id : teacher?.id ?? null;
  q.run('UPDATE classes SET level = ?, stream = ?, teacher_id = ? WHERE id = ?', b.level || c.level, b.stream ?? c.stream, teacherId, c.id);
  return { ok: true };
});
route('DELETE', '/api/classes/:id', (u, b, req, p) => { role(u, 'school_admin'); const c = classFor(u, p.id); q.run('DELETE FROM classes WHERE id = ?', c.id); return { ok: true }; });

/* Walimu */
route('GET', '/api/teachers', u => {
  role(u, 'school_admin');
  return q.all(`SELECT id, name, phone, email, must_change FROM users WHERE school_id = ? AND role = 'teacher' ORDER BY name`, u.school_id)
    .map(t => ({ ...t, classes: q.all('SELECT * FROM classes WHERE teacher_id = ?', t.id).map(className) }));
});
route('POST', '/api/teachers', (u, b) => {
  role(u, 'school_admin');
  const name = need(b.name, "Enter the teacher's name");
  const { phone, email } = accountContact(b);
  if (!phone && !email) fail(400, "Enter the teacher's phone number or email");
  if (phone && q.get('SELECT id FROM users WHERE phone = ?', phone)) fail(409, 'This phone number is already registered.');
  if (email && q.get('SELECT id FROM users WHERE email = ?', email)) fail(409, "This email is already registered");
  const pass = A.tempPassword();
  const id = q.run(`INSERT INTO users(role, name, phone, email, pass, school_id, must_change, created) VALUES ('teacher',?,?,?,?,?,1,?)`, name, phone || null, email || null, A.hashPass(pass), u.school_id, now()).lastInsertRowid;
  return { id: Number(id), login: phone || email, password: pass };
});
route('POST', '/api/teachers/:id/reset', (u, b, req, p) => {
  role(u, 'school_admin');
  const t = q.get(`SELECT * FROM users WHERE id = ? AND school_id = ? AND role = 'teacher'`, +p.id, u.school_id);
  if (!t) fail(404, "Teacher not found");
  const pass = A.tempPassword();
  q.run('UPDATE users SET pass = ?, must_change = 1 WHERE id = ?', A.hashPass(pass), t.id);
  q.run('DELETE FROM sessions WHERE user_id = ?', t.id);
  return { login: t.phone || t.email, password: pass };
});
route('DELETE', '/api/teachers/:id', (u, b, req, p) => {
  role(u, 'school_admin');
  q.run(`DELETE FROM users WHERE id = ? AND school_id = ? AND role = 'teacher'`, +p.id, u.school_id);
  return { ok: true };
});

/* Wanafunzi */
route('GET', '/api/classes/:id/students', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, p.id);
  return q.all('SELECT * FROM children WHERE class_id = ? ORDER BY name', c.id).map(ch => {
    const par = ch.parent_id ? q.get('SELECT name, phone FROM users WHERE id = ?', ch.parent_id) : null;
    return { ...childOut(ch), parent: par };
  });
});
route('POST', '/api/classes/:id/students', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, p.id);
  const names = Array.isArray(b.names) ? b.names : [b.name];
  const out = [];
  names.map(n => String(n || '').trim()).filter(Boolean).slice(0, 80).forEach(n => {
    const lc = uniqueLinkCode();
    const id = q.run('INSERT INTO children(name, birth, school_id, class_id, link_code, created) VALUES (?,?,?,?,?,?)', n, b.birth || null, c.school_id, c.id, lc, now()).lastInsertRowid;
    out.push({ id: Number(id), name: n, link_code: lc });
  });
  if (!out.length) fail(400, "Enter the student's name");
  return out;
});
route('PUT', '/api/students/:id', (u, b, req, p) => {
  role(u, 'school_admin');
  const ch = childFor(u, p.id);
  if (b.class_id) classFor(u, b.class_id);
  q.run('UPDATE children SET name = ?, class_id = ? WHERE id = ?', b.name || ch.name, b.class_id ? +b.class_id : ch.class_id, ch.id);
  return { ok: true };
});
route('DELETE', '/api/students/:id', (u, b, req, p) => {
  role(u, 'school_admin');
  const ch = childFor(u, p.id);
  if (ch.parent_id) q.run('UPDATE children SET school_id = NULL, class_id = NULL, link_code = NULL WHERE id = ?', ch.id);
  else q.run('DELETE FROM children WHERE id = ?', ch.id);
  return { ok: true };
});

route('GET', '/api/parents', u => {
  role(u, 'school_admin');
  const rows = q.all(`SELECT u.id, u.name, u.phone, u.email FROM users u WHERE u.id IN (SELECT parent_id FROM children WHERE school_id = ? AND parent_id IS NOT NULL) ORDER BY u.name`, u.school_id);
  return rows.map(r => ({ ...r, children: q.all('SELECT * FROM children WHERE parent_id = ? AND school_id = ?', r.id, u.school_id).map(ch => ({ name: ch.name, class_name: className(q.get('SELECT * FROM classes WHERE id = ?', ch.class_id)) })) }));
});

