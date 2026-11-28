/* Short learning stories. Episode one remains the original kitchen adventure. */
const SAFARI_ART = {
  Zebra: ['mascot','pundamilia'], Elephant: ['mascot','tembo'], Giraffe: ['mascot','twiga'],
  Circle: ['shape',0], Triangle: ['shape',2], Square: ['shape',1],
  Red: ['pic','red'], Blue: ['pic','blue'], Green: ['pic','green'],
};
function safariArt(answer) {
  const art = SAFARI_ART[answer];
  if (!art) return '';
  if (art[0] === 'shape') return shapeSvg(SHAPES[art[1]], '#1e946c', 45);
  return art[0] === 'mascot' ? mascot(art[1], 48) : pic(art[1], 45);
}

const SAFARI_LEGACY_TITLES=['Follow the Footprints','Kobe’s Shape Bridge','Twiga’s Letter Trail','The Coast Clean-Up','Flags on Kilimanjaro'];
const safariSettings=[
  ['Tembo’s Fruit Salad','kitchen','tembo'],
  ['Follow the Stripes','serengeti','simba'],
  ['Find the Freshwater Home','lugha','kobe'],
  ['Track What Predators Eat','serengeti','twiga'],
  ['Classify the Six-Legged Visitor','herufi','twiga'],
  ['Trace a Food Chain','namba','nuru'],
  ['Protect the Nesting Shore','lugha','tembo'],
];
const SAFARI_STORIES=safariSettings.map(([title,scene,guide],index)=>{
  const lesson=EpisodeContent.story(index+1);
  return {title,scene,guide,lesson,rounds:lesson.items.map(item=>[[item.context,item.text].filter(Boolean).join(' '),item.choices,0,item.explanation])};
});

function safariUnlocked(child, index) {
  return index === 0 || (index === 1 ? !!child.saladStory?.earned : !!child.safariField?.[index - 1]?.done);
}

function safariGo(index, replace = false) {
  HK.go(index === 0 ? 'saladStory' : 'safariEpisode', { index, replay: index === 0 && Store.active()?.saladStory?.stage === 'done' }, { replace });
}

HK.screens.safariSeries = el => {
  const child = Store.active();
  if (!child) return HK.boot();
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="series-back" aria-label="Back">${icon('back')}</button><h1>Safari with Nuru</h1></div>
    <div class="scroll"><div class="salad-pass safari-list">${SAFARI_STORIES.map(({ title, scene, guide, lesson }, index) => {
      const unlocked = safariUnlocked(child, index);
      const done = index === 0 ? child.saladStory?.earned : child.safariField?.[index]?.done;
      return `<button class="safari-episode-card scene-${scene}" data-story="${index}" ${unlocked ? '' : 'disabled'}>
        ${mascot(guide, 65)}<span><strong>${title}</strong><small>Episode ${index + 1} · ${esc(lesson.stage)} · ${done ? 'Completed' : unlocked ? 'Play episode' : 'Finish the previous episode'}</small></span>
        ${icon(unlocked ? 'chevR' : 'lock', 20)}</button>`;
    }).join('')}</div></div>`;
  $('#series-back', el).onclick = () => HK.back();
  $$('[data-story]', el).forEach(button => button.onclick = () => safariGo(Number(button.dataset.story)));
};

HK.screens.safariEpisode = (el, { index }) => {
  const child = Store.active();
  if (!child) return HK.boot();
  const episode = SAFARI_STORIES[index];
  if (!episode?.rounds.length || !safariUnlocked(child, index)) return HK.go('safariSeries', {}, { replace: true });
  const rounds=episode.rounds.map(([line,choices,,explanation])=>{
    const options=shuffle(choices.slice());
    return [line,options,options.indexOf(choices[0]),explanation];
  });
  const saved = child.safariField?.[index];
  let step = saved?.done ? 0 : (saved?.step || 0);
  let finished = false;
  const started = Date.now();
  const draw = () => {
    const round = rounds[step];
    el.innerHTML = `<div class="topbar"><button class="icon-btn" id="story-back" aria-label="Back">${icon('back')}</button><h1>Safari with Nuru</h1><button class="icon-btn" id="story-listen" aria-label="Listen again">${icon('volume')}</button></div>
      <div class="scroll salad-page"><div class="salad-stage scene-${episode.scene}"><div class="salad-hero-pair">${kidAvatar(child, 66)}${mascot(episode.guide, 105)}</div></div>
      <div class="salad-dialog"><h2>${episode.title}</h2><p>${round ? esc(round[0]) : 'Well done! You earned a passport stamp.'}</p></div>
      ${round ? `<p class="salad-hint">Challenge ${step + 1} of ${rounds.length}</p><div class="salad-options">${round[1].map((answer, i) => `<button class="salad-choice" data-answer="${i}">${safariArt(answer)}${esc(answer)}</button>`).join('')}</div><p id="story-feedback" class="salad-hint" aria-live="polite"></p>` :
        `<div class="salad-options">${index + 1 < SAFARI_STORIES.length ? '<button class="btn" id="story-next">Next episode</button>' : ''}<button class="btn ghost" id="story-passport">Passport</button></div>`}
      </div>`;
    const line = round ? round[0] : 'Well done! You earned a passport stamp.';
    $('#story-back', el).onclick = () => HK.back();
    $('#story-listen', el).onclick = () => speak(line);
    speak(line);
    if (!round) {
      confetti(el);
      const next = $('#story-next', el);
      if (next) next.onclick = () => safariGo(index + 1, true);
      $('#story-passport', el).onclick = () => HK.go('safariPassport', {}, { replace:true });
      return;
    }
    $$('[data-answer]', el).forEach(button => button.onclick = () => {
      if (!el.contains(button) || finished) return;
      if (Number(button.dataset.answer) !== round[2]) {
        $('#story-feedback', el).textContent = 'Look at the choices and try again.';
        speak('Look at the choices and try again.');
        return;
      }
      step++;
      finished = step === rounds.length;
      const current = Store.child(child.id);
      if (!current) return HK.back();
      const old = current.safariField?.[index];
      current.safariField = { ...current.safariField, [index]: { step, done: finished || !!old?.done } };
      if (finished && !old?.done) {
        current.stars = (current.stars || 0) + 3;
        current.coins = (current.coins || 0) + 10;
      }
      Store.saveChild(current);
      if (finished && !old?.done) markMission('lesson');
      Sfx.good();
      draw();
      if (round[3]) toast(round[3]);
    });
  };
  draw();
  return () => { stopSaladVoice(); HK.addLearnTime(child, Math.round((Date.now() - started) / 1000)); };
};
