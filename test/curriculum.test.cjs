const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const source = path.join(__dirname, '../app/src/main/assets/www/js');
const state = require(path.join(source, 'curriculum-state.js'));
const evaluate = (file, context) => vm.runInContext(fs.readFileSync(path.join(source,file),'utf8'), context);

test('six domains have stable question IDs, valid answer choices and linked skill objectives', () => {
  const context = vm.createContext({});
  evaluate('curriculum-content.js', context);
  const content = vm.runInContext('CurriculumContent',context);
  assert.equal(content.domains.length,6);
  assert.equal(Object.keys(content.skills).length,24);
  const ids = new Set();
  for (const [domain,,skills] of content.domains) {
    const total = skills.reduce((n,[skill]) => n + content.pools[domain+'.'+skill].length,0);
    assert.ok(total>=200 && total<=500,`${domain}: ${total}`);
    skills.forEach(([key],previous)=>{
      const id = domain+'.'+key;
      assert.equal(content.skills[id].needs,previous ? domain+'.'+skills[previous-1][0] : null);
      const distinct = new Set();
      for (const q of content.pools[id]) {
        assert.ok(!ids.has(q.id),q.id);
        assert.ok(!distinct.has(q.text+'\n'+q.context),q.id);
        assert.ok(q.choices.includes(q.answer));
        assert.equal(new Set(q.choices).size,q.choices.length);
        assert.ok(q.choices.length>=3 && q.choices.length<=4);
        distinct.add(q.text+'\n'+q.context);
        ids.add(q.id);
      }
    });
  }
  assert.equal(ids.size,1460);
});

test('rejects repeat evidence and retains recent question history when merging devices', () => {
  const id = 'math.number';
  const evidence = Object.fromEntries(Array.from({length:8},(_,i)=>[`${id}:${i+1}`,i+1]));
  const seen = Object.fromEntries(Array.from({length:42},(_,i)=>[`${id}:${i+1}`,i+1]));
  const a = {skills:{[id]:{evidence,wins:{[id+':1']:1},seen}},episodes:{'racing:1':1}};
  const b = {skills:{[id]:{evidence,wins:{[id+':8']:8,'science.living:1':10,[id+':9']:11}}},episodes:{'runner:1':2}};
  const merged = state.merge(a,b);
  assert.equal(Object.keys(merged.skills[id].evidence).length,8);
  assert.equal(Object.keys(merged.skills[id].wins).length,2);
  assert.equal(Object.keys(merged.skills[id].seen).length,state.recentLimit);
  assert.ok(merged.skills[id].seen[id+':42']);
  assert.ok(!merged.skills[id].seen[id+':12']);
  assert.deepEqual(state.merge(merged,a),merged);
  assert.deepEqual(state.merge(b,a),merged);
  assert.equal(state.mastered(state.merge(a,a).skills[id]),false);
  assert.equal(state.mastered(merged.skills[id]),true);
});
