/* Ordered gameplay curricula. Question IDs do not depend on shuffled choices. */
const EpisodeContent = (() => {
  const rows = text => text.trim().split('\n').map(line => line.trim().split('|'));
  const math = rows(`
Counting|Count objects one at a time|Count a group
Counting|Compare two quantities|Find how many more
Counting|Combine tens and ones|Read place value
Addition|Combine two groups|Add two quantities
Addition|Find a missing addend|Complete an addition
Addition|Add across a ten|Use a make-ten strategy
Addition|Add three amounts|Find a combined total
Subtraction|Find how many remain|Take away a quantity
Subtraction|Find the difference|Compare quantities by subtraction
Subtraction|Find a missing starting amount|Reverse a subtraction
Multiplication|Count equal groups|Multiply group size by number of groups
Multiplication|Use rows and columns|Work with rectangular arrays
Multiplication|Scale a quantity|Multiply by a scale factor
Division|Share equally|Find the size of a share
Division|Make equal groups|Find the number of groups
Division|Interpret remainders|Identify what is left over
Fractions|Find one half|Split into two equal parts
Fractions|Find one third|Split into three equal parts
Fractions|Find three quarters|Count several equal parts
Fractions|Recognise equivalent fractions|Compare equal shares
Word Problems|Add then subtract|Track a changing total
Word Problems|Multiply and combine|Find a total across groups
Word Problems|Divide and round up|Plan enough containers
Word Problems|Find a fraction of the remainder|Combine subtraction and fraction reasoning`);
  const english = rows(`
Letters|Match a capital and lowercase letter|B|b|d|p|Match the letter shown.|B
Letters|Complete an alphabet sequence|D|E|F|H|Which letter follows the letter shown?|D
Letters|Identify the position of a letter|CAT|A|C|T|Which letter is in the middle?|CAT
Sounds|Identify an initial sound|sun|s|m|t|Which letter usually makes the first sound you hear?|sun
Sounds|Identify an ending sound|bed|d|b|m|Which letter makes the final sound?|bed
Sounds|Recognise a two-letter sound|ship|sh|ch|th|Which two letters make the first sound?|ship
Words|Blend sounds to read a word|c · a · t|cat|cot|cap|Blend the sounds to choose the word.|cat
Words|Build a compound word|rain + coat|raincoat|rainbow|suncoat|Join the two words.|raincoat
Words|Choose a word by meaning|a vehicle that travels on rails|train|truck|boat|Choose the word that fits the clue.|train
Sentences|Put words in order|the door / opens / Asha|Asha opens the door.|Opens Asha the door.|The door Asha opens it.|Choose the complete statement.|Asha opens the door.
Sentences|Show when an event happened|Yesterday, we ___ home.|walked|walks|walking|Which form completes the sentence?|We walked home.
Sentences|Punctuate a question|can you help me|Can you help me?|Can you help me.|can you help me?|Choose the correctly written question.|Can you help me?
Reading|Find a stated detail|Asha placed the red bag under the bench.|Under the bench|Above the door|Beside the tree|Where did Asha put the bag?|Asha placed the red bag under the bench.
Reading|Connect a pronoun to its noun|Juma picked up the lantern. He lit it.|The lantern|The match|The path|What does “it” replace?|Juma lit the lantern.
Reading|Sequence two actions|First Neema washed the cup. Then she filled it.|She filled the cup|She washed the cup|She found a plate|Which action happened second?|Neema filled the cup.
Comprehension|Infer a reason from evidence|Musa carried an umbrella. Dark clouds covered the sky.|He expected rain|He wanted to swim|He forgot the time|Why did Musa most likely take an umbrella?|Musa expected rain.
Comprehension|Infer a word meaning|The fragile cup could break unless it was wrapped.|Easily broken|Very heavy|Brightly coloured|What does “fragile” mean here?|Fragile means easily broken.
Comprehension|Choose a main idea|The class sorted paper, bottles and tins into separate bins.|The class sorted materials for recycling|The class bought paper|The bins were expensive|Which main idea fits the whole passage?|The class sorted materials for recycling.
Comprehension|Use a stated cause|The shop closed when water flooded the doorway.|Floodwater blocked the entrance|The owner sold the door|The shop needed more signs|Why did the shop close?|Floodwater blocked the entrance.
Creative Writing|Choose a vivid verb|The monkey ___ across the branch.|scrambled|was|went|Which verb gives the clearest picture of movement?|The monkey scrambled across the branch.
Creative Writing|Show a feeling through action|A character is nervous before a race.|She twists her sleeves at the starting line|She feels a feeling|The race is on a track|Which detail shows the character’s feeling through action?|She twists her sleeves at the starting line.
Creative Writing|Build a story opening|Introduce a character and an immediate problem.|Asha reached the bridge just as its last plank broke|There was something somewhere|The End|Which opening introduces a character and a problem?|Asha reached the bridge just as its last plank broke.
Creative Writing|Revise for detail|The village was quiet.|Only a goat bell broke the village’s silence|The village was there|It was nice|Which revision adds a detail the reader can hear?|Only a goat bell broke the village’s silence.
Creative Writing|End a story by resolving a problem|The story begins with a lost drum needed for a festival.|Juma finds the drum and brings it back before the festival|A plane takes off without warning|A new story begins in another town|Which ending resolves the story’s original problem?|Juma brings the drum back before the festival.`);
  const animals = rows(`
Recognition|Trunks and tusks|A flexible trunk helps an animal pick up food and spray water.|Elephant|Zebra|Ostrich|Look for the flexible trunk.|Observe from a distance
Recognition|Coats with stripes|A black-and-white striped horse-like animal grazes nearby.|Zebra|Giraffe|Crocodile|Use its coat pattern and body shape.|Watch the herd quietly
Recognition|Tall browsers|A spotted animal has a long neck for reaching tall branches.|Giraffe|Lion|Honeybee|Use its long neck and spotted coat.|Look for leaves high in trees
Recognition|Feathers and wings|An animal has feathers and a beak, even though it cannot fly.|Ostrich|Bat|Tilapia|Feathers identify a bird.|Compare feathers with fur
Habitats|Open grasslands|Herds graze where rainfall supports wide open areas dominated by grass.|Grassland|Deep ocean|Ice sheet|Grass provides grazing food.|Look for grazers in open areas
Habitats|Fresh water|A tilapia lives inland in water that has little dissolved salt.|Lake|Salt flat|Dry cliff|Choose a freshwater habitat.|Compare freshwater and saltwater
Habitats|Coral reefs|Bright fish shelter among living coral in shallow warm seawater.|Coral reef|Mountain forest|City farm|Coral is a marine habitat.|Keep fins away from living coral
Habitats|Wetland edges|Amphibians find insects beside shallow water and reeds.|Wetland|Dune|Alpine peak|Wet soil and reeds indicate a wetland.|Keep the reed beds intact
Diets|Plant eaters|A giraffe feeds mainly on leaves and shoots.|Herbivore|Carnivore|Decomposer|Classify using the main food eaten.|Identify plants in its diet
Diets|Meat eaters|A lion hunts or scavenges other animals for food.|Carnivore|Herbivore|Pollinator|Classify based on food from animals.|Observe the predator from afar
Diets|Mixed diets|A baboon may eat fruit, seeds, insects and small animals.|Omnivore|Strict herbivore|Strict carnivore|It eats both plants and animals.|List one food from each source
Diets|Feeding structures|A bee uses a long mouthpart to sip sugary liquid from flowers.|Nectar|Bark|Bones|Nectar is a sugary liquid in flowers.|Protect flowering plants
Classification|Mammals|An animal has fur and feeds milk to its young.|Mammal|Reptile|Fish|Milk production identifies a mammal.|Compare fur and scales
Classification|Reptiles|A crocodile has scales, breathes air and lays eggs on land.|Reptile|Amphibian|Insect|Combine its skin and egg-laying clues.|Observe signs without disturbing nests
Classification|Insects|An adult honeybee has six legs and three body sections.|Insect|Spider|Mammal|Count the legs and body sections.|Compare six with eight legs
Classification|Amphibians|A frog usually begins as a tadpole and changes body form as it grows.|Amphibian|Bird|Fish|Use its life cycle, not just where it swims.|Compare larva with adult
Ecosystems|Producers|Grass makes sugars using sunlight before a zebra eats it.|Producer|Predator|Parasite|A producer makes its own food from light.|Trace energy from the sun
Ecosystems|Food chains|Grass feeds a zebra. A lion hunts the zebra.|Grass → zebra → lion|Lion → grass → zebra|Zebra → grass → lion|Arrows show where food energy moves.|Draw arrows from food to eater
Ecosystems|Pollination|A bee carries pollen from one flower to another.|Pollination|Hibernation|Erosion|Movement of pollen can help plants form seeds.|Watch insects without catching them
Ecosystems|Decomposition|Fungi break down fallen leaves and return nutrients to soil.|Decomposition|Migration|Camouflage|Dead material is being broken down.|Leave some leaf litter for soil life
Conservation|Wildlife corridors|A fence divides a route animals use to reach water during drought.|Protect a safe crossing|Put food beside traffic|Block every gap|A corridor connects places wildlife needs.|Keep habitat patches connected
Conservation|Reducing water pollution|Rain can carry discarded plastic from a path into a river.|Collect litter safely|Push litter into the drain|Hide litter under reeds|Stop pollution before it reaches water.|Use an organised clean-up
Conservation|Protecting nesting sites|A shorebird nests where walkers sometimes pass.|Keep people on a signed path|Move the eggs for a better view|Leave food beside the nest|Reduce disturbance without moving the nest.|Watch from outside the protected area
Conservation|Monitoring recovery|Rangers want to know if a restored wetland has attracted more birds.|Repeat counts at equal times and places|Count once in a different region|Guess from the colour of the water|Comparable surveys show changes over time.|Record visits consistently`);
  const science = rows(`
Observation|Use sight and touch to describe|A dry leaf bends and crackles when lifted.|The leaf is dry and brittle|The leaf is unhappy|The leaf is making food|Describe what you can observe directly.|Observe a fallen leaf
Observation|Measure instead of guessing|Two seedlings look different in height.|Measure from soil to tip with a ruler|Count the pots|Ask which pot looks nicest|Use the same starting point each time.|Record both heights
Observation|Observe change over time|A water level looks lower the next morning.|Mark and compare its level each day|Stir it once and guess|Look only when it rains|Repeat observations under known conditions.|Record a daily water level
Observation|Sort by a property|A collection contains rocks with rough and smooth surfaces.|Sort them by how their surfaces feel|Sort by the owner’s name|Sort by which might hatch|Use an observable feature.|Compare object surfaces
Living Things|Recognise signs of life|A bean seed germinates and grows a root.|It is growing|It is shiny|It has melted|Growth is one sign of life.|Look for roots and shoots
Living Things|What plants need|Two similar plants have water, but one is kept in darkness.|Light|A larger label|A louder room|Plants need light to make food.|Compare plants with similar water
Living Things|Compare life cycles|A caterpillar forms a pupa before becoming a butterfly.|Metamorphosis|Evaporation|Pollution|A larva changes its form as it develops.|Put the life stages in order
Living Things|Trace plant structures|Water enters a plant from the soil.|Roots|Petals|Seeds in a fruit|Roots take up water from soil.|Identify root and shoot
Human Body|Breathing|A runner needs more oxygen during exercise.|Lungs|Teeth|Hair|The lungs exchange gases.|Notice breathing after gentle activity
Human Body|Circulation|Blood carries oxygen from the lungs around the body.|Heart|Stomach|Wrist bones|The heart pumps blood.|Feel a resting pulse
Human Body|Muscles and skeleton|An arm bends to lift a basket.|Muscles pull on bones across a joint|Fingernails pull the wrist together|Bones melt at the elbow|Muscles and joints work together.|Compare a bent and a straight arm
Human Body|Digestion|You chew food before it reaches the stomach.|Chewing breaks it into smaller pieces|Chewing sends it into your lungs|Chewing turns it into bone|Digestion begins while you chew.|Trace the path of swallowed food
Energy|Sources of light|At dusk, a lamp lets you see a path.|Electrical energy becomes light and heat|The path makes its own sunlight|Sound turns into stones|A powered lamp converts energy.|Compare light with and without a lamp
Energy|Food and movement|A child eats breakfast and then plays.|The body uses energy from food|The ball gives energy to the child without touching|Food only provides colour|Food stores energy the body can use.|Connect food with activity
Energy|Motion and friction|A cart slows when it rolls onto a rough mat.|Friction opposes the motion|The mat creates gravity|The cart loses its mass|Contact between surfaces can slow motion.|Compare smooth and rough surfaces
Energy|Heat transfer|A metal spoon warms while standing in hot soup.|Heat moves from the soup into the spoon|The spoon makes the soup hotter by itself|Cold moves from the bowl into the fire|Energy transfers from warmer to cooler material.|Compare safe cold materials with adult help
Environment|Water cycle|Water vapour forms tiny drops on a cold lid.|Condensation|Germination|Erosion|Cooling vapour can form liquid droplets.|Observe droplets on a cold container
Environment|Soil erosion|Heavy rain carries exposed topsoil down a slope.|Plant ground cover|Remove every root|Pour more water down the slope|Roots help hold soil in place.|Compare covered and bare soil
Environment|Reduce waste|A school has single-use cups after every event.|Use washable cups where safe|Throw cups into a river|Burn cups in the classroom|Using items again can cut waste.|Count cups used before and after
Environment|Save habitat resources|A pond edge loses reeds that shelter young animals.|Protect and replant native reeds|Remove all the pond plants|Fill the pond with rubble|Plant cover can provide shelter.|Observe changes from a safe distance
Experiments|Ask a testable question|A team has paper towels, water and a measuring cup.|Which towel soaks up more water?|Which towel is the friendliest?|What will the weather be next year?|A testable question can be answered by measuring.|Write a measurable question
Experiments|Keep a comparison fair|You test two ramp heights with a toy car.|Use the same car and ramp surface|Use a different car each time|Push one car but not the other|Change only the factor you are testing.|Name what stays the same
Experiments|Repeat measurements|One roll down a ramp was unusually slow.|Repeat under the same conditions|Erase the result and stop|Change everything before trying again|Repeating gives more reliable evidence.|Log each result
Experiments|Draw an evidence-based conclusion|Three equal ice cubes melted sooner in sun than shade.|In this test, the cubes melted faster in sun|All ice melts at exactly the same speed|No future test can change our idea|Limit a conclusion to the evidence collected.|Explain what your data show`);
  const design = rows(`
Locate|Use left and right|A marker is one tile left of the gate.|Left|Right|Below|Read position from the stated reference point.|Place a marker beside a gate
Locate|Use rows and columns|A crate is in row 2, column 3.|Row 2, column 3|Row 3, column 2|Row 1, column 1|Look up the row before the column.|Mark a grid location
Locate|Compare distance|One route uses three equal tiles. Another uses five.|Three tiles|Five tiles|Eight tiles|Compare lengths using the same units.|Choose the shorter route
Locate|Identify a simple boundary|A square fence has four straight sides enclosing a plot.|Four sides|Three sides|One curved side|Count edges all the way around.|Trace a square boundary
Plan|Use a sequence|A box must be opened before its contents can be counted.|Open, then count|Count, then open|Close, then leave|Order steps by dependency.|Plan two linked actions
Plan|Follow a turn|A robot faces north and makes one right-angle turn to its right.|East|West|South|A right turn from north points east.|Trace a quarter turn
Plan|Read a boundary condition|A path ends at a blocked cell.|Replan before the blocked cell|Cross the blocked cell|Take away all signs|A valid plan respects obstacles.|Choose an open route
Plan|Calculate a total length|Three pieces are each 4 units long.|12 units|7 units|16 units|Multiply the number of equal pieces by their length.|Combine parts of a route
Build|Choose a strong shape|A square frame wobbles sideways without bracing.|Add a diagonal to form triangles|Remove a corner|Paint the frame|A triangular brace helps a frame resist changing shape.|Compare a braced and unbraced frame
Build|Spread a load|A platform sags when the whole load sits at its centre.|Distribute items across the platform|Add everything to the middle|Remove a supporting leg|Avoid concentrating the load in one area.|Plan an even distribution
Build|Understand a foundation|A tower leans on soft uneven ground.|Make a level, stable base|Make it taller immediately|Put more weight at the top|A level base makes the structure more stable.|Compare two base designs
Build|Recognise reflection symmetry|A shape folds so its left and right sides match.|Line of symmetry|Random border|Unequal diagonal|A fold line can show matching halves.|Check matching sides
Improve|Find an inefficient loop|A robot returns to its starting point before using the direct route.|Remove the unnecessary loop|Add another loop|Erase the destination|Remove steps that do not help reach the goal.|Shorten an existing plan
Improve|Use a budget|Three supplies cost 4, 3 and 2 coins. You have 8 coins.|Choose which supplies are essential|Buy them all for 9 coins|Spend without checking prices|The total of 9 is greater than the available 8.|Prioritise within a limit
Improve|Check a failed step|A route crosses a cell later marked closed.|Find the first step that enters the cell|Change the last step only|Redraw the start as the finish|Find the exact point where the route fails.|Debug a plan
Improve|Think about accessibility|A building entrance has steps but no step-free route.|Add a usable step-free route|Move the sign inside|Make the steps higher|Different people need access to the same place.|Evaluate who can use a design
Test|Compare two plans|Two paths meet the same goal. One uses 7 steps, the other 10.|The 7-step path is shorter|The 10-step path is shorter|They have equal length|Compare the same measure for both plans.|Choose with numerical evidence
Test|Identify a trade-off|A route saves time but crosses an exposed area in a storm.|A longer sheltered route may be safer|Always select the fastest route|Ignore the weather|Speed is only one condition.|Weigh safety and time
Test|Use a model|A small cardboard bridge shows where a beam bends.|Test a reinforcing idea on the model|Assume all full-size bridges are identical|Ignore what bends|Models can help study a design before building it.|Use a model to guide a change
Test|Control a variable|You compare two bridge shapes under the same load.|Keep materials and load the same|Change shape, material and load together|Use no load on one bridge|A fair comparison changes one factor.|Plan a fair design test
Apply|Choose a safe alternative route|A flood blocks the shortest route to school.|Use a signed dry route with an adult|Cross floodwater because it is shorter|Remove the warnings|A new constraint can change the best plan.|Replan under a safety constraint
Apply|Interpret a map scale|Each grid square stands for 10 metres. A route uses 6 squares.|60 metres|16 metres|6 metres|Multiply map units by the scale.|Convert map length to actual distance
Apply|Combine a plan and a budget|One route is shorter but needs supplies over budget.|Choose a route that meets both limits|Choose by distance only|Choose the most expensive supplies|A useful solution satisfies all required constraints.|Check more than one criterion
Apply|Make a backup plan|A village route depends on one narrow crossing.|Prepare a safe alternative crossing|Remove all maps|Use the crossing under every condition|A fallback helps when the first route is unavailable.|Plan for an interruption`);
  const community = rows(`
Care|Notice a classmate who needs help|A classmate drops books while carrying too much.|Offer to help carry some|Laugh at the books|Walk over the books|Notice a need and offer help.|Choose a caring response
Care|Include a newcomer|A new player does not know the rules.|Explain the rules and invite them to join|Exclude the player|Hide the equipment|Sharing information helps others join.|Practise inclusion
Care|Listen and take turns|Two friends are trying to speak at once.|Let each person finish|Interrupt both friends|Decide without listening|Understanding requires listening.|Choose a fair way to listen
Care|Say thank you with a reason|A neighbour returns a missing basket.|Thank them for returning the basket|Ask for another basket immediately|Pretend nobody helped|Name what you are thankful for.|Express gratitude clearly
Fairness|Share time fairly|Four players want the same ball.|Agree on timed turns|Give one player the whole session|Hide the ball|Set a rule everyone can follow.|Plan fair turns
Fairness|Respect shared rules|The team changes a rule after scoring.|Discuss and agree before the next game|Change the rule secretly|Only tell the winning team|Rules should be known before play.|Recognise a fair process
Fairness|Return something borrowed|A friend lent you a pencil for one lesson.|Return it when promised|Keep it without asking|Pass it to someone else|Keeping a promise builds trust.|Act responsibly with borrowed things
Fairness|Share by need|One child has several sheets and another has none.|Give enough so both can work|Give all sheets to one child|Hide the extra paper|Fairness sometimes means responding to different needs.|Choose an equitable allocation
Honesty|Correct a mistake|You receive more change than you paid for.|Tell the shopkeeper and return the extra|Hide it|Blame another customer|Honesty includes correcting a mistake that benefits you.|Practise returning extra change
Honesty|Tell what you actually saw|Friends ask about a broken cup you did not see break.|Say you did not see what happened|Guess and call it a fact|Repeat a rumour as proof|Uncertainty is an honest answer.|Distinguish evidence from guesses
Honesty|Accept responsibility|You knocked over a pot accidentally.|Explain what happened and ask how to help|Blame someone else|Hide the pot|Taking responsibility helps repair harm.|Choose a repair action
Honesty|Respect another person’s work|You use a friend’s idea in a group display.|Say who shared the idea|Claim it was only yours|Erase names from the display|Give credit for contributions.|Attribute an idea
Cooperation|Divide roles|A group must set up chairs and signs.|Agree who will do each job|Have everyone do one job only|Leave every job for one pupil|Roles help a group cover the work.|Plan a division of work
Cooperation|Share a disagreement respectfully|Two groups want the same room at the same time.|Discuss times that both groups can use|Shout until one group leaves|Lock the room|Listen to needs and look for a compromise.|Resolve a shared-resource problem
Cooperation|Ask for safe help|A heavy branch blocks the school path.|Keep clear and tell a responsible adult|Move it alone|Ask younger children to climb it|Get help when the task is unsafe alone.|Identify the right helper
Cooperation|Change a plan together|A planned meeting place is closed.|Agree on another place and tell everyone|Move without telling others|Wait in an unsafe spot|Communicate changes to everyone involved.|Update a group plan
Stewardship|Care for shared water|A public tap keeps dripping.|Tell the caretaker so it can be repaired|Leave it until tomorrow without telling anyone|Open the tap wider|Small losses add up when they continue.|Protect a shared resource
Stewardship|Use resources again|An old notebook has many clean pages.|Use the blank pages for drafts|Throw it into the road|Buy new paper before looking|Reuse useful material before replacing it.|Choose a resource-saving action
Stewardship|Protect a community path|People shortcut through a planted area.|Use and sign the marked path|Remove all plants|Move the path through the new bed|Separate walking space from planted areas.|Protect a shared space
Stewardship|Protect others’ privacy|You are about to share a photo of a classmate.|Ask their permission first|Post without asking|Add the classmate’s address|People should decide what is shared about them.|Make a responsible sharing choice
Leadership|Gather evidence before deciding|The class is choosing which school area needs help first.|Inspect each area and ask people using it|Guess without visiting|Choose only your favourite corner|A decision improves when it uses evidence and views.|Compare community needs
Leadership|Plan and assign responsibilities|A clean-up needs gloves, bags and a safe collection point.|Check supplies, safety and roles before starting|Begin without telling anyone|Ask children to handle sharp waste|Planning helps people work safely.|Set a practical action plan
Leadership|Check that an action worked|The class added signs to stop litter at a gate.|Compare litter counts before and after|Assume signs always work|Count rubbish at an unrelated site|Use comparable evidence to evaluate a change.|Measure an outcome
Leadership|Revise a fair decision|A plan helps one group but makes access harder for another.|Listen and revise the plan to include both groups|Keep the plan and ignore the feedback|Give up on all improvements|A leader can adjust a plan after listening.|Improve a plan using feedback`);
  const surveys = {
    racing: ['Mathematics', 'road supplies', 5], runner: ['Wildlife', 'savannah trail', 3],
    penalty: ['Mathematics', 'football training', 3], pilot: ['Science', 'flight field notes', 3],
    village: ['Design', 'village planning', 3], kitchen: ['Science', 'kitchen notebook', 3],
    bubbles: ['Mathematics', 'bubble groups', 3], jungle: ['English', 'jungle trail signs', 4],
    rescue: ['Wildlife', 'rescue field station', 3], farm: ['Science', 'farm notebook', 3],
    bridge: ['Design', 'bridge engineering', 3], ocean: ['Wildlife', 'coast expedition', 3],
    balloons: ['Mathematics', 'balloon bundles', 3], letters: ['English', 'word workshop', 3],
    memory: ['Wildlife', 'field guide card pairs', 3], robot: ['Design', 'robot route planning', 3],
    market: ['Mathematics', 'market stock', 3], shapes: ['Mathematics', 'shape workshop', 3],
    speak: ['English', 'spoken door clues', 3], faith: ['Community', 'values reflection', 3],
  };
  const tracks = { Mathematics:math, English:english, Wildlife:animals, Science:science, Design:design, Community:community };
  const racingIndices = [0,1,2,3,4,5,7,8,10,11,13,14,16,17,18,20,22,23];
  const games = Object.keys(surveys);
  const variantOffsets={runner:1,pilot:1,village:2,kitchen:2,jungle:1,memory:2,ocean:3,speak:2,shapes:3,robot:1};
  const statement=(text,answer,wrong,context='',explanation='')=>({
    text, answer:String(answer), choices:[String(answer),...wrong.map(String)], context, explanation,
  });
  const numeric = (text,n,context='')=>statement(text,n,[n+1,n===0 ? 2 : n-1],context);
  function mathItem(topic, level, i, seed, setting) {
    const a=topic===0 ? i+1+(seed%4) : level+i+seed;
    const b=2+i+(seed%3);
    const c=3+(i%3);
    const total=a+b;
    const share=b*c;
    const note='Mission: '+setting+'.';
    switch (topic) {
      case 0: return numeric('How many marks do you see?',a,Array(a).fill('●').join(' '));
      case 1: return numeric('One group has '+a+' objects and another has '+total+'. How many more are in the larger group?',b,note);
      case 2: return numeric('What number has '+b+' tens and '+c+' ones?',10*b+c,note);
      case 3: return numeric('One group has '+a+'. Another group has '+b+'. How many altogether?',total,note);
      case 4: return numeric(a+' + □ = '+total+'. What belongs in the box?',b,note);
      case 5: return numeric('Start at '+(7+i)+'. Add '+(b+5)+' by making a ten first. What total do you reach?',12+i+b,note);
      case 6: return numeric('Add '+a+', '+b+' and '+c+'. What is the total?',total+c,note);
      case 7: return numeric('Start with '+total+'. Take away '+b+'. How many remain?',a,note);
      case 8: return numeric('What is the difference between '+(total+c)+' and '+a+'?',b+c,note);
      case 9: return numeric('After removing '+b+', '+a+' remain. How many were there at the start?',total,note);
      case 10: return numeric('There are '+c+' groups with '+b+' in each. How many in all?',share,note);
      case 11: return numeric('How many spaces in '+c+' rows of '+a+'?',c*a,note);
      case 12: return numeric('A supply list needs '+a+' items. Make '+c+' times that number. How many?',a*c,note);
      case 13: return numeric('Share '+share+' items equally among '+c+' people. How many does each get?',b,note);
      case 14: return numeric('Make groups of '+b+' from '+(share+b+i*b)+'. How many full groups?',c+1+i,note);
      case 15: return numeric('Pack '+(share+1+i%b)+' items in bundles of '+b+'. How many are left over?',1+i%b,note);
      case 16: return numeric('What is one half of '+(2*a)+'?',a,note);
      case 17: return numeric('What is one third of '+(3*a)+'?',a,note);
      case 18: return numeric('What is three quarters of '+(4*a)+'?',3*a,note);
      case 19: return numeric('Fill the missing top number: 1/2 = □/'+(2*b)+'.',b,note);
      case 20: return numeric('Start with '+a+' supplies, collect '+b+' more, then deliver '+c+'. How many are left?',total-c,note);
      case 21: return numeric('There are '+c+' trays of '+a+' plus '+b+' loose pieces. How many pieces altogether?',c*a+b,note);
      case 22: return numeric('Each box holds '+b+' pieces. How many boxes do you need for '+(share+1)+' pieces, including the final partly filled box?',c+1,note);
      case 23: return numeric('Start with '+(3*a+b)+', use '+b+', then save a third of what is left. How many do you save?',a,note);
    }
    throw new Error('Unknown maths objective');
  }
  const writingPrompts=[
    'Write a new sentence about an animal moving. Use a verb that shows how it moves.',
    'Write a sentence that shows someone is nervous through an action they take.',
    'Begin a story with a named character and a problem the character notices.',
    'Describe a quiet place. Include one sound a visitor could hear.',
    'End a short story in which a missing object is found just in time.',
  ];
  function englishItems(index) {
    const row=english[index];
    const peers=english.filter(r=>r!==row && r[0]===row[0]);
    const alternatives=peers.slice(0,2);
    const primary=statement(row[6],row[3],[row[4],row[5]],row[2]);
    const tasks=[
      primary,
      statement('Which completed reading fits this clue?',row[7],alternatives.map(r=>r[7]),row[2]),
      statement('Which instruction would help you solve the clue?',row[1], alternatives.map(r=>r[1]), row[2]+' · '+row[6]),
    ];
    if (row[0]==='Creative Writing') tasks[2]={text:writingPrompts[index-19],context:'Write your own idea. Re-read it before continuing.',format:'writing'};
    tasks.push(statement('Read the clue again. Which example practises this same skill?',row[2],alternatives.map(r=>r[2]),row[1]));
    return tasks;
  }
  function fieldItems(track, index, setting) {
    const r=track[index];
    const alternatives=track.filter(row=>row!==r && row[0]===r[0]).slice(0,2);
    return [
      statement('Which answer fits this situation?',r[3],[r[4],r[5]],r[2],r[6]),
      statement('Which observation or reason supports your answer?',r[6],alternatives.map(row=>row[6]),r[2]),
      statement('What would be the best next task for this mission?',r[7],alternatives.map(row=>row[7]),setting+' · '+r[2]),
    ];
  }
  const hooks={ racing:'Road gates', runner:'Trail observation stops', penalty:'Match analysis breaks', pilot:'Flight notebook stops',
    village:'Planning inspections', kitchen:'Kitchen notebook stops', bubbles:'Cluster analysis breaks', jungle:'Trail forks',
    rescue:'Rescue case decisions', farm:'Farm notebook decisions', bridge:'Crossing design decisions', ocean:'Expedition decisions',
    balloons:'Balloon challenges and in-flight number checks', letters:'Letter and writing challenges', memory:'Field clue and answer pairs',
    robot:'Route design checks', market:'Customer calculations', shapes:'Shape design checks', speak:'Door clues and speaking/writing tasks', faith:'Values decisions' };
  const direct = new Set(['racing','jungle','rescue','farm','bridge','ocean','letters','balloons','faith','speak','memory']);
  function game(id, level) {
    const [domain,setting,count]=surveys[id];
    const index=id==='racing' ? racingIndices[level-1] : level-1;
    const track=tracks[domain];
    const stage=track[index][0];
    const peers=track.map((row,i)=>row[0]===stage ? i : -1).filter(i=>i>=0);
    const trackIndex=peers[(peers.indexOf(index)+(variantOffsets[id] || 0))%peers.length];
    const [,topic,focus]=track[trackIndex];
    const items=domain==='Mathematics'
      ? Array.from({length:count},(_,i)=>mathItem(index,level,i,games.indexOf(id)+1,setting))
      : domain==='English' ? englishItems(trackIndex) : fieldItems(track,trackIndex,setting);
    // The trail uses three choice forks, followed by a writing station in creative episodes.
    const selected=id==='jungle' ? items.filter(item=>item.format!=='writing').concat(items.filter(item=>item.format==='writing')) : items.slice(0,count);
    return { id, level, domain, stage, topic, focus:domain==='Mathematics'?focus:topic,
      objective:domain==='Mathematics'?focus+' during '+setting:topic+' using '+setting,
      difficulty:Math.min(6,1+Math.floor(index/4)), mode:hooks[id], direct:direct.has(id),
      items:selected.map((item,i)=>({...item,id:id+':'+level+':'+(i+1)})) };
  }
  const safariMap=[
    ['Food preparation','Prepare ingredients safely and follow a recipe','Practical activity'],
    ['Recognition','Identify wildlife using visible clues','Field identification'],
    ['Habitats','Match an animal to the place that meets its needs','Habitat matching'],
    ['Diets','Group animals by the foods they eat','Food evidence'],
    ['Classification','Classify by observable traits and life cycles','Field classification'],
    ['Ecosystems','Trace relationships between plants and animals','Food chain'],
    ['Conservation','Choose actions that reduce disturbance or pollution','Conservation decision'],
  ];
  const safariIndices=[null,1,5,9,14,17,22];
  function story(episode) {
    const [stage,objective,mode]=safariMap[episode-1];
    return {id:'safari',level:episode,domain:episode===1?'Science':'Wildlife',stage,topic:stage,focus:objective,objective,difficulty:episode,mode,
      practical:episode===1?['Read the invitation','Select the ingredients','Pay at the market','Prepare the salad','Invite a guest']:[],
      items:episode===1?[]:fieldItems(animals,safariIndices[episode-1],'Safari with Nuru').map((q,i)=>({...q,id:'safari:'+episode+':'+(i+1)}))};
  }
  return { games, game, story, safariCount:safariMap.length };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = EpisodeContent;
