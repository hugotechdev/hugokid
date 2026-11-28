

const HK_SERVER_DEFAULT = 'https://kid.hugotech.co.tz/';
const IS_WEB = /^https?:$/.test(location.protocol) && location.hostname !== 'appassets.androidplatform.net';

const Net = {
  base() {
    if (IS_WEB) return location.origin;
    return HK_SERVER_DEFAULT.replace(/\/$/, '');
  },
  acct() { return Store.get('acct', null); },
  user() { const a = this.acct(); return a ? a.user : null; },
  token() { const a = this.acct(); return a ? a.token : null; },
  role() { const u = this.user(); return u ? u.role : null; },
  online() { return !!this.token(); },
  setAcct(a) { Store.set('acct', a); },
  logout() {
    if (this.token()) this.post('/api/logout').catch(() => {});
    this.clearSession();
  },
  clearSession() {
    this.setAcct(null);
    this.closeWs();
  },
  accessScreen() {
    const account = this.acct();
    if (!account?.token || !account.user) return 'welcome';
    if (account.user.must_change) return 'changePass';
    if (account.user.registration_pending && account.user.access_status === 'pending') return 'registration';
    if (['pending', 'blocked'].includes(account.user.access_status)) return 'accountAccess';
    if (account.verified !== true || account.user.access_status !== 'active') return 'accessCheck';
    return null;
  },
  acceptSession(token, user) {
    const prior = this.acct()?.user;
    const owner = prior?.role === 'parent' ? prior.id : user.role === 'parent' ? user.id : null;
    if (owner && !Store.get('profileOwner', null)) Store.set('profileOwner', owner);
    this.setAcct({ token, user, verified: user.access_status === 'active' });
  },
  applyAccess(token, user) {
    if (this.token() !== token) return;
    const prior = this.acct();
    this.acceptSession(token, user);
    const screen = HK.stack[HK.stack.length - 1]?.name;
    const gate = this.accessScreen();
    if (gate) this.closeWs();
    if (HK.startingAccess || !screen) return;
    if (gate && !HK.allowsAccess(screen, HK.stack[HK.stack.length - 1].params)) return routeByRole();
    if (screen === 'accountAccess' && (!gate || prior.user.access_status !== user.access_status)) routeByRole();
    if (screen === 'accessCheck' && gate !== 'accessCheck') routeByRole();
  },
  refreshAccess() {
    const token = this.token();
    if (!token) return Promise.resolve();
    if (this.accessRequest?.token === token) return this.accessRequest.promise;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const request = { token };
    request.promise = this.api('GET', '/api/me', undefined, controller.signal)
      .then(({ user }) => this.applyAccess(token, user))
      .finally(() => {
        clearTimeout(timeout);
        if (this.accessRequest === request) this.accessRequest = null;
      });
    this.accessRequest = request;
    return request.promise;
  },

  async api(method, path, body, signal) {
    const publicAuth = ['/api/login', '/api/register', '/api/password/forgot', '/api/password/reset'].includes(path);
    const token = publicAuth ? null : this.token();
    let r;
    try {
      r = await fetch(this.base() + path, {
        method,
        headers: { 'content-type': 'application/json', ...(token ? { authorization: 'Bearer ' + token } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: signal || (AbortSignal.timeout ? AbortSignal.timeout(25_000) : undefined),
        cache: 'no-store',
      });
    } catch (e) { throw new Error("No internet or the server is unavailable"); }
    const j = await r.json().catch(() => null);
    if (j === null) throw new Error('The HUGO KID server is unavailable.');
    if (token && this.token() === token) {
      if (r.status === 401) {
        this.clearSession();
        if (path !== '/api/logout' && !HK.startingAccess) HK.go('welcome', {}, { reset: true });
      }
      if (r.status === 403 && j.access_status) this.applyAccess(token, { ...this.user(), access_status: j.access_status });
    }
    if (!r.ok) throw new Error(j.error || ('Request failed: ' + r.status));
    return j;
  },
  get(p) { return this.api('GET', p); },
  post(p, b) { return this.api('POST', p, b || {}); },
  put(p, b) { return this.api('PUT', p, b || {}); },
  del(p) { return this.api('DELETE', p); },

  async upload(blob, label = '', childId) {
    const qs = new URLSearchParams({ label }); if (childId) qs.set('child_id', childId);
    const ext = label.split('.').pop().toLowerCase();
    const documents = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    const type = !blob.type || blob.type === 'application/octet-stream' ? documents[ext] || 'application/octet-stream' : blob.type;
    const r = await fetch(this.base() + '/api/upload?' + qs, { method: 'POST', headers: { authorization: 'Bearer ' + this.token(), 'content-type': type }, body: blob });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Kupakia kumeshindikana');
    return j;
  },
  fileUrl(name) { return this.base() + '/api/files/' + encodeURIComponent(name) + '?token=' + encodeURIComponent(this.token() || ''); },
  openExternal(url) {
    if (window.HugoNative && HugoNative.openUrl) HugoNative.openUrl(url); else window.open(url, '_blank', 'noopener,noreferrer');
  },

  /* ----- WebSocket ----- */
  ws: null, wsChild: null, handlers: new Set(), _retry: null,
  connect(childId) {
    if (!this.online() || this.accessScreen()) return;
    if (this.ws && this.wsChild === (childId || null) && this.ws.readyState <= 1) return;
    this.closeWs();
    this.wsChild = childId || null;
    const u = this.base().replace(/^http/, 'ws') + '/ws?token=' + encodeURIComponent(this.token()) + (childId ? '&child=' + childId : '');
    let ws;
    try { ws = new WebSocket(u); } catch (e) { return; }
    this.ws = ws;
    ws.onmessage = e => { let m; try { m = JSON.parse(e.data); } catch (x) { return; } if (m.t === 'customer_notice') document.getElementById('customer-notices')?.dispatchEvent(new Event('customer-notice')); this.handlers.forEach(h => { try { h(m); } catch (x) {} }); };
    ws.onclose = () => {
      if (this.ws !== ws) return;
      this.ws = null;
      if (ws.readyState === 3 && navigator.onLine !== false) {
        this.refreshAccess().catch(() => {});
      }
      this._retry = setTimeout(() => this.connect(this.wsChild), 5000);
    };
  },
  closeWs() { clearTimeout(this._retry); const w = this.ws; this.ws = null; if (w) try { w.close(); } catch (e) {} },
  send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); },
  on(fn) { this.handlers.add(fn); return () => this.handlers.delete(fn); },
};

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

function checkConnectedAccess() {
  if (!document.hidden && navigator.onLine !== false) Net.refreshAccess().catch(() => {});
}
window.addEventListener('online', checkConnectedAccess);
window.addEventListener('focus', checkConnectedAccess);
window.addEventListener('storage', event => {
  if (event.key !== 'hk_acct' || HK.startingAccess) return;
  let previous;
  try { previous = JSON.parse(event.oldValue); } catch {}
  if (previous?.token !== Net.token() || previous?.user?.access_status !== Net.user()?.access_status || previous?.user?.must_change !== Net.user()?.must_change) {
    Net.closeWs();
    routeByRole();
  }
});
document.addEventListener('visibilitychange', checkConnectedAccess);
setInterval(checkConnectedAccess, 30_000);
