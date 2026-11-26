/* HUGO KID - parent.js : karibu, PIN, wasifu wa mtoto, eneo la mzazi */

/* ---------- PIN ---------- */
HK.screens.pin = (el, p) => {
  const mode = p.mode || 'verify'; // create | verify | change
  let step = mode === 'verify' ? 'verify' : 'new';
  let first = '';
  let pin = '';
  let tries = 0;

  const titles = {
    verify: ['Eneo la Mzazi', 'Weka PIN yako ya tarakimu 4'],
    new: [mode === 'change' ? 'PIN mpya' : 'Tengeneza PIN ya mzazi', 'Tarakimu 4. Mtoto asiijue.'],
    confirm: ['Rudia PIN', 'Weka PIN ile ile tena'],
  };

  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1></h1></div>
    <div class="center-col" style="justify-content:flex-start;padding-top:20px">
      <div class="big-ic" style="background:var(--navy);margin-bottom:12px">${icon('lock', 46, 2.4)}</div>
      <div class="pin-title"></div>
      <div class="pin-sub"></div>
      <div class="pin-dots"><i></i><i></i><i></i><i></i></div>
      <div class="pin-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-n="${n}">${n}</button>`).join('')}
        <button class="blank"></button><button data-n="0">0</button>
        <button data-del="1">${icon('back', 28)}</button>
      </div>
      ${mode === 'verify' ? '<button class="btn small ghost" id="forgot" style="margin-top:22px">Umesahau PIN?</button>' : ''}
    </div>`;
  const fg = $('#forgot', el);
  if (fg) fg.onclick = () => {
    const u = Net.user();
    if (!(u && u.role === 'parent')) return modal(el, { iconName: 'lock', title: 'Kurejesha PIN', text: 'PIN inarejeshwa kwa nenosiri la akaunti ya mzazi. Kama hukufungua akaunti, njia pekee ni kufuta data ya HUGO KID kwenye mipangilio ya simu (maendeleo ya simu hii yatapotea, lakini yaliyo kwenye akaunti yanarudi).', buttons: [{ label: 'Sawa' }] });
    modal(el, { iconName: 'key', title: 'Thibitisha ni wewe', html: `<p>Weka nenosiri la akaunti ya ${esc(u.phone || u.email)}</p><input class="field" id="apw" type="password"><div style="height:14px"></div>`, buttons: [
      { label: 'Endelea', keepOpen: true, onClick: async o => {
        try { await Net.post('/api/login', { login: u.phone || u.email, password: $('#apw', o).value }); o.remove(); HK.go('pin', { mode: 'change' }, { replace: true }); }
        catch (e) { toast('Nenosiri si sahihi'); }
      } },
      { label: 'Ghairi', cls: 'ghost' }] });
  };
  if (mode === 'create') $('#bk', el).classList.add('hidden');
  $('#bk', el).onclick = () => HK.back();

  const dots = $$('.pin-dots i', el);
  const draw = () => {
    const [t, s] = titles[step];
    $('.pin-title', el).textContent = t;
    $('.pin-sub', el).textContent = s;
    dots.forEach((d, i) => d.classList.toggle('on', i < pin.length));
  };
  const fail = (msg) => {
    const box = $('.pin-dots', el);
    box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
    vibrate(120);
    pin = ''; draw();
    $('.pin-sub', el).textContent = msg;
  };

  const done = async () => {
    if (step === 'verify') {
      const h = await hashPin(pin);
      if (h === (Store.parent() || {}).pinHash) {
        Sfx.good();
        HK.go(p.next || 'parentHome', p.nextParams || {}, { replace: true });
      } else {
        tries++;
        fail(tries >= 3 ? 'Si sahihi. Jaribu tena baadaye kidogo.' : 'PIN si sahihi');
      }
      return;
    }
    if (step === 'new') { first = pin; pin = ''; step = 'confirm'; draw(); return; }
    if (step === 'confirm') {
      if (pin !== first) { step = 'new'; first = ''; return fail('Hazikulingana, anza upya'); }
      const h = await hashPin(pin);
      const par = Store.parent() || { created: Date.now(), settings: {} };
      par.pinHash = h;
      Store.saveParent(par);
      Sfx.good();
      if (mode === 'create') {
        if (Net.online()) HK.boot();
        else HK.go('acctAuth', { kind: 'parent', tab: 'register', skip: true, next: 'childForm', nextParams: { first: true } }, { reset: true });
      }
      else { toast('PIN imebadilishwa'); HK.back(); }
    }
  };

  $$('.pin-pad button', el).forEach(b => b.onclick = () => {
    if (b.dataset.del) { pin = pin.slice(0, -1); draw(); return; }
    if (!b.dataset.n || pin.length >= 4) return;
    Sfx.tap();
    pin += b.dataset.n; draw();
    if (pin.length === 4) setTimeout(done, 150);
  });
  draw();
};

/* ---------- Wasifu wa mtoto ---------- */
HK.screens.childForm = (el, p) => {
  const editing = p.id ? Store.child(p.id) : null;
  const c = editing ? { ...editing } : {
    id: uid(), name: '', birth: '', color: AVATAR_COLORS[Store.children().length % AVATAR_COLORS.length],
    religion: 'values', faithOn: true, grade: '', lang: I18N.lang, needs: [], stars: 0, coins: 0, created: Date.now(),
  };
  c.needs = c.needs || [];
  const AGES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const used = Store.children().filter(k => k.id !== c.id).map(k => k.avatar);
  if (!editing) c.avatar = KID_AVATARS.find(a => !used.includes(a)) || KID_AVATARS[0];
  let age0 = c.birth ? Math.min(13, Math.max(3, ageYears(c.birth))) : 0;
  const chipRow = (id, items, isOn) => `<div class="chips" id="${id}">${items.map(([v, l]) => `<button class="chip ${isOn(v) ? 'on' : ''}" data-v="${esc(v)}">${esc(l)}</button>`).join('')}</div>`;

  el.innerHTML = `
    <div class="topbar">
      ${p.first ? '' : `<button class="icon-btn" id="bk">${icon('back')}</button>`}
      <h1>${editing ? 'Hariri wasifu' : (p.first ? 'Mtoto wako' : 'Ongeza mtoto')}</h1>
    </div>
    <div class="scroll">
      ${p.first ? '<div class="card"><p>Programu itajipanga kulingana na umri na uwezo wa mtoto.</p></div>' : ''}
      <label class="label">Jina la mtoto</label>
      <input class="field" id="name" maxlength="20" placeholder="Mfano: Amani" value="${esc(c.name)}">

      <label class="label">Umri wa mtoto</label>
      <div class="chips age-chips" id="age">${AGES.map(a => `<button class="chip ${age0 === a ? 'on' : ''}" data-v="${a}">${a === 13 ? '13+' : a}</button>`).join('')}</div>
      <div id="grp" style="margin-top:10px"></div>

      <label class="label">Darasa</label>
      <select class="field" id="grade">${GRADES.map(g => `<option ${c.grade === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>

      <label class="label">Lugha ya kujifunzia</label>
      ${chipRow('lang', [['sw', 'Kiswahili'], ['en', 'English']], v => c.lang === v)}

      <label class="label">Avatar yake (ataigusa kuingia)</label>
      <div class="avatar-pick">${KID_AVATARS.map(id => `<button data-a="${id}" class="${c.avatar === id ? 'on' : ''}">${kidAvatar({ ...c, avatar: id, acc: '' }, 54)}</button>`).join('')}</div>

      <label class="label">Sehemu ya imani</label>
      ${chipRow('fon', [['1', 'Iwepo'], ['0', 'Isiwepo']], v => (v === '1') === faithOn(c))}
      <div id="relbox" class="${faithOn(c) ? '' : 'hidden'}" style="margin-top:10px">
        ${chipRow('rel', Object.entries(RELIGIONS).map(([k, r]) => [k, r.name]), v => c.religion === v)}
      </div>

      <label class="label">Mahitaji maalum (kama yapo)</label>
      ${chipRow('needs', Object.entries(NEEDS), v => c.needs.includes(v))}

      <div style="height:22px"></div>
      <button class="btn block" id="save">${icon('check', 22)} Hifadhi</button>
      ${editing ? '' : `<div style="height:12px"></div><button class="btn block ghost" id="more">${icon('plus', 20)} Hifadhi na ongeza mtoto mwingine</button>`}
      ${editing ? `<div style="height:12px"></div><button class="btn block ghost" id="place">${icon('repeat', 20)} Pima uwezo tena</button>` : ''}
      ${editing && Store.children().length > 1 ? `<div style="height:12px"></div><button class="btn block ghost" id="del">${icon('trash', 20)} Futa wasifu huu</button>` : ''}
    </div>`;

  const bk = $('#bk', el); if (bk) bk.onclick = () => HK.back();
  /* umri unageuzwa kuwa tarehe ya kukadiria, ili mtoto akue mwenyewe kila mwaka */
  const birthFor = a => { const d = new Date(); d.setFullYear(d.getFullYear() - a); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10); };
  const showMode = () => {
    if (!age0) { $('#grp', el).innerHTML = ''; return; }
    const m = kidMode({ ...c, birth: birthFor(age0) });
    $('#grp', el).innerHTML = `<span class="chip-tag teal">${esc(MODES[m].name)} · Miaka ${age0}</span>`;
  };
  $$('#age .chip', el).forEach(b => b.onclick = () => { Sfx.tap(); age0 = +b.dataset.v; $$('#age .chip', el).forEach(x => x.classList.toggle('on', x === b)); showMode(); });
  showMode();
  const single = (id, fn) => $$('#' + id + ' .chip', el).forEach(b => b.onclick = () => { Sfx.tap(); fn(b.dataset.v); $$('#' + id + ' .chip', el).forEach(x => x.classList.toggle('on', x === b)); });
  single('lang', v => { c.lang = v; });
  single('fon', v => { c.faithOn = v === '1'; $('#relbox', el).classList.toggle('hidden', !c.faithOn); });
  single('rel', v => { c.religion = v; });
  $$('#needs .chip', el).forEach(b => b.onclick = () => {
    const v = b.dataset.v; Sfx.tap();
    c.needs = c.needs.includes(v) ? c.needs.filter(x => x !== v) : [...c.needs, v];
    b.classList.toggle('on', c.needs.includes(v));
  });
  $$('.avatar-pick button', el).forEach(b => b.onclick = () => {
    Sfx.tap(); c.avatar = b.dataset.a; c.color = AVATAR_COLORS[(+b.dataset.a - 1) % AVATAR_COLORS.length];
    $$('.avatar-pick button', el).forEach(x => x.classList.toggle('on', x === b));
  });

  const save = (another) => {
    c.name = $('#name', el).value.trim();
    c.grade = $('#grade', el).value;
    if (!c.name) return toast('Andika jina la mtoto');
    if (!age0) return toast('Chagua umri wa mtoto');
    if (!c.birth || Math.min(13, Math.max(3, ageYears(c.birth))) !== age0) c.birth = birthFor(age0);
    Store.saveChild(c);
    if (Net.online() && Net.role() === 'parent') SchoolSync.pushChildren().catch(() => {});
    Sfx.good();
    if (editing) return HK.back();
    if (another) {
      toast(c.name + ' ameongezwa');
      return HK.go('childForm', { first: p.first }, { replace: true });
    }
    /* watoto zaidi ya mmoja: kila mmoja anaingia kwa kugusa avatar yake */
    if (Store.children().length > 1) return HK.go('pickChild', {}, { reset: true });
    Store.setActive(c.id); c.placeAsked = true; Store.saveChild(c);
    return HK.go('placement', {}, { reset: !!p.first });
  };
  $('#save', el).onclick = () => save(false);
  const more = $('#more', el); if (more) more.onclick = () => save(true);
  const pl = $('#place', el); if (pl) pl.onclick = () => { Store.setActive(c.id); HK.go('placement'); };
  const del = $('#del', el);
  if (del) del.onclick = () => confirmBox(el, 'Futa ' + c.name + '?', 'Nyota, sarafu na maendeleo yake vitafutika.', 'Ndiyo, futa', () => {
    Store.removeChild(c.id);
    if (Store.activeId() === c.id) Store.setActive(Store.children()[0].id);
    HK.back();
  });
};

/* ---------- Eneo la Mzazi ---------- */
HK.screens.parentHome = (el, p) => {
  let tab = p.tab || 'kids';

  el.innerHTML = `
    <div class="topbar">
      <img src="img/mark.png" style="width:34px;height:34px;object-fit:contain">
      <div class="grow" style="min-width:0"><h1 style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Mzazi</h1></div>
      <button class="btn small" id="tochild">${icon('home', 18)} Kwa mtoto</button>
    </div>
    <div class="seg">
      <button data-t="kids">Watoto</button>
      <button data-t="hw">Homework</button>
      <button data-t="school">Shule</button>
      <button data-t="set">Mipangilio</button>
    </div>
    <div class="scroll" id="body"></div>`;

  $('#tochild', el).onclick = () => HK.toChild();
  HK.setBack(() => { HK.toChild(); return true; });

  const tabs = $$('.seg button', el);
  const show = (t) => {
    tab = t;
    HK.stack[HK.stack.length - 1].params.tab = t;
    tabs.forEach(b => b.classList.toggle('on', b.dataset.t === t));
    const body = $('#body', el);
    body.scrollTop = 0;
    if (t === 'kids') renderKids(body);
    if (t === 'hw') renderHw(body);
    if (t === 'set') renderSettings(body);
    if (t === 'school') renderParentSchool(body);
  };
  tabs.forEach(b => b.onclick = () => { Sfx.tap(); show(b.dataset.t); });

  function renderKids(body) {
    const kids = Store.children();
    const s = Store.settings();
    const learnMin = kids.reduce((t, k) => t + Math.round((Store.usage(k.id).learn || 0) / 60), 0);
    const starsAll = kids.reduce((t, k) => t + (k.stars || 0), 0);
    const pname = (Net.user() && Net.user().name || '').split(' ')[0];
    const hour = new Date().getHours();
    const hero = `<div class="parent-hero">
        <div class="ph-text"><small>${hour < 12 ? 'Habari za asubuhi' : hour < 16 ? 'Habari za mchana' : 'Habari za jioni'}${pname ? ', ' + esc(pname) : ''}</small>
          <b>Maendeleo ya watoto wako leo</b></div>
        <div class="ph-stats">
          <div><b>${kids.length}</b><span>Watoto</span></div>
          <div><b>${learnMin}</b><span>Dk za kujifunza</span></div>
          <div><b>${starsAll}</b><span>Nyota</span></div>
        </div>
        <div class="ph-kids">${kids.slice(0, 4).map(k => kidAvatar(k, 34)).join('')}</div>
      </div>`;
    body.innerHTML = hero + kids.map(c => {
      const u = Store.usage(c.id);
      const g = MODES[kidMode(c)];
      const used = Math.round((u.game || 0) / 60);
      const limit = s.gameLimitMin + (u.bonus || 0);
      const week = Store.weekUsage(c.id);
      const max = Math.max(1, ...week.map(w => (w.game || 0) + (w.learn || 0)));
      const days = ['Jpl', 'Jtt', 'Jnn', 'Jtn', 'Alh', 'Iju', 'Jms'];
      return `<div class="card kid-card" style="--kc:${c.color || '#1EA7F0'}">
        <div class="row">
          ${kidAvatar(c, 56)}
          <div class="grow">
            <h3 style="margin:0">${esc(c.name)} ${Store.activeId() === c.id ? '<span class="chip-tag teal">anatumia sasa</span>' : ''}</h3>
            <div class="muted" style="font-size:13px;font-weight:600">${esc(g.name)} · Miaka ${ageYears(c.birth)}${c.grade && c.grade !== GRADES[0] ? ' · ' + esc(c.grade) : ''} · ${faithOn(c) ? esc(RELIGIONS[c.religion].name) : 'Imani: imezimwa'}</div>
          </div>
        </div>
        <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
          <span class="chip-tag sun">${icon('star', 14)} Nyota ${c.stars || 0}</span>
          <span class="chip-tag blue">${icon('clock', 14)} Michezo leo: ${used}/${limit} dk</span>
          <span class="chip-tag">${icon('book', 14)} Kujifunza leo: ${Math.round((u.learn || 0) / 60)} dk</span>
        </div>
        ${(() => { const L = c.learned || {}; const n = k => (L[k] || []).length; return n('colors') + n('animals') + n('letters') + n('words') ? `<p style="font-size:13px;margin-top:10px">Amejifunza: rangi ${n('colors')} · wanyama ${n('animals')} · herufi ${n('letters')} · maneno ${n('words')}</p>` : ''; })()}
        <div style="display:flex;align-items:flex-end;gap:8px;height:74px;margin:16px 2px 4px">
          ${week.map(w => {
            const gH = Math.round(((w.game || 0) / max) * 56), lH = Math.round(((w.learn || 0) / max) * 56);
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
              <div style="width:100%;max-width:22px;display:flex;flex-direction:column;justify-content:flex-end;height:56px">
                <div style="height:${lH}px;background:var(--teal);border-radius:6px 6px 0 0"></div>
                <div style="height:${gH}px;background:var(--blue);border-radius:${lH ? 0 : '6px 6px'} 0 0"></div>
              </div>
              <span style="font-size:10px;font-weight:900;color:var(--muted)">${days[w.day.getDay()]}</span></div>`;
          }).join('')}
        </div>
        <div class="row" style="gap:12px;font-size:11px;font-weight:800;color:var(--muted);margin-bottom:12px">
          <span class="row" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--teal)"></i>Kujifunza</span>
          <span class="row" style="gap:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--blue)"></i>Michezo</span>
        </div>
        <div class="btn-row kid-actions">
          ${Store.activeId() === c.id ? '' : `<button class="btn small blue" data-use="${c.id}">${icon('user', 18)} Mpe simu</button>`}
          <button class="btn small ghost" data-edit="${c.id}">${icon('edit', 18)} Hariri</button>
          <button class="btn small sun" data-bonus="${c.id}">${icon('plus', 18)} Dakika 10</button>
          <button class="btn small ghost" data-friends="${c.id}">${icon('users', 18)} Marafiki</button>
        </div>
      </div>`;
    }).join('') + `<button class="btn block blue" id="addkid">${icon('plus', 22)} Ongeza mtoto</button>`;

    $$('[data-use]', body).forEach(b => b.onclick = () => { Store.setActive(b.dataset.use); toast('Imebadilishwa'); renderKids(body); });
    $$('[data-edit]', body).forEach(b => b.onclick = () => HK.go('childForm', { id: b.dataset.edit }));
    $$('[data-bonus]', body).forEach(b => b.onclick = () => { HK.addBonus(b.dataset.bonus, 10); Sfx.good(); toast('Dakika 10 za michezo zimeongezwa leo'); renderKids(body); });
    $('#addkid', body).onclick = () => HK.go('childForm', {});
    $$('[data-friends]', body).forEach(b => b.onclick = () => HK.go('friends', { id: b.dataset.friends }));
  }

  async function renderHw(body) {
    body.innerHTML = `<button class="btn block blue" id="addhw" style="margin-bottom:18px">${icon('camera', 22)} Ongeza homework</button><div id="list"><div class="empty">Inapakia...</div></div>`;
    $('#addhw', body).onclick = () => HK.go('hwNew', {});
    const all = await HWDB.all();
    const kids = Store.children();
    const name = id => (kids.find(k => k.id === id) || {}).name || '';
    const list = $('#list', body);
    if (!list) return;
    if (!all.length) {
      list.innerHTML = `<div class="empty"><div class="e-ic">${icon('file', 40)}</div>Hakuna homework bado.<br>Piga picha ya homework ya mtoto, ataifanya hapa kwenye simu.</div>`;
      return;
    }
    const waiting = all.filter(h => h.status === 'submitted');
    const rest = all.filter(h => h.status !== 'submitted');
    const item = h => {
      const st = HW_STATUS[h.status];
      const first = h.pages[0] || {};
      return `<button class="item" data-id="${h.id}">
        ${first.bg ? `<img class="thumb" src="${first.bg}">` : `<div class="i-ic" style="background:var(--sun)">${icon('file', 26)}</div>`}
        <div class="grow"><div class="i-title">${esc(h.title)}</div>
          <div class="i-sub">${esc(name(h.childId))} · ${esc(h.subject)} · kurasa ${h.pages.length}</div></div>
        <span class="chip-tag ${st.cls}">${st.label}</span>
      </button>`;
    };
    list.innerHTML =
      (waiting.length ? `<div class="section-title">Zinasubiri ukaguzi wako (${waiting.length})</div>` + waiting.map(item).join('') : '') +
      (rest.length ? `<div class="section-title">Zote</div>` + rest.map(item).join('') : '');
    $$('.item', list).forEach(b => b.onclick = () => HK.go('hwReview', { id: b.dataset.id }));
  }

  function renderSettings(body) {
    const s = Store.settings();
    const opt = (arr, cur, fmt) => arr.map(v => `<button class="chip ${String(v) === String(cur) ? 'on' : ''}" data-v="${v}">${fmt(v)}</button>`).join('');
    const setCard = (acc, ic, title, text, id, chips) => `
      <div class="card set-card" style="--acc:${acc}">
        <div class="set-head"><span class="set-ic">${icon(ic, 22)}</span><div><h3>${title}</h3><p>${text}</p></div></div>
        <div class="chips set-chips" id="${id}" style="--n:${Math.min(3, (chips.match(/class="chip/g) || []).length) === 3 && (chips.match(/class="chip/g) || []).length === 4 ? 4 : Math.min(3, (chips.match(/class="chip/g) || []).length)}">${chips}</div>
      </div>`;
    const row = (id, acc, ic, title, sub) => `<button class="set-row" id="${id}" style="--acc:${acc}"><span class="set-ic">${icon(ic, 20)}</span><span class="grow"><b>${title}</b>${sub ? `<small id="${id}-sub">${sub}</small>` : ''}</span>${icon('chevR', 20)}</button>`;
    body.innerHTML = `
      <div class="set-group">Muda na michezo</div>
      ${setCard('#1EA7F0', 'game', 'Muda wa michezo kwa siku', 'Ukiisha, michezo inajifunga. Mtoto anaweza kupata dakika za ziada akifanya homework vizuri.', 'lim', opt([10, 15, 20, 30, 45, 60], s.gameLimitMin, v => v + ' dk'))}
      ${setCard('#E0A100', 'gift', 'Zawadi ya homework', 'Dakika za ziada za michezo ukikubali homework yake.', 'bon', opt([0, 5, 10, 15], s.bonusMin, v => v ? '+' + v + ' dk' : 'Hapana'))}
      ${setCard('#7B61FF', 'moon', 'Muda wa kulala', 'Baada ya saa hii programu inamwambia mtoto akalale (hadi saa 11:30 alfajiri).', 'bed', opt(['off', '19:30', '20:00', '20:30', '21:00', '21:30'], s.bedtime, v => v === 'off' ? 'Zima' : v))}
      <div class="set-group">Usalama na AI</div>
      <div class="card set-list">
        ${row('aiset', '#0D2461', 'robot', 'HUGOKID AI', ' ')}
        ${row('lmset', '#0FB394', 'lock', 'Learning Mode', LM.state().on ? 'Imewashwa' : 'Ficha programu nyingine na dhibiti muda wake')}
      </div>
      <div class="set-group">Akaunti</div>
      <div class="card set-list">
        ${row('chpin', '#F65B4F', 'key', 'Badilisha PIN', '')}
        ${row('terms', '#6B778C', 'file', 'Masharti na Faragha', '')}
      </div>
      <p class="set-foot">HUGO KID 2.4 · Learn, Play, Grow<br>HUGO TECH · info@hugotech.co.tz</p>`;

    const bind = (id, key, num) => $$('#' + id + ' .chip', body).forEach(b => b.onclick = () => {
      Sfx.tap();
      const st = Store.settings();
      st[key] = num ? Number(b.dataset.v) : b.dataset.v;
      Store.saveSettings(st);
      $$('#' + id + ' .chip', body).forEach(x => x.classList.toggle('on', x === b));
      toast('Imehifadhiwa');
    });
    bind('lim', 'gameLimitMin', true);
    bind('bon', 'bonusMin', true);
    bind('bed', 'bedtime', false);
    $('#chpin', body).onclick = () => HK.go('pin', { mode: 'change' });
    $('#terms', body).onclick = () => HK.go('terms', { mode: 'view' });
    const ac = AI.cfg();
    $('#aiset-sub', body).textContent = ac.key ? AI_PROVIDERS[ac.provider].name + (ac.enabled ? ' · imewashwa' : ' · imezimwa') : 'Chagua Gemini, Claude au ChatGPT';
    $('#aiset', body).onclick = () => HK.go('aiSettings');
    $('#lmset', body).onclick = () => HK.go('learningMode');
  }

  show(tab);
};
