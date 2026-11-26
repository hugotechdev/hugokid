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

const SAFARI_STORIES = [
  { title: 'Tembo’s Fruit Salad', scene: 'kitchen', guide: 'tembo' },
  { title: 'Follow the Footprints', scene: 'serengeti', guide: 'simba', rounds: [
    ['Simba is looking for a friend with stripes. Who should we find?', ['Zebra', 'Elephant', 'Giraffe'], 0],
    ['We find two footprints, then two more. How many footprints are there?', ['Three', 'Four', 'Five'], 1],
    ['The zebra is near the watering hole. What should we do?', ['Shout loudly', 'Throw stones', 'Watch quietly'], 2],
  ] },
  { title: 'Kobe’s Shape Bridge', scene: 'maumbo', guide: 'kobe', rounds: [
    ['Kobe needs a piece with three sides. Which shape should we pick?', ['Circle', 'Triangle', 'Square'], 1],
    ['Pick the shape with four equal sides for another part of the bridge.', ['Square', 'Triangle', 'Circle'], 0],
    ['Two pieces are down and three are ready. How many pieces do we have altogether?', ['Four', 'Six', 'Five'], 2],
  ] },
  { title: 'Twiga’s Letter Trail', scene: 'herufi', guide: 'twiga', rounds: [
    ['The first clue is a mango. Which letter begins mango?', ['B', 'M', 'S'], 1],
    ['The next clue is a banana. Which letter begins banana?', ['B', 'T', 'P'], 0],
    ['Find the word that starts with the same sound as tree.', ['Mango', 'Cloud', 'Train'], 2],
  ] },
  { title: 'The Coast Clean-Up', scene: 'lugha', guide: 'tembo', rounds: [
    ['Tembo finds a plastic bottle on the beach. Where should it go?', ['In the ocean', 'In a bin', 'Under the sand'], 1],
    ['We pick up three bottles and one wrapper. How many pieces did we collect?', ['Four', 'Three', 'Five'], 0],
    ['The beach is clean. What should we take home when we leave?', ['The shells', 'The crabs', 'Our rubbish'], 2],
  ] },
  { title: 'Flags on Kilimanjaro', scene: 'kilimanjaro', guide: 'nuru', rounds: [
    ['Only two flags are up. How many more make four flags?', ['One', 'Two', 'Three'], 1],
    ['The flags go red, blue, red, blue. Which colour comes next?', ['Red', 'Blue', 'Green'], 0],
    ['You reached the last flag with your friends. What can you say to them?', ['Go away', 'I did it all alone', 'Thank you for helping'], 2],
  ] },
];

function safariUnlocked(child, index) {
  return index === 0 || (index === 1 ? !!child.saladStory?.earned : !!child.safariSeries?.[index - 1]?.done);
}

function safariGo(index, replace = false) {
  HK.go(index === 0 ? 'saladStory' : 'safariEpisode', { index, replay: index === 0 && Store.active()?.saladStory?.stage === 'done' }, { replace });
}

HK.screens.safariSeries = el => {
  const child = Store.active();
  if (!child) return HK.boot();
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="series-back" aria-label="Back">${icon('back')}</button><h1>Safari with Nuru</h1></div>
    <div class="scroll"><div class="salad-pass safari-list">${SAFARI_STORIES.map(({ title, scene, guide }, index) => {
      const unlocked = safariUnlocked(child, index);
      const done = index === 0 ? child.saladStory?.earned : child.safariSeries?.[index]?.done;
      return `<button class="safari-episode-card scene-${scene}" data-story="${index}" ${unlocked ? '' : 'disabled'}>
        ${mascot(guide, 65)}<span><strong>${title}</strong><small>Episode ${index + 1} · ${done ? 'Completed' : unlocked ? 'Play episode' : 'Finish the previous episode'}</small></span>
        ${icon(unlocked ? 'chevR' : 'lock', 20)}</button>`;
    }).join('')}</div></div>`;
  $('#series-back', el).onclick = () => HK.back();
  $$('[data-story]', el).forEach(button => button.onclick = () => safariGo(Number(button.dataset.story)));
};

HK.screens.safariEpisode = (el, { index }) => {
  const child = Store.active();
  if (!child) return HK.boot();
  const episode = SAFARI_STORIES[index];
  if (!episode?.rounds || !safariUnlocked(child, index)) return HK.go('safariSeries', {}, { replace: true });
  const saved = child.safariSeries?.[index];
  let step = saved?.done ? 0 : (saved?.step || 0);
  let finished = false;
  const started = Date.now();
  const draw = () => {
    const round = episode.rounds[step];
    el.innerHTML = `<div class="topbar"><button class="icon-btn" id="story-back" aria-label="Back">${icon('back')}</button><h1>Safari with Nuru</h1><button class="icon-btn" id="story-listen" aria-label="Listen again">${icon('volume')}</button></div>
      <div class="scroll salad-page"><div class="salad-stage scene-${episode.scene}"><div class="salad-hero-pair">${kidAvatar(child, 66)}${mascot(episode.guide, 105)}</div></div>
      <div class="salad-dialog"><h2>${episode.title}</h2><p>${round ? round[0] : 'Well done! You earned a passport stamp.'}</p></div>
      ${round ? `<p class="salad-hint">Challenge ${step + 1} of ${episode.rounds.length}</p><div class="salad-options">${round[1].map((answer, i) => `<button class="salad-choice" data-answer="${i}">${safariArt(answer)}${answer}</button>`).join('')}</div><p id="story-feedback" class="salad-hint" aria-live="polite"></p>` :
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
      finished = step === episode.rounds.length;
      const current = Store.child(child.id);
      if (!current) return HK.back();
      const old = current.safariSeries?.[index];
      current.safariSeries = { ...current.safariSeries, [index]: { step, done: finished || !!old?.done } };
      if (finished && !old?.done) {
        current.stars = (current.stars || 0) + 3;
        current.coins = (current.coins || 0) + 10;
      }
      Store.saveChild(current);
      if (finished && !old?.done) markMission('lesson');
      Sfx.good();
      draw();
    });
  };
  draw();
  return () => { stopSaladVoice(); HK.addLearnTime(child, Math.round((Date.now() - started) / 1000)); };
};
