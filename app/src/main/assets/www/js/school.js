

const isAdmin = () => Net.role() === 'school_admin';
const dash = (el, title, sub, body, back = true, actions = '') => {
  el.classList.add('dash-screen');
  el.innerHTML = `<div class="topbar dash-top">${back ? `<button class="icon-btn" id="bk">${icon('back')}</button>` : `<img src="img/mark.png" style="width:40px;height:40px;object-fit:contain">`}
    <div class="grow"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>${actions}</div>
    <div class="scroll dash-body">${body}</div>`;
  const bk = $('#bk', el); if (bk) bk.onclick = () => HK.back();
  return $('.dash-body', el);
};
const loading = '<div class="empty">Inapakia...</div>';
const errBox = e => `<div class="empty">${esc(e.message)}<br><button class="btn small ghost" onclick="HK.render()" style="margin-top:12px">Try again</button></div>`;
const pct = v => v == null ? '-' : v + '%';
const fmtDate = t => t ? new Date(t).toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' }) : '';
const statCard = (n, v, ic, col) => `<div class="stat-card" style="--sc:${col}"><span class="sc-ic">${icon(ic, 22)}</span><b>${v ?? '-'}</b><span>${esc(n)}</span></div>`;

HK.screens.schoolHome = (el) => {
  const u = Net.user();
  if (!u) return HK.boot();
  const admin = isAdmin();
  const body = dash(el, u.school ? u.school.name : 'Shule', (admin ? (u.school && u.school.type === 'tutor' ? 'Mwalimu binafsi' : 'Mkuu wa shule') : 'Mwalimu') + ' · ' + u.name, loading, false,
    `${admin ? '<button class="chip" id="customer-notices">Notifications</button>' : ''}<button class="icon-btn" id="out" title="Toka">${icon('logout', 20)}</button>`);
  bindCustomerNotices(el);
  $('#out', el).onclick = () => confirmBox(el, "Sign out of the account?", '', "Exit", () => { Net.logout(); HK.go('welcome', {}, { reset: true }); });
  HK.setBack(() => true);
  Net.connect();
  const off = Net.on(m => { if (m.t === 'refresh') HK.render(); });
  (async () => {
    try {
      const [classes, anns] = await Promise.all([Net.get('/api/classes'), Net.get('/api/announcements')]);
      const an = admin ? await Net.get('/api/school/analytics') : null;
      const menu = admin ? [
        ['aClasses', 'Madarasa', 'build', 'var(--blue)'], ['aTeachers', 'Walimu', 'users', 'var(--teal)'], ['aParents', 'Wazazi', 'user', 'var(--coral)'],
        ['announce', 'Matangazo', 'bell', 'var(--sun-d)'], ['inbox', 'Ujumbe', 'send', '#7B61FF'], ['aSubjects', 'Masomo', 'book', 'var(--navy)'],
        ['billing', 'Malipo', 'coin', '#FF8A3D'], ['aSettings', 'Mipangilio', 'sliders', 'var(--muted)'],
      ] : [['inbox', 'Ujumbe', 'send', '#7B61FF'], ['announce', 'Matangazo', 'bell', 'var(--sun-d)'], ['aSettings', 'Akaunti', 'sliders', 'var(--muted)']];
      body.innerHTML = `
        ${admin ? `<div class="stat-grid">
          ${statCard('Wanafunzi', an.students, 'users', 'var(--blue)')}${statCard('Walimu', an.teachers, 'user', 'var(--teal)')}
          ${statCard('Wazazi', an.parents, 'heart', 'var(--coral)')}${statCard('Ufaulu', pct(an.performance), 'trophy', 'var(--sun-d)')}
          ${statCard('Homework zilizofanywa', pct(an.completion), 'check', '#7B61FF')}${statCard('Mahudhurio', pct(an.attendance), 'clock', 'var(--navy)')}
        </div>` : ''}
        <div class="menu-grid">${menu.map(([go, n, ic, col]) => `<button class="menu-tile" data-go="${go}"><span style="background:${col}">${icon(ic, 24)}</span>${n}</button>`).join('')}</div>
        <div class="section-title">${admin ? 'Madarasa ya shule' : 'Madarasa yangu'}</div>
        ${classes.length ? `<div class="class-grid">${classes.map(c => `<button class="item" data-class="${c.id}">
          <div class="i-ic" style="background:var(--blue)">${icon('build', 24)}</div>
          <div class="grow"><div class="i-title">${esc(c.name)}</div><div class="i-sub">Wanafunzi ${c.students}${c.teacher ? ' · Mwl. ' + esc(c.teacher) : ''}</div></div>${icon('chevR', 20)}</button>`).join('')}</div>`
        : `<div class="empty">${admin ? "No classes yet. Open \"Classes\" to start." : "You haven't been assigned a class yet. Ask the head teacher."}</div>`}
        ${admin && an.classes.length ? `<div class="section-title">Performance by class</div><div class="card table-card"><table><tr><th>Class</th><th>Wanafunzi</th><th>Ufaulu</th><th>Homework</th><th>Mahudhurio</th></tr>
          ${an.classes.map(c => `<tr><td>${esc(c.name)}</td><td>${c.students}</td><td>${pct(c.performance)}</td><td>${pct(c.completion)}</td><td>${pct(c.attendance)}</td></tr>`).join('')}</table></div>` : ''}
        ${anns.length ? `<div class="section-title">Matangazo</div>${anns.slice(0, 3).map(a => `<div class="card"><h3>${esc(a.title)}</h3><p>${esc(a.body || '')}</p><p class="muted" style="font-size:12px">${fmtDate(a.created)}</p></div>`).join('')}` : ''}`;
      $$('[data-go]', body).forEach(b => b.onclick = () => HK.go(b.dataset.go));
      $$('[data-class]', body).forEach(b => b.onclick = () => HK.go('tClass', { id: +b.dataset.class }));
    } catch (e) { body.innerHTML = errBox(e); }
  })();
  return off;
};

HK.screens.aClasses = (el) => {
  const body = dash(el, 'Madarasa', '', loading);
  (async () => {
    try {
      const [classes, teachers, me] = await Promise.all([Net.get('/api/classes'), Net.get('/api/teachers'), Net.get('/api/me')]);
      const levels = (Net.user().school || {}).levels || me.levels;
      body.innerHTML = `<div class="card">
          <h3>Add class</h3>
          <div class="form-row"><select class="field" id="lv">${levels.map(l => `<option>${esc(l)}</option>`).join('')}</select>
          <input class="field" id="st" placeholder="Mkondo (mf. A)" style="max-width:140px">
          <select class="field" id="tc"><option value="">Class teacher</option>${teachers.map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}<option value="${Net.user().id}">Mimi (${esc(Net.user().name)})</option></select></div>
          <button class="btn" id="add" style="margin-top:12px">${icon('plus', 20)} Ongeza</button></div>
        ${classes.map(c => `<div class="item" style="cursor:default"><div class="i-ic" style="background:var(--blue)">${icon('build', 22)}</div>
          <div class="grow"><div class="i-title">${esc(c.name)}</div><div class="i-sub">Wanafunzi ${c.students}</div></div>
          <select class="field" data-tc="${c.id}" style="max-width:190px;padding:10px">${['<option value="">Hakuna mwalimu</option>', ...teachers.map(t => `<option value="${t.id}" ${c.teacher_id === t.id ? 'selected' : ''}>${esc(t.name)}</option>`), `<option value="${Net.user().id}" ${c.teacher_id === Net.user().id ? 'selected' : ''}>Mimi</option>`].join('')}</select>
          <button class="icon-btn" data-open="${c.id}">${icon('chevR', 20)}</button></div>`).join('')}`;
      $('#add', body).onclick = async () => { try { await Net.post('/api/classes', { level: $('#lv', body).value, stream: $('#st', body).value, teacher_id: $('#tc', body).value || null }); toast("Class added"); HK.render(); } catch (e) { toast(e.message); } };
      $$('[data-tc]', body).forEach(s => s.onchange = async () => { const c = classes.find(x => x.id === +s.dataset.tc); try { await Net.put('/api/classes/' + c.id, { level: c.level, stream: c.stream, teacher_id: s.value || null }); toast("Saved"); } catch (e) { toast(e.message); } });
      $$('[data-open]', body).forEach(b => b.onclick = () => HK.go('tClass', { id: +b.dataset.open }));
    } catch (e) { body.innerHTML = errBox(e); }
  })();
};

/* ---------- Walimu ---------- */
HK.screens.aTeachers = (el) => {
  const body = dash(el, 'Walimu', '', loading);
  const showCreds = r => modal(null, { iconName: 'key', title: "Sign-in details", html: `<div class="card" style="text-align:left"><p>Simu/barua pepe: <b>${esc(r.login)}</b></p><p>Nenosiri la muda: <b style="font-size:20px;letter-spacing:1px">${esc(r.password)}</b></p></div><p style="font-size:13px">Give the teacher these details. They will change the password on first sign-in.</p>`, buttons: [{ label: 'Sawa' }] });
  (async () => {
    try {
      const list = await Net.get('/api/teachers');
      body.innerHTML = `<div class="card"><h3>Add teacher</h3>
          <div class="form-row"><input class="field" id="n" placeholder="Jina kamili"><input class="field" id="p" placeholder="Namba ya simu" inputmode="tel"><input class="field" id="e" placeholder="Barua pepe (si lazima)"></div>
          <button class="btn" id="add" style="margin-top:12px">${icon('plus', 20)} Ongeza</button></div>
        ${list.length ? list.map(t => `<div class="item" style="cursor:default"><div class="i-ic" style="background:var(--teal)">${icon('user', 22)}</div>
          <div class="grow"><div class="i-title">${esc(t.name)}</div><div class="i-sub">${esc(t.phone || t.email || '')}${t.classes.length ? ' · ' + esc(t.classes.join(', ')) : ''}${t.must_change ? ' · bado hajaingia' : ''}</div></div>
          <button class="btn small ghost" data-reset="${t.id}">${icon('key', 16)} Nenosiri</button><button class="icon-btn" data-del="${t.id}">${icon('trash', 18)}</button></div>`).join('') : '<div class="empty">Bado hakuna walimu.</div>'}`;
      $('#add', body).onclick = async () => { try { const r = await Net.post('/api/teachers', { name: $('#n', body).value, phone: $('#p', body).value, email: $('#e', body).value }); HK.render(); showCreds(r); } catch (e) { toast(e.message); } };
      $$('[data-reset]', body).forEach(b => b.onclick = async () => { try { showCreds(await Net.post(`/api/teachers/${b.dataset.reset}/reset`)); } catch (e) { toast(e.message); } });
      $$('[data-del]', body).forEach(b => b.onclick = () => confirmBox(el, "Remove teacher?", "They will not be able to sign in again.", "Remove", async () => { await Net.del('/api/teachers/' + b.dataset.del); HK.render(); }));
    } catch (e) { body.innerHTML = errBox(e); }
  })();
};

HK.screens.aParents = (el) => {
  const body = dash(el, 'Wazazi', "Parents linked to the school's students", loading);
  Net.get('/api/parents').then(list => {
    body.innerHTML = list.length ? `<input class="field" id="f" placeholder="Tafuta jina au simu" style="margin-bottom:12px"><div class="card table-card"><table id="t"><tr><th>Parent</th><th>Simu</th><th>Watoto</th></tr>
      ${list.map(p => `<tr><td>${esc(p.name)}</td><td>${esc(p.phone || p.email || '')}</td><td>${p.children.map(c => esc(c.name) + ' (' + esc(c.class_name) + ')').join('<br>')}</td></tr>`).join('')}</table></div>`
      : '<div class="empty">Bado hakuna mzazi aliyeunganisha. Wazazi wanaunganisha kwa msimbo wa mwanafunzi.</div>';
    const f = $('#f', body); if (f) f.oninput = () => $$('#t tr', body).forEach((r, i) => { if (i) r.style.display = r.textContent.toLowerCase().includes(f.value.toLowerCase()) ? '' : 'none'; });
  }).catch(e => { body.innerHTML = errBox(e); });
};

HK.screens.aSubjects = (el) => {
  const body = dash(el, 'Masomo', '', loading);
  Net.get('/api/subjects').then(list => {
    body.innerHTML = `<div class="card"><div class="form-row"><input class="field" id="n" placeholder="Jina la somo"><button class="btn" id="add">${icon('plus', 20)} Ongeza</button></div></div>
      <div class="chips">${list.map(s => `<span class="chip">${esc(s.name)}${s.id > 0 ? ` <button data-del="${s.id}" style="border:0;background:none;padding:0;color:var(--muted)">${icon('x', 14)}</button>` : ''}</span>`).join('')}</div>`;
    $('#add', body).onclick = async () => { try { await Net.post('/api/subjects', { name: $('#n', body).value }); HK.render(); } catch (e) { toast(e.message); } };
    $$('[data-del]', body).forEach(b => b.onclick = async () => { await Net.del('/api/subjects/' + b.dataset.del); HK.render(); });
  }).catch(e => { body.innerHTML = errBox(e); });
};

HK.screens.aSettings = (el) => {
  const u = Net.user();
  const body = dash(el, 'Mipangilio', '', loading);
  (async () => {
    let s = null;
    if (isAdmin()) { try { s = await Net.get('/api/school'); } catch (e) {} }
    body.innerHTML = `${s ? `<div class="card"><h3>School details</h3>
        <label class="label">Jina</label><input class="field" id="n" value="${esc(s.school.name)}">
        <div class="form-row"><div class="grow"><label class="label">Mkoa</label><input class="field" id="r" value="${esc(s.school.region || '')}"></div><div class="grow"><label class="label">Wilaya</label><input class="field" id="d" value="${esc(s.school.district || '')}"></div></div>
        <label class="label">Madarasa</label><div class="chips" id="lv">${s.levels.map(l => `<button class="chip ${s.school.levels.includes(l) ? 'on' : ''}" data-l="${esc(l)}" style="padding:8px 12px;font-size:13px">${esc(l.replace('Awali - ', ''))}</button>`).join('')}</div>
        <button class="btn" id="save" style="margin-top:14px">${icon('check', 20)} Hifadhi</button></div>` : ''}
      <div class="card"><h3>${esc(u.name)}</h3><p>${esc(u.phone || '')} ${esc(u.email || '')}</p>
        <div class="btn-row" style="margin-top:12px"><button class="btn ghost" id="pw">${icon('key', 18)} Badilisha nenosiri</button><button class="btn ghost" id="terms">${icon('file', 18)} Masharti</button></div></div>
      <button class="btn block coral" id="out">${icon('logout', 20)} Toka</button>`;
    if (s) {
      $$('#lv .chip', body).forEach(b => b.onclick = () => b.classList.toggle('on'));
      $('#save', body).onclick = async () => {
        const levels = $$('#lv .chip.on', body).map(b => b.dataset.l);
        try { await Net.put('/api/school', { name: $('#n', body).value, region: $('#r', body).value, district: $('#d', body).value, levels }); const a = Net.acct(); a.user.school.levels = levels; a.user.school.name = $('#n', body).value; Net.setAcct(a); toast("Saved"); } catch (e) { toast(e.message); }
      };
    }
    $('#pw', body).onclick = () => HK.go('changePass');
    $('#terms', body).onclick = () => HK.go('terms', { mode: 'view' });
    $('#out', body).onclick = () => { Net.logout(); HK.go('welcome', {}, { reset: true }); };
  })();
};

HK.screens.tClass = (el, p) => {
  let tab = p.tab || 'hw';
  const body = dash(el, 'Darasa', '', loading);
  const draw = async () => {
    HK.stack[HK.stack.length - 1].params.tab = tab;
    try {
      const classes = await Net.get('/api/classes');
      const c = classes.find(x => x.id === p.id); if (!c) throw new Error('Darasa halipo');
      $('.dash-top h1', el).textContent = c.name;
      $('.dash-top .sub', el) ? $('.dash-top .sub', el).textContent = 'Wanafunzi ' + c.students : null;
      const tabs = `<div class="seg" style="margin:0 0 14px">${[['hw', 'Homework'], ['st', 'Wanafunzi'], ['at', 'Mahudhurio'], ['rp', 'Ripoti']].map(([k, n]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
      let html = '';
      if (tab === 'hw') {
        const list = await Net.get('/api/homework?class_id=' + c.id);
        html = `<button class="btn block blue" id="new">${icon('plus', 20)} Tengeneza homework</button><div style="height:14px"></div>` + (list.length ? list.map(h => `<button class="item" data-hw="${h.id}">
          <div class="i-ic" style="background:${{ quiz: 'var(--coral)', open: '#7B61FF', paper: 'var(--sun)' }[h.kind]}">${icon(h.kind === 'quiz' ? 'check' : h.kind === 'open' ? 'edit' : 'file', 22)}</div>
          <div class="grow"><div class="i-title">${esc(h.title)}</div><div class="i-sub">${esc(h.subject || '')} · ${fmtDate(h.created)}${h.due ? ' · hadi ' + esc(h.due) : ''}</div></div>
          <span class="chip-tag ${h.to_review ? 'coral' : 'teal'}">${h.submitted}/${h.students}${h.to_review ? ' · ' + h.to_review + ' za kusahihisha' : ''}</span></button>`).join('') : '<div class="empty">Bado hakuna homework.</div>');
      }
      if (tab === 'st') {
        const list = await Net.get(`/api/classes/${c.id}/students`);
        html = `<div class="card"><h3>Ongeza wanafunzi</h3><p style="font-size:13px">Write one name per line.</p>
          <textarea class="field" id="names" placeholder="Amani Juma&#10;Neema Ali"></textarea>
          <div class="btn-row" style="margin-top:12px"><button class="btn" id="add">${icon('plus', 20)} Ongeza</button><button class="btn ghost" id="print">${icon('file', 20)} Chapisha misimbo</button></div></div>
          <div class="card table-card"><table><tr><th>Mwanafunzi</th><th>Parent code</th><th>Parent</th>${isAdmin() ? '<th></th>' : ''}</tr>
          ${list.map(s => `<tr><td>${esc(s.name)}</td><td><b class="code">${esc(s.link_code || '-')}</b></td><td>${s.parent ? esc(s.parent.name) + '<br><span class="muted">' + esc(s.parent.phone || '') + '</span><br><button class="btn small ghost" data-msg="' + s.id + '" data-n="' + esc(s.name) + '" style="margin-top:6px;padding:6px 10px">Ujumbe</button>' : '<span class="muted">Bado</span>'}</td>
            ${isAdmin() ? `<td><button class="icon-btn" data-del="${s.id}" style="width:36px;height:36px">${icon('trash', 16)}</button></td>` : ''}</tr>`).join('')}</table></div>`;
        body.dataset.students = JSON.stringify(list);
      }
      if (tab === 'at') {
        const day = p.day || Store.today();
        const r = await Net.get(`/api/classes/${c.id}/attendance?day=${day}`);
        html = `<div class="form-row" style="margin-bottom:12px"><input class="field" type="date" id="day" value="${day}"><button class="btn small ghost" id="all">${icon('check', 16)} Wote wapo</button></div>
          ${r.students.map(s => `<div class="item" style="cursor:default"><div class="grow"><div class="i-title">${esc(s.name)}</div></div>
            <div class="chips"><button class="chip ${s.present === true ? 'on' : ''}" data-p="${s.id}" data-v="1">Yupo</button><button class="chip ${s.present === false ? 'on no' : ''}" data-p="${s.id}" data-v="0">Hayupo</button></div></div>`).join('')}
          <button class="btn block" id="saveat">${icon('check', 20)} Hifadhi mahudhurio</button>`;
        body.dataset.att = JSON.stringify(Object.fromEntries(r.students.filter(s => s.present !== null).map(s => [s.id, s.present])));
      }
      if (tab === 'rp') {
        const r = await Net.get(`/api/classes/${c.id}/results`);
        const li = (arr, empty, f) => arr.length ? arr.map(f).join('') : `<p class="muted">${empty}</p>`;
        html = `<div class="stat-grid three">
            <div class="card"><h3>${icon('trophy', 18)} Wanafunzi bora</h3>${li(r.top, 'Bado hakuna alama', s => `<p>${esc(s.name)} · <b>${s.avg}%</b></p>`)}</div>
            <div class="card"><h3>${icon('repeat', 18)} Wanaoshuka</h3>${li(r.declining, 'Hakuna', s => `<p>${esc(s.name)} · <b style="color:var(--coral)">${s.trend}%</b></p>`)}</div>
            <div class="card"><h3>${icon('heart', 18)} Wanaohitaji msaada</h3>${li(r.need_help, 'Hakuna', s => `<p>${esc(s.name)} · ${pct(s.avg)} · homework ${pct(s.completion)}</p>`)}</div></div>
          <div class="card table-card"><table><tr><th>Mwanafunzi</th><th>Wastani</th><th>Mwenendo</th><th>Homework</th><th>Mahudhurio</th></tr>
          ${r.students.map(s => `<tr><td>${esc(s.name)}</td><td>${pct(s.avg)}</td><td>${s.trend ? (s.trend > 0 ? '+' : '') + s.trend + '%' : '-'}</td><td>${pct(s.completion)}</td><td>${pct(s.attendance)}</td></tr>`).join('')}</table></div>`;
      }
      body.innerHTML = tabs + html;
      $$('.seg button', body).forEach(b => b.onclick = () => { tab = b.dataset.t; body.innerHTML = tabs + loading; draw(); });
      const nb = $('#new', body); if (nb) nb.onclick = () => HK.go('tHwNew', { classId: c.id, className: c.name });
      $$('[data-hw]', body).forEach(b => b.onclick = () => HK.go('tHw', { id: +b.dataset.hw }));
      const add = $('#add', body);
      if (add) add.onclick = async () => { const names = $('#names', body).value.split('\n').map(x => x.trim()).filter(Boolean); if (!names.length) return toast("Enter names"); try { await Net.post(`/api/classes/${c.id}/students`, { names }); toast("Added"); draw(); } catch (e) { toast(e.message); } };
      const pr = $('#print', body);
      if (pr) pr.onclick = () => printCodes(c, JSON.parse(body.dataset.students || '[]'));
      $$('[data-del]', body).forEach(b => b.onclick = () => confirmBox(el, "Remove student?", '', "Remove", async () => { await Net.del('/api/students/' + b.dataset.del); draw(); }));
      $$('[data-msg]', body).forEach(b => b.onclick = () => HK.go('thread', { childId: +b.dataset.msg, name: b.dataset.n }));
      if (tab === 'at') {
        const att = JSON.parse(body.dataset.att || '{}');
        $('#day', body).onchange = e => { p.day = e.target.value; draw(); };
        $$('[data-p]', body).forEach(b => b.onclick = () => { att[b.dataset.p] = b.dataset.v === '1'; $$(`[data-p="${b.dataset.p}"]`, body).forEach(x => x.classList.toggle('on', x === b)); b.classList.toggle('no', b.dataset.v === '0'); });
        $('#all', body).onclick = () => $$('[data-v="1"]', body).forEach(b => b.click());
        $('#saveat', body).onclick = async () => { try { await Net.post(`/api/classes/${c.id}/attendance`, { day: $('#day', body).value, present: att }); toast("Attendance saved"); } catch (e) { toast(e.message); } };
      }
    } catch (e) { body.innerHTML = errBox(e); }
  };
  draw();
  const off = Net.on(m => { if (m.t === 'refresh' && tab === 'hw') draw(); });
  return off;
};
function printCodes(c, list) {
  const w = window.open('', '_blank');
  const html = `<html><head><title>Misimbo ${esc(c.name)}</title><style>body{font-family:Arial;padding:20px}.k{display:inline-block;width:46%;border:2px dashed #999;border-radius:12px;padding:14px;margin:6px;vertical-align:top}b{font-size:22px;letter-spacing:2px}</style></head><body>
    <h2>${esc((Net.user().school || {}).name || '')} · ${esc(c.name)}</h2>
    ${list.map(s => `<div class="k">Mzazi wa <strong>${esc(s.name)}</strong><br>Pakua HUGO KID, fungua Mipangilio, kisha "Unganisha na shule" na uweke msimbo:<br><b>${esc(s.link_code || '')}</b></div>`).join('')}
    <script>window.print()<\/script></body></html>`;
  if (w) { w.document.write(html); w.document.close(); } else toast("Allow pop-up windows to print");
}

HK.screens.tHwNew = (el, p) => {
  const st = { kind: 'paper', attachments: [], pages: [], questions: [] };
  const body = dash(el, 'Homework mpya', p.className, loading);
  (async () => {
    const subjects = await Net.get('/api/subjects').catch(() => []);
    const qRow = (x, i) => `<div class="qrow"><b>${i + 1}.</b><span class="grow">${esc(x.q)} <span class="chip-tag">${{ mcq: 'Chaguo', short: 'Jibu fupi', math: 'Hesabu', spelling: 'Tahajia', match: 'Unganisha', text: 'Maelezo' }[x.type]}</span>
      <br><span class="muted" style="font-size:12px">${x.type === 'mcq' ? 'Jibu: ' + esc((x.options || [])[x.answer] || '') : x.type === 'match' ? (x.pairs || []).map(pr => esc(pr[0]) + ' = ' + esc(pr[1])).join(', ') : x.answer ? 'Jibu: ' + esc(x.answer) : 'Mwalimu atasahihisha'}</span></span>
      <button class="icon-btn" data-rmq="${i}" style="width:34px;height:34px">${icon('x', 16)}</button></div>`;
    const draw = () => {
      body.innerHTML = `
        <label class="label">Homework type</label>
        <div class="seg" style="margin:0">${[['paper', 'Karatasi (kuandika/kuchora)'], ['quiz', "Quiz (marked by AI)"], ['open', "Open task (essay, project)"]].map(([k, n]) => `<button data-k="${k}" class="${st.kind === k ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="form-row"><div class="grow"><label class="label">Kichwa</label><input class="field" id="title" value="${esc(st.title || '')}" placeholder="Mfano: Sentensi 5 kuhusu familia"></div>
          <div><label class="label">Lesson</label><select class="field" id="subj"><option value="">Choose a subject</option>${subjects.map(s => `<option ${st.subject === s.name ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></div></div>
        <label class="label">Instructions for the student</label><textarea class="field" id="ins" placeholder="Mfano: Andika sentensi 5 za English kuhusu familia yako.">${esc(st.instructions || '')}</textarea>
        <div class="form-row"><div class="grow"><label class="label">Mwisho (deadline)</label><input class="field" type="date" id="due" value="${esc(st.due || '')}"></div>
          <div class="grow"><label class="label">Top scores</label><input class="field" type="number" id="max" value="${st.max || 10}" min="1" max="100"></div></div>

        <label class="label">File (PDF, image, audio)</label>
        <div class="chips">${st.attachments.map((a, i) => `<span class="chip">${esc(a.label)} <button data-rma="${i}" style="border:0;background:none;padding:0">${icon('x', 14)}</button></span>`).join('')}
          <button class="chip" id="addfile">${icon('plus', 16)} Ongeza faili</button></div>

        ${st.kind === 'paper' ? `<label class="label">Pages to write on (worksheet images)</label>
          <div class="pages-grid">${st.pages.map((pg, i) => `<div class="page-thumb"><img src="${pg.bg}"><span class="num">${i + 1}</span><button class="rm" data-rmp="${i}">${icon('x', 16)}</button></div>`).join('')}</div>
          <button class="btn small ghost" id="addpage" style="margin-top:10px">${icon('camera', 18)} Ongeza ukurasa</button>
          <p class="muted" style="font-size:12px;margin-top:6px">Without a picture, the student gets a lined paper with your instructions on top.</p>` : ''}

        ${st.kind === 'quiz' ? `<label class="label">Maswali (${st.questions.length})</label>
          <div class="card">${st.questions.map(qRow).join('') || '<p class="muted">Ongeza maswali au tumia AI.</p>'}</div>
          <div class="card"><h3>Ongeza swali</h3>
            <div class="form-row"><select class="field" id="qt" style="max-width:170px"><option value="mcq">Chaguo</option><option value="short">Short answer</option><option value="math">Hesabu</option><option value="spelling">Tahajia</option><option value="match">Unganisha</option><option value="text">Notes (teacher)</option></select>
              <input class="field" id="qq" placeholder="Swali"></div>
            <input class="field" id="qa" style="margin-top:8px" placeholder="">
            <button class="btn small" id="addq" style="margin-top:10px">${icon('plus', 16)} Ongeza swali</button></div>` : ''}

        <div class="card ai-card"><div class="row"><span>${mascot('nuru', 44)}</span><div class="grow"><h3 style="margin:0">Teacher's AI assistant</h3><p style="font-size:13px">Example: "addition math quiz" or "English worksheet about family"</p></div></div>
          <div class="form-row" style="margin-top:10px"><input class="field" id="topic" placeholder="Mada"><input class="field" id="cnt" type="number" value="5" style="max-width:90px">
            <select class="field" id="lang" style="max-width:140px"><option>English</option></select></div>
          <div class="btn-row" style="margin-top:10px"><button class="btn small blue" id="genq">${icon('check', 16)} Tengeneza quiz</button><button class="btn small ghost" id="genw">${icon('file', 16)} Tengeneza worksheet</button></div></div>

        <button class="btn block" id="save">${icon('send', 20)} Tuma kwa ${esc(p.className || 'darasa')}</button>`;
      const keep = () => { st.title = $('#title', body).value; st.subject = $('#subj', body).value; st.instructions = $('#ins', body).value; st.due = $('#due', body).value; st.max = +$('#max', body).value || 10; };
      $$('[data-k]', body).forEach(b => b.onclick = () => { keep(); st.kind = b.dataset.k; draw(); });
      const qt = $('#qt', body), qa = $('#qa', body);
      const hint = () => { if (!qt) return; qa.placeholder = { mcq: 'Chaguo zitenganishwe kwa | na la kwanza liwe sahihi: 7|6|8', short: 'Jibu sahihi (majibu mbadala kwa |): kijani|green', math: 'Jibu la namba: 12', spelling: 'Neno sahihi: elephant', match: 'Jozi kwa | na = : Paka=Cat|Mbwa=Dog', text: "No answer (teacher/AI will mark)" }[qt.value]; };
      if (qt) { qt.onchange = hint; hint(); }
      const aq = $('#addq', body);
      if (aq) aq.onclick = () => {
        keep();
        const t = qt.value, q = $('#qq', body).value.trim(), a = qa.value.trim();
        if (!q && t !== 'match') return toast("Enter a question");
        const item = { type: t, q, points: 1 };
        if (t === 'mcq') { const o = a.split('|').map(x => x.trim()).filter(Boolean); if (o.length < 2) return toast("Add at least 2 choices"); const right = o[0]; item.options = shuffle(o); item.answer = item.options.indexOf(right); }
        else if (t === 'match') { item.pairs = a.split('|').map(x => x.split('=').map(y => y.trim())).filter(x => x.length === 2 && x[0] && x[1]); if (item.pairs.length < 2) return toast("Add at least 2 pairs"); item.q = q || 'Unganisha'; }
        else if (t !== 'text') { if (!a) return toast("Enter the correct answer"); item.answer = a; }
        st.questions.push(item); draw();
      };
      $$('[data-rmq]', body).forEach(b => b.onclick = () => { keep(); st.questions.splice(+b.dataset.rmq, 1); draw(); });
      $$('[data-rma]', body).forEach(b => b.onclick = () => { keep(); st.attachments.splice(+b.dataset.rma, 1); draw(); });
      $$('[data-rmp]', body).forEach(b => b.onclick = () => { keep(); st.pages.splice(+b.dataset.rmp, 1); draw(); });
      $('#addfile', body).onclick = () => pickFile('application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,audio/*', async f => {
        keep();
        const w = modal(el, { iconName: 'file', title: 'Inapakia...', buttons: [] });
        try { const r = await Net.upload(f, f.name || 'Faili'); st.attachments.push({ file: r.file, mime: r.mime, label: f.name || 'Faili' }); w.remove(); draw(); } catch (e) { w.remove(); toast(e.message); }
      });
      const ap = $('#addpage', body);
      if (ap) ap.onclick = () => pickFile('image/*', async f => { keep(); const r = await fileToImageData(f); st.pages.push({ bg: r.data, w: r.w, h: r.h }); draw(); }, true);
      const gen = async task => {
        keep();
        const topic = $('#topic', body).value.trim(); if (!topic) return toast("Enter a topic");
        const w = modal(el, { iconName: 'nuru', title: 'AI inatengeneza...', text: 'Subiri kidogo', buttons: [] });
        try {
          const r = await Net.post('/api/ai/generate', { task, topic, count: +$('#cnt', body).value || 5, subject: st.subject, level: p.className, lang: $('#lang', body).value });
          w.remove();
          if (task === 'quiz') { st.kind = 'quiz'; st.questions = st.questions.concat((Array.isArray(r) ? r : []).filter(x => x && x.q)); if (!st.title) st.title = 'Quiz: ' + topic; }
          else { st.instructions = r.text; if (!st.title) st.title = 'Worksheet: ' + topic; }
          toast("Created. Check before sending"); draw();
        } catch (e) { w.remove(); toast(e.message); }
      };
      $('#genq', body).onclick = () => gen('quiz');
      $('#genw', body).onclick = () => gen('worksheet');
      $('#save', body).onclick = async () => {
        keep();
        if (!st.subject) return toast("Choose a subject");
        try {
          await Net.post('/api/homework', { class_id: p.classId, title: st.title, subject: st.subject, kind: st.kind, instructions: st.instructions, due: st.due || null, max_score: st.max, attachments: st.attachments, pages: st.pages, questions: st.questions });
          Sfx.good(); toast("Homework sent to students"); HK.back();
        } catch (e) { toast(e.message); }
      };
    };
    draw();
  })();
};
function pickFile(accept, fn, multiple) {
  const i = document.createElement('input'); i.type = 'file'; i.accept = accept; if (multiple) i.multiple = true;
  i.onchange = () => Array.from(i.files || []).forEach(fn);
  i.click();
}

HK.screens.tHw = (el, p) => {
  const body = dash(el, 'Homework', '', loading);
  const draw = () => Net.get('/api/homework/' + p.id).then(h => {
    $('.dash-top h1', el).textContent = h.title;
    const label = s => !s ? '<span class="chip-tag">Hajatuma</span>' : s.status === 'submitted' ? `<span class="chip-tag coral">Sahihisha${s.ai_score != null ? ' · AI ' + s.ai_score : ''}</span>` : s.status === 'returned' ? '<span class="chip-tag sun">Imerudishwa</span>' : `<span class="chip-tag teal">${s.score}/${s.max_score}</span>`;
    body.innerHTML = `<div class="card"><p><b>${esc(h.class_name)}</b> · ${esc(h.subject || '')} · ${{ paper: 'Karatasi', quiz: 'Quiz', open: 'Kazi ya wazi' }[h.kind]}${h.due ? ' · hadi ' + esc(h.due) : ''}</p>${h.instructions ? `<p style="margin-top:6px">${esc(h.instructions)}</p>` : ''}${attachmentsHTML(h.attachments)}</div>
      ${h.students.map(s => `<button class="item" ${s.submission ? `data-s="${s.submission.id}"` : 'disabled'}><div class="i-ic" style="background:${s.submission ? 'var(--teal)' : 'var(--line)'}">${icon('user', 22)}</div>
        <div class="grow"><div class="i-title">${esc(s.name)}</div><div class="i-sub">${s.submission ? 'Ametuma ' + fmtDate(s.submission.submitted) : ''}</div></div>${label(s.submission)}</button>`).join('')}
      <button class="btn block ghost" id="del">${icon('trash', 18)} Futa homework</button>`;
    bindAttachments(body, h.attachments);
    $$('[data-s]', body).forEach(b => b.onclick = () => HK.go('tReview', { id: +b.dataset.s }));
    $('#del', body).onclick = () => confirmBox(el, "Delete homework?", "All student answers will be deleted.", "Delete", async () => { await Net.del('/api/homework/' + h.id); HK.back(); });
  }).catch(e => { body.innerHTML = errBox(e); });
  draw();
  return Net.on(m => { if (m.t === 'refresh') draw(); });
};

HK.screens.tReview = (el, p) => {
  const body = dash(el, 'Sahihisha', '', loading);
  let marks = []; // [{canvas, strokes}]
  Net.get('/api/submissions/' + p.id).then(s => {
    $('.dash-top h1', el).textContent = s.child;
    $('.dash-top .sub', el) && ($('.dash-top .sub', el).textContent = s.homework.title);
    const h = s.homework;
    const answersHTML = h.kind === 'quiz' ? `<div class="card"><h3>Answers (marked by AI)</h3>${(h.questions || []).map((qn, i) => {
      const a = (s.answers || [])[i]; const ok = s.detail ? s.detail[i] : null;
      const shown = qn.type === 'mcq' ? (qn.options || [])[a] : qn.type === 'match' ? (qn.pairs || []).map((pr, k) => pr[0] + ' = ' + ((qn.pairs[(a || [])[k]] || [])[1] || '?')).join(', ') : a;
      return `<div class="qrow"><span class="grow"><b>${i + 1}. ${esc(qn.q)}</b><br>${esc(shown ?? '-')}</span>${ok === true ? `<span class="chip-tag teal">${icon('check', 14)}</span>` : ok === false ? `<span class="chip-tag coral">${icon('x', 14)}</span>` : '<span class="chip-tag sun">Kagua</span>'}</div>`;
    }).join('')}</div>` : '';
    body.innerHTML = `
      ${answersHTML}
      ${(s.pages || []).length ? `<div class="mark-tools"><span class="muted" style="font-weight:600">Sahihisha:</span>
        <button class="tool on" data-m="pen" title="Kalamu nyekundu"><span class="dot" style="width:16px;height:16px;background:#E53935"></span></button>
        <button class="tool" data-m="tick" title="Vema">${icon('check', 22)}</button><button class="tool" data-m="cross" title="Kosa">${icon('x', 22)}</button>
        <button class="tool" id="mundo">${icon('undo', 22)}</button></div>
        <div id="pages">${s.pages.map((pg, i) => `<div class="mark-wrap" data-i="${i}"><img src="${pg}" class="review-page" style="margin:0"><canvas></canvas></div>`).join('')}</div>` : ''}
      ${(s.attachments || []).length ? `<div class="card"><h3>Extra answers</h3>${(s.attachments || []).map(a => /^audio/.test(a.mime) ? `<p>${esc(a.label)}</p><audio controls src="${Net.fileUrl(a.file)}" style="width:100%"></audio>` : /^video/.test(a.mime) ? `<p>${esc(a.label)}</p><video controls playsinline src="${Net.fileUrl(a.file)}" style="width:100%;border-radius:12px"></video>` : `<img class="review-page" src="${Net.fileUrl(a.file)}">`).join('')}</div>` : ''}
      <div class="card ai-card"><div class="row"><span>${mascot('nuru', 40)}</span><div class="grow"><h3 style="margin:0">Pendekezo la AI</h3>
        <p id="aitext">${s.ai_score != null ? `Alama inayopendekezwa: <b>${s.ai_score}/${s.max_score}</b><br>${esc(s.ai_comment || '')}` : s.auto_score != null ? `Alama ya moja kwa moja: <b>${s.auto_score}/${s.max_score}</b>` : "No suggestion yet."}</p></div></div>
        <button class="btn small ghost" id="ask">${icon('help', 16)} Omba AI ipendekeze</button></div>
      <div class="card"><h3>Final score (teacher)</h3>
        <div class="form-row"><input class="field" type="number" id="score" min="0" max="${s.max_score}" step="0.5" value="${s.score ?? s.ai_score ?? s.auto_score ?? ''}" style="max-width:120px"><span style="font-weight:700;font-size:18px">/ ${s.max_score}</span></div>
        <label class="label">Comments for the student and parent</label><textarea class="field" id="fb" placeholder="Mfano: Kazi nzuri! Rekebisha herufi kubwa mwanzoni mwa sentensi.">${esc(s.feedback || '')}</textarea>
        <div class="btn-row" style="margin-top:12px"><button class="btn sun" id="ret">${icon('repeat', 18)} Arekebishe</button><button class="btn" id="ok" style="flex:2">${icon('check', 18)} Thibitisha alama</button></div></div>`;

    let tool = 'pen';
    $$('.mark-wrap', body).forEach(w => {
      const img = $('img', w), cv = $('canvas', w), item = { cv, strokes: [], img };
      marks.push(item);
      const setup = () => { cv.width = img.naturalWidth; cv.height = img.naturalHeight; redraw(item); };
      if (img.complete) setup(); else img.onload = setup;
      let cur = null;
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * cv.width / r.width, (e.clientY - r.top) * cv.height / r.height]; };
      cv.onpointerdown = e => {
        cv.setPointerCapture(e.pointerId);
        const pt = pos(e);
        if (tool === 'pen') { cur = { t: 'pen', pts: [pt] }; item.strokes.push(cur); }
        else { item.strokes.push({ t: tool, pts: [pt] }); redraw(item); }
      };
      cv.onpointermove = e => { if (cur) { cur.pts.push(pos(e)); redraw(item); } };
      cv.onpointerup = () => { cur = null; };
    });
    function redraw(it) {
      const x = it.cv.getContext('2d'); const k = it.cv.width / 1000;
      x.clearRect(0, 0, it.cv.width, it.cv.height);
      x.strokeStyle = '#E53935'; x.lineCap = 'round'; x.lineJoin = 'round';
      it.strokes.forEach(s => {
        const [a, b] = s.pts[0];
        if (s.t === 'pen') { x.lineWidth = 5 * k; x.beginPath(); x.moveTo(a, b); s.pts.forEach(([px, py]) => x.lineTo(px, py)); x.stroke(); }
        if (s.t === 'tick') { x.lineWidth = 9 * k; x.beginPath(); x.moveTo(a - 30 * k, b); x.lineTo(a - 8 * k, b + 24 * k); x.lineTo(a + 36 * k, b - 30 * k); x.stroke(); }
        if (s.t === 'cross') { x.lineWidth = 9 * k; x.beginPath(); x.moveTo(a - 26 * k, b - 26 * k); x.lineTo(a + 26 * k, b + 26 * k); x.moveTo(a + 26 * k, b - 26 * k); x.lineTo(a - 26 * k, b + 26 * k); x.stroke(); }
      });
    }
    $$('[data-m]', body).forEach(b => b.onclick = () => { tool = b.dataset.m; $$('[data-m]', body).forEach(x => x.classList.toggle('on', x === b)); });
    const mu = $('#mundo', body); if (mu) mu.onclick = () => { const it = [...marks].reverse().find(m => m.strokes.length); if (it) { it.strokes.pop(); redraw(it); } };
    $('#ask', body).onclick = async () => {
      $('#aitext', body).textContent = 'AI inakagua...';
      try { const r = await Net.post(`/api/submissions/${s.id}/ai`); $('#aitext', body).innerHTML = `Alama inayopendekezwa: <b>${r.ai_score}/${s.max_score}</b><br>${esc(r.ai_comment || '')}`; if ($('#score', body).value === '') $('#score', body).value = r.ai_score; }
      catch (e) { $('#aitext', body).textContent = e.message; }
    };
    const merged = () => marks.map(m => {
      if (!m.strokes.length) return m.img.src;
      const c = document.createElement('canvas'); c.width = m.cv.width; c.height = m.cv.height;
      const x = c.getContext('2d'); x.drawImage(m.img, 0, 0); x.drawImage(m.cv, 0, 0);
      return c.toDataURL('image/jpeg', 0.82);
    });
    const send = async status => {
      const score = $('#score', body).value;
      if (status === 'marked' && score === '') return toast("Set the final score");
      try {
        await Net.post(`/api/submissions/${s.id}/review`, { status, score: score === '' ? null : +score, feedback: $('#fb', body).value, marked: marks.length ? merged() : undefined });
        Sfx.good(); toast(status === 'marked' ? "Score sent to parent and student" : "Returned to the student"); HK.back();
      } catch (e) { toast(e.message); }
    };
    $('#ok', body).onclick = () => send('marked');
    $('#ret', body).onclick = () => send('returned');
  }).catch(e => { body.innerHTML = errBox(e); });
};

/* ---------- Matangazo ---------- */
HK.screens.announce = (el) => {
  const admin = isAdmin();
  const body = dash(el, 'Matangazo', '', loading);
  Net.get('/api/announcements').then(list => {
    body.innerHTML = `${admin ? `<div class="card"><h3>Tangazo jipya</h3>
        <input class="field" id="t" placeholder="Kichwa">
        <textarea class="field" id="b" placeholder="Ujumbe" style="margin-top:8px"></textarea>
        <label class="label">It goes to</label><div class="chips" id="aud">${[['all', 'Wote'], ['parents', 'Wazazi'], ['teachers', 'Walimu'], ['students', 'Wanafunzi']].map(([k, n], i) => `<button class="chip ${i ? '' : 'on'}" data-a="${k}">${n}</button>`).join('')}</div>
        <button class="btn" id="send" style="margin-top:12px">${icon('send', 18)} Tuma</button></div>` : ''}
      ${list.length ? list.map(a => `<div class="card"><div class="row"><h3 class="grow">${esc(a.title)}</h3><span class="chip-tag">${{ all: 'Wote', parents: 'Wazazi', teachers: 'Walimu', students: 'Wanafunzi' }[a.audience]}</span>${admin ? `<button class="icon-btn" data-del="${a.id}" style="width:34px;height:34px">${icon('trash', 16)}</button>` : ''}</div><p>${esc(a.body || '')}</p><p class="muted" style="font-size:12px">${fmtDate(a.created)}${a.school ? ' · ' + esc(a.school) : ''}</p></div>`).join('') : '<div class="empty">Hakuna matangazo.</div>'}`;
    let aud = 'all';
    $$('#aud .chip', body).forEach(b => b.onclick = () => { aud = b.dataset.a; $$('#aud .chip', body).forEach(x => x.classList.toggle('on', x === b)); });
    const sb = $('#send', body); if (sb) sb.onclick = async () => { try { await Net.post('/api/announcements', { title: $('#t', body).value, body: $('#b', body).value, audience: aud }); toast("Announcement sent"); HK.render(); } catch (e) { toast(e.message); } };
    $$('[data-del]', body).forEach(b => b.onclick = async () => { await Net.del('/api/announcements/' + b.dataset.del); HK.render(); });
  }).catch(e => { body.innerHTML = errBox(e); });
};

HK.screens.inbox = (el) => {
  const body = dash(el, 'Ujumbe', '', loading);
  Net.get('/api/inbox').then(list => {
    body.innerHTML = list.length ? list.map(t => `<button class="item" data-c="${t.child_id}"><div class="i-ic" style="background:#7B61FF">${icon('send', 22)}</div>
      <div class="grow"><div class="i-title">Kuhusu ${esc(t.child)}</div><div class="i-sub">${fmtDate(t.last)}</div></div>${t.unread ? `<span class="chip-tag coral">${t.unread} mpya</span>` : ''}</button>`).join('')
      : '<div class="empty">Hakuna ujumbe bado. Kuanza mazungumzo na mzazi: fungua darasa, kichupo cha Wanafunzi, kisha "Ujumbe".</div>';
    $$('[data-c]', body).forEach(b => b.onclick = () => HK.go('thread', { childId: +b.dataset.c }));
  }).catch(e => { body.innerHTML = errBox(e); });
};
HK.screens.thread = (el, p) => {
  const me = Net.user();
  const body = dash(el, 'Mazungumzo', p.name || '', loading);
  const draw = () => Net.get(`/api/children/${p.childId}/messages`).then(list => {
    body.innerHTML = `<div id="msgs">${list.map(m => `<div class="bubble ${m.from_id === me.id ? 'me' : ''}"><span class="who">${esc(m.from_name)}</span>${esc(m.body)}<span class="when">${new Date(m.created).toLocaleString('sw-TZ', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>`).join('') || '<div class="empty">Anza mazungumzo.</div>'}</div>
      <div class="form-row" style="position:sticky;bottom:0;background:var(--bg);padding:10px 0"><input class="field" id="m" placeholder="Andika ujumbe"><button class="btn" id="s">${icon('send', 20)}</button></div>`;
    body.scrollTop = body.scrollHeight;
    $('#s', body).onclick = async () => { const v = $('#m', body).value.trim(); if (!v) return; try { await Net.post(`/api/children/${p.childId}/messages`, { body: v }); draw(); } catch (e) { toast(e.message); } };
  }).catch(e => { body.innerHTML = errBox(e); });
  draw();
  return Net.on(m => { if (m.t === 'message' && m.child_id === p.childId) draw(); });
};

function invoicePaymentDetails(invoice) {
  const entries = [
    ['Payment type', invoice.method],
    ['Bank or network', invoice.provider],
    ['Account holder', invoice.account_name],
    ['Transaction reference', invoice.reference],
  ];
  return entries.filter(([, value]) => value).map(([label, value]) =>
    `<div class="i-sub">${label} · ${esc(value)}</div>`).join('');
}

function bindReceiptButtons(root, scope = root) {
  $$('[data-receipt]', scope).forEach(button => button.onclick = async () => {
    button.disabled = true;
    try {
      const { image } = await Net.get(`/api/billing/${button.dataset.receipt}/receipt`);
      if (!root.isConnected) return;
      const dialog = modal(root, {
        title: 'Payment receipt',
        html: '<img alt="Payment receipt" style="display:block;width:100%;height:auto;margin-bottom:12px">',
        buttons: [{ label: 'Close', cls: 'ghost' }],
      });
      $('img', dialog).src = image;
    } catch (error) { toast(error.message); }
    finally { button.disabled = false; }
  });
}

function showPaymentForm(el, invoiceId) {
  modal(el, {
    title: 'Submit payment',
    text: 'Attach a receipt image or enter the transaction reference. You can provide both.',
    html: `<div style="margin-bottom:16px;text-align:left">
      <label for="pay-type" class="label">Payment type</label>
      <select id="pay-type" class="field"><option value="">Choose payment type</option><option>Mobile money</option><option>Bank transfer</option><option>Other</option></select>
      <label for="pay-provider" class="label">Bank, mobile network or provider</label>
      <input id="pay-provider" class="field" maxlength="100" placeholder="e.g. CRDB or M-Pesa">
      <label for="pay-account" class="label">Account holder name</label>
      <input id="pay-account" class="field" maxlength="120" placeholder="Name on the account used to pay">
      <label for="pay-reference" class="label">Transaction reference</label>
      <input id="pay-reference" class="field" maxlength="60" placeholder="Transaction number">
      <label for="pay-receipt" class="label">Receipt image</label>
      <input id="pay-receipt" class="field" type="file" accept="image/*">
      <p id="pay-error" role="alert" style="margin:8px 0 0;color:var(--coral-d)"></p>
    </div>`,
    buttons: [{
      label: 'Submit payment', keepOpen: true, onClick: async dialog => {
        const button = $('.btn-row .btn', dialog);
        const error = $('#pay-error', dialog);
        const payment_type = $('#pay-type', dialog).value;
        const provider = $('#pay-provider', dialog).value.trim();
        const account_name = $('#pay-account', dialog).value.trim();
        const reference = $('#pay-reference', dialog).value.trim();
        const image = $('#pay-receipt', dialog).files[0];
        if (button.disabled) return;
        error.textContent = '';
        if (!payment_type || !provider || !account_name) {
          error.textContent = 'Enter the payment type, provider and account holder name.';
          return;
        }
        if (!reference && !image) {
          error.textContent = 'Attach a receipt image or enter the transaction reference.';
          return;
        }
        button.disabled = true;
        try {
          const receipt = image ? (await fileToImageData(image, 2000)).data : undefined;
          if (!dialog.isConnected) return;
          await Net.post(`/api/billing/${invoiceId}/pay`, { payment_type, provider, account_name, reference, receipt });
          if (!dialog.isConnected) return;
          dialog.remove();
          toast('Payment submitted for verification.');
          HK.render();
        } catch (failure) { error.textContent = failure.message; }
        finally { button.disabled = false; }
      },
    }, { label: 'Cancel', cls: 'ghost' }],
  });
}

HK.screens.billing = (el) => {
  const body = dash(el, 'Billing', '', loading);
  Net.get('/api/billing').then(b => {
    const st = { unpaid: ['coral', 'Unpaid'], pending: ['sun', 'Awaiting verification'], paid: ['teal', 'Paid'] };
    body.innerHTML = `${b.plans.pay_info ? `<div class="card"><h3>How to pay</h3><p>${esc(b.plans.pay_info)}</p></div>` : ''}
      ${b.invoices.length ? b.invoices.map(i => `<div class="card">
        <div class="row"><div class="grow"><h3 style="margin:0">${esc(i.plan)} · ${esc(i.period)}</h3><p>TSh ${Number(i.amount).toLocaleString()}</p></div><span class="chip-tag ${st[i.status][0]}">${st[i.status][1]}</span></div>
        ${i.status === 'unpaid' ? `<button class="btn small" style="margin-top:10px" data-pay="${i.id}">Submit payment</button>` : invoicePaymentDetails(i)}
        ${i.has_receipt && i.status !== 'unpaid' ? `<button class="btn small ghost" style="margin-top:10px" data-receipt="${i.id}">View receipt</button>` : ''}
      </div>`).join('') : '<div class="empty">No invoices yet.</div>'}`;
    $$('[data-pay]', body).forEach(button => button.onclick = () => showPaymentForm(el, button.dataset.pay));
    bindReceiptButtons(el, body);
  }).catch(error => { body.innerHTML = errBox(error); });
};
