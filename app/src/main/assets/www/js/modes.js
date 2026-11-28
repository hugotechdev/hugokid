/* Age modes, placement assessment and starter games. */

const MODES = {
  toddler: { name: 'Mdogo', range: 'Miaka 3-4', group: 'explorer' },
  beginner: { name: 'Anaanza kusoma', range: 'Miaka 5-6', group: 'explorer' },
  explorer: { name: 'Mvumbuzi', range: 'Miaka 7-9', group: 'adventurer' },
  advanced: { name: 'Mvumbuzi Mkuu', range: 'Miaka 10-12', group: 'master' },
};
const MODE_ORDER = ['toddler', 'beginner', 'explorer', 'advanced'];
const GRADES = ['Sijaanza shule', 'Awali - Baby Class', 'Awali - Middle Class', 'Awali - Pre-Unit', 'Darasa la 1', 'Darasa la 2', 'Darasa la 3', 'Darasa la 4', 'Darasa la 5', 'Darasa la 6', 'Darasa la 7'];
const NEEDS = { vision: 'Kuona hafifu', hearing: 'Kusikia hafifu', dyslexia: 'Ugumu wa kusoma (dyslexia)', attention: 'Umakini mfupi' };

function kidMode(c) {
  if (!c) return 'explorer';
  if (c.modeOverride && MODES[c.modeOverride]) return c.modeOverride;
  const a = ageYears(c.birth);
  let i = a <= 4 ? 0 : a <= 6 ? 1 : a <= 9 ? 2 : 3;
  const pl = c.place;
  if (pl) {
    if (i >= 2 && pl.read <= 1) i = 1;
    else if (i === 1 && pl.read >= 3 && pl.math >= 2) i = 2;
    else if (i === 2 && pl.read >= 3 && pl.math >= 3) i = 3;
    else if (i === 3 && pl.read <= 1) i = 2;
    if (i === 0 && pl.read >= 2) i = 1;
  }
  const s = skillTrend(c);
  if (s > 0 && i < 3 && a >= 5) i++;
  if (s < 0) i = Math.max(a <= 5 ? 0 : 1, i - 1);
  return MODE_ORDER[i];
}

function skillTrend(c) {
  const log = c.skillLog || {};
  const all = [...(log.read || []), ...(log.math || [])].slice(-8);
  if (all.length < 6) return 0;
  const avg = all.reduce((a, b) => a + b, 0) / all.length;
  return avg >= 88 ? 1 : avg < 35 ? -1 : 0;
}
function logSkill(skill, pct) {
  const c = Store.active(); if (!c) return;
  c.skillLog = c.skillLog || {};
  c.skillLog[skill] = [...(c.skillLog[skill] || []), Math.round(pct)].slice(-12);
  Store.saveChild(c);
}
const SKILL_OF = { letters: 'read', speak: 'read', faith: 'read', memory: 'read', balloons: 'math', market: 'math', shapes: 'math', robot: 'math' };

function applyNeeds(c) {
  const b = document.body;
  MODE_ORDER.forEach(m => b.classList.remove('mode-' + m));
  Object.keys(NEEDS).forEach(n => b.classList.remove('need-' + n));
  if (!c) return;
  b.classList.add('mode-' + kidMode(c));
  (c.needs || []).forEach(n => b.classList.add('need-' + n));
}
const _speak = speak;
speak = function (text, lang) {
  const c = Store.active();
  if (c && (c.needs || []).includes('hearing') && text && String(text).length < 160 && !/[؀-ۿ]/.test(text)) toast(text);
  return _speak(text, lang);
};

setInterval(() => {
  const c = Store.active(); const top = HK.stack[HK.stack.length - 1];
  if (!c || !top || document.hidden || ['parentHome', 'pin', 'welcome', 'terms', 'acctAuth', 'sleep', 'timeUp', 'call'].includes(top.name) || Net.role() && STAFF.includes(Net.role())) return;
  const k = 'hk_active_' + c.id, n = (+sessionStorage.getItem(k) || 0) + 1;
  sessionStorage.setItem(k, n);
  const limit = (c.needs || []).includes('attention') ? 12 : 30;
  if (n < limit || $('.overlay')) return;
  sessionStorage.setItem(k, 0);
  const b = pick(BREAKS);
  speak('Take a short break. ' + b.say);
  modal(null, { iconName: 'run', iconColor: 'var(--teal)', title: 'Pumzika kidogo', text: b.t, buttons: [{ label: 'Nimemaliza', icon: 'check', onClick: () => { const cc = Store.active(); cc.stars = (cc.stars || 0) + 1; Store.saveChild(cc); toast("1 star for practice"); } }] });
}, 60000);

const COLORS_SW = [['Nyekundu', '#F65B4F'], ['Bluu', '#1EA7F0'], ['Njano', '#FFC20E'], ['Kijani', '#0FB394'], ['Zambarau', '#7B61FF'], ['Chungwa', '#FF8A3D'], ['Nyeusi', '#20232B'], ['Nyeupe', '#FFFFFF']];

function learned(kind, item) {
  const c = Store.active(); if (!c) return;
  c.learned = c.learned || {};
  const set = new Set(c.learned[kind] || []); set.add(item);
  c.learned[kind] = [...set];
  Store.saveChild(c);
}

HK.screens.tapGame = (el, p) => {
  const scenes = { colors: 'bubbles', animals: 'serengeti', numbers: 'namba', shapes: 'maumbo' };
  el.classList.add('game-world', 'scene-' + (scenes[p.kind] || 'serengeti'));
  const c = Store.active();
  const kind = p.kind || 'animals';
  const total = 6; let i = 0, first = 0, missed = false;
  const t0 = Date.now();
  let answerTimer, speechTimer;
  const animalIds = kind === 'animals' ? (ANIMAL_GROUPS[p.habitat] || ANIMAL_GROUPS.familiar).animals.map(([id]) => id) : [];
  const seenAnimals = new Set(c.learned?.animals || []);
  const targets = shuffle(animalIds.slice()).sort((a, b) => Number(seenAnimals.has(a)) - Number(seenAnimals.has(b))).slice(0, total);
  const make = () => {
    if (kind === 'colors') {
      const opts = shuffle(COLORS_SW.slice(0, 6)).slice(0, 3); const a = pick(opts);
      return { say: 'Tap the ' + T(a[0]).toLowerCase() + ' colour', item: a[0], opts: opts.map(o => ({ html: `<span style="display:block;width:100%;height:100%;border-radius:28px;background:${o[1]};border:4px solid rgba(13,36,97,.1)"></span>`, ok: o === a })) };
    }
    if (kind === 'numbers') {
      const nums = shuffle([1, 2, 3, 4, 5]).slice(0, 3); const a = pick(nums);
      return { say: 'Tap ' + a + (a === 1 ? ' star' : ' stars'), item: String(a), opts: nums.map(n => ({ html: `<span style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center;height:100%;padding:8px">${Array.from({ length: n }, () => `<svg width="34" height="34" viewBox="0 0 24 24" fill="#FFC20E" stroke="#D29E00" stroke-width="1.4"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>`).join('')}</span>`, ok: n === a })) };
    }
    if (kind === 'shapes') {
      const opts = shuffle(SHAPES.slice(0, 6)).slice(0, 3); const a = pick(opts);
      return { say: 'Tap the ' + T(a[0]).toLowerCase(), item: a[0], opts: opts.map((s, k) => ({ html: shapeSvg(s, SHAPE_COLS[k], 96), ok: s === a })) };
    }
    const id = targets[i];
    return {
      say: 'Tap the ' + ANIMAL_NAMES.get(id).toLowerCase(),
      item: id,
      opts: animalChoices(id, animalIds),
    };
  };
  const draw = () => {
    if (i >= total) {
      const stars = first >= 6 ? 3 : first >= 4 ? 2 : 1;
      const cc = Store.active(); const k = 'tap_' + kind; cc.gp = cc.gp || {}; const prev = (cc.gp[k] || {}).best || 0;
      if (stars > prev) { cc.stars = (cc.stars || 0) + (stars - prev); cc.gp[k] = { best: stars }; }
      cc.coins = (cc.coins || 0) + 3; Store.saveChild(cc);
      Sfx.win(); confetti(el); speak("Congratulations! You did very well!");
      return modal(el, { iconName: 'trophy', iconColor: 'var(--sun)', title: 'Quiz complete!', html: `<div class="earned">${starsHTML(stars, 3, 56)}</div>`, buttons: [{ label: 'Play again', icon: 'repeat', onClick: () => HK.render() }, { label: 'Back to home', cls: 'ghost', icon: 'home', onClick: () => HK.go('home', {}, { reset: true }) }] });
    }
    const q = make(); missed = false;
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><div class="grow"></div>
        <button class="icon-btn" id="say" aria-label="Repeat question" style="width:64px;height:64px;background:var(--blue-d);color:#fff">${icon('volume', 34)}</button><div class="grow"></div>
        <div class="g-progress" style="padding:0">${Array.from({ length: total }, (_, k) => `<i class="${k < i ? 'done' : ''}" style="width:12px"></i>`).join('')}</div></div>
      <p class="tap-question">${esc(q.say)}</p><div class="tap-grid">${q.opts.map((o, k) => `<button class="tap-opt" data-k="${k}">${o.html}</button>`).join('')}</div>`;
    $('#bk', el).onclick = () => HK.back();
    $('#say', el).onclick = () => speak(q.say);
    speechTimer = setTimeout(() => speak(q.say), 250);
    $$('.tap-opt', el).forEach(b => b.onclick = () => {
      const o = q.opts[+b.dataset.k];
      if (o.ok) {
        clearTimeout(speechTimer);
        if (o.id) playAnimal(b, o.id);
        if (!missed) first++;
        b.classList.add('ok'); Sfx.good(); learned(kind, q.item);
        speak(pick(['Well done!', 'Very good!', 'You did it!']) + (o.id ? ' This is the ' + o.label.toLowerCase() + '.' : ''));
        i++; $$('.tap-opt', el).forEach(choice => choice.disabled = true); answerTimer = setTimeout(draw, o.id ? 2200 : 1300);
      } else { clearTimeout(speechTimer); missed = true; b.classList.add('no'); Sfx.bad(); vibrate(80); speak('Try again. ' + q.say); }
    });
  };
  draw();
  return () => {
    clearTimeout(speechTimer);
    clearTimeout(answerTimer);
    HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
  };
};

const ABC_EN = [['A', 'Apple'], ['B', 'Ball'], ['C', 'Cat'], ['D', 'Dog'], ['E', 'Egg'], ['F', 'Fish'], ['G', 'Goat'], ['H', 'Hat'], ['I', 'Insect'], ['J', 'Jug'], ['K', 'Kite'], ['L', 'Lion'], ['M', 'Mango'], ['N', 'Nest'], ['O', 'Orange'], ['P', 'Pen'], ['Q', 'Queen'], ['R', 'Rabbit'], ['S', 'Sun'], ['T', 'Tree'], ['U', 'Umbrella'], ['V', 'Van'], ['W', 'Water'], ['X', 'Box'], ['Y', 'Yam'], ['Z', 'Zebra']];
HK.screens.abc = el => {
  const c = Store.active();
  let i = 0;
  const t0 = Date.now();
  const draw = () => {
    const [L, w] = ABC_EN[i];
    const art = pic(w, 120);
    const rule = L === 'X' ? 'X is the last letter in box.' : L + ' is the first letter in ' + w.toLowerCase() + '.';
    window.HK_onSpeech = null;
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk" aria-label="Back">${icon('back')}</button><h1>Alphabet</h1>
        </div>
      <div class="center-col" style="justify-content:flex-start;padding-top:6px">
        <div class="lesson-card" style="width:100%;max-width:380px;padding:18px">
          <div style="font-size:120px;font-weight:700;line-height:1;color:var(--blue)">${L}<span style="font-size:80px;color:var(--coral)">${L.toLowerCase()}</span></div>
          ${art ? `<div style="display:flex;justify-content:center;margin:6px auto">${art}</div>` : ''}
          <div class="big notr" style="font-size:34px">${esc(w)}</div>
          ${L === 'X' ? '<p>X comes at the end of box.</p>' : ''}
        </div>
        <div class="btn-row" style="width:100%;max-width:380px;margin:14px 0">
          <button class="btn blue" id="say">${icon('volume', 24)} Listen</button>
          ${window.HugoNative?.canListen?.() ? `<button class="btn coral" id="mic">${icon('mic', 24)} Repeat</button>` : ''}
        </div>
        <p id="heard" class="muted" style="font-weight:600;min-height:20px"></p>
        <div class="btn-row" style="width:100%;max-width:380px;margin-top:auto;padding-bottom:16px">
          <button class="btn ghost" id="prev" aria-label="Previous letter" ${i ? '' : 'disabled'}>${icon('chevL', 24)}</button>
          <button class="btn" id="next" aria-label="Next letter" style="flex:3">${icon('chevR', 24)}</button>
        </div>
      </div>`;
    const sayButton = $('#say', el);
    sayButton.onclick = () => speak(rule);
    setTimeout(() => { if (sayButton.isConnected && !window.HK_onSpeech) speak(rule); }, 250);
    learned('letters', L);
    $('#bk', el).onclick = () => HK.back();
    $('#prev', el).onclick = () => { if (i) { i--; draw(); } };
    $('#next', el).onclick = () => { Sfx.tap(); i = (i + 1) % ABC_EN.length; draw(); };
    const mic = $('#mic', el);
    if (mic) mic.onclick = () => {
      if (window.HK_onSpeech) return;
      Voice.stop();
      window.speechSynthesis?.cancel();
      HugoNative.stopSpeaking?.();
      $('#heard', el).textContent = 'Listening…';
      window.HK_onSpeech = res => {
        window.HK_onSpeech = null;
        if (!mic.isConnected) return;
        const guesses = Array.isArray(res) ? res : [];
        const said = guesses[0];
        const ok = guesses.some(x => matchesDoorWord(x, w));
        $('#heard', el).textContent = said ? 'Heard: ' + said : 'No speech detected. Try again.';
        if (ok) { Sfx.good(); celebrateMascot(el, 'kobe'); speak("Very good!"); learned('words', w); } else if (said) speak('Good try! Listen again: ' + w);
      };
      HugoNative.listen('en-TZ');
    };
  };
  draw();
  return () => { window.HK_onSpeech = null; HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000)); };
};

/* ---------- Kipimo cha uwezo (dakika 5) ---------- */
HK.screens.placement = (el, p) => {
  const c = Store.active();
  const age = ageYears(c.birth);
  const steps = [
    { k: 'math', lvl: 0, say: "Tap three stars", build: () => { const n = shuffle([1, 2, 3, 4]).slice(0, 3); if (!n.includes(3)) n[0] = 3; return shuffle(n).map(x => ({ html: `<span style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center">${Array.from({ length: x }, () => '<svg width="30" height="30" viewBox="0 0 24 24" fill="#FFC20E" stroke="#D29E00" stroke-width="1.4"><path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>').join('')}</span>`, ok: x === 3 })); } },
    { k: 'read', lvl: 1, say: "Tap the letter B", build: () => shuffle(['B', 'D', 'P']).map(x => ({ html: `<span style="font-size:52px;font-weight:700">${x}</span>`, ok: x === 'B' })) },
    { k: 'read', lvl: 2, say: "Read this word, then tap its picture", text: 'CAT', build: () => shuffle(['Paka', 'Samaki', 'Tembo']).map(x => ({ html: ANIMALS[x](), ok: x === 'Paka' })) },
    { k: 'math', lvl: 1, say: 'What is three plus two?', text: '3 + 2 = ?', build: () => shuffle([4, 5, 6]).map(x => ({ html: `<span style="font-size:44px;font-weight:700">${x}</span>`, ok: x === 5 })) },
    { k: 'read', lvl: 3, say: "Read the sentence, then choose the answer", text: 'A giraffe has a long neck. Which animal has a long neck?', build: () => shuffle(['Twiga', 'Paka', 'Samaki']).map(x => ({ html: `<span style="font-size:24px;font-weight:700">${T(x)}</span>`, ok: x === 'Twiga' })), noSay: true },
    { k: 'math', lvl: 2, say: '', text: '7 × 6 = ?', build: () => shuffle([42, 36, 48]).map(x => ({ html: `<span style="font-size:40px;font-weight:700">${x}</span>`, ok: x === 42 })), noSay: true },
    { k: 'math', lvl: 3, say: '', text: 'What is 3/4 of 20?', build: () => shuffle([15, 12, 5]).map(x => ({ html: `<span style="font-size:40px;font-weight:700">${x}</span>`, ok: x === 15 })), noSay: true },
  ].filter(s => age >= 5 || s.lvl <= 1);
  const res = { read: 0, math: 0 };
  let i = 0;
  const intro = () => {
    el.innerHTML = `<div class="center-col">
      ${mascot('nuru', 110)}
      <h2 style="font-size:24px;margin:14px 0 6px">Tucheze kidogo, ${esc(c.name)}!</h2>
      <p class="muted" style="font-weight:500;max-width:320px">A few questions to find your level so we can prepare the right lessons for you. A parent can help read the instructions.</p>
      <div style="height:20px"></div>
      <button class="btn blue" id="go" style="min-width:220px">${icon('play', 22)} Anza</button>
      <div style="height:12px"></div><button class="btn ghost small" id="skip">Skip for now</button></div>`;
    speak('Let’s play, ' + c.name + '! I’ll ask you a few questions.');
    $('#go', el).onclick = step; $('#skip', el).onclick = () => HK.go('home', {}, { reset: true });
  };
  const step = () => {
    if (i >= steps.length) return finish();
    const s = steps[i]; const opts = s.build();
    el.innerHTML = `
      <div class="topbar"><div class="g-progress" style="flex:1">${steps.map((_, k) => `<i class="${k < i ? 'done' : ''}"></i>`).join('')}</div>
        ${s.say ? `<button class="icon-btn" id="say">${icon('volume', 22)}</button>` : ''}</div>
      ${s.text ? `<div class="g-q" style="font-size:${s.text.length > 20 ? 20 : 36}px">${esc(s.text)}</div>` : ''}
      <p class="tap-question">${esc(q.say)}</p><div class="tap-grid">${opts.map((o, k) => `<button class="tap-opt" data-k="${k}">${o.html}</button>`).join('')}</div>`;
    if (s.say) { $('#say', el).onclick = () => speak(s.say); setTimeout(() => speak(s.say), 250); }
    $$('.tap-opt', el).forEach(b => b.onclick = () => {
      const ok = opts[+b.dataset.k].ok;
      Sfx.tap();
      if (ok) res[s.k] = Math.max(res[s.k], s.lvl + 1);
      i++;

      if (!ok) while (i < steps.length && steps[i].k === s.k && steps[i].lvl > s.lvl) i++;
      setTimeout(step, 250);
    });
  };
  const finish = () => {
    const cc = Store.active();
    cc.place = { read: Math.min(3, res.read), math: Math.min(3, res.math), at: Date.now() };
    Store.saveChild(cc);
    const m = kidMode(cc);
    Sfx.win(); confetti(el);
    speak("Congratulations! We have prepared your journey.");
    el.innerHTML = `<div class="center-col">
      ${avatarSVG(cc.color, 110)}
      <h2 style="font-size:24px;margin:14px 0 4px">Tayari!</h2>
      <p class="muted" style="font-weight:500">Kiwango: <b style="color:var(--navy)">${esc(MODES[m].name)}</b></p>
      <div class="card" style="width:100%;max-width:340px;margin-top:14px;text-align:left">
        ${[['Kusoma', cc.place.read], ['Hesabu', cc.place.math]].map(([n, v]) => `<div class="row" style="justify-content:space-between;margin-top:8px"><b>${n}</b><span class="lvl-dots">${[1, 2, 3].map(k => `<i class="${k <= v ? 'on' : ''}"></i>`).join('')}</span></div>`).join('')}
        <p style="font-size:13px;margin-top:10px">Nuru will keep following progress and adjust the level as the child grows.</p>
      </div>
      <div style="height:16px"></div><button class="btn" id="go" style="min-width:220px">${icon('home', 22)} Twende</button></div>`;
    $('#go', el).onclick = () => HK.go('home', {}, { reset: true });
  };
  intro();
};
