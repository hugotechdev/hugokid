/* HUGO KID - racing.js : Mchezo wa Mbio za Magari */

const RACE_CARS = [
  { name: 'Duma', color: '#F65B4F', dark: '#C63D33', cost: 0 },
  { name: 'Twiga', color: '#FFC20E', dark: '#D29E00', cost: 60 },
  { name: 'Kifaru', color: '#1EA7F0', dark: '#1381BD', cost: 150 },
  { name: 'Tai', color: '#7B61FF', dark: '#5A43D6', cost: 300 },
];
const RACE_THEMES = [
  { name: 'Serengeti', c: 'var(--sun)', cd: 'var(--sun-d)', ground: '#9BC85A', ground2: '#8AB84B', deco: 'acacia', scene: 'race-serengeti' },
  { name: 'Ufukweni', c: 'var(--blue)', cd: 'var(--blue-d)', ground: '#F1D59A', ground2: '#E8C985', deco: 'palm', sea: true, scene: 'lugha' },
  { name: 'Kilimanjaro', c: 'var(--teal)', cd: 'var(--teal-d)', ground: '#A9C3B0', ground2: '#9AB6A1', deco: 'pine', snow: true, scene: 'race-kilimanjaro' },
];

function raceData(c) {
  c.racing = Object.assign({ unlocked: 1, best: {}, cars: [0], car: 0 }, c.racing || {});
  return c.racing;
}

/* chora gari (juu-chini) */
function drawCar(ctx, x, y, w, h, color, dark, glow) {
  ctx.save();
  ctx.translate(x, y);
  if (glow) { ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 18; }
  // magurudumu
  ctx.fillStyle = '#1B2233';
  const ww = w * 0.16, wh = h * 0.2;
  [[-w / 2 - ww * 0.35, -h * 0.32], [w / 2 - ww * 0.65, -h * 0.32], [-w / 2 - ww * 0.35, h * 0.14], [w / 2 - ww * 0.65, h * 0.14]]
    .forEach(([a, b]) => { rr(ctx, a, b, ww, wh, 4); ctx.fill(); });
  // bodi
  const paint = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  paint.addColorStop(0, dark); paint.addColorStop(.28, color);
  paint.addColorStop(.55, color); paint.addColorStop(1, dark);
  ctx.fillStyle = paint;
  ctx.shadowColor = '#10162677'; ctx.shadowBlur = glow ? 18 : 8;
  rr(ctx, -w / 2, -h / 2, w, h, w * 0.32); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = dark;
  rr(ctx, -w / 2 + w * 0.12, -h * 0.05, w * 0.76, h * 0.42, w * 0.18); ctx.fill();
  // kioo
  const windshield = ctx.createLinearGradient(0, -h * .3, 0, -h * .08);
  windshield.addColorStop(0, '#e1f6ff'); windshield.addColorStop(.42, '#89b9d0'); windshield.addColorStop(1, '#273a51');
  ctx.fillStyle = windshield;
  rr(ctx, -w / 2 + w * 0.17, -h * 0.3, w * 0.66, h * 0.22, w * 0.14); ctx.fill();
  ctx.fillStyle = '#6d9ab2';
  rr(ctx, -w * .25, h * .25, w * .5, h * .11, w * .08); ctx.fill();
  ctx.fillStyle = '#f4b3a5';
  ctx.fillRect(-w * .28, h * .42, w * .15, h * .035); ctx.fillRect(w * .13, h * .42, w * .15, h * .035);
  // mstari
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  rr(ctx, -w * 0.07, -h / 2 + 4, w * 0.14, h * 0.18, 3); ctx.fill();
  // taa
  ctx.fillStyle = '#FFF3B0';
  ctx.beginPath(); ctx.arc(-w * 0.3, -h / 2 + 6, w * 0.08, 0, 7); ctx.arc(w * 0.3, -h / 2 + 6, w * 0.08, 0, 7); ctx.fill();
  ctx.restore();
}
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ---------- Menyu: ngazi na gereji ---------- */
HK.screens.raceMenu = (el) => {
  const c = Store.active();
  const rd = raceData(c); Store.saveChild(c);
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Mbio za Magari</h1>
      <span class="hud-pill" style="background:#fff">${icon('coin', 18)} <span id="coins">${c.coins || 0}</span></span></div>
    <div class="scroll">
      ${RACE_THEMES.map((t, ti) => `
        <section class="race-region scene-${t.scene}"><h2>${t.name}</h2>
        <div class="levels">${[1, 2, 3].map(n => {
          const lv = ti * 3 + n, open = lv <= rd.unlocked, b = rd.best[lv] || 0;
          return `<button class="level ${open ? '' : 'locked'}" data-lv="${lv}" style="--c:${t.c};--cd:${t.cd}">
            ${open ? lv : icon('lock', 26)}
            <span class="lv-stars">${[1, 2, 3].map(s => `<svg width="14" height="14" viewBox="0 0 24 24" class="${s <= b ? 'on' : ''}"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>`).join('')}</span>
          </button>`;
        }).join('')}</div></section>`).join('')}
      <div class="section-title">Gereji</div>
      <div class="garage" id="garage"></div>
    </div>`;
  $('#bk', el).onclick = () => HK.back();

  $$('.level', el).forEach(b => b.onclick = () => {
    const lv = +b.dataset.lv;
    if (lv > raceData(Store.active()).unlocked) { Sfx.bad(); toast('Maliza ngazi ' + (lv - 1) + ' kwanza'); return; }
    if (HK.gameLeft(Store.active()) <= 0) return HK.go('timeUp');
    Sfx.tap();
    HK.go('racePlay', { level: lv });
  });

  const drawGarage = () => {
    const cc = Store.active(); const r = raceData(cc);
    const g = $('#garage', el);
    g.innerHTML = RACE_CARS.map((car, i) => {
      const own = r.cars.includes(i);
      return `<button class="car-card ${r.car === i ? 'on' : ''}" data-i="${i}"><canvas width="240" height="172"></canvas>
        <div class="c-name">${car.name}</div>
        <div class="c-price">${r.car === i ? 'Unalitumia' : own ? 'Chagua' : icon('coin', 14) + ' ' + car.cost}</div></button>`;
    }).join('');
    $$('.car-card canvas', g).forEach((cv, i) => {
      const x = cv.getContext('2d'); const car = RACE_CARS[i];
      x.save(); x.translate(120, 86); x.rotate(-Math.PI / 2); drawCar(x, 0, 0, 74, 132, car.color, car.dark); x.restore();
    });
    $$('.car-card', g).forEach(b => b.onclick = () => {
      const i = +b.dataset.i; const cc2 = Store.active(); const r2 = raceData(cc2); const car = RACE_CARS[i];
      if (r2.cars.includes(i)) { r2.car = i; Store.saveChild(cc2); Sfx.tap(); drawGarage(); return; }
      if ((cc2.coins || 0) < car.cost) { Sfx.bad(); speak('Unahitaji sarafu ' + car.cost); toast('Unahitaji sarafu ' + car.cost); return; }
      confirmBox(el, 'Nunua ' + car.name + '?', 'Kwa sarafu ' + car.cost + '.', 'Nunua', () => {
        cc2.coins -= car.cost; r2.cars.push(i); r2.car = i; Store.saveChild(cc2);
        Sfx.win(); confetti(el); $('#coins', el).textContent = cc2.coins; drawGarage();
      }, '');
    });
  };
  drawGarage();
};

/* ---------- Maswali ya milango (kujifunza ndani ya mbio) ---------- */
const RACE_COLORS = [
  { n: 'NYEKUNDU', c: '#F65B4F' }, { n: 'BLUU', c: '#1EA7F0' }, { n: 'NJANO', c: '#FFC20E' },
  { n: 'KIJANI', c: '#0FB394' }, { n: 'ZAMBARAU', c: '#7B61FF' },
];
function raceQuestion(group, level) {
  const R = n => Math.floor(Math.random() * n);
  const shuffle = a => a.sort(() => Math.random() - 0.5);
  if (group === 'explorer') {
    const opts = shuffle(RACE_COLORS.slice()).slice(0, 3);
    const ans = opts[R(3)];
    return { q: 'Pita kwenye rangi ya ' + ans.n, say: 'Pita kwenye rangi ya ' + ans.n.toLowerCase(), opts: opts.map(o => ({ label: '', color: o.c, ok: o === ans })) };
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
  const say = `${a} ${{ '+': 'jumlisha', '-': 'toa', 'x': 'mara', '÷': 'gawanya kwa' }[op]} ${b} ni ngapi?`;
  return { q: `${a} ${op} ${b} = ?`, say, opts };
}

/* ---------- Mchezo wenyewe ---------- */
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
    W = el.clientWidth; H = el.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);

  const road = () => { const rw = Math.min(W * 0.8, 430); return { l: (W - rw) / 2, w: rw, lw: rw / 3 }; };
  const laneX = i => { const r = road(); return r.l + r.lw * (i + 0.5); };

  const S = {
    dist: 0, speed: CFG.speed, boost: 0, slow: 0, lane: 1, x: 0,
    hearts: CFG.hearts, coins: 0, inv: 0, objs: [], decos: [],
    nextRow: 600, nextGate: 2400, noSpawnUntil: 0, gate: null,
    paused: false, over: false, time: 0, saveAcc: 0, warned: false, correct: 0, shake: 0, msgT: 0,
  };
  S.x = laneX(1);

  const playerY = () => H - Math.max(120, H * 0.18);
  const carW = () => Math.min(road().lw * 0.58, 64);
  const carH = () => carW() * 1.75;

  function msg(text, color = '#fff') {
    const m = document.createElement('div');
    m.className = 'race-msg'; m.textContent = text; m.style.color = color;
    el.appendChild(m); setTimeout(() => m.remove(), 900);
  }

  /* ----- kuweka vitu barabarani ----- */
  function spawnRow() {
    const lanes = [0, 1, 2].sort(() => Math.random() - 0.5);
    const blocks = Math.random() < CFG.double ? 2 : 1;
    for (let i = 0; i < blocks; i++) {
      const type = Math.random() < 0.7 ? 'car' : 'rock';
      const cols = [['#5C6B8A', '#45526D'], ['#E8EEF7', '#B9C4D6'], ['#2E8B6E', '#226A54'], ['#C48A3A', '#9A6A28'], ['#9D4EDD', '#7B35B5']];
      const col = cols[Math.floor(Math.random() * cols.length)];
      S.objs.push({ type, lane: lanes[i], y: -120, color: col[0], dark: col[1], vy: type === 'car' ? 0.35 : 0 });
    }
    const free = lanes[blocks];
    const n = Math.random() < 0.5 ? 3 : 1;
    for (let k = 0; k < n; k++) S.objs.push({ type: 'coin', lane: free, y: -120 - k * 70 - (blocks ? 160 : 0) });
  }
  function spawnGate() {
    const q = raceQuestion(group, level);
    S.gate = { y: -140, q, done: false };
    const box = $('#q', el);
    box.textContent = q.q;
    box.classList.remove('hidden-q');
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

  /* ----- kuchora ----- */
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
    // ardhi
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
    // barabara
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
    // mstari wa kumaliza
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

  /* ----- mantiki ----- */
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
    const v = S.speed * (S.boost > 0 ? 1.45 : 1) * (S.slow > 0 ? 0.45 : 1);
    const dy = v * dt;
    S.dist += dy;

    // lainisha kusogea kwa gari
    S.x += (laneX(S.lane) - S.x) * Math.min(1, dt * 14);

    // kuweka vitu
    if (S.dist >= S.nextGate && S.dist < LENGTH - 1400 && !S.gate) {
      spawnGate(); S.noSpawnUntil = S.dist + 900; S.nextGate = S.dist + 2600 + Math.random() * 800;
    }
    if (S.dist >= S.nextRow && S.dist < LENGTH - 500) {
      if (S.dist > S.noSpawnUntil && (S.gate || S.dist < S.nextGate - 1100 || S.nextGate > LENGTH - 1400)) spawnRow();
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
          if (CFG.hearts > 9) { S.slow = 1; msg('Pole! Endelea', '#FFE07A'); }
          else {
            S.hearts--; S.inv = 1.6; S.slow = 0.6;
            $('#hearts', el).textContent = S.hearts;
            if (S.hearts <= 0) return finish(false);
          }
        }
      }
    }
    S.objs = S.objs.filter(o => !o.gone && o.y < H + 120);

    // mlango wa swali
    if (S.gate) {
      S.gate.y += dy;
      if (!S.gate.done && S.gate.y >= playerY() - 10) {
        S.gate.done = true;
        const ok = S.gate.q.opts[S.lane].ok;
        if (ok) {
          S.correct++; S.coins += 5; S.boost = 1.6; Sfx.good(); celebrateMascot(el); msg('Hongera! +5', '#FFE07A');
          speak(['Hongera!', 'Safi sana!', 'Umeweza!'][Math.floor(Math.random() * 3)]);
        } else { Sfx.bad(); msg('Karibu! Jaribu tena'); }
        $('#q', el).classList.add('hidden-q');
      }
      if (S.gate.y > H + 80) S.gate = null;
    }

    $('#coins', el).textContent = S.coins;
    $('#prog', el).style.width = Math.min(100, S.dist / LENGTH * 100) + '%';

    // muda wa michezo
    S.saveAcc += dt;
    if (S.saveAcc >= 3) {
      HK.addGameTime(child, S.saveAcc); S.saveAcc = 0;
      const left = HK.gameLeft(Store.active());
      if (left <= 60 && !S.warned) { S.warned = true; toast('Dakika 1 ya michezo imebaki'); speak('Dakika moja imebaki'); }
      if (left <= 0) { S.over = true; HK.go('timeUp', {}, { replace: true }); return; }
    }
    if (S.dist >= LENGTH) finish(true);
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    if (S.shake > 0) ctx.translate((Math.random() - 0.5) * 12 * S.shake / 0.35, 0);
    drawWorld(); drawObjs(); drawPlayer();
    ctx.restore();
  }

  let raf, last = performance.now();
  function loop(t) {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!S.paused && !S.over) {
      if (S.shake > 0) S.shake -= dt;
      update(dt);
    }
    if (!S.over) render();
    raf = requestAnimationFrame(loop);
  }

  /* ----- vidhibiti ----- */
  const move = d => { if (S.paused || S.over) return; const n = Math.max(0, Math.min(2, S.lane + d)); if (n !== S.lane) { S.lane = n; Sfx.tap(); } };
  let sx = null;
  cv.addEventListener('pointerdown', e => { sx = e.clientX; });
  cv.addEventListener('pointerup', e => {
    if (sx == null) return;
    const dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 30) move(dx > 0 ? 1 : -1);
    else move(e.clientX < W / 2 ? -1 : 1);
  });
  const key = e => { if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1); };
  window.addEventListener('keydown', key);

  function pause() {
    if (S.over || S.paused) return;
    S.paused = true;
    modal(el, {
      iconName: 'pause', iconColor: 'var(--blue)', title: 'Umesimama',
      buttons: [
        { label: 'Endelea', icon: 'play', onClick: () => { S.paused = false; last = performance.now(); } },
        { label: 'Jinsi ya kucheza', cls: 'blue', icon: 'help', onClick: () => GT.show(el, 'racing', 0, () => { S.paused = false; last = performance.now(); }) },
        { label: 'Anza upya', cls: 'sun', icon: 'repeat', onClick: () => HK.go('racePlay', { level }, { replace: true }) },
        { label: 'Toka', cls: 'ghost', onClick: () => { S.over = true; HK.leave(); } },
      ],
    });
  }
  $('#pause', el).onclick = pause;
  HK.setBack(() => { pause(); return true; });
  HK._pauseHook = pause;

  function finish(won) {
    if (S.over) return;
    S.over = true;
    HK.addGameTime(child, S.saveAcc); S.saveAcc = 0;
    $('#q', el).classList.add('hidden-q');
    const cc = Store.active(); const r = raceData(cc);
    cc.coins = (cc.coins || 0) + S.coins;
    let stars = 0;
    if (won) {
      stars = CFG.hearts > 9 ? 3 : Math.max(1, S.hearts);
      const prev = r.best[level] || 0;
      if (stars > prev) { cc.stars = (cc.stars || 0) + (stars - prev); r.best[level] = stars; }
      if (level >= r.unlocked && level < 9) r.unlocked = level + 1;
      Sfx.win(); confetti(el);
      speak(level === 9 ? 'Hongera bingwa! Umemaliza mbio zote!' : 'Hongera! Umemaliza ngazi ya ' + level);
    } else { Sfx.bad(); speak('Pole, jaribu tena. Unaweza!'); }
    Store.saveChild(cc);
    const leftNow = HK.gameLeft(cc);
    modal(el, {
      iconName: won ? 'trophy' : 'repeat', iconColor: won ? 'var(--sun)' : 'var(--coral)',
      title: won ? (level === 9 ? 'Bingwa wa Mbio!' : 'Umemaliza!') : 'Jaribu tena',
      html: `${won ? `<div class="earned">${starsHTML(stars, 3, 44)}</div>` : ''}
        <p>Sarafu ${S.coins}${S.correct ? ' · Maswali sahihi ' + S.correct : ''}</p>`,
      buttons: [
        ...(won && level < 9 && leftNow > 0 ? [{ label: 'Ngazi inayofuata', icon: 'chevR', onClick: () => HK.go('racePlay', { level: level + 1 }, { replace: true }) }] : []),
        ...(leftNow > 0 ? [{ label: 'Cheza tena', cls: won ? 'sun' : '', icon: 'repeat', onClick: () => HK.go('racePlay', { level }, { replace: true }) }] : []),
        { label: leftNow > 0 ? 'Ngazi zote' : 'Muda umekwisha', cls: 'ghost', onClick: () => leftNow > 0 ? HK.leave() : HK.go('timeUp', {}, { replace: true }) },
      ],
    });
  }

  // anza: mafunzo (mara ya kwanza), kisha hesabu 3-2-1
  S.paused = true;
  let n = 3;
  const countdown = () => {
    if (n === 0) { msg('Twende!', '#FFE07A'); speak('Twende!'); S.paused = false; last = performance.now(); return; }
    msg(String(n)); Sfx.tone(520, 0.12, 'square', 0.1); n--; setTimeout(countdown, 750);
  };
  if (GT.seen(child, 'racing')) setTimeout(countdown, 300);
  else setTimeout(() => GT.show(el, 'racing', 0, countdown), 200);
  raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('keydown', key);
    HK._pauseHook = null;
    if (S.saveAcc > 0) HK.addGameTime(child, S.saveAcc);
  };
};
