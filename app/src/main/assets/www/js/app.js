

const ADULT_SCREENS = ['registration', 'parentHome', 'childForm', 'aiSettings', 'aiLog', 'learningMode', 'hwNew', 'hwReview', 'parentResults', 'parentSub', 'friends', 'changePass', 'forgotPassword', 'resetPassword', 'accountAccess', 'accessCheck', 'billing'];

const HK = window.HK = {
  screens: {},
  stack: [],
  _cleanup: null,
  _onBack: null,

  root() { return document.getElementById('app'); },

  go(name, params = {}, opts = {}) {
    if (opts.reset) this.stack = [];
    else if (opts.replace) this.stack.pop();
    this.stack.push({ name, params });
    this.render();
  },

  render() {
    if (this._cleanup) { try { this._cleanup(); } catch (e) {} this._cleanup = null; }
    this._onBack = null;
    let cur = this.stack[this.stack.length - 1];
    if (!cur) return;
    if (Net.role() === 'child' && !Net.accessScreen() && (ADULT_SCREENS.includes(cur.name) || ['pin','pickChild','devices'].includes(cur.name))) {
      cur = { name: 'home', params: {} }; this.stack = [cur];
    }
    if (cur && !this.allowsAccess(cur.name, cur.params)) {
      const name = this.startingAccess ? 'accessCheck' : Net.accessScreen();
      cur = { name, params: name === 'changePass' ? { forced: true } : {} };
      this.stack = [cur];
    }
    const root = this.root();
    root.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'screen';
    el.dataset.screen = cur.name;
    root.appendChild(el);
    const fn = this.screens[cur.name];
    if (!fn) { el.innerHTML = '<div class="center-col">Screen not found: ' + esc(cur.name) + '</div>'; return; }
    const out = fn(el, cur.params || {});
    if (el.parentNode !== root) return;
    if (typeof out === 'function') this._cleanup = out;
    const dash = el.classList.contains('dash-screen');
    document.body.classList.toggle('is-dash', dash);

    document.body.classList.toggle('is-adult', dash || ADULT_SCREENS.includes(cur.name));
  },

  allowsAccess(name, params) {
    if (['welcome', 'acctAuth', 'forgotPassword', 'resetPassword', 'accessCheck', 'deviceLink'].includes(name)) return true;
    if (name === 'terms' && params?.mode === 'view') return true;
    const gate = Net.accessScreen();
    if (name === 'accountAccess' || name === 'registration') return gate === name;
    if (name === 'changePass' || name === 'billing') return !!Net.token();
    return !gate && !this.startingAccess;
  },

  setBack(fn) { this._onBack = fn; },

  back() {
    const overlays = $$('.overlay');
    const overlay = overlays[overlays.length - 1];
    if (overlay) {
      if (overlay.onGameBack) overlay.onGameBack();
      else overlay.remove();
      return true;
    }
    if (this._onBack) { const r = this._onBack(); if (r !== false) return true; }
    if (this.stack.length > 1) { this.stack.pop(); this.render(); return true; }
    return false;
  },

  leave() { this._onBack = null; return this.back(); },

  onPause() { if (this._pauseHook) this._pauseHook(); },

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
    if (Date.now() < Math.max(Store.get('night_' + Store.activeId(), 0), Net.role() === 'child' ? Store.get('remoteUntil',0) : 0)) return false;
    const bt = Store.settings().bedtime;
    if (!bt || bt === 'off') return false;
    const [h, m] = bt.split(':').map(Number);
    const now = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    return mins >= h * 60 + m || mins < 5 * 60 + 30;
  },

  async boot() {
    if (!this.didBoot) {
      this.didBoot = true;
      const reset = /^#reset-password=([a-f0-9]{64})$/.exec(location.hash);
      if (IS_WEB && reset) {
        history.replaceState(null, '', location.pathname + location.search);
        return this.go('resetPassword', { token: reset[1] }, { reset: true });
      }
      if (Net.token() && navigator.onLine !== false) {
        this.startingAccess = true;
        this.go('accessCheck', {}, { reset: true });
        try { await Net.refreshAccess(); } catch {}
        finally { this.startingAccess = false; }
      }
    }
    if (!this.startingAccess) routeByRole();
  },

  startParent() {
    const par = Store.parent() || { created: Date.now(), settings: {}, terms: { v: TERMS_VERSION, at: Date.now() } };
    if (!Store.parent()) Store.saveParent(par);
    if (!termsAccepted()) return this.go('terms', { mode: 'accept', update: !!par.pinHash }, { reset: true });
    if (!par.pinHash || (this.parentEntryToken && this.parentEntryToken === Net.token())) {
      this.parentEntryToken = null;
      this.go('parentHome', {}, { reset: true });
      const entry = this.stack[this.stack.length - 1];
      const token = Net.token();
      SchoolSync.pullChildren().then(added => {
        if (added && Net.token() === token && entry === this.stack[this.stack.length - 1]) this.render();
      }).catch(() => {});
      return;
    }
    const kids = Store.children();
    if (!kids.length) return this.go('childForm', { first: true }, { reset: true });

    if (kids.length > 1 || !Store.active()) return this.go('pickChild', {}, { reset: true });
    this.go('home', {}, { reset: true });
  },

  toChild() {
    if (Net.role() === 'parent' && !Store.parent()?.pinHash) {
      return this.go('pin', { mode: 'create', forChildMode: true });
    }
    const kids = Store.children();
    if (!kids.length) return this.go('childForm', { first: true }, { reset: true });
    if (kids.length > 1) return this.go('pickChild', {}, { reset: true });
    if (!Store.active()) Store.setActive(kids[0].id);
    this.go('home', {}, { reset: true });
  },

  askParent(next = 'parentHome', params = {}) {
    if (Net.role() === 'child') return toast('Open the parent account on the parent phone.');
    if (!Store.parent()?.pinHash) return this.go('acctAuth', { kind: 'parent' });
    this.go('pin', { mode: 'verify', next, nextParams: params });
  },
};
