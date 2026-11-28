/* Learning games and speech-based word challenges. */

/* ===== 1. Number Balloons ===== */
HK.screens.g_balloons = (el, p) => {
  const kit = GK.frame(el, 'balloons', { level: p.level });
  const total = kit.episode.items.length;
  let i = 0, firstTry = 0, missed = false, raf, items = [], ans = 0;
  const COLS = ['#F65B4F', '#1EA7F0', '#FFC20E', '#0FB394', '#7B61FF', '#FF8A3D'];

  const makeQ = () => {
    const item = kit.episode.items[i];
    const dots = kit.level===1 ? Number(item.answer) : 0;
    return {text:item.text,ans:Number(item.answer),dots,say:dots?'Count the stars. How many are there?':item.text};
  };

  kit.body.innerHTML = `<div class="g-progress" id="pr"></div><div class="g-q" id="q"></div><div id="sky" style="flex:1;position:relative;overflow:hidden;background:transparent"></div>`;
  const sky = $('#sky', el);

  let settled = false;
  let nextTimer;
  const next = () => {
    if (i >= total) { cancelAnimationFrame(raf); const s = firstTry >= total - 1 ? 3 : firstTry >= Math.ceil(total * .6) ? 2 : 1; return kit.finish({ stars: s, text: `Correct answers ${firstTry}/${total}` }); }
    missed = false;
    settled = false;
    const q = makeQ(); ans = q.ans;
    $('#pr', el).innerHTML = Array.from({ length: total }, (_, k) => `<i class="${k < i ? 'done' : ''}"></i>`).join('');
    $('#q', el).innerHTML = q.dots
      ? `<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:260px;color:var(--sun)">${Array.from({ length: q.dots }, () => `<svg width="30" height="30" viewBox="0 0 24 24" fill="#FFC20E" stroke="#D29E00" stroke-width="1.4"><path d="${'M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z'}"/></svg>`).join('')}</div>`
      : `<span style="font-size:20px">${esc(q.text)}</span>`;
    speak(q.say);
    sky.innerHTML = ''; items = [];
    const vals = numOpts(ans, 4, kit.g === 2 ? 6 : 3, kit.g === 0 ? 1 : 0).map(o => +o.label);
    const W = sky.clientWidth, H = sky.clientHeight;
    vals.forEach((v, k) => {
      const b = document.createElement('button');
      const col = COLS[(i + k) % COLS.length];
      b.style.cssText = 'position:absolute;border:0;background:none;padding:0;width:84px;height:118px;cursor:pointer';
      b.innerHTML = `<svg width="84" height="118" viewBox="0 0 84 118"><defs><radialGradient id="balloon-${k}" cx=".34" cy=".22" r=".83"><stop stop-color="#fff" stop-opacity=".72"/><stop offset=".27" stop-color="${col}"/><stop offset="1" stop-color="${col}"/></radialGradient></defs><path d="M42 4C20 4 6 22 6 42c0 24 22 44 36 46 14-2 36-22 36-46C78 22 64 4 42 4z" fill="url(#balloon-${k})" stroke="#2d2647" stroke-opacity=".32" stroke-width="2"/><path d="M42 88l-5 8h10z" fill="${col}"/><path d="M42 96q-6 10 0 20" stroke="#8A97B2" stroke-width="2" fill="none"/><ellipse cx="28" cy="26" rx="7" ry="11" fill="#fff" opacity=".35"/>
        <text x="42" y="54" text-anchor="middle" font-family="Outfit,Roboto,sans-serif" font-weight="900" font-size="${String(v).length > 2 ? 24 : 30}" fill="#fff">${v}</text></svg>`;
      const it = { b, v, x: (W / 4) * k + (W / 4 - 84) / 2, y: H * 0.3 + rnd(Math.max(40, H * 0.6)), sp: 30 + rnd(20) + kit.level * 3, wob: Math.random() * 6 };
      b.onclick = () => {
        if (kit.paused || kit.ended || settled || it.dead) return;
        if (v === ans) {
          settled = true;
          if (!missed) firstTry++;
          kit.addCoins(missed ? 1 : 3); Sfx.good(); celebrateMascot(el, 'pundamilia'); speak("Correct!");
          b.style.transition = 'transform .2s, opacity .2s'; b.style.transform += ' scale(1.4)'; b.style.opacity = '0';
          i++; nextTimer = setTimeout(next, 500);
        } else {
          missed = true; Sfx.bad(); vibrate(60);
          b.style.transition = 'opacity .2s'; b.style.opacity = '0'; it.dead = true;
        }
      };
      if (kit.first && i === 0 && v === ans) {
        b.style.filter = 'drop-shadow(0 0 10px #fff) drop-shadow(0 0 14px #FFC20E)';
        kit.afterTut.push(() => { toast("Example: tap the glowing balloon, it has the correct answer"); speak('Tap the glowing balloon. It has the correct answer, ' + ans); });
      }
      sky.appendChild(b); items.push(it);
    });
  };
  let last = performance.now();
  const loop = t => {
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (!kit.paused) items.forEach(it => {
      if (it.dead) return;
      it.y -= it.sp * dt; it.wob += dt * 2;
      if (it.y < -130) it.y = sky.clientHeight + 10;
      it.b.style.transform = `translate(${it.x + Math.sin(it.wob) * 8}px, ${it.y}px)`;
    });
    raf = requestAnimationFrame(loop);
  };
  nextTimer = setTimeout(() => { next(); raf = requestAnimationFrame(loop); }, 50);
  return () => { clearTimeout(nextTimer); cancelAnimationFrame(raf); kit.cleanup(); };
};

/* ===== 2. Missing Letters ===== */
HK.screens.g_letters = (el, p) => {
  const kit=GK.frame(el,'letters',{level:p.level});
  EpisodePlay.quiz(kit);
  return ()=>kit.cleanup();
};

/* ===== 3. Safari Memory ===== */
HK.screens.g_memory = (el, p) => {
  const kit = GK.frame(el, 'memory', { level: p.level });
  const pairsN=kit.episode.items.length;
  const cards=shuffle(kit.episode.items.flatMap((item,k)=>[
    {k,html:esc(k===0?item.context:item.text+' '+item.context),say:k===0?item.context:item.text+' '+item.context},
    {k,html:esc(item.answer),say:item.answer},
  ]));
  kit.body.innerHTML=`<div class="g-q">Match each field clue to its answer.</div>
    <div class="mem-grid curriculum-memory" style="grid-template-columns:repeat(2,1fr)">${cards.map((c,i)=>`<button class="mem-card" data-i="${i}" aria-label="Card ${i+1}">${icon('star',28)}</button>`).join('')}</div>`;
  let open = [], moves = 0, done = 0, busy = false;
  $$('.mem-card', el).forEach(b => b.onclick = () => {
    const i = +b.dataset.i, c = cards[i];
    if (busy || c.done || open.includes(i) || kit.ended || kit.paused) return;
    b.classList.add('open'); b.innerHTML = c.html; b.setAttribute('aria-label',c.say); Sfx.tap();
    if (c.say) speak(c.say, c.lang);
    open.push(i);
    if (open.length === 2) {
      moves++; busy = true;
      const [a, d] = open;
      if (cards[a].k === cards[d].k) {
        setTimeout(() => {
          [a, d].forEach(x => { cards[x].done = true; $$('.mem-card', el)[x].classList.add('done'); });
          kit.addCoins(2); done++; open = []; busy = false;
          if (done === pairsN) { const s = moves <= pairsN + 2 ? 3 : moves <= pairsN * 2 ? 2 : 1; setTimeout(() => kit.finish({ stars: s, text: `Moves: ${moves}` }), 400); }
        }, 350);
      } else {
        setTimeout(() => {
          [a, d].forEach(x => { const e = $$('.mem-card', el)[x]; e.classList.remove('open'); e.setAttribute('aria-label','Card '+(x+1)); e.innerHTML = icon('star', 28); });
          open = []; busy = false;
        }, 900);
      }
    }
  });
  return () => kit.cleanup();
};

/* ===== 4. Robot Route ===== */
HK.screens.g_robot = (el, p) => {
  const kit = GK.frame(el, 'robot', { level: p.level });
  const N = [4, 5, 6][kit.g];
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const ARROW = { up: '<path d="M12 19V5M6 11l6-6 6 6"/>', down: '<path d="M12 5v14M6 13l6 6 6-6"/>', left: '<path d="M19 12H5M11 6l-6 6 6 6"/>', right: '<path d="M5 12h14M13 6l6 6-6 6"/>' };
  const arrowSvg = (d, s = 22) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${ARROW[d]}</svg>`;

  let walls, start, goal, best;
  const bfs = () => {
    const q = [[start[0], start[1], 0]], seen = new Set([start.join()]);
    while (q.length) {
      const [x, y, d] = q.shift();
      if (x === goal[0] && y === goal[1]) return d;
      for (const [dx, dy] of Object.values(DIRS)) {
        const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || walls.has(k) || seen.has(k)) continue;
        seen.add(k); q.push([nx, ny, d + 1]);
      }
    }
    return -1;
  };
  for (let t = 0; t < 200; t++) {
    walls = new Set();
    const wc = Math.floor(N * N * (0.12 + kit.level * 0.015));
    while (walls.size < wc) walls.add(rnd(N) + ',' + rnd(N));
    start = [rnd(N), rnd(N)]; goal = [rnd(N), rnd(N)];
    walls.delete(start.join()); walls.delete(goal.join());
    best = bfs();
    if (best >= Math.min(N + kit.level / 2, N * 2 - 2)) break;
  }
  if (best < 1) { walls = new Set(); start = [0, 0]; goal = [N-1, N-1]; best = 2 * (N-1); }
  let bot = start.slice(), prog = [], running = false;
  const step = kit.g === 0; // wadogo: kila mshale unasogeza papo hapo
  const maxCmd = kit.g === 2 ? best + 2 : 30;

  const draw = () => {
    const cells = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const k = x + ',' + y;
      const isBot = bot[0] === x && bot[1] === y, isGoal = goal[0] === x && goal[1] === y;
      cells.push(`<div class="${walls.has(k) ? 'wall' : isBot ? 'bot' : isGoal ? 'goal' : ''}">${isBot ? icon('robot', 26) : isGoal ? icon('gift', 26) : ''}</div>`);
    }
    $('#grid', el).innerHTML = cells.join('');
    if (!step) $('#cmds', el).innerHTML = prog.length ? prog.map(d => `<span class="cmd">${arrowSvg(d, 20)}</span>`).join('') : `<span class="muted" style="font-weight:800">Panga mishale, kisha bonyeza Endesha${kit.g === 2 ? ' (hadi ' + maxCmd + ')' : ''}</span>`;
  };
  const size = Math.min(window.innerWidth - 40, 360);
  kit.body.innerHTML = `
    <div class="g-q" style="font-size:17px;min-height:56px">${step ? "Take the robot to the prize" : "Write the robot's path to the prize"}</div>
    <div class="robot-grid" id="grid" style="width:${size}px;grid-template-columns:repeat(${N},1fr)"></div>
    ${step ? '' : '<div class="cmd-row" id="cmds"></div>'}
    <div class="arrows">${['left', 'up', 'down', 'right'].map(d => `<button class="icon-btn" data-d="${d}">${arrowSvg(d, 30)}</button>`).join('')}</div>
    ${step ? '' : `<div class="btn-row" style="padding:0 16px 16px"><button class="btn ghost" id="undo">${icon('undo', 20)}</button><button class="btn ghost" id="clr">${icon('trash', 20)}</button><button class="btn" id="run" style="flex:2">${icon('play', 20)} Endesha</button></div>`}`;
  speak(step ? "Take the robot to the prize" : "Arrange the arrows to take the robot to the prize");

  const moveBot = d => {
    const [dx, dy] = DIRS[d]; const nx = bot[0] + dx, ny = bot[1] + dy;
    if (nx < 0 || ny < 0 || nx >= N || ny >= N || walls.has(nx + ',' + ny)) return false;
    bot = [nx, ny]; return true;
  };
  let stepMoves = 0;
  $$('[data-d]', el).forEach(b => b.onclick = () => {
    if (running || kit.ended || kit.paused) return;
    const d = b.dataset.d;
    if (step) {
      if (!moveBot(d)) { Sfx.bad(); vibrate(50); return; }
      Sfx.tap(); stepMoves++; draw();
      if (bot[0]!==goal[0] || bot[1]!==goal[1]) kit.curriculumProgress(stepMoves/Math.max(2,best));
      if (bot[0] === goal[0] && bot[1] === goal[1]) { kit.addCoins(5); kit.finish({ stars: stepMoves <= best + 1 ? 3 : stepMoves <= best + 4 ? 2 : 1, text: `Hatua ${stepMoves}` }); }
      return;
    }
    if (prog.length >= maxCmd) { toast("You reached the maximum number of arrows"); return; }
    prog.push(d); Sfx.tap(); draw();
  });
  if (!step) {
    $('#undo', el).onclick = () => { prog.pop(); draw(); };
    $('#clr', el).onclick = () => { prog = []; draw(); };
    $('#run', el).onclick = async () => {
      if (running || kit.paused || !prog.length) return;
      running = true; bot = start.slice(); draw();
      const chips = $$('#cmds .cmd', el);
      for (let k = 0; k < prog.length; k++) {
        await new Promise(r => setTimeout(r, 380));
        if (kit.ended) return;
        chips[k] && chips[k].classList.add('run');
        if (!moveBot(prog[k])) { Sfx.crash(); toast("Ouch! The robot crashed"); speak("The robot crashed. Try again"); break; }
        if (kit.ended) return;
        Sfx.tap(); draw();
        if (bot[0]!==goal[0] || bot[1]!==goal[1]) await kit.curriculumProgress((k+1)/Math.max(2,best));
        if (kit.ended) return;
        $$('#cmds .cmd', el).forEach((c, j) => j <= k && c.classList.add('run'));
        if (bot[0] === goal[0] && bot[1] === goal[1]) {
          kit.addCoins(5);
          return kit.finish({ stars: prog.length <= best ? 3 : prog.length <= best + 3 ? 2 : 1, text: `Mishale ${prog.length}` });
        }
      }
      await new Promise(r => setTimeout(r, 500));
      if (!(bot[0] === goal[0] && bot[1] === goal[1])) { toast("You're not there yet. Fix the path"); }
      bot = start.slice(); running = false; draw();
    };
  }
  draw();
  return () => kit.cleanup();
};

/* ===== 5. Little Market ===== */
const FRUITS = [
  ['Mango', '#FFB020', 'embe'], ['Orange', '#FF8A3D', 'chungwa'],
  ['Banana', '#FFD93D', 'ndizi'], ['Pineapple', '#E3B341', 'nanasi'],
  ['Watermelon', '#3FB36B', 'tikiti'], ['Avocado', '#5B8C2A', 'parachichi'],
];

function fruitPic(f, s = 40) { return pic(f[2], s) || fruitSvg(f[1], s); }
const picRow = (f, n, s = 30) => `<span class="pic-row">${Array.from({ length: n }, () => fruitPic(f, s)).join('')}</span>`;
function fruitSvg(col, s = 40) { return `<svg width="${s}" height="${s}" viewBox="0 0 40 40"><circle cx="20" cy="22" r="15" fill="${col}"/><path d="M20 7q4-5 9-3-3 5-9 4z" fill="#3FA34D"/><ellipse cx="14" cy="17" rx="4" ry="6" fill="#fff" opacity=".35"/></svg>`; }
HK.screens.g_market = (el, p) => {
  const kit = GK.frame(el, 'market', { level: p.level });
  const total = 6;
  if (kit.g === 1) {
    GK.quiz(kit, {
      total,
      make: () => {
        const [a, b] = shuffle(FRUITS.slice()).slice(0, 2);
        const pa = (1 + rnd(5)) * 100, pb = (1 + rnd(5)) * 100, na = 1 + rnd(kit.level < 4 ? 2 : 3), nb = rnd(3);
        const ans = pa * na + pb * nb;
        const fruitCount = (fruit, count) => {
          const name = T(fruit[0]).toLowerCase();
          return count + ' ' + name + (count === 1 ? '' : name === 'mango' ? 'es' : 's');
        };
        const purchase = fruitCount(a, na) + (nb ? ' and ' + fruitCount(b, nb) : '');
        const txt = `${T(a[0])}: TSh ${pa} each. ${T(b[0])}: TSh ${pb} each. The customer buys ${purchase}. What is the total?`;
        const s = new Set([ans]); while (s.size < 4) { const v = ans + (rnd(2) ? 1 : -1) * 100 * (1 + rnd(3)); if (v > 0) s.add(v); }

        const tag = (f, pr) => `<span class="price-tag">${fruitPic(f, 46)}<span>${esc(f[0])}</span><b>${pr}/=</b></span>`;
        const html = `<div class="market-q">
            <div class="price-tags">${tag(a, pa)}${tag(b, pb)}</div>
            <div class="buys"><small>The customer buys:</small>${picRow(a, na)}${nb ? '<i>+</i>' + picRow(b, nb) : ''}</div>
            <b class="q-ask">What is the total?</b></div>`;
        return { html, say: txt, opts: shuffle([...s]).map(v => ({ label: v + '/=', ok: v === ans, style: 'font-size:22px' })) };
      },
    });
    return () => kit.cleanup();
  }
  let round = 0, good = 0;
  const NOTES = [[50, '#C9A227', true], [100, '#B8B8B8', true], [200, '#C47A3A', true], [500, '#3FA34D', false], [1000, '#1EA7F0', false]];
  const next = () => {
    if (kit.ended) return;
    if (round >= total) return kit.finish({ stars: good >= total ? 3 : good >= total - 2 ? 2 : 1, text: `Customers served ${good}/${total}` });
    kit.curriculumProgress(good/total);
    round++;
    let settled = false;
    if (kit.g === 0 && kit.level <= 7) {
      const f = pick(FRUITS), n = 1 + rnd(Math.min(5, 2 + kit.level));
      let got = 0;
      kit.body.innerHTML = `<div class="g-progress">${Array.from({ length: total }, (_, k) => `<i class="${k < round - 1 ? 'done' : ''}"></i>`).join('')}</div>
        <div class="g-q want-q"><div class="want-big">${fruitPic(f, 64)}<b>&times; ${n}</b></div><span>Order: ${n} × ${esc(T(f[0]))}</span>${picRow(f, n, 26)}</div>
        <div class="card" style="margin:0 16px 12px;text-align:center;min-height:96px"><div class="muted" style="font-weight:900;margin-bottom:6px">Basket</div><div id="bk2" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center"></div></div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:6px 16px">${Array.from({ length: 8 }, () => `<button class="ing fr" style="width:72px">${fruitPic(f, 46)}</button>`).join('')}</div>
        <div class="btn-row" style="padding:14px 16px"><button class="btn ghost" id="rs">${icon('repeat', 20)} Reset</button><button class="btn" id="give" style="flex:2">${icon('check', 20)} Give to customer</button></div>`;
      speak('The customer wants ' + n + '. Choose the correct number of ' + T(f[0]).toLowerCase() + '.');
      $$('.fr', el).forEach(b => b.onclick = () => { if (got >= 9) return; got++; Sfx.tap(); speak(String(got)); $('#bk2', el).innerHTML += fruitPic(f, 30); b.style.visibility = 'hidden'; });
      $('#rs', el).onclick = () => { if (!settled) { round--; next(); } };
      $('#give', el).onclick = () => {
        if (settled || kit.paused) return;
        if (got === n) { settled = true; good++; kit.addCoins(3); Sfx.good(); speak("Thank you! The customer is happy"); setTimeout(next, 700); }
        else { Sfx.bad(); speak(got < n ? 'Add more' : 'You added too many'); toast(got < n ? 'Add more' : 'You added too many'); }
      };
      return;
    }
    // Advanced: make change
    const price = (2 + kit.level + rnd(12)) * 50;
    const paid = price < 500 ? (rnd(2) ? 500 : 1000) : price < 1000 ? 1000 : 2000;
    const change = paid - price;
    let sum = 0;
    kit.body.innerHTML = `<div class="g-progress">${Array.from({ length: total }, (_, k) => `<i class="${k < round - 1 ? 'done' : ''}"></i>`).join('')}</div>
      <div class="g-q" style="font-size:18px;line-height:1.4">Price: TSh ${price}. Paid: TSh ${paid}.<br>Give them their change.</div>
      <div class="card" style="margin:0 16px 12px;text-align:center"><div class="muted" style="font-weight:900">Change you give</div><div style="font-size:40px;font-weight:900" id="sum">0/=</div></div>
      <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;padding:6px 16px">${NOTES.map(([v, c, coin]) => `<button class="money ${coin ? 'coin' : ''}" data-v="${v}" style="background:${c};color:#fff">${v}</button>`).join('')}</div>
      <div class="btn-row" style="padding:16px"><button class="btn ghost" id="rs">${icon('repeat', 20)} Reset</button><button class="btn" id="give" style="flex:2">${icon('check', 20)} Give change</button></div>`;
    speak(`The price is TSh ${price}. The customer paid TSh ${paid}. Give the correct change.`);
    $$('.money', el).forEach(b => b.onclick = () => { sum += +b.dataset.v; Sfx.coin(); $('#sum', el).textContent = sum + '/='; });
    $('#rs', el).onclick = () => { if (settled) return; sum = 0; $('#sum', el).textContent = '0/='; };
    $('#give', el).onclick = () => {
      if (settled || kit.paused) return;
      if (sum === change) { settled = true; good++; kit.addCoins(4); Sfx.good(); speak('Correct! The change is ' + change); setTimeout(next, 800); }
      else { Sfx.bad(); toast(sum < change ? 'Not enough change' : 'Too much change'); }
    };
  };
  next();
  return () => kit.cleanup();
};

/* ===== 6. Shape Puzzle ===== */
const SHAPES = [
  ['Circle', '<circle cx="30" cy="30" r="24"/>', 0],
  ['Square', '<rect x="8" y="8" width="44" height="44" rx="3"/>', 4],
  ['Triangle', '<path d="M30 6l25 46H5z"/>', 3],
  ['Rectangle', '<rect x="4" y="16" width="52" height="28" rx="3"/>', 4],
  ['Star', '<path d="M30 5l7 16 17 1.5-13 11 4 17-15-9-15 9 4-17-13-11 17-1.5z"/>', 10],
  ['Heart', '<path d="M30 52S6 37 6 21a12 12 0 0 1 24-4 12 12 0 0 1 24 4c0 16-24 31-24 31z"/>', 0],
  ['Hexagon', '<path d="M30 5l22 12.5v25L30 55 8 42.5v-25z"/>', 6],
  ['Pentagon', '<path d="M30 5l24 18-9 29H15L6 23z"/>', 5],
  ['Diamond', '<path d="M30 4l22 26-22 26L8 30z"/>', 4],
];
const SHAPE_COLS = ['#F65B4F', '#1EA7F0', '#FFC20E', '#0FB394', '#7B61FF', '#FF8A3D', '#E0476B', '#14B8C9', '#0D2461'];
const shapeSvg = (sh, fill, s = 54, stroke) => `<svg width="${s}" height="${s}" viewBox="0 0 60 60"><g fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="3" stroke-dasharray="5 4"` : ''}>${sh[1]}</g></svg>`;
HK.screens.g_shapes = (el, p) => {
  const kit = GK.frame(el, 'shapes', { level: p.level });
  if (kit.episode.difficulty >= 3) {
    kit.episode.direct=true;
    EpisodePlay.quiz(kit);
    return ()=>kit.cleanup();
  }
  const n = kit.g === 0 ? Math.min(3 + Math.floor(kit.level / 3), 5) : Math.min(5 + Math.floor(kit.level / 3), 9);
  const set = shuffle(SHAPES.slice()).slice(0, n);
  const cols = set.map((_, k) => SHAPE_COLS[k % SHAPE_COLS.length]);
  const tray = shuffle(set.map((s, k) => k));
  let sel = null, placed = 0, misses = 0;
  kit.body.innerHTML = `<div class="g-q" style="font-size:18px">Put each shape in its place</div>
    <div class="shape-slots">${set.map((s, k) => `<div class="shape-slot" data-k="${k}">${shapeSvg(s, '#EEF2F9', 60, '#B5C1D6')}</div>`).join('')}</div>
    <div class="shape-tray">${tray.map(k => `<button class="shape-pc" data-k="${k}">${shapeSvg(set[k], cols[k], 52)}</button>`).join('')}</div>`;
  speak("Choose a shape, then put it in its place");
  $$('.shape-pc', el).forEach(b => b.onclick = () => {
    $$('.shape-pc', el).forEach(x => x.classList.remove('sel'));
    b.classList.add('sel'); sel = +b.dataset.k; Sfx.tap(); speak(set[sel][0]);
  });
  $$('.shape-slot', el).forEach(s => s.onclick = () => {
    if (kit.paused || sel == null || s.classList.contains('filled')) return;
    const k = +s.dataset.k;
    if (k === sel) {
      s.classList.add('filled'); s.innerHTML = shapeSvg(set[k], cols[k], 60);
      $(`.shape-pc[data-k="${k}"]`, el).remove(); sel = null; placed++;
      kit.addCoins(2); Sfx.good();
      if (placed < n) kit.curriculumProgress(placed/n);
      if (placed === n) kit.finish({ stars: misses === 0 ? 3 : misses <= 2 ? 2 : 1, text: `Mistakes: ${misses}` });
    } else { misses++; Sfx.bad(); vibrate(50); speak("No, try another"); }
  });
  return () => kit.cleanup();
};

function matchesDoorWord(transcript, target) {
  const normal = text => String(text || '').toLowerCase().normalize('NFD')
    .replace(/\p{M}/gu, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  const expected = normal(target);
  const spoken = normal(transcript).replace(/^(?:um |uh |it is |it s |this is |the word is )+/, '');
  if (!expected || !spoken) return false;
  const answer = spoken.replace(/^(?:a|an|the) /, '');
  if (spoken === expected || answer === expected || answer.replace(/ /g, '') === expected.replace(/ /g, '')) return true;
  const variants = { colour:'color', grey:'gray', favourite:'favorite', centre:'center', metre:'meter', neighbour:'neighbor' };
  const canonical = phrase => phrase.split(' ').map(word => variants[word] || word).join(' ');
  if (canonical(answer) === canonical(expected)) return true;
  // Accept genuine homophones without allowing short substrings or unrelated words.
  const sounds = [
    ['one', 'won', '1'], ['two', 'too', 'to', '2'], ['three', '3'],
    ['four', 'for', '4'], ['five', '5'], ['six', '6'], ['seven', '7'],
    ['eight', 'ate', '8'], ['nine', '9'], ['ten', '10'],
    ['blue', 'blew'], ['red', 'read'], ['sea', 'see'], ['eye', 'i'],
  ];
  return sounds.some(group => group.includes(expected) && group.includes(answer));
}

HK.screens.g_speak = (el, p) => {
  const kit=GK.frame(el,'speak',{level:p.level});
  const canListen=!!window.HugoNative?.canListen?.();
  const tasks=kit.episode.items;
  let step=0, independent=0, listening=false, attempts=0, missed=false;
  const stop=()=>{ window.HK_onSpeech=null; listening=false; };
  function draw() {
    if (kit.ended) return;
    if (step===tasks.length) {
      const scored=tasks.filter(t=>t.format!=='writing').length;
      kit.finish({stars:independent===scored?3:independent>0?2:1,text:'Opened '+step+' doors'});
      return;
    }
    const item=tasks[step];
    const choices=item.choices?shuffle(item.choices.slice()):[];
    const advance=()=>{
      if (kit.paused || kit.ended) return;
      stop();
      if (!missed && item.format!=='writing') independent++;
      kit.addCoins(missed?1:3);
      step++; missed=false; attempts=0; draw();
    };
    kit.body.innerHTML=`<div class="card episode-door"><span class="chip-tag">Door ${step+1} of ${tasks.length}</span>
      <div class="episode-kicker">${icon('lock',28)} ${esc(kit.episode.topic)}</div>
      <p>${esc(item.context || '')}</p><h2>${esc(item.text)}</h2>
      <button class="btn small ghost" id="hear">Listen to clue</button>
      ${item.format==='writing'?EpisodePlay.draftForm('Read your sentence aloud before opening this door.'):
        `<div class="skill-choices">${choices.map((choice,i)=>`<button class="btn ghost word-opt" data-k="${i}">${esc(choice)}</button>`).join('')}</div>
        ${canListen?'<button class="btn small" id="mic">Say the answer</button>':''}<p id="heard" aria-live="polite"></p>`}</div>`;
    $('#hear',el).onclick=()=>speak([item.context,item.text].filter(Boolean).join(' '));
    if (item.format==='writing') return EpisodePlay.draft(kit.body,advance);
    const feedback=$('#heard',el);
    $$('.word-opt',el).forEach(btn=>btn.onclick=()=>{
      if (kit.paused || kit.ended) return;
      if (choices[+btn.dataset.k]===item.answer) advance();
      else { missed=true; btn.disabled=true; feedback.textContent='Try another answer.'; }
    });
    const mic=$('#mic',el);
    if (!mic) return;
    mic.onclick=()=>{
      if (listening || kit.paused || kit.ended) return;
      listening=true;
      if (typeof Voice!=='undefined') Voice.stop();
      HugoNative.stopSpeaking?.();
      mic.disabled=true; feedback.textContent='Listening…';
      window.HK_onSpeech=result=>{
        if (!listening || !el.isConnected) return;
        stop(); mic.disabled=false;
        if (Array.isArray(result) && result.some(value=>matchesDoorWord(value,item.answer))) return advance();
        attempts++; missed=true; feedback.textContent='Say it again or tap the answer.';
      };
      HugoNative.listen(attempts<2?'en-TZ':'en-GB');
    };
  }
  draw();
  return ()=>{stop(); kit.cleanup();};
};

HK.screens.g_faith = (el, p) => {
  const kit = GK.frame(el, 'faith', { level: p.level });
  EpisodePlay.quiz(kit);
  return () => kit.cleanup();
};
