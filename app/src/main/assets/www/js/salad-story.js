/* Safari na Nuru · Saladi ya Tembo */
const storyText = (sw, en) => I18N.lang === 'en' ? en : sw;
const saladTitle = () => storyText('Saladi ya Tembo', 'Tembo’s Fruit Salad');
const saladRecipe = ['embe', 'embe', 'ndizi'];
const saladGuests = ['twiga', 'kobe', 'simba'];

function saladHomeCard(c) {
  const saved = c.saladStory;
  const action = saved?.stage === 'done' ? storyText('Tazama stika', 'View sticker') :
    saved && saved.stage !== 'intro' ? storyText('Endelea', 'Continue') : storyText('Anza hadithi', 'Start story');
  return `<button class="salad-home" data-go="${saved?.stage === 'done' ? 'safariPassport' : 'saladStory'}">
    ${mascot('tembo', 80)}<span><small>${storyText('Safari na Nuru', 'Safari with Nuru')}</small>
    <strong>${saladTitle()}</strong><span>${action} →</span></span></button>`;
}

function newSaladStory(child) {
  return {stage: 'intro', mode: kidMode(child), picked: 0, mixed: [], guest: '', earned: child.saladStory?.earned || false};
}

const SALAD_LINES = {
  "intro": ["Leo natengeneza saladi ya matunda. Utanisaidia kuchagua maembe mawili?", "I’m making a fruit salad today. Will you help me pick two mangoes?"],
  "letter": ["Maembe! Neno maembe linaanza na herufi gani?", "Mango! Which letter starts the word mango?"],
  "first": ["Gusa embe moja uliweke kikapuni.", "Tap a mango to put it in the basket."],
  "second": ["Ongeza embe moja zaidi.", "Add one more mango."],
  "banana": ["Sasa chagua ndizi moja.", "Now pick one banana."],
  "change": ["Maembe mawili kwa shilingi 400 kila moja na ndizi ya shilingi 200. Ukitoa shilingi 1,500, utapokea chenji kiasi gani?", "Two mangoes cost 400 shillings each and one banana costs 200. What is your change from 1,500 shillings?"],
  "mix": ["Buruta tunda hadi kwenye bakuli, au liguse ili uliweke ndani.", "Drag a fruit to the bowl, or tap it to put it in."],
  "invite": ["Saladi iko tayari! Ungependa kumwalika nani mezani?", "The salad is ready! Who would you like to invite to the table?"],
  "done": ["Rafiki yako amekuja kula saladi. Asante! Umepata stika ya saladi.", "Your friend is here to share your salad. Thank you! You earned a salad sticker."],
  "added": ["Tunda limeingia!", "Into the bowl!"],
  "letter-hint": ["Sikiliza: Mmm, maembe. Gusa M.", "Listen: mmm, mango. Tap M."],
  "retry": ["Jaribu tena.", "Try again."],
  "one": ["Moja!", "One!"],
  "two": ["Mbili!", "Two!"],
  "change-hint": ["Gharama yote ni shilingi 1,000. Toa 1,000 kutoka 1,500.", "The total is 1,000 shillings. Subtract 1,000 from 1,500."],
  "drop": ["Weka tunda ndani ya bakuli.", "Drop the fruit in the bowl."],
  "recap": ["Ulimsaidia Tembo kununua maembe mawili na ndizi moja sokoni. Mkaviweka kwenye bakuli, mkatengeneza saladi na kumkaribisha rafiki mezani.", "You helped Tembo buy two mangoes and one banana at the market. Together you put them in the bowl, made a salad and invited a friend to eat."],
};
const saladLine = key => storyText(...SALAD_LINES[key]);

let saladAudio = null;
function narrateSalad(...lines) {
  stopSaladVoice();
  const phrases = lines.filter(Boolean);
  const fallback = () => speak(phrases.join(' '), I18N.lang === 'en' ? 'en' : 'sw-raw');
  if (I18N.lang === 'en') return fallback();
  // Use a local Swahili voice when the browser provides one. The bundled
  // narration also works on devices without a Swahili voice installed.
  const voice = window.speechSynthesis?.getVoices().find(v => v.localService && /^sw(?:-|$)/i.test(v.lang));
  if (voice) {
    const utterance = new SpeechSynthesisUtterance(phrases.join(' '));
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .92;
    window.speechSynthesis.speak(utterance);
    return;
  }
  const clips = phrases.map(phrase => Object.keys(SALAD_LINES).find(k => SALAD_LINES[k][0] === phrase));
  if (clips.some(key => !key)) return fallback();
  const play = i => {
    if (i >= clips.length) { saladAudio = null; return; }
    const audio = new Audio('audio/salad/' + clips[i] + '.mp3');
    saladAudio = audio;
    audio.onended = () => { if (saladAudio === audio) play(i + 1); };
    audio.play().catch(() => { if (saladAudio === audio) fallback(); });
  };
  play(0);
}

function stopSaladVoice() {
  if (saladAudio) {
    saladAudio.onended = null;
    saladAudio.pause();
    saladAudio = null;
  }
  window.speechSynthesis?.cancel();
  if (window.HugoNative?.stopSpeaking) HugoNative.stopSpeaking();
}

function saladFruitName(key) {
  return {embe: storyText('Embe', 'Mango'), ndizi: storyText('Ndizi', 'Banana'),
    chungwa: storyText('Chungwa', 'Orange')}[key];
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
  const text = storyText;
  const older = ['explorer', 'advanced'].includes(state.mode);
  const guestName = key => ({twiga: text('Twiga', 'Giraffe'), kobe: text('Kobe', 'Tortoise'), simba: text('Simba', 'Lion')})[key];
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
        controls = action('start', text('Twende sokoni', 'Go to the market'), icon('chevR', 28));
        break;
      case 'letter':
        heading = text('Herufi ya kwanza', 'First letter');
        guide = 'nuru';
        instruction = saladLine('letter');
        props = pic('embe', 72);
        controls = ['B', 'M', 'T'].map(l => action('letter-' + l, l)).join('');
        break;
      case 'market': {
        guide = 'nuru';
        heading = text('Soko Dogo', 'Little Market');
        instruction = [
          saladLine('first'),
          saladLine('second'),
          saladLine('banana'),
        ][state.picked] || '';
        props = saladVessel('basket', saladRecipe.slice(0, state.picked), text('Kikapu', 'Basket'));
        if (older) receipt = `<div class="salad-receipt">${text('Bajeti','Budget')} <b>TSh 1,500</b></div>`;
        controls = ['chungwa','ndizi','embe'].map(k => action('buy-' + k, saladFruitName(k) + (older ? ' · ' + ({embe:400, ndizi:200, chungwa:300})[k] : ''), pic(k, 58))).join('');
        break;
      }
      case 'pay':
        heading = text('Chenji sokoni', 'Market change');
        guide = 'nuru';
        instruction = saladLine('change');
        props = saladVessel('basket', saladRecipe, text('Kikapu', 'Basket'));
        receipt = '<div class="salad-receipt">2 × 400 + 1 × 200</div>';
        controls = [300,500,700].map(n => action('pay-' + n, 'TSh ' + n)).join('');
        break;
      case 'kitchen':
        heading = text('Jikoni na Tembo', 'In Tembo’s kitchen');
        scene = 'kitchen';
        instruction = saladLine('mix');
        props = saladVessel('bowl', state.mixed.map(i => saladRecipe[i]), text('Bakuli', 'Bowl'));
        controls = saladRecipe.map((k,i) => state.mixed.includes(i) ? '' :
          action('mix-' + i, saladFruitName(k), pic(k, 60))).join('');
        break;
      case 'invite':
        heading = text('Karibu mezani', 'Come to the table');
        scene = 'kitchen';
        instruction = saladLine('invite');
        props = saladVessel('bowl', saladRecipe, text('Saladi', 'Salad'));
        controls = saladGuests.map(k => action('invite-' + k, guestName(k), mascot(k, 62))).join('');
        break;
      case 'done':
        scene = 'kitchen';
        guide = state.guest;
        heading = text('Saladi iko tayari!', 'The salad is ready!');
        instruction = saladLine('done');
        props = saladSticker();
        controls = action('passport', text('Fungua pasipoti yangu', 'Open my passport'), icon('book', 26));
        break;
      default:
        state = newSaladStory(child); return advance('intro');
    }
    el.innerHTML = `<div class="topbar"><button class="icon-btn" data-action="back" aria-label="${text('Nyuma','Back')}">${icon('back')}</button>
      <h1>${text('Safari na Nuru', 'Safari with Nuru')}</h1><button class="icon-btn" data-action="listen" aria-label="${text('Sikiliza tena','Listen again')}">${icon('volume')}</button></div>
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
      /* mara ya kwanza: nyota 3, sarafu 10 na misheni ya somo */
      if (first) {
        const cur = Store.child(child.id);
        if (cur) { cur.stars = (cur.stars || 0) + 3; cur.coins = (cur.coins || 0) + 10; Store.saveChild(cur); }
        if (typeof markMission === 'function') markMission('lesson');
        toast(text('Nyota 3 na sarafu 10!', '3 stars and 10 coins!'));
      }
      return;
    }
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
  const text = storyText;
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="pb" aria-label="${text('Nyuma','Back')}">${icon('back')}</button>
    <h1>${text('Pasipoti yangu ya Safari', 'My Safari Passport')}</h1></div>
    <div class="scroll salad-page notr"><div class="salad-pass">
    ${kidAvatar(child, 72)}<h2>${esc(child.name)}</h2>
    ${earned ? `<button class="salad-seal" id="sticker">${saladSticker()}<strong>${saladTitle()}</strong>${icon('volume', 20)}</button>` :
      `<p>${text('Saidia Tembo kutengeneza saladi ili upate stika yako ya kwanza.', 'Help Tembo make a fruit salad to earn your first sticker.')}</p>`}
    <button class="btn" id="play-story">${icon('play', 22)}${earned ? text('Cheza hadithi tena', 'Play the story again') : saladTitle()}</button></div></div>`;
  $('#pb', el).onclick = () => HK.back();
  $('#play-story', el).onclick = () => HK.go('saladStory', {replay: earned && child.saladStory?.stage === 'done'});
  if (earned) $('#sticker', el).onclick = () => narrateSalad(saladLine('recap'));
  return stopSaladVoice;
};
