/* HUGO KID - learning.js : Learning Mode (kuficha na kudhibiti programu za simu) */

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

/* Programu ya Android inatuambia: programu imezuiwa au muda wake umeisha */
HK.nativeRoute = (route, app) => {
  const c = Store.active();
  if (!c) return;
  const top = HK.stack[HK.stack.length - 1];
  if (!top || !['home', 'timeUp', 'sleep'].includes(top.name)) HK.go('home', {}, { reset: true });
  setTimeout(() => {
    if (route === 'appTimeUp') {
      speak('Muda wa ' + app + ' umekwisha kwa leo');
      modal(null, { iconName: 'clock', iconColor: 'var(--blue)', title: 'Muda umekwisha', text: `Muda wa ${app} wa leo umekwisha. Twende tukasome au tucheze michezo ya kujifunza!`, buttons: [{ label: 'Sawa' }] });
    } else {
      speak('Programu hii haijaruhusiwa');
      modal(null, { iconName: 'lock', iconColor: 'var(--coral)', title: 'Haijaruhusiwa', text: `${app} haiko kwenye orodha ya mzazi. Muombe mzazi akuruhusu.`, buttons: [{ label: 'Sawa' }] });
    }
  }, 300);
};
HK.onResume = () => { const top = HK.stack[HK.stack.length - 1]; if (top && top.name === 'learningMode') HK.render(); };

/* ---------- Mipangilio ya Learning Mode (mzazi) ---------- */
HK.screens.learningMode = (el) => {
  if (!LM.native()) {
    el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Learning Mode</h1></div>
      <div class="scroll"><div class="card"><p>Learning Mode inafanya kazi ndani ya programu ya HUGO KID iliyowekwa kwenye simu ya Android.</p></div></div>`;
    $('#bk', el).onclick = () => HK.back();
    return;
  }
  const st = LM.state();
  const apps = LM.apps();
  const allowed = Object.assign({}, st.allowed);
  const step = (ok, title, sub, id) => `<div class="item" style="cursor:default">
      <div class="i-ic" style="background:${ok ? 'var(--teal)' : 'var(--line)'};color:${ok ? '#fff' : 'var(--muted)'}">${icon(ok ? 'check' : 'lock', 24)}</div>
      <div class="grow"><div class="i-title" style="font-size:15px">${title}</div><div class="i-sub">${sub}</div></div>
      ${ok ? '' : `<button class="btn small blue" id="${id}">Ruhusu</button>`}</div>`;
  const ready = st.usageAccess && st.overlay;

  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Learning Mode</h1></div>
    <div class="scroll">
      <div class="card" style="background:${st.on ? 'var(--teal)' : '#fff'};color:${st.on ? '#fff' : 'var(--navy)'}">
        <div class="row"><div class="grow"><h3>${st.on ? 'Imewashwa' : 'Imezimwa'}${st.paused ? ' (imesimamishwa kwa muda)' : ''}</h3>
          <p style="color:inherit;opacity:.9">Mtoto ataona HUGO KID na programu ulizoruhusu tu. Programu nyingine zitajifunga.</p></div></div>
        <div style="height:12px"></div>
        <button class="btn block ${st.on ? 'ghost' : ''}" id="toggle" ${!ready && !st.on ? 'disabled' : ''}>${st.on ? 'Zima Learning Mode' : 'Washa Learning Mode'}</button>
        ${st.on ? `<div style="height:10px"></div><button class="btn block ghost small" id="pause">${icon('clock', 18)} Nitumie simu dakika 30</button>` : ''}
      </div>

      <div class="section-title">Hatua za kuweka (mara moja tu)</div>
      ${step(st.usageAccess, '1. Ruhusa ya matumizi', 'Kujua programu inayotumika', 'p1')}
      ${step(st.overlay, '2. Kuonekana juu ya programu', 'Kurudi HUGO KID muda ukiisha', 'p2')}
      ${step(st.home, '3. HUGO KID iwe Home', st.on ? 'Chagua HUGO KID kama Home app' : 'Washa Learning Mode kwanza', 'p3')}
      ${step(st.admin, '4. Zuia kufutwa', 'Mtoto asiweze kufuta HUGO KID', 'p4')}

      <div class="section-title">Programu anazoruhusiwa</div>
      <p class="muted" style="font-weight:700;font-size:13px;margin:0 2px 10px">Gusa programu kuiruhusu, kisha chagua muda wake wa kila siku.</p>
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
      toast('Learning Mode imewashwa');
      setTimeout(() => { HK.render(); if (!LM.state().home) modal(el, { iconName: 'home', title: 'Hatua ya mwisho', text: 'Chagua HUGO KID kama Home app ya simu hii, ili mtoto akibonyeza Home arudi HUGO KID.', buttons: [{ label: 'Fungua mipangilio', onClick: () => HugoNative.openHomeSettings() }, { label: 'Baadaye', cls: 'ghost' }] }); }, 400);
    } else { toast('Learning Mode imezimwa'); setTimeout(() => HK.render(), 300); }
  };
  const pz = $('#pause', el); if (pz) pz.onclick = () => { HugoNative.pauseGuard(30); toast('Ulinzi umesimama kwa dakika 30'); HK.render(); };
  const bind = (id, fn) => { const b = $('#' + id, el); if (b) b.onclick = fn; };
  bind('p1', () => HugoNative.openUsageAccess());
  bind('p2', () => HugoNative.openOverlay());
  bind('p3', () => { if (st.on) HugoNative.openHomeSettings(); else toast('Washa Learning Mode kwanza'); });
  bind('p4', () => HugoNative.requestAdmin());
  $$('#apps .item', el).forEach(row => {
    const pkg = row.dataset.pkg;
    $('[data-tog]', row).onclick = () => { if (pkg in allowed) delete allowed[pkg]; else allowed[pkg] = 30; save(); HK.render(); };
    $$('[data-min]', row).forEach(b => b.onclick = () => { allowed[pkg] = +b.dataset.min; save(); HK.render(); });
  });
};

/* ---------- Programu za mtoto kwenye home (Learning Mode ikiwa imewashwa) ---------- */
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
    if (r === 'limit') { speak('Muda wa programu hii umekwisha leo'); toast('Muda wa programu hii umekwisha leo'); }
    else if (r === 'no') toast('Programu haijaruhusiwa');
  });
}
