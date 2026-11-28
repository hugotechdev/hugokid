

HK.screens.lessons = (el) => {
  const c = Store.active();
  const done = Store.get('lessons_' + c.id, {});
  const tile = (go, name, sub, ic, cls, params = '') => `<button class="tile ${cls}" data-go="${go}" data-p='${params}'><span class="deco"></span>${go === 'mathLesson' ? ART.math : `<div class="t-ic">${icon(ic, 30)}</div>`}<div><div class="t-name" style="font-size:19px">${name}</div><div class="t-sub">${sub}</div></div></button>`;
  el.innerHTML = `
    <div class="topbar"><h1 style="font-size:24px">Lessons</h1></div>
    <div class="scroll">
      ${sceneBanner('herufi', 'twiga')}
      ${studioAllowed(c) ? `<button class="tile navy wide" data-go="aiStudio" style="margin-top:6px;background:linear-gradient(135deg,#7B61FF,#1EA7F0);--cd:#5A43D6">
        <span>${mascot('nuru', 58)}</span><div class="grow"><div class="t-name">AI Studio</div><div class="t-sub">Create stories, games, pictures and videos</div></div>${icon('chevR', 26)}</button>` : ''}
      <div class="section-title">Language</div>
      <div class="tiles">
        ${tile('langCats', 'English', 'Vocabulary', 'letters', 'blue', '{"lang":"en"}')}
        ${tile('swahiliLesson', 'Kiswahili', 'Everyday words', 'book', 'teal')}
      </div>
      <div class="section-title">Math and more</div>
      <div class="tiles">
        ${tile('mathLesson', 'Maths', 'Numbers and counting', 'balloon', 'navy')}
        ${Object.entries(LESSONS).filter(([, l]) => !l.hidden).map(([k, l]) => tile('cardLesson', l.name, (done[k] ? done[k] + ' stars' : 'Start lesson'), l.icon, { sayansi: 'teal', maisha: 'coral', hisia: 'blue' }[k], JSON.stringify({ key: k }))).join('')}
      </div>
    </div>`;
  kidNav(el, 'lessons');
  HK.setBack(() => { HK.go('home', {}, { reset: true }); return true; });
  $$('[data-go]', el).forEach(b => b.onclick = () => { Sfx.tap(); HK.go(b.dataset.go, b.dataset.p ? JSON.parse(b.dataset.p) : {}); });
};

HK.screens.langCats = (el, p) => {
  const L = LANGS.en;
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(L.name)}</h1></div>
    <div class="scroll">${Object.keys(VOCAB).map(cat => `<button class="item" data-cat="${cat}">
      <div class="i-ic" style="background:var(--blue)">${icon('book', 26)}</div>
      <div class="grow"><div class="i-title">${esc(T(cat))}</div><div class="i-sub">${VOCAB[cat].length} words</div></div>${icon('chevR', 22)}</button>`).join('')}</div>`;
  $('#bk', el).onclick = () => HK.back();
  $$('[data-cat]', el).forEach(b => b.onclick = () => HK.go('langLesson', { cat: b.dataset.cat }));
};

HK.screens.langLesson = (el, p) => {
  const c = Store.active();
  const words = VOCAB[p.cat];

  const title = T(p.cat);
  let i = 0;
  const t0 = Date.now();
  const card = () => {
    const row = words[i], w = vocabWord(row);
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(title)}</h1><span class="chip-tag">${i + 1}/${words.length}</span></div>
      <div class="center-col" style="justify-content:flex-start;padding-top:10px">
        <div class="lesson-card" style="width:100%;max-width:380px">
          ${pic(row[1], 104)}

          <div class="big notr">${esc(w.word)}</div>
          ${w.sub ? `<div class="tr notr">${esc(w.sub)}</div>` : ''}
          <div style="height:14px"></div>
          <button class="btn blue" id="say">${icon('volume', 22)} Listen</button>
        </div>
        <p class="muted" style="font-weight:800">Listen, then repeat out loud</p>
        <div class="btn-row" style="width:100%;max-width:380px;margin-top:auto;padding-bottom:16px">
          <button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>${icon('chevL', 22)}</button>
          <button class="btn" id="next" style="flex:3">${i < words.length - 1 ? 'Next word' : 'Take the quiz'} ${icon('chevR', 22)}</button>
        </div>
      </div>`;
    const sayButton = $('#say', el);
    sayButton.onclick = () => speak(w.say);
    setTimeout(() => { if (sayButton.isConnected) speak(w.say); }, 250);
    $('#bk', el).onclick = () => HK.back();
    $('#prev', el).onclick = () => { if (i > 0) { i--; card(); } };
    $('#next', el).onclick = () => { Sfx.tap(); if (i < words.length - 1) { i++; card(); } else quiz(); };
  };
  const quiz = () => {
    const qs = shuffle(words.slice()).slice(0, Math.min(5, words.length));
    runQuiz(el, title, qs.map(row => {
      const w = vocabWord(row);
      const others = shuffle(words.filter(r => r !== row)).slice(0, 2);
      return { text: 'Listen and choose the word you hear.', say: w.say, notr: true,
        opts: shuffle([row, ...others]).map(r => ({ label: vocabWord(r).word, ok: r === row })) };
    }), stars => saveLesson(c, 'lang_en_' + p.cat, stars));
  };
  card();
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};

HK.screens.cardLesson = (el, p) => {
  const c = Store.active();
  const L = LESSONS[p.key];
  const cards = L.cards;
  let i = 0;
  const t0 = Date.now();
  const card = () => {
    const k = cards[i];
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(L.name)}</h1><span class="chip-tag">${i + 1}/${cards.length}</span></div>
      <div class="center-col" style="justify-content:flex-start;padding-top:10px">
        <div class="lesson-card" style="width:100%;max-width:400px;text-align:left">
          <div class="big-ic" style="background:${L.color};margin:0 0 12px">${icon(L.icon, 46, 2.2)}</div>
          <div style="font-size:28px;font-weight:900">${esc(k.t)}</div>
          <p style="font-size:19px;line-height:1.5;font-weight:700;color:var(--navy-2)">${esc(k.x)}</p>
          <button class="btn blue small" id="say">${icon('volume', 20)} Listen</button>
        </div>
        <div class="btn-row" style="width:100%;max-width:400px;margin-top:auto;padding-bottom:16px">
          <button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>${icon('chevL', 22)}</button>
          <button class="btn" id="next" style="flex:3">${i < cards.length - 1 ? 'Continue' : 'Take the quiz'} ${icon('chevR', 22)}</button>
        </div>
      </div>`;
    const sayIt = () => speak(k.t + '. ' + k.x);
    const sayButton = $('#say', el);
    sayButton.onclick = sayIt;
    setTimeout(() => { if (sayButton.isConnected) sayIt(); }, 250);
    $('#bk', el).onclick = () => HK.back();
    $('#prev', el).onclick = () => { if (i > 0) { i--; card(); } };
    $('#next', el).onclick = () => { Sfx.tap(); if (i < cards.length - 1) { i++; card(); } else quiz(); };
  };
  const quiz = () => runQuiz(el, L.name, shuffle(cards.slice()).slice(0, 5).map(k => ({ text: k.q[0], say: k.q[0], cols: 1, opts: shuffle(k.q[1].map((o, j) => ({ label: o, ok: j === k.q[2], style: 'font-size:19px;min-height:60px' }))) })), stars => saveLesson(c, p.key, stars));
  card();
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};

HK.screens.mathLesson = (el) => {
  const c = Store.active();
  const g = ageGroup(c);
  const t0 = Date.now();
  const make = () => {
    if (g === 'explorer') { const a = 1 + rnd(5), b = 1 + rnd(4); return { html: `<span>${a} + ${b} = ?<br><span style="font-size:15px;color:var(--muted)">Use your fingers to count</span></span>`, say: `${a} plus ${b}`, opts: numOpts(a + b, 3, 2, 1) }; }
    if (g === 'adventurer') {
      const t = rnd(3);
      if (t === 0) { const a = 10 + rnd(40), b = 1 + rnd(20); return { text: `${a} + ${b} = ?`, say: `${a} plus ${b}`, opts: numOpts(a + b, 4, 5) }; }
      if (t === 1) { const a = 20 + rnd(40), b = 1 + rnd(19); return { text: `${a} − ${b} = ?`, say: `${a} minus ${b}`, opts: numOpts(a - b, 4, 5) }; }
      const a = 2 + rnd(4), b = 2 + rnd(9); return { text: `${a} × ${b} = ?`, say: `${a} times ${b}`, opts: numOpts(a * b, 4, 4) };
    }
    const t = rnd(3);
    if (t === 0) { const a = 3 + rnd(9), b = 3 + rnd(9); return { text: `${a} × ${b} = ?`, say: `${a} times ${b}`, opts: numOpts(a * b, 4, 8) }; }
    if (t === 1) { const b = 2 + rnd(9), r = 2 + rnd(11); return { text: `${b * r} ÷ ${b} = ?`, say: `${b * r} divided by ${b}`, opts: numOpts(r, 4, 3, 1) }; }
    const d = [2, 4, 5, 10][rnd(4)], n = 1 + rnd(d - 1); return { text: `${n}/${d} ya ${d * 10} ni?`, say: `${n} ya ${d} ya ${d * 10}`, opts: numOpts(n * 10, 4, 10, 1) };
  };
  runQuiz(el, 'Maths', Array.from({ length: 8 }, make), stars => saveLesson(c, 'math', stars), 'math');
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};

function saveLesson(c, key, stars) {
  const k = 'lessons_' + c.id;
  const d = Store.get(k, {});
  const prev = d[key] || 0;
  if (stars > prev) {
    d[key] = stars; Store.set(k, d);
    const cc = Store.active(); cc.stars = (cc.stars || 0) + (stars - prev); cc.coins = (cc.coins || 0) + stars * 5; Store.saveChild(cc);
  }
}

function runQuiz(el, title, qs, onDone, skill = 'read') {
  let i = 0, first = 0, missed = false;
  const draw = () => {
    if (i >= qs.length) {
      const stars = first >= qs.length ? 3 : first >= Math.ceil(qs.length * 0.6) ? 2 : 1;
      onDone && onDone(stars);
      markMission('lesson');
      logSkill(skill, first / qs.length * 100);
      Sfx.win(); confetti(el); speak("Congratulations! You finished the lesson");
      return modal(el, { iconName: 'nuru', title: 'Lesson complete!', html: `<div class="earned">${starsHTML(stars, 3, 44)}</div><p>Correct on the first try: ${first}/${qs.length}</p>`, buttons: [{ label: 'Repeat lesson', cls: 'sun', icon: 'repeat', onClick: () => HK.render() }, { label: 'More lessons', cls: 'ghost', onClick: () => HK.back() }] });
    }
    const q = qs[i]; missed = false;
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(title)}</h1></div>
      <div class="g-body g-quiz-body">
        <div class="g-progress">${qs.map((_, k) => `<i class="${k < i ? 'done' : ''}"></i>`).join('')}</div>
        <div class="g-q">${q.html || `<span>${esc(q.text)}</span>`}${q.say ? `<button class="icon-btn say" id="say" aria-label="Repeat question">${icon('volume', 22)}</button>` : ''}</div>
        <div class="g-opts" style="grid-template-columns:repeat(${q.cols || 2},1fr)">${q.opts.map((o, k) => `<button class="g-opt ${q.notr ? 'notr' : ''}" data-k="${k}" style="${o.style || ''}">${o.html || esc(o.label)}</button>`).join('')}</div>
      </div>`;
    $('#bk', el).onclick = () => HK.back();
    const sayButton = $('#say', el);
    if (sayButton) {
      sayButton.onclick = () => speak(q.say);
      setTimeout(() => { if (sayButton.isConnected && !$('.g-opt.ok', el)) speak(q.say); }, 250);
    }
    $$('.g-opt', el).forEach(b => b.onclick = () => {
      const o = q.opts[+b.dataset.k];
      if (b.closest('.g-opts').querySelector('.ok')) return;
      if (o.ok) { b.classList.add('ok'); if (!missed) first++; Sfx.good(); celebrateMascot(el); i++; setTimeout(() => { if (b.isConnected) draw(); }, 650); }
      else { b.classList.add('no'); missed = true; Sfx.bad(); vibrate(60); }
    });
  };
  draw();
}

/* ---------- Imani ---------- */
HK.screens.faith = (el) => {
  const c = Store.active();
  const f = FAITH[c.religion] || FAITH.values;
  const t0 = Date.now();
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(f.name)}</h1></div>
    <div class="scroll">
      <button class="item" id="game"><div class="i-ic" style="background:var(--sun)">${icon('sunrise', 26)}</div>
        <div class="grow"><div class="i-title">Faith Journey</div><div class="i-sub">Quiz game</div></div>${icon('chevR', 22)}</button>
      ${f.cards.map((k, i) => `<div class="card">
        <div class="row"><h3 class="grow" style="margin:0">${esc(k.t)}</h3><button class="icon-btn" data-say="${i}" style="width:40px;height:40px">${icon('volume', 20)}</button></div>
        ${k.ar ? `<div class="arabic" style="text-align:right;margin:8px 0 4px;color:var(--navy)">${esc(k.ar)}</div>` : ''}
        ${k.tr ? `<p style="font-style:italic;margin-bottom:6px">${esc(k.tr)}</p>` : ''}
        <p style="font-size:15px">${esc(k.x)}</p></div>`).join('')}
    </div>`;
  $('#bk', el).onclick = () => HK.back();
  $('#game', el).onclick = () => HK.go('g_faith');
  $$('[data-say]', el).forEach(b => b.onclick = () => {
    const k = f.cards[+b.dataset.say];
    speak(k.t + '. ' + k.x);
  });
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};

HK.screens.swahiliLesson = el => {
  const child = Store.active();
  const started = Date.now();
  const words = Object.entries(VOCAB).flatMap(([category, rows]) =>
    rows.map(([swahili, english]) => ({ category, swahili, english })));
  let index = 0;
  const draw = () => {
    const { category, swahili, english } = words[index];
    el.innerHTML = `<div class="topbar">
      <button class="icon-btn" id="sw-back" aria-label="Back">${icon('back')}</button>
      <h1>Kiswahili</h1><span class="chip-tag">${index + 1}/${words.length}</span>
    </div><div class="scroll">
      <div class="lesson-card">
        <p>${esc(T(category))}</p>
        <div class="big notr" lang="sw-TZ">${esc(swahili)}</div>
        <p class="notr">${esc(english)}</p>
      </div>
      <div class="btn-row">
        <button class="btn ghost" id="sw-prev" ${index === 0 ? 'disabled' : ''}>Previous</button>
        <button class="btn" id="sw-next" ${index === words.length - 1 ? 'disabled' : ''}>Next</button>
      </div>
    </div>`;
    $('#sw-back', el).onclick = () => HK.back();
    $('#sw-prev', el).onclick = () => { if (index > 0) { index--; draw(); } };
    $('#sw-next', el).onclick = () => { if (index < words.length - 1) { index++; draw(); } };
  };
  draw();
  return () => HK.addLearnTime(child, Math.round((Date.now() - started) / 1000));
};
