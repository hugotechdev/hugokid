

async function renderParentSchool(body) {
  if (Net.role() !== 'parent' || Net.accessScreen()) return;
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
        blocks.push(`<div class="card"><div class="row">${kidAvatar(c, 48)}<div class="grow"><h3 style="margin:0">${esc(c.name)}</h3><p>Not linked to a school yet.</p></div></div>
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
        <div class="ai-card card" style="margin:12px 0 0"><div class="row"><span>${mascot('nuru', 36)}</span><b class="grow">Nuru's report</b><button class="btn small ghost" data-ai="${c.id}">${icon('repeat', 14)} Andaa</button></div>
          <p id="air-${c.id}" style="margin-top:6px">${r.ai ? esc(r.ai.text) : "Tap \"Prepare\" to get a progress summary and a practice suggestion."}</p></div>
        <button class="btn small ghost" data-res="${c.id}" style="margin-top:10px">${icon('file', 16)} Homework na alama</button>
      </div>`);
    }
    body.innerHTML = `
      <div class="card row"><div class="grow"><h3 style="margin:0">${esc(Net.user().name)}</h3><p>${esc(Net.user().phone || Net.user().email || '')}</p></div>
        <button class="btn small ghost" id="bill">${icon('coin', 16)} Malipo</button><button class="icon-btn" id="out">${icon('logout', 18)}</button></div>
      ${blocks.join('') || '<div class="empty">Ongeza mtoto kwanza.</div>'}
      ${anns.length ? `<div class="section-title">School announcements</div>${anns.slice(0, 5).map(a => `<div class="card"><h3>${esc(a.title)}</h3><p>${esc(a.body || '')}</p><p class="muted" style="font-size:12px">${esc(a.school || '')} · ${new Date(a.created).toLocaleDateString('sw-TZ')}</p></div>`).join('')}` : ''}
      <button class="btn block ghost small" id="delacct" style="margin-top:10px">${icon('trash', 16)} Futa akaunti ya mtandaoni</button>`;
    $('#delacct', body).onclick = () => confirmBox(body.closest('.screen'), "Delete account?", "Account details and progress backups will be deleted from the server. Data on this phone will remain. Children in schools will stay on the school list without a parent.", "Delete permanently", async () => {
      try { await Net.del('/api/account'); Store.children().forEach(c => { delete c.serverId; delete c.school; delete c.className; Store.saveChild(c); }); Net.clearSession(); routeByRole(); toast("Account deleted"); } catch (e) { toast(e.message); }
    });
    $('#out', body).onclick = () => confirmBox(body.closest('.screen'), "Sign out of the account?", "You will need the internet to sign in again.", "Sign out", () => { Net.logout(); routeByRole(); });
    $('#bill', body).onclick = () => HK.go('billing');
    $$('[data-link]', body).forEach(b => b.onclick = async () => {
      const c = Store.child(b.dataset.link), code = $(`[data-code="${c.id}"]`, body).value.trim();
      if (!code) return toast("Enter a code");
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
        if (AI.ready()) { try { out.textContent = await AI.ask({ system: 'Write to the parent in clear, simple English.', text: `Andika ripoti fupi (sentensi 3) ya ${c.name}: anapofanya vizuri, anapokwama, na pendekezo moja. Takwimu: ${JSON.stringify(local)}`, maxTokens: 300 }); } catch (x) { out.textContent = x.message; } }
        else out.textContent = e.message;
      }
    });
  } catch (e) { body.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

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
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Marked work</h1></div><div class="scroll" id="b"><div class="empty">Inapakia...</div></div>`;
  $('#bk', el).onclick = () => HK.back();
  Net.get('/api/submissions/' + p.id).then(s => {
    $('#b', el).innerHTML = `<div class="trophy-hero" style="margin:0 0 14px"><div style="font-weight:600">${esc(s.homework.title)}</div><div class="big">${s.score ?? '-'}/${s.max_score}</div><div class="earned" style="margin:8px 0 0">${starsHTML(s.stars || 0, 3, 30)}</div></div>
      ${s.feedback ? `<div class="card"><h3>Teacher's comments</h3><p>${esc(s.feedback)}</p></div>` : ''}
      ${(s.marked || s.pages || []).map(x => `<img class="review-page" src="${esc(x)}">`).join('')}
      ${(s.attachments || []).map(a => /^audio/.test(a.mime) ? `<audio controls src="${Net.fileUrl(a.file)}" style="width:100%"></audio>` : /^video/.test(a.mime) ? `<video controls playsinline src="${Net.fileUrl(a.file)}" style="width:100%;border-radius:12px"></video>` : `<img class="review-page" src="${Net.fileUrl(a.file)}">`).join('')}`;
  }).catch(e => { $('#b', el).innerHTML = `<div class="empty">${esc(e.message)}</div>`; });
};

HK.screens.superHome = (el) => {
  const body = dash(el, 'HUGO KID · Admin', 'HUGO TECH', loading, false, `<button class="icon-btn" id="out">${icon('logout', 20)}</button>`);
  $('#out', el).onclick = () => { Net.logout(); HK.go('welcome', {}, { reset: true }); };
  HK.setBack(() => true);
  (async () => {
    try {
      const [s, b, aiCfg, ttsCfg] = await Promise.all([Net.get('/api/admin/stats'), Net.get('/api/billing'), Net.get('/api/admin/ai'), Net.get('/api/admin/tts')]);
      const paid = b.invoices.filter(i => i.status === 'paid').reduce((a, i) => a + i.amount, 0);
      const st = { unpaid: ['coral', 'Unpaid'], pending: ['sun', 'Awaiting verification'], paid: ['teal', 'Paid'] };
      const accessLabels = { active: 'Active', pending: 'Awaiting payment', blocked: 'Suspended' };
      const accessAction = status => status === 'active' ? 'Suspend' : status === 'pending' ? 'Approve account' : 'Activate';
      body.innerHTML = `<div class="stat-grid">
          ${statCard('School', s.schools, 'build', 'var(--blue)')}${statCard('Teachers', s.teachers, 'user', 'var(--teal)')}${statCard('Parents', s.parents, 'users', 'var(--coral)')}
          ${statCard('Students', s.children, 'star', 'var(--sun-d)')}${statCard('Homework', s.homework, 'file', '#7B61FF')}${statCard('Revenue (TSh)', paid.toLocaleString(), 'coin', 'var(--navy)')}</div>
        <div class="section-title">Schools</div><input class="field" id="school-search" aria-label="Search schools" placeholder="Search school name or phone"><div id="school-bulk"></div>
        <div class="card table-card"><table><tr><th>School</th><th>Location</th><th>Students</th><th>Status</th><th></th></tr>
          ${s.list.map(x => `<tr data-search="${esc(x.name + ' ' + (x.phone || ''))}"><td><input type="checkbox" data-customer-school="${x.id}" aria-label="Select ${esc(x.name)}"> ${esc(x.name)}<br><span class="muted">${x.type === 'tutor' ? 'Tutor' : 'School'} · ${esc(x.phone || '')}</span></td><td>${esc(x.region || '')} ${esc(x.district || '')}</td><td>${x.students}</td>
            <td><span class="chip-tag ${x.status === 'active' ? 'teal' : 'coral'}">${x.registration_pending ? 'Registration incomplete' : accessLabels[x.status] || 'Unknown'}</span></td>
            <td>${x.registration_pending ? '' : `<button class="btn small ghost" data-inv="${x.id}" data-n="${esc(x.name)}">Invoice</button> <button class="btn small ${x.status === 'active' ? 'coral' : ''}" data-st="${x.id}" data-v="${x.status === 'active' ? 'blocked' : 'active'}">${accessAction(x.status)}</button>`}</td></tr>`).join('')}</table></div>
        <div class="section-title">Users</div>
        <div class="card"><div class="form-row"><div class="seg" style="margin:0;flex:2" id="ur">${[['parent', 'Parents'], ['teacher', 'Teachers'], ['school_admin', 'School admins'], ['children', 'Children']].map(([k, n], i) => `<button data-r="${k}" class="${i ? '' : 'on'}">${n}</button>`).join('')}</div>
          <input class="field" id="uq" aria-label="Search users" placeholder="Search name, phone or email"></div><div id="ul" style="margin-top:10px"></div></div>
        <div class="section-title">Invoices</div>
        ${b.invoices.map(i => `<div class="item admin-invoice"><div class="grow"><div class="i-title">${esc(i.school || i.parent || '')} · ${esc(i.plan)} · ${esc(i.period)}</div><div class="i-sub">TSh ${Number(i.amount).toLocaleString()}</div>${invoicePaymentDetails(i)}</div>
           ${i.has_receipt ? `<button class="btn small ghost" data-receipt="${i.id}">View receipt</button>` : ''}
           ${i.phone ? `<button class="btn small ghost" data-share="${i.id}">WhatsApp</button>` : ''}<span class="chip-tag ${st[i.status][0]}">${st[i.status][1]}</span>${i.status !== 'paid' ? `<button class="btn small" data-paid="${i.id}" >Confirm payment & activate</button>` : ''}</div>`).join('') || '<p class="muted">No invoices yet.</p>'}
        <div class="stat-grid three" style="margin-top:14px">
          <div class="card"><h3>Pricing</h3><label class="label">Per student per term (school)</label><input class="field" id="p1" type="number" value="${b.plans.school_student_term}">
            <label class="label">Parent per month</label><input class="field" id="p2" type="number" value="${b.plans.parent_month}">
            <label class="label">Payment instructions</label><textarea class="field" id="p3" placeholder="Example: M-Pesa payment number">${esc(b.plans.pay_info || '')}</textarea>
            <button class="btn" id="saveplans" style="margin-top:10px">${icon('check', 18)} Save</button></div>
          <div class="card"><h3>Server AI</h3><p style="font-size:13px">Used to mark work and support teachers and parent reports. ${aiCfg.has_key ? 'Enabled.' : 'Setup needed.'}</p>
            <select class="field" id="ap">${['gemini', 'claude', 'openai'].map(x => `<option ${aiCfg.provider === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
            <input class="field" id="ak" type="password" placeholder="API key" style="margin-top:8px"><input class="field" id="am" placeholder="Model (optional)" value="${esc(aiCfg.model || '')}" style="margin-top:8px">
            <button class="btn" id="saveai" style="margin-top:10px">${icon('check', 18)} Save</button></div>
          <div class="card"><h3>Nuru's voice</h3><p style="font-size:13px">Imani is the English (Tanzania) narration voice. When Azure is unavailable, the app uses the device’s English voice. ${ttsCfg.has_key ? 'Enabled.' : 'Setup needed.'}</p>
            <input class="field" id="tr" placeholder="Region (e.g. westeurope)" value="${esc(ttsCfg.region || '')}">
            <input class="field" id="tk" type="password" placeholder="Speech key" style="margin-top:8px">
            <div class="btn-row" style="margin-top:10px"><button class="btn" id="savetts">${icon('check', 18)} Save</button><button class="btn ghost" id="testtts">${icon('volume', 18)} Test voice</button></div></div>
          <div class="card"><h3>Android download</h3>
            <p>Publish a signed HUGO KID APK using the same signing key as the previous public version.</p>
            <label class="label" for="android-apk">Android APK</label>
            <input class="field" type="file" accept=".apk,application/vnd.android.package-archive" id="android-apk">
            <button class="btn" id="publish-apk" style="margin-top:10px">Publish APK</button>
            <p id="apk-status" role="status" class="muted" style="margin-top:8px"></p></div>
          <div class="card"><h3>Account</h3><button class="btn block ghost" id="pw">${icon('key', 18)} Change password</button></div></div>`;
      const bulk = (tools, scope, kind) => {
        tools.innerHTML = '<div class="chips"><button class="chip" data-action="active">Activate selected</button><button class="chip" data-action="blocked">Suspend selected</button><button class="chip" data-action="message">Message selected</button></div>';
        $$('[data-action]', tools).forEach(button => button.onclick = () => {
          const ids = $$('[data-customer-' + kind + ']:checked', scope).map(input => +input.getAttribute('data-customer-' + kind));
          if (!ids.length) return toast('Select customers first.');
          const action = button.dataset.action;
          modal(el, { title: button.textContent + ' (' + ids.length + ')', html: action === 'message' ? '<textarea id="notice" class="field" maxlength="2000" placeholder="Write a notification"></textarea>' : '',
            buttons: [{ label: action === 'message' ? 'Send message' : 'Confirm', keepOpen: true, onClick: async o => {
              const submit = o.querySelector('.btn'); submit.disabled = true;
              try { await Net.post('/api/admin/customers/action', { kind, ids, action, message: o.querySelector('#notice')?.value }); o.remove(); HK.render(); }
              catch (error) { toast(error.message); } finally { submit.disabled = false; }
            } }, { label: 'Cancel', cls: 'ghost' }] });
        });
      };
      bulk($('#school-bulk', body), body, 'school');
      $('#school-search', body).oninput = e => $$('tr[data-search]', body).forEach(row => {
        row.hidden = !row.dataset.search.toLowerCase().includes(e.target.value.trim().toLowerCase());
        if (row.hidden) row.querySelector('input').checked = false;
      });
      $$('[data-share]', body).forEach(button => button.onclick = () => {
        const invoice = b.invoices.find(item => item.id === +button.dataset.share);
        let phone = String(invoice.phone).replace(/\D/g, '').replace(/^00/, '');
        if (/^0\d{9}$/.test(phone)) phone = '255' + phone.slice(1);
        if (!/^[1-9]\d{7,14}$/.test(phone)) return toast('Check the customer phone number.');
        const text = ['HUGO KID invoice #' + invoice.id, invoice.school || invoice.parent, invoice.plan, invoice.period, 'TSh ' + Number(invoice.amount).toLocaleString(), st[invoice.status][1], b.plans.pay_info].filter(Boolean).join('\n');
        Net.openExternal('https://wa.me/' + phone + '?text=' + encodeURIComponent(text));
      });
      $$('[data-st]', body).forEach(x => x.onclick = async () => { try { await Net.post(`/api/admin/schools/${x.dataset.st}/status`, { status: x.dataset.v }); HK.render(); }
        catch (error) { toast(error.message); } });
      bindReceiptButtons(el, body);
      $$('[data-paid]', body).forEach(x => x.onclick = () => confirmBox(el,
        'Confirm payment?', 'Confirm only after verifying the amount and the receipt or transaction reference. This activates account access.', 'Confirm and activate',
        async () => {
          try { await Net.post(`/api/admin/invoices/${x.dataset.paid}/status`, { status: 'paid' }); HK.render(); }
          catch (error) { toast(error.message); }
        }, 'teal'));
      $$('[data-inv]', body).forEach(x => x.onclick = () => {
        modal(el, { title: 'Invoice: ' + x.dataset.n, html: '<input class="field" id="ia" type="number" placeholder="Amount (TSh)"><input class="field" id="ip" placeholder="Period (e.g. Term 1)" style="margin-top:8px"><div style="height:14px"></div>', buttons: [
          { label: 'Send invoice', onClick: async o => { try { await Net.post('/api/admin/invoices', { school_id: +x.dataset.inv, amount: +$('#ia', o).value, period: $('#ip', o).value, plan: 'HUGO KID School' }); toast("Invoice sent"); HK.render(); } catch (e) { toast(e.message); } } },
          { label: 'Cancel', cls: 'ghost' }] });
      });
      $('#saveplans', body).onclick = async () => { await Net.put('/api/admin/plans', { school_student_term: +$('#p1', body).value, parent_month: +$('#p2', body).value, pay_info: $('#p3', body).value }); toast("Saved"); };
      $('#saveai', body).onclick = async () => { await Net.put('/api/admin/ai', { provider: $('#ap', body).value, key: $('#ak', body).value, model: $('#am', body).value }); toast("AI saved"); HK.render(); };
      $('#savetts', body).onclick = async () => { await Net.put('/api/admin/tts', { region: $('#tr', body).value, key: $('#tk', body).value }); await Voice.check(); toast("Saved"); HK.render(); };
      $('#testtts', body).onclick = async () => {
        await Voice.check();
        if (!Voice.enabled) return toast("Enter the region and key first");
        speak('Hi! I’m Nuru. Tap one mango. Well done! Now add a second mango.');
      };
      const apkStatus = $('#apk-status', body);
      const apkButton = $('#publish-apk', body);
      const showApkStatus = ({ available }) => {
        apkStatus.textContent = available ? 'The APK is available on the download page.' : 'No APK has been published yet.';
      };
      Net.get('/api/android-download').then(status => {
        if (!apkButton.disabled) showApkStatus(status);
      }).catch(() => {});
      apkButton.onclick = async () => {
        const file = $('#android-apk', body).files[0];
        if (!file || !/\.apk$/i.test(file.name) || file.size > 40 * 1024 * 1024) {
          apkStatus.textContent = 'Choose an APK file of up to 40 MB.';
          return;
        }
        apkButton.disabled = true;
        apkStatus.textContent = 'Publishing…';
        try {
          const response = await fetch(Net.base() + '/api/admin/android-download', {
            method: 'POST',
            headers: { Authorization: 'Bearer ' + Net.token(), 'Content-Type': 'application/vnd.android.package-archive' },
            body: file,
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Upload failed.');
          showApkStatus(result);
          $('#android-apk', body).value = '';
        } catch (error) {
          apkStatus.textContent = error.message;
        } finally {
          apkButton.disabled = false;
        }
      };
      $('#pw', body).onclick = () => HK.go('changePass');
      let ur = 'parent', searchId = 0;
      const loadUsers = async () => {
        const requestId = ++searchId;
        const qq = encodeURIComponent($('#uq', body).value || '');
        const box = $('#ul', body); box.innerHTML = '<p class="muted">Loading…</p>';
        try {
          if (ur === 'children') {
            const list = await Net.get('/api/admin/children?q=' + qq);
            if (requestId !== searchId) return;
            box.innerHTML = `<div class="table-card" style="padding:0"><table><tr><th>Child</th><th>School / class</th><th>Parent</th></tr>${list.map(c => `<tr><td>${esc(c.name)}</td><td>${esc(c.school || '-')} ${c.level ? '· ' + esc(c.level + (c.stream ? ' ' + c.stream : '')) : ''}</td><td>${esc(c.parent || '-')} ${esc(c.phone || '')}</td></tr>`).join('')}</table></div>`;
            return;
          }
          const role = ur;
          const list = await Net.get(`/api/admin/users?role=${role}&q=${qq}`);
          if (requestId !== searchId) return;
          box.innerHTML = `<div class="table-card" style="padding:0"><div id="parent-bulk"></div><table><tr><th>Name</th><th>Contact</th><th>${ur === 'parent' ? 'Children' : 'School'}</th><th>Access</th><th></th></tr>${list.map(x => `<tr><td>${ur === 'parent' ? `<input type="checkbox" data-customer-parent="${x.id}" aria-label="Select ${esc(x.name)}">` : ''} ${esc(x.name)}</td><td>${esc(x.phone || '')} ${esc(x.email || '')}</td><td>${esc(ur === 'parent' ? (x.children || []).join(', ') : (x.school || ''))}</td>
            <td>${x.registration_pending ? 'Registration incomplete' : accessLabels[x.school_status || x.access_status] || 'Unknown'}
              ${x.matches?.length ? `<details><summary>Possible duplicate</summary>
                ${x.matches.map(match => `<p>Same ${esc(match.field)}: ${match.accounts.map(account => esc(account.name) + ' (#' + account.id + ', ' + esc(account.role) + ')').join(', ')}</p>`).join('')}
              </details>` : ''}</td>
            <td>${ur === 'parent' && !x.registration_pending ? `<button class="btn small ${x.access_status === 'active' ? 'coral' : ''}" data-parent-access="${x.id}" data-status="${x.access_status === 'active' ? 'blocked' : 'active'}">${accessAction(x.access_status)}</button> ` : ''}${x.role === 'teacher' || (!x.email && (x.school_status || x.access_status) === 'active') ? `<button class="btn small ghost" data-rst="${x.id}">Recover password</button>` : ''}${ur === 'parent' && !x.registration_pending ? ` <button class="btn small ghost" data-pinv="${x.id}" data-n="${esc(x.name)}">Invoice</button>` : ''}</td></tr>`).join('')}</table></div>`;
          if (ur === 'parent') bulk($('#parent-bulk', box), box, 'parent');
          $$('[data-parent-access]', box).forEach(btn => btn.onclick = async () => {
            try {
              await Net.post(`/api/admin/parents/${btn.dataset.parentAccess}/status`, { status: btn.dataset.status });
              await loadUsers();
            } catch (error) { toast(error.message); }
          });
          $$('[data-rst]', box).forEach(btn => btn.onclick = () => confirmBox(el,
            'Recover password?', 'Only continue if the user requested help signing in. This replaces their current password.',
            'Create temporary password', async () => {
              try {
                const result = await Net.post(`/api/admin/users/${btn.dataset.rst}/reset`);
                modal(el, { iconName: 'key', title: 'Temporary password', html: `<p>${esc(result.login)}</p><p style="font-size:22px;font-weight:700">${esc(result.password)}</p>`, buttons: [{ label: 'OK' }] });
              } catch (error) { toast(error.message); }
            }));
          $$('[data-pinv]', box).forEach(btn => btn.onclick = () => modal(el, { title: 'Invoice: ' + btn.dataset.n, html: '<input class="field" id="ia" type="number" placeholder="Amount (TSh)"><input class="field" id="ip" placeholder="Period (e.g. December)" style="margin-top:8px"><div style="height:14px"></div>', buttons: [
            { label: 'Send invoice', onClick: async o => { try { await Net.post('/api/admin/invoices', { parent_id: +btn.dataset.pinv, amount: +$('#ia', o).value, period: $('#ip', o).value, plan: 'HUGO KID Parent' }); toast("Invoice sent"); HK.render(); } catch (e) { toast(e.message); } } },
            { label: 'Cancel', cls: 'ghost' }] }));
        } catch (e) { if (requestId === searchId) box.innerHTML = `<p class="muted">${esc(e.message)}</p>`; }
      };
      $$('#ur button', body).forEach(btn => btn.onclick = () => { ur = btn.dataset.r; $$('#ur button', body).forEach(x => x.classList.toggle('on', x === btn)); loadUsers(); });
      let tmr; $('#uq', body).oninput = () => { searchId++; clearTimeout(tmr); tmr = setTimeout(loadUsers, 300); };
      loadUsers();
    } catch (e) { body.innerHTML = errBox(e); }
  })();
};

function bindCustomerNotices(el) {
  const button = $('#customer-notices', el);
  if (!button) return;
  if (Net.online() && !Net.accessScreen()) Net.connect();
  const load = () => Net.get('/api/customer/notices');
  const refresh = () => load().then(rows => {
    button.textContent = rows.some(r => !r.seen) ? 'Notifications •' : 'Notifications';
  }).catch(() => {});
  refresh();
  const onNotice = () => {
    if (!button.isConnected) return;
    refresh();
    toast('New message from HUGO TECH');
  };
  button.addEventListener('customer-notice', onNotice);
  button.onclick = async () => {
    try {
      const rows = await load();
      modal(el, { title: 'Notifications', html: rows.map(r => `<div class="card"><small>${esc(new Date(r.created).toLocaleDateString())}</small><p>${esc(r.body)}</p></div>`).join('') || '<p>No messages yet.</p>', buttons: [{ label: 'Close' }] });
      if (rows.length) await Net.post('/api/customer/notices/read', { through: rows[0].id });
      refresh();
    } catch (error) { toast(error.message); }
  };
}
