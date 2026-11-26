/* HUGO KID - app.js : njia za skrini (router), muda wa michezo, kuanza */

const ADULT_SCREENS = ['parentHome', 'childForm', 'aiSettings', 'aiLog', 'learningMode', 'hwNew', 'hwReview', 'parentResults', 'parentSub', 'friends', 'changePass'];

const HK = {
  screens: {},
  stack: [],
  _cleanup: null,
  _onBack: null,

  root() { return document.getElementById('app'); },

  /* fungua skrini mpya */
  go(name, params = {}, opts = {}) {
    if (opts.reset) this.stack = [];
    else if (opts.replace) this.stack.pop();
    this.stack.push({ name, params });
    this.render();
  },

  render() {
    if (this._cleanup) { try { this._cleanup(); } catch (e) {} this._cleanup = null; }
    this._onBack = null;
    const cur = this.stack[this.stack.length - 1];
    const root = this.root();
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'screen';
    el.dataset.screen = cur.name;
    root.appendChild(el);
    const fn = this.screens[cur.name];
    if (!fn) { el.innerHTML = '<div class="center-col">Skrini haipo: ' + esc(cur.name) + '</div>'; return; }
    const out = fn(el, cur.params || {});
    if (typeof out === 'function') this._cleanup = out;
    const dash = el.classList.contains('dash-screen');
    document.body.classList.toggle('is-dash', dash);
    /* skrini za watu wazima (mzazi, mwalimu, shule): muonekano tulivu wa kazi */
    document.body.classList.toggle('is-adult', dash || ADULT_SCREENS.includes(cur.name));
  },

  /* skrini inaweza kuzuia kitufe cha nyuma */
  setBack(fn) { this._onBack = fn; },

  back() {
    if ($('.overlay')) { $('.overlay').remove(); return true; }
    if (this._onBack) { const r = this._onBack(); if (r !== false) return true; }
    if (this.stack.length > 1) { this.stack.pop(); this.render(); return true; }
    return false;
  },

  /* ondoka kwenye skrini bila kupitia kizuizi cha kitufe cha nyuma */
  leave() { this._onBack = null; return this.back(); },

  onPause() { if (this._pauseHook) this._pauseHook(); },

  /* ---------- muda wa michezo ---------- */
  gameLimit(child) {
    const s = Store.settings();
    const u = Store.usage(child.id);
    return s.gameLimitMin * 60 + (u.bonus || 0) * 60;
  },
  gameLeft(child) {
    const u = Store.usage(child.id);
    return Math.max(0, this.gameLimit(child) - (u.game || 0));
  },
  addGameTime(child, secs) {
    const u = Store.usage(child.id);
    u.game = (u.game || 0) + secs;
    Store.saveUsage(child.id, u);
  },
  addLearnTime(child, secs) {
    const u = Store.usage(child.id);
    u.learn = (u.learn || 0) + secs;
    Store.saveUsage(child.id, u);
  },
  addBonus(childId, minutes) {
    const u = Store.usage(childId);
    u.bonus = (u.bonus || 0) + minutes;
    Store.saveUsage(childId, u);
  },
  isBedtime() {
    const bt = Store.settings().bedtime;
    if (!bt || bt === 'off') return false;
    const [h, m] = bt.split(':').map(Number);
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= h * 60 + m || mins < 5 * 60 + 30;
  },

  /* ---------- kuanza ---------- */
  boot() {
    const nu = Net.user();
    if (nu && (nu.must_change || STAFF.includes(nu.role))) return routeByRole();
    const par = Store.parent();
    if (!par) return this.go('welcome', {}, { reset: true });
    if (!termsAccepted()) return this.go('terms', { mode: 'accept', update: !!par.pinHash }, { reset: true });
    if (!par.pinHash) return this.go('pin', { mode: 'create' }, { reset: true });
    const kids = Store.children();
    if (!kids.length) return this.go('childForm', { first: true }, { reset: true });
    /* watoto wengi: kila mmoja anaingia kwa kugusa jina au avatar yake (bila nenosiri) */
    if (kids.length > 1 || !Store.active()) return this.go('pickChild', {}, { reset: true });
    this.go('home', {}, { reset: true });
  },

  /* rudi kwa mtoto (mwanzo) */
  toChild() {
    const kids = Store.children();
    if (!kids.length) return this.go('childForm', { first: true }, { reset: true });
    if (kids.length > 1) return this.go('pickChild', {}, { reset: true });
    if (!Store.active()) Store.setActive(kids[0].id);
    this.go('home', {}, { reset: true });
  },

  /* fungua eneo la mzazi kwa PIN */
  askParent(next = 'parentHome', params = {}) {
    this.go('pin', { mode: 'verify', next, nextParams: params });
  },
};
