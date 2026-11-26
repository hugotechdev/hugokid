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
  q.run('UPDATE schools SET status = ? WHERE id = ?', b.status === 'blocked' ? 'blocked' : 'active', +p.id);
  return { ok: true };
});

route('GET', '/api/admin/users', (u, b, req) => {
  role(u, 'superadmin');
  const sp = new URL(req.url, 'http://x').searchParams;
  const r = ['teacher', 'parent', 'school_admin'].includes(sp.get('role')) ? sp.get('role') : 'parent';
  const s = '%' + (sp.get('q') || '').trim().toLowerCase() + '%';
  return q.all(`SELECT us.id, us.name, us.phone, us.email, us.role, us.created, sc.name school FROM users us LEFT JOIN schools sc ON sc.id = us.school_id
    WHERE us.role = ? AND (lower(us.name) LIKE ? OR us.phone LIKE ? OR lower(coalesce(us.email,'')) LIKE ?) ORDER BY us.created DESC LIMIT 300`, r, s, s, s)
    .map(x => ({ ...x, children: x.role === 'parent' ? q.all('SELECT name FROM children WHERE parent_id = ?', x.id).map(c => c.name) : undefined }));
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
  if (!t) fail(404, 'Mtumiaji hayupo');
  const pass = A.tempPassword();
  q.run('UPDATE users SET pass = ?, must_change = 1 WHERE id = ?', A.hashPass(pass), t.id);
  q.run('DELETE FROM sessions WHERE user_id = ?', t.id);
  return { login: t.phone || t.email, password: pass };
});
