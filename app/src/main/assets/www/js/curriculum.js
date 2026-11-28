/* Learning paths and episode checkpoints. Existing play rewards remain independent. */
const Curriculum = (() => {
  const {skills,pools,domains} = CurriculumContent;
  const games = {
    racing:'math', runner:'knowledge', penalty:'math', pilot:'science', village:'knowledge',
    kitchen:'science', bubbles:'math', jungle:'reading', rescue:'science', farm:'science',
    bridge:'math', ocean:'science', balloons:'math', letters:'english', memory:'reading',
    robot:'writing', market:'math', shapes:'math', speak:'english', faith:'knowledge',
  };
  const syncs = new Map();
  const latestSync = new Map();
  const state = child => child?.curriculum || {skills:{},episodes:{}};
  const record = (child,id) => state(child).skills?.[id];
  const mastered = (child,id) => CurriculumState.mastered(record(child,id));
  const available = (child,skill) => !skill.needs || mastered(child,skill.needs);
  const firstMissing = (child,skill) => {
    while (skill.needs && !mastered(child,skill.needs)) skill = skills[skill.needs];
    return skill;
  };
  const status = (child,skill) => mastered(child,skill.id) ? 'Mastered'
    : !available(child,skill) ? 'Locked'
    : record(child,skill.id)?.practised ? 'Practising' : 'Ready to learn';
  function save(child, update) {
    const current = Store.child(child.id);
    if (!current) return;
    current.curriculum = CurriculumState.merge(current.curriculum,update);
    Store.saveChild(current);
  }
  function sync(child, background = false) {
    if (!child?.serverId || !Net.online() || !['parent','child'].includes(Net.role()) || Net.accessScreen()) return Promise.resolve();
    const token = Net.token();
    const key = token + ':' + child.serverId;
    if (background && (syncs.has(key) || Date.now() - (latestSync.get(key) || 0) < 60000)) return Promise.resolve();
    const previous = syncs.get(key) || Promise.resolve();
    const current = previous.catch(()=>{}).then(async () => {
      if (Net.token() !== token || Net.accessScreen() || !Store.child(child.id)) return;
      const value = state(Store.child(child.id));
      const remote = await Net.put('/api/children/'+child.serverId+'/curriculum',{progress:value});
      if (Net.token() === token && !Net.accessScreen()) {
        latestSync.set(key,Date.now());
        save(child,remote);
      }
    });
    syncs.set(key,current);
    return current.finally(()=>{ if (syncs.get(key) === current) syncs.delete(key); });
  }
  function syncActive() { sync(Store.active()).catch(()=>{}); }
  function skillFor(game,level) {
    const [, , entries] = domains.find(row=>row[0]===games[game]);
    const span = game==='racing' ? 5 : 6;
    const stage = Math.min(entries.length-1,Math.floor((level-1)/span));
    return skills[games[game]+'.'+entries[stage][0]];
  }
  function episode(game,level) {
    const skill = skillFor(game,level);
    const span = game==='racing' ? 5 : 6;
    const step = (level-1)%span;
    return {skill,step,count:[3,4,4,5,5,6][step],title:skill.title + ' · ' + ['Discover','Recognise','Choose','Apply','Check','Challenge'][step]};
  }
  function nextRoute(name,params) {
    const id = name==='racePlay' ? 'racing' : name.startsWith('g_') ? name.slice(2) : '';
    if (!Object.prototype.hasOwnProperty.call(games,id)) return null;
    const child = Store.active();
    if (!child || Net.accessScreen() || HK.startingAccess) return null;
    const progress = id==='racing' ? raceData(child).unlocked : GK.prog(child,id).level;
    const max = id==='racing' ? RACE_EPISODES : GAME_EPISODES;
    const level = Math.max(1,Math.min(max,progress,Number.isInteger(params.level) ? params.level : progress));
    const skill = skillFor(id,level);
    if (!available(child,skill)) return {name:'skillPractice',params:{id: firstMissing(child,skill).id, game:id, level}};
    if (state(child).episodes?.[id+':'+level]) return {name,params:{...params,level}};
    return {name:'skillPractice',params:{id:skill.id,game:id,level}};
  }
  function choose(child,skill,count,step = 0) {
    const saved = record(child,skill.id);
    const recent = new Set(Object.keys(saved?.seen || {}));
    const level = Math.max(0,MODE_ORDER.indexOf(kidMode(child)));
    const target = Math.min(3,Math.floor((level + step + (saved?.practised ? 1 : 0))/3));
    const pool = pools[skill.id];
    const order = shuffle(pool.filter(q=>!recent.has(q.id)));
    order.sort((a,b)=>Math.abs(a.difficulty-target)-Math.abs(b.difficulty-target));
    const selected = order.slice(0,count);
    if (selected.length) {
      const now=Math.max(Date.now(),...Object.values(saved?.seen || {}).map(time=>time+1));
      save(child,{skills:{[skill.id]:{seen:Object.fromEntries(selected.map((q,index)=>[q.id,now+index]))}}});
    }
    return selected;
  }
  function finish(child,skill,correct,total) {
    const time = Date.now();
    const passed = correct.length >= Math.ceil(total*.8);
    const previous = record(Store.child(child.id),skill.id)?.evidence || {};
    const fresh = correct.filter(id=>!previous[id]);
    const evidence = Object.fromEntries(correct.map(id=>[id,time]));
    const wins = passed && fresh.length >= 3 ? {[fresh[0]]:time} : {};
    save(child,{skills:{[skill.id]:{evidence,wins,practised:time}}});
    sync(child).catch(()=>{});
    return passed;
  }
  function legacy(child,skill) {
    if (child && skills[skill]) save(child,{skills:{[skill]:{practised:Date.now()}}});
  }
  function list(child) {
    return domains.map(([domain,title,entries])=>`<section class="card curriculum-domain"><h2>${title}</h2>
      ${entries.map(([key],index)=>{
        const skill = skills[domain+'.'+key];
        const label = status(child,skill);
        return `<button class="item" data-skill="${skill.id}" ${available(child,skill)?'':'disabled'}><span class="i-ic" style="background:var(--navy)">${icon(label==='Locked'?'lock':'book',20)}</span><span class="grow"><strong>${index+1}. ${skill.title}</strong><span class="i-sub">${label}${skill.needs && !available(child,skill)?' · First master '+skills[skill.needs].title:''}</span></span></button>`;
      }).join('')}</section>`).join('');
  }
  function summary(child) {
    return domains.map(([domain,title,entries])=>{
      const skillEntries = entries.map(([key])=>skills[domain+'.'+key]);
      return `<p><b>${title}</b> · ${skillEntries.filter(skill=>mastered(child,skill.id)).length}/${entries.length} mastered<br>${skillEntries.map(skill=>esc(skill.title)+' · '+status(child,skill)).join('<br>')}</p>`;
    }).join('');
  }
  window.addEventListener('online',syncActive);
  return {skills,pools,games,available,mastered,episode,nextRoute,choose,finish,list,summary,sync,syncActive,legacy,save,state};
})();

HK.screens.curriculum = el => {
  const child = Store.active();
  if (!child) return HK.boot();
  const render = () => {
    el.innerHTML = `<div class="topbar"><button class="icon-btn" id="skill-back" aria-label="Back">${icon('back')}</button><h1>Learning paths</h1></div>
      <div class="scroll curriculum">${Curriculum.list(Store.child(child.id))}</div>`;
    $('#skill-back',el).onclick=()=>HK.back();
    $$('[data-skill]:not([disabled])',el).forEach(btn=>btn.onclick=()=>HK.go('skillPractice',{id:btn.dataset.skill}));
  };
  render();
  Curriculum.sync(child).then(()=>{ if(el.isConnected) render(); }).catch(()=>{});
};

HK.screens.skillPractice = (el,p) => {
  const child = Store.active();
  const skill = Curriculum.skills[p.id];
  if (!child || !skill || !Curriculum.available(child,skill)) return HK.go('curriculum',{}, {replace:true});
  const target = p.game && Curriculum.games[p.game] ? Curriculum.episode(p.game,p.level) : null;
  const forGame = target?.skill.id === skill.id;
  const planned = forGame ? target.count : 5;
  const size = child.needs?.includes('attention') ? Math.min(4,planned) : planned;
  let questions, index, correct, touched, assisted;
  const started=Date.now();
  const layout=(body,title=skill.title)=>{
    el.innerHTML=`<div class="topbar"><button class="icon-btn" id="practice-back" aria-label="Back">${icon('back')}</button><h1>${esc(title)}</h1></div><div class="scroll curriculum"><section class="card">${body}</section></div>`;
    $('#practice-back',el).onclick=()=>HK.back();
  };
  const start=()=>{
    questions=Curriculum.choose(Store.child(child.id),skill,size,forGame?target.step:0);
    index=0; correct=[]; touched=false; assisted=false;
    if (questions.length !== size) {
      layout('<p>There are no fresh questions available for this skill yet.</p>');
      return;
    }
    draw();
  };
  function draw() {
    const q=questions[index];
    if (!q) {
      const passed=Curriculum.finish(child,skill,correct,questions.length);
      const ready=Curriculum.mastered(Store.child(child.id),skill.id);
      const summary=`<h2>${ready?'Skill mastered':passed?'Practice round passed':'Keep practising'}</h2><p>${correct.length} of ${questions.length} answered independently on the first try.</p>`;
      if (forGame && passed) {
        Curriculum.save(child,{episodes:{[p.game+':'+p.level]:Date.now()}});
        Curriculum.sync(child).catch(()=>{});
        layout(summary+'<button class="btn block" id="play-episode">Play episode</button>');
        $('#play-episode',el).onclick=()=>HK.go(p.game==='racing'?'racePlay':'g_'+p.game,{level:p.level},{replace:true});
      } else {
        const continueEpisode=!!target && ready;
        layout(summary+(continueEpisode?'<button class="btn block" id="practice-next">Continue to episode</button>':'')
          +'<button class="btn block ghost" id="practice-retry">Start another practice round</button><button class="btn block ghost" id="practice-done">Done</button>');
        $('#practice-retry',el).onclick=intro;
        $('#practice-done',el).onclick=()=>HK.back();
        if (continueEpisode) $('#practice-next',el).onclick=()=>HK.go(p.game==='racing'?'racePlay':'g_'+p.game,{level:p.level},{replace:true});
      }
      return;
    }
    const choices=shuffle(q.choices.slice());
    layout(`<p class="chip-tag">Question ${index+1} of ${questions.length}</p>${q.context?'<p class="curriculum-context">'+esc(q.context)+'</p>':''}
      <h2>${esc(q.text)}</h2><button id="question-listen" class="btn small ghost">${icon('volume',18)} Listen</button>
      <div class="skill-choices">${choices.map((choice,i)=>`<button class="btn ghost" data-choice="${i}">${esc(choice)}</button>`).join('')}</div>
      <button class="btn small ghost" id="practice-hint">Show a hint</button><p id="practice-feedback" aria-live="polite"></p>`);
    $('#question-listen',el).onclick=()=>speak([q.context,q.text,...choices].filter(Boolean).join(' '),'en-TZ');
    $('#practice-hint',el).onclick=()=>{
      assisted=true;
      $('#practice-feedback',el).textContent=skill.guide;
    };
    $$('[data-choice]',el).forEach(button=>button.onclick=()=>{
      if (button.disabled) return;
      if (choices[+button.dataset.choice]!==q.answer) {
        touched=true;
        button.disabled=true;
        $('#practice-feedback',el).textContent='Try again. '+skill.guide;
        return;
      }
      if (!touched && !assisted) correct.push(q.id);
      index++; touched=false; assisted=false;
      draw();
    });
  }
  function intro() {
    const title=forGame?'Episode '+p.level+' · '+EpisodeContent.game(p.game,p.level).topic:skill.title;
    const guide = target && !forGame ? '<p>Master this skill before continuing to '+esc(target.skill.title)+'.</p>' : '';
    layout(guide+'<p>'+esc(skill.guide)+'</p><p class="curriculum-context"><b>Worked example</b><br>'+esc(skill.example)+'</p><button class="btn small ghost" id="example-listen">'+icon('volume',18)+' Listen to example</button><p>'+size+' questions · '+Math.ceil(size*.8)+' correct without hints to pass.</p><button class="btn block" id="practice-start">Start practice</button>',title);
    $('#practice-start',el).onclick=start;
    $('#example-listen',el).onclick=()=>speak(skill.guide+' '+skill.example,'en-TZ');
  }
  intro();
  return ()=>HK.addLearnTime(child,Math.round((Date.now()-started)/1000));
};
