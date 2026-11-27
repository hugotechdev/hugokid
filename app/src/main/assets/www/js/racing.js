

const RACE_CARS = [
  { name: 'Duma', color: '#F65B4F', dark: '#C63D33', cost: 0 },
  { name: 'Twiga', color: '#FFC20E', dark: '#D29E00', cost: 60 },
  { name: 'Kifaru', color: '#1EA7F0', dark: '#1381BD', cost: 150 },
  { name: 'Tai', color: '#7B61FF', dark: '#5A43D6', cost: 300 },
  { name: 'Coastal Rally', color: '#008F85', dark: '#00655F', score: 80 },
  { name: 'Golden Champion', color: '#DC9C16', dark: '#996402', score: 100 },
];
const RACE_LOCATIONS = [
  { name: 'Serengeti', c: 'var(--sun)', cd: 'var(--sun-d)', ground: '#9BC85A', ground2: '#8AB84B', deco: 'acacia', scene: 'race-serengeti' },
  { name: 'Coastal Circuit', c: 'var(--blue)', cd: 'var(--blue-d)', ground: '#F1D59A', ground2: '#E8C985', deco: 'palm', sea: true, scene: 'lugha' },
  { name: 'Kilimanjaro', c: 'var(--teal)', cd: 'var(--teal-d)', ground: '#A9C3B0', ground2: '#9AB6A1', deco: 'pine', snow: true, scene: 'race-kilimanjaro' },
];
const RACE_THEMES = [...RACE_LOCATIONS, ...RACE_LOCATIONS.map(theme => ({
  ...theme, name: theme.name + ' Challenge',
}))];
const RACE_EPISODES = RACE_THEMES.length * 3;

function racingResult(garage, won, correct, answered) {
  const score = answered ? Math.floor(100 * correct / answered) : 0;
  const prizes = RACE_CARS.filter((car, i) => {
    if (!won || !car.score || score < car.score || garage.cars.includes(i)) return false;
    garage.cars.push(i);
    return true;
  });
  const feedback = prizes.length ? 'You won ' + prizes.map(car => car.name).join(' and ') + '! Choose your new car in the Car Shop.'
    : !won ? 'Well done! Try the race again and aim for the finish line.'
    : score < 80 ? 'Well done! Keep practising. Aim for 80/100 to win a car.'
    : score < 100 ? 'Well done! Aim for 100/100 to earn the Golden Champion.' : 'Well done! A perfect score!';
  return { score, feedback };
}

function raceData(c) {
  c.racing = Object.assign({ unlocked: 1, best: {}, cars: [0], car: 0 }, c.racing || {});
  if (c.racing.unlocked === 9 && c.racing.best[9]) c.racing.unlocked = 10;
  return c.racing;
}

// Clip the original sprites to the bodywork so the studio backdrop never shows.
const RACE_CAR_ART = [
  [147, 302, 'M73 0C108 0 121 10 132 32C138 44 137 83 134 114L146 124V131L133 126L132 179L136 230C137 256 132 267 126 272C112 285 34 286 19 272C11 263 10 247 9 230L14 171L13 126L0 131V123L13 116C10 95 7 56 10 41C14 16 42 0 73 0Z'],
  [147, 298, 'M73 0C100 0 122 8 132 32C139 46 138 64 134 88L133 109L146 116V123L134 120L134 184L139 226C141 250 135 265 124 272C106 283 39 283 21 273C13 267 8 252 8 230L11 190L13 118L0 123V117L12 109L11 91C8 70 6 51 12 36C20 13 45 0 73 0Z'],
  [145, 301, 'M71 0C91 0 112 2 124 15C137 30 138 55 134 79L132 109L145 117V123L133 119L137 183L138 228C138 251 132 267 124 275C108 288 39 290 23 276C15 269 10 253 8 231L10 182L11 119L0 124V117L11 110L10 70C6 50 8 29 18 15C29 4 52 0 71 0Z'],
  [145, 304, 'M71 0C100 0 120 9 133 31C140 45 141 68 133 91L133 102L144 108V118L132 112L129 176L131 193L131 215L136 231L137 247L141 251V264L128 267C121 286 30 287 17 268L5 264V252L8 248L7 221L12 176L10 111L0 118V110L10 103L9 89C2 72 0 52 7 33C16 12 46 0 71 0Z'],
  [148, 308, 'M74 0C100 0 121 11 130 31C137 47 134 86 131 108L142 116V123L132 120L132 179L135 222C138 247 137 266 130 277C117 300 37 300 19 282C9 272 8 254 9 229L12 177L12 120L0 124V117L12 110C8 83 7 55 11 36C17 14 44 0 74 0Z'],
  [150, 310, 'M74 0C101 0 126 11 136 33C142 48 140 67 137 91L136 109L148 116V124L137 120L136 191L142 229C143 252 135 270 128 276C112 292 42 293 24 276C13 267 7 252 8 230L13 185L13 119L0 125V117L14 109L13 90C8 68 6 49 12 35C22 13 47 0 74 0Z'],
];
const raceSprites = new Map();
function raceCarImage(index) {
  return 'img/life/car-' + index + '.webp';
}

function raceSprite(color) {
  if (raceSprites.has(color)) return raceSprites.get(color);
  const index = RACE_CARS.findIndex(car => car.color === color);
  if (index < 0 || typeof Image === 'undefined') return null;
  const image = new Image();
  image.src = raceCarImage(index);
  const [width, height, outline] = RACE_CAR_ART[index];
  const sprite = { image, width, height, clip: new Path2D(outline) };
  raceSprites.set(color, sprite);
  return sprite;
}

function drawCar(ctx, x, y, w, h, color, dark, glow) {
  ctx.save();
  ctx.translate(x, y);
  const sprite = raceSprite(color);
  if (sprite?.image.naturalWidth) {
    ctx.translate(-w / 2, -h / 2);
    ctx.scale(w / sprite.width, h / sprite.height);
    ctx.clip(sprite.clip);
    ctx.drawImage(sprite.image, 0, 0, sprite.width, sprite.height);
    ctx.restore();
    return;
  }
  ctx.fillStyle = '#1B2233';
  const ww = w * 0.16, wh = h * 0.2;
  [[-w / 2 - ww * 0.35, -h * 0.32], [w / 2 - ww * 0.65, -h * 0.32], [-w / 2 - ww * 0.35, h * 0.14], [w / 2 - ww * 0.65, h * 0.14]]
    .forEach(([a, b]) => { rr(ctx, a, b, ww, wh, 4); ctx.fill(); });

  const paint = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  paint.addColorStop(0, dark); paint.addColorStop(.28, color);
  paint.addColorStop(.55, color); paint.addColorStop(1, dark);
  ctx.fillStyle = paint;
  ctx.shadowColor = '#10162677'; ctx.shadowBlur = glow ? 18 : 8;
  rr(ctx, -w / 2, -h / 2, w, h, w * 0.32); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = dark;
  rr(ctx, -w / 2 + w * 0.12, -h * 0.05, w * 0.76, h * 0.42, w * 0.18); ctx.fill();

  const windshield = ctx.createLinearGradient(0, -h * .3, 0, -h * .08);
  windshield.addColorStop(0, '#e1f6ff'); windshield.addColorStop(.42, '#89b9d0'); windshield.addColorStop(1, '#273a51');
  ctx.fillStyle = windshield;
  rr(ctx, -w / 2 + w * 0.17, -h * 0.3, w * 0.66, h * 0.22, w * 0.14); ctx.fill();
  ctx.fillStyle = '#6d9ab2';
  rr(ctx, -w * .25, h * .25, w * .5, h * .11, w * .08); ctx.fill();
  ctx.fillStyle = '#f4b3a5';
  ctx.fillRect(-w * .28, h * .42, w * .15, h * .035); ctx.fillRect(w * .13, h * .42, w * .15, h * .035);

  ctx.fillStyle = 'rgba(255,255,255,.85)';
  rr(ctx, -w * 0.07, -h / 2 + 4, w * 0.14, h * 0.18, 3); ctx.fill();

  ctx.fillStyle = '#FFF3B0';
  ctx.beginPath(); ctx.arc(-w * 0.3, -h / 2 + 6, w * 0.08, 0, 7); ctx.arc(w * 0.3, -h / 2 + 6, w * 0.08, 0, 7); ctx.fill();
  ctx.restore();
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

HK.screens.raceMenu = (el) => {
  const c = Store.active();
  const rd = raceData(c); Store.saveChild(c);
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Car Racing</h1>
      <span class="hud-pill" style="background:#fff">${icon('coin', 18)} <span id="coins">${c.coins || 0}</span></span></div>
    <div class="scroll">
      <button class="btn small" id="shop-link">Car Shop</button>
      ${RACE_THEMES.map((t, ti) => `
        <section class="race-region scene-${t.scene}"><h2>${t.name}</h2>
        <div class="levels">${[1, 2, 3].map(n => {
          const lv = ti * 3 + n, open = lv <= rd.unlocked, b = rd.best[lv] || 0;
          return `<button class="level ${open ? '' : 'locked'}" data-lv="${lv}" style="--c:${t.c};--cd:${t.cd}">
            ${open ? lv : icon('lock', 26)}
            <span class="lv-stars">${[1, 2, 3].map(s => `<svg width="14" height="14" viewBox="0 0 24 24" class="${s <= b ? 'on' : ''}"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>`).join('')}</span>
          </button>`;
        }).join('')}</div></section>`).join('')}
      <div class="section-title" id="car-shop">Car Shop</div><p class="muted">Buy a car with coins, or finish a race with a quiz score of 80 or higher to win one.</p>
      <div class="garage" id="garage"></div>
    </div>`;
  $('#bk', el).onclick = () => HK.back();

  $('#shop-link', el).onclick = () => $('#car-shop', el).scrollIntoView({ block: 'start' });
  $$('.level', el).forEach(b => b.onclick = () => {
    const lv = +b.dataset.lv;
    if (lv > raceData(Store.active()).unlocked) { Sfx.bad(); toast("Finish the level " + (lv - 1) + ' first'); return; }
    if (HK.gameLeft(Store.active()) <= 0) return HK.go('timeUp');
    Sfx.tap();
    HK.go('racePlay', { level: lv });
  });

  const drawGarage = () => {
    const cc = Store.active(); const r = raceData(cc);
    const g = $('#garage', el);
    g.innerHTML = RACE_CARS.map((car, i) => {
      const own = r.cars.includes(i);
      const [width, height, outline] = RACE_CAR_ART[i];
      return `<button class="car-card ${r.car === i ? 'on' : ''}" data-i="${i}">
        <svg class="shop-car" viewBox="0 0 ${width} ${height}" aria-hidden="true">
          <defs><clipPath id="race-shop-car-${i}"><path d="${outline}"/></clipPath></defs>
          <image href="${raceCarImage(i)}" width="${width}" height="${height}" clip-path="url(#race-shop-car-${i})"/>
        </svg>
        <div class="c-name">${car.name}</div>
        <div class="c-price">${r.car === i ? 'Selected' : own ? "Choose" : car.score ? car.score + '/100 reward' : icon('coin', 14) + ' ' + car.cost}</div></button>`;
    }).join('');
    $$('.car-card', g).forEach(b => b.onclick = () => {
      const i = +b.dataset.i; const cc2 = Store.active(); const r2 = raceData(cc2); const car = RACE_CARS[i];
      if (r2.cars.includes(i)) { r2.car = i; Store.saveChild(cc2); Sfx.tap(); drawGarage(); return; }
      const buy = (tokens = 0) => {
        const current = Store.child(cc2.id);
        if (!current) return;
        const garage = raceData(current);
        const charge = car.cost - tokens;
        if (garage.cars.includes(i) || (current.coins || 0) < charge) return drawGarage();
        current.coins = (current.coins || 0) - charge;
        garage.cars.push(i); garage.car = i; Store.saveChild(current);
        Sfx.win(); confetti(el); $('#coins', el).textContent = current.coins; drawGarage();
      };
      if (car.score) return toast('Finish a race with a quiz score of ' + car.score + ' or higher to earn this car.');
      const missing = car.cost - (cc2.coins || 0);
      if (missing > 0) return tokenChallenge(el, missing, buy, {
        title: 'Not enough coins',
        message: `Earn ${missing} play tokens with a quick question. A correct answer uses the tokens and your current coins to unlock ${car.name}.`,
      });
      confirmBox(el, 'Buy ' + car.name + '?', car.cost + ' coins', 'Buy', () => buy(), '');
    });
  };
  drawGarage();
};

const RACE_COLORS = [
  { n: 'RED', c: '#F65B4F' }, { n: 'BLUE', c: '#1EA7F0' }, { n: 'YELLOW', c: '#FFC20E' },
  { n: 'GREEN', c: '#0FB394' }, { n: 'PURPLE', c: '#7B61FF' },
];
function raceQuestion(group, level) {
  const R = n => Math.floor(Math.random() * n);
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  if (group === 'explorer') {
    const opts = shuffle(RACE_COLORS.slice()).slice(0, 3);
    const ans = opts[R(3)];
    return { q: "Drive through the color " + ans.n, say: "Drive through the color " + ans.n.toLowerCase(), opts: opts.map(o => ({ label: '', color: o.c, ok: o === ans })) };
  }
  let a, b, op, res;
  if (group === 'adventurer') {
    if (level <= 3 || Math.random() < 0.5) { a = 1 + R(9 + level); b = 1 + R(9); op = '+'; res = a + b; }
    else { a = 5 + R(10 + level); b = 1 + R(Math.min(a, 9)); op = '-'; res = a - b; }
  } else {
    if (Math.random() < 0.6) { a = 2 + R(9); b = 2 + R(level < 5 ? 5 : 9); op = 'x'; res = a * b; }
    else { b = 2 + R(8); res = 2 + R(9); a = b * res; op = '÷'; }
  }
  const set = new Set([res]);
  while (set.size < 3) { const w = res + (R(2) ? 1 : -1) * (1 + R(op === 'x' ? 6 : 3)); if (w >= 0) set.add(w); }
  const opts = shuffle([...set]).map(v => ({ label: String(v), color: '#fff', ok: v === res }));
  const say = `${a} ${{ '+': 'plus', '-': 'minus', 'x': 'times', '÷': 'divided by' }[op]} ${b}?`;
  return { q: `${a} ${op} ${b} = ?`, say, opts };
}

HK.screens.racePlay = (el, p) => {
  const child = Store.active();
  const rd = raceData(child);
  const level = p.level || 1;
  const theme = RACE_THEMES[Math.floor((level - 1) / 3)];
  const group = ageGroup(child);
  const car = RACE_CARS[rd.car] || RACE_CARS[0];

  const CFG = {
    explorer: { speed: 300 + level * 8, gap: 560, hearts: 99, double: 0 },
    adventurer: { speed: 380 + level * 16, gap: 400, hearts: 3, double: level >= 5 ? 0.25 : 0 },
    master: { speed: 460 + level * 22, gap: 320, hearts: 3, double: level >= 3 ? 0.4 : 0.15 },
  }[group];
  const cruisingSpeed = CFG.speed * 0.88;
  const answerSeconds = group === 'explorer' ? 3 : 2.5;
  const LENGTH = 9000 + level * 1400;

  el.classList.add('race-screen', 'scene-' + theme.scene);
  el.innerHTML = `
    <canvas id="cv"></canvas>
    <div class="race-hud">
      <button class="icon-btn" id="pause" style="width:42px;height:42px">${icon('pause', 22)}</button>
      <div class="hud-progress"><i id="prog" style="width:0%"></i></div>
      <span class="hud-pill" ${CFG.hearts > 9 ? 'style="display:none"' : ''}><span style="color:var(--coral)">${icon('heart', 18)}</span><span id="hearts">${CFG.hearts}</span></span>
      <span class="hud-pill"><span style="color:var(--sun-d)">${icon('coin', 18)}</span><span id="coins">0</span></span>
    </div>
    <div class="race-q hidden-q" id="q"></div>`;

  const cv = $('#cv', el), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const resize = () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const layoutChanged = W !== el.clientWidth || H !== el.clientHeight;
    W = el.clientWidth; H = el.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!layoutChanged) return;
    S.x = laneX(S.lane);
    if (S.gate && !S.gate.done) {
      const box = $('#q', el);
      S.gate.visibleFrom = box.offsetTop + box.offsetHeight + 30;
      S.gate.y = Math.min(S.gate.y, S.gate.visibleFrom);
    }
  };


  const road = () => { const rw = Math.min(W * 0.8, 430); return { l: (W - rw) / 2, w: rw, lw: rw / 3 }; };
  const laneX = i => { const r = road(); return r.l + r.lw * (i + 0.5); };

  const S = {
    dist: 0, boost: 0, slow: 0, lane: 1, x: 0,
    hearts: CFG.hearts, coins: 0, inv: 0, objs: [], decos: [],
    nextRow: 600, nextGate: LENGTH / 6, noSpawnUntil: 0, gate: null,
    paused: false, over: false, time: 0, saveAcc: 0, warned: false, correct: 0, answered: 0, shake: 0,
  };
  resize();
  window.addEventListener('resize', resize);

  const playerY = () => H - Math.max(120, H * 0.18);
  const carW = () => Math.min(road().lw * 0.58, 64);
  const carH = () => carW() * 1.75;

  function msg(text, color = '#fff') {
    const m = document.createElement('div');
    m.className = 'race-msg'; m.textContent = text; m.style.color = color;
    el.appendChild(m); setTimeout(() => m.remove(), 900);
  }

  function spawnRow() {
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const blocks = Math.random() < CFG.double ? 2 : 1;
    for (let i = 0; i < blocks; i++) {
      const type = Math.random() < 0.7 ? 'car' : 'rock';
      const traffic = RACE_CARS[Math.floor(Math.random() * RACE_CARS.length)];
      S.objs.push({ type, lane: lanes[i], y: -120, color: traffic.color, dark: traffic.dark, vy: type === 'car' ? 0.35 : 0 });
    }
    const free = lanes[blocks];
    const n = Math.random() < 0.5 ? 3 : 1;
    for (let k = 0; k < n; k++) S.objs.push({ type: 'coin', lane: free, y: -120 - k * 70 - (blocks ? 160 : 0) });
  }
  function spawnGate() {
    const q = raceQuestion(group, level);
    S.gate = { y: -140, q, done: false, visibleFrom: 0 };
    const box = $('#q', el);
    box.textContent = q.q;
    box.classList.remove('hidden-q');
    S.gate.visibleFrom = box.offsetTop + box.offsetHeight + 30;
    speak(q.say);
  }
  function spawnDeco() {
    const r = road();
    const side = Math.random() < 0.5 ? 'L' : 'R';
    const margin = side === 'L' ? r.l : W - (r.l + r.w);
    if (margin < 26) return;
    const x = side === 'L' ? Math.random() * (r.l - 30) + 15 : r.l + r.w + 15 + Math.random() * (margin - 30);
    S.decos.push({ x, y: -80, s: 0.7 + Math.random() * 0.6, side });
  }

  function drawDeco(d) {
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.s, d.s);
    if (theme.deco === 'acacia') {
      ctx.fillStyle = '#7A5230'; ctx.fillRect(-3, -6, 6, 34);
      ctx.fillStyle = '#4F8A2E'; ctx.beginPath(); ctx.ellipse(0, -12, 30, 11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#5E9E38'; ctx.beginPath(); ctx.ellipse(-6, -16, 18, 7, 0, 0, 7); ctx.fill();
    } else if (theme.deco === 'palm') {
      ctx.strokeStyle = '#8A6239'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 28); ctx.quadraticCurveTo(6, 6, 0, -14); ctx.stroke();
      ctx.fillStyle = '#2E9E5B';
      for (let a = 0; a < 5; a++) { ctx.save(); ctx.translate(0, -14); ctx.rotate(a * 1.26); ctx.beginPath(); ctx.ellipse(14, 0, 16, 5, 0, 0, 7); ctx.fill(); ctx.restore(); }
    } else {
      ctx.fillStyle = '#6D4C33'; ctx.fillRect(-3, 10, 6, 16);
      ctx.fillStyle = '#2F6E4E';
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(18, 12); ctx.lineTo(-18, 12); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(7, -15); ctx.lineTo(-7, -15); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function drawWorld() {
    const r = road();

    ctx.fillStyle = theme.ground;
    ctx.globalAlpha = .27; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = theme.ground2;
    const off = S.dist % 160;
    for (let y = -160 + off; y < H; y += 160) { ctx.fillRect(0, y, r.l, 80); ctx.fillRect(r.l + r.w, y, W, 80); }
    ctx.globalAlpha = 1;
    if (theme.sea) {
      const sx = r.l + r.w + 22;
      ctx.fillStyle = '#4FC3F7'; ctx.fillRect(sx, 0, W - sx, H);
      ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 3;
      for (let y = -60 + (S.dist * 0.6) % 60; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(sx + 10, y); ctx.quadraticCurveTo(sx + 25, y - 8, sx + 40, y); ctx.stroke(); }
    }
    if (theme.snow) {
      ctx.fillStyle = 'rgba(255,255,255,.55)';
      for (let y = -200 + (S.dist % 200); y < H; y += 200) { ctx.beginPath(); ctx.ellipse(r.l * 0.4, y, 22, 9, 0, 0, 7); ctx.ellipse(r.l + r.w + (W - r.l - r.w) * 0.6, y + 100, 26, 10, 0, 0, 7); ctx.fill(); }
    }
    S.decos.forEach(drawDeco);

    const asphalt = ctx.createLinearGradient(r.l, 0, r.l + r.w, 0);
    asphalt.addColorStop(0, '#353d4a'); asphalt.addColorStop(.14, '#4b515a');
    asphalt.addColorStop(.56, '#545d66'); asphalt.addColorStop(1, '#373e49');
    ctx.fillStyle = asphalt; ctx.fillRect(r.l, 0, r.w, H);
    ctx.fillStyle = '#fff2';
    const grain = S.dist % 92;
    for (let y = -92 + grain; y < H; y += 92) {
      ctx.fillRect(r.l + r.w * .22, y, 13, 1);
      ctx.fillRect(r.l + r.w * .63, y + 43, 7, 1);
    }
    ctx.fillStyle = '#fff';
    const st = S.dist % 40;
    for (let y = -40 + st; y < H; y += 40) {
      ctx.fillStyle = (Math.floor((y - st) / 40) % 2) ? '#fff' : '#F65B4F';
      ctx.fillRect(r.l - 8, y, 8, 40); ctx.fillRect(r.l + r.w, y, 8, 40);
    }
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    const dash = S.dist % 70;
    for (let i = 1; i < 3; i++) for (let y = -70 + dash; y < H; y += 70) ctx.fillRect(r.l + r.lw * i - 3, y, 6, 36);

    const fy = playerY() - (LENGTH - S.dist);
    if (fy > -60 && fy < H + 40) {
      const sq = r.w / 12;
      for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#0D2461' : '#fff'; ctx.fillRect(r.l + i * sq, fy + j * sq, sq, sq); }
    }
  }

  function drawObjs() {
    const cw = carW(), ch = carH();
    S.objs.forEach(o => {
      const x = laneX(o.lane);
      if (o.type === 'car') drawCar(ctx, x, o.y, cw, ch, o.color, o.dark);
      else if (o.type === 'rock') {
        ctx.fillStyle = '#7D7F86'; ctx.beginPath(); ctx.ellipse(x, o.y, cw * 0.55, cw * 0.42, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#9A9CA3'; ctx.beginPath(); ctx.ellipse(x - 6, o.y - 6, cw * 0.3, cw * 0.2, 0, 0, 7); ctx.fill();
      } else if (o.type === 'coin') {
        const sp = Math.abs(Math.sin(S.time * 6 + o.y * 0.01));
        ctx.fillStyle = '#FFC20E'; ctx.beginPath(); ctx.ellipse(x, o.y, 14 * Math.max(0.25, sp), 14, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#D29E00'; ctx.lineWidth = 3; ctx.stroke();
      }
    });
    if (S.gate) {
      const r = road(), g = S.gate;
      g.q.opts.forEach((o, i) => {
        const x = r.l + r.lw * i + 6, w = r.lw - 12;
        ctx.fillStyle = 'rgba(13,36,97,.25)'; rr(ctx, x, g.y - 30 + 6, w, 60, 16); ctx.fill();
        ctx.fillStyle = o.color; rr(ctx, x, g.y - 30, w, 60, 16); ctx.fill();
        ctx.strokeStyle = '#0D2461'; ctx.lineWidth = 3; ctx.stroke();
        if (o.label) {
          ctx.fillStyle = '#0D2461'; ctx.font = '900 30px Outfit, Roboto, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(o.label, x + w / 2, g.y + 1);
        }
        if (g.done && o.ok) { ctx.strokeStyle = '#0FB394'; ctx.lineWidth = 6; rr(ctx, x - 3, g.y - 33, w + 6, 66, 18); ctx.stroke(); }
      });
    }
  }

  function drawPlayer() {
    const blink = S.inv > 0 && Math.floor(S.inv * 10) % 2 === 0;
    if (blink) return;
    const tilt = (laneX(S.lane) - S.x) * -0.004;
    ctx.save(); ctx.translate(S.x, playerY()); ctx.rotate(tilt);
    if (S.boost > 0) {
      ctx.fillStyle = 'rgba(255,194,14,.7)';
      ctx.beginPath(); ctx.moveTo(-10, carH() / 2); ctx.lineTo(0, carH() / 2 + 24 + Math.random() * 14); ctx.lineTo(10, carH() / 2); ctx.fill();
    }
    drawCar(ctx, 0, 0, carW(), carH(), car.color, car.dark, true);
    ctx.restore();
  }

  function hit(o) {
    const dy = Math.abs(o.y - playerY());
    const dx = Math.abs(laneX(o.lane) - S.x);
    const lim = o.type === 'coin' ? (carH() / 2 + 14) : (carH() / 2 + (o.type === 'car' ? carH() / 2 : carW() * 0.4)) * 0.82;
    return dy < lim && dx < road().lw * 0.55;
  }

  function update(dt) {
    S.time += dt;
    if (S.inv > 0) S.inv -= dt;
    if (S.boost > 0) S.boost -= dt;
    if (S.slow > 0) S.slow -= dt;
    let v = cruisingSpeed * (S.boost > 0 ? 1.45 : 1) * (S.slow > 0 ? 0.45 : 1);
    if (S.gate && !S.gate.done && S.gate.y >= S.gate.visibleFrom) {
      const visibleDistance = Math.max(1, playerY() - 10 - S.gate.visibleFrom);
      v = Math.min(v, visibleDistance / answerSeconds);
    }
    let dy = v * dt;
    if (S.gate && !S.gate.done && S.gate.y < S.gate.visibleFrom) {
      dy = Math.min(dy, S.gate.visibleFrom - S.gate.y);
    }
    S.dist += dy;

    S.x += (laneX(S.lane) - S.x) * Math.min(1, dt * 14);

    if (S.dist >= S.nextGate && S.answered < 5 && !S.gate) {
      spawnGate(); S.noSpawnUntil = S.dist + 900; S.nextGate += LENGTH / 6;
    }
    if (S.dist >= S.nextRow && S.dist < LENGTH - 500) {
      if (S.dist > S.noSpawnUntil && (!S.gate || S.gate.done) && (S.dist < S.nextGate - 1100 || S.nextGate > LENGTH - 1400)) spawnRow();
      S.nextRow = S.dist + CFG.gap * (0.8 + Math.random() * 0.5);
    }
    if (Math.random() < dt * 2.2) spawnDeco();

    S.decos.forEach(d => d.y += dy);
    S.decos = S.decos.filter(d => d.y < H + 60);

    S.objs.forEach(o => { o.y += dy - (o.vy ? v * o.vy * dt : 0); });
    for (const o of S.objs) {
      if (o.gone) continue;
      if (hit(o)) {
        if (o.type === 'coin') { o.gone = true; S.coins++; Sfx.coin(); }
        else if (S.inv <= 0) {
          o.gone = true; Sfx.crash(); vibrate(160); S.shake = 0.35;
          if (CFG.hearts > 9) { S.slow = 1; msg("Oops! Keep going", '#FFE07A'); }
          else {
            S.hearts--; S.inv = 1.6; S.slow = 0.6;
            $('#hearts', el).textContent = S.hearts;
            if (S.hearts <= 0) return finish(false);
          }
        }
      }
    }
    S.objs = S.objs.filter(o => !o.gone && o.y < H + 120);

    if (S.gate) {
      S.gate.y += dy;
      if (!S.gate.done && S.gate.y >= playerY() - 10) {
        S.gate.done = true;
        S.answered++;
        const ok = S.gate.q.opts[S.lane].ok;
        if (ok) {
          S.correct++; S.coins += 5; S.boost = 1.6; Sfx.good(); celebrateMascot(el); msg("Congratulations! +5", '#FFE07A');
          speak(["Congratulations!", 'Well done!', 'You did it!'][Math.floor(Math.random() * 3)]);
        } else { Sfx.bad(); msg("Almost! Try again"); }
        $('#q', el).classList.add('hidden-q');
      }
      if (S.gate.y > H + 80) S.gate = null;
    }

    $('#coins', el).textContent = S.coins;
    $('#prog', el).style.width = Math.min(100, S.dist / LENGTH * 100) + '%';

    S.saveAcc += dt;
    if (S.saveAcc >= 3) {
      HK.addGameTime(child, S.saveAcc); S.saveAcc = 0;
      const left = HK.gameLeft(Store.active());
      if (left <= 60 && !S.warned) { S.warned = true; toast("1 minute of games left"); speak("One minute left"); }
      if (left <= 0) { S.over = true; HK.go('timeUp', {}, { replace: true }); return; }
    }
    if (S.dist >= LENGTH && S.answered === 5) finish(true);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (S.shake > 0) ctx.translate((Math.random() - 0.5) * 12 * S.shake / 0.35, 0);
    drawWorld(); drawObjs(); drawPlayer();
    ctx.restore();
  }

  let raf, disposed = false, last = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!S.paused && !S.over) {
      if (S.shake > 0) S.shake -= dt;
      update(dt);
    }
    if (disposed || S.over) return;
    render();
    raf = requestAnimationFrame(loop);
  }

  const move = d => { if (S.paused || S.over) return; const n = Math.max(0, Math.min(2, S.lane + d)); if (n !== S.lane) { S.lane = n; Sfx.tap(); } };
  let sx = null;
  cv.addEventListener('pointerdown', e => {
    if (!e.isPrimary) return;
    sx = e.clientX;
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('lostpointercapture', () => { sx = null; });
  cv.addEventListener('pointerup', e => {
    if (!e.isPrimary || sx == null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 30) move(dx > 0 ? 1 : -1);
    else move(e.clientX - cv.getBoundingClientRect().left < W / 2 ? -1 : 1);
  });
  const key = e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); };
  window.addEventListener('keydown', key);

  function pause() {
    if (S.over || S.paused) return;
    sx = null;
    S.paused = true;
    const dialog = modal(el, {
      iconName: 'pause', iconColor: 'var(--blue)', title: 'Paused',
      buttons: [
        { label: 'Continue', icon: 'play', onClick: () => { S.paused = false; last = performance.now(); } },
        { label: "How to play", cls: 'blue', icon: 'help', onClick: () => GT.show(el, 'racing', 0, () => { S.paused = false; last = performance.now(); }) },
        { label: "Start over", cls: 'sun', icon: 'repeat', onClick: () => HK.go('racePlay', { level }, { replace: true }) },
        { label: 'Exit', cls: 'ghost', onClick: () => { S.over = true; HK.leave(); } },
      ],
    });
    dialog.onGameBack = () => { dialog.remove(); S.paused = false; last = performance.now(); };
  }
  $('#pause', el).onclick = pause;
  HK.setBack(() => { if (S.over || S.paused) return false; pause(); return true; });
  HK._pauseHook = pause;
  const onVisibilityChange = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVisibilityChange);

  function finish(won) {
    if (S.over) return;
    S.over = true;
    HK.addGameTime(child, S.saveAcc); S.saveAcc = 0;
    $('#q', el).classList.add('hidden-q');
    const cc = Store.active(); const r = raceData(cc);
    cc.coins = (cc.coins || 0) + S.coins;
    const { score, feedback } = racingResult(r, won, S.correct, S.answered);
    let stars = 0;
    if (won) {
      stars = CFG.hearts > 9 ? 3 : Math.max(1, S.hearts);
      const prev = r.best[level] || 0;
      if (stars > prev) { cc.stars = (cc.stars || 0) + (stars - prev); r.best[level] = stars; }
      if (level >= r.unlocked && level < RACE_EPISODES) r.unlocked = level + 1;
      Sfx.win(); confetti(el);
    }
    speak(feedback);
    Store.saveChild(cc);
    const leftNow = HK.gameLeft(cc);
    modal(el, {
      iconName: won ? 'trophy' : 'repeat', iconColor: won ? 'var(--sun)' : 'var(--coral)',
      title: won ? (level === RACE_EPISODES ? "Racing Champion!" : 'You finished!') : 'Well done!',
      html: `${won ? `<div class="earned">${starsHTML(stars, 3, 44)}</div>` : ''}
        <p>Coins +${S.coins} · Correct answers ${S.correct}/${S.answered}</p>${S.answered ? '<b>Quiz score ' + score + '/100</b>' : ''}<p>${esc(feedback)}</p>`,
      buttons: [
        ...(won && level < RACE_EPISODES && leftNow > 0 ? [{ label: "Next level", icon: 'chevR', onClick: () => HK.go('racePlay', { level: level + 1 }, { replace: true }) }] : []),
        ...(leftNow > 0 ? [{ label: "Play again", cls: won ? 'sun' : '', icon: 'repeat', onClick: () => HK.go('racePlay', { level }, { replace: true }) }] : []),
        { label: leftNow > 0 ? "All levels" : 'Time is up', cls: 'ghost', onClick: () => leftNow > 0 ? HK.leave() : HK.go('timeUp', {}, { replace: true }) },
      ],
    });
  }

  S.paused = true;
  let n = 3, startTimer;
  const countdown = () => {
    if (disposed) return;
    if (document.hidden) {
      startTimer = setTimeout(countdown, 250);
      return;
    }
    if (n === 0) { msg("Let's go!", '#FFE07A'); speak("Let's go!"); S.paused = false; last = performance.now(); return; }
    msg(String(n)); Sfx.tone(520, 0.12, 'square', 0.1); n--; startTimer = setTimeout(countdown, 750);
  };
  if (GT.seen(child, 'racing')) startTimer = setTimeout(countdown, 300);
  else startTimer = setTimeout(() => GT.show(el, 'racing', 0, countdown), 200);
  raf = requestAnimationFrame(loop);

  return () => {
    disposed = true;
    clearTimeout(startTimer);
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', key);
    HK._pauseHook = null;
    if (S.saveAcc > 0) HK.addGameTime(child, S.saveAcc);
  };
};
