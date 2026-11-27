

const LM = {
  native() { return !!(window.HugoNative && HugoNative.lmState); },
  state() {
    if (!this.native()) return { on: false, allowed: {}, usage: {} };
    try { return JSON.parse(HugoNative.lmState()); } catch (e) { return { on: false, allowed: {}, usage: {} }; }
  },
  apps() {
    if (!this.native()) return [];
    if (this._apps) return this._apps;
    try { this._apps = JSON.parse(HugoNative.listApps()); } catch (e) { this._apps = []; }
    return this._apps;
  },
};

HK.nativeRoute = (route, app) => {
  if (Net.accessScreen() || HK.startingAccess) return;
  const c = Store.active();
  if (!c) return;
  const top = HK.stack[HK.stack.length - 1];
  if (!top || !['home', 'timeUp', 'sleep'].includes(top.name)) HK.go('home', {}, { reset: true });
  setTimeout(() => {
    if (Net.accessScreen() || HK.startingAccess) return;
    if (route === 'appTimeUp') {
      speak('Muda wa ' + app + ' umekwisha kwa leo');
      modal(null, { iconName: 'clock', iconColor: 'var(--blue)', title: "Time's up", text: `Muda wa ${app} wa leo umekwisha. Twende tukasome au tucheze michezo ya kujifunza!`, buttons: [{ label: 'Sawa' }] });
    } else {
      speak("This app is not allowed");
      modal(null, { iconName: 'lock', iconColor: 'var(--coral)', title: 'Haijaruhusiwa', text: `${app} haiko kwenye orodha ya mzazi. Muombe mzazi akuruhusu.`, buttons: [{ label: 'Sawa' }] });
    }
  }, 300);
};
HK.onResume = () => {
  checkConnectedAccess();
  if (HK.stack.at(-1)?.name === 'learningMode') HK.render();
};

HK.screens.learningMode = (el) => {
  if (!LM.native()) {
    el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Learning Mode</h1></div>
      <div class="scroll"><div class="card"><p>Learning Mode works inside the HUGO KID app installed on an Android phone.</p></div></div>`;
    $('#bk', el).onclick = () => HK.back();
    return;
  }
  const st = LM.state();
  const apps = LM.apps();
  const allowed = Object.assign({}, st.allowed);
  const step = (ok, title, sub, id) => `<div class="item" style="cursor:default">
      <div class="i-ic" style="background:${ok ? 'var(--teal)' : 'var(--line)'};color:${ok ? '#fff' : 'var(--muted)'}">${icon(ok ? 'check' : 'lock', 24)}</div>
      <div class="grow"><div class="i-title" style="font-size:15px">${title}</div><div class="i-sub">${sub}</div></div>
      ${ok ? '<span class="chip-tag teal">✓ Allowed</span>' : id === 'p3' && !st.on ? '<span class="chip-tag">Set up later</span>' : `<button class="btn small blue" id="${id}">Ruhusu</button>`}</div>`;
  const ready = st.usageAccess && st.overlay;

  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Learning Mode</h1></div>
    <div class="scroll">
      <div class="card" style="background:${st.on ? 'var(--teal)' : '#fff'};color:${st.on ? '#fff' : 'var(--navy)'}">
        <div class="row"><div class="grow"><h3>${st.on ? 'Imewashwa' : 'Imezimwa'}${st.paused ? ' (imesimamishwa kwa muda)' : ''}</h3>
          <p style="color:inherit;opacity:.9">The child will see only HUGO KID and the apps you allowed. Other apps will close.</p></div></div>
        <div style="height:12px"></div>
        ${!st.on && !ready ? '<p>Allow usage access and display over other apps below, then return here to turn on Learning Mode.</p>' : ''}
        <button class="btn block ${st.on ? 'ghost' : ''}" id="toggle" ${!ready && !st.on ? 'disabled' : ''}>${st.on ? 'Zima Learning Mode' : 'Washa Learning Mode'}</button>
        ${st.on ? `<div style="height:10px"></div><button class="btn block ghost small" id="pause">${icon('clock', 18)} Nitumie simu dakika 30</button>` : ''}
      </div>

      <div class="section-title">Setup steps (one time only)</div>
      ${step(st.usageAccess, "1. Usage access permission", 'Kujua programu inayotumika', 'p1')}
      ${step(st.overlay, "2. Display over other apps", "Return to HUGO KID when time runs out", 'p2')}
      ${step(st.home, '3. HUGO KID iwe Home', st.on ? "Choose HUGO KID as the Home app" : "Turn on Learning Mode first", 'p3')}
      ${step(st.admin, '4. Zuia kufutwa', "Child can't uninstall HUGO KID", 'p4')}

      <div class="section-title">Programu anazoruhusiwa</div>
      <p class="muted" style="font-weight:700;font-size:13px;margin:0 2px 10px">Tap an app to allow it, then choose its daily time.</p>
      <div id="apps">${apps.map(a => {
        const on = a.pkg in allowed, used = Math.round((st.usage[a.pkg] || 0) / 60);
        return `<div class="item" data-pkg="${esc(a.pkg)}" style="flex-wrap:wrap">
          ${a.icon ? `<img src="${a.icon}" style="width:44px;height:44px;border-radius:12px">` : `<div class="i-ic" style="background:var(--line)"></div>`}
          <div class="grow"><div class="i-title" style="font-size:15px">${esc(a.name)}</div><div class="i-sub">${on ? 'Leo: ' + used + ' dk' : 'Imefichwa'}</div></div>
          <span class="chip ${on ? 'on' : ''}" data-tog="1">${on ? 'Imeruhusiwa' : 'Ruhusu'}</span>
          ${on ? `<div class="chips" style="width:100%;margin-top:10px">${[0, 15, 30, 60, 120].map(m => `<button class="chip ${allowed[a.pkg] === m ? 'on' : ''}" data-min="${m}" style="padding:7px 12px;font-size:13px">${m ? m + ' dk' : 'Bila kikomo'}</button>`).join('')}</div>` : ''}
        </div>`;
      }).join('') || '<p class="muted">Hakuna programu zilizopatikana.</p>'}</div>
    </div>`;

  $('#bk', el).onclick = () => HK.back();
  const save = () => { HugoNative.setAllowed(JSON.stringify(allowed)); };
  $('#toggle', el).onclick = () => {
    const on = !st.on;
    HugoNative.setLearningMode(on);
    if (on) {
      toast("Learning Mode is on");
      setTimeout(() => { HK.render(); if (!LM.state().home) modal(el, { iconName: 'home', title: "Last step", text: "Choose HUGO KID as this phone's Home app, so when the child presses Home they return to HUGO KID.", buttons: [{ label: "Open settings", onClick: () => HugoNative.openHomeSettings() }, { label: 'Baadaye', cls: 'ghost' }] }); }, 400);
    } else { toast("Learning Mode is off"); setTimeout(() => HK.render(), 300); }
  };
  const pz = $('#pause', el); if (pz) pz.onclick = () => { HugoNative.pauseGuard(30); toast("Protection paused for 30 minutes"); HK.render(); };
  const bind = (id, fn) => { const b = $('#' + id, el); if (b) b.onclick = fn; };
  bind('p1', () => HugoNative.openUsageAccess());
  bind('p2', () => HugoNative.openOverlay());
  bind('p3', () => { if (st.on) HugoNative.openHomeSettings(); else toast("Turn on Learning Mode first"); });
  bind('p4', () => HugoNative.requestAdmin());
  $$('#apps .item', el).forEach(row => {
    const pkg = row.dataset.pkg;
    $('[data-tog]', row).onclick = () => { if (pkg in allowed) delete allowed[pkg]; else allowed[pkg] = 30; save(); HK.render(); };
    $$('[data-min]', row).forEach(b => b.onclick = () => { allowed[pkg] = +b.dataset.min; save(); HK.render(); });
  });
};

function childAppsStrip() {
  if (!LM.native()) return '';
  const st = LM.state();
  const pk = Object.keys(st.allowed || {});
  if (!st.on || !pk.length) return '';
  const apps = LM.apps().filter(a => pk.includes(a.pkg));
  return `<div class="section-title">Programu zangu</div>
    <div class="games">${apps.map(a => {
      const lim = st.allowed[a.pkg], used = (st.usage[a.pkg] || 0) / 60;
      const left = lim ? Math.max(0, Math.ceil(lim - used)) : null;
      return `<button class="game-card" data-app="${esc(a.pkg)}"><img src="${a.icon}" style="width:56px;height:56px;border-radius:16px">
        <div class="g-name">${esc(a.name)}</div>${left == null ? '' : `<span class="chip-tag ${left ? 'blue' : 'coral'}">${left} dk</span>`}</button>`;
    }).join('')}</div>`;
}
function bindChildApps(el) {
  $$('[data-app]', el).forEach(b => b.onclick = () => {
    const r = HugoNative.launchApp(b.dataset.app);
    if (r === 'limit') { speak("This app's time is over for today"); toast("This app's time is over for today"); }
    else if (r === 'no') toast("App not allowed");
  });
}
