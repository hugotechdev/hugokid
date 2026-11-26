/* HTTP server, static assets, API and WebSocket entry point. */

process.removeAllListeners('warning');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { q } = require('./db');
const A = require('./auth');
const hub = require('./hub');
const router = require('./router');
const tts = require('./tts');
require('./routes-core');
require('./password-reset');
require('./routes-homework');
require('./routes-family');
require('./routes-school');
require('./routes-admin');

const PORT = +process.env.PORT || 8800;
const WEB = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'www');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

A.bootstrap();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
}
function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on('data', c => { n += c.length; if (n > limit) { reject(new router.HttpError(413, 'Ombi ni kubwa mno')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
function sendFile(req, res, file, mime) {
  const st = fs.statSync(file);
  const range = req.headers.range;
  const headers = { 'content-type': mime, 'accept-ranges': 'bytes', 'cache-control': 'private, max-age=86400' };
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = +s || 0, end = e ? Math.min(+e, st.size - 1) : st.size - 1;
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${st.size}`, 'content-length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { ...headers, 'content-length': st.size });
  fs.createReadStream(file).pipe(res);
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  const url = new URL(req.url, 'http://x');
  try {
    if (url.pathname.startsWith('/api/')) {
      if (url.pathname === '/api/health') return json(res, 200, { ok: true });

      if (url.pathname === '/api/tts/status') return json(res, 200, { enabled: tts.ready() });
      if (url.pathname === '/api/tts' && req.method === 'GET') {
        try {
          const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
          const f = await tts.file(url.searchParams.get('text') || '', ip);
          const st = fs.statSync(f);
          res.writeHead(200, { 'content-type': 'audio/mpeg', 'content-length': st.size, 'cache-control': 'public, max-age=2592000, immutable' });
          return fs.createReadStream(f).pipe(res);
        } catch (e) { return json(res, e.code || 500, { error: e.message }); }
      }
      if (url.pathname === '/api/upload' && req.method === 'POST') {
        const buf = await readBody(req, 61 * 1024 * 1024);
        return json(res, 200, await router.handle(req, res, buf, 'UPLOAD'));
      }
      if (url.pathname.startsWith('/api/files/') && req.method === 'GET') {
        const f = await router.handle(req, res, null, 'FILE');
        return sendFile(req, res, f.path, f.mime);
      }
      const raw = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req, 30 * 1024 * 1024) : null;
      let body = {};
      if (raw && raw.length) { try { body = JSON.parse(raw.toString()); } catch (e) { return json(res, 400, { error: 'JSON si sahihi' }); } }
      return json(res, 200, await router.handle(req, res, body));
    }

    let p = decodeURIComponent(url.pathname);
    if (p === '/' || !path.extname(p)) p = '/index.html';
    const file = path.normalize(path.join(WEB, p));
    if (!file.startsWith(WEB) || !fs.existsSync(file)) { res.writeHead(404); return res.end('Haipo'); }

    const st = fs.statSync(file);
    const etag = '"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"';
    const code = ['.html', '.js', '.css', '.webmanifest', '.json'].includes(path.extname(file));
    const head = { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', etag, 'cache-control': code ? 'no-cache' : 'public, max-age=86400' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, head); return res.end(); }
    res.writeHead(200, head);
    fs.createReadStream(file).pipe(res);
  } catch (e) {
    if (e instanceof router.HttpError) return json(res, e.code, { error: e.message });
    console.error(e);
    json(res, 500, { error: 'Hitilafu ya server' });
  }
});

/* ---------- WebSocket: /ws?token=...&child=... ---------- */
const friendsOf = id => q.all('SELECT a, b FROM friends WHERE a = ? OR b = ?', id, id).map(f => f.a === id ? f.b : f.a);
const areFriends = (x, y) => !!q.get('SELECT id FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)', Math.min(x, y), Math.max(x, y), Math.min(x, y), Math.max(x, y));

server.on('upgrade', (req, sock) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname !== '/ws') return sock.destroy();
  const user = router.userFromReq(req);
  if (!user) return sock.destroy();
  let child = null;
  const cid = url.searchParams.get('child');
  if (cid) { try { child = router.childFor(user, cid); } catch (e) { return sock.destroy(); } }
  hub.attach(req, sock, {
    user, child, friendsOf,
    onMessage: (s, m) => {
      if (!child || !m || !m.to) return;
      const to = +m.to;
      if (!areFriends(child.id, to)) return;
      const me = q.get('SELECT * FROM children WHERE id = ?', child.id), other = q.get('SELECT * FROM children WHERE id = ?', to);
      if (m.t === 'call') {
        const media = m.media === 'video' ? 'video' : 'audio';
        const ok = media === 'video' ? me.allow_video && other.allow_video : me.allow_audio && other.allow_audio;
        if (!ok) return hub.send(s, { t: 'denied', reason: media === 'video' ? 'Video haijaruhusiwa na mzazi' : 'Simu haijaruhusiwa na mzazi' });
        if (!hub.isOnline(to)) return hub.send(s, { t: 'denied', reason: other.name + ' hayupo mtandaoni' });
        if (hub.calls.has(to)) return hub.send(s, { t: 'denied', reason: other.name + ' yuko kwenye simu nyingine' });
        return hub.toChild(to, { t: 'ring', from: child.id, name: me.name, color: me.color, media });
      }
      if (m.t === 'accept') {
        hub.calls.set(child.id, to); hub.calls.set(to, child.id);
        q.run('INSERT INTO calls(a, b, media, started) VALUES (?,?,?,?)', to, child.id, m.media || 'audio', Date.now());
        return hub.toChild(to, { t: 'accepted', from: child.id });
      }
      if (m.t === 'decline') return hub.toChild(to, { t: 'declined', from: child.id });
      if (m.t === 'hangup') {
        hub.calls.delete(child.id); hub.calls.delete(to);
        q.run('UPDATE calls SET ended = ? WHERE ended IS NULL AND ((a = ? AND b = ?) OR (a = ? AND b = ?))', Date.now(), child.id, to, to, child.id);
        return hub.toChild(to, { t: 'hangup', from: child.id });
      }
      if (m.t === 'signal') { if (hub.calls.get(child.id) === to) hub.toChild(to, { t: 'signal', from: child.id, data: m.data }); return; }
      if (m.t === 'game') return hub.toChild(to, { t: 'game', from: child.id, name: me.name, data: m.data });
    },
  });
});

server.listen(PORT, () => console.log(`[HUGO KID] Server iko hewani: http://localhost:${PORT}`));
