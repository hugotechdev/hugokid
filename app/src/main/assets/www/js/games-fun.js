

function gameCanvas(kit) {
  kit.body.innerHTML = '<canvas class="full"></canvas>';
  const cv = $('canvas', kit.body), ctx = cv.getContext('2d');
  const s = { W: 0, H: 0 };
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    s.W = kit.body.clientWidth; s.H = kit.body.clientHeight;
    cv.width = s.W * dpr; cv.height = s.H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize(); window.addEventListener('resize', resize);
  s.cv = cv; s.ctx = ctx; s.off = () => window.removeEventListener('resize', resize);
  return s;
}
function loopRun(fn) {
  let raf, last = performance.now(), stop = false;
  const f = t => { const dt = Math.min(0.05, (t - last) / 1000); last = t; if (!stop) { fn(dt); raf = requestAnimationFrame(f); } };
  raf = requestAnimationFrame(f);
  return () => { stop = true; cancelAnimationFrame(raf); };
}
function drawKid(ctx, x, y, r, color, t, portrait) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#FFF3E2'; ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.7, 0, 7); ctx.fill();
  ctx.fillStyle = '#0D2461';
  ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.05, r * 0.11, 0, 7); ctx.arc(r * 0.25, -r * 0.05, r * 0.11, 0, 7); ctx.fill();
  ctx.strokeStyle = '#0D2461'; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.3, 0.2, Math.PI - 0.2); ctx.stroke();
  if (portrait?.naturalWidth) {
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r - 2, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(portrait, -r, -r, r * 2, r * 2);
    ctx.restore();
  }
  // miguu
  const sw = Math.sin((t || 0) * 18) * r * 0.3;
  ctx.strokeStyle = color; ctx.lineWidth = r * 0.22;
  ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.9); ctx.lineTo(-r * 0.3 + sw, r * 1.35); ctx.moveTo(r * 0.3, r * 0.9); ctx.lineTo(r * 0.3 - sw, r * 1.35); ctx.stroke();
  ctx.restore();
}

/* ===== Mkimbiaji wa Mbugani ===== */
HK.screens.g_runner = (el, p) => {
  const kit = GK.frame(el, 'runner', { level: p.level });
  const C = gameCanvas(kit), ctx = C.ctx;
  kit.body.classList.add('game-canvas');
  const avatar = new Image();
  const avatarSrc = kidAvatarSrc(kit.child);
  if (avatarSrc) avatar.src = avatarSrc;
  const hearts0 = kit.g === 0 ? 99 : 3;
  const S = { x: 0, y: 0, vy: 0, on: true, dist: 0, hearts: hearts0, inv: 0, obs: [], next: 500, t: 0, slow: 0 };
  const speed = [230, 300, 370][kit.g] + kit.level * 12;
  const LEN = 5000 + kit.level * 600;
  const ground = () => C.H * 0.74;
  const R = 22;
  S.y = ground() - R * 1.35;
  const jump = () => { if (S.on && !kit.paused) { S.vy = -Math.sqrt(2 * 1900 * (R * 5.2)); S.on = false; Sfx.tone(700, 0.08, 'triangle', 0.1, 0, 300); } };
  C.cv.addEventListener('pointerdown', jump);
  const key = e => { if (e.key === ' ' || e.key === 'ArrowUp') jump(); };
  window.addEventListener('keydown', key);
  speak("Tap the screen to jump");

  const stop = loopRun(dt => {
    if (kit.paused || kit.ended) return draw();
    S.t += dt; if (S.inv > 0) S.inv -= dt; if (S.slow > 0) S.slow -= dt;
    const v = speed * (S.slow > 0 ? 0.5 : 1), dx = v * dt;
    S.dist += dx;
    S.vy += 1900 * dt; S.y += S.vy * dt;
    const gy = ground() - R * 1.35;
    if (S.y >= gy) { S.y = gy; S.vy = 0; S.on = true; }
    if (S.dist > S.next && S.dist < LEN - 400) {
      const r = Math.random();
      if (r < 0.5) S.obs.push({ t: 'rock', x: C.W + 40, w: 34, h: 28 });
      else if (r < 0.75) S.obs.push({ t: 'log', x: C.W + 40, w: 60, h: 24 });
      else if (kit.g === 2 && r < 0.9) S.obs.push({ t: 'bird', x: C.W + 40, w: 36, h: 22, y: ground() - R * 5.6 });
      for (let k = 0; k < 3; k++) S.obs.push({ t: 'coin', x: C.W + 140 + k * 36, y: ground() - R * (rnd(2) ? 1.5 : 5) });
      S.next = S.dist + [520, 420, 340][kit.g] + rnd(260);
    }
    S.obs.forEach(o => o.x -= dx);
    const px = C.W * 0.22;
    for (const o of S.obs) {
      if (o.gone) continue;
      if (o.t === 'coin') { if (Math.hypot(o.x - px, o.y - S.y) < R + 12) { o.gone = true; kit.addCoins(1); } continue; }
      const oy = o.t === 'bird' ? o.y : ground() - o.h;
      const hitX = Math.abs(o.x - px) < o.w / 2 + R * 0.7;
      const hitY = S.y + R * 1.2 > oy && S.y - R < oy + o.h;
      if (hitX && hitY && S.inv <= 0) {
        o.gone = true; Sfx.crash(); vibrate(120);
        if (hearts0 > 9) S.slow = 0.8;
        else { S.hearts--; S.inv = 1.4; if (S.hearts <= 0) return kit.finish({ won: false, text: 'Umeishiwa na mioyo' }); }
      }
    }
    S.obs = S.obs.filter(o => !o.gone && o.x > -80);
    if (S.dist >= LEN) kit.finish({ stars: hearts0 > 9 ? 3 : Math.max(1, S.hearts), text: 'Umefika mwisho' });
    draw();
  });

  function draw() {
    const W = C.W, H = C.H, g = ground();
    ctx.clearRect(0, 0, W, H);
    const dirt = ctx.createLinearGradient(0, g, 0, H);
    dirt.addColorStop(0, '#ecd0a1'); dirt.addColorStop(0.11, '#c19a67'); dirt.addColorStop(1, '#5e3f22c4');
    ctx.fillStyle = dirt; ctx.fillRect(0, g, W, H - g);
    ctx.fillStyle = '#553b2526';
    for (let x = -(S.dist % 72); x < W; x += 72) {
      ctx.beginPath(); ctx.ellipse(x, g + 20, 13, 2, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 26, g + 38, 7, 3, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#2d281e40';
    ctx.beginPath(); ctx.ellipse(W * 0.22, g + 2, 22, 5, 0, 0, 7); ctx.fill();
    const fx = C.W * 0.22 + (LEN - S.dist);
    if (fx < W + 20) { ctx.fillStyle = '#0D2461'; ctx.fillRect(fx, g - 110, 6, 110); ctx.fillStyle = '#F65B4F'; ctx.beginPath(); ctx.moveTo(fx + 6, g - 110); ctx.lineTo(fx + 56, g - 92); ctx.lineTo(fx + 6, g - 74); ctx.fill(); }
    S.obs.forEach(o => {
      if (o.t === 'coin') { ctx.fillStyle = '#FFC20E'; ctx.beginPath(); ctx.arc(o.x, o.y, 11, 0, 7); ctx.fill(); ctx.strokeStyle = '#D29E00'; ctx.lineWidth = 3; ctx.stroke(); }
      else if (o.t === 'rock') { ctx.fillStyle = '#7D7F86'; ctx.beginPath(); ctx.ellipse(o.x, g - o.h / 2, o.w / 2, o.h / 2 + 2, 0, 0, 7); ctx.fill(); }
      else if (o.t === 'log') { ctx.fillStyle = '#8A5A2B'; rr(ctx, o.x - o.w / 2, g - o.h, o.w, o.h, 10); ctx.fill(); ctx.fillStyle = '#C48A50'; ctx.beginPath(); ctx.ellipse(o.x + o.w / 2 - 6, g - o.h / 2, 6, o.h / 2 - 2, 0, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = '#3A4D80'; ctx.beginPath(); ctx.ellipse(o.x, o.y + 10, 14, 9, 0, 0, 7); ctx.fill(); const f = Math.sin(S.t * 14) * 10; ctx.beginPath(); ctx.moveTo(o.x - 4, o.y + 8); ctx.lineTo(o.x - 22, o.y + f); ctx.lineTo(o.x + 4, o.y + 8); ctx.fill(); }
    });
    if (!(S.inv > 0 && Math.floor(S.inv * 10) % 2 === 0)) drawKid(ctx, C.W * 0.22, S.y, R, kit.child.color, S.on ? S.t : 0, avatar);
    // HUD
    ctx.fillStyle = 'rgba(255,255,255,.7)'; rr(ctx, 16, 14, W - 32, 12, 6); ctx.fill();
    ctx.fillStyle = '#0FB394'; rr(ctx, 16, 14, (W - 32) * Math.min(1, S.dist / LEN), 12, 6); ctx.fill();
    if (hearts0 < 9) { ctx.fillStyle = '#F65B4F'; ctx.font = '900 20px Outfit, Roboto, sans-serif'; ctx.fillText('♥'.repeat(Math.max(0, S.hearts)), 18, 52); }
  }
  return () => { stop(); C.off(); window.removeEventListener('keydown', key); kit.cleanup(); };
};

/* ===== Rubani Mdogo ===== */
HK.screens.g_pilot = (el, p) => {
  const kit = GK.frame(el, 'pilot', { level: p.level });
  const C = gameCanvas(kit), ctx = C.ctx;
  kit.body.classList.add('game-canvas');
  const S = { y: 0, vy: 0, hold: false, rings: [], birds: [], got: 0, made: 0, t: 0, next: 1.2, hearts: kit.g === 0 ? 99 : 3, inv: 0, clouds: [] };
  const TOTAL = 10 + kit.level * 2;
  const speed = [170, 220, 270][kit.g] + kit.level * 8;
  S.y = C.H / 2;
  C.cv.addEventListener('pointerdown', () => { S.hold = true; });
  window.addEventListener('pointerup', up);
  function up() { S.hold = false; }
  speak("Hold the screen to go up, release to go down. Fly through the rings");
  for (let k = 0; k < 5; k++) S.clouds.push({ x: Math.random() * C.W, y: Math.random() * C.H * 0.8, s: 0.6 + Math.random() });

  const stop = loopRun(dt => {
    if (!kit.paused && !kit.ended) {
      S.t += dt; if (S.inv > 0) S.inv -= dt;
      S.vy += (S.hold ? -900 : 650) * dt; S.vy = Math.max(-320, Math.min(320, S.vy));
      S.y += S.vy * dt; S.y = Math.max(30, Math.min(C.H - 30, S.y));
      if ((S.y <= 30 || S.y >= C.H - 30)) S.vy = 0;
      S.next -= dt;
      if (S.next <= 0 && S.made < TOTAL) {
        S.made++;
        const gap = [130, 110, 90][kit.g];
        S.rings.push({ x: C.W + 40, y: 80 + Math.random() * (C.H - 160), r: gap / 2, done: false });
        if (kit.g > 0 && Math.random() < 0.35 + kit.level * 0.03) S.birds.push({ x: C.W + 40 + speed * 0.9, y: 60 + Math.random() * (C.H - 120) });
        S.next = 1.6 - kit.g * 0.15;
      }
      const dx = speed * dt;
      S.clouds.forEach(c => { c.x -= dx * 0.4 * c.s; if (c.x < -100) { c.x = C.W + 80; c.y = Math.random() * C.H * 0.8; } });
      const px = C.W * 0.25;
      S.rings.forEach(r => {
        r.x -= dx;
        if (!r.done && r.x < px) { r.done = true; if (Math.abs(S.y - r.y) < r.r * 0.8) { S.got++; r.ok = true; kit.addCoins(2); Sfx.good(); } else { r.ok = false; Sfx.bad(); } }
      });
      S.birds.forEach(b => { b.x -= dx * 1.15; if (!b.hit && S.inv <= 0 && Math.abs(b.x - px) < 30 && Math.abs(b.y - S.y) < 24) { b.hit = true; S.hearts--; S.inv = 1.3; Sfx.crash(); vibrate(100); if (S.hearts <= 0) kit.finish({ won: false, text: 'Ndege imegongwa' }); } });
      S.rings = S.rings.filter(r => r.x > -60); S.birds = S.birds.filter(b => b.x > -60);
      if (S.made >= TOTAL && !S.rings.length && !kit.ended) {
        const ratio = S.got / TOTAL;
        kit.finish({ won: ratio >= 0.4, stars: ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1, text: `Pete ${S.got}/${TOTAL}` });
      }
    }
    draw();
  });
  function draw() {
    const W = C.W, H = C.H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(255,255,255,.31)';
    S.clouds.forEach(c => { ctx.beginPath(); ctx.ellipse(c.x, c.y, 40 * c.s, 16 * c.s, 0, 0, 7); ctx.ellipse(c.x + 24 * c.s, c.y - 8 * c.s, 26 * c.s, 14 * c.s, 0, 0, 7); ctx.fill(); });
    S.rings.forEach(r => {
      ctx.lineWidth = 10; ctx.strokeStyle = r.done ? (r.ok ? '#0FB394' : 'rgba(246,91,79,.5)') : '#FFC20E';
      ctx.beginPath(); ctx.ellipse(r.x, r.y, 14, r.r, 0, 0, 7); ctx.stroke();
    });
    S.birds.forEach(b => { if (b.hit) return; ctx.fillStyle = '#3A4D80'; ctx.beginPath(); ctx.ellipse(b.x, b.y, 15, 9, 0, 0, 7); ctx.fill(); const f = Math.sin(S.t * 14) * 10; ctx.beginPath(); ctx.moveTo(b.x - 2, b.y - 2); ctx.lineTo(b.x + 8, b.y - 16 + f); ctx.lineTo(b.x + 10, b.y); ctx.fill(); });
    // ndege yetu
    if (!(S.inv > 0 && Math.floor(S.inv * 10) % 2 === 0)) {
      ctx.save(); ctx.translate(W * 0.25, S.y); ctx.rotate(S.vy / 900);
      const paint = ctx.createLinearGradient(0, -10, 0, 12);
      paint.addColorStop(0, '#ffcbb6'); paint.addColorStop(0.36, '#f77757'); paint.addColorStop(1, '#a93032');
      ctx.fillStyle = paint; rr(ctx, -34, -10, 64, 20, 10); ctx.fill();
      ctx.fillStyle = '#C63D33'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-20, 26); ctx.lineTo(8, 0); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-28, -6); ctx.lineTo(-40, -22); ctx.lineTo(-22, -6); ctx.fill();
      ctx.fillStyle = '#BFE6FB'; rr(ctx, 6, -7, 14, 8, 4); ctx.fill();
      ctx.fillStyle = '#0D2461'; ctx.fillRect(30, -12 + Math.sin(S.t * 40) * 10, 3, 24 - Math.abs(Math.sin(S.t * 40) * 10));
      ctx.restore();
    }
    ctx.fillStyle = '#0D2461'; ctx.font = '900 18px Outfit, Roboto, sans-serif';
    ctx.fillText(`Pete ${S.got}/${TOTAL}` + (S.hearts < 9 ? '   ' + '♥'.repeat(Math.max(0, S.hearts)) : ''), 16, 30);
  }
  return () => { stop(); C.off(); window.removeEventListener('pointerup', up); kit.cleanup(); };
};

/* ===== Penalti ===== */
HK.screens.g_penalty = (el, p) => {
  const kit = GK.frame(el, 'penalty', { level: p.level });
  const C = gameCanvas(kit), ctx = C.ctx;
  kit.body.classList.add('game-canvas');
  const rounds = 5, keepTurns = kit.g > 0;
  const keeperSkill = Math.min(0.68, [0.18, 0.3, 0.42][kit.g] + kit.level * 0.02);
  const S = { turn: 'shoot', n: 0, me: 0, cpu: 0, anim: null, keeper: 4, msg: '', t: 0, log: [] };

  const goal = () => ({ x: C.W * 0.08, y: C.H * 0.3, w: C.W * 0.84, h: C.H * 0.32 });
  const zoneRect = z => { const g = goal(); const c = z % 3, r = Math.floor(z / 3); return { x: g.x + g.w / 3 * c, y: g.y + g.h / 2 * r, w: g.w / 3, h: g.h / 2 }; };
  const zoneAt = (x, y) => { const g = goal(); if (x < g.x || x > g.x + g.w || y < g.y || y > g.y + g.h) return -1; return Math.floor((x - g.x) / (g.w / 3)) + 3 * Math.floor((y - g.y) / (g.h / 2)); };
  const say = t => { S.msg = t; speak(t); };
  say("Tap the goal to take a penalty");

  C.cv.addEventListener('pointerdown', e => {
    if (S.anim || kit.paused || kit.ended) return;
    const r = C.cv.getBoundingClientRect();
    const z = zoneAt(e.clientX - r.left, e.clientY - r.top);
    if (z < 0) return;
    if (S.turn === 'shoot') {
      const dive = Math.random() < keeperSkill ? z : rnd(6);
      S.anim = { kind: 'shoot', target: z, dive, t: 0 };
      Sfx.tone(180, 0.1, 'square', 0.15);
    } else if (S.turn === 'save' && S.pending != null) {
      S.myDive = z;
    }
  });

  const startSave = () => {
    S.turn = 'save'; S.myDive = null; S.pending = rnd(6);
    say("Now you are the goalkeeper! Tap the side to save");
    setTimeout(() => { if (!kit.ended) S.anim = { kind: 'save', target: S.pending, t: 0 }; }, 1300);
  };
  const nextTurn = () => {
    if (S.turn === 'shoot' && keepTurns) return startSave();
    S.n++;
    if (S.n >= rounds) {
      const won = keepTurns ? S.me > S.cpu : S.me >= 3;
      const stars = S.me >= 5 ? 3 : S.me >= 4 ? 2 : 1;
      return kit.finish({ won: won || (keepTurns && S.me === S.cpu && S.me >= 3), stars, text: keepTurns ? `Wewe ${S.me} - ${S.cpu} Kompyuta` : `Magoli ${S.me}/5` });
    }
    S.turn = 'shoot'; say("Kick again!");
  };

  const stop = loopRun(dt => {
    S.t += dt;
    if (S.anim && !kit.paused) {
      const a = S.anim; a.t += dt / (a.kind === 'save' ? 1.1 : 0.7);
      if (a.kind === 'save' && S.myDive != null) S.keeper = S.myDive;
      if (a.kind === 'shoot') S.keeper = a.t > 0.25 ? a.dive : 4;
      if (a.t >= 1) {
        if (a.kind === 'shoot') {
          if (a.dive === a.target) { say("The goalkeeper saved it!"); Sfx.bad(); S.log.push('x'); }
          else { S.me++; kit.addCoins(3); say("Goal!"); Sfx.win(); S.log.push('o'); }
        } else {
          if (S.myDive === a.target) { say("You saved it! Well done"); kit.addCoins(3); Sfx.good(); }
          else { S.cpu++; say("Computer's goal"); Sfx.bad(); }
        }
        S.anim = null; S.keeper = 4;
        setTimeout(nextTurn, 1100);
      }
    }
    draw();
  });

  function draw() {
    const W = C.W, H = C.H, g = goal();
    ctx.clearRect(0, 0, W, H);
    const pitch = ctx.createLinearGradient(0, 0, 0, H);
    pitch.addColorStop(0, '#18302c29'); pitch.addColorStop(.75, '#18302c00'); pitch.addColorStop(1, '#18302c49');
    ctx.fillStyle = pitch; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 4;
    ctx.strokeRect(W * 0.04, g.y + g.h, W * 0.92, H * 0.24);
    // wavu
    ctx.fillStyle = 'rgba(255,255,255,.34)'; ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1;
    for (let x = g.x; x < g.x + g.w; x += 16) { ctx.beginPath(); ctx.moveTo(x, g.y); ctx.lineTo(x, g.y + g.h); ctx.stroke(); }
    for (let y = g.y; y < g.y + g.h; y += 16) { ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; ctx.strokeRect(g.x, g.y, g.w, g.h);
    // maeneo
    if (!S.anim) for (let z = 0; z < 6; z++) { const r = zoneRect(z); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.strokeRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12); ctx.setLineDash([]); }
    // kipa
    const kr = zoneRect(S.keeper === 4 && !S.anim ? 4 : S.keeper);
    const kx = S.keeper === 4 && !S.anim ? g.x + g.w / 2 : kr.x + kr.w / 2, ky = S.keeper === 4 && !S.anim ? g.y + g.h * 0.62 : kr.y + kr.h / 2;
    const kc = S.turn === 'save' ? kit.child.color : '#3A4D80';
    ctx.fillStyle = kc; rr(ctx, kx - 22, ky - 20, 44, 46, 14); ctx.fill();
    ctx.fillStyle = '#FFF3E2'; ctx.beginPath(); ctx.arc(kx, ky - 30, 15, 0, 7); ctx.fill();
    ctx.fillStyle = '#FFC20E'; ctx.beginPath(); ctx.arc(kx - 30, ky - 14, 10, 0, 7); ctx.arc(kx + 30, ky - 14, 10, 0, 7); ctx.fill();
    // mpira
    let bx = W / 2, by = H * 0.84, bs = 22;
    if (S.anim) {
      const tr = zoneRect(S.anim.target), tx = tr.x + tr.w / 2, ty = tr.y + tr.h / 2;
      const t = Math.min(1, S.anim.t);
      const sx = W / 2, sy = S.anim.kind === 'save' ? H * 0.7 : H * 0.84;
      bx = sx + (tx - sx) * t; by = sy + (ty - sy) * t - Math.sin(t * Math.PI) * 40; bs = 22 - 8 * t;
      if (S.anim.kind === 'save') { bx = tx + (W / 2 - tx) * (1 - t); by = ty + (H * 0.7 - ty) * (1 - t); bs = 10 + 14 * t; }
    }
    const leather = ctx.createRadialGradient(bx - bs * .34, by - bs * .4, 2, bx, by, bs);
    leather.addColorStop(0, '#fff'); leather.addColorStop(.73, '#eef2eb'); leather.addColorStop(1, '#aab8ba');
    ctx.fillStyle = leather; ctx.beginPath(); ctx.arc(bx, by, bs, 0, 7); ctx.fill();
    ctx.fillStyle = '#25334b';
    const spin = (S.anim?.t || 0) * Math.PI * 2;
    for (let patch = 0; patch < 6; patch++) {
      const a = patch * Math.PI * 2 / 5 + spin;
      const offset = patch === 5 ? 0 : bs * .8;
      const x = bx + Math.cos(a) * offset, y = by + Math.sin(a) * offset;
      ctx.beginPath();
      for (let corner = 0; corner < 5; corner++) {
        const theta = a + corner * Math.PI * 2 / 5;
        ctx.lineTo(x + Math.cos(theta) * bs * .19, y + Math.sin(theta) * bs * .19);
      }
      ctx.closePath(); ctx.fill();
    }
    // ubao wa matokeo
    ctx.fillStyle = 'rgba(13,36,97,.85)'; rr(ctx, W / 2 - 110, H - 96, 220, 70, 18); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '900 22px Outfit, Roboto, sans-serif';
    ctx.fillText(keepTurns ? `Wewe ${S.me}  -  ${S.cpu} Komp.` : `Magoli ${S.me} / ${rounds}`, W / 2, H - 66);
    ctx.font = '800 15px Outfit, Roboto, sans-serif'; ctx.fillText(S.msg, W / 2, H - 40);
    ctx.textAlign = 'left';
  }
  return () => { stop(); C.off(); kit.cleanup(); };
};

HK.screens.g_bubbles = (el, p) => {
  const kit = GK.frame(el, 'bubbles', { level: p.level });
  const COLS = 7, ROWS = 9, NC = [3, 4, 5][kit.g];
  const PAL = ['#F65B4F', '#1EA7F0', '#FFC20E', '#0FB394', '#7B61FF'];
  const target = [50, 80, 110][kit.g] + Math.min(kit.level, 14) * 8;
  let grid = Array.from({ length: COLS }, () => Array.from({ length: ROWS }, () => rnd(NC)));
  let score = 0;
  kit.body.innerHTML = `<div class="g-q" style="font-size:18px;min-height:56px"><span id="sc"></span></div>
    <div id="bb" style="flex:1;display:grid;grid-template-columns:repeat(${COLS},1fr);gap:4px;padding:6px 14px 18px;align-content:end"></div>`;
  speak("Tap two or more touching bubbles of the same color");
  const group = (c, r) => {
    const col = grid[c][r]; if (col == null) return [];
    const out = [], seen = new Set(), st = [[c, r]];
    while (st.length) {
      const [x, y] = st.pop(); const k = x + ',' + y;
      if (seen.has(k) || x < 0 || y < 0 || x >= COLS || y >= ROWS || grid[x][y] !== col) continue;
      seen.add(k); out.push([x, y]); st.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
    return out;
  };
  const anyMove = () => { for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) if (grid[c][r] != null && group(c, r).length > 1) return true; return false; };
  const draw = () => {
    $('#sc', el).innerHTML = `Alama ${score} / ${target}`;
    const cells = [];
    for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) {
      const v = grid[c][r];
      cells.push(`<button data-c="${c}" data-r="${r}" style="aspect-ratio:1;border:0;border-radius:50%;padding:0;${v == null ? 'background:transparent' : `background:radial-gradient(circle at 29% 25%, #fff 0, #fff9 10%, #fff0 28%), radial-gradient(circle at 65% 70%, #001c4d52, transparent 62%), ${PAL[v]};box-shadow:inset 0 0 0 2px #fff7,0 4px 6px #0023446a`}"></button>`);
    }
    $('#bb', el).innerHTML = cells.join('');
    $$('#bb button', el).forEach(b => b.onclick = () => pop(+b.dataset.c, +b.dataset.r));
  };
  const pop = (c, r) => {
    if (kit.ended) return;
    const g = group(c, r);
    if (g.length < 2) { Sfx.bad(); return; }
    g.forEach(([x, y]) => grid[x][y] = null);
    score += g.length * (g.length - 1);
    kit.addCoins(g.length >= 5 ? 2 : 0);
    Sfx.tone(500 + g.length * 60, 0.12, 'triangle', 0.14);
    grid = grid.map(col => { const v = col.filter(x => x != null); while (v.length < ROWS) v.push(null); return v; }).filter(col => col[0] != null);
    while (grid.length < COLS) grid.push(Array(ROWS).fill(null));
    draw();
    if (!anyMove()) {
      const left = grid.flat().filter(x => x != null).length;
      if (left === 0) score += 50;
      setTimeout(() => kit.finish({ won: score >= target, stars: score >= target * 1.6 || left === 0 ? 3 : score >= target * 1.25 ? 2 : 1, text: `Alama ${score}` }), 400);
    }
  };
  draw();
  return () => kit.cleanup();
};

/* ===== Jenga Kijiji Chako ===== */
const BUILDS = [
  { id: 'house', name: 'Nyumba', icon: 'home', color: '#F65B4F', cost: 30 },
  { id: 'well', name: 'Kisima', icon: 'bubbles', color: '#1EA7F0', cost: 20 },
  { id: 'tree', name: 'Mti', icon: 'sunrise', color: '#2E9E5B', cost: 5 },
  { id: 'school', name: 'Shule', icon: 'book', color: '#7B61FF', cost: 60 },
  { id: 'shop', name: 'Duka', icon: 'shop', color: '#FF8A3D', cost: 40 },
  { id: 'farm', name: 'Shamba', icon: 'sliders', color: '#B58B2A', cost: 15 },
  { id: 'clinic', name: 'Zahanati', icon: 'plus', color: '#E0476B', cost: 70 },
  { id: 'field', name: 'Uwanja', icon: 'ball', color: '#0FB394', cost: 25 },
];
HK.screens.g_village = (el, p) => {
  const kit = GK.frame(el, 'village', { level: p.level });
  const L = kit.level;
  const COLS = 6, ROWS = 7;
  const pool = BUILDS.slice(0, Math.min(BUILDS.length, 3 + Math.ceil(L / 2)));
  const need = {};
  need.house = 1 + Math.ceil(L / 2); need.tree = 2 + (L % 3); need.well = 1 + Math.floor(L / 4);
  pool.slice(3).forEach((b, k) => { if (k <= L / 3) need[b.id] = 1; });
  const cost = Object.entries(need).reduce((s, [id, n]) => s + BUILDS.find(b => b.id === id).cost * n, 0);
  const budget = Math.round(cost * [1.5, 1.3, 1.15][kit.g] / 5) * 5;
  const nearRule = kit.g > 0;
  const map = Array(COLS * ROWS).fill(null);
  let sel = 'house', money = budget, assistance = 0;
  kit.body.innerHTML = `
    <div class="card" style="margin:0 12px 8px;padding:12px 14px"><div class="row" style="justify-content:space-between"><b>Tasks</b><span class="chip-tag sun">${icon('coin', 14)} <span id="money"></span></span></div>
      <div id="need" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>
      ${nearRule ? '<p style="font-size:13px;margin-top:6px">Kila nyumba iwe karibu na kisima au mti.</p>' : ''}</div>
    <div class="build-grid" id="map" style="grid-template-columns:repeat(${COLS},1fr)"></div>
    <div class="palette" id="pal"></div>
    <div class="btn-row" style="padding:0 12px 14px"><button class="btn ghost" id="erase">${icon('eraser', 20)} Ondoa</button><button class="btn" id="done" style="flex:2">${icon('check', 20)} Nimemaliza</button></div>`;
  speak("Build your village. Don't spend more than the budget");
  const count = id => map.filter(x => x === id).length;
  const draw = () => {
    $('#money', el).textContent = money;
    $('#need', el).innerHTML = Object.entries(need).map(([id, n]) => { const b = BUILDS.find(x => x.id === id); const c = count(id); return `<span class="chip-tag ${c >= n ? 'teal' : ''}">${b.name} ${c}/${n}</span>`; }).join('');
    $('#map', el).innerHTML = map.map((v, i) => { const b = v && BUILDS.find(x => x.id === v); return `<div data-i="${i}" style="${b ? `background:${b.color}` : ''}">${b ? icon(b.icon, 22) : ''}</div>`; }).join('');
    $('#pal', el).innerHTML = pool.map(b => `<button class="${sel === b.id ? 'sel' : ''}" data-b="${b.id}"><span class="pi" style="background:${b.color}">${icon(b.icon, 22)}</span>${b.name}<span style="color:var(--muted)">${b.cost}</span></button>`).join('');
    $('#erase', el).classList.toggle('navy', sel === 'erase');
    $$('#map div', el).forEach(d => d.onclick = () => place(+d.dataset.i));
    $$('#pal button', el).forEach(b => b.onclick = () => { sel = b.dataset.b; Sfx.tap(); speak(BUILDS.find(x => x.id === sel).name); draw(); });
  };
  const place = i => {
    if (kit.ended) return;
    if (sel === 'erase') { if (map[i]) { money += BUILDS.find(x => x.id === map[i]).cost; map[i] = null; Sfx.tap(); draw(); } return; }
    if (map[i]) return;
    const b = BUILDS.find(x => x.id === sel);
    if (money < b.cost) return tokenChallenge(el, b.cost - money, reward => {
      money += reward; assistance += reward; place(i);
    });
    money -= b.cost; map[i] = sel; Sfx.tone(440, 0.1, 'triangle', 0.15); draw();
  };
  $('#erase', el).onclick = () => { sel = sel === 'erase' ? 'house' : 'erase'; draw(); };
  $('#done', el).onclick = () => {
    const miss = Object.entries(need).filter(([id, n]) => count(id) < n);
    if (miss.length) { Sfx.bad(); const b = BUILDS.find(x => x.id === miss[0][0]); speak('Bado unahitaji ' + b.name.toLowerCase()); toast('Bado: ' + miss.map(([id, n]) => BUILDS.find(x => x.id === id).name).join(', ')); return; }
    if (nearRule) {
      const bad = map.some((v, i) => {
        if (v !== 'house') return false;
        const x = i % COLS, y = Math.floor(i / COLS);
        return ![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && (map[ny * COLS + nx] === 'well' || map[ny * COLS + nx] === 'tree'); });
      });
      if (bad) { Sfx.bad(); speak("There is a house without a well or tree nearby"); toast("There is a house without a well or tree nearby"); return; }
    }
    const savings = Math.max(0, money - assistance);
    kit.addCoins(Math.round(savings / 10));
    kit.finish({ stars: savings >= budget * 0.25 ? 3 : savings >= budget * 0.1 ? 2 : 1, text: `Saved ${savings} coins` });
  };
  draw();
  return () => kit.cleanup();
};

const INGR = {
  maji: ['Maji', '#7CC8F5'], chai: ['Majani ya chai', '#5B3A1E'], maziwa: ['Maziwa', '#F4F1EA'], sukari: ['Sukari', '#FFFFFF'],
  unga: ['Unga', '#F3E3C3'], ndimu: ['Ndimu', '#B6D94C'], embe: ['Embe', '#FFB020'], ndizi: ['Ndizi', '#FFD93D'], nanasi: ['Nanasi', '#E3B341'],
  tikiti: ['Tikiti', '#E85D5D'], mafuta: ['Mafuta', '#F2C14E'], chumvi: ['Chumvi', '#DCE3EE'], mchele: ['Mchele', '#FAFAF5'],
  chungwa: ['Chungwa', '#FF8A3D'], karoti: ['Karoti', '#F28C28'], kitunguu: ['Kitunguu', '#C9A0DC'], nyanya: ['Nyanya', '#E23B3B'],
  sabuni: ['Sabuni', '#9BE7FF'], mchanga: ['Mchanga', '#D9B26F'], pipi: ['Pipi', '#FF6FB5'],
};
const RECIPES = [
  { name: 'Chai ya maziwa', items: { maji: 2, chai: 1, maziwa: 1, sukari: 1 } },
  { name: 'Uji', items: { unga: 2, maji: 3, sukari: 1, ndimu: 1 } },
  { name: 'Saladi ya matunda', items: { embe: 1, ndizi: 2, nanasi: 1, tikiti: 1 } },
  { name: 'Chapati', items: { unga: 3, maji: 1, mafuta: 1, chumvi: 1 } },
  { name: 'Wali', items: { mchele: 2, maji: 4, chumvi: 1, mafuta: 1 } },
  { name: 'Juisi ya machungwa', items: { chungwa: 3, maji: 1, sukari: 1 } },
  { name: 'Supu ya mboga', items: { karoti: 2, kitunguu: 1, nyanya: 2, maji: 3, chumvi: 1 } },
];
HK.screens.g_kitchen = (el, p) => {
  const kit = GK.frame(el, 'kitchen', { level: p.level });
  const offset = (kit.level - 1) % RECIPES.length;
  const rotations = [...RECIPES.slice(offset), ...RECIPES.slice(0, offset)];
  const list = rotations.slice(0, 3 + Math.floor((kit.level - 1) / 6));
  let ri = 0, perfect = 0, pot = {}, tries = 0;
  const draw = () => {
    if (ri >= list.length) return kit.finish({ stars: perfect === list.length ? 3 : perfect >= Math.ceil(list.length * 2 / 3) ? 2 : 1, text: `${perfect} of ${list.length} recipes on the first try` });
    const rc = list[ri];
    const want = kit.g === 0 ? Object.fromEntries(Object.keys(rc.items).map(k => [k, 1])) : rc.items;
    const shelf = shuffle([...Object.keys(want), ...shuffle(['sabuni', 'mchanga', 'pipi', ...Object.keys(INGR).filter(k => !want[k] && !['sabuni', 'mchanga', 'pipi'].includes(k))]).slice(0, kit.g === 0 ? 2 : 5)]);
    kit.body.innerHTML = `
      <div class="g-progress">${list.map((_, k) => `<i class="${k < ri ? 'done' : ''}"></i>`).join('')}</div>
      <div class="card" style="margin:0 16px 10px"><div class="row"><b style="font-size:19px" class="grow">${esc(rc.name)}</b><button class="icon-btn" id="say" style="width:40px;height:40px">${icon('volume', 20)}</button></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">${Object.entries(want).map(([k, n]) => `<span class="chip-tag recipe-item ${(pot[k] || 0) === n ? 'teal' : ''}">${pic(k, 22)}${INGR[k][0]}${kit.g ? ' × ' + n : ''}</span>`).join('')}</div></div>
      <div style="display:flex;justify-content:center;margin:2px 0 10px"><svg width="150" height="84" viewBox="0 0 150 84"><ellipse cx="75" cy="18" rx="64" ry="12" fill="#3A4D80"/><path d="M11 18h128l-10 52a14 14 0 0 1-14 12H35a14 14 0 0 1-14-12z" fill="#5C6B8A"/><path d="M0 26h12M138 26h12" stroke="#3A4D80" stroke-width="7" stroke-linecap="round"/>
        <text x="75" y="58" text-anchor="middle" font-weight="900" font-size="18" fill="#fff" font-family="Outfit,Roboto">${Object.values(pot).reduce((a, b) => a + b, 0)}</text></svg></div>
      <div class="ingredients">${shelf.map(k => `<button class="ing" data-k="${k}">${pot[k] ? `<span class="cnt">${pot[k]}</span>` : ''}<span class="dot2" style="--ingredient:${INGR[k][1]}" aria-hidden="true">${pic(k, 40)}</span>${INGR[k][0]}</button>`).join('')}</div>
      <div class="btn-row" style="padding:0 16px 16px"><button class="btn ghost" id="empty">${icon('repeat', 20)} Mwaga</button><button class="btn coral" id="cook" style="flex:2">${icon('pot', 20)} Pika</button></div>`;
    const sayIt = () => speak('Tupike ' + rc.name + '. Tunahitaji ' + Object.entries(want).map(([k, n]) => (kit.g ? n + ' ' : '') + INGR[k][0]).join(', '));
    $('#say', el).onclick = sayIt;
    if (!Object.keys(pot).length && !tries) sayIt();
    $$('.ing', el).forEach(b => b.onclick = () => { const k = b.dataset.k; pot[k] = (pot[k] || 0) + 1; Sfx.tap(); if (['sabuni', 'mchanga', 'pipi'].includes(k)) speak(INGR[k][0] + '? Hiyo si ya chakula hiki!'); draw(); });
    $('#empty', el).onclick = () => { pot = {}; draw(); };
    $('#cook', el).onclick = () => {
      const keys = new Set([...Object.keys(pot), ...Object.keys(want)]);
      const ok = [...keys].every(k => (pot[k] || 0) === (want[k] || 0));
      if (ok) { if (!tries) perfect++; kit.addCoins(tries ? 2 : 4); Sfx.win(); speak('Tamu sana! Umepika ' + rc.name); ri++; pot = {}; tries = 0; setTimeout(draw, 900); }
      else {
        tries++; Sfx.bad();
        const extra = Object.keys(pot).find(k => !want[k]);
        const msg = extra ? INGR[extra][0] + ' haihitajiki' : 'Angalia idadi ya kila kitu';
        speak(msg); toast(msg);
      }
    };
  };
  draw();
  return () => kit.cleanup();
};
