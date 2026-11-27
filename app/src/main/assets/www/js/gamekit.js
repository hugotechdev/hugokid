/* Shared game state, progress and rewards. */

const GK = {
  prog(child, id) {
    child.gp = child.gp || {};
    child.gp[id] = Object.assign({ level: 1, best: {} }, child.gp[id] || {});
    return child.gp[id];
  },

  frame(el, id, opts = {}) {
    const gm = GAMES.find(g => g.id === id);
    const child = Store.active();
    const group = ageGroup(child);
    const prog = GK.prog(child, id);
    const maxLevel = opts.maxLevel || GAME_EPISODES;
    const level = Math.max(1, Math.min(maxLevel, prog.level, opts.level || prog.level));
    const fun = gm.kind === 'fun';
    let coins = 0, ended = false, disposed = false, acc = 0;
    let tutorialTimer;

    el.classList.add('game-world', 'scene-' + GAME_SCENES[id]);
    el.innerHTML = `
      <div class="topbar game-topbar" style="--game-color:${gm.color}">
        <button class="icon-btn" id="gk-back">${icon('back')}</button>
        <span class="game-medal" aria-hidden="true">${icon(gm.icon, 21)}</span>
        <div class="grow"><h1 style="font-size:19px">${esc(gm.name)}</h1><div class="sub">Episode ${level} of ${maxLevel}</div></div>
        <button class="icon-btn" id="gk-help" style="width:42px;height:42px">${icon('help', 22)}</button>
        <span class="hud-pill" style="background:#fff"><span style="color:var(--sun-d)">${icon('coin', 18)}</span><span id="gk-coins">0</span></span>
      </div>
      <div class="g-body" id="gk-body"></div>`;
    const body = $('#gk-body', el);

    const tick = setInterval(() => {
      if (ended || kit.paused) return;
      acc++;
      if (acc >= 5) {
        if (fun) HK.addGameTime(child, acc); else HK.addLearnTime(child, acc);
        acc = 0;
        if (fun && HK.gameLeft(Store.active()) <= 0) { ended = true; HK.go('timeUp', {}, { replace: true }); }
      }
    }, 1000);

    const exit = () => {
      kit.paused = true;
      const resume = () => { kit.paused = false; };
      const dialog = modal(el, {
        title: 'Exit the game?', text: 'You will lose this episode’s points.',
        buttons: [
          { label: 'Yes, exit', cls: 'coral', onClick: () => HK.leave() },
          { label: 'Keep playing', cls: 'ghost', onClick: resume },
        ],
      });
      dialog.onGameBack = () => { dialog.remove(); resume(); };
    };
    $('#gk-back', el).onclick = exit;
    HK.setBack(() => { if (ended) return false; exit(); return true; });

    const first = !GT.seen(child, id);
    const kit = {
      el, body, child, group, level, gm, paused: first, first, afterTut: [], hint: '',
      g: { explorer: 0, adventurer: 1, master: 2 }[group],
      addCoins(n) { coins += n; const ce = $('#gk-coins', el); ce.textContent = coins; if (n > 0) { Sfx.coin(); const pill = ce.closest('.hud-pill'); if (pill) { pill.classList.remove('coin-pop'); void pill.offsetWidth; pill.classList.add('coin-pop'); } } },
      get coins() { return coins; },
      get ended() { return ended || disposed; },
      finish({ won = true, stars = 3, text = '' } = {}) {
        if (ended || disposed) return;
        ended = true;
        if (fun) HK.addGameTime(child, acc); else HK.addLearnTime(child, acc);
        acc = 0;
        const cc = Store.child(child.id);
        if (!cc) return;
        const pr = GK.prog(cc, id);
        cc.coins = (cc.coins || 0) + coins;
        if (won) {
          const prev = pr.best[level] || 0;
          if (stars > prev) { cc.stars = (cc.stars || 0) + (stars - prev); pr.best[level] = stars; }
          if (level >= pr.level && level < maxLevel) pr.level = level + 1;
          Sfx.win(); confetti(el);
          speak(stars === 3 ? "Congratulations! You did very well!" : "Good! You finished this level.");
        } else { Sfx.bad(); speak("Oops, try again. You can do it!"); }
        Store.saveChild(cc);
        if (gm.kind === 'learn') markMission('game');
        if (SKILL_OF[id]) logSkill(SKILL_OF[id], won ? stars / 3 * 100 : 20);
        const canPlay = !fun || HK.gameLeft(cc) > 0;
        const last = level >= maxLevel;
        const results = modal(el, {
          iconName: won ? 'nuru' : 'repeat', iconColor: won ? 'var(--sun)' : 'var(--coral)',
          title: won ? (last ? 'Champion!' : "Congratulations!") : 'Try again',
          html: `${won ? `<div class="earned">${starsHTML(stars, 3, 44)}</div>` : ''}<p>${esc(text)}${text ? ' · ' : ''}Coins ${coins}</p>`,
          buttons: [
            ...(won && !last && canPlay ? [{ label: "Next level", icon: 'chevR', onClick: () => HK.go('g_' + id, { level: level + 1 }, { replace: true }) }] : []),
            ...(canPlay ? [{ label: "Play again", cls: won ? 'sun' : '', icon: 'repeat', onClick: () => HK.go('g_' + id, { level }, { replace: true }) }] : []),
            { label: canPlay ? 'More games' : 'Time is up', cls: 'ghost', onClick: () => canPlay ? HK.leave() : HK.go('timeUp', {}, { replace: true }) },
          ],
        });
        if (results) results.onGameBack = () => { results.remove(); HK.leave(); };
      },
      cleanup() {
        if (disposed) return;
        disposed = true;
        clearTimeout(tutorialTimer);
        clearInterval(tick);
        if (!ended && acc) { if (fun) HK.addGameTime(child, acc); else HK.addLearnTime(child, acc); }
      },
    };
    const resume = () => { kit.paused = false; const f = kit.afterTut.splice(0); f.forEach(fn => fn()); };
    if (first) tutorialTimer = setTimeout(() => GT.show(el, id, kit.g, resume), 80);
    $('#gk-help', el).onclick = () => {
      if (ended) return;
      kit.paused = true;
      const help = modal(el, {
        iconName: 'nuru', title: "Do you need help?",
        buttons: [
          { label: "How to play", icon: 'play', onClick: () => GT.show(el, id, kit.g, () => { kit.paused = false; }) },
          { label: 'Ask Nuru', cls: 'blue', icon: 'help', onClick: async () => { await GT.askHugo(el, id, kit.hint); kit.paused = false; } },
          { label: 'Keep playing', cls: 'ghost', onClick: () => { kit.paused = false; } },
        ],
      });
      help.onGameBack = () => { help.remove(); kit.paused = false; };
    };
    return kit;
  },

  quiz(kit, { total = 8, make, render, cols = 2 }) {
    kit.body.classList.add('g-quiz-body');
    if ((kit.child.needs || []).includes('attention')) total = Math.min(total, 5);
    let i = 0, locked = false, demo = kit.first;
    const marks = [];
    const draw = () => {
      if (kit.ended) return;
      const q = make(i);
      kit.hint = q.text || q.say || '';
      kit.body.innerHTML = `
        <div class="g-progress">${Array.from({ length: total }, (_, k) => `<i class="${marks[k] || ''}"></i>`).join('')}</div>
        <div class="g-q"><span>${q.html || esc(q.text)}</span>${q.say ? `<button class="icon-btn say" id="say" aria-label="Repeat question">${icon('volume', 22)}</button>` : ''}</div>
        ${render ? render(q) : ''}
        <div class="g-opts" style="grid-template-columns:repeat(${q.cols || cols},1fr)">${q.opts.map((o, k) => `<button class="g-opt" data-k="${k}" style="${o.style || ''}">${o.html || esc(o.label)}</button>`).join('')}</div>`;
      if (q.say) { $('#say', kit.body).onclick = () => speak(q.say); if (!demo) setTimeout(() => { if (!kit.ended && !kit.paused) speak(q.say); }, 250); }
      locked = false;
      if (demo) { locked = true; kit.afterTut.push(() => showDemo(q)); return; }
      $$('.g-opt', kit.body).forEach(b => b.onclick = () => {
        if (locked || kit.paused || kit.ended) return;
        const o = q.opts[+b.dataset.k];
        if (o.ok) {
          locked = true; b.classList.add('ok'); celebrateMascot(kit.el); marks[i] = marks[i] || 'done';
          kit.addCoins(marks[i] === 'done' ? 3 : 1);
          speak(['Correct!', 'Great job!', "Congratulations!", 'You did it!'][Math.floor(Math.random() * 4)]);
          setTimeout(() => { i++; if (i >= total) end(); else draw(); }, 750);
        } else {
          b.classList.add('no'); Sfx.bad(); marks[i] = 'miss'; vibrate(60);
          $$('.g-progress i', kit.body)[i].className = 'miss';
        }
      });
    };

    const showDemo = (q) => {
      const k = q.opts.findIndex(o => o.ok);
      const btn = $$('.g-opt', kit.body)[k];
      if (!btn) { demo = false; draw(); return; }
      const banner = document.createElement('div');
      banner.className = 'tut-banner'; banner.textContent = "Example: see how to answer";
      kit.body.prepend(banner);
      speak('Look at the example. ' + T(q.say || q.text || ''));
      const off = GT.pointAt(btn, kit.body);
      setTimeout(() => { if (kit.ended) return; btn.classList.add('ok'); Sfx.good(); speak('The correct answer is ' + T(q.opts[k].label || 'this one') + '. Now it’s your turn!'); }, 2200);
      setTimeout(() => { off(); demo = false; draw(); }, 4600);
    };
    const end = () => {
      const firstTry = marks.filter(m => m === 'done').length;
      const stars = firstTry >= total - 1 ? 3 : firstTry >= Math.ceil(total * 0.6) ? 2 : 1;
      kit.finish({ won: true, stars, text: `Correct on the first try: ${firstTry}/${total}` });
    };
    draw();
  },
};

function rnd(n) { return Math.floor(Math.random() * n); }
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[rnd(a.length)]; }
function numOpts(ans, n = 4, spread = 3, min = 0) {
  const s = new Set([ans]);
  let guard = 0;
  while (s.size < n && guard++ < 100) { const v = ans + (rnd(2) ? 1 : -1) * (1 + rnd(spread)); if (v >= min) s.add(v); }
  return shuffle([...s]).map(v => ({ label: String(v), ok: v === ans }));
}
