/* Vocabulary, lessons and quiz data. */

const LANGS = {
  en: { name: 'English', tts: 'en' },
};

/* [sw, en, fr, zh, zhPinyin, ar, arTranslit] */
const VOCAB = {
  'Salamu': [
    ['Habari', 'Hello', 'Bonjour', '你好', 'nǐ hǎo', 'مرحبا', 'marhaban'],
    ['Asante', 'Thank you', 'Merci', '谢谢', 'xièxie', 'شكرا', 'shukran'],
    ['Tafadhali', 'Please', "S'il te plaît", '请', 'qǐng', 'من فضلك', 'min fadlak'],
    ['Kwaheri', 'Goodbye', 'Au revoir', '再见', 'zàijiàn', 'مع السلامة', "ma'a as-salama"],
    ['Ndiyo', 'Yes', 'Oui', '是', 'shì', 'نعم', "na'am"],
    ['Hapana', 'No', 'Non', '不', 'bù', 'لا', 'lā'],
  ],
  'Namba': [
    ['Moja', 'One', 'Un', '一', 'yī', 'واحد', 'wāhid'],
    ['Mbili', 'Two', 'Deux', '二', 'èr', 'اثنان', 'ithnān'],
    ['Tatu', 'Three', 'Trois', '三', 'sān', 'ثلاثة', 'thalātha'],
    ['Nne', 'Four', 'Quatre', '四', 'sì', 'أربعة', "arba'a"],
    ['Tano', 'Five', 'Cinq', '五', 'wǔ', 'خمسة', 'khamsa'],
    ['Sita', 'Six', 'Six', '六', 'liù', 'ستة', 'sitta'],
    ['Saba', 'Seven', 'Sept', '七', 'qī', 'سبعة', "sab'a"],
    ['Nane', 'Eight', 'Huit', '八', 'bā', 'ثمانية', 'thamāniya'],
    ['Tisa', 'Nine', 'Neuf', '九', 'jiǔ', 'تسعة', "tis'a"],
    ['Kumi', 'Ten', 'Dix', '十', 'shí', 'عشرة', "'ashara"],
  ],
  'Rangi': [
    ['Nyekundu', 'Red', 'Rouge', '红色', 'hóngsè', 'أحمر', 'ahmar'],
    ['Bluu', 'Blue', 'Bleu', '蓝色', 'lánsè', 'أزرق', 'azraq'],
    ['Njano', 'Yellow', 'Jaune', '黄色', 'huángsè', 'أصفر', 'asfar'],
    ['Kijani', 'Green', 'Vert', '绿色', 'lǜsè', 'أخضر', 'akhdar'],
    ['Nyeusi', 'Black', 'Noir', '黑色', 'hēisè', 'أسود', 'aswad'],
    ['Nyeupe', 'White', 'Blanc', '白色', 'báisè', 'أبيض', 'abyad'],
  ],
  'Familia': [
    ['Mama', 'Mother', 'Mère', '妈妈', 'māma', 'أم', 'umm'],
    ['Baba', 'Father', 'Père', '爸爸', 'bàba', 'أب', 'ab'],
    ['Kaka', 'Brother', 'Frère', '哥哥', 'gēge', 'أخ', 'akh'],
    ['Dada', 'Sister', 'Sœur', '姐姐', 'jiějie', 'أخت', 'ukht'],
    ['Bibi', 'Grandmother', 'Grand-mère', '奶奶', 'nǎinai', 'جدة', 'jadda'],
    ['Babu', 'Grandfather', 'Grand-père', '爷爷', 'yéye', 'جد', 'jadd'],
  ],
  'Wanyama': [
    ['Simba', 'Lion', 'Lion', '狮子', 'shīzi', 'أسد', 'asad'],
    ['Tembo', 'Elephant', 'Éléphant', '大象', 'dàxiàng', 'فيل', 'fīl'],
    ['Twiga', 'Giraffe', 'Girafe', '长颈鹿', 'chángjǐnglù', 'زرافة', 'zarāfa'],
    ['Mbwa', 'Dog', 'Chien', '狗', 'gǒu', 'كلب', 'kalb'],
    ['Paka', 'Cat', 'Chat', '猫', 'māo', 'قطة', 'qiṭṭa'],
    ['Ndege', 'Bird', 'Oiseau', '鸟', 'niǎo', 'طائر', "ṭā'ir"],
    ['Samaki', 'Fish', 'Poisson', '鱼', 'yú', 'سمكة', 'samaka'],
  ],
  'Chakula': [
    ['Maji', 'Water', 'Eau', '水', 'shuǐ', 'ماء', "mā'"],
    ['Maziwa', 'Milk', 'Lait', '牛奶', 'niúnǎi', 'حليب', 'ḥalīb'],
    ['Mkate', 'Bread', 'Pain', '面包', 'miànbāo', 'خبز', 'khubz'],
    ['Wali', 'Rice', 'Riz', '米饭', 'mǐfàn', 'أرز', 'aruzz'],
    ['Ndizi', 'Banana', 'Banane', '香蕉', 'xiāngjiāo', 'موز', 'mawz'],
    ['Chungwa', 'Orange', 'Orange', '橙子', 'chéngzi', 'برتقال', 'burtuqāl'],
    ['Embe', 'Mango', 'Mangue', '芒果', 'mángguǒ', 'مانجو', 'mānjū'],
  ],
  'Mwili': [
    ['Kichwa', 'Head', 'Tête', '头', 'tóu', 'رأس', "ra's"],
    ['Mkono', 'Hand', 'Main', '手', 'shǒu', 'يد', 'yad'],
    ['Mguu', 'Leg', 'Jambe', '腿', 'tuǐ', 'رجل', 'rijl'],
    ['Jicho', 'Eye', 'Œil', '眼睛', 'yǎnjing', 'عين', "'ayn"],
    ['Pua', 'Nose', 'Nez', '鼻子', 'bízi', 'أنف', 'anf'],
    ['Mdomo', 'Mouth', 'Bouche', '嘴', 'zuǐ', 'فم', 'fam'],
  ],
};
function vocabWord(row) {
  return { word: row[1], say: row[1] };
}

const LESSONS = {
  sayansi: {
    name: "Science", icon: 'sunrise', color: 'var(--teal)',
    cards: [
      { t: "Sun", x: "The sun gives us light and heat. Plants need the sun to grow.", q: ["What do plants need to grow?", ["Sun and water", "Candy", "Phone"], 0] },
      { t: "Water", x: "Water can be ice (solid), water (liquid) or steam (gas).", q: ["What does water become when it freezes?", ["Steam", "Ice", "Sand"], 1] },
      { t: "Plants", x: "A plant has roots, a stem, leaves and flowers. The roots take up water from the ground.", q: ["Which part of a plant takes up water?", ["Flower", "Leaf", "Root"], 2] },
      { t: "Animals", x: "Lions, leopards and hyenas eat meat. Zebras mostly eat grass. Giraffes eat leaves from trees.", q: ["What does a giraffe eat?", ["Leaves", "Meat", "Fish"], 0] },
      { t: "Weather", x: "Rain falls when water droplets in clouds grow large enough to fall. Rain helps plants and rivers.", q: ["Where does rain come from?", ["Clouds", "Sun", "Mountain"], 0] },
      { t: "Our body", x: "The heart pumps blood around the body. The lungs help us breathe.", q: ["Which organ helps us breathe?", ["Heart", "Lungs", "Stomach"], 1] },
      { t: "Planets", x: "The Earth goes around the sun. One full trip is one year.", q: ["What does the Earth go around?", ["The Moon", "Sun", "Stars"], 1] },
      { t: "Tanzania", x: "Mount Kilimanjaro is the highest mountain in Africa. It is in Tanzania.", q: ["What is the highest mountain in Africa?", ["Meru", "Kilimanjaro", "Uluguru"], 1] },
    ],
  },
  maisha: {
    name: "Life skills", icon: 'heart', color: 'var(--coral)',
    cards: [
      { t: "Wash your hands", x: "Wash your hands with soap and clean water before eating and after using the toilet.", q: ["When do we wash our hands?", ["Before eating", "Only after sleeping", "We don't wash them"], 0] },
      { t: "Crossing the road", x: "Stop, look right, left, then right again. Cross with an adult.", q: ["What do we do before crossing the road?", ["We run", "We look both ways", "We close our eyes"], 1] },
      { t: "Strangers", x: "Don't go with a stranger, even if they give you a gift. Tell your parent or teacher.", q: ["If a stranger gives you candy, what should you do?", ["Go with them", "Say no and tell your parent", "Give them your phone number"], 1] },
      { t: "Savings", x: "When you get money, keep a little as savings. Savings help you buy something big later.", q: ["What are savings?", ["Money you spend all of", "Money you keep for later", "Money to lose"], 1] },
      { t: "Need or want", x: "Food, water and clothes are needs. Toys and candy are wants.", q: ["Which one is a need?", ["Water", "Candy", "Doll"], 0] },
      { t: "Fire", x: "Don't play with fire, matches or the stove. If you see a fire, call an adult quickly.", q: ["What do you do if you see a fire?", ["Play with it", "Call an adult", "Hide"], 1] },
      { t: "Tidying up", x: "Put your things back in their place after using them. A tidy room looks nice.", q: ["What do you do after playing with toys?", ["Leave them on the floor", "Put them back in their place", "Throw them away"], 1] },
    ],
  },
  hisia: {
    name: "My feelings", icon: 'user', color: 'var(--blue)',
    cards: [
      { t: "Happiness", x: "When you are happy you smile. You can share your happiness with others.", q: ["What do you do when you are happy?", ["You smile", "You cry", "You shout"], 0] },
      { t: "Anger", x: "When you are angry, stop, take three deep breaths, then say how you feel.", q: ["What should you do first when you are angry?", ["Hit someone", "Take a deep breath", "Break something"], 1] },
      { t: "Sadness", x: "When you are sad it's okay to cry. Tell a parent or friend how you feel.", q: ["Who can you tell when you are sad?", ["Parent", "Nobody", "A stranger on the street"], 0] },
      { t: "Fear", x: "When you are scared, stay close to an adult you trust and tell them what scares you.", q: ["What do you do when you are scared?", ["Stay quiet", "Tell an adult", "Run far away alone"], 1] },
      { t: "Saying sorry", x: "If you hurt someone, say \"sorry\" and try to make it right.", q: ["What do you say when you hurt a friend?", ["Sorry", "I don't care", "Go away"], 0] },
      { t: "Sharing", x: "Sharing toys and food builds good friendships.", q: ["What does a good friend do?", ["Shares", "Grabs things", "Laughs at others"], 0] },
    ],
  },
};

const FAITH = {
  islam: {
    name: "Islam",
    cards: [
      { t: "Bismillah", ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', tr: 'Bismillāhi r-raḥmāni r-raḥīm', x: "In the name of Allah, the Most Gracious, the Most Merciful. We say it before starting anything." },
      { t: "Before eating", ar: 'بِسْمِ اللَّهِ', tr: 'Bismillāh', x: "We say \"Bismillah\" before eating, and we eat with the right hand." },
      { t: "After eating", ar: 'الْحَمْدُ لِلَّهِ', tr: 'Al-ḥamdu lillāh', x: "All praise is for Allah. We give thanks after eating." },
      { t: "Before sleeping", ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', tr: 'Bismika Allāhumma amūtu wa aḥyā', x: "In Your name, O Allah, I die (sleep) and I live (wake up)." },
      { t: "Surat Al-Fatiha", ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', tr: 'Al-ḥamdu lillāhi rabbi l-ʿālamīn. Ar-raḥmāni r-raḥīm. Māliki yawmi d-dīn. Iyyāka naʿbudu wa iyyāka nastaʿīn. Ihdinā ṣ-ṣirāṭa l-mustaqīm. Ṣirāṭa lladhīna anʿamta ʿalayhim, ghayri l-maghḍūbi ʿalayhim wa lā ḍ-ḍāllīn.', x: "The first chapter of the Qur'an. We recite it in every rak'ah of prayer." },
      { t: "The five pillars of Islam", x: "Shahada, Salah (prayer), Zakat, Sawm (fasting in Ramadan) and Hajj." },
      { t: "The five daily prayers", x: "Fajr, Dhuhr, Asr, Maghrib and Isha. Before praying we make wudu." },
      { t: "Wudu in brief", x: "Intention, wash the hands, rinse the mouth, rinse the nose, wash the face, wash the arms to the elbows, wipe the head, wash the ears, wash the feet to the ankles." },
      { t: "Greeting", ar: 'السَّلَامُ عَلَيْكُمْ', tr: 'As-salāmu ʿalaykum', x: "Peace be upon you. Reply: Wa ʿalaykumu s-salām." },
    ],
    quiz: [
      ["What do we say before eating?",["Bismillah","Goodbye","Thank you"],0],
      ["How many obligatory prayers are there each day?",["Three","Five","Seven"],1],
      ["The holy book of Islam is?",["Qur'an","Dictionary","Notebook"],0],
      ["Which is the month of fasting?",["Ramadan","December","Shawwal"],0],
      ["Which city is the Kaaba in?",["Medina","Mecca","Dar es Salaam"],1],
      ["What do we say after eating?",["Alhamdulillah","Hello","Sorry"],0],
      ["What do we do before prayer?",["We play","We make wudu","We sleep"],1],
      ["The festival after Ramadan is?",["Eid al-Fitr","Christmas","New Year"],0],
      ["Who is the last prophet?",["Prophet Muhammad (pbuh)","Prophet Nuh (as)","Prophet Musa (as)"],0],
      ["How do we greet a fellow Muslim?",["As-salamu alaykum","Goodbye","Hello"],0],
    ],
  },
  christian: {
    name: "Christianity",
    cards: [
      { t: "The Lord's Prayer", x: "Our Father in heaven, hallowed be your name. Your kingdom come. Your will be done on earth as it is in heaven. Give us today our daily bread. Forgive us our sins, as we forgive those who sin against us. Lead us not into temptation, but deliver us from evil. Amen." },
      { t: "Prayer before eating", x: "Thank you God for this food. Bless it, and bless those who prepared it. In Jesus' name, Amen." },
      { t: "Bedtime prayer", x: "My God, thank you for today. Protect me tonight, and protect my family. In Jesus' name, Amen." },
      { t: "The birth of Jesus", x: "Jesus was born in Bethlehem. His mother is Mary and Joseph raised him. We celebrate his birth at Christmas." },
      { t: "Noah's Ark", x: "God told Noah to build an ark. Noah, his family and the animals, two by two, were saved during the flood." },
      { t: "David and Goliath", x: "David was a young boy, but with faith in God he defeated the giant Goliath with a sling and a stone." },
      { t: "The greatest commandment", x: "Jesus said: Love the Lord your God with all your heart, and love your neighbor as yourself." },
      { t: "The Good Samaritan", x: "The Samaritan helped a man who was hurt on the road, even though he didn't know him. Jesus teaches us to help everyone." },
    ],
    quiz: [
      ["In which town was Jesus born?",["Bethlehem","Nazareth","Dodoma"],0],
      ["What is the name of Jesus' mother?",["Mary","Sarah","Ruth"],0],
      ["The holy book of Christians is?",["The Bible","Dictionary","Newspaper"],0],
      ["Who built the ark?",["Moses","Noah","Peter"],1],
      ["Who did David defeat?",["Goliath","Pharaoh","Herod"],0],
      ["The festival of Jesus' birth is?",["Easter","Christmas","Eid"],1],
      ["The festival of Jesus' resurrection is?",["Easter","Christmas","New Year"],0],
      ["The prayer Jesus taught us begins with?",["Our Father","Hello everyone","Thank you very much"],0],
      ["How many disciples did Jesus have?",["Seven","Twelve","Three"],1],
      ["What did the Good Samaritan do?",["He helped a man who was hurt","He ran away","He laughed"],0],
    ],
  },
  values: {
    name: "Values",
    cards: [
      { t: "Telling the truth", x: "An honest person is trusted by everyone. Even when you make a mistake, tell the truth." },
      { t: "Respect", x: "Respect parents, teachers and elders. Say \"shikamoo\" to older people." },
      { t: "Gratitude", x: "Say \"thank you\" when someone helps you or gives you something." },
      { t: "Helping", x: "Help others at home and at school: carrying, sweeping, teaching your younger sibling." },
      { t: "Forgiving", x: "If a friend says sorry, forgive them. Forgiving brings peace." },
      { t: "Hard work", x: "Work hard even when things are difficult. Every day you grow more." },
    ],
    quiz: [
      ["What do you say when someone helps you?",["Thank you","Go away","I don't care"],0],
      ["What do you do when you make a mistake?",["Hide it","Tell the truth","Blame someone else"],1],
      ["How can you show respect when greeting a grandparent?",["Say hello politely","Shout","Ignore them"],0],
      ["When a friend says sorry?",["You forgive them","You hate them","You hit them"],0],
      ["When your younger sibling can't do a task?",["You laugh at them","You help them","You send them away"],1],
      ["When a task is hard?",["You give up","You try hard","You just cry"],1],
    ],
  },
};
