const ANIMAL_GROUPS = {
  familiar: {
    label: 'Around us',
    animals: [
      ['Paka', 'Cat'], ['Mbwa', 'Dog'], ['Ndege', 'Songbird'], ['Kuku', 'Hen'],
      ['Samaki', 'Fish'], ['cow', 'Cow'], ['goat', 'Goat'], ['sheep', 'Sheep'], ['donkey', 'Donkey'],
    ],
  },
  savanna: {
    label: 'Savanna and drylands',
    animals: [
      ['Tembo', 'Elephant'], ['Simba', 'Lion'], ['Twiga', 'Giraffe'],
      ['zebra', 'Plains zebra'], ['rhino', 'Black rhinoceros'], ['buffalo', 'Cape buffalo'],
      ['cheetah', 'Cheetah'], ['leopard', 'Leopard'], ['hyena', 'Spotted hyena'],
      ['warthog', 'Warthog'], ['wild-dog', 'African wild dog'], ['wildebeest', 'Wildebeest'],
      ['ostrich', 'Ostrich'], ['secretary-bird', 'Secretary bird'], ['meerkat', 'Meerkat'],
      ['aardvark', 'Aardvark'], ['impala', 'Impala'], ['eland', 'Eland'], ['camel', 'Dromedary camel'],
    ],
  },
  forest: {
    label: 'Forests and woodlands',
    animals: [
      ['gorilla', 'Gorilla'], ['chimpanzee', 'Chimpanzee'], ['baboon', 'Olive baboon'],
      ['colobus', 'Red colobus'], ['forest-elephant', 'Forest elephant'], ['okapi', 'Okapi'],
      ['civet', 'African civet'], ['porcupine', 'Crested porcupine'], ['pangolin', 'Pangolin'],
      ['chameleon', 'Chameleon'], ['millipede', 'Giant millipede'], ['parrot', 'African grey parrot'],
      ['turaco', 'Great blue turaco'], ['crowned-eagle', 'Crowned eagle'],
      ['tree-frog', 'Red-eyed tree frog'], ['mantis', 'Orchid mantis'],
    ],
  },
  water: {
    label: 'Rivers, coasts and oceans',
    animals: [
      ['hippo', 'Hippopotamus'], ['crocodile', 'Nile crocodile'], ['sea-turtle', 'Green sea turtle'],
      ['dolphin', 'Bottlenose dolphin'], ['whale', 'Humpback whale'], ['whale-shark', 'Whale shark'],
      ['manta-ray', 'Manta ray'], ['clownfish', 'Clownfish'], ['octopus', 'Octopus'],
      ['seahorse', 'Seahorse'], ['jellyfish', 'Moon jellyfish'], ['flamingo', 'Flamingo'],
      ['penguin', 'African penguin'], ['fish-eagle', 'African fish eagle'], ['pelican', 'White pelican'],
      ['otter', 'African clawless otter'],
    ],
  },
};

const ANIMAL_NAMES = new Map(Object.values(ANIMAL_GROUPS).flatMap(group => group.animals));
const ANIMAL_KEYS = new Map(Array.from(ANIMAL_NAMES.keys(), id => [id.toLowerCase(), id]));
const ANIMAL_MOVES = new Set(['Paka', 'Mbwa', 'Ndege', 'Kuku', 'Samaki', 'Tembo', 'Simba', 'Twiga']);
const ANIMALS = Object.fromEntries(Array.from(ANIMAL_NAMES, ([id, name]) =>
  [id, () => `<img class="life-animal" src="img/life/${id.toLowerCase()}.webp" alt="${esc(name)}" decoding="async">`]));

HK.screens.animalGuide = (el, { habitat = 'familiar' } = {}) => {
  const group = ANIMAL_GROUPS[habitat] || ANIMAL_GROUPS.familiar;
  el.classList.add('game-world', 'scene-serengeti');
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="animal-back" aria-label="Back">${icon('back')}</button><h1>Animal Guide</h1></div>
    <div class="scroll">
      <div class="chips" aria-label="Animal habitats">${Object.entries(ANIMAL_GROUPS).map(([id, entry]) =>
        `<button class="chip ${entry === group ? 'on' : ''}" data-habitat="${id}" aria-pressed="${entry === group}">${esc(entry.label)}</button>`).join('')}</div>
      <button class="btn block" id="animal-quiz">${icon('play', 18)} Play animal quiz</button>
      <div class="animal-catalog">${group.animals.map(([id, name]) =>
        `<button class="animal-card" data-animal="${id}">${ANIMALS[id]()}<span>${esc(name)} ${icon('volume', 16)}</span></button>`).join('')}</div>
    </div>`;
  $('#animal-back', el).onclick = () => HK.back();
  $('#animal-quiz', el).onclick = () => HK.go('tapGame', { kind: 'animals', habitat });
  $$('[data-habitat]', el).forEach(b => b.onclick = () => HK.go('animalGuide', { habitat: b.dataset.habitat }, { replace: true }));
  $$('[data-animal]', el).forEach(b => b.onclick = () => {
    const id = b.dataset.animal;
    speak(ANIMAL_NAMES.get(id));
    playAnimal(b, id);
  });
};

function playAnimal(button, id) {
  if (!ANIMAL_MOVES.has(id) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const image = button.querySelector('img');
  if (image) image.src = 'img/life/' + id.toLowerCase() + '-play.webp';
}
