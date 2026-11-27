

const STAFF = ['school_admin', 'teacher', 'superadmin'];

function routeByRole() {
  const gate = Net.accessScreen();
  if (gate) return HK.go(gate, gate === 'changePass' ? { forced: true } : {}, { reset: true });
  const u = Net.user();
  if (u.role === 'child') return HK.go('home', {}, {reset:true});
  if (u.role === 'superadmin') return HK.go('superHome', {}, { reset: true });
  if (STAFF.includes(u.role)) return HK.go('schoolHome', {}, { reset: true });
  HK.startParent();
}

HK.screens.welcome = (el) => {
  el.classList.add('welcome');
  el.innerHTML = `<div class="center-col">
    <div class="hk-logo" aria-label="HUGO KID">
      <div class="mark"><img class="book" src="img/logo-book.png" alt=""><img class="star" src="img/logo-star.png" alt=""></div>
      <img class="word" src="img/logo-word.png" alt="HUGO KID - Learn, Play, Grow">
    </div>
    <div class="actions">
      <p>Sign in or create an account while connected to the internet. Once approved, you can learn and play offline.</p>
      <button class="btn block blue" id="parent">Create a parent account</button>
      <button class="btn block navy" id="school">School or teacher</button>
      <button class="btn block ghost" id="link-device">Child sign-in with a link code</button>
      <button class="link-btn" id="login">Already have an account? <b>Sign in</b></button>
      ${IS_WEB ? '<a class="btn block ghost" href="/download">Download for Android</a>' : ''}
    </div>
  </div>`;
  $('#link-device', el).onclick = () => HK.go('deviceLink');
  $('#parent', el).onclick = () => { Sfx.tap(); HK.go('acctAuth', { kind: 'parent', tab: 'register' }); };
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
      <div class="topbar"><button class="icon-btn" id="bk" aria-label="Back">${icon('back')}</button><h1>${kind === 'school' ? 'School accounts' : kind === 'parent' ? 'Parent account' : 'Sign in'}</h1></div>
      <div class="scroll" style="max-width:600px;margin:0 auto;width:100%">
        <div class="seg" style="margin:4px 0 14px"><button data-t="login" class="${tab === 'login' ? 'on' : ''}">Sign in</button><button data-t="register" class="${tab === 'register' ? 'on' : ''}">Create account</button></div>
        ${tab === 'login' ? `
          <label class="label">Phone or email</label><input class="field" id="login" autocomplete="username" placeholder="07xx xxx xxx">
          <label class="label">Password</label><input class="field" id="pass" type="password" autocomplete="current-password">
          <div style="height:18px"></div><button class="btn block" id="go">${icon('key', 20)} Sign in</button>
          <button class="btn small ghost" id="forgot-password" style="margin-top:14px">Forgot password?</button>
          <p class="muted" style="font-size:13px;margin-top:14px">Enter your phone number or email and your password.</p>`
        : `
          ${kind === 'any' ? `<label class="label">You are registering as</label><div class="chips" id="kind"><button class="chip on" data-k="parent">Parent</button><button class="chip" data-k="school">School / Teacher</button></div>` : ''}
          ${kind === 'school' ? `
            <label class="label">Aina</label>
            <div class="chips" id="stype"><button class="chip ${schoolType === 'school' ? 'on' : ''}" data-s="school">School</button><button class="chip ${schoolType === 'tutor' ? 'on' : ''}" data-s="tutor">Private tutor / Tuition</button></div>
            ${schoolType === 'school' ? `<label class="label">School name</label><input class="field" id="sname" placeholder="Mfano: Shule ya Msingi Upendo">` : ''}
            <div class="row" style="gap:10px"><div class="grow"><label class="label">Mkoa</label><input class="field" id="region" placeholder="Dar es Salaam"></div><div class="grow"><label class="label">Wilaya</label><input class="field" id="district" placeholder="Kinondoni"></div></div>
            <label class="label">Madarasa mnayofundisha</label>
            <div class="chips" id="lv">${levels.map(l => `<button class="chip ${picked.has(l) ? 'on' : ''}" data-l="${esc(l)}" style="padding:8px 12px;font-size:13px">${esc(l.replace('Awali - ', ''))}</button>`).join('')}</div>` : ''}
          <label class="label">${kind === 'school' && schoolType === 'school' ? "Name of head teacher / administrator" : 'Jina lako kamili'}</label><input class="field" id="name">
          <label class="label">Phone number</label><input class="field" id="phone" inputmode="tel" placeholder="07xx xxx xxx">
          <label class="label">Email (optional)</label><input class="field" id="email" type="email">
          <label class="label">Password (6+ characters)</label><input class="field" id="pass" type="password" autocomplete="new-password">
          <label class="card row" style="cursor:pointer;gap:12px;align-items:flex-start;margin-top:16px">
            <input type="checkbox" id="ok" style="width:22px;height:22px;flex:none;accent-color:var(--teal)">
            <span style="font-weight:600;font-size:13px">Nimesoma na ninakubali <a href="#" id="tlink" style="color:var(--blue)">Terms and Privacy Policy</a>.</span></label>
          <p class="muted">Keep the password you choose here. You’ll use it to sign in after approval.</p>
          <button class="btn block" id="go">${icon('check', 20)} Create account</button><button class="link-btn" id="sign-in-instead">Already registered? Sign in</button>`}

      </div>`;
    $('#bk', el).onclick = () => HK.back() || routeByRole();
    $$('.seg button', el).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $$('#kind .chip', el).forEach(b => b.onclick = () => { kind = b.dataset.k; draw(); tab = 'register'; });
    $$('#stype .chip', el).forEach(b => b.onclick = () => { schoolType = b.dataset.s; draw(); });
    $$('#lv .chip', el).forEach(b => b.onclick = () => { const l = b.dataset.l; picked.has(l) ? picked.delete(l) : picked.add(l); b.classList.toggle('on'); });
    const tl = $('#tlink', el); if (tl) tl.onclick = e => { e.preventDefault(); HK.go('terms', { mode: 'view' }); };
    const signIn=$('#sign-in-instead',el); if(signIn) signIn.onclick=()=>{ tab='login'; draw(); };
    $('#go', el).onclick = submit;
    const forgot = $('#forgot-password', el);
    if (forgot) forgot.onclick = () => HK.go('forgotPassword', {
      email: $('#login', el).value.includes('@') ? $('#login', el).value.trim() : '',
    });
  };
  const submit = async () => {
    const b = $('#go', el); b.disabled = true;
    try {
      let r;
      if (tab === 'login') {
        r = await Net.post('/api/login', { login: $('#login', el).value, password: $('#pass', el).value });
      } else {
        if (!$('#ok', el).checked) throw new Error("Accept the terms first");
        const k = kind === 'any' ? 'parent' : kind === 'school' ? schoolType : 'parent';
        r = await Net.post('/api/register', {
          kind: k, name: $('#name', el).value, phone: $('#phone', el).value, email: $('#email', el).value, password: $('#pass', el).value, terms: TERMS_VERSION,
          school: k === 'parent' ? undefined : { name: $('#sname', el) ? $('#sname', el).value : '', region: $('#region', el).value, district: $('#district', el).value, levels: [...picked] },
        });
      }
      if (!el.isConnected) return;
      Net.acceptSession(r.token, r.user);
      Sfx.good();
      if (r.user.role === 'parent' && !Net.accessScreen()) {
        await SchoolSync.pullChildren().catch(() => {});
        if (Net.token() !== r.token) return;
        SchoolSync.maybePush();
      }
      routeByRole();
    } catch (e) { toast(e.message); b.disabled = false; }
  };
  draw();
};

HK.screens.accessCheck = el => {
  if (HK.startingAccess) {
    el.innerHTML = '<div class="center-col opening-avatar" role="status" aria-label="Opening HUGO KID">' + mascot('nuru', 145) + '</div>';
    return;
  }
  el.innerHTML = `<div class="topbar"><h1>Account access</h1></div>
    <div class="scroll" style="max-width:600px;width:100%;margin:auto"><div class="card">
      <h2>Connect to the internet</h2>
      <p>HUGO KID must verify your account on this device before you can learn and play offline.</p>
      <button class="btn block" id="verify-access">Check access</button>
      <button class="btn block ghost" id="verify-signout" style="margin-top:10px">Sign out</button>
      <div id="device-controls"></div>
      <p id="verify-note" role="status"></p>
    </div></div>`;
  $('#verify-access', el).onclick = async () => {
    const button = $('#verify-access', el);
    button.disabled = true;
    try { await Net.refreshAccess(); if (el.isConnected) routeByRole(); }
    catch (error) { $('#verify-note', el).textContent = error.message; }
    finally { button.disabled = false; }
  };
  $('#verify-signout', el).onclick = () => { Net.logout(); routeByRole(); };
  bindLockedDeviceControls(el);
};

HK.screens.changePass = (el, p) => {
  el.innerHTML = `
    <div class="topbar">${p.forced ? '' : `<button class="icon-btn" id="bk">${icon('back')}</button>`}<h1>Change password</h1></div>
    <div class="scroll" style="max-width:480px;margin:0 auto;width:100%">
      ${p.forced ? '<div class="card" style="background:#FFF4D2"><p>Kwa usalama, weka nenosiri jipya kabla ya kuendelea.</p></div>' : ''}
      <label class="label">Current password</label><input class="field" id="old" type="password">
      <label class="label">New password (6+ characters)</label><input class="field" id="new" type="password">
      <label class="label">Repeat new password</label><input class="field" id="new2" type="password">
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

function passwordRecoveryScreen(el, { title, fields, label, submit, success }) {
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="recovery-back" aria-label="Back">${icon('back')}</button><h1>${title}</h1></div>
    <div class="scroll" style="max-width:600px;margin:0 auto;width:100%">
      <form id="recovery-form">${fields}
        <button class="btn block" type="submit" style="margin-top:18px">${label}</button>
        <p class="muted" id="recovery-status" role="status" aria-live="polite"></p>
      </form>
    </div>`;
  $('#recovery-back', el).onclick = () => HK.back() || HK.go('acctAuth', {}, { reset: true });
  const form = $('#recovery-form', el);
  const button = $('button[type="submit"]', form);
  const status = $('#recovery-status', el);
  form.onsubmit = async event => {
    event.preventDefault();
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = '';
    try {
      await submit(form);
      if (el.isConnected) success(form, status);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  };
}

HK.screens.forgotPassword = (el, { email = '' } = {}) => passwordRecoveryScreen(el, {
  title: 'Forgot password?',
  fields: `<p>Enter the email address linked to your account. If you only registered with a phone number, contact HUGO TECH or your school administrator.</p>
    <label class="label" for="recovery-email">Email address</label>
    <input class="field" id="recovery-email" type="email" autocomplete="email" maxlength="254" required value="${esc(email)}">`,
  label: 'Send reset link',
  submit: form => Net.post('/api/password/forgot', { email: $('#recovery-email', form).value }),
  success: (_form, status) => { status.textContent = 'If this email is linked to an account, a reset link will arrive shortly. Check your spam folder as well.'; },
});

HK.screens.resetPassword = (el, { token }) => passwordRecoveryScreen(el, {
  title: 'Reset password',
  fields: `<label class="label" for="recovery-password">New password</label>
    <input class="field" id="recovery-password" type="password" autocomplete="new-password" minlength="6" maxlength="128" required>
    <label class="label" for="recovery-confirm">Confirm new password</label>
    <input class="field" id="recovery-confirm" type="password" autocomplete="new-password" minlength="6" maxlength="128" required>`,
  label: 'Set new password',
  submit: form => {
    const password = $('#recovery-password', form).value;
    if (password !== $('#recovery-confirm', form).value) throw new Error('The passwords do not match.');
    return Net.post('/api/password/reset', { token, password });
  },
  success: () => {
    Net.logout();
    HK.go('acctAuth', {}, { reset: true });
    toast('Password updated. Sign in with your new password.');
  },
});


HK.screens.accountAccess = el => {
  const user = Net.user();
  if (!user) return HK.go('acctAuth', {}, { reset: true });
  const pending = user.access_status === 'pending';
  el.innerHTML = `<div class="topbar"><h1>Account access</h1></div>
    <div class="scroll" style="max-width:600px;width:100%;margin:auto">
      <div class="card">
        <h2>${pending ? 'Awaiting approval' : 'Access suspended'}</h2>
        <p>${pending ? 'HUGO TECH will activate your account after checking payment.' : 'Contact HUGO TECH to review your account status.'}</p>
        ${pending && ['parent', 'school_admin'].includes(user.role) ? '<p>After approval, sign in with the phone number or email and password you entered when you registered.</p>' : ''}
        ${user.role === 'child' ? '<p>Ask your parent to check billing on their phone.</p>' : user.role === 'teacher' ? '<p>Ask your school administrator to check the school’s billing status.</p>' : '<button class="btn block" id="access-billing">View invoices and submit payment</button>'}
        ${['parent','school_admin'].includes(user.role) ? '<button class="btn block ghost" id="customer-notices">Notifications</button>' : ''}
        <button class="btn block ghost" id="access-refresh" style="margin-top:10px">Check access again</button>
        <button class="btn block ghost" id="access-signout" style="margin-top:10px">Sign out</button>
        <div id="device-controls"></div>
        <p id="access-note" role="status"></p>
      </div>
    </div>`;
  bindCustomerNotices(el);
  const billing = $('#access-billing', el);
  if (billing) billing.onclick = () => HK.go('billing');
  $('#access-refresh', el).onclick = async event => {
    const button = event.currentTarget;
    button.disabled = true;
    const note = $('#access-note', el);
    try {
      await Net.refreshAccess();
      if (!el.isConnected) return;
      const status = Net.user()?.access_status;
      note.textContent = status === 'active' ? 'Your account is approved.' : status === 'pending' ? 'Your account is still awaiting approval.' : 'Your account is still suspended.';
    } catch (error) { note.textContent = error.message; }
    finally { button.disabled = false; }
  };
  $('#access-signout', el).onclick = () => { Net.logout(); HK.go('acctAuth', {}, { reset: true }); };
  bindLockedDeviceControls(el);
};

function bindLockedDeviceControls(el) {
  if (!LM.state().on || !Store.parent()?.pinHash || Net.role() !== 'parent') return;
  const controls = $('#device-controls', el);
  controls.innerHTML = '<button class="btn block ghost" id="stop-device-guard" style="margin-top:10px">Turn off device Learning Mode</button>';
  $('#stop-device-guard', el).onclick = () => modal(el, {
    title: 'Confirm your parent PIN',
    html: '<label class="label" for="device-pin">Parent PIN</label><input class="field" id="device-pin" type="password" inputmode="numeric" maxlength="4">',
    buttons: [
      { label: 'Turn off Learning Mode', keepOpen: true, onClick: async overlay => {
        const pin = $('#device-pin', overlay).value;
        if (!/^\d{4}$/.test(pin) || await hashPin(pin) !== Store.parent()?.pinHash) return toast('Incorrect PIN.');
        HugoNative.setLearningMode(false);
        overlay.remove();
        controls.innerHTML = '';
      } },
      { label: 'Cancel', cls: 'ghost' },
    ],
  });
}
