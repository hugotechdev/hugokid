
const { q } = require('./db');
const A = require('./auth');
const userFromReq = req => A.userFromToken(A.tokenOf(req) || new URL(req.url, 'http://x').searchParams.get('token'));

const LEVELS = [
  'Awali - Baby Class', 'Awali - Middle Class', 'Awali - Pre-Unit',
  'Darasa la 1', 'Darasa la 2', 'Darasa la 3', 'Darasa la 4', 'Darasa la 5', 'Darasa la 6', 'Darasa la 7',
];
const TERMS_VERSION = '1.0';

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const fail = (code, msg) => { throw new HttpError(code, msg); };
const need = (v, msg) => { if (v === undefined || v === null || String(v).trim() === '') fail(400, msg); return typeof v === 'string' ? v.trim() : v; };
const J = s => { try { return JSON.parse(s || 'null'); } catch (e) { return null; } };
const now = () => Date.now();

function role(u, ...roles) { if (!u) fail(401, "Sign in first"); if (!roles.includes(u.role)) fail(403, 'Huna ruhusa'); }
function classFor(u, classId) {
  const c = q.get('SELECT * FROM classes WHERE id = ?', +classId);
  if (!c) fail(404, 'Darasa halipo');
  if (u.role === 'superadmin') return c;
  if (c.school_id !== u.school_id) fail(403, "You don't have access to this class");
  if (u.role === 'teacher' && c.teacher_id !== u.id) fail(403, "Not your class");
  return c;
}
function childFor(u, childId) {
  const ch = q.get('SELECT * FROM children WHERE id = ?', +childId);
  if (!ch) fail(404, "Child not found");
  if (u.role === 'parent' && ch.parent_id === u.id) return ch;
  if (u.role === 'school_admin' && ch.school_id === u.school_id) return ch;
  if (u.role === 'teacher' && ch.class_id && q.get('SELECT id FROM classes WHERE id = ? AND teacher_id = ?', ch.class_id, u.id)) return ch;
  if (u.role === 'superadmin') return ch;
  fail(403, "You don't have access to this child");
}
const className = c => c ? (c.level + (c.stream ? ' ' + c.stream : '')) : '';
const childOut = ch => {
  const cls = ch.class_id ? q.get('SELECT * FROM classes WHERE id = ?', ch.class_id) : null;
  const sch = ch.school_id ? q.get('SELECT name FROM schools WHERE id = ?', ch.school_id) : null;
  return { id: ch.id, name: ch.name, birth: ch.birth, color: ch.color, local_id: ch.local_id, progress: J(ch.progress), class_id: ch.class_id, class_name: className(cls), school: sch ? sch.name : null, link_code: ch.link_code, linked: !!ch.parent_id, allow_audio: !!ch.allow_audio, allow_video: !!ch.allow_video };
};
const hwOut = (h, full) => ({
  id: h.id, class_id: h.class_id, title: h.title, subject: h.subject, kind: h.kind, due: h.due, max_score: h.max_score, created: h.created,
  ...(full ? { instructions: h.instructions || '', pages: J(h.pages) || [], questions: J(h.questions) || [], attachments: J(h.attachments) || [] } : {}),
});
function uniqueLinkCode() { let c; do { c = A.code(6); } while (q.get('SELECT id FROM children WHERE link_code = ?', c)); return c; }

const R = [];
const route = (method, pattern, fn) => {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
  R.push({ method, re, keys, fn });
};

async function handle(req, res, body, method) {
  const url = new URL(req.url, 'http://x');
  const M = method || req.method;
  const device = require('./child-devices').authorize(req,url.pathname,M,body || {});
  if (device?.result) return device.result;
  const r = R.find(x => x.method === M && x.re.test(url.pathname));
  if (!r) throw new HttpError(404, "Route not found");
  const m = url.pathname.match(r.re);
  const params = {}; r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
  const u = device?.parent || userFromReq(req);
  const recoveryRoute = ['/api/me', '/api/password', '/api/logout', '/api/billing'].includes(url.pathname) ||
    /^\/api\/billing\/\d+\/pay$/.test(url.pathname);
  const status = A.accessStatus(u);
  if (u && status !== 'active' && !recoveryRoute) {
    const error = new HttpError(403, status === 'pending' ? 'Your account is awaiting approval.' : 'Your account is suspended.');
    error.accessStatus = status;
    throw error;
  }
  return r.fn(u, body === undefined ? {} : body, req, params);
}

module.exports = { route, handle, userFromReq, HttpError, fail, need, J, now, role, classFor, childFor, className, childOut, hwOut, uniqueLinkCode, LEVELS, TERMS_VERSION };
