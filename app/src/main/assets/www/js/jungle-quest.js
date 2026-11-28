const JUNGLE_REGIONS = [
  { name: 'Forest Trail', landmark: 'Forest fork', photo: 0, ground: ['#835c3c', '#513b26'], verge: ['#42614e', '#1a3024'], surface: 'earth' },
  { name: 'River Crossing', landmark: 'River bridge', photo: 1, ground: ['#886247', '#4b3524'], verge: ['#3e7162', '#183a39'], surface: 'wood' },
  { name: 'Cave Passage', landmark: 'Cave gate', photo: 2, ground: ['#67655d', '#3b3a39'], verge: ['#4a5243', '#282e29'], surface: 'stone' },
];
const JUNGLE_VIEW = 86;
const JUNGLE_PLAYER_DEPTH = 17;
const JUNGLE_RUNNERS = [
  { id: 'amani', name: 'Amani' },
  { id: 'baraka', name: 'Baraka' },
  { id: 'zuri', name: 'Zuri' },
  { id: 'juma', name: 'Juma' },
  { id: 'neema', name: 'Neema' },
];

function jungleRunner(child) {
  return JUNGLE_RUNNERS.find(runner => runner.id === child?.jungleRunner) || JUNGLE_RUNNERS[0];
}

function jungleRunnerOptions(current) {
  return `<div class="jungle-runners" role="group" aria-label="Choose your runner">${JUNGLE_RUNNERS.map(({ id, name }) => `
    <button type="button" data-jungle-runner="${id}" aria-pressed="${id === current.id}">
      <img src="img/life/jungle-portrait-${id}.webp" alt="" width="60" height="60">
      <span>${name}</span>
    </button>`).join('')}</div>`;
}

function bindJungleRunners(root, onSelect) {
  const buttons = $$('[data-jungle-runner]', root);
  buttons.forEach(button => button.onclick = () => {
    const chosen = JUNGLE_RUNNERS.find(runner => runner.id === button.dataset.jungleRunner);
    const child = Store.active();
    if (!chosen || !child) return;
    Store.saveChild({ ...child, jungleRunner: chosen.id });
    buttons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    Sfx.tap();
    onSelect?.(chosen);
  });
}

TUT.jungle = {
  revision: 2,
  rules: 'Swipe to dodge or jump. Choose the correct path before the trail guardian catches up.',
  steps: () => [
    { t: 'Swipe left or right to change lanes. You can also use the arrow buttons.', g: 'lr', ic: 'run' },
    { t: 'Swipe up or press Jump to clear a rock or log. Collect coins along the trail.', g: 'tap', ic: 'coin' },
    { t: 'Listen to Nuru at the fork. Try again after a wrong answer. Two wrong answers let the guardian catch up, and you can retry the fork.', g: 'tap', ic: 'flag' },
  ],
};

function jungleTrail(group, episode, leg, length) {
  const items = [];
  const spacing = [28, 23, 19][group];
  for (let distance = 21; distance < length - 24; distance += spacing) {
    const lane = rnd(3) - 1;
    const safeLane = lane === 0 ? (rnd(2) ? -1 : 1) : 0;
    const kind = (items.length / 4 + leg + episode) % 2 ? 'rock' : 'log';
    items.push({ distance, lane, kind });
    for (let i = 0; i < 3; i++) items.push({ distance: distance + i * 3, lane: safeLane, kind: 'coin' });
  }
  return items;
}

function jungleSurface() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < 3400; i++) {
    ctx.fillStyle = i % 3 ? '#eedac230' : '#1b120e58';
    ctx.fillRect(rnd(128), rnd(128), 1 + rnd(3), 1 + rnd(2));
  }
  return canvas;
}

function drawJungle(ctx, width, height, state, region, art, reduceMotion) {
  if (!width || !height) return;
  const horizon = height * .35;
  const roadBottom = height * 1.04;
  const project = (lane, depth) => {
    const t = Math.max(0, Math.min(1, 1 - depth / JUNGLE_VIEW));
    const perspective = Math.pow(t, 1.72);
    return {
      x: width * .5 + lane * width * (.041 + .248 * perspective),
      y: horizon + (roadBottom - horizon) * perspective,
      scale: .105 + .895 * perspective,
    };
  };
  const polygon = (color, points) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath(); ctx.fill();
  };
  const ellipse = (color, x, y, rx, ry) => {
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  };

  const background = art.scenes[region.photo];
  ctx.fillStyle = '#253c31'; ctx.fillRect(0, 0, width, height);
  if (background.naturalWidth) {
    const imageHeight = horizon + height * .23;
    const scale = Math.max(width / background.width, imageHeight / background.height) * 1.04;
    ctx.drawImage(background, (width - background.width * scale) / 2 - state.position * width * .014,
      (imageHeight - background.height * scale) * .27,
      background.width * scale, background.height * scale);
  }
  const verge = ctx.createLinearGradient(0, horizon, 0, height);
  verge.addColorStop(0, region.verge[0] + '00');
  verge.addColorStop(.29, region.verge[0]);
  verge.addColorStop(1, region.verge[1]);
  ctx.fillStyle = verge; ctx.fillRect(0, horizon, width, height - horizon);
  const ground = ctx.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, region.ground[0]);
  ground.addColorStop(1, region.ground[1]);
  const farLeft = project(-1.58, JUNGLE_VIEW);
  const farRight = project(1.58, JUNGLE_VIEW);
  const nearLeft = project(-1.58, 0);
  const nearRight = project(1.58, 0);
  polygon(ground, [[farLeft.x, horizon], [farRight.x, horizon], [nearRight.x, roadBottom], [nearLeft.x, roadBottom]]);

  for (let tick = Math.floor((state.travel + JUNGLE_VIEW) / 3); tick >= Math.ceil(state.travel / 3); tick--) {
    const depth = tick * 3 - state.travel;
    const edge = project(1.58, depth);
    const opposite = project(-1.58, depth);
    const step = Math.max(1, project(0, depth - 3).y - edge.y + 1);
    const strip = (tick % 32) * 4;
    ctx.drawImage(art.surface, 0, strip, 128, 4, opposite.x, edge.y, edge.x - opposite.x, step);
    if (region.surface === 'wood') {
      ctx.fillStyle = '#291a1590';
      ctx.fillRect(opposite.x, edge.y, edge.x - opposite.x, edge.scale * 3);
      ctx.fillStyle = '#f4cf964a';
      ctx.fillRect(opposite.x, edge.y + edge.scale * 3, edge.x - opposite.x, edge.scale * 2);
    } else {
      for (const lane of [-.51, .51]) {
        const track = project(lane, depth);
        ellipse('#2c211924', track.x, track.y, width * .051 * track.scale, step * .55);
      }
      for (const seed of [7, 13, 29, 41, 57]) {
        const point = project(((tick * seed + seed) % 91) / 33 - 1.36, depth);
        const size = (1 + (tick + seed) % 5) * point.scale;
        ellipse(seed % 3 ? '#25252545' : '#e1c59a55', point.x, point.y, size * 1.6, Math.max(.4, size * .34));
      }
    }
    for (const side of [-1, 1]) {
      const position = project(side * (1.60 + (tick % 4) * .11), depth);
      const { x, y, scale } = position;
      if (region.surface === 'wood') {
        const water = project(side * (1.89 + tick % 3 * .18), depth);
        const ripple = (3 + tick % 9) * scale;
        ellipse('#92c4b680', water.x, water.y + (tick % 5) * scale, ripple, Math.max(.35, scale * 1.15));
        ctx.fillStyle = '#754831';
        ctx.fillRect(x - scale * 2, y - scale * 38, scale * 5, scale * 38);
        ctx.fillStyle = '#dbb281';
        ctx.fillRect(x - scale * 2, y - scale * 38, scale * 5, scale * 3);
        continue;
      }
      if (tick % 2 === 0 && region.surface === 'earth') {
        const size = (25 + (tick % 5) * 7) * scale;
        polygon('#172d23', [[x - size * .4, y], [x - size * .55, y - size * .65], [x, y - size * .35], [x + size * .24, y - size], [x + size * .43, y - size * .26], [x + size * .64, y - size * .58], [x + size * .45, y]]);
        polygon('#58744a', [[x, y - size * .18], [x + size * .22, y - size * .92], [x + size * .28, y - size * .37]]);
        polygon('#749463', [[x - size * .12, y], [x - size * .43, y - size * .57], [x - size * .09, y - size * .26]]);
      } else {
        ellipse('#222b27', x, y, 11 * scale, 5 * scale);
        ellipse('#657369', x - 3 * scale, y - 4 * scale, 6 * scale, 4 * scale);
      }
    }
  }
  if (region.surface === 'wood') {
    ctx.lineWidth = Math.max(2, width * .012);
    ctx.strokeStyle = '#69452c';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let depth = JUNGLE_VIEW; depth >= 0; depth -= 2) {
        const p = project(side * 1.62, depth);
        if (depth === JUNGLE_VIEW) ctx.moveTo(p.x, p.y - 36 * p.scale);
        else ctx.lineTo(p.x, p.y - 36 * p.scale);
      }
      ctx.stroke();
    }
  }
  const shade = ctx.createLinearGradient(0, horizon, 0, horizon + height * .13);
  shade.addColorStop(0, region.verge[0] + '8a'); shade.addColorStop(1, region.verge[0] + '00');
  ctx.fillStyle = shade; ctx.fillRect(0, horizon, width, height * .13);

  for (const item of [...state.items].reverse()) {
    const depth = JUNGLE_PLAYER_DEPTH + item.distance - state.distance;
    if (item.done || depth < 0 || depth > JUNGLE_VIEW) continue;
    const { x, y, scale } = project(item.lane, depth);
    const size = Math.min(48, width * .127) * scale;
    if (item.kind === 'coin') {
      ellipse('#20180755', x, y + 1, size * .32, size * .09);
      ellipse('#9f5d11', x, y - size * .49, size * .28, size * .36);
      ellipse('#ffcc49', x - size * .04, y - size * .51, size * .22, size * .29);
      ellipse('#fff4a7', x - size * .11, y - size * .63, size * .056, size * .11);
    } else if (item.kind === 'rock') {
      ellipse('#17161488', x, y, size * .72, size * .12);
      polygon('#3e4643', [[x-size*.64,y],[x-size*.55,y-size*.39],[x-size*.19,y-size*.65],[x+size*.36,y-size*.58],[x+size*.61,y-size*.28],[x+size*.68,y]]);
      polygon('#899386', [[x-size*.55,y-size*.39],[x-size*.19,y-size*.65],[x+size*.36,y-size*.58],[x+size*.13,y-size*.32],[x-size*.28,y-size*.25]]);
    } else {
      ellipse('#19110f99', x, y, size * .82, size * .13);
      ctx.fillStyle = '#65412a'; rr(ctx, x - size * .73, y - size * .37, size * 1.46, size * .35, size * .13); ctx.fill();
      ctx.fillStyle = '#a87544'; ctx.fillRect(x - size * .54, y - size * .30, size * 1.06, size * .075);
      ellipse('#d3a36c', x + size * .61, y - size * .19, size * .16, size * .18);
      ellipse('#8d5836', x + size * .61, y - size * .19, size * .07, size * .1);
    }
  }

  const gateDepth = state.length - state.distance + JUNGLE_PLAYER_DEPTH;
  if (gateDepth < JUNGLE_VIEW) {
    const gates = state.question.values;
    for (let lane = -1; lane <= 1; lane++) {
      const { x, y, scale } = project(lane, gateDepth + 10);
      const wide = width * .104 * scale;
      const tall = Math.min(height * .16, width * .25) * scale;
      ctx.fillStyle = '#533a27';
      ctx.fillRect(x - wide, y - tall, wide * .17, tall);
      ctx.fillRect(x + wide * .83, y - tall, wide * .17, tall);
      const selected = state.phase === 'crossing' && state.lane === lane;
      ctx.fillStyle = selected ? '#18835f' : '#d4a56c';
      rr(ctx, x - wide * 1.04, y - tall, wide * 2.08, tall * .4, 4 * scale); ctx.fill();
      if (state.phase !== 'running') {
        ctx.fillStyle = selected ? '#fff' : '#302519';
        ctx.font = 'bold ' + Math.max(9, tall * .27) + 'px sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(gates[lane + 1]), x, y - tall * .795);
      }
    }
  }

  const runner = project(state.position, JUNGLE_PLAYER_DEPTH);
  const size = Math.min(150, width * .32, height * .34);
  const lift = state.jump ? Math.sin(Math.PI * state.jump / .8) : 0;
  const running = state.phase === 'running' || state.phase === 'crossing';
  const stride = running && !reduceMotion ? Math.sin(state.travel * 1.7) : 0;
  ellipse('#130f0b76', runner.x, runner.y, size * (.28 - .08 * lift), size * .066);
  ctx.save();
  ctx.translate(runner.x, runner.y - size * .65 * lift - Math.abs(stride) * 5);
  ctx.rotate(stride * .07);
  if (stride < 0) ctx.scale(-1, 1);
  const sprite = art.runner;
  if (sprite.naturalWidth) {
    const spriteWidth = size * sprite.naturalWidth / sprite.naturalHeight;
    ctx.drawImage(sprite, -spriteWidth / 2, -size, spriteWidth, size);
  }
  ctx.restore();
  if (art.guardian.naturalWidth) {
    const guardian = project(state.position * .75 - .32, JUNGLE_PLAYER_DEPTH - 11 + state.guardian * 4.8);
    const guardianSize = size * .78;
    ellipse('#130f0b72', guardian.x, guardian.y, guardianSize * .31, guardianSize * .08);
    const ratio = art.guardian.naturalWidth / art.guardian.naturalHeight;
    ctx.save();
    ctx.translate(guardian.x, guardian.y - Math.abs(stride) * 6);
    if (stride < 0) ctx.scale(-1, 1);
    ctx.drawImage(art.guardian, -guardianSize * ratio / 2, -guardianSize, guardianSize * ratio, guardianSize);
    ctx.restore();
  }
}

HK.screens.g_jungle = (el, { level } = {}) => {
  const kit = GK.frame(el, 'jungle', { level });
  const board = gameCanvas(kit);
  const group = kit.g ?? 0;
  const legs = kit.episode.items.length;
  const length = [114, 132, 150][group] + (kit.level - 1) % 6 * 3;
  const speed = [12, 15, 18][group] + Math.floor((kit.level - 1) / 6);
  const asset = src => { const image = new Image(); image.src = src; return image; };
  const art = {
    scenes: JUNGLE_REGIONS.map(region => asset('img/life/quest-' + region.photo + '.webp')),
    guardian: asset('img/life/jungle-guardian.webp'),
    surface: jungleSurface(),
    runners: new Map(),
  };
  function selectRunner({ id, name }) {
    if (!art.runners.has(id)) art.runners.set(id, asset('img/life/jungle-runner-' + id + '.webp'));
    art.runner = art.runners.get(id);
    runnerButton.setAttribute('aria-label', 'Change runner. Current runner: ' + name);
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let region;
  const state = { leg: 0, length, travel: 0, lane: 0, position: 0, jump: 0, slow: 0, phase: 'running', firstTry: 0, guardian: 0 };
  const keys = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'jump', ' ': 'jump' };
  const controls = document.createElement('div');
  controls.className = 'jungle-controls';
  controls.innerHTML = '<button type="button" data-move="left" aria-label="Move left">' + icon('chevL', 25)
    + '</button><button type="button" data-move="jump">Jump</button><button type="button" data-move="right" aria-label="Move right">'
    + icon('chevR', 25) + '</button>';
  const status = document.createElement('div');
  status.className = 'jungle-status';
  status.innerHTML = '<b></b><span></span><button type="button" class="jungle-change">Runner</button><progress max="100" value="0" aria-label="Trail progress"></progress>';
  const fork = document.createElement('div');
  fork.className = 'jungle-fork';
  fork.hidden = true;
  const notice = document.createElement('p');
  notice.className = 'jungle-notice';
  notice.setAttribute('role', 'status');
  kit.body.classList.add('jungle-run');
  kit.body.append(status, notice, controls, fork);
  const progress = $('progress', status);
  const runnerButton = $('.jungle-change', status);
  selectRunner(jungleRunner(kit.child));
  runnerButton.onclick = () => {
    if (kit.paused || kit.ended) return;
    kit.paused = true;
    const resume = () => { kit.paused = false; runnerButton.focus(); };
    const picker = modal(el, {
      title: 'Choose your runner',
      html: jungleRunnerOptions(jungleRunner(Store.active())),
      buttons: [{ label: 'Keep playing', onClick: resume }],
    });
    picker.onGameBack = () => { picker.remove(); resume(); };
    bindJungleRunners(picker, selectRunner);
    $('[aria-pressed="true"]', picker)?.focus();
  };

  function startLeg() {
    region = JUNGLE_REGIONS[(kit.level - 1 + state.leg) % JUNGLE_REGIONS.length];
    state.phase = 'running';
    state.distance = 0;
    state.jump = 0;
    state.slow = 0;
    state.missed = false;
    state.wrongPaths = 0;
    state.guardian = 0;
    state.nextStep = state.travel + 3;
    state.items = jungleTrail(group, kit.level, state.leg, length);
    const item=kit.episode.items[state.leg];
    const line=[item.context,item.text].filter(Boolean).join(' ');
    state.question={...item,text:line,say:line,hint:item.explanation || 'Read the clue carefully.',values:item.choices?shuffle(item.choices.slice()):[]};
    kit.hint = 'Swipe sideways to dodge, or press Jump. Read the clue at the next fork.';
    $('b', status).textContent = region.name;
    $('span', status).textContent = 'Trail ' + (state.leg + 1) + ' of ' + legs;
    progress.value = 100 * state.leg / legs;
    fork.hidden = true;
    controls.hidden = false;
    notice.textContent = '';
  }

  function choosePath(value, lane, button) {
    if (kit.paused || kit.ended || state.phase !== 'question' || button.getAttribute('aria-disabled') === 'true') return;
    const q = state.question;
    const feedback = $('.jungle-feedback', fork);
    if (value !== q.answer) {
      state.missed = true;
      state.wrongPaths++;
      button.setAttribute('aria-disabled', 'true');
      Sfx.bad();
      if (state.wrongPaths === 2) return catchUp();
      feedback.textContent = 'The guardian is getting closer. ' + q.hint;
      speak(feedback.textContent);
      return;
    }
    if (!state.missed) state.firstTry++;
    kit.addCoins(state.missed ? 2 : 4);
    Sfx.good();
    speak('Correct! The path is open.');
    state.lane = lane;
    state.phase = 'crossing';
    state.wrongPaths = 0;
    state.crossing = 0;
    fork.hidden = true;
    notice.textContent = 'Path open!';
  }

  function catchUp() {
    state.phase = 'caught';
    kit.hint = state.question.hint;
    const line = 'The guardian caught up. Try the fork again!';
    fork.innerHTML = `<h2>${line}</h2><button type="button" class="btn block" id="jungle-retry">Try again</button>`;
    const retry = $('#jungle-retry', fork);
    retry.onclick = () => {
      if (kit.paused || kit.ended || state.phase !== 'caught') return;
      state.wrongPaths = 0;
      state.phase = 'running';
      state.distance = length - 18;
      controls.hidden = false;
      fork.hidden = true;
      runnerButton.focus({ preventScroll: true });
    };
    retry.focus({ preventScroll: true });
    speak(line);
  }

  function showFork() {
    state.phase = 'question';
    state.jump = 0;
    controls.hidden = true;
    notice.textContent = '';
    const q = state.question;
    kit.hint = q.say + ' ' + q.hint;
    if (q.format==='writing') {
      fork.innerHTML=`<h2>${esc(q.text)}</h2>${EpisodePlay.draftForm('Write your own ending before you cross.')}`;
      fork.hidden=false;
      EpisodePlay.draft(fork,()=>{
        if (kit.paused || kit.ended) return;
        state.phase='crossing'; state.crossing=0; state.lane=0;
        fork.hidden=true;
      });
      return;
    }
    fork.innerHTML = `
      <div class="jungle-clue">${mascot('nuru', 44)}<div><span>${esc(kit.episode.topic)}</span><h2 tabindex="-1">${esc(q.text)}</h2></div>
        <button type="button" class="icon-btn" aria-label="Repeat question">${icon('volume', 22)}</button></div>
      <p class="jungle-feedback" aria-live="polite">Choose the correct path to stay ahead.</p>
      <div class="jungle-paths">${q.values.map((value, index) =>
        `<button type="button" data-path="${index}" aria-label="${['Left', 'Middle', 'Right'][index]} path, ${esc(value)}">${esc(value)}</button>`).join('')}</div>`;
    fork.hidden = false;
    $('.jungle-clue button', fork).onclick = () => { if (!kit.paused) speak(q.say); };
    $$('.jungle-paths button', fork).forEach((button, index) => {
      button.onclick = () => choosePath(q.values[index], index - 1, button);
    });
    $('h2', fork).focus({ preventScroll: true });
    speak(q.say);
  }

  function move(direction) {
    if (kit.paused || kit.ended || state.phase !== 'running') return;
    if (direction === 'jump') {
      if (!state.jump) {
        state.jump = .8;
        Sfx.tone(360, .11, 'sine', .10, 0, 620);
      }
      return;
    }
    state.lane = Math.max(-1, Math.min(1, state.lane + (direction === 'left' ? -1 : 1)));
  }

  controls.onclick = event => {
    const button = event.target.closest('[data-move]');
    if (button) move(button.dataset.move);
  };
  let gesture;
  board.cv.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || state.phase !== 'running' || kit.paused) return;
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
    board.cv.setPointerCapture?.(event.pointerId);
  });
  board.cv.addEventListener('pointerup', event => {
    if (gesture?.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x;
    const dy = event.clientY - gesture.y;
    gesture = null;
    if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 'left' : 'right');
    else if (dy < -24) move('jump');
    else if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const bounds = board.cv.getBoundingClientRect();
      const fraction = (event.clientX - bounds.left) / bounds.width;
      move(fraction < .33 ? 'left' : fraction > .67 ? 'right' : 'jump');
    }
  });
  board.cv.addEventListener('pointercancel', () => { gesture = null; });
  const keydown = event => {
    if (event.repeat || kit.paused || kit.ended) return;
    if (state.phase === 'question' && state.question.format!=='writing' && /^[123]$/.test(event.key)) {
      event.preventDefault();
      const index = +event.key - 1;
      $$('[data-path]', fork)[index]?.click();
    } else if (state.phase === 'running' && keys[event.key] && !(event.key === ' ' && event.target.closest?.('button'))) {
      event.preventDefault();
      move(keys[event.key]);
    }
  };
  window.addEventListener('keydown', keydown);

  function advance(dt) {
    state.position += (state.lane - state.position) * Math.min(1, dt * 11);
    const pressure = Math.max(state.wrongPaths, state.slow ? .85 : 0);
    state.guardian += (pressure - state.guardian) * Math.min(1, dt * 5);
    if (state.phase === 'question' || state.phase === 'caught' || state.phase === 'finished') return;
    if (state.phase === 'crossing') {
      state.crossing += dt;
      state.distance += speed * dt;
      state.travel += speed * dt;
      if (state.crossing >= 1.12) {
        state.leg++;
        if (state.leg < legs) startLeg();
        else {
          state.phase = 'finished';
          const scored=kit.episode.items.filter(item=>item.format!=='writing').length;
          const stars = state.firstTry === scored ? 3 : state.firstTry >= scored - 1 ? 2 : 1;
          kit.finish({ stars, text: 'Trail complete! Correct on the first try: ' + state.firstTry + '/' + scored });
        }
      }
      return;
    }
    if (state.slow > 0) {
      state.slow = Math.max(0, state.slow - dt);
      if (!state.slow) notice.textContent = '';
    }
    state.jump = Math.max(0, state.jump - dt);
    const remaining = length - state.distance;
    const pace = remaining < 15 ? .56 + .44 * (remaining / 15) : 1;
    const distance = speed * pace * (state.slow ? .48 : 1) * dt;
    state.distance = Math.min(length, state.distance + distance);
    state.travel += distance;
    if (state.travel >= state.nextStep) {
      state.nextStep += 3;
      if (!state.jump) Sfx.tone(region.surface === 'wood' ? 165 : 92, .055, 'triangle', .047, 0, 60);
    }
    for (const item of state.items) {
      if (item.done || item.distance > state.distance) continue;
      item.done = true;
      if (Math.abs(item.lane - state.position) > .38) continue;
      if (item.kind === 'coin') kit.addCoins(1);
      else if (Math.sin(Math.PI * state.jump / .8) < .42) {
        state.slow = .7;
        notice.textContent = 'Watch the trail!';
        Sfx.bad();
        vibrate(38);
      }
    }
    progress.value = 100 * (state.leg + state.distance / length) / legs;
    if (state.distance === length) showFork();
  }

  startLeg();
  const stop = loopRun(dt => {
    if (document.hidden || kit.ended) return;
    if (!kit.paused) advance(dt);
    drawJungle(board.ctx, board.W, board.H, state, region, art, reduced);
  });
  return () => {
    stop();
    board.off();
    window.removeEventListener('keydown', keydown);
    kit.cleanup();
  };
};
