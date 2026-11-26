/* HUGO KID - child.js : upande wa mtoto (home, michezo, muda) */

const GAMES = [
  // Burudani
  { id: 'racing', name: 'Mbio za Magari', icon: 'car', color: '#F65B4F', kind: 'fun' },
  { id: 'runner', name: 'Mkimbiaji wa Mbugani', icon: 'run', color: '#FF8A3D', kind: 'fun' },
  { id: 'penalty', name: 'Penalti', icon: 'ball', color: '#0FB394', kind: 'fun' },
  { id: 'pilot', name: 'Rubani Mdogo', icon: 'plane', color: '#1EA7F0', kind: 'fun' },
  { id: 'village', name: 'Jenga Kijiji Chako', icon: 'build', color: '#7B61FF', kind: 'fun' },
  { id: 'kitchen', name: 'Jikoni na Mama', icon: 'pot', color: '#E0476B', kind: 'fun' },
  { id: 'bubbles', name: 'Mapovu ya Rangi', icon: 'bubbles', color: '#14B8C9', kind: 'fun' },
  // Kujifunza
  { id: 'balloons', name: 'Puto za Hesabu', icon: 'balloon', color: '#F65B4F', kind: 'learn' },
  { id: 'letters', name: 'Herufi Zilizopotea', icon: 'letters', color: '#1EA7F0', kind: 'learn' },
  { id: 'memory', name: 'Kumbukumbu Porini', icon: 'cards', color: '#0FB394', kind: 'learn' },
  { id: 'robot', name: 'Roboti Njiani', icon: 'robot', color: '#0D2461', kind: 'learn' },
  { id: 'market', name: 'Soko Dogo', icon: 'shop', color: '#FF8A3D', kind: 'learn' },
  { id: 'shapes', name: 'Fumbo la Maumbo', icon: 'shapes', color: '#7B61FF', kind: 'learn' },
  { id: 'speak', name: 'Sema Ufungue', icon: 'mic', color: '#E0476B', kind: 'learn' },
  { id: 'faith', name: 'Safari ya Imani', icon: 'sunrise', color: '#D9A100', kind: 'learn' },
];

/* Michezo inayofaa kila modi (watoto wadogo hawapewi michezo inayohitaji kusoma) */
const GAMES_FOR = {
  toddler: ['racing', 'runner', 'pilot', 'bubbles', 'balloons', 'memory', 'shapes', 'kitchen'],
  beginner: ['racing', 'runner', 'pilot', 'bubbles', 'balloons', 'memory', 'shapes', 'kitchen', 'letters', 'market', 'robot', 'penalty', 'speak', 'village'],
};
function gamesFor(c) { const allow = GAMES_FOR[kidMode(c)]; return GAMES.filter(g => (!allow || allow.includes(g.id)) && (g.id !== 'faith' || faithOn(c))); }

/* Kumchagua mtoto (kama wapo zaidi ya mmoja) */
HK.screens.pickChild = (el) => {
  const kids = Store.children();
  el.innerHTML = `
    <div class="topbar"><img src="img/mark.png" style="width:40px;height:40px;object-fit:contain"><h1>Nani anatumia?</h1>
      <button class="icon-btn" id="par">${icon('lock')}</button></div>
    <div class="scroll"><div class="tiles" style="margin-top:10px">
      ${kids.map(c => `<button class="tile" data-id="${c.id}" style="--c:#fff;--cd:var(--line);color:var(--navy);align-items:center;text-align:center;min-height:180px">
        ${avatarSVG(c.color, 96)}<div class="t-name">${esc(c.name)}</div></button>`).join('')}
    </div></div>`;
  $$('.tile', el).forEach(b => b.onclick = () => { Sfx.tap(); Store.setActive(b.dataset.id); HK.go('home', {}, { reset: true }); });
  $('#par', el).onclick = () => HK.askParent();
};

/* ---------- Menyu ya chini ---------- */
function kidNav(el, active) {
  el.classList.add('has-nav');
  const items = [['home', 'home', 'Nyumbani'], ['games', 'game', 'Michezo'], ['lessons', 'book', 'Masomo'], ['rewards', 'trophy', 'Zawadi']];
  const nav = document.createElement('div');
  nav.className = 'kid-nav';
  nav.innerHTML = items.map(([to, ic, label]) => `<button data-nav="${to}" class="${to === active ? 'on' : ''}">${icon(ic, 22)}${label}</button>`).join('');
  el.appendChild(nav);
  $$('[data-nav]', nav).forEach(b => b.onclick = () => {
    const to = b.dataset.nav;
    if (to === active) return;
    Sfx.tap();
    HK.go(to, {}, { reset: true });
  });
}

/* Ngazi ya mtoto: kila nyota 10 = ngazi moja */
function kidLevel(c) {
  const s = c.stars || 0;
  return { level: Math.floor(s / 10) + 1, pct: (s % 10) * 10, left: 10 - (s % 10) };
}

/* ---------- Michezo 15 ---------- */
HK.screens.games = (el) => {
  const c = Store.active();
  const left = HK.gameLeft(c);
  const best = id => { const pr = id === 'racing' ? raceData(c).best : ((c.gp || {})[id] || {}).best || {}; return Object.keys(pr).length; };
  const card = gm => `<button class="game-card" data-id="${gm.id}">
      <div class="g-ic" style="--gc:${gm.color}">${icon(gm.icon, 38)}</div>
      <div class="g-name">${esc(gm.name)}</div>
      <span class="chip-tag ${gm.kind === 'fun' ? 'blue' : 'teal'}">${best(gm.id) ? 'Ngazi ' + best(gm.id) : 'Mpya'}</span>
    </button>`;
  el.innerHTML = `
    <div class="topbar"><h1 style="font-size:24px">Michezo</h1>
      <span class="hud-pill" style="background:#fff">${icon('clock', 18)} ${Math.ceil(left / 60)} dk</span></div>
    <div class="scroll">
      <div class="section-title">Burudani <span class="chip-tag blue" style="margin-left:6px">${Math.ceil(left / 60)} dk leo</span></div>
      <div class="games">${gamesFor(c).filter(g => g.kind === 'fun').map(card).join('')}</div>
      <div class="section-title">Cheza na ujifunze <span class="chip-tag teal" style="margin-left:6px">bila kikomo</span></div>
      <div class="games">${gamesFor(c).filter(g => g.kind === 'learn').map(card).join('')}</div>
    </div>`;
  kidNav(el, 'games');
  HK.setBack(() => { HK.go('home', {}, { reset: true }); return true; });
  $$('.game-card', el).forEach(b => b.onclick = () => {
    const gm = GAMES.find(x => x.id === b.dataset.id);
    if (gm.kind === 'fun' && HK.gameLeft(c) <= 0) return HK.go('timeUp');
    Sfx.tap();
    if (gm.id === 'racing') HK.go('raceMenu'); else HK.go('g_' + gm.id);
  });
};

/* ---------- Zawadi: nyota, ngazi na medali ---------- */
HK.screens.rewards = (el) => {
  const c = Store.active();
  const lv = kidLevel(c);
  el.innerHTML = `<div class="topbar"><h1 style="font-size:24px">Zawadi</h1></div><div class="scroll" id="rw"></div>`;
  kidNav(el, 'rewards');
  HK.setBack(() => { HK.go('home', {}, { reset: true }); return true; });
  HWDB.byChild(c.id).catch(() => []).then(hw => {
    const approved = (hw || []).filter(h => h.status === 'approved').length;
    const lessons = Store.get('lessons_' + c.id, {});
    const langs = new Set(Object.keys(lessons).filter(k => k.startsWith('lang_')).map(k => k.split('_')[1]));
    const played = Object.keys(c.gp || {}).filter(k => Object.keys(c.gp[k].best || {}).length).length + (Object.keys(raceData(c).best).length ? 1 : 0);
    const B = [
      ['Hatua ya kwanza', 'Pata nyota 1', 'star', '#FFC20E', (c.stars || 0) >= 1],
      ['Nyota 25', 'Kusanya nyota 25', 'star', '#FF8A3D', (c.stars || 0) >= 25],
      ['Nyota 100', 'Kusanya nyota 100', 'trophy', '#F65B4F', (c.stars || 0) >= 100],
      ['Homework ya kwanza', 'Mzazi akubali 1', 'pencil', '#1EA7F0', approved >= 1],
      ['Mchapakazi', 'Homework 10', 'pencil', '#0D2461', approved >= 10],
      ['Mwanafunzi', 'Maliza masomo 3', 'book', '#0FB394', Object.keys(lessons).length >= 3],
      ['Lugha nyingi', 'Lugha 3 tofauti', 'letters', '#7B61FF', langs.size >= 3],
      ['Mchezaji', 'Michezo 5 tofauti', 'game', '#E0476B', played >= 5],
      ['Bingwa wa michezo', 'Michezo 12 tofauti', 'game', '#14B8C9', played >= 12],
      ['Dereva bingwa', 'Mbio ngazi 9', 'car', '#F65B4F', (raceData(c).best[9] || 0) > 0],
      ['Akiba', 'Sarafu 300', 'coin', '#D9A100', (c.coins || 0) >= 300],
      ['Ngazi 5', 'Fika ngazi 5', 'sunrise', '#0FB394', lv.level >= 5],
    ];
    const got = B.filter(b => b[4]).length;
    $('#rw', el).innerHTML = `
      <div class="trophy-hero">
        <div style="display:flex;justify-content:center;margin-bottom:6px">${icon('trophy', 56, 2)}</div>
        <div class="big">${c.stars || 0}</div><div style="font-weight:600">Nyota · Ngazi ${lv.level}</div>
        <div class="lvl-bar" style="margin:14px 10px 4px;background:rgba(255,255,255,.3)"><i style="width:${Math.max(4, lv.pct)}%;background:#fff"></i></div>
        <div style="font-size:12px;font-weight:500">Nyota ${lv.left} kufika ngazi ${lv.level + 1}</div>
      </div>
      ${kidMode(c) !== 'toddler' ? `<button class="item" id="rep" style="margin-top:14px"><div class="i-ic" style="background:var(--teal)">${icon('trophy', 24)}</div><div class="grow"><div class="i-title">Ripoti yangu</div><div class="i-sub">Ujuzi, masomo na alama za shule</div></div>${icon('chevR', 20)}</button>` : ''}
      <div class="section-title">Mhusika wangu</div>
      <div class="card"><div class="row" style="gap:16px">${kidAvatar(c, 84)}<div class="grow"><p style="font-size:13px">Nunua vitu kwa sarafu zako na umvalishe mhusika wako.</p><p><b>${c.coins || 0}</b> sarafu</p></div></div>
        <div class="acc-grid">${['', ...Object.keys(ACCESSORIES)].map(k => { const a = ACCESSORIES[k]; const own = !k || (c.accOwned || []).includes(k); return `<button class="acc ${c.acc === k || (!k && !c.acc) ? 'on' : ''}" data-acc="${k}">${avatarSVG(c.color, 54, 'happy', k)}<span>${a ? a.name : 'Bila kitu'}</span><span class="muted">${own ? (c.acc === k || (!k && !c.acc) ? 'Amevaa' : 'Vaa') : icon('coin', 12) + ' ' + a.cost}</span></button>`; }).join('')}</div></div>
      <div class="section-title">Medali · ${got} kati ya ${B.length}</div>
      <div class="badges">${B.map(([n, d, ic, col, ok]) => `<div class="badge-c ${ok ? '' : 'locked'}" style="--mc:${col}">
        <div class="medal">${icon(ok ? ic : 'lock', 28)}</div><b>${esc(n)}</b><span>${esc(d)}</span></div>`).join('')}</div>`;
    const rep = $('#rep', el); if (rep) rep.onclick = () => HK.go('myReport');
    $$('[data-acc]', el).forEach(b => b.onclick = () => {
      const k = b.dataset.acc, cc = Store.active(), a = ACCESSORIES[k];
      cc.accOwned = cc.accOwned || [];
      if (k && !cc.accOwned.includes(k)) {
        if ((cc.coins || 0) < a.cost) { Sfx.bad(); speak('Unahitaji sarafu ' + a.cost); return toast('Unahitaji sarafu ' + a.cost); }
        cc.coins -= a.cost; cc.accOwned.push(k); Sfx.win(); confetti(el);
      } else Sfx.tap();
      cc.acc = k; Store.saveChild(cc); HK.render();
    });
  });
};

/* ---------- Muda wa michezo umekwisha ---------- */
const BREAKS = [
  { t: 'Ruka mara 10', n: 10, say: 'Simama, turuke mara kumi pamoja!' },
  { t: 'Gusa vidole vya miguu mara 8', n: 8, say: 'Inama ugusa vidole vya miguu mara nane' },
  { t: 'Vuta pumzi ndefu mara 5', n: 5, say: 'Vuta pumzi ndefu, kisha toa polepole. Mara tano.' },
  { t: 'Zungusha mikono mara 10', n: 10, say: 'Zungusha mikono yako kama gurudumu mara kumi' },
];
HK.screens.timeUp = (el) => {
  const c = Store.active();
  const b = BREAKS[Math.floor(Math.random() * BREAKS.length)];
  el.classList.add('timeup');
  el.innerHTML = `
    <div class="center-col">
      <div style="margin-bottom:8px">${avatarSVG(c.color, 110)}</div>
      <h2 style="font-size:26px;margin:6px 0">Muda wa michezo umekwisha!</h2>
      <p class="muted" style="font-weight:700;margin:0;max-width:310px">Umecheza vizuri leo. Sasa tupumzishe macho na tusogeze mwili.</p>
      <div class="activity">
        <b>${esc(b.t)}</b>
        <div class="count-big" id="cnt">${b.n}</div>
        <button class="btn block blue" id="tap">${icon('check', 22)} Gusa kila ukimaliza moja</button>
      </div>
      <button class="btn sun" id="hw">${icon('pencil', 22)} Fanya homework, upate dakika zaidi</button>
      <div style="height:12px"></div>
      <button class="btn ghost" id="home">${icon('home', 22)} Rudi nyumbani</button>
    </div>`;
  setTimeout(() => speak('Muda wa michezo umekwisha. ' + b.say), 300);
  let n = b.n;
  $('#tap', el).onclick = () => {
    if (n <= 0) return;
    n--; Sfx.tap(); $('#cnt', el).textContent = n;
    if (n === 0) {
      Sfx.win(); confetti(el); speak('Hongera! Umefanya vizuri sana.');
      $('#tap', el).textContent = 'Hongera!';
      const cc = Store.active(); cc.stars = (cc.stars || 0) + 1; Store.saveChild(cc);
      toast('Umepata nyota 1 kwa mazoezi');
    }
  };
  $('#hw', el).onclick = () => HK.go('hwList', {}, { replace: true });
  $('#home', el).onclick = () => HK.go('home', {}, { reset: true });
};

/* ---------- Muda wa kulala ---------- */
HK.screens.sleep = (el) => {
  const c = Store.active();
  el.classList.add('sleep');
  el.innerHTML = `
    <div class="center-col">
      <div style="color:#FFC20E;margin-bottom:10px">${icon('moon', 64, 2)}</div>
      ${avatarSVG(c ? c.color : '#1EA7F0', 120, 'sleep')}
      <h2 style="font-size:28px;margin:18px 0 6px">Usiku mwema${c ? ', ' + esc(c.name) : ''}</h2>
      <p style="font-weight:700;max-width:300px;margin:0 0 30px">Ni wakati wa kulala. Ubongo unakua vizuri ukilala mapema. Tuonane kesho!</p>
      <button class="btn ghost small" id="par">${icon('lock', 18)} Mzazi</button>
    </div>`;
  setTimeout(() => speak('Usiku mwema. Ni wakati wa kulala.'), 300);
  $('#par', el).onclick = () => HK.askParent();
  HK.setBack(() => true);
};
