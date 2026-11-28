/* Present the same episode objectives through each game's native controls or a learning stop. */
const EpisodePlay = {
  map(id,count) {
    const items=Array.from({length:count},(_,index)=>{
      const e=EpisodeContent.game(id,index+1);
      return `<li><strong>${esc(e.topic)}</strong><small>${esc(e.stage)} · Difficulty ${e.difficulty}/6 · ${e.items.length} activities</small><span>${esc(e.objective)}</span></li>`;
    });
    return `<details class="card episode-map"><summary>Episode curriculum</summary><ol>${items.join('')}</ol></details>`;
  },
  question(item, pictures = false) {
    if (item.format==='writing') return {text:item.text,say:item.text,write:item.context,opts:[]};
    const line = item.context ? item.context + ' ' + item.text : item.text;
    const choices = shuffle(item.choices.slice());
    return {
      text:line, say:line, explanation:item.explanation, cols:pictures ? 3 : 1,
      opts:choices.map(label=>({label,ok:label===item.answer,...(pictures ? {html:pic(label,68)+'<span>'+esc(label)+'</span>'} : {})})),
    };
  },
  draft(parent, finish) {
    const form = $('[data-episode-draft]',parent);
    form.onsubmit = event => {
      event.preventDefault();
      const input = $('textarea',form);
      if (input.value.trim().split(/\s+/).length < 4 || !/\p{L}/u.test(input.value)) {
        $('[role=status]',form).textContent='Write at least four words in your own sentence.';
        return;
      }
      finish();
    };
  },
  draftForm(text) {
    return `<form class="episode-draft" data-episode-draft><label>My draft<textarea maxlength="500" rows="3" required></textarea></label>
      <p>${esc(text)}</p><p role="status" aria-live="polite"></p><button class="btn block" type="submit">Continue with my draft</button></form>`;
  },
  ask(kit, item, activity, done) {
    const root = kit.el;
    const panel = document.createElement('section');
    panel.className='overlay episode-stop';
    panel.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-labelledby="episode-stop-title">
      <p class="episode-kicker">${esc(kit.episode.mode)} · ${activity} of ${kit.episode.items.length}</p>
      <h2 id="episode-stop-title">${esc(kit.episode.topic)}</h2>
      <p>${esc(item.context || '')}</p><p><strong>${esc(item.text)}</strong></p>
      <button class="btn small ghost" data-episode-listen>Listen</button>
      ${item.format==='writing' ? this.draftForm('Check that the draft fits the prompt. It stays in this activity.') :
        `<div class="skill-choices">${shuffle(item.choices.slice()).map((label,index)=>`<button class="btn ghost" data-episode-choice="${index}">${esc(label)}</button>`).join('')}</div><p data-episode-feedback aria-live="polite"></p>`}
      <button class="btn small ghost" data-episode-exit>Leave episode</button></div>`;
    root.appendChild(panel);
    kit.body.inert=true;
    const leave=()=>{ panel.remove(); kit.body.inert=false; HK.leave(); };
    panel.onGameBack=leave;
    $('[data-episode-exit]',panel).onclick=leave;
    const spoken=[item.context,item.text].filter(Boolean).join(' ');
    $('[data-episode-listen]',panel).onclick=()=>speak(spoken);
    let answered=false, independent=true;
    const advance=()=>{
      if (answered) return;
      answered=true;
      panel.remove();
      kit.body.inert=false;
      done(independent);
    };
    if (item.format==='writing') this.draft(panel,advance);
    else $$('[data-episode-choice]',panel).forEach(btn=>btn.onclick=()=>{
      if (btn.textContent.trim()===item.answer) {
        if (item.explanation) { speak('Correct. '+item.explanation); toast(item.explanation); }
        advance();
        return;
      }
      independent=false;
      btn.disabled=true;
      $('[data-episode-feedback]',panel).textContent='Look at the clues and try another answer.';
    });
    $('[data-episode-listen]',panel).focus();
  },
  quiz(kit, render) {
    GK.quiz(kit,{
      total:kit.episode.items.length, render, fixedTotal:true,
      make:i=>this.question(kit.episode.items[i],kit.gm.id==='rescue' && kit.episode.level<=4 && i===0),
    });
  },
};
