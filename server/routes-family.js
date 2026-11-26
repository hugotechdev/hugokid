
const { q } = require('./db');
const A = require('./auth');
const hub = require('./hub');
const { route, fail, need, J, now, role, classFor, childFor, className, childOut, hwOut, uniqueLinkCode, LEVELS, TERMS_VERSION } = require('./router');

route('GET', '/api/children', u => { role(u, 'parent'); return q.all('SELECT * FROM children WHERE parent_id = ? ORDER BY id', u.id).map(childOut); });
route('POST', '/api/children', (u, b) => {
  role(u, 'parent');
  if (b.local_id) {
    const ex = q.get('SELECT * FROM children WHERE parent_id = ? AND local_id = ?', u.id, b.local_id);
    if (ex) { q.run('UPDATE children SET name = ?, birth = ?, color = ? WHERE id = ?', b.name || ex.name, b.birth || ex.birth, b.color || ex.color, ex.id); return childOut(q.get('SELECT * FROM children WHERE id = ?', ex.id)); }
  }
  const id = q.run('INSERT INTO children(name, birth, color, parent_id, local_id, created) VALUES (?,?,?,?,?,?)', need(b.name, 'Andika jina'), b.birth || null, b.color || null, u.id, b.local_id || null, now()).lastInsertRowid;
  return childOut(q.get('SELECT * FROM children WHERE id = ?', Number(id)));
});

route('POST', '/api/children/link', (u, b) => {
  role(u, 'parent');
  const code = need(b.code, 'Weka msimbo').toUpperCase().replace(/\s+/g, '');
  const st = q.get('SELECT * FROM children WHERE link_code = ?', code);
  if (!st) fail(404, 'Msimbo haupo. Hakikisha na shule');
  if (st.parent_id && st.parent_id !== u.id) fail(409, 'Msimbo huu umeshatumika na mzazi mwingine');
  const mine = b.child_id ? q.get('SELECT * FROM children WHERE id = ? AND parent_id = ?', +b.child_id, u.id) : null;
  if (mine && mine.id !== st.id) {

    q.run('UPDATE submissions SET child_id = ? WHERE child_id = ?', mine.id, st.id);
    q.run('UPDATE children SET school_id = ?, class_id = ?, link_code = NULL WHERE id = ?', st.school_id, st.class_id, mine.id);
    q.run('DELETE FROM children WHERE id = ?', st.id);
    q.run('UPDATE children SET link_code = ? WHERE id = ?', code, mine.id);
    return childOut(q.get('SELECT * FROM children WHERE id = ?', mine.id));
  }
  q.run('UPDATE children SET parent_id = ?, local_id = COALESCE(?, local_id), color = COALESCE(?, color), birth = COALESCE(?, birth) WHERE id = ?', u.id, b.local_id || null, b.color || null, b.birth || null, st.id);
  return childOut(q.get('SELECT * FROM children WHERE id = ?', st.id));
});
route('PUT', '/api/children/:id', (u, b, req, p) => {
  role(u, 'parent');
  const ch = childFor(u, p.id);
  q.run('UPDATE children SET name = ?, birth = ?, color = ?, allow_audio = ?, allow_video = ? WHERE id = ?',
    b.name || ch.name, b.birth || ch.birth, b.color || ch.color,
    b.allow_audio === undefined ? ch.allow_audio : (b.allow_audio ? 1 : 0), b.allow_video === undefined ? ch.allow_video : (b.allow_video ? 1 : 0), ch.id);
  return childOut(q.get('SELECT * FROM children WHERE id = ?', ch.id));
});

route('PUT', '/api/children/:id/progress', (u, b, req, p) => {
  role(u, 'parent');
  const ch = childFor(u, p.id);
  const txt = JSON.stringify(b.progress || {});
  if (txt.length > 300000) fail(413, 'Taarifa ni nyingi mno');
  q.run('UPDATE children SET progress = ?, name = COALESCE(?, name), birth = COALESCE(?, birth), color = COALESCE(?, color) WHERE id = ?', txt, b.name || null, b.birth || null, b.color || null, ch.id);
  return { ok: true };
});

route('DELETE', '/api/account', (u) => {
  role(u, 'parent');
  q.run('UPDATE children SET parent_id = NULL, progress = NULL, local_id = NULL WHERE parent_id = ? AND school_id IS NOT NULL', u.id);
  q.run('DELETE FROM children WHERE parent_id = ?', u.id);
  q.run('DELETE FROM messages WHERE from_id = ? OR to_id = ?', u.id, u.id);
  q.run('DELETE FROM users WHERE id = ?', u.id);
  return { ok: true };
});

/* Marafiki (wazazi wote wawili wanakubali) */
route('POST', '/api/children/:id/invite', (u, b, req, p) => {
  role(u, 'parent');
  const ch = childFor(u, p.id);
  q.run('DELETE FROM invites WHERE child_id = ? OR expires < ?', ch.id, now());
  let c; do { c = A.code(6); } while (q.get('SELECT code FROM invites WHERE code = ?', c));
  q.run('INSERT INTO invites(code, child_id, expires) VALUES (?,?,?)', c, ch.id, now() + 48 * 3600e3);
  return { code: c, expires: now() + 48 * 3600e3 };
});
route('POST', '/api/children/:id/friends', (u, b, req, p) => {
  role(u, 'parent');
  const ch = childFor(u, p.id);
  const inv = q.get('SELECT * FROM invites WHERE code = ? AND expires > ?', need(b.code, 'Weka msimbo').toUpperCase().replace(/\s+/g, ''), now());
  if (!inv) fail(404, 'Msimbo si sahihi au umekwisha muda');
  if (inv.child_id === ch.id) fail(400, 'Huu ni msimbo wa mtoto wako mwenyewe');
  const [a, bb] = [Math.min(inv.child_id, ch.id), Math.max(inv.child_id, ch.id)];
  q.run('INSERT OR IGNORE INTO friends(a, b, created) VALUES (?,?,?)', a, bb, now());
  q.run('DELETE FROM invites WHERE code = ?', inv.code);
  const other = q.get('SELECT * FROM children WHERE id = ?', inv.child_id);
  if (other.parent_id) hub.toUser(other.parent_id, { t: 'refresh', what: 'friends' });
  return { ok: true, friend: { id: other.id, name: other.name } };
});
route('GET', '/api/children/:id/friends', (u, b, req, p) => {
  if (!u) fail(401, 'Ingia kwanza');
  const ch = childFor(u, p.id);
  return q.all('SELECT * FROM friends WHERE a = ? OR b = ?', ch.id, ch.id).map(f => {
    const o = q.get('SELECT * FROM children WHERE id = ?', f.a === ch.id ? f.b : f.a);
    return { id: f.id, child_id: o.id, name: o.name, color: o.color, online: hub.isOnline(o.id), allow_audio: !!(o.allow_audio && ch.allow_audio), allow_video: !!(o.allow_video && ch.allow_video) };
  });
});
route('DELETE', '/api/friends/:id', (u, b, req, p) => {
  role(u, 'parent');
  const f = q.get('SELECT * FROM friends WHERE id = ?', +p.id); if (!f) fail(404, 'Haipo');
  const mine = q.get('SELECT id FROM children WHERE id IN (?, ?) AND parent_id = ?', f.a, f.b, u.id);
  if (!mine) fail(403, 'Huna ruhusa');
  q.run('DELETE FROM friends WHERE id = ?', f.id);
  return { ok: true };
});
route('GET', '/api/children/:id/calls', (u, b, req, p) => {
  role(u, 'parent');
  const ch = childFor(u, p.id);
  return q.all('SELECT * FROM calls WHERE a = ? OR b = ? ORDER BY started DESC LIMIT 50', ch.id, ch.id).map(c => {
    const o = q.get('SELECT name FROM children WHERE id = ?', c.a === ch.id ? c.b : c.a);
    return { with: o ? o.name : '?', media: c.media, started: c.started, ended: c.ended };
  });
});

