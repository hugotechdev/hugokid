/* Objectives are completed directly at each adventure's field station. */
const adventureScenes={rescue:8,farm:4,bridge:6,ocean:7};
const adventureRules={
  rescue:'Read the rescue case and choose the evidence that supports your decision.',
  farm:'Read the farm notebook, then choose what to observe or test.',
  bridge:'Read the design plan and make a safe crossing decision.',
  ocean:'Inspect the coast expedition notes and use the clues to make decisions.',
};
for (const [id,rule] of Object.entries(adventureRules)) {
  TUT[id]={rules:rule,steps:()=>[{t:rule,g:'tap',ic:'flag'},{t:'Use the speaker to hear the challenge.',g:'tap',ic:'volume'}]};
  HK.screens['g_'+id]=(el,p)=>{
    const kit=GK.frame(el,id,{level:p.level});
    EpisodePlay.quiz(kit,()=>`<div class="quest-scene"><img src="img/life/quest-${adventureScenes[id]}.webp" width="414" height="414" alt=""></div>`);
    return ()=>kit.cleanup();
  };
}
