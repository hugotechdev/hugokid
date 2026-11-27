// HUGO KID server - routes-admin.js : HUGO TECH
const { q } = require('./db');
const A = require('./auth');
const hub = require('./hub');
const { route, fail, need, J, now, role, classFor, childFor, className, childOut, hwOut, uniqueLinkCode, LEVELS, TERMS_VERSION } = require('./router');

route('GET', '/api/admin/stats', u => {
  role(u, 'superadmin');
  return {
    schools: q.get('SELECT count(*) n FROM schools').n,
    teachers: q.get(`SELECT count(*) n FROM users WHERE role = 'teacher'`).n,
    parents: q.get(`SELECT count(*) n FROM users WHERE role = 'parent'`).n,
    children: q.get('SELECT count(*) n FROM children').n,
    homework: q.get('SELECT count(*) n FROM homework').n,
    submissions: q.get('SELECT count(*) n FROM submissions').n,
    list: q.all('SELECT id, name, type, region, district, phone, status, created FROM schools ORDER BY created DESC LIMIT 200').map(s => ({
      ...s, students: q.get('SELECT count(*) n FROM children WHERE school_id = ?', s.id).n,
    })),
  };
});
route('POST', '/api/admin/schools/:id/status', (u, b, req, p) => {
  role(u, 'superadmin');
  if (!['blocked','active'].includes(b.status)) fail(400, 'Choose an access status.');
  if (!q.run('UPDATE schools SET status = ? WHERE id = ?', b.status, +p.id).changes) fail(404, 'School not found.');
  if (b.status === 'blocked') q.all('SELECT id FROM users WHERE school_id=?', +p.id).forEach(user => hub.closeUser(user.id));
  return { ok: true };
});

route('POST', '/api/admin/parents/:id/status', (u, b, req, p) => {
  role(u, 'superadmin');
  if (!['blocked','active'].includes(b.status)) fail(400, 'Choose an access status.');
  const id = +p.id;
  if (!q.run("UPDATE users SET access_status = ? WHERE id = ? AND role = 'parent'", b.status, id).changes) fail(404, 'Parent not found.');
  if (b.status === 'blocked') hub.closeUser(id);
  return { ok: true };
});

const contactPhone = value => String(value || '').replace(/\D/g, '').replace(/^(?:00255|255|0)(?=\d{9}$)/, '');
function matchingAccounts() {
  const indexes = { name: new Map(), phone: new Map(), email: new Map() };
  for (const account of q.all("SELECT id, role, name, phone, email FROM users WHERE role <> 'superadmin'")) {
    for (const [key, index] of Object.entries(indexes)) {
      const value = key === 'phone' ? contactPhone(account[key]) : String(account[key] || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!value) continue;
      if (!index.has(value)) index.set(value, []);
      index.get(value).push(account);
    }
  }
  const matches = new Map();
  for (const [key, index] of Object.entries(indexes)) for (const accounts of index.values()) {
    if (accounts.length < 2) continue;
    for (const account of accounts) {
      if (!matches.has(account.id)) matches.set(account.id, []);
      matches.get(account.id).push({ field: key, accounts: accounts.slice(0, 11).filter(other => other.id !== account.id).slice(0, 10).map(({id, name, role}) => ({id, name, role})) });
    }
  }
  return matches;
}

route('GET', '/api/admin/users', (u, b, req) => {
  role(u, 'superadmin');
  const sp = new URL(req.url, 'http://x').searchParams;
  const r = ['teacher', 'parent', 'school_admin'].includes(sp.get('role')) ? sp.get('role') : 'parent';
  const s = '%' + (sp.get('q') || '').trim().toLowerCase() + '%';
  const matches = matchingAccounts();
  return q.all(`SELECT us.id, us.name, us.phone, us.email, us.role, us.created, us.access_status, us.school_id, sc.name school, sc.status school_status FROM users us LEFT JOIN schools sc ON sc.id = us.school_id
    WHERE us.role = ? AND (lower(us.name) LIKE ? OR us.phone LIKE ? OR lower(coalesce(us.email,'')) LIKE ?) ORDER BY us.created DESC LIMIT 300`, r, s, s, s)
    .map(x => ({ ...x, matches: matches.get(x.id) || [], children: x.role === 'parent' ? q.all('SELECT name FROM children WHERE parent_id = ?', x.id).map(c => c.name) : undefined }));
});
route('GET', '/api/admin/children', (u, b, req) => {
  role(u, 'superadmin');
  const s = '%' + (new URL(req.url, 'http://x').searchParams.get('q') || '').trim().toLowerCase() + '%';
  return q.all(`SELECT c.id, c.name, c.birth, sc.name school, cl.level, cl.stream, us.name parent, us.phone FROM children c
    LEFT JOIN schools sc ON sc.id = c.school_id LEFT JOIN classes cl ON cl.id = c.class_id LEFT JOIN users us ON us.id = c.parent_id
    WHERE lower(c.name) LIKE ? ORDER BY c.created DESC LIMIT 300`, s);
});
route('POST', '/api/admin/users/:id/reset', (u, b, req, p) => {
  role(u, 'superadmin');
  const t = q.get(`SELECT * FROM users WHERE id = ? AND role <> 'superadmin'`, +p.id);
  if (!t) fail(404, 'User not found.');
  if (t.role !== 'teacher') {
    if (t.email) fail(409, 'Ask the customer to use Forgot password? with their registered email.');
    if (A.accessStatus(t) !== 'active') fail(409, 'Approve the account before using assisted password recovery.');
  }
  const pass = A.tempPassword();
  q.run('UPDATE users SET pass = ?, must_change = 1 WHERE id = ?', A.hashPass(pass), t.id);
  q.run('DELETE FROM sessions WHERE user_id = ?', t.id);
  return { login: t.phone || t.email, password: pass };
});

route('POST', '/api/admin/customers/action', (u, b) => {
  role(u, 'superadmin');
  const ids = Array.isArray(b.ids) ? [...new Set(b.ids)] : [];
  if (!ids.length || ids.length > 300 || !ids.every(id => Number.isSafeInteger(id) && id > 0)) fail(400, 'Select customers first.');
  if (!['school', 'parent'].includes(b.kind) || !['active', 'blocked', 'message'].includes(b.action)) fail(400, 'Invalid action.');
  const message = String(b.message || '').trim();
  if (b.action === 'message' && (!message || message.length > 2000)) fail(400, 'Enter a message of up to 2,000 characters.');
  const school = b.kind === 'school';
  const marks = ids.map(() => '?').join(',');
  const target = school ? 'schools WHERE' : "users WHERE role='parent' AND";
  if (q.get('SELECT COUNT(*) n FROM ' + target + ' id IN (' + marks + ')', ...ids).n !== ids.length) fail(404, 'Refresh the customer list.');
  const recipients = q.all('SELECT id FROM users WHERE ' + (school ? "role='school_admin' AND school_id" : "role='parent' AND id") + ' IN (' + marks + ')', ...ids);
  if (b.action === 'message') {
    if (!recipients.length) fail(400, 'No recipients found.');
    q.run('INSERT INTO customer_notices(user_id,body,created) SELECT id,?,? FROM users WHERE id IN (' + recipients.map(() => '?').join(',') + ')', message, now(), ...recipients.map(r => r.id));
    recipients.forEach(r => hub.toUser(r.id, { t: 'customer_notice' }));
  } else {
    q.run((school ? 'UPDATE schools SET status=? WHERE' : "UPDATE users SET access_status=? WHERE role='parent' AND") + ' id IN (' + marks + ')', b.action, ...ids);
    if (b.action === 'blocked') {
      const affected = school ? q.all('SELECT id FROM users WHERE school_id IN (' + marks + ')', ...ids) : recipients;
      affected.forEach(r => hub.closeUser(r.id));
    }
  }
  return { count: ids.length };
});
route('GET', '/api/customer/notices', u => {
  role(u, 'parent', 'school_admin');
  return q.all('SELECT id,body,created,seen FROM customer_notices WHERE user_id=? ORDER BY id DESC LIMIT 100', u.id);
});
route('POST', '/api/customer/notices/read', (u,b) => {
  role(u, 'parent', 'school_admin');
  q.run('UPDATE customer_notices SET seen=1 WHERE user_id=? AND id<=?', u.id, Number(b.through) || 0);
  return { ok: true };
});
