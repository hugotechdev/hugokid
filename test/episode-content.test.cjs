const assert=require('node:assert/strict');
const test=require('node:test');
const content=require('../app/src/main/assets/www/js/episode-content');

const stages={
  Wildlife:['Recognition','Habitats','Diets','Classification','Ecosystems','Conservation'],
  Mathematics:['Counting','Addition','Subtraction','Multiplication','Division','Fractions','Word Problems'],
  English:['Letters','Sounds','Words','Sentences','Reading','Comprehension','Creative Writing'],
  Science:['Observation','Living Things','Human Body','Energy','Environment','Experiments'],
};
test('all 20 campaigns have independent, ordered episode content with no duplicate task in a campaign',()=>{
  const itemIds=new Set();
  let episodes=0;
  assert.equal(new Set(content.games).size,20);
  for(const id of content.games) {
    const total=id==='racing'?18:24;
    const map=Array.from({length:total},(_,i)=>content.game(id,i+1));
    const inGame=new Set();
    assert.equal(new Set(map.map(e=>e.topic)).size,total,id);
    const sequence=[...new Set(map.map(e=>e.stage))];
    if(stages[map[0].domain]) assert.deepEqual(sequence,stages[map[0].domain],id);
    for(const e of map){
      episodes++;
      assert.ok(e.objective && e.focus && e.mode);
      assert.ok(e.difficulty>=1 && e.difficulty<=6);
      assert.equal(e.items.length,id==='racing'?5:id==='jungle'?4:3);
      for(const q of e.items){
        assert.ok(!itemIds.has(q.id),q.id);
        itemIds.add(q.id);
        const signature=q.text+'\n'+q.context;
        assert.ok(!inGame.has(signature),q.id);
        inGame.add(signature);
        if(q.format==='writing') assert.equal(e.stage,'Creative Writing');
        else {
          assert.equal(new Set(q.choices).size,3,q.id);
          assert.equal(q.choices.filter(o=>o===q.answer).length,1,q.id);
        }
      }
    }
  }
  assert.equal(episodes,474);
  assert.equal(itemIds.size,1482);
});
test('Safari preserves a practical first episode and completes the animal sequence',()=>{
  const map=Array.from({length:content.safariCount},(_,i)=>content.story(i+1));
  assert.equal(map[0].practical.length,5);
  assert.deepEqual(map.slice(1).map(s=>s.stage),stages.Wildlife);
  assert.equal(map.slice(1).reduce((n,e)=>n+e.items.length,0),18);
});
