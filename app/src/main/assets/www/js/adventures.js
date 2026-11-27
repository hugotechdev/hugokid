const rescueClues = [
  ['Tembo', 'Find the animal with a long trunk.'], ['Simba', 'Find the animal with a mane.'],
  ['Twiga', 'Find the animal with a very long neck.'], ['Samaki', 'Which animal has fins?'],
  ['Kuku', 'Which animal lays eggs in the henhouse?'], ['Paka', 'Which animal meows?'],
  ['Mbwa', 'Which animal barks?'], ['Ndege', 'Find the small bird that sings in the tree.'],
];
const questRules = {
  jungle: 'Run with Nuru to each fork. Tap the path marked with the correct number.',
  rescue: 'Listen to the clue and find the missing animal.',
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
    case 'jungle': {
      const landmarks = ['the forest fork', 'the river crossing', 'the cave entrance'];
      const next = round % 3;
      return numbers('At ' + landmarks[next] + ', take path ' + count + ' + ' + (next + 1) + '.', count + next + 1, next);
    }
    case 'rescue': {
      const groups = Object.values(ANIMAL_GROUPS);
      const animals = level <= 4 ? rescueClues.map(([id]) => id) : groups[(level - 5) % groups.length].animals.map(([id]) => id);
      const name = animals[((level - 1) * 6 + round) % animals.length];
      const clue = level <= 4 && rescueClues.find(([id]) => id === name);
      const others = shuffle(animals.filter(id => id !== name)).slice(0, 2);
      return { text: clue ? clue[1] : 'Help Nuru find the ' + ANIMAL_NAMES.get(name).toLowerCase() + '.', scene: 8,
        opts: shuffle([name, ...others]).map(id => ({ label: ANIMAL_NAMES.get(id), html: ANIMALS[id](), ok: id === name })) };
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
    GK.quiz(kit, { total: 6, cols: id === 'ocean' ? 2 : 3,
      make: round => {
        const q = adventureRound(id, round, kit.level, kit.g);
        q.say = q.text;
        return q;
      },
      render: q => `<div class="quest-scene"><img src="img/life/quest-${q.scene}.webp" alt="">${id === 'jungle' ? mascot('nuru', 64, 'quest-runner') : ''}</div>`,
    });
    return () => kit.cleanup();
  };
}
