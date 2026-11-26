/* HUGO KID - net.js : mawasiliano na server (akaunti, API, faili, WebSocket) */

/* Anwani ya server. Kwenye web app ni ileile; kwenye APK weka anwani ya Railway hapa. */
const HK_SERVER_DEFAULT = 'https://hugo-kid.up.railway.app';
const IS_WEB = /^https?:$/.test(location.protocol) && location.hostname !== 'appassets.androidplatform.net';

const Net = {
  base() {
    const custom = Store.get('server', '');
    if (custom) return custom.replace(/\/+$/, '');
    if (IS_WEB) return location.origin;
    return HK_SERVER_DEFAULT;
  },
  acct() { return Store.get('acct', null); },
  user() { const a = this.acct(); return a ? a.user : null; },
  token() { const a = this.acct(); return a ? a.token : null; },
  role() { const u = this.user(); return u ? u.role : null; },
  online() { return !!this.token(); },
  setAcct(a) { Store.set('acct', a); },
  logout() { const t = this.token(); if (t) this.api('POST', '/api/logout').catch(() => {}); Store.set('acct', null); this.closeWs(); },

  async api(method, path, body) {
    let r;
    try {
      r = await fetch(this.base() + path, {
        method,
        headers: { 'content-type': 'application/json', ...(this.token() ? { authorization: 'Bearer ' + this.token() } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e) { throw new Error('Hakuna mtandao au server haipatikani'); }
    const j = await r.json().catch(() => ({}));
    if (r.status === 401 && this.token()) { Store.set('acct', null); }
    if (!r.ok) throw new Error(j.error || ('Hitilafu ' + r.status));
    return j;
  },
  get(p) { return this.api('GET', p); },
  post(p, b) { return this.api('POST', p, b || {}); },
  put(p, b) { return this.api('PUT', p, b || {}); },
  del(p) { return this.api('DELETE', p); },

  async upload(blob, label = '', childId) {
    const qs = new URLSearchParams({ label }); if (childId) qs.set('child_id', childId);
    const r = await fetch(this.base() + '/api/upload?' + qs, { method: 'POST', headers: { authorization: 'Bearer ' + this.token(), 'content-type': blob.type || 'application/octet-stream' }, body: blob });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Kupakia kumeshindikana');
    return j;
  },
  fileUrl(name) { return this.base() + '/api/files/' + encodeURIComponent(name) + '?token=' + encodeURIComponent(this.token() || ''); },
  openExternal(url) {
    if (window.HugoNative && HugoNative.openUrl) HugoNative.openUrl(url); else window.open(url, '_blank');
  },

  /* ----- WebSocket ----- */
  ws: null, wsChild: null, handlers: new Set(), _retry: null,
  connect(childId) {
    if (!this.online()) return;
    if (this.ws && this.wsChild === (childId || null) && this.ws.readyState <= 1) return;
    this.closeWs();
    this.wsChild = childId || null;
    const u = this.base().replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(this.token()) + (childId ? '&child=' + childId : '');
    let ws;
    try { ws = new WebSocket(u); } catch (e) { return; }
    this.ws = ws;
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } this.handlers.forEach(h => { try { h(m); } catch (x) {} }); };
    ws.onclose = () => { if (this.ws === ws) { this.ws = null; clearTimeout(this._retry); this._retry = setTimeout(() => this.connect(this.wsChild), 5000); } };
  },
  closeWs() { clearTimeout(this._retry); const w = this.ws; this.ws = null; if (w) try { w.close(); } catch (e) {} },
  send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); },
  on(fn) { this.handlers.add(fn); return () => this.handlers.delete(fn); },
};

/* Taarifa za papo hapo kwa wote */
Net.on(m => {
  if (m.t === 'announcement') toast('Tangazo jipya: ' + m.title);
  if (m.t === 'message') toast('Ujumbe mpya kutoka kwa ' + m.from);
  if (m.t === 'refresh' && m.what === 'homework' && Store.active()) SchoolSync.pull(Store.active()).catch(() => {});
});

/* Data URL -> Blob */
function dataToBlob(d) {
  const [h, b] = d.split(',');
  const mime = (h.match(/data:([^;]+)/) || [])[1] || 'application/octet-stream';
  const bin = atob(b); const a = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
  return new Blob([a], { type: mime });
}
