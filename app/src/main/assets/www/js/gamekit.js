/* HUGO KID - gamekit.js : msingi wa michezo yote (muda, ngazi, zawadi) */

const GK = {
  prog(child, id) {
    child.gp = child.gp || {};
    child.gp[id] = Object.assign({ level: 1, best: {} }, child.gp[id] || {});
    return child.gp[id];
  },

  /* Fremu ya mchezo. Inarudisha kifaa (kit) cha mchezo */
  frame(el, id, opts = {}) {
    const gm = GAMES.find(g => g.id === id);
    const child = Store.active();
    const group = ageGroup(child);
    const prog = GK.prog(child, id);
    const level = Math.max(1, Math.min(opts.maxLevel || 10, opts.level || prog.level));
    const fun = gm.kind === 'fun';
    let coins = 0, ended = false, acc = 0;

    el.innerHTML = `
      <div class="topbar">
        <button class="icon-btn" id="gk-back">${icon('back')}</button>
        <div class="grow"><h1 style="font-size:19px">${esc(gm.name)}</h1><div class="sub">Ngazi ${level}${opts.maxLevel ? ' / ' + opts.maxLevel : ''}</div></div>
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
      confirmBox(el, 'Toka kwenye mchezo?', 'Utapoteza alama za ngazi hii.', 'Ndiyo, toka', () => HK.leave(), 'coral');
      setTimeout(() => { if (!$('.overlay', el)) kit.paused = false; }, 50);
    };
    $('#gk-back', el).onclick = exit;
    HK.setBack(() => { if (ended) return false; exit(); return true; });

    const first = !GT.seen(child, id);
    const kit = {
      el, body, child, group, level, gm, paused: first, first, afterTut: [], hint: '',
      g: { explorer: 0, adventurer: 1, master: 2 }[group],
      addCoins(n) { coins += n; $('#gk-coins', el).textContent = coins; if (n > 0) Sfx.coin(); },
      get coins() { return coins; },
      get ended() { return ended; },
      finish({ won = true, stars = 3, text = '' } = {}) {
        if (ended) return;
        ended = true;
        if (fun) HK.addGameTime(child, acc); else HK.addLearnTime(child, acc);
        acc = 0;
        const cc = Store.active();
        const pr = GK.prog(cc, id);
        cc.coins = (cc.coins || 0) + coins;
        if (gm.kind === 'learn') markMission('game');
        if (SKILL_OF[id]) logSkill(SKILL_OF[id], won ? stars / 3 * 100 : 20);
        if (won) {
          const prev = pr.best[level] || 0;
          if (stars > prev) { cc.stars = (cc.stars || 0) + (stars - prev); pr.best[level] = stars; }
          if (level >= pr.level && level < (opts.maxLevel || 10)) pr.level = level + 1;
          Sfx.win(); confetti(el);
          speak(stars === 3 ? 'Hongera! Umefanya vizuri sana!' : 'Vizuri! Umemaliza ngazi hii.');
        } else { Sfx.bad(); speak('Pole, jaribu tena. Unaweza!'); }
        Store.saveChild(cc);
        const canPlay = !fun || HK.gameLeft(cc) > 0;
        const last = level >= (opts.maxLevel || 10);
        modal(el, {
          iconName: won ? 'trophy' : 'repeat', iconColor: won ? 'var(--sun)' : 'var(--coral)',
          title: won ? (last ? 'Bingwa!' : 'Hongera!') : 'Jaribu tena',
          html: `${won ? `<div class="earned">${starsHTML(stars, 3, 44)}</div>` : ''}<p>${esc(text)}${text ? ' · ' : ''}Sarafu ${coins}</p>`,
          buttons: [
            ...(won && !last && canPlay ? [{ label: 'Ngazi inayofuata', icon: 'chevR', onClick: () => HK.go('g_' + id, { level: level + 1 }, { replace: true }) }] : []),
            ...(canPlay ? [{ label: 'Cheza tena', cls: won ? 'sun' : '', icon: 'repeat', onClick: () => HK.go('g_' + id, { level }, { replace: true }) }] : []),
            { label: canPlay ? 'Michezo mingine' : 'Muda umekwisha', cls: 'ghost', onClick: () => canPlay ? HK.leave() : HK.go('timeUp', {}, { replace: true }) },
          ],
        });
      },
      cleanup() {
        clearInterval(tick);
        if (!ended && acc) { if (fun) HK.addGameTime(child, acc); else HK.addLearnTime(child, acc); }
      },
    };
    const resume = () => { kit.paused = false; const f = kit.afterTut.splice(0); f.forEach(fn => fn()); };
    if (first) setTimeout(() => GT.show(el, id, kit.g, resume), 80);
    $('#gk-help', el).onclick = () => {
      if (ended) return;
      kit.paused = true;
      modal(el, {
        iconName: 'nuru', title: 'Unahitaji msaada?',
        buttons: [
          { label: 'Jinsi ya kucheza', icon: 'play', onClick: () => GT.show(el, id, kit.g, () => { kit.paused = false; }) },
          { label: 'Muulize Nuru', cls: 'blue', icon: 'help', onClick: async () => { await GT.askHugo(el, id, kit.hint); kit.paused = false; } },
          { label: 'Endelea kucheza', cls: 'ghost', onClick: () => { kit.paused = false; } },
        ],
      });
    };
    return kit;
  },

  /* Mchezo wa maswali (chaguo) unaotumiwa na michezo mingi ya kujifunza */
  quiz(kit, { total = 8, make, render, cols = 2 }) {
    if ((kit.child.needs || []).includes('attention')) total = Math.min(total, 5);
    let i = 0, right = 0, locked = false, demo = kit.first;
    const marks = [];
    const draw = () => {
      const q = make(i);
      kit.hint = q.text || q.say || '';
      kit.body.innerHTML = `
        <div class="g-progress">${Array.from({ length: total }, (_, k) => `<i class="${marks[k] || ''}"></i>`).join('')}</div>
        <div class="g-q"><span>${q.html || esc(q.text)}</span>${q.say ? `<button class="icon-btn say" id="say">${icon('volume', 22)}</button>` : ''}</div>
        ${render ? render(q) : ''}
        <div class="g-opts" style="grid-template-columns:repeat(${q.cols || cols},1fr)">${q.opts.map((o, k) => `<button class="g-opt" data-k="${k}" style="${o.style || ''}">${o.html || esc(o.label)}</button>`).join('')}</div>`;
      if (q.say) { $('#say', kit.body).onclick = () => speak(q.say, q.lang || 'sw'); if (!demo) setTimeout(() => speak(q.say, q.lang || 'sw'), 250); }
      locked = false;
      if (demo) { locked = true; kit.afterTut.push(() => showDemo(q)); return; }
      $$('.g-opt', kit.body).forEach(b => b.onclick = () => {
        if (locked || kit.ended) return;
        const o = q.opts[+b.dataset.k];
        if (o.ok) {
          locked = true; b.classList.add('ok'); right++; marks[i] = marks[i] || 'done';
          kit.addCoins(marks[i] === 'done' ? 3 : 1);
          speak(['Sahihi!', 'Vizuri sana!', 'Hongera!', 'Umeweza!'][Math.floor(Math.random() * 4)]);
          setTimeout(() => { i++; if (i >= total) end(); else draw(); }, 750);
        } else {
          b.classList.add('no'); Sfx.bad(); marks[i] = 'miss'; vibrate(60);
          $$('.g-progress i', kit.body)[i].className = 'miss';
        }
      });
    };
    /* Mfano: programu inajibu swali la kwanza yenyewe, kisha mtoto anaanza */
    const showDemo = (q) => {
      const k = q.opts.findIndex(o => o.ok);
      const btn = $$('.g-opt', kit.body)[k];
      if (!btn) { demo = false; draw(); return; }
      const banner = document.createElement('div');
      banner.className = 'tut-banner'; banner.textContent = 'Mfano: angalia jinsi ya kujibu';
      kit.body.prepend(banner);
      speak('Angalia mfano. ' + (q.say || q.text || ''), q.lang || 'sw');
      const off = GT.pointAt(btn, kit.body);
      setTimeout(() => { btn.classList.add('ok'); Sfx.good(); speak('Jibu sahihi ni ' + (q.opts[k].label || 'hili') + '. Sasa ni zamu yako!'); }, 2200);
      setTimeout(() => { off(); demo = false; draw(); }, 4600);
    };
    const end = () => {
      const firstTry = marks.filter(m => m === 'done').length;
      const stars = firstTry >= total - 1 ? 3 : firstTry >= Math.ceil(total * 0.6) ? 2 : 1;
      kit.finish({ won: true, stars, text: `Sahihi mara ya kwanza ${firstTry}/${total}` });
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
