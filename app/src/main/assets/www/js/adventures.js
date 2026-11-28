const rescueClues = [
  ['Tembo', 'Which animal has a long trunk?'],
  ['Simba', 'Which animal has a mane and roars?'],
  ['Twiga', 'Which animal has a very long neck and a spotted coat?'],
  ['Samaki', 'Which fish has dark stripes and orange fins?', 'fish'],
  ['Kuku', 'Which bird lays eggs in a henhouse?', 'bird'],
  ['Paka', 'Which animal meows?'],
  ['Mbwa', 'Which animal barks?'],
  ['Ndege', 'Which bird is small and has a yellow belly?', 'bird'],
];
const questRules = {
  rescue: 'Read or listen to the clue, then tap the matching picture.',
  farm: 'Choose your tools, care for the crop, then count the harvest.',
  bridge: 'Choose the right pieces to finish the crossing.',
  ocean: 'Follow the compass and sail to the next landmark.',
};
function adventureRound(id, round, level, group) {
  const count = 1 + rnd(3 + Math.min(level, 9) + group);
  const sequence = (text, labels, correct, scene) => ({
    text, scene, opts: shuffle(labels.map(label => ({ label, ok: label === correct }))),
  });
  const numbers = (text, answer, scene) => ({ text, scene, opts: numOpts(answer, 3, 3) });
  switch (id) {
    case 'rescue': {
      const groups = Object.values(ANIMAL_GROUPS);
      const animals = level <= 4 ? rescueClues.map(([id]) => id) : groups[(level - 5) % groups.length].animals.map(([id]) => id);
      const target = animals[((level - 1) * 6 + round) % animals.length];
      const [, clue, category] = level <= 4 ? rescueClues.find(([id]) => id === target) : [];
      const birds = ANIMAL_BIRDS.includes(target);
      const fish = ANIMAL_FISH.includes(target);
      const pool = category === 'bird' || (!clue && birds) ? ANIMAL_BIRDS
        : category === 'fish' || (!clue && fish) ? ANIMAL_FISH : animals;
      const name = ANIMAL_NAMES.get(target).toLowerCase();
      return { text: clue || 'Find the ' + name + '.', scene: 8, opts: animalChoices(target, pool) };
    }
    case 'farm':
      if (round % 3 === 0) return sequence('What should we plant in the soil?', ['Seeds', 'Stones', 'Leaves'], 'Seeds', 3);
      if (round % 3 === 1) return sequence('The soil is dry. What does this crop need?', ['Water', 'Salt', 'Sand'], 'Water', 4);
      return numbers('Pick ' + count + ' ears of maize, then one more. How many?', count + 1, 5);
    case 'bridge': {
      const missing = 1 + rnd(group + 3);
      return numbers('The bridge needs ' + (count + missing) + ' planks. You have ' + count + '. How many more?', missing, 6);
    }
    case 'ocean': {
      const bearings = ['North', 'East', 'South', 'West'];
      const turn = (level + round - 1) % 4;
      const arrows = ['↑','→','↓','←'];
      return sequence('North is up. Sail ' + arrows[turn] + ' to the ' + ['lighthouse','harbour','reef','island'][turn] + '.', bearings, bearings[turn], 7);
    }
  }
}
for (const [id, rule] of Object.entries(questRules)) {
  TUT[id] = { rules: rule, steps: () => [
    { t: rule, g: 'tap', ic: 'flag' },
    { t: 'Tap the speaker to hear the question again.', g: 'tap', ic: 'volume' },
  ] };
  HK.screens['g_' + id] = (el, p) => {
    const kit = GK.frame(el, id, { level: p.level });
    GK.quiz(kit, { total: 6, cols: id === 'ocean' ? 2 : 3, explainAnswer: id === 'rescue',
      make: round => {
        const q = adventureRound(id, round, kit.level, kit.g);
        q.say = q.text;
        return q;
      },
      render: q => `<div class="quest-scene"><img src="img/life/quest-${q.scene}.webp" width="414" height="414" alt="${id === 'rescue' ? 'Paw prints on a dirt path' : ''}"></div>`,
    });
    return () => kit.cleanup();
  };
}
