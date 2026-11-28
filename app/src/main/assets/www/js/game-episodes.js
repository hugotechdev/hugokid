/* Episode selection and short challenges for recovering an in-game balance. */
const GAME_EPISODES = 24;

HK.screens.gameEpisodes = (el, { id }) => {
  const child = Store.active();
  if (!child) return HK.boot();
  const game = gamesFor(child).find(g => g.id === id && id !== 'racing');
  if (!game) return HK.back();
  const progress = GK.prog(child, id);
  const cap = GAME_EPISODES;
  const groups=new Map();
  for(let level=1;level<=cap;level++) {
    const episode=EpisodeContent.game(id,level);
    if (!groups.has(episode.stage)) groups.set(episode.stage,[]);
    groups.get(episode.stage).push(episode);
  }
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="episode-back" aria-label="Back">${icon('back')}</button><h1>${esc(T(game.name))}</h1></div>
    <div class="scroll">
      ${id === 'jungle' ? `<h2 class="section-title">Choose your runner</h2>${jungleRunnerOptions(jungleRunner(child))}` : sceneBanner(GAME_SCENES[id], 'simba')}
      ${EpisodePlay.map(id,cap)}
      ${[...groups].map(([stage,episodes])=>`<h2 class="section-title">${esc(stage)}</h2><div class="levels episode-grid">${episodes.map(episode=>{
          const n=episode.level;
          const locked = n > progress.level;
          const stars = progress.best[n] || 0;
          const objectiveName = episode.topic;
          return `<button class="level ${locked ? 'locked' : ''}" data-episode="${n}" ${locked ? 'disabled' : ''} style="--c:#d7efdf;--cd:#a0c6af" title="${esc(objectiveName)}" aria-label="Episode ${n} · ${esc(objectiveName)}${locked ? ', locked' : ', ' + stars + ' stars'}">${locked ? icon('lock', 20) : n}<span class="lv-stars">${stars ? starsHTML(stars, 3, 15) : ''}</span></button>`;
        }).join('')}</div>`).join('')}
    </div>`;
  $('#episode-back', el).onclick = () => HK.back();
  if (id === 'jungle') bindJungleRunners(el);
  $$('[data-episode]', el).forEach(button => button.onclick = () => {
    if (game.kind === 'fun' && HK.gameLeft(Store.active()) <= 0) return HK.go('timeUp');
    HK.go('g_' + id, { level: Number(button.dataset.episode) });
  });
};

function tokenChallenge(el, reward, grant, options = {}) {
  if ($('.token-challenge', el)) return;
  const mode = kidMode(Store.active());
  const young = ['toddler','beginner'].includes(mode);
  const first = 1 + rnd(young ? 3 : 9);
  const second = 1 + rnd(young ? 2 : 8);
  const answer = young ? first : first + second;
  const question = young ? 'How many stars do you see?' : 'What is ' + first + ' plus ' + second + '?';
  const choice = modal(el, {
    iconName: 'nuru',
    title: options.title || 'Not enough money',
    text: options.message || `Answer a quick question to earn ${reward} play tokens and continue.`,
    html: `<p>${question}</p>${young ? `<div aria-label="Count the stars">${starsHTML(first, first, 23)}</div>` : ''}<p class="token-feedback" aria-live="polite"></p>`,
    buttons: [
      ...shuffle([answer, answer + 1, answer + 2]).map(n => ({
        label: String(n), keepOpen: true, onClick: layer => {
          if (!layer.isConnected) return;
          if (n !== answer) {
            $('.token-feedback', layer).textContent = 'Try again. You can do it!';
            speak('Try again. You can do it.');
            return;
          }
          layer.remove(); Sfx.good();
          grant(reward);
          toast(`You earned ${reward} play tokens!`);
          speak(`Well done! You earned ${reward} play tokens.`);
        },
      })),
      { label: 'Not now', cls: 'ghost' },
    ],
  });
  choice.classList.add('token-challenge');
  speak(question);
}
