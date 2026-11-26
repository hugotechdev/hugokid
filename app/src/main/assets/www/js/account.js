

const STAFF = ['school_admin', 'teacher', 'superadmin'];

function routeByRole() {
  const u = Net.user();
  if (u && u.must_change) return HK.go('changePass', { forced: true }, { reset: true });
  if (u && u.role === 'superadmin') return HK.go('superHome', {}, { reset: true });
  if (u && STAFF.includes(u.role)) return HK.go('schoolHome', {}, { reset: true });
  HK.boot();
}

HK.screens.welcome = (el) => {
  el.classList.add('welcome');
  el.innerHTML = `<div class="center-col">
    <div class="hk-logo" aria-label="HUGO KID">
      <div class="mark"><img class="book" src="img/logo-book.png" alt=""><img class="star" src="img/logo-star.png" alt=""></div>
      <img class="word" src="img/logo-word.png" alt="HUGO KID - Learn, Play, Grow">
    </div>
    <div class="actions">
      <button class="btn block blue" id="parent">I'm a parent</button>
      <button class="btn block navy" id="school">School or teacher</button>
      <button class="link-btn" id="login">Una akaunti? <b>Ingia</b></button>
    </div>
  </div>`;
  $('#parent', el).onclick = () => { Sfx.tap(); HK.go('terms', { mode: 'accept' }); };
  $('#school', el).onclick = () => { Sfx.tap(); HK.go('acctAuth', { kind: 'school', tab: 'register' }); };
  $('#login', el).onclick = () => { Sfx.tap(); HK.go('acctAuth', { kind: 'any', tab: 'login' }); };
};

HK.screens.acctAuth = (el, p) => {
  let tab = p.tab || 'login';
  let kind = p.kind === 'school' ? 'school' : p.kind === 'parent' ? 'parent' : 'any';
  let schoolType = 'school';
  const levels = ['Awali - Baby Class', 'Awali - Middle Class', 'Awali - Pre-Unit', 'Darasa la 1', 'Darasa la 2', 'Darasa la 3', 'Darasa la 4', 'Darasa la 5', 'Darasa la 6', 'Darasa la 7'];
  const picked = new Set(levels);
  const draw = () => {
    el.innerHTML = `
      <div class="topbar">${p.skip ? '' : `<button class="icon-btn" id="bk">${icon('back')}</button>`}<h1>${kind === 'school' ? 'Shule na walimu' : kind === 'parent' ? 'Akaunti ya mzazi' : 'Ingia'}</h1>
        ${p.skip ? `<button class="btn small ghost" id="skip">Baadaye</button>` : ''}</div>
      ${p.skip ? `<div class="card" style="margin:0 16px 12px;max-width:600px;align-self:center"><p>An online account connects your child with their school and teacher, and keeps a backup of their progress. You can open it later in Settings.</p></div>` : ''}
      <div class="scroll" style="max-width:600px;margin:0 auto;width:100%">
        <div class="seg" style="margin:4px 0 14px"><button data-t="login" class="${tab === 'login' ? 'on' : ''}">Ingia</button><button data-t="register" class="${tab === 'register' ? 'on' : ''}">Jisajili</button></div>
        ${tab === 'login' ? `
          <label class="label">Phone or email</label><input class="field" id="login" autocomplete="username" placeholder="07xx xxx xxx">
          <label class="label">Nenosiri</label><input class="field" id="pass" type="password" autocomplete="current-password">
          <div style="height:18px"></div><button class="btn block" id="go">${icon('key', 20)} Ingia</button>
          <p class="muted" style="font-size:13px;margin-top:14px">Teachers get a temporary password from the head teacher.</p>`
        : `
          ${kind === 'any' ? `<label class="label">You are registering as</label><div class="chips" id="kind"><button class="chip on" data-k="parent">Parent</button><button class="chip" data-k="school">School / Teacher</button></div>` : ''}
          ${kind === 'school' ? `
            <label class="label">Aina</label>
            <div class="chips" id="stype"><button class="chip ${schoolType === 'school' ? 'on' : ''}" data-s="school">Shule</button><button class="chip ${schoolType === 'tutor' ? 'on' : ''}" data-s="tutor">Private tutor / Tuition</button></div>
            ${schoolType === 'school' ? `<label class="label">Jina la shule</label><input class="field" id="sname" placeholder="Mfano: Shule ya Msingi Upendo">` : ''}
            <div class="row" style="gap:10px"><div class="grow"><label class="label">Mkoa</label><input class="field" id="region" placeholder="Dar es Salaam"></div><div class="grow"><label class="label">Wilaya</label><input class="field" id="district" placeholder="Kinondoni"></div></div>
            <label class="label">Madarasa mnayofundisha</label>
            <div class="chips" id="lv">${levels.map(l => `<button class="chip ${picked.has(l) ? 'on' : ''}" data-l="${esc(l)}" style="padding:8px 12px;font-size:13px">${esc(l.replace('Awali - ', ''))}</button>`).join('')}</div>` : ''}
          <label class="label">${kind === 'school' && schoolType === 'school' ? 'Jina la mkuu wa shule / msimamizi' : 'Jina lako kamili'}</label><input class="field" id="name">
          <label class="label">Phone number</label><input class="field" id="phone" inputmode="tel" placeholder="07xx xxx xxx">
          <label class="label">Barua pepe (si lazima)</label><input class="field" id="email" type="email">
          <label class="label">Nenosiri (herufi 6+)</label><input class="field" id="pass" type="password" autocomplete="new-password">
          <label class="card row" style="cursor:pointer;gap:12px;align-items:flex-start;margin-top:16px">
            <input type="checkbox" id="ok" style="width:22px;height:22px;flex:none;accent-color:var(--teal)">
            <span style="font-weight:600;font-size:13px">Nimesoma na ninakubali <a href="#" id="tlink" style="color:var(--blue)">Terms and Privacy Policy</a>.</span></label>
          <button class="btn block" id="go">${icon('check', 20)} Jisajili</button>`}

      </div>`;
    const bk = $('#bk', el); if (bk) bk.onclick = () => HK.back();
    const sk = $('#skip', el); if (sk) sk.onclick = () => HK.go(p.next || 'childForm', p.nextParams || { first: true }, { reset: true });
    $$('.seg button', el).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $$('#kind .chip', el).forEach(b => b.onclick = () => { kind = b.dataset.k; draw(); tab = 'register'; });
    $$('#stype .chip', el).forEach(b => b.onclick = () => { schoolType = b.dataset.s; draw(); });
    $$('#lv .chip', el).forEach(b => b.onclick = () => { const l = b.dataset.l; picked.has(l) ? picked.delete(l) : picked.add(l); b.classList.toggle('on'); });
    const tl = $('#tlink', el); if (tl) tl.onclick = e => { e.preventDefault(); HK.go('terms', { mode: 'view' }); };
    $('#go', el).onclick = submit;
  };
  const submit = async () => {
    const b = $('#go', el); b.disabled = true;
    try {
      let r;
      if (tab === 'login') {
        r = await Net.post('/api/login', { login: $('#login', el).value, password: $('#pass', el).value });
      } else {
        if (!$('#ok', el).checked) throw new Error('Kubali masharti kwanza');
        const k = kind === 'any' ? 'parent' : kind === 'school' ? schoolType : 'parent';
        r = await Net.post('/api/register', {
          kind: k, name: $('#name', el).value, phone: $('#phone', el).value, email: $('#email', el).value, password: $('#pass', el).value, terms: TERMS_VERSION,
          school: k === 'parent' ? undefined : { name: $('#sname', el) ? $('#sname', el).value : '', region: $('#region', el).value, district: $('#district', el).value, levels: [...picked] },
        });
      }
      Net.setAcct(r);
      Sfx.good();
      if (r.user.role === 'parent') {
        const par = Store.parent() || { created: Date.now(), settings: {} };
        par.terms = par.terms || { v: TERMS_VERSION, at: Date.now() };
        Store.saveParent(par);
        await SchoolSync.pullChildren().catch(() => {});
        await SchoolSync.pushChildren().catch(() => {});
        if (p.next && !(p.next === 'childForm' && Store.children().length)) return HK.go(p.next, p.nextParams || {}, { reset: true });
        return HK.boot();
      }
      routeByRole();
    } catch (e) { toast(e.message); b.disabled = false; }
  };
  draw();
};

HK.screens.changePass = (el, p) => {
  el.innerHTML = `
    <div class="topbar">${p.forced ? '' : `<button class="icon-btn" id="bk">${icon('back')}</button>`}<h1>Badilisha nenosiri</h1></div>
    <div class="scroll" style="max-width:480px;margin:0 auto;width:100%">
      ${p.forced ? '<div class="card" style="background:#FFF4D2"><p>Kwa usalama, weka nenosiri jipya kabla ya kuendelea.</p></div>' : ''}
      <label class="label">Nenosiri la sasa</label><input class="field" id="old" type="password">
      <label class="label">Nenosiri jipya (herufi 6+)</label><input class="field" id="new" type="password">
      <label class="label">Rudia nenosiri jipya</label><input class="field" id="new2" type="password">
      <div style="height:18px"></div><button class="btn block" id="go">${icon('check', 20)} Hifadhi</button>
    </div>`;
  const bk = $('#bk', el); if (bk) bk.onclick = () => HK.back();
  $('#go', el).onclick = async () => {
    if ($('#new', el).value !== $('#new2', el).value) return toast("The new passwords don't match");
    try {
      await Net.post('/api/password', { old: $('#old', el).value, new: $('#new', el).value });
      const a = Net.acct(); a.user.must_change = false; Net.setAcct(a);
      toast("Password changed"); routeByRole();
    } catch (e) { toast(e.message); }
  };
};
