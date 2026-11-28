/* Curriculum skills are ordered from foundations to independent application. */
const CURRICULUM_DOMAINS = [
  ['math', 'Mathematics', [
    ['number', 'Number sense', 'Compare numbers by place value. When counting a group, say one number for each object.'],
    ['add', 'Addition and subtraction', 'Add to find a total. Subtract to find what is left or how far apart two numbers are.'],
    ['multiply', 'Equal groups and sharing', 'Multiply the number of groups by the size of each group. Divide a total into equal groups to find each share.'],
    ['fractions', 'Fractions and measurement', 'The bottom number of a fraction counts equal parts in a whole. Divide by it first, then multiply by the top number.'],
  ]],
  ['english', 'English', [
    ['sounds', 'Letter sounds', 'Listen for the beginning and ending sounds. The same letter or letter pair can make a sound in several words.'],
    ['words', 'Vocabulary and word classes', 'A noun names something, a verb shows an action, and an adjective describes a noun.'],
    ['sentences', 'Grammar in context', 'Check who does the action and when it happens. A singular subject and plural subject can take different verb forms.'],
    ['meaning', 'Meaning in context', 'Use the other words in a sentence to work out the meaning of an unfamiliar word.'],
  ]],
  ['science', 'Science', [
    ['living', 'Living things', 'Living things need resources from their habitats. Look at what an animal eats and how it moves.'],
    ['materials', 'Materials and their properties', 'Choose materials by their properties. For example, a transparent material lets you see through it.'],
    ['habitats', 'Habitats and adaptations', 'An adaptation is a feature or behaviour that helps a living thing survive in its habitat.'],
    ['investigate', 'Scientific investigation', 'Start with a question. Change one factor, keep other factors the same, and measure what happens.'],
  ]],
  ['reading', 'Reading', [
    ['details', 'Find details', 'Look back at the passage to check who, what, where and when.'],
    ['sequence', 'Read events in order', 'Look for words such as first, next and after. Retell the steps in their original order.'],
    ['inference', 'Use clues to infer', 'Combine a clue in the text with what you already know. Check that your answer fits the evidence.'],
    ['summary', 'Summarise the main idea', 'A summary states what the whole passage is about. Leave out small details that do not change the meaning.'],
  ]],
  ['writing', 'Writing', [
    ['capitals', 'Capitals and endings', 'Start a sentence with a capital letter. Use a question mark for a direct question and a full stop for a statement.'],
    ['order', 'Build clear sentences', 'In many English statements, the subject comes before the verb. Add details where they clearly describe the action.'],
    ['connect', 'Connect ideas', 'Use and to add a related idea, but to contrast, because to give a reason, and so to show a result.'],
    ['edit', 'Edit a draft', 'Read the draft slowly. Check spelling, capitals, punctuation, and whether each sentence says what you intend.'],
  ]],
  ['knowledge', 'General Knowledge', [
    ['everyday', 'Everyday tools and places', 'Match objects and places to what they help people do.'],
    ['community', 'Community and responsibility', 'Think about who can help and what a responsible response would be.'],
    ['tanzania', 'Explore Tanzania', 'Use names, locations and landmarks to explain where places are and what people can find there.'],
    ['environment', 'Care for shared places', 'Keep shared places clean, save resources, and leave wildlife and habitats undisturbed.'],
  ]],
];

const CurriculumContent = (() => {
  const examples = {
    math:['The numbers 8, 9, 10 are in order. One more than 9 is 10.','Asha has 7 oranges and gives away 2. Count back from 7 twice: 6, 5. She has 5.','Three bags hold four beans each. Count 4 + 4 + 4 = 12.','To find two thirds of 18, divide 18 by 3 to get 6. Two parts make 12.'],
    english:['“Sun” and “sand” both begin with the sound written as s.','In “The little dog jumps”, dog names a thing, little describes it, and jumps tells what it does.','“They swim every day” describes a habit. “Yesterday they swam” describes the past.','“The crowded bus had no empty seats.” The clue “no empty seats” helps you understand crowded.'],
    science:['A cow is a living thing. It grows and needs water and food from its surroundings.','A clear plastic cover is transparent. It lets you read the words beneath it.','A duck uses its webbed feet to push against water when it swims.','To compare melting in sun and shade, put equal ice cubes on similar plates and time how long each takes to melt.'],
    reading:['“Ali carried a red bag to school.” The place is school. The colour of the bag is red.','“First Jo washed the cup. Then Jo filled it.” Washing happened before filling.','“Ali put on a raincoat before leaving.” A likely inference is that Ali expected rain.','If a text explains how a class planned, planted and cared for a garden, the main idea is how they grew the garden together.'],
    writing:['“Do you have a pencil?” starts with a capital D and ends with a question mark.','Put the person before the action: change “ran Mari” to “Mari ran”.','“The ball was wet, so Mari dried it.” The joining word so introduces the result.','Edit “the cats runs” to “The cats run.” Capitalise the first letter and make the verb agree with cats.'],
    knowledge:['At a pharmacy, people can collect medicine and ask a pharmacist questions about it.','If a public tap is broken, tell the adult responsible for the site so it can be repaired.','Lake Nyasa lies along part of Tanzania’s southwestern border. A map helps you locate it.','Carry a reusable water bottle and refill it from a safe source to reduce single-use waste.'],
  };
  const skills = {};
  const pools = {};
  for (const [domain,, entries] of CURRICULUM_DOMAINS) {
    entries.forEach(([key,title,guide], index) => {
      const id = domain + '.' + key;
      skills[id] = { id, domain, title, guide, example:examples[domain][index], stage:index, needs:index ? domain + '.' + entries[index-1][0] : null };
      pools[id] = [];
    });
  }
  const add = (id, text, answer, wrong, context = '', difficulty = 1) => {
    const pool = pools[id];
    const correct = String(answer);
    const choices = [...new Set(wrong.map(String))].filter(choice => choice !== correct).slice(0,3);
    if (choices.length < 2) throw new Error('Too few choices for ' + id + ': ' + text);
    pool.push({ id:id + ':' + (pool.length+1), text, answer:correct, choices:[correct,...choices], context, difficulty });
  };
  const numbers = (id,text,answer,spread,difficulty) => add(id,text,answer,[answer+spread,Math.max(0,answer-spread),answer+spread+1], '', difficulty);
  for (let n=1;n<=16;n++) {
    const band = Math.floor((n-1)/4);
    const a = 1+n, b = 2+((n*3)%11);
    const place=a*10+b%10;
    numbers('math.number', 'What number comes after ' + n + '?', n+1, 1, band);
    numbers('math.number', 'What number comes just before ' + (n+2) + '?', n+1, 1, band);
    numbers('math.number', 'What number has ' + a + ' tens and ' + b%10 + ' ones?', place, 10, Math.max(1,band));
    numbers('math.number', 'Which number is greater than ' + place + '?', place+2, 1, Math.max(1,band));
    pools['math.number'][pools['math.number'].length - 1].choices = [String(place+2),String(place),String(place-1),String(place-2)];

    numbers('math.add', 'What is ' + a + ' + ' + b + '?', a+b, 2, band);
    numbers('math.add', 'What is ' + (a+b) + ' − ' + a + '?', b, 1, band);
    numbers('math.add', 'What number completes ' + a + ' + □ = ' + (a+b) + '?', b, 2, band);
    numbers('math.add', 'A basket has ' + a + ' mangoes. Someone adds ' + b + ' and shares 1. How many remain?', a+b-1, 2, Math.max(1,band));

    const groups = 2+n%7, size = 2+Math.floor(n/2);
    numbers('math.multiply', 'How many altogether in ' + groups + ' groups of ' + size + '?', groups*size, groups, band);
    numbers('math.multiply', groups*size + ' counters are shared equally among ' + groups + ' children. How many does each get?', size, 1, band);
    numbers('math.multiply', 'How many groups of ' + size + ' can you make with ' + groups*size + ' counters?', groups, 1, band);
    numbers('math.multiply', 'There are ' + groups + ' tables with ' + size + ' chairs at each. Add one more identical table. How many chairs are there now?', (groups+1)*size, size, Math.max(1,band));

    const whole=2*(n+2), thirds=3*(n+2), quarters=4*(n+2);
    numbers('math.fractions', 'What is one half of ' + whole + '?', whole/2, 2, band);
    numbers('math.fractions', 'What is one third of ' + thirds + '?', thirds/3, 2, band);
    numbers('math.fractions', 'What is three quarters of ' + quarters + '?', quarters/4*3, 3, Math.max(1,band));
    numbers('math.fractions', 'How many centimetres are in ' + n + (n===1 ? ' metre?' : ' metres?'), n*100, 50, Math.max(1,band));
  }

  function table(id, source, prompts) {
    const rows = source.trim().split('\n').map(line => line.trim().split('|'));
    rows.forEach((row,index) => prompts.forEach(([column,question,difficulty = 1]) => {
      const choices = rows.slice(index+1).concat(rows.slice(0,index)).map(other=>other[column]);
      add(id,question(row),row[column],choices,'',difficulty);
    }));
  }
  const words = `
ant|a|t|an|insect|animal
boat|b|t|a|transport|vehicle
cloud|c|d|a|weather|sky
drum|d|m|a|music|instrument
egg|e|g|an|food|kitchen
fish|f|sh|a|water|animal
goat|g|t|a|farm|animal
hat|h|t|a|clothes|head
ink|i|k|an|writing|pen
jug|j|g|a|kitchen|container
kite|k|t|a|play|wind
leaf|l|f|a|plant|tree
moon|m|n|a|space|sky
nest|n|st|a|birds|home
owl|o|l|an|birds|animal
peach|p|ch|a|fruit|food
ring|r|ng|a|jewellery|finger
sock|s|ck|a|clothes|foot
tent|t|t|a|camping|shelter
van|v|n|a|transport|vehicle
web|w|b|a|spider|trap
zip|z|p|a|clothes|fastener
chimp|ch|mp|a|forest|animal
sheep|sh|p|a|farm|animal
thumb|th|m|a|body|hand
bench|b|ch|a|furniture|seat
brush|br|sh|a|cleaning|tool
train|tr|n|a|transport|railway
frog|fr|g|a|pond|animal
stamp|st|mp|a|post|mail`;
  table('english.sounds', words, [
    [1,r=>'Which letter or letter pair begins the written word “'+r[0]+'”?',0],
    [2,r=>'Which letter or letter group is at the end of “'+r[0]+'”?',1],
  ]);
  const vocabulary = `
river|flows|wide|water|stream
candle|glows|bright|wax|light
chef|cooks|busy|meal|kitchen
bell|rings|loud|sound|chime
horse|gallops|strong|animal|foal
bread|toasts|crisp|food|loaf
snail|crawls|slow|shell|slug
kite|flies|colourful|toy|string
rain|falls|heavy|weather|shower
cart|rolls|wooden|vehicle|wagon
flower|blooms|pink|plant|blossom
ice|melts|cold|frozen water|frost
bird|sings|small|animal|sparrow
drum|beats|round|instrument|rhythm
lemon|ripens|sour|fruit|lime
clock|ticks|old|timepiece|watch
lion|roars|fierce|predator|cub
bus|stops|yellow|transport|coach
pencil|writes|sharp|tool|crayon
door|opens|tall|entrance|gate
blanket|covers|warm|bedding|quilt
soap|cleans|slippery|cleaner|foam
boat|floats|light|vessel|canoe
ladder|leans|high|equipment|steps`;
  table('english.words', vocabulary, [
    [1,r=>'In “The '+r[2]+' '+r[0]+' '+r[1]+'”, which word is the verb?',0],
    [2,r=>'In “The '+r[2]+' '+r[0]+' '+r[1]+'”, which word describes the noun?',1],
    [0,r=>'In “The '+r[2]+' '+r[0]+' '+r[1]+'”, which word names the thing?',0],
  ]);
  const verbs = `
walk|walks|walked|walking
wash|washes|washed|washing
mix|mixes|mixed|mixing
play|plays|played|playing
draw|draws|drew|drawing
write|writes|wrote|writing
bring|brings|brought|bringing
sing|sings|sang|singing
jump|jumps|jumped|jumping
paint|paints|painted|painting
eat|eats|ate|eating
drink|drinks|drank|drinking
carry|carries|carried|carrying
watch|watches|watched|watching
clap|claps|clapped|clapping
fold|folds|folded|folding
build|builds|built|building
run|runs|ran|running
take|takes|took|taking
swim|swims|swam|swimming`.trim().split('\n').map(line=>line.split('|'));
  verbs.forEach(([base,singular,past,ongoing]) => {
    add('english.sentences','Which form fits “Every day, she ___”?',singular,[base,past,ongoing], 'Verb: '+base,1);
    add('english.sentences','Which form fits “Yesterday, they ___”?',past,[base,singular,ongoing], 'Verb: '+base,2);
    add('english.sentences','Which form fits “Right now, we are ___”?',ongoing,[base,singular,past], 'Verb: '+base,1);
  });

  const meanings = `
enormous|very big|The enormous box was too big to fit through the door.|tiny
silent|making no sound|The silent room was so quiet that we could hear a pin fall.|noisy
swift|very fast|The swift runner reached the tree before anyone else.|slow
fragile|easily broken|We wrapped the fragile cup because it could break easily.|sturdy
damp|slightly wet|The damp towel still held a little water.|dry
brave|showing courage|The brave girl spoke even though she felt afraid.|afraid
stale|no longer fresh|The stale bread had been on the shelf for days.|fresh
scarce|hard to find|Water became scarce and there was very little to share.|plentiful
tidy|neat and organised|After everything was put away, the room looked tidy.|messy
eager|keen to begin|The eager children could hardly wait to start.|reluctant
rough|not smooth|The rough rock felt bumpy under my hand.|smooth
dim|not very bright|The dim lamp gave only a little light.|bright
narrow|not wide|Only one person could fit along the narrow path.|wide
patient|able to wait calmly|She stayed patient while she waited quietly for her turn.|impatient
vacant|empty or available|We chose the vacant seat because nobody was sitting there.|occupied
gentle|careful and soft|Use a gentle touch so you do not hurt the chick.|harsh
portable|easy to carry|The portable lamp was light enough to take outside.|fixed
brief|lasting a short time|The brief rain shower ended after only a minute.|long
common|often seen|The bird is common here and we see it almost every morning.|rare
slippery|hard to grip|The slippery floor made our shoes slide.|grippy
sturdy|strong and firm|The sturdy shelf held the heavy books without bending.|weak
generous|ready to share|Our generous neighbour gave fruit to everyone.|selfish
polite|showing good manners|The polite visitor said please and thank you.|rude
ancient|very old|The ancient pot had been buried for hundreds of years.|modern
uneven|not level|On the uneven ground, one side of the table stood higher.|level
ordinary|usual or familiar|This was an ordinary day, just like most days.|unusual`;
  table('english.meaning', meanings, [
    [1,r=>'What does “'+r[0]+'” mean in this sentence? '+r[2],1],
    [3,r=>'Which word is closest to the opposite of “'+r[0]+'”?',2],
  ]);

  const animals = `
giraffe|leaves from trees|savanna|long neck|walks
zebra|grass|open grassland|black and white stripes|runs
tilapia|algae and small organisms|fresh water|gills|swims
chicken|seeds and insects|farmyard|comb on its head|scratches the ground
frog|small insects|pond edge|long back legs|jumps
lion|meat|open plains|retractable claws|stalks
honeybee|nectar and pollen|flower-rich areas|pollen baskets|flies
earthworm|decaying plant matter|moist soil|segmented body|burrows
sea turtle|food that varies by species|ocean and nesting beaches|flippers|paddles
camel|dry shrubs|desert|fat-storing hump|walks on wide feet
penguin|fish and krill|cold coast|waterproof feathers|dives
woodpecker|insects under bark|woodland|strong pointed beak|climbs tree trunks
crocodile|fish and other animals|rivers and lakes|eyes high on its head|glides just below the surface
bat|insects or fruit, depending on species|caves or trees|wings made of skin|flies at dusk
elephant|grass, leaves and bark|savanna and woodland|flexible trunk|walks in herds`;
  table('science.living', animals, [[1,r=>'What can a '+r[0]+' eat?',0],[2,r=>'Where could you observe a '+r[0]+'?',0],[3,r=>'Which body feature describes a '+r[0]+'?',1],[4,r=>'Which movement or behaviour fits a '+r[0]+'?',1]]);
  table('science.habitats', animals, [
    [0,r=>'Which animal can you identify from this clue: '+r[3]+'?',0],
    [0,r=>'Which animal typically lives in '+r[2]+' and eats '+r[1]+'?',1],
    [0,r=>'A ranger observes an animal that '+r[4]+'. It has '+r[3]+'. What did the ranger see?',2],
    [3,r=>'A '+r[0]+' lives around '+r[2]+'. Which trait could help identify it during a habitat survey?',3],
  ]);
  const materials = `
glass|transparent|a window pane|a glass jar|can break into sharp pieces
rubber|elastic|a stretch band|a rubber eraser|returns towards its original shape
steel|strong under load|a bridge beam|a steel spoon|can be recycled as metal
cotton|absorbent|a towel|a cotton shirt|holds water in its fibres
aluminium|light for a metal|a light can|aluminium foil|can be rolled into a thin sheet
wax|repels water|a coating on paper|a candle|softens when warmed
clay|mouldable when wet|a sculpted pot|a lump of wet clay|hardens when fired
wood|has a grain|a wooden stool|a plank|can be cut along its grain
cork|floats in water|a fishing float|a cork stopper|contains tiny air-filled cells
wool|traps warmth|a warm jumper|a wool scarf|traps pockets of air
sandpaper|abrasive|smoothing rough wood|a sanding sheet|wears away raised material
cardboard|foldable|a carton|a cardboard box|can lose stiffness when soaked
sponge|compressible|wiping up a spill|a kitchen sponge|releases water when squeezed
graphite|leaves a grey mark|a pencil core|a graphite rod|has layers that slide
concrete|hard after setting|a building foundation|a paving slab|sets after being mixed with water`;
  table('science.materials',materials,[
    [1,r=>'Which property is especially useful when using '+r[0]+' for '+r[2]+'?',0],
    [0,r=>'What material would you pick for '+r[2]+' if it must be '+r[1]+'?',1],
    [2,r=>'Which is a common use for '+r[0]+'?',1],
    [4,r=>'Which statement describes '+r[3]+'?',2],
  ]);
  const investigations = `
water and seed growth|amount of water|seed type and soil|height of seedlings after one week|a ruler
light and bean growth|hours of light|water and seed type|new leaves after one week|a tally sheet
ramp and rolling time|ramp steepness|the ball and ramp length|seconds to reach the end|a stopwatch
paper and absorption|paper type|size of the paper pieces|millilitres soaked up|a measuring cup
salt and dissolving|water temperature|salt amount and amount of stirring|seconds until the salt is no longer visible|a timer
wind and drying|fan speed|size and initial wetness of cloth|change in cloth mass over ten minutes|scales
string and pendulums|string length|the weight on the string|swings completed in thirty seconds|a stopwatch and tally sheet
wheels and a cart|wheel size|the cart body and load|distance a cart goes after the same push|a measuring tape
sound and cups|cup material|cup size and tapping strength|sound level at a fixed distance|a sound level meter
shade and temperature|amount of shade|container type and starting temperature|water temperature after half an hour|a thermometer
soil and drainage|soil type|soil volume and amount of water poured|volume of water that drains out|a graduated jug
stretch and loads|mass of the load|the elastic band|change in the length of the band|a ruler marked in millimetres
magnets and distance|distance from the magnet|the magnet and type of clips|number of clips picked up|a ruler and a tally sheet
water and sponges|sponge type|dry size and dipping time|change in sponge mass|a kitchen scale
shade and evaporation|time spent in sunlight|dish size and starting water volume|water remaining at the end|a graduated cylinder`;
  table('science.investigate',investigations,[
    [1,r=>'What should you change when investigating '+r[0]+'?',1],
    [2,r=>'What should you keep the same when investigating '+r[0]+'?',2],
    [3,r=>'Which observation best measures the outcome in an investigation of '+r[0]+'?',2],
    [4,r=>'Which tool is best suited to measuring '+r[3]+'?',3],
  ]);

  const reading = `
Asha|a school garden|a dry seed bed|collected water|watered the seed bed|new seedlings appeared a week later
Baraka|a football field|a loose goal net|found a length of rope|tied the loose net|the ball stayed inside the goal
Neema|a library|books left on a table|checked the shelf labels|put the books in order|the next class found the books easily
Juma|a market|a basket with a broken handle|asked for strong string|repaired the handle|the basket could be carried again
Zawadi|a playground|litter near a swing|put on gloves|collected the litter with an adult|the path was clear again
Imani|a bus stop|a timetable wet from rain|found a dry copy indoors|placed it under a clear cover|travellers could read the times again
Musa|a kitchen|a missing measuring cup|asked where it had been washed|looked at the drying rack|the recipe could continue
Nia|a classroom|an empty pencil pot|checked the supply box|sharpened spare pencils|everyone had something to write with
Amina|a workshop|a stool with a rough edge|asked an adult for sandpaper|smoothed the rough area with help|the edge no longer scratched
Tunu|a beach|a plastic bag caught on a branch|told a beach cleaner|helped put the bag in a bin|the bag did not blow into the sea
Pendo|a music room|a drum with a loose strap|found a spare strap|attached the new strap|the drum could be carried safely
Salma|a community hall|a sign that pointed the wrong way|asked where the meeting was|turned the sign towards the right door|visitors found the meeting room
Furaha|a school office|an envelope without a name|asked who should receive it|wrote the name on the envelope|the letter reached the right person
Daudi|a tree nursery|a pot with no label|asked what seed was planted|made a new label|the group could identify the plant
Lulu|a canteen|a pile of mixed cups|sorted the cups by size|placed each group on a shelf|the cook could count the cups
Saidi|a shop entrance|a mat folded at the corner|warned the shopkeeper|flattened the corner with help|people could walk in safely
Farida|a reading corner|a book with loose pages|told the teacher|moved the book to the repair shelf|the pages did not get lost
Mwajuma|a courtyard|a watering can with a blocked spout|asked an adult to check it|rinsed the spout after it was cleared|water flowed easily again
Doto|a sports store|a ball with very little air|found the pump|filled the ball with air|the ball bounced again
Bahati|a meeting room|a clock that had stopped|asked an adult for a battery|checked the clock after the battery was replaced|the clock showed the time again
Rehema|a footpath|a fallen branch across the path|asked a caretaker for help|showed the caretaker where it was|people could use the path again
Swalehe|a craft table|a set of paints without lids|looked for matching lids|covered the paint pots|the paints stayed wet
Tatu|a fruit stall|a torn paper bag|told the stall holder|put the fruit in a stronger bag|the fruit could be taken home safely
Selemani|an art room|a photograph that had fallen|found the right frame|put the photograph back with help|the display was complete again
Sara|a bicycle shed|a bicycle with a flat tyre|told an adult|brought the bicycle pump|the wheel could be tested again
Upendo|a farm gate|a gate latch stuck with mud|asked the farmer for help|cleaned the outside of the latch|the gate could close
Yusufu|a computer room|a blank monitor|told the teacher|checked the power switch with permission|the screen lit up
Wema|a flower shop|a wilted bunch of flowers|checked the water level|placed the stems in fresh water|the flowers stood upright later
Dina|an outdoor stage|programmes blowing away|asked for a paperweight|stacked the programmes under the weight|visitors could pick up a copy
Nasra|a school corridor|a poster falling from a wall|fetched new tape|secured the top corners|the notice stayed in place`.trim().split('\n').map(line=>line.split('|'));
  const passage = r => r[0]+' went to '+r[1]+' and noticed '+r[2]+'. First, '+r[0]+' '+r[3]+'. Next, '+r[0]+' '+r[4]+'. In the end, '+r[5]+'.';
  reading.forEach((r,i)=>{
    const other=[1,2,3].map(n=>reading[(i+n)%reading.length]);
    const ask=(id,text,j,diff)=>add('reading.'+id,text,r[j],other.map(row=>row[j]),passage(r),diff);
    ask('details','Where did the events take place?',1,0);
    ask('details','Who is the main person in this passage?',0,0);
    ask('sequence','What did '+r[0]+' do first after noticing the problem?',3,1);
    add('reading.sequence','What did '+r[0]+' do after they '+r[3]+'?',r[4],[r[3],other[0][4],other[1][3]],passage(r),1);
    ask('inference','What evidence shows that the problem was solved?',5,2);
    ask('inference','Which clue explains why '+r[0]+' took action?',2,2);
    const mainIdea = row => row[0]+' took steps to help with '+row[2]+'.';
    add('reading.summary','Which sentence best summarises the whole passage?',mainIdea(r),other.map(mainIdea),passage(r),3);
    add('reading.summary','Which heading best captures the problem that was solved?', 'Solving the problem of '+r[2], ['Visiting '+r[1], 'Things to do after school', 'Choosing a new place to visit'],passage(r),3);
  });

  const people=['Asha','Baraka','Neema','Juma','Zawadi','Imani','Musa','Nia','Amina','Tunu','Pendo','Salma','Furaha','Daudi','Lulu','Saidi','Farida','Doto','Bahati','Rehema'];
  const sentences=[
    'carries a lantern','brings a basket','draws a bird','paints a wall','mixes a drink','reads a note','waves goodbye','opens a gate','folds a shirt','washes a plate',
    'feeds a goat','holds a drum','rides a bicycle','plants a seed','ties a knot','finds a button','plays a tune','packs a bag','rolls a ball','buys a mango',
  ];
  people.forEach((name,i)=>{
    const sentence=name+' '+sentences[i]+'.';
    const lower=name.toLowerCase()+' '+sentences[i];
    const item=sentences[i].split(' ');
    const question='Did '+name+' '+verbs[i][0]+'?';
    add('writing.capitals','Which statement uses a capital letter and a full stop correctly?',sentence,[lower+'.',sentence.slice(0,-1)+'?',lower+'!'],lower,0);
    add('writing.capitals','Which direct question is punctuated correctly?',question,[question.slice(0,-1)+'.',question.toLowerCase(),question.slice(0,-1)+','], 'did '+name.toLowerCase()+' '+verbs[i][0],1);
    add('writing.capitals','Which name is written correctly in a sentence?',name,[name.toLowerCase(),name.toUpperCase(),name[0]+name.slice(1).toUpperCase()],'Please give this note to '+name.toLowerCase()+'.',0);

    const objects=item.slice(1).join(' ');
    add('writing.order','Choose the complete statement that uses the words in a clear order.',sentence,[objects+' '+item[0]+' '+name+'.',item[0]+' '+name+' '+objects+'.',name+' '+objects+' '+item[0]+'.'],'Words: '+objects+' / '+name+' / '+item[0],0);
    add('writing.order','Choose the phrase with the describing word in the usual position.', 'the small '+objects.split(' ').slice(-1)[0],['small the '+objects.split(' ').slice(-1)[0], 'the '+objects.split(' ').slice(-1)[0]+' small','small '+objects.split(' ').slice(-1)[0]+' the'], 'Put “the”, “small” and the object in order. Object: '+objects,1);
    add('writing.order','Which group of words can stand alone as a statement?',sentence,[objects+'.','When '+sentence,'Beside '+objects+'.'], 'Write about '+name+' and '+objects+'.',1);

    const wrongVerb=verbs[i][0];
    add('writing.edit','Which edit fixes the missing capital letter?',sentence,[lower+'.',lower+'!',lower+'?'],lower+'.',1);
    add('writing.edit','Which edit changes the draft into a correctly punctuated question?',question,[question.slice(0,-1)+'.',question.toLowerCase(),question.slice(0,-1)+'!'],'Draft: '+question.slice(0,-1),1);
    add('writing.edit','Choose the verb form that agrees with the subject in the draft.',verbs[i][1],[wrongVerb,verbs[i][2],verbs[i][3]],'Draft: Every morning, '+name+' ___ before breakfast. Verb: '+wrongVerb,2);
  });
  const connections = `
The bucket was full|the handle did not break|but
We took the path by the river|the main road was closed|because
The bell rang|the class went inside|so
Asha brought pencils|Juma brought erasers|and
The picture was colourful|it was difficult to see from far away|but
The team took a rest|everyone was tired|because
The wind became stronger|we held the kite string tightly|so
Neema read a story|her brother drew a picture|and
The shoes looked clean|the soles were muddy|but
We waited in the shade|the sun was very hot|because
The tap was left running|the caretaker turned it off|so
Musa swept the floor|Pendo wiped the table|and
The room was small|everyone fitted inside|but
The shop closed early|the owner had an appointment|because
The road was wet|we walked slowly|so
The boat carried baskets|the cart carried sacks|and
The bag was light|it could hold many books|but
The class worked quietly|another class was taking a test|because
The lamp ran out of power|we replaced the batteries|so
Salma washed the apples|Lulu shared them|and`.trim().split('\n').map(row=>row.split('|'));
  const relations={and:'Add a related idea',but:'Show a contrast',because:'Give a reason',so:'Show a result'};
  connections.forEach(([a,b,c])=>{
    const options=Object.keys(relations).filter(x=>x!==c);
    add('writing.connect','Which joining word gives this sentence its intended meaning: '+relations[c].toLowerCase()+'?',c,options,a+' ___ '+b+'.',1);
    add('writing.connect','What does “'+c+'” do in this sentence?',relations[c],options.map(x=>relations[x]),a+' '+c+' '+b+'.',2);
    add('writing.connect','Which joining word would change the relationship from “'+relations[c].toLowerCase()+'” to “'+relations[options[1]].toLowerCase()+'”?',options[1],[c,options[0],options[2]],a+' ___ '+b+'.',3);
  });

  const everyday=`
library|borrow a book|librarian|library card
clinic|get help for an illness|nurse|appointment slip
market|buy vegetables|stall holder|shopping basket
post office|send a letter|postal clerk|stamp
fire station|respond to fires|firefighter|fire hose
bus station|board a bus for another town|driver|bus ticket
garage|repair a car|mechanic|spanner
school|attend a lesson|teacher|exercise book
farm|grow food crops|farmer|hoe
museum|learn about historical objects|guide|exhibit label
bakery|make bread to sell|baker|baking tray
tailor shop|have a shirt altered|tailor|measuring tape
barber shop|get a haircut|barber|clippers
recycling centre|sort recyclable waste|recycling worker|sorting bin
bank|deposit savings|bank teller|deposit slip`;
  table('knowledge.everyday',everyday,[[1,r=>'What can a person do at a '+r[0]+'?',0],[0,r=>'Where would you most likely go to '+r[1]+'?',0],[2,r=>'Who normally helps someone to '+r[1]+'?',1],[3,r=>'Which item is most directly linked to the task “'+r[1]+'”?',1]]);
  const community = `
a new child cannot find their classroom|ask the teacher and show the child where to go|A new pupil needs directions|a teacher|help them get to class
the school path is blocked by a heavy branch|keep children clear and tell the caretaker|Something is blocking a school path|a school caretaker|keep the path safe
one player never gets a turn|agree on a fair turn-taking order|Everyone should get a turn|the group of players|share the chance to play
a friend left a bag on the bus|tell a trusted adult and contact the bus operator|A bag was left on a bus|the bus operator|recover lost property
a team needs to clean up after an event|ask who will collect and who will sort the waste|The hall needs cleaning after our event|the event organisers|share the work fairly
a classmate is being teased repeatedly|tell a trusted adult and include the classmate|Someone keeps teasing a pupil|a trusted teacher|help the child get support
the queue is crowded and someone is pushing|give others space and wait for your turn|People are crowding in the queue|someone supervising the queue|prevent more pushing
people cannot find a meeting hall|put up a clear sign after checking the venue|Visitors need directions to the hall|a venue organiser|help visitors find the meeting
the class has two ideas for a project|listen to both ideas and take a fair vote|The class needs to choose a project|a class representative|make a decision fairly
a family member is late to collect you|stay with a trusted adult at the agreed place|My ride has not arrived|a designated school staff member|stay where a trusted adult can find you
library books were mixed up after an activity|check the labels with the librarian before filing them|These books need to be put back|the librarian|keep books easy to find
the football pitch has a broken fence|stay clear and tell the grounds manager|Part of the fence is broken|the grounds manager|get the damaged area repaired
a stallholder gives you too much change|explain the mistake and give back the extra money|I think I received too much change|the stallholder|return money honestly
two neighbours disagree about noise|talk calmly with a responsible adult about quieter times|We need to agree on quieter times|a trusted adult in the community|find a respectful compromise
the class has supplies for fewer pupils than planned|count the supplies and organise sharing in pairs|There are too few supplies for everyone|the class teacher|make sure every pupil can participate`;
  table('knowledge.community',community,[
    [1,r=>'What is a helpful response when '+r[0]+'?',0],
    [2,r=>'What could you tell someone when '+r[0]+'?',1],
    [3,r=>'Who could help most directly when '+r[0]+'?',1],
    [4,r=>'When '+r[0]+', why would you '+r[1]+'?',2],
  ]);
  const places=`
Dodoma|central Tanzania|national capital|Parliament
Dar es Salaam|Indian Ocean coast|large commercial city|major seaport
Unguja|Zanzibar archipelago|largest island of Zanzibar|Stone Town
Pemba|north of Unguja|Zanzibar island famous for cloves|clove farms
Kilimanjaro|northeastern Tanzania|highest mountain in Africa|Uhuru Peak
Serengeti|northern Tanzania|national park known for migration|migrating wildebeest
Ngorongoro|northern highlands|conservation area with a large caldera|Ngorongoro Crater
Bagamoyo|coast north of Dar es Salaam|historic coastal town|Kaole ruins
Mwanza|southern shore of Lake Victoria|lakeside city known for rock formations|Bismarck Rock
Kigoma|eastern shore of Lake Tanganyika|town close to Ujiji|Lake Tanganyika port
Gombe|western Tanzania near Kigoma|national park known for chimpanzees|chimpanzee research
Mikumi|inland in the Morogoro Region|national park with a broad floodplain|Mkata floodplain
Tanga|northern coast near Kenya|coastal city near Amboni|Amboni Caves
Iringa|southern highlands|city near Isimila|Isimila Stone Age site
Kilwa Kisiwani|off the southern coast|island with Swahili trading ruins|Great Mosque ruins`;
  table('knowledge.tanzania',places,[
    [1,r=>'Where in Tanzania would you look for '+r[0]+'?',0],
    [0,r=>'Which place is a '+r[2]+'?',1],
    [3,r=>'Which feature is associated with '+r[0]+'?',2],
    [0,r=>'Where would you travel to see '+r[3]+'?',2],
  ]);
  const environment=`
a dripping tap|water waste|tell an adult it needs fixing|save water
a lamp on in an empty room|unneeded electricity use|switch it off if it is safe|save electricity
plastic bottles on a beach|plastic entering the ocean|join a clean-up with an adult|protect sea animals
a nest on a low branch|disturbance to nesting birds|look quietly from a distance|keep the nest undisturbed
soil washing off a garden bed|soil erosion|grow suitable ground cover|hold the soil in place
an old notebook with blank pages|wasted paper|use its clean blank pages for drafts|use less new paper
a path beside a river|damage from walking on plants|stay on the marked path|protect plants along the river
an oily spill by a drain|water pollution|tell an adult before anything reaches the drain|keep oil out of the water
food scraps after a meal|avoidable landfill waste|put suitable scraps in a compost bin|return nutrients to soil
a broken glass bottle outside|risk of cuts|keep children away and get an adult|prevent injuries
loud music near a wildlife hide|animals being frightened|turn off the music and listen quietly|reduce disturbance to wildlife
smoke from burning rubbish|dirty air|report it to a responsible adult|protect the air people breathe
a cracked reusable cup|sharp edges and leaking|ask an adult to replace or recycle it safely|prevent cuts and spills
an animal crossing sign|wildlife road danger|remind a driver to slow down|reduce risk to crossing animals
a pile of sorted paper|paper being mixed with other waste|take it to a suitable recycling point|make it easier to recycle the paper`;
  table('knowledge.environment',environment,[
    [1,r=>'Which problem is most directly associated with '+r[0]+'?',1],
    [2,r=>'What is one responsible response to '+r[0]+'?',1],
    [3,r=>'What is a benefit when people '+r[2]+'?',2],
    [0,r=>'Which situation is an example of '+r[1]+'?',2],
  ]);
  return { skills,pools,domains:CURRICULUM_DOMAINS };
})();
