/* HUGO KID - online.js : sehemu ya mtandaoni ya mzazi (shule, ripoti, ujumbe) na HUGO TECH */

/* ---------- Mzazi: shule na ripoti (ndani ya Eneo la Mzazi) ---------- */
async function renderParentSchool(body) {
  if (!(Net.online() && Net.role() === 'parent')) {
    body.innerHTML = `<div class="card" style="text-align:center"><div style="display:flex;justify-content:center">${nuruSVG(80)}</div>
      <h3 style="margin-top:8px">Unganisha na shule</h3><p>Fungua akaunti ya mzazi ili kupokea homework za mwalimu, alama, ripoti, mahudhurio na ujumbe wa mwalimu.</p>
      <div style="height:14px"></div><button class="btn block blue" id="acct">${icon('user', 20)} Fungua akaunti au ingia</button></div>`;
    $('#acct', body).onclick = () => HK.go('acctAuth', { kind: 'parent', tab: 'register', next: 'parentHome', nextParams: { tab: 'school' } });
    return;
  }
  body.innerHTML = '<div class="empty">Inapakia...</div>';
  try {
    await SchoolSync.pullChildren();
    await SchoolSync.pushChildren();
    const kids = Store.children();
    const [anns] = await Promise.all([Net.get('/api/announcements').catch(() => [])]);
    const blocks = [];
    for (const c of kids) {
      if (!c.serverId) continue;
      const mode = kidMode(c);
      if (!c.className) {
        blocks.push(`<div class="card"><div class="row">${kidAvatar(c, 48)}<div class="grow"><h3 style="margin:0">${esc(c.name)}</h3><p>Bado hajaunganishwa na shule.</p></div></div>
          <div class="form-row" style="margin-top:10px"><input class="field code-in" placeholder="Msimbo kutoka shule" data-code="${c.id}" style="text-transform:uppercase"><button class="btn small" data-link="${c.id}">Unganisha</button></div></div>`);
        continue;
      }
      const r = await Net.get(`/api/children/${c.serverId}/report`);
      const s = r.stats;
      const young = mode === 'toddler' || mode === 'beginner';
      const L = c.learned || {};
      blocks.push(`<div class="card">
        <div class="row">${kidAvatar(c, 52)}<div class="grow"><h3 style="margin:0">${esc(c.name)}</h3><p>${esc(r.child.class_name)}${r.child.teacher ? ' · Mwl. ' + esc(r.child.teacher) : ''}</p></div>
          <button class="btn small ghost" data-msg="${c.serverId}" data-name="${esc(c.name)}">${icon('send', 16)} Mwalimu${s.unread ? ' (' + s.unread + ')' : ''}</button></div>
        ${young ? `<div class="mini-stats">
            <div><b>${(L.colors || []).length}</b>Rangi</div><div><b>${(L.animals || []).length}</b>Wanyama</div><div><b>${(L.letters || []).length}</b>Herufi</div><div><b>${(L.words || []).length}</b>Maneno</div><div><b>${Math.round((Store.usage(c.id).learn || 0) / 60)}</b>Dk leo</div></div>` : ''}
        <div class="mini-stats">
          <div><b>${s.sent}</b>Zilizotumwa</div><div><b>${s.marked}</b>Zimesahihishwa</div><div><b>${s.pending}</b>Hazijafanywa</div><div><b>${s.attendance == null ? '-' : s.attendance + '%'}</b>Mahudhurio</div></div>
        ${s.subjects.length ? `<div style="margin-top:10px">${s.subjects.map(x => `<div class="row" style="justify-content:space-between;margin:6px 0;font-weight:600"><span>${esc(x.name)}</span><span>${x.pct}%</span></div><div class="lvl-bar" style="background:#E8EEF7"><i style="width:${x.pct}%;background:${x.pct >= 75 ? 'var(--teal)' : x.pct >= 50 ? 'var(--sun)' : 'var(--coral)'};box-shadow:none"></i></div>`).join('')}</div>` : ''}
        ${s.upcoming.length ? `<p style="margin-top:12px"><b>Deadline zinazokuja:</b><br>${s.upcoming.map(u => `${esc(u.title)} (${esc(u.subject || '')}) · ${esc(u.due)}`).join('<br>')}</p>` : ''}
        ${s.overdue ? `<p style="color:var(--coral);font-weight:600;margin-top:6px">Homework ${s.overdue} zimepita muda</p>` : ''}
        <div class="ai-card card" style="margin:12px 0 0"><div class="row"><span>${nuruSVG(36)}</span><b class="grow">Ripoti ya Nuru</b><button class="btn small ghost" data-ai="${c.id}">${icon('repeat', 14)} Andaa</button></div>
          <p id="air-${c.id}" style="margin-top:6px">${r.ai ? esc(r.ai.text) : 'Bonyeza "Andaa" kupata muhtasari wa maendeleo na pendekezo la mazoezi.'}</p></div>
        <button class="btn small ghost" data-res="${c.id}" style="margin-top:10px">${icon('file', 16)} Homework na alama</button>
      </div>`);
    }
    body.innerHTML = `
      <div class="card row"><div class="grow"><h3 style="margin:0">${esc(Net.user().name)}</h3><p>${esc(Net.user().phone || Net.user().email || '')}</p></div>
        <button class="btn small ghost" id="bill">${icon('coin', 16)} Malipo</button><button class="icon-btn" id="out">${icon('logout', 18)}</button></div>
      ${blocks.join('') || '<div class="empty">Ongeza mtoto kwanza.</div>'}
      ${anns.length ? `<div class="section-title">Matangazo ya shule</div>${anns.slice(0, 5).map(a => `<div class="card"><h3>${esc(a.title)}</h3><p>${esc(a.body || '')}</p><p class="muted" style="font-size:12px">${esc(a.school || '')} · ${new Date(a.created).toLocaleDateString('sw-TZ')}</p></div>`).join('')}` : ''}
      <button class="btn block ghost small" id="delacct" style="margin-top:10px">${icon('trash', 16)} Futa akaunti ya mtandaoni</button>`;
    $('#delacct', body).onclick = () => confirmBox(body.closest('.screen'), 'Futa akaunti?', 'Taarifa za akaunti na nakala za maendeleo zitafutwa kwenye server. Data iliyo kwenye simu hii itabaki. Watoto walio kwenye shule watabaki kwenye orodha ya shule bila mzazi.', 'Futa kabisa', async () => {
      try { await Net.del('/api/account'); Net.logout(); Store.children().forEach(c => { delete c.serverId; delete c.school; delete c.className; Store.saveChild(c); }); toast('Akaunti imefutwa'); HK.render(); } catch (e) { toast(e.message); }
    });
    $('#out', body).onclick = () => confirmBox(body.closest('.screen'), 'Toka kwenye akaunti?', 'Data ya simu hii itabaki.', 'Toka', () => { Net.logout(); HK.render(); });
    $('#bill', body).onclick = () => HK.go('billing');
    $$('[data-link]', body).forEach(b => b.onclick = async () => {
      const c = Store.child(b.dataset.link), code = $(`[data-code="${c.id}"]`, body).value.trim();
      if (!code) return toast('Weka msimbo');
      try { const r = await Net.post('/api/children/link', { code, child_id: c.serverId }); c.className = r.class_name; c.school = r.school; Store.saveChild(c); Sfx.good(); toast(c.name + ' ameunganishwa na ' + r.school); renderParentSchool(body); } catch (e) { toast(e.message); }
    });
    $$('[data-msg]', body).forEach(b => b.onclick = () => HK.go('thread', { childId: +b.dataset.msg, name: b.dataset.name }));
    $$('[data-res]', body).forEach(b => b.onclick = () => HK.go('parentResults', { id: b.dataset.res }));
    $$('[data-ai]', body).forEach(b => b.onclick = async () => {
      const c = Store.child(b.dataset.ai); const out = $('#air-' + c.id, body);
      out.textContent = 'Nuru anaandaa ripoti...';
      const avg = a => a && a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
      const local = { mode: MODES[kidMode(c)].name, reading: avg((c.skillLog || {}).read), math: avg((c.skillLog || {}).math), learned: Object.fromEntries(Object.entries(c.learned || {}).map(([k, v]) => [k, v.length])) };
      try { const r = await Net.post(`/api/children/${c.serverId}/report/ai`, { local }); out.textContent = r.text; }
      catch (e) {
        if (AI.ready()) { try { out.textContent = await AI.ask({ system: 'Wewe ni mshauri wa elimu anayeandikia mzazi kwa Kiswahili rahisi.', text: `Andika ripoti fupi (sentensi 3) ya ${c.name}: anapofanya vizuri, anapokwama, na pendekezo moja. Takwimu: ${JSON.stringify(local)}`, maxTokens: 300 }); } catch (x) { out.textContent = x.message; } }
        else out.textContent = e.message;
      }
    });
  } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

/* Homework na alama za mtoto (kwa mzazi) */
HK.screens.parentResults = (el, p) => {
  const c = Store.child(p.id);
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(c.name)}: homework</h1></div><div class="scroll" id="b"><div class="empty">Inapakia...</div></div>`;
  $('#bk', el).onclick = () => HK.back();
  Net.get(`/api/children/${c.serverId}/homework`).then(list => {
    const b = $('#b', el);
    b.innerHTML = list.length ? list.map(h => {
      const s = h.submission;
      const tag = !s ? '<span class="chip-tag">Bado</span>' : s.status === 'marked' ? `<span class="chip-tag teal">${s.score}/${s.max_score}</span>` : s.status === 'returned' ? '<span class="chip-tag sun">Irekebishwe</span>' : '<span class="chip-tag coral">Inasubiri mwalimu</span>';
      return `<button class="item" ${s && s.status !== 'submitted' ? `data-s="${s.id}"` : ''}><div class="grow"><div class="i-title">${esc(h.title)}</div><div class="i-sub">${esc(h.subject || '')} · Mwl. ${esc(h.teacher)}${h.due ? ' · hadi ' + esc(h.due) : ''}</div>${s && s.feedback ? `<div class="i-sub" style="color:var(--navy)">"${esc(s.feedback)}"</div>` : ''}</div>${tag}</button>`;
    }).join('') : '<div class="empty">Hakuna homework bado.</div>';
    $$('[data-s]', b).forEach(x => x.onclick = () => HK.go('parentSub', { id: +x.dataset.s }));
  }).catch(e => { $('#b', el).innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
};
HK.screens.parentSub = (el, p) => {
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Kazi iliyosahihishwa</h1></div><div class="scroll" id="b"><div class="empty">Inapakia...</div></div>`;
  $('#bk', el).onclick = () => HK.back();
  Net.get('/api/submissions/' + p.id).then(s => {
    $('#b', el).innerHTML = `<div class="trophy-hero" style="margin:0 0 14px"><div style="font-weight:600">${esc(s.homework.title)}</div><div class="big">${s.score ?? '-'}/${s.max_score}</div><div class="earned" style="margin:8px 0 0">${starsHTML(s.stars || 0, 3, 30)}</div></div>
      ${s.feedback ? `<div class="card"><h3>Maoni ya mwalimu</h3><p>${esc(s.feedback)}</p></div>` : ''}
      ${(s.marked || s.pages || []).map(x => `<img class="review-page" src="${x}">`).join('')}
      ${(s.attachments || []).map(a => /^audio/.test(a.mime) ? `<audio controls src="${Net.fileUrl(a.file)}" style="width:100%"></audio>` : /^video/.test(a.mime) ? `<video controls playsinline src="${Net.fileUrl(a.file)}" style="width:100%;border-radius:12px"></video>` : `<img class="review-page" src="${Net.fileUrl(a.file)}">`).join('')}`;
  }).catch(e => { $('#b', el).innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
};

/* ---------- HUGO TECH: msimamizi mkuu ---------- */
HK.screens.superHome = (el) => {
  const body = dash(el, 'HUGO KID · Msimamizi mkuu', 'HUGO TECH', loading, false, `<button class="icon-btn" id="out">${icon('logout', 20)}</button>`);
  $('#out', el).onclick = () => { Net.logout(); HK.go('welcome', {}, { reset: true }); };
  HK.setBack(() => true);
  (async () => {
    try {
      const [s, b, aiCfg] = await Promise.all([Net.get('/api/admin/stats'), Net.get('/api/billing'), Net.get('/api/admin/ai')]);
      const paid = b.invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
      const st = { unpaid: ['coral', 'Haijalipwa'], pending: ['sun', 'Thibitisha'], paid: ['teal', 'Imelipwa'] };
      body.innerHTML = `<div class="stat-grid">
          ${statCard('Shule', s.schools, 'build', 'var(--blue)')}${statCard('Walimu', s.teachers, 'user', 'var(--teal)')}${statCard('Wazazi', s.parents, 'users', 'var(--coral)')}
          ${statCard('Wanafunzi', s.children, 'star', 'var(--sun-d)')}${statCard('Homework', s.homework, 'file', '#7B61FF')}${statCard('Mapato (TSh)', paid.toLocaleString(), 'coin', 'var(--navy)')}</div>
        <div class="section-title">Shule</div>
        <div class="card table-card"><table><tr><th>Shule</th><th>Eneo</th><th>Wanafunzi</th><th>Hali</th><th></th></tr>
          ${s.list.map(x => `<tr><td>${esc(x.name)}<br><span class="muted">${x.type === 'tutor' ? 'Mwalimu binafsi' : 'Shule'} · ${esc(x.phone || '')}</span></td><td>${esc(x.region || '')} ${esc(x.district || '')}</td><td>${x.students}</td>
            <td><span class="chip-tag ${x.status === 'active' ? 'teal' : 'coral'}">${x.status === 'active' ? 'Hai' : 'Imesimamishwa'}</span></td>
            <td><button class="btn small ghost" data-inv="${x.id}" data-n="${esc(x.name)}">Ankara</button> <button class="btn small ${x.status === 'active' ? 'coral' : ''}" data-st="${x.id}" data-v="${x.status === 'active' ? 'blocked' : 'active'}">${x.status === 'active' ? 'Simamisha' : 'Rudisha'}</button></td></tr>`).join('')}</table></div>
        <div class="section-title">Watumiaji</div>
        <div class="card"><div class="form-row"><div class="seg" style="margin:0;flex:2" id="ur">${[['parent', 'Wazazi'], ['teacher', 'Walimu'], ['school_admin', 'Wakuu wa shule'], ['children', 'Watoto']].map(([k, n], i) => `<button data-r="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</div>
          <input class="field" id="uq" placeholder="Tafuta jina au simu"></div><div id="ul" style="margin-top:10px"></div></div>
        <div class="section-title">Ankara</div>
        ${b.invoices.map(i => `<div class="item" style="cursor:default"><div class="grow"><div class="i-title">${esc(i.school || i.parent || '')} · ${esc(i.plan)} · ${esc(i.period)}</div><div class="i-sub">TSh ${Number(i.amount).toLocaleString()}${i.reference ? ' · ' + esc(i.method || '') + ' ' + esc(i.reference) : ''}</div></div>
          <span class="chip-tag ${st[i.status][0]}">${st[i.status][1]}</span>${i.status !== 'paid' ? `<button class="btn small" data-paid="${i.id}">Imelipwa</button>` : ''}</div>`).join('') || '<p class="muted">Hakuna ankara.</p>'}
        <div class="stat-grid three" style="margin-top:14px">
          <div class="card"><h3>Bei</h3><label class="label">Kwa mwanafunzi kwa muhula (shule)</label><input class="field" id="p1" type="number" value="${b.plans.school_student_term}">
            <label class="label">Mzazi kwa mwezi</label><input class="field" id="p2" type="number" value="${b.plans.parent_month}">
            <label class="label">Maelekezo ya kulipa</label><textarea class="field" id="p3" placeholder="Mfano: M-Pesa Lipa Namba ...">${esc(b.plans.pay_info || '')}</textarea>
            <button class="btn" id="saveplans" style="margin-top:10px">${icon('check', 18)} Hifadhi</button></div>
          <div class="card"><h3>AI ya server</h3><p style="font-size:13px">Inatumika kusahihisha, msaidizi wa mwalimu na ripoti za wazazi. ${aiCfg.has_key ? 'Imewekwa.' : 'Bado haijawekwa.'}</p>
            <select class="field" id="ap">${['gemini', 'claude', 'openai'].map(x => `<option ${aiCfg.provider === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
            <input class="field" id="ak" type="password" placeholder="API key" style="margin-top:8px"><input class="field" id="am" placeholder="Model (si lazima)" value="${esc(aiCfg.model || '')}" style="margin-top:8px">
            <button class="btn" id="saveai" style="margin-top:10px">${icon('check', 18)} Hifadhi</button></div>
          <div class="card"><h3>Akaunti</h3><button class="btn block ghost" id="pw">${icon('key', 18)} Badilisha nenosiri</button></div></div>`;
      $$('[data-st]', body).forEach(x => x.onclick = async () => { await Net.post(`/api/admin/schools/${x.dataset.st}/status`, { status: x.dataset.v }); HK.render(); });
      $$('[data-paid]', body).forEach(x => x.onclick = async () => { await Net.post(`/api/admin/invoices/${x.dataset.paid}/status`, { status: 'paid' }); HK.render(); });
      $$('[data-inv]', body).forEach(x => x.onclick = () => {
        modal(el, { title: 'Ankara: ' + x.dataset.n, html: '<input class="field" id="ia" type="number" placeholder="Kiasi (TSh)"><input class="field" id="ip" placeholder="Kipindi (mf. Muhula 1 2027)" style="margin-top:8px"><div style="height:14px"></div>', buttons: [
          { label: 'Tuma ankara', onClick: async o => { try { await Net.post('/api/admin/invoices', { school_id: +x.dataset.inv, amount: +$('#ia', o).value, period: $('#ip', o).value, plan: 'HUGO KID Shule' }); toast('Ankara imetumwa'); HK.render(); } catch (e) { toast(e.message); } } },
          { label: 'Ghairi', cls: 'ghost' }] });
      });
      $('#saveplans', body).onclick = async () => { await Net.put('/api/admin/plans', { school_student_term: +$('#p1', body).value, parent_month: +$('#p2', body).value, pay_info: $('#p3', body).value }); toast('Imehifadhiwa'); };
      $('#saveai', body).onclick = async () => { await Net.put('/api/admin/ai', { provider: $('#ap', body).value, key: $('#ak', body).value, model: $('#am', body).value }); toast('AI imehifadhiwa'); HK.render(); };
      $('#pw', body).onclick = () => HK.go('changePass');
      let ur = 'parent';
      const loadUsers = async () => {
        const qq = encodeURIComponent($('#uq', body).value || '');
        const box = $('#ul', body); box.innerHTML = '<p class="muted">Inapakia...</p>';
        try {
          if (ur === 'children') {
            const list = await Net.get('/api/admin/children?q=' + qq);
            box.innerHTML = `<div class="table-card" style="padding:0"><table><tr><th>Mtoto</th><th>Shule / darasa</th><th>Mzazi</th></tr>${list.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.school || '-')} ${c.level ? '· ' + esc(c.level + (c.stream ? ' ' + c.stream : '')) : ''}</td><td>${esc(c.parent || '-')} ${esc(c.phone || '')}</td></tr>`).join('')}</table></div>`;
            return;
          }
          const list = await Net.get(`/api/admin/users?role=${ur}&q=${qq}`);
          box.innerHTML = `<div class="table-card" style="padding:0"><table><tr><th>Jina</th><th>Mawasiliano</th><th>${ur === 'parent' ? 'Watoto' : 'Shule'}</th><th></th></tr>${list.map(x => `<tr><td>${esc(x.name)}</td><td>${esc(x.phone || '')} ${esc(x.email || '')}</td><td>${esc(ur === 'parent' ? (x.children || []).join(', ') : (x.school || ''))}</td>
            <td><button class="btn small ghost" data-rst="${x.id}">Nenosiri</button>${ur === 'parent' ? ` <button class="btn small ghost" data-pinv="${x.id}" data-n="${esc(x.name)}">Ankara</button>` : ''}</td></tr>`).join('')}</table></div>`;
          $$('[data-rst]', box).forEach(btn => btn.onclick = async () => { const r = await Net.post(`/api/admin/users/${btn.dataset.rst}/reset`); modal(el, { iconName: 'key', title: 'Nenosiri la muda', html: `<p>${esc(r.login)}</p><p style="font-size:22px;font-weight:700">${esc(r.password)}</p><div style="height:10px"></div>`, buttons: [{ label: 'Sawa' }] }); });
          $$('[data-pinv]', box).forEach(btn => btn.onclick = () => modal(el, { title: 'Ankara: ' + btn.dataset.n, html: '<input class="field" id="ia" type="number" placeholder="Kiasi (TSh)"><input class="field" id="ip" placeholder="Kipindi (mf. Desemba 2026)" style="margin-top:8px"><div style="height:14px"></div>', buttons: [
            { label: 'Tuma ankara', onClick: async o => { try { await Net.post('/api/admin/invoices', { parent_id: +btn.dataset.pinv, amount: +$('#ia', o).value, period: $('#ip', o).value, plan: 'HUGO KID Mzazi' }); toast('Ankara imetumwa'); } catch (e) { toast(e.message); } } },
            { label: 'Ghairi', cls: 'ghost' }] }));
        } catch (e) { box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
      };
      $$('#ur button', body).forEach(btn => btn.onclick = () => { ur = btn.dataset.r; $$('#ur button', body).forEach(x => x.classList.toggle('on', x === btn)); loadUsers(); });
      let tmr; $('#uq', body).oninput = () => { clearTimeout(tmr); tmr = setTimeout(loadUsers, 300); };
      loadUsers();
    } catch (e) { body.innerHTML = errBox(e); }
  })();
};
