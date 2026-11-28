/* HTTP server, static assets, API and WebSocket entry point. */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('node:stream/promises');
const { q } = require('./db');
const A = require('./auth');
const hub = require('./hub');
const router = require('./router');
const tts = require('./tts');
const devices = require('./child-devices');
const { MAX_APK, sendAndroidApk } = require('./android-download');
require('./routes-core');
require('./routes-registration');
require('./password-reset');
require('./routes-homework');
require('./routes-family');
require('./routes-school');
require('./routes-admin');

const PORT = Number(process.env.PORT ?? 8800);
const WEB = path.join(__dirname, '..', 'app', 'src', 'main', 'assets', 'www');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };

A.bootstrap();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
}
function json(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;
    let oversized = Number(req.headers['content-length']) > limit;
    const rejectSize = () => reject(new router.HttpError(413, 'The request is too large.'));
    if (oversized) rejectSize();
    req.on('data', chunk => {
      if (oversized) return;
      received += chunk.length;
      if (received > limit) {
        oversized = true;
        chunks.length = 0;
        rejectSize();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!oversized) resolve(Buffer.concat(chunks, received)); });
    req.on('aborted', () => reject(new router.HttpError(400, 'The request was interrupted.')));
    req.on('error', reject);
  });
}

async function sendFile(req, res, file, mime) {
  const st = await fs.promises.stat(file).catch(error => {
    if (error.code === 'ENOENT') throw new router.HttpError(404, 'File not found.');
    throw error;
  });
  if (!st.isFile()) throw new router.HttpError(404, 'File not found.');
  const headers = { 'content-type': mime, 'accept-ranges': 'bytes', 'cache-control': 'private, no-store' };
  const range = req.headers.range;
  let start = 0, end = st.size - 1;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (match?.[1]) {
      start = Number(match[1]);
      if (match[2]) end = Math.min(end, Number(match[2]));
    } else if (match?.[2]) start = Math.max(0, st.size - Number(match[2]));
    if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || start > end) {
      res.writeHead(416, { ...headers, 'content-range': 'bytes */' + st.size });
      return res.end();
    }
    headers['content-range'] = `bytes ${start}-${end}/${st.size}`;
  }
  res.writeHead(range ? 206 : 200, { ...headers, 'content-length': end - start + 1 });
  if (req.method === 'HEAD' || !st.size) return res.end();
  await pipeline(fs.createReadStream(file, { start, end }), res);
}

const server = http.createServer(async (req, res) => {
  cors(res);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/download/HUGO-KID.apk' && ['GET', 'HEAD'].includes(req.method)) {
      return await sendAndroidApk(req, res);
    }
    if (url.pathname === '/api/admin/android-download' && req.method === 'POST') {
      const admin = router.userFromReq(req);
      router.role(admin, 'superadmin');
      if (admin.must_change) throw new router.HttpError(403, 'Change your temporary password before continuing.');
      const bytes = await readBody(req, MAX_APK);
      return json(res, 200, await router.handle(req, res, bytes, 'APK_UPLOAD'));
    }
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
        const child = devices.authorize(req, url.pathname, 'UPLOAD', {});
        if (!child?.parent && !router.userFromReq(req)) throw new router.HttpError(401, 'Sign in first.');
        const buf = await readBody(req, 60 * 1024 * 1024);
        return json(res, 200, await router.handle(req, res, buf, 'UPLOAD'));
      }
      if (url.pathname.startsWith('/api/files/') && ['GET', 'HEAD'].includes(req.method)) {
        const f = await router.handle(req, res, null, 'FILE');
        return await sendFile(req, res, f.path, f.mime);
      }
      const raw = ['POST', 'PUT', 'DELETE'].includes(req.method) ? await readBody(req, 30 * 1024 * 1024) : null;
      let body = {};
      if (raw?.length) {
        try { body = JSON.parse(raw.toString()); } catch { throw new router.HttpError(400, 'Invalid JSON.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new router.HttpError(400, 'Expected a JSON object.');
      }
      return json(res, 200, await router.handle(req, res, body));
    }

    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { allow: 'GET, HEAD' }); return res.end(); }
    let p = decodeURIComponent(url.pathname);
    if (p === '/download' || p === '/download/') p = '/download.html';
    else if (p === '/' || !path.extname(p)) p = '/index.html';
    const file = path.normalize(path.join(WEB, p));
    if (p.includes('\0') || !file.startsWith(WEB + path.sep)) { res.writeHead(404); return res.end('Not found'); }
    const st = await fs.promises.stat(file).catch(error => {
      if (['ENOENT', 'ENOTDIR'].includes(error.code)) return null;
      throw error;
    });
    if (!st?.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const etag = '"' + st.size.toString(36) + '-' + Math.floor(st.mtimeMs).toString(36) + '"';
    const code = ['.html', '.js', '.css', '.webmanifest', '.json'].includes(path.extname(file));
    const head = { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', etag, 'cache-control': code ? 'no-cache' : 'public, max-age=86400' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, head); return res.end(); }
    res.writeHead(200, head);
    if (req.method === 'HEAD') return res.end();
    await pipeline(fs.createReadStream(file), res);
  } catch (e) {
    if (res.destroyed) return;
    if (res.headersSent) return res.destroy();
    if (e instanceof URIError || e.code === 'ERR_INVALID_URL') return json(res, 400, { error: 'Invalid URL.' });
    if (e instanceof router.HttpError) return json(res, e.code, { error: e.message, access_status: e.accessStatus });
    console.error(e);
    json(res, 500, { error: 'The server could not complete the request.' });
  }
});

/* ---------- WebSocket: /ws?token=...&child=... ---------- */
const friendsOf = id => q.all('SELECT a, b FROM friends WHERE a = ? OR b = ?', id, id).map(f => f.a === id ? f.b : f.a);
const pendingCalls = new Map();
const areFriends = (x, y) => !!q.get('SELECT 1 FROM friends WHERE a = ? AND b = ?', Math.min(x, y), Math.max(x, y));
function clearCall(id, other) {
  if (hub.calls.get(id) !== other || hub.calls.get(other) !== id) return false;
  hub.calls.delete(id);
  hub.calls.delete(other);
  q.run('UPDATE calls SET ended = ? WHERE ended IS NULL AND ((a = ? AND b = ?) OR (a = ? AND b = ?))',
    Date.now(), id, other, other, id);
  return true;
}

function disconnectChild(id) {
  const partner = hub.calls.get(id);
  if (partner && clearCall(id, partner)) hub.toChild(partner, { t: 'hangup', from: id });
  pendingCalls.delete(id);
  for (const [target, call] of pendingCalls) {
    if (call.from === id) {
      pendingCalls.delete(target);
      hub.toChild(target, { t: 'hangup', from: id });
    }
  }
}

server.on('upgrade', (req, sock, head) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname !== '/ws') return sock.destroy();
  const cid = url.searchParams.get('child');
  const token = url.searchParams.get('token') || A.tokenOf(req);
  const identity = () => {
    const linked = devices.socketChild(token, cid);
    if (linked) return { user: { id: 'child:' + linked.id }, child: { id: linked.id } };
    const user = router.userFromReq(req);
    if (!user || user.must_change || A.accessStatus(user) !== 'active') return null;
    if (!cid) return { user, child: null };
    if (user.role !== 'parent') return null;
    try { return { user, child: router.childFor(user, cid) }; } catch { return null; }
  };
  const connection = identity();
  if (!connection) return sock.destroy();

  hub.attach(req, sock, {
    ...connection, friendsOf, onDisconnect: disconnectChild,
    onMessage: (socket, message) => {
      const current = identity();
      if (!current) return socket.destroy();
      const id = current.child?.id;
      const to = Number(message?.to);
      if (!id || !Number.isSafeInteger(to) || to === id) return;
      const active = hub.calls.get(id) === to;
      if (message.t === 'hangup') {
        const outgoing = pendingCalls.get(to)?.from === id;
        const incoming = pendingCalls.get(id)?.from === to;
        if (outgoing) pendingCalls.delete(to);
        if (incoming) pendingCalls.delete(id);
        if (clearCall(id, to) || outgoing || incoming) hub.toChild(to, { t: 'hangup', from: id });
        return;
      }
      if (!areFriends(id, to)) return;
      const me = q.get('SELECT name, color, allow_audio, allow_video FROM children WHERE id = ?', id);
      const other = q.get('SELECT name, allow_audio, allow_video FROM children WHERE id = ?', to);
      const allows = media => media === 'video' ? me.allow_video && other.allow_video : me.allow_audio && other.allow_audio;

      if (message.t === 'call') {
        const media = message.media === 'video' ? 'video' : 'audio';
        if (!allows(media)) return hub.send(socket, { t: 'denied', reason: 'A parent has disabled these calls.' });
        if (!hub.isOnline(to)) return hub.send(socket, { t: 'denied', reason: other.name + ' is offline.' });
        const existing = pendingCalls.get(to);
        if (existing?.expires > Date.now() || hub.calls.has(id) || hub.calls.has(to)) {
          return hub.send(socket, { t: 'denied', reason: 'A call is already in progress.' });
        }
        pendingCalls.set(to, { from: id, media, expires: Date.now() + 45_000 });
        return hub.toChild(to, { t: 'ring', from: id, name: me.name, color: me.color, media });
      }
      if (message.t === 'accept' || message.t === 'decline') {
        const call = pendingCalls.get(id);
        if (!call || call.from !== to) return;
        pendingCalls.delete(id);
        if (call.expires <= Date.now() || !hub.isOnline(to) || !allows(call.media) || hub.calls.has(id) || hub.calls.has(to)) {
          return hub.send(socket, { t: 'denied', reason: 'This call is no longer available.' });
        }
        if (message.t === 'decline') return hub.toChild(to, { t: 'declined', from: id });
        q.run('INSERT INTO calls(a, b, media, started) VALUES (?,?,?,?)', to, id, call.media, Date.now());
        hub.calls.set(id, to);
        hub.calls.set(to, id);
        return hub.toChild(to, { t: 'accepted', from: id });
      }
      if (message.t === 'signal' && active) {
        const call = q.get('SELECT media FROM calls WHERE ended IS NULL AND ((a = ? AND b = ?) OR (a = ? AND b = ?)) ORDER BY id DESC LIMIT 1', id, to, to, id);
        if (call && allows(call.media)) hub.toChild(to, { t: 'signal', from: id, data: message.data });
      }
      if (message.t === 'game') hub.toChild(to, { t: 'game', from: id, name: me.name, data: message.data });
    },
  }, head);
});

setInterval(() => {
  for (const [target, call] of pendingCalls) {
    if (call.expires > Date.now()) continue;
    pendingCalls.delete(target);
    hub.toChild(call.from, { t: 'denied', reason: 'No answer.' });
  }
}, 5000).unref();

server.listen(PORT, () => console.log(`[HUGO KID] Server listening at http://localhost:${server.address().port}`));
