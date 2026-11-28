/* Safari with Nuru: Tembo’s Fruit Salad. */
const saladTitle = () => 'Tembo’s Fruit Salad';
const saladRecipe = ['embe', 'embe', 'ndizi'];
const saladGuests = ['twiga', 'kobe', 'simba'];

function saladHomeCard(c) {
  const saved = c.saladStory;
  const action = saved?.earned ? 'Explore all six episodes' :
    saved && saved.stage !== 'intro' ? 'Continue' : 'Start story';
  return `<button class="salad-home" data-go="safariSeries">
    ${mascot('tembo', 80)}<span><small>Adventure series</small>
    <strong>Safari with Nuru</strong><span>${action} →</span></span></button>`;
}

function newSaladStory(child) {
  return {stage: 'intro', mode: kidMode(child), picked: 0, mixed: [], guest: '', earned: child.saladStory?.earned || false};
}

const SALAD_LINES = {
  "intro": "I’m making a fruit salad today. Will you help me pick two mangoes?",
  "letter": "Mango! Which letter starts the word mango?",
  "first": "Tap a mango to put it in the basket.",
  "second": "Add one more mango.",
  "banana": "Now pick one banana.",
  "change": "Two mangoes cost 400 shillings each and one banana costs 200. What is your change from 1,500 shillings?",
  "mix": "Drag a fruit to the bowl, or tap it to put it in.",
  "invite": "The salad is ready! Who would you like to invite to the table?",
  "done": "Your friend is here to share your salad. Thank you! You earned a salad sticker.",
  "added": "Into the bowl!",
  "letter-hint": "Listen: mmm, mango. Tap M.",
  "retry": "Try again.",
  "one": "One!",
  "two": "Two!",
  "change-hint": "The total is 1,000 shillings. Subtract 1,000 from 1,500.",
  "drop": "Drop the fruit in the bowl.",
  "recap": "You helped Tembo buy two mangoes and one banana at the market. Together you put them in the bowl, made a salad and invited a friend to eat.",
};
const saladLine = key => SALAD_LINES[key];

function narrateSalad(...lines) { speak(lines.filter(Boolean).join(' ')); }
function stopSaladVoice() {
  Voice.stop();
  window.speechSynthesis?.cancel();
  window.HugoNative?.stopSpeaking?.();
}

function saladFruitName(key) {
  return {embe: 'Mango', ndizi: 'Banana',
    chungwa: 'Orange'}[key];
}

function saladVessel(kind, fruits, label) {
  return `<div class="salad-vessel ${kind}" aria-label="${esc(label)}">
    <div class="salad-contents" aria-hidden="true">${fruits.map(key => pic(key, 38)).join('')}</div>
    <div class="salad-rim"></div></div>`;
}

function saladSticker() {
  return `<span class="salad-sticker" aria-hidden="true">${saladVessel('bowl', saladRecipe, '')}</span>`;
}

HK.screens.saladStory = (el, params = {}) => {
  const child = Store.active();
  if (!child) return HK.boot();
  let state = params.replay || !child.saladStory ? newSaladStory(child) : { ...child.saladStory };
  // A screen refresh should resume a replay, not start it again.
  delete params.replay;
  const save = () => {
    const current = Store.child(child.id);
    if (current) Store.saveChild({ ...current, saladStory: state });
  };
  save();
  const older = ['explorer', 'advanced'].includes(state.mode);
  const guestName = key => ({twiga: 'Giraffe', kobe: 'Tortoise', simba: 'Lion'})[key];
  let instruction = '', drag = null;
  const action = (value, label, art = '') =>
    `<button class="salad-choice" data-action="${value}">${art}<span>${label}</span></button>`;
  const advance = stage => { state.stage = stage; save(); draw(); };
  const feedback = (...lines) => {
    $('.salad-hint', el).textContent = lines.join(' ');
    narrateSalad(...lines);
  };

  function draw(prefix = '') {
    let controls = '', props = '', receipt = '', scene = 'soko', heading = saladTitle();
    let guide = 'tembo';
    switch (state.stage) {
      case 'intro':
        instruction = saladLine('intro');
        controls = action('start', 'Go to the market', icon('chevR', 28));
        break;
      case 'letter':
        heading = 'First letter';
        guide = 'nuru';
        instruction = saladLine('letter');
        props = pic('embe', 72);
        controls = ['B', 'M', 'T'].map(l => action('letter-' + l, l)).join('');
        break;
      case 'market': {
        guide = 'nuru';
        heading = 'Little Market';
        instruction = [
          saladLine('first'),
          saladLine('second'),
          saladLine('banana'),
        ][state.picked] || '';
        props = saladVessel('basket', saladRecipe.slice(0, state.picked), 'Basket');
        if (older) receipt = `<div class="salad-receipt">${'Budget'} <b>TSh 1,500</b></div>`;
        controls = ['chungwa','ndizi','embe'].map(k => action('buy-' + k, saladFruitName(k) + (older ? ' · ' + ({embe:400, ndizi:200, chungwa:300})[k] : ''), pic(k, 58))).join('');
        break;
      }
      case 'pay':
        heading = 'Market change';
        guide = 'nuru';
        instruction = saladLine('change');
        props = saladVessel('basket', saladRecipe, 'Basket');
        receipt = '<div class="salad-receipt">2 × 400 + 1 × 200</div>';
        controls = [300,500,700].map(n => action('pay-' + n, 'TSh ' + n)).join('');
        break;
      case 'kitchen':
        heading = 'In Tembo’s kitchen';
        scene = 'kitchen';
        instruction = saladLine('mix');
        props = saladVessel('bowl', state.mixed.map(i => saladRecipe[i]), 'Bowl');
        controls = saladRecipe.map((k,i) => state.mixed.includes(i) ? '' :
          action('mix-' + i, saladFruitName(k), pic(k, 60))).join('');
        break;
      case 'invite':
        heading = 'Come to the table';
        scene = 'kitchen';
        instruction = saladLine('invite');
        props = saladVessel('bowl', saladRecipe, 'Salad');
        controls = saladGuests.map(k => action('invite-' + k, guestName(k), mascot(k, 62))).join('');
        break;
      case 'done':
        scene = 'kitchen';
        guide = state.guest;
        heading = 'The salad is ready!';
        instruction = saladLine('done');
        props = saladSticker();
        controls = action('next-episode', 'Next episode', icon('chevR', 22)) + action('passport', 'Open my passport', icon('book', 26));
        break;
      default:
        state = newSaladStory(child); return advance('intro');
    }
    el.innerHTML = `<div class="topbar"><button class="icon-btn" data-action="back" aria-label="${'Back'}">${icon('back')}</button>
      <h1>${'Safari with Nuru'}</h1><button class="icon-btn" data-action="listen" aria-label="${'Listen again'}">${icon('volume')}</button></div>
      <div class="scroll salad-page notr"><div class="salad-stage scene-${scene}">${receipt}
      <div class="salad-hero-pair">${kidAvatar(child, 66)}${mascot(guide, 105)}</div>
      <div class="salad-props">${props}</div></div>
      <div class="salad-dialog"><h2>${heading}</h2><p>${esc(instruction)}</p></div>
      <div class="salad-options">${controls}</div>
      <p class="salad-hint" aria-live="polite">${esc(prefix)}</p></div>`;
    narrateSalad(prefix, instruction);
  }
  function mix(i) {
    if (state.stage !== 'kitchen' || !Number.isInteger(i) || i < 0 || i >= saladRecipe.length || state.mixed.includes(i)) return;
    state.mixed = [...state.mixed, i];
    if (state.mixed.length === saladRecipe.length) return advance('invite');
    save(); draw(saladLine('added'));
  }
  el.onclick = e => {
    const button = e.target.closest('[data-action]');
    if (!button || !el.contains(button)) return;
    const [cmd, value] = button.dataset.action.split('-');
    if (cmd === 'back') return HK.back();
    if (cmd === 'listen') return narrateSalad(instruction);
    if (cmd === 'start') return advance(state.mode === 'beginner' ? 'letter' : 'market');
    if (cmd === 'letter') return value === 'M' ? advance('market') : feedback(saladLine('letter-hint'));
    if (cmd === 'buy') {
      if (value !== saladRecipe[state.picked]) return feedback(saladLine('retry'), instruction);
      const count = ++state.picked;
      if (count === saladRecipe.length) return advance(older ? 'pay' : 'kitchen');
      save(); return draw(count === 1 ? saladLine('one') : saladLine('two'));
    }
    if (cmd === 'pay') return value === '500' ? advance('kitchen') : feedback(saladLine('change-hint'));
    if (cmd === 'mix') return mix(Number(value));
    if (cmd === 'invite' && saladGuests.includes(value)) {
      const first = !state.earned;
      state.guest = value; state.earned = true;
      advance('done'); confetti(el);

      if (first) {
        const cur = Store.child(child.id);
        if (cur) { cur.stars = (cur.stars || 0) + 3; cur.coins = (cur.coins || 0) + 10; Store.saveChild(cur); }
        if (typeof markMission === 'function') markMission('lesson');
        toast('3 stars and 10 coins!');
      }
      return;
    }
    if (cmd === 'next') return safariGo(1, true);
    if (cmd === 'passport') {
      if (HK.stack[HK.stack.length - 2]?.name === 'safariPassport') return HK.back();
      HK.go('safariPassport', {}, {replace: true});
    }
  };
  // Capture the finger on the fruit so touch, pen and mouse can all drop into the bowl.
  function releaseDrag() {
    if (!drag) return;
    drag.button.style.transform = '';
    drag.button.classList.remove('moving');
    drag = null;
  }
  el.onpointerdown = e => {
    const button = e.target.closest('[data-action^="mix-"]');
    if (!button || !e.isPrimary) return;
    drag = {button, x:e.clientX, y:e.clientY, id:e.pointerId};
    button.setPointerCapture(e.pointerId);
  };
  el.onpointermove = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) < 8 && !drag.moved) return;
    drag.moved = true;
    drag.button.classList.add('moving');
    drag.button.style.transform = `translate(${dx}px,${dy}px)`;
  };
  el.onpointerup = e => {
    if (!drag || e.pointerId !== drag.id) return;
    const {button,moved} = drag;
    releaseDrag();
    if (!moved) return;
    button.addEventListener('click', event => event.stopPropagation(), {once:true});
    const box = $('.bowl', el).getBoundingClientRect();
    if (e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom) mix(Number(button.dataset.action.slice(4)));
    else draw(saladLine('drop'));
  };
  el.onpointercancel = releaseDrag;
  let visibleSince = document.hidden ? null : Date.now();
  const recordTime = () => {
    if (visibleSince !== null) HK.addLearnTime(child, Math.round((Date.now() - visibleSince) / 1000));
    visibleSince = null;
  };
  const visibility = () => {
    if (document.hidden) { recordTime(); stopSaladVoice(); }
    else visibleSince = Date.now();
  };
  document.addEventListener('visibilitychange', visibility);
  draw();
  return () => {
    document.removeEventListener('visibilitychange', visibility);
    releaseDrag(); stopSaladVoice(); recordTime();
  };
};

HK.screens.safariPassport = el => {
  const child = Store.active();
  if (!child) return HK.boot();
  const earned = !!child.saladStory?.earned;
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="pb" aria-label="${'Back'}">${icon('back')}</button>
    <h1>${'My Safari Passport'}</h1></div>
    <div class="scroll salad-page notr"><div class="salad-pass">
    ${kidAvatar(child, 72)}<h2>${esc(child.name)}</h2>
    ${earned ? `<button class="salad-seal" id="sticker">${saladSticker()}<strong>${saladTitle()}</strong>${icon('volume', 20)}</button>` :
      `<p>${'Help Tembo make a fruit salad to earn your first sticker.'}</p>`}
    ${SAFARI_STORIES.slice(1).map((story, i) => child.safariField?.[i + 1]?.done ? `<button class="salad-seal" data-replay="${i+1}">${mascot(story.guide, 65)}<strong>${story.title}</strong><small>Replay episode</small></button>` : '').join('')}
    ${SAFARI_LEGACY_TITLES.some((_,i)=>child.safariSeries?.[i+1]?.done)?`<details><summary>Earlier passport stamps</summary>${SAFARI_LEGACY_TITLES.filter((_,i)=>child.safariSeries?.[i+1]?.done).map(title=>`<p>${esc(title)}</p>`).join('')}</details>`:''}
    <button class="btn ghost" id="all-stories">All episodes</button>
    <button class="btn" id="play-story">${icon('play', 22)}${earned ? 'Play the story again' : saladTitle()}</button></div></div>`;
  $('#pb', el).onclick = () => HK.back();
  $('#all-stories', el).onclick = () => HK.go('safariSeries');
  $$('[data-replay]', el).forEach(button => button.onclick = () => safariGo(Number(button.dataset.replay)));
  $('#play-story', el).onclick = () => HK.go('saladStory', {replay: earned && child.saladStory?.stage === 'done'});
  if (earned) $('#sticker', el).onclick = () => narrateSalad(saladLine('recap'));
  return stopSaladVoice;
};
