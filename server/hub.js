
const crypto = require('crypto');

const users = new Map();    // userId -> Set(socket)
const kids = new Map();     // childId -> Set(socket)
const calls = new Map();    // childId -> partner childId

function send(sock, obj) {
  if (sock.destroyed) return;
  const data = Buffer.from(JSON.stringify(obj));
  let head;
  if (data.length < 126) head = Buffer.from([0x81, data.length]);
  else if (data.length < 65536) { head = Buffer.alloc(4); head[0] = 0x81; head[1] = 126; head.writeUInt16BE(data.length, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x81; head[1] = 127; head.writeBigUInt64BE(BigInt(data.length), 2); }
  sock.write(Buffer.concat([head, data]));
}
const addTo = (map, k, s) => { if (!map.has(k)) map.set(k, new Set()); map.get(k).add(s); };
const delFrom = (map, k, s) => { const set = map.get(k); if (set) { set.delete(s); if (!set.size) map.delete(k); } };

function toUser(id, obj) { (users.get(id) || []).forEach(s => send(s, obj)); }
function toChild(id, obj) { (kids.get(id) || []).forEach(s => send(s, obj)); }
function isOnline(childId) { return kids.has(childId); }

/* ombi la kuunganisha (upgrade) */
function attach(req, sock, ctx, head) {
  const key = req.headers['sec-websocket-key'];
  if (!key || req.headers['sec-websocket-version'] !== '13') return sock.destroy();
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  sock.setNoDelay(true);
  const { user, child, onMessage, friendsOf } = ctx;
  addTo(users, user.id, sock);
  if (child) {
    addTo(kids, child.id, sock);
    friendsOf(child.id).forEach(fid => toChild(fid, { t: 'presence', id: child.id, on: true }));
  }
  let buf = Buffer.alloc(0);
  const receive = chunk => {
    if (buf.length + chunk.length > 2_000_014) return sock.destroy();
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 0x0f; let len = buf[1] & 0x7f; let off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      const masked = buf[1] & 0x80; const mOff = off; if (masked) off += 4;
      if (!masked || len > 2e6 || !(buf[0] & 0x80) || (buf[0] & 0x70) || (op >= 8 && len > 125)) return sock.destroy();
      if (buf.length < off + len) return;
      let payload = buf.subarray(off, off + len);
      if (masked) { const m = buf.subarray(mOff, mOff + 4); payload = Buffer.from(payload.map((b, i) => b ^ m[i % 4])); }
      buf = buf.subarray(off + len);
      if (op === 0x8) { sock.end(Buffer.from([0x88, 0])); return; }
      if (op === 0x9) { sock.write(Buffer.concat([Buffer.from([0x8a, payload.length]), payload])); continue; }
      if (op === 0x1) { try { onMessage(sock, JSON.parse(payload.toString())); } catch (e) {} }
    }
  };
  sock.on('data', receive);
  let disconnected = false;
  const bye = () => {
    if (disconnected) return;
    disconnected = true;
    delFrom(users, user.id, sock);
    if (child) {
      delFrom(kids, child.id, sock);
      if (!kids.has(child.id)) {
        friendsOf(child.id).forEach(fid => toChild(fid, { t: 'presence', id: child.id, on: false }));
        ctx.onDisconnect(child.id);
      }
    }
  };
  sock.on('close', bye); sock.on('error', bye); sock.on('end', bye);
  send(sock, { t: 'hello' });
  if (head?.length) receive(head);
}

const closeUser = id => (users.get(id) || []).forEach(socket => socket.destroy());
module.exports = { attach, send, toUser, toChild, isOnline, calls, closeUser };
