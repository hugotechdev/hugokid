

function missions(c) {
  const d = Store.today();
  const m = (c.daily && c.daily.date === d) ? c.daily : { date: d, lesson: false, game: false, hw: false, done: false };
  return m;
}
function markMission(key) {
  const c = Store.active(); if (!c) return;
  const m = missions(c);
  if (m[key]) return;
  m[key] = true;
  if (!m.done && m.lesson && m.game && m.hw) { m.done = true; c.stars = (c.stars || 0) + 2; toast("All of today's missions are done: 2 stars!"); }
  c.daily = m; Store.saveChild(c);
}

function bindTiles(el, c) {
  const talk = ['toddler', 'beginner'].includes(kidMode(c));
  $$('[data-go]', el).forEach(b => b.onclick = () => {
    Sfx.tap();
    const to = b.dataset.go, prm = b.dataset.p ? JSON.parse(b.dataset.p) : {};
    if (to === 'raceMenu' && HK.gameLeft(c) <= 0) return HK.go('timeUp');
    if (talk && b.dataset.say) { speak(b.dataset.say); setTimeout(() => HK.go(to, prm), 650); }
    else HK.go(to, prm);
  });
}
function homeworkBadge(el, c) {
  HWDB.byChild(c.id).then(list => {
    const todo = list.filter(h => ['new', 'doing', 'returned'].includes(h.status));
    const badge = $('#hwbadge', el); if (!badge || !todo.length) return;
    badge.textContent = todo.length; badge.classList.remove('hidden');
    const sub = $('#hwsub', el); if (sub) sub.textContent = todo.length === 1 ? 'Kazi 1 inakusubiri' : 'Kazi ' + todo.length + ' zinakusubiri';
  }).catch(() => {});
}
function greetOnce(c, text) {
  if (sessionStorage.getItem('hk_greeted_' + c.id)) return;
  sessionStorage.setItem('hk_greeted_' + c.id, '1');
  setTimeout(() => speak(T(text)), 500);
}

HK.screens.home = (el) => {
  const c = Store.active();
  if (!c) { HK.boot(); return; }
  if (HK.isBedtime()) { HK.go('sleep', {}, { replace: true }); return; }
  applyNeeds(c);
  if (Net.online() && Net.role() === 'parent') { SchoolSync.pull(c).then(() => homeworkBadge(el, c)).catch(() => {}); Net.connect(c.serverId); SchoolSync.maybePush(); }
  if (Net.role()==='child') SchoolSync.pull(c).then(()=>homeworkBadge(el,c)).catch(()=>{});
  const mode = kidMode(c);
  if (mode === 'toddler') return homeToddler(el, c);
  return homeStandard(el, c, mode);
};

function homeToddler(el, c) {
  const art = {
    colors: `<svg viewBox="0 0 100 100" width="96" height="96"><circle cx="34" cy="38" r="20" fill="#F65B4F"/><circle cx="66" cy="38" r="20" fill="#FFC20E"/><circle cx="34" cy="68" r="20" fill="#1EA7F0"/><circle cx="66" cy="68" r="20" fill="#0FB394"/></svg>`,
    animals: `<div style="width:104px;height:104px">${mascot('tembo', 104)}</div>`,
    numbers: `${mascot('pundamilia', 98)}`,
    shapes: `<svg viewBox="0 0 100 100" width="96" height="96"><circle cx="30" cy="34" r="18" fill="#fff"/><path d="M70 14l20 36H50z" fill="#FFE27A"/><rect x="18" y="58" width="30" height="30" rx="4" fill="#FFE27A"/><path d="M72 56l6 13 14 1-11 9 4 14-13-8-13 8 4-14-11-9 14-1z" fill="#fff"/></svg>`,
  };
  const tile = (go, p, say, label, cls, pic) => `<button class="tile big-t ${cls}" data-go="${go}" data-p='${p}' data-say="${esc(say)}">${pic}<div class="t-name">${label}</div></button>`;
  el.innerHTML = `
    <div class="scroll" style="padding:0">
      <div class="hero home-hero home-hero-small" style="padding:14px 16px">
        <div class="row">
          <button id="me" class="av" aria-label="Wasifu wangu" style="border:0;padding:3px">${kidAvatar(c, 64)}</button>
          <div class="hero-stats" style="margin:0;flex:1"><div style="justify-content:center">${icon('star', 26)}<b style="font-size:24px">${c.stars || 0}</b></div></div>
          <button class="lock" id="par" aria-label="Mzazi">${icon('lock', 18)}</button>
        </div>
      </div>
      ${saladHomeCard(c)}
      <div style="padding:16px"><div class="tiles">
        ${tile('tapGame', '{"kind":"colors"}', 'Rangi', 'Rangi', 'coral', art.colors)}
        ${tile('tapGame', '{"kind":"animals"}', 'Wanyama', 'Wanyama', 'sun', art.animals)}
        ${tile('tapGame', '{"kind":"numbers"}', 'Namba', 'Namba', 'blue', art.numbers)}
        ${tile('tapGame', '{"kind":"shapes"}', 'Maumbo', 'Maumbo', 'teal', art.shapes)}
        ${tile('games', '{}', 'Michezo', 'Michezo', 'navy wide', mascot('simba', 92))}
        <button class="tile white wide hidden" id="hwtile" data-go="hwList" data-say="Kazi ya mwalimu"><span class="badge hidden" id="hwbadge"></span>${mascot('tembo', 90)}<div class="t-name">Tasks</div></button>
      </div></div>
    </div>`;
  kidNav(el, 'home');
  bindTiles(el, c);
  HWDB.byChild(c.id).then(list => { if (list.some(h => ['new', 'doing', 'returned'].includes(h.status))) { $('#hwtile', el).classList.remove('hidden'); homeworkBadge(el, c); } }).catch(() => {});
  $('#par', el).onclick = () => HK.askParent();
  $('#me', el).onclick = () => HK.go('kidProfile');
  greetOnce(c, 'Habari ' + c.name + '! Gusa picha kuanza.');
  HK.setBack(() => true);
}

/* ---------- Wengine: Anaanza kusoma, Mvumbuzi, Mvumbuzi Mkuu ---------- */
function homeStandard(el, c, mode) {
  const left = HK.gameLeft(c);
  const rel = RELIGIONS[c.religion] || RELIGIONS.values;
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Habari za asubuhi' : hour < 16 ? 'Habari za mchana' : 'Habari za jioni';
  const lv = kidLevel(c);
  const learnMin = Math.floor((Store.usage(c.id).learn || 0) / 60);
  const goal = mode === 'beginner' ? 10 : 15, gp = Math.min(1, learnMin / goal);
  const R = 26, C = 2 * Math.PI * R;
  const ms = missions(c);
  const T = (go, p, cls, art, name, sub, say, extra = '') => `<button class="tile ${cls}" data-go="${go}" data-p='${p}' data-say="${esc(say || name)}">${extra}${art}<div></div><div><div class="t-name">${name}</div><div class="t-sub" ${go === 'hwList' ? 'id="hwsub"' : ''}>${sub}</div></div></button>`;
  const wide = (go, p, cls, lead, name, sub, style = '') => `<button class="tile ${cls} wide" style="${style}" data-go="${go}" data-p='${p}' data-say="${esc(name)}"><span>${lead}</span><div class="grow"><div class="t-name">${name}</div><div class="t-sub">${sub}</div></div>${icon('chevR', 26)}</button>`;

  let tiles = '';
  if (mode === 'beginner') {
    tiles = T('abc', '{}', 'blue', ART.reading, 'Herufi', 'A B C kwa sauti')
      + T('hwList', '{}', 'sun', ART.homework, 'Homework', 'Kazi za shule', '', '<span class="badge hidden" id="hwbadge"></span>')
      + T('games', '{}', 'coral', ART.games, 'Michezo', left > 0 ? 'Dakika ' + Math.ceil(left / 60) : 'Ya kujifunza')
      + T('lessons', '{}', 'teal', ART.lessons, 'Masomo', "Numbers, languages, science")
      + wide('tutor', '{}', 'white', mascot('nuru', 58), 'Uliza Nuru', 'Ongea na rafiki yako')
      + (faithOn(c) ? wide('faith', '{}', 'teal', `<div class="t-ic">${icon('sunrise', 30)}</div>`, rel.tile, rel.name) : '');
  } else if (mode === 'explorer') {
    tiles = T('hwList', '{}', 'sun', ART.homework, 'Homework', 'Kazi za shule', '', '<span class="badge hidden" id="hwbadge"></span>')
      + T('games', '{}', 'coral', ART.games, 'Michezo', left > 0 ? 'Dakika ' + Math.ceil(left / 60) + ' zimebaki' : 'Cheza ya kujifunza')
      + T('lessons', '{}', 'blue' + (faithOn(c) ? '' : ' wide'), ART.lessons, 'Masomo', "Languages, math, science")
      + (faithOn(c) ? T('faith', '{}', 'teal', ART.faith, rel.tile, rel.name) : '')
      + wide('safari', '{}', 'navy', `<div class="t-ic">${icon('flag', 30)}</div>`, 'Ramani ya Safari', "Unlock new islands with your stars")
      + wide('tutor', '{}', 'white', mascot('nuru', 58), 'Uliza Nuru', "Your learning friend");
  } else {
    tiles = T('lessons', '{}', 'blue', ART.lessons, 'Masomo', "Languages, math, science")
      + T('hwList', '{}', 'sun', ART.homework, 'Homework', 'Kazi za shule', '', '<span class="badge hidden" id="hwbadge"></span>')
      + wide('aiStudio', '{}', 'navy', mascot('nuru', 58), 'Studio ya AI', "Projects: stories, games, pictures, video", 'background:linear-gradient(135deg,#7B61FF,#1EA7F0)')
      + T('games', '{}', 'coral', ART.games, 'Changamoto', left > 0 ? 'Michezo na coding' : 'Ya kujifunza')
      + T('myReport', '{}', 'teal', `<svg class="art" viewBox="0 0 110 110"><rect x="20" y="58" width="14" height="30" rx="4" fill="#fff"/><rect x="44" y="40" width="14" height="48" rx="4" fill="#fff"/><rect x="68" y="24" width="14" height="64" rx="4" fill="#FFE27A"/></svg>`, 'Maendeleo', 'Ripoti yangu')
      + (faithOn(c) ? wide('faith', '{}', 'teal', `<div class="t-ic">${icon('sunrise', 30)}</div>`, rel.tile, rel.name) : '')
      + wide('tutor', '{}', 'white', mascot('nuru', 58), 'Uliza Nuru', "Research and harder questions");
  }

  el.innerHTML = `
    <div class="scroll" style="padding:0">
      <div class="hero home-hero">
        <div class="home-guide">${mascot('nuru', 94, 'mascot-peek')}</div>
        <div class="row">
          <button id="me" class="av" aria-label="Wasifu wangu" style="border:0;padding:3px">${kidAvatar(c, 58)}</button>
          <div><div class="hi">${greet},</div><div class="nm">${esc(c.name)}</div></div>
          <button class="lock" id="par">${icon('lock', 16)} Mzazi</button>
        </div>
        <div class="lvl">
          <div class="lvl-top"><span>Ngazi ${lv.level} · ${esc(MODES[mode].name)}</span><span>Nyota ${lv.left} kufika ngazi ${lv.level + 1}</span></div>
          <div class="lvl-bar"><i style="width:${Math.max(4, lv.pct)}%"></i></div>
        </div>
        <div class="hero-stats">
          <div>${icon('star', 20)}<span><b>${c.stars || 0}</b>Stars</span></div>
          <div>${icon('coin', 20)}<span><b>${c.coins || 0}</b>Sarafu</span></div>
          <div>${icon('clock', 20)}<span><b>${Math.ceil(left / 60)}</b>Dakika</span></div>
        </div>
      </div>

      ${saladHomeCard(c)}
      ${mode === 'beginner' ? `
      <div class="goal">
        <div class="ring"><svg width="62" height="62" viewBox="0 0 62 62"><circle cx="31" cy="31" r="${R}" stroke="#E8EEF7" stroke-width="8" fill="none"/><circle cx="31" cy="31" r="${R}" stroke="#0FB394" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - gp)}" transform="rotate(-90 31 31)"/></svg><span>${Math.round(gp * 100)}%</span></div>
        <div class="grow"><b>${gp >= 1 ? 'Umefikia lengo!' : 'Lengo la leo'}</b><p>Jifunza dakika ${goal} · ${learnMin} tayari</p></div>
      </div>` : `
      <div class="goal" style="align-items:stretch;flex-direction:column;gap:10px">
        <div class="row" style="justify-content:space-between"><b>Today's missions</b><span class="chip-tag ${ms.done ? 'teal' : 'sun'}">${[ms.lesson, ms.game, ms.hw].filter(Boolean).length}/3 · nyota 2</span></div>
        ${[['lesson', 'Maliza somo moja', 'lessons'], ['game', "Play a learning game", 'games'], ['hw', 'Fanya homework au mazoezi', 'hwList']].map(([k, t, go]) => `
          <button class="row mission ${ms[k] ? 'done' : ''}" data-go="${go}"><span class="mcheck">${ms[k] ? icon('check', 16) : ''}</span><span class="grow" style="text-align:left">${t}</span>${icon('chevR', 18)}</button>`).join('')}
      </div>`}

      <div id="ann"></div>
      <div style="padding:16px 16px 0">
        <div class="tiles">${tiles}
          ${Net.online() && c.serverId && mode !== 'beginner' ? wide('together', '{}', 'white', `<div class="t-ic" style="background:var(--coral);color:#fff">${icon('users', 28)}</div>`, 'Pamoja', "Learn and play with friends") : ''}
          ${wide('raceMenu', '{}', 'navy', `<div class="t-ic">${icon('car', 30)}</div>`, 'Mbio za Magari', 'Episode ' + Math.min(RACE_EPISODES, raceData(c).unlocked) + ' of ' + RACE_EPISODES)}
        </div>
        ${childAppsStrip()}
      </div>
    </div>`;
  bindChildApps(el);
  kidNav(el, 'home');
  bindTiles(el, c);
  homeworkBadge(el, c);
  if (Net.online() && c.school) Net.get('/api/announcements').then(list => {
    const a = list.find(x => ['all', 'students'].includes(x.audience) && Date.now() - x.created < 7 * 864e5);
    const box = $('#ann', el); if (!a || !box) return;
    box.innerHTML = `<div class="goal" style="background:#FFF4D2"><span class="t-ic" style="color:var(--sun-d)">${icon('bell', 28)}</span><div class="grow"><b>${esc(a.title)}</b><p style="color:var(--navy-2)">${esc(a.body || '')}</p></div><button class="icon-btn" id="annsay" style="width:40px;height:40px">${icon('volume', 18)}</button></div>`;
    $('#annsay', el).onclick = () => speak(a.title + '. ' + (a.body || ''));
  }).catch(() => {});
  $('#par', el).onclick = () => HK.askParent();
  $('#me', el).onclick = () => HK.go('kidProfile');
  greetOnce(c, greet + ' ' + c.name);
  HK.setBack(() => true);
}

const ISLANDS = [
  ['Kisiwa cha Namba', 'g_balloons', '#F65B4F', 'balloon', 'namba'],
  ['Msitu wa Herufi', 'g_letters', '#0FB394', 'letters', 'herufi'],
  ['Bonde la Maumbo', 'g_shapes', '#7B61FF', 'shapes', 'maumbo'],
  ['Ziwa la Kumbukumbu', 'g_memory', '#1EA7F0', 'cards', 'ziwa'],
  ['Soko la Mji', 'g_market', '#FF8A3D', 'shop', 'soko'],
  ['Mlima wa Roboti', 'g_robot', '#0D2461', 'robot', 'roboti'],
  ['Pwani ya Lugha', 'g_speak', '#14B8C9', 'mic', 'lugha'],
  ['Kilele cha Mabingwa', 'raceMenu', '#FFC20E', 'trophy', 'kilimanjaro'],
];
HK.screens.safari = (el) => {
  const c = Store.active();
  const lv = kidLevel(c).level;
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Journey Map</h1><span class="chip-tag sun">Ngazi ${lv}</span></div>
    <div class="scroll"><div class="map">${ISLANDS.map(([n, , col, ic, scene], i) => {
      const open = lv >= i + 1, cur = lv === i + 1 || (i === ISLANDS.length - 1 && lv > ISLANDS.length);
      return `<button class="island ${open ? '' : 'locked'} ${cur ? 'cur' : ''} scene-${scene}" data-i="${i}" style="--ic:${col}" ${cur ? 'aria-current="step"' : ''}>
        <span class="island-view"><span class="isl">${open ? icon(ic, 24) : icon('lock', 22)}</span></span>
        <span class="island-caption"><b>${n}</b><span>${open ? 'Fungua' : 'Ngazi ' + (i + 1)}</span></span></button>`;
    }).join('')}</div></div>`;
  $('#bk', el).onclick = () => HK.back();
  $$('.island', el).forEach(b => b.onclick = () => {
    const [n, go] = ISLANDS[+b.dataset.i];
    if (b.classList.contains('locked')) { Sfx.bad(); speak('Collect more stars to unlock ' + T(n)); return toast('Collect more stars to unlock ' + T(n)); }
    Sfx.tap(); speak(n); HK.go(go);
  });
};

HK.screens.myReport = (el) => {
  const c = Store.active();
  const avg = a => a && a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
  const read = avg((c.skillLog || {}).read), math = avg((c.skillLog || {}).math);
  const L = c.learned || {};
  const bar = (n, v, col) => `<div style="margin:10px 0"><div class="row" style="justify-content:space-between;font-weight:600"><span>${n}</span><span>${v == null ? '-' : v + '%'}</span></div><div class="lvl-bar" style="background:#E8EEF7;margin-top:6px"><i style="width:${v || 0}%;background:${col};box-shadow:none"></i></div></div>`;
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Ripoti yangu</h1></div>
    <div class="scroll">
      <div class="hero" style="margin:0"><div class="row">${kidAvatar(c, 64)}<div><div class="nm">${esc(c.name)}</div><div class="hi">${esc(MODES[kidMode(c)].name)} · Ngazi ${kidLevel(c).level}</div></div></div>
        <div class="hero-stats"><div>${icon('star', 20)}<span><b>${c.stars || 0}</b>Stars</span></div><div>${icon('coin', 20)}<span><b>${c.coins || 0}</b>Sarafu</span></div><div>${icon('book', 20)}<span><b>${Object.keys(Store.get('lessons_' + c.id, {})).length}</b>Lessons</span></div></div></div>
      <div class="card" style="margin-top:14px"><h3>Ujuzi</h3>${bar('Kusoma na lugha', read, 'var(--teal)')}${bar('Hesabu na mantiki', math, 'var(--blue)')}</div>
      <div class="card"><h3>Nimejifunza</h3><p>Herufi ${(L.letters || []).length} · Maneno ${(L.words || []).length} · Rangi ${(L.colors || []).length} · Wanyama ${(L.animals || []).length}</p></div>
      <div class="card" id="school"><h3>School homework</h3><p class="muted">Inapakia...</p></div>
    </div>`;
  $('#bk', el).onclick = () => HK.back();
  HWDB.byChild(c.id).then(list => {
    const done = list.filter(h => h.origin === 'school' && h.score != null);
    $('#school', el).innerHTML = `<h3>School homework</h3>` + (done.length ? done.slice(0, 10).map(h => `<div class="row" style="justify-content:space-between;margin:8px 0"><span>${esc(h.title)}</span><b>${h.score}/${h.max_score}</b></div>`).join('') : '<p>Hakuna alama bado.</p>');
  });
};
