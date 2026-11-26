// HUGO KID server - auth.js : nenosiri, tokeni na msimamizi mkuu wa kwanza
const crypto = require('crypto');
const { q } = require('./db');

function hashPass(p) {
  const salt = crypto.randomBytes(16).toString('hex');
  const h = crypto.scryptSync(String(p), salt, 64).toString('hex');
  return salt + ':' + h;
}
function checkPass(p, stored) {
  const [salt, h] = String(stored || '').split(':');
  if (!salt || !h) return false;
  const x = crypto.scryptSync(String(p), salt, 64);
  return crypto.timingSafeEqual(x, Buffer.from(h, 'hex'));
}
function newToken(userId) {
  const t = crypto.randomBytes(32).toString('hex');
  q.run('INSERT INTO sessions(token, user_id, created) VALUES (?,?,?)', t, userId, Date.now());
  return t;
}
function userFromToken(token) {
  if (!token) return null;
  return q.get(`SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?`, token) || null;
}
function tokenOf(req) {
  const h = req.headers.authorization || '';
  if (h.startsWith('Bearer ')) return h.slice(7);
  return null;
}
function publicUser(u) {
  if (!u) return null;
  const school = u.school_id ? q.get('SELECT * FROM schools WHERE id = ?', u.school_id) : null;
  return {
    id: u.id, role: u.role, name: u.name, phone: u.phone, email: u.email, must_change: !!u.must_change,
    school: school ? { id: school.id, name: school.name, type: school.type, region: school.region, district: school.district, levels: JSON.parse(school.levels || '[]') } : null,
  };
}
/* Msimbo rahisi kusoma (bila 0/O, 1/I) */
function code(n = 6) {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < n; i++) s += A[crypto.randomInt(A.length)];
  return s;
}
function tempPassword() { return 'HK-' + code(6); }

/* Mara ya kwanza: akaunti ya HUGO TECH (lazima ibadilishe nenosiri) */
function bootstrap() {
  const has = q.get(`SELECT id FROM users WHERE role = 'superadmin'`);
  if (has) return;
  const email = process.env.ADMIN_EMAIL || 'admin@hugotech.co.tz';
  const pass = process.env.ADMIN_PASSWORD || 'HugoKid@2026';
  q.run(`INSERT INTO users(role, name, email, pass, must_change, created) VALUES ('superadmin', 'HUGO TECH', ?, ?, 1, ?)`, email, hashPass(pass), Date.now());
  console.log(`[HUGO KID] Akaunti ya msimamizi mkuu: ${email} / ${pass} (badilisha nenosiri ukiingia)`);
}

module.exports = { hashPass, checkPass, newToken, userFromToken, tokenOf, publicUser, code, tempPassword, bootstrap };
