/* HUGO KID - content.js : maudhui ya masomo, lugha na imani */

const LANGS = {
  en: { name: 'English', tts: 'en' },
  fr: { name: 'Français', tts: 'fr' },
  zh: { name: '中文 Kichina', tts: 'zh' },
  ar: { name: 'العربية Kiarabu', tts: 'ar' },
  sw: { name: 'Kiswahili', tts: 'sw' },
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
function vocabWord(row, lang) {
  if (lang === 'sw') return { word: row[0], sub: '', say: row[0] };
  if (lang === 'en') return { word: row[1], sub: '', say: row[1] };
  if (lang === 'fr') return { word: row[2], sub: '', say: row[2] };
  if (lang === 'zh') return { word: row[3], sub: row[4], say: row[3] };
  return { word: row[5], sub: row[6], say: row[5] };
}

/* Kadi za masomo: { t: kichwa, x: maelezo, q: [swali, [chaguo], indexSahihi] } */
const LESSONS = {
  sayansi: {
    name: 'Sayansi', icon: 'sunrise', color: 'var(--teal)',
    cards: [
      { t: 'Jua', x: 'Jua linatupa mwanga na joto. Mimea inahitaji jua ili ikue.', q: ['Mimea inahitaji nini ili ikue?', ['Jua na maji', 'Pipi', 'Simu'], 0] },
      { t: 'Maji', x: 'Maji yanaweza kuwa barafu (gumu), maji (kimiminika) au mvuke (gesi).', q: ['Maji yakiganda yanakuwa nini?', ['Mvuke', 'Barafu', 'Mchanga'], 1] },
      { t: 'Mimea', x: 'Mmea una mizizi, shina, majani na maua. Mizizi inanyonya maji kutoka ardhini.', q: ['Sehemu gani ya mmea inanyonya maji?', ['Ua', 'Jani', 'Mzizi'], 2] },
      { t: 'Wanyama', x: 'Simba, chui na fisi wanakula nyama. Pundamilia na twiga wanakula majani.', q: ['Twiga anakula nini?', ['Majani', 'Nyama', 'Samaki'], 0] },
      { t: 'Hali ya hewa', x: 'Mawingu yakijaa maji, mvua inanyesha. Mvua inasaidia mimea na mito.', q: ['Mvua inatoka wapi?', ['Mawingu', 'Jua', 'Mlima'], 0] },
      { t: 'Mwili wetu', x: 'Moyo unasukuma damu mwilini. Mapafu yanatusaidia kupumua.', q: ['Kiungo gani kinatusaidia kupumua?', ['Moyo', 'Mapafu', 'Tumbo'], 1] },
      { t: 'Sayari', x: 'Dunia inazunguka jua. Mzunguko mmoja kamili ni mwaka mmoja.', q: ['Dunia inazunguka nini?', ['Mwezi', 'Jua', 'Nyota'], 1] },
      { t: 'Tanzania', x: 'Mlima Kilimanjaro ndio mlima mrefu kuliko yote Afrika. Uko Tanzania.', q: ['Mlima mrefu zaidi Afrika ni upi?', ['Meru', 'Kilimanjaro', 'Uluguru'], 1] },
    ],
  },
  maisha: {
    name: 'Ujuzi wa maisha', icon: 'heart', color: 'var(--coral)',
    cards: [
      { t: 'Osha mikono', x: 'Osha mikono kwa sabuni na maji safi kabla ya kula na baada ya kutoka chooni.', q: ['Lini tunaosha mikono?', ['Kabla ya kula', 'Baada ya kulala tu', 'Hatuoshi'], 0] },
      { t: 'Kuvuka barabara', x: 'Simama, angalia kulia, kushoto, kisha kulia tena. Vuka ukiwa na mtu mzima.', q: ['Kabla ya kuvuka barabara tunafanya nini?', ['Tunakimbia', 'Tunaangalia pande zote', 'Tunafunga macho'], 1] },
      { t: 'Mtu usiyemjua', x: 'Usiende na mtu usiyemjua, hata akikupa zawadi. Mwambie mzazi au mwalimu.', q: ['Mtu usiyemjua akikupa pipi ufanye nini?', ['Uende naye', 'Ukatae na umwambie mzazi', 'Umpe namba ya simu'], 1] },
      { t: 'Akiba', x: 'Ukipata pesa, weka kidogo kama akiba. Akiba inakusaidia kununua kitu kikubwa baadaye.', q: ['Akiba ni nini?', ['Pesa unayotumia yote', 'Pesa unayoweka kwa baadaye', 'Pesa ya kupoteza'], 1] },
      { t: 'Nahitaji au nataka', x: 'Chakula, maji na nguo ni mahitaji. Midoli na pipi ni matakwa.', q: ['Kipi ni hitaji?', ['Maji', 'Pipi', 'Mdoli'], 0] },
      { t: 'Moto', x: 'Usichezee moto, kiberiti wala jiko. Ukiona moto, mwite mtu mzima haraka.', q: ['Ukiona moto unafanya nini?', ['Unaucheza', 'Unamwita mtu mzima', 'Unajificha'], 1] },
      { t: 'Kupanga vitu', x: 'Weka vitu vyako mahali pake baada ya kuvitumia. Chumba safi kinapendeza.', q: ['Baada ya kucheza na midoli unafanya nini?', ['Unaiacha chini', 'Unairudisha mahali pake', 'Unaitupa'], 1] },
    ],
  },
  hisia: {
    name: 'Hisia zangu', icon: 'user', color: 'var(--blue)',
    cards: [
      { t: 'Furaha', x: 'Ukiwa na furaha unatabasamu. Unaweza kushiriki furaha yako na wengine.', q: ['Ukiwa na furaha unafanya nini?', ['Unatabasamu', 'Unalia', 'Unapiga kelele'], 0] },
      { t: 'Hasira', x: 'Ukiwa na hasira, simama, vuta pumzi ndefu mara tatu, kisha sema unavyojisikia.', q: ['Ukiwa na hasira ufanye nini kwanza?', ['Umpige mtu', 'Uvute pumzi ndefu', 'Uvunje kitu'], 1] },
      { t: 'Huzuni', x: 'Ukiwa na huzuni ni sawa kulia. Mweleze mzazi au rafiki unavyojisikia.', q: ['Ukiwa na huzuni unaweza kumweleza nani?', ['Mzazi', 'Hakuna mtu', 'Mgeni barabarani'], 0] },
      { t: 'Hofu', x: 'Ukiogopa, kaa karibu na mtu mzima unayemwamini na umwambie kinachokutisha.', q: ['Ukiogopa unafanya nini?', ['Unanyamaza', 'Unamwambia mtu mzima', 'Unakimbia mbali peke yako'], 1] },
      { t: 'Kuomba msamaha', x: 'Ukimkosea mtu, sema "samahani" na ujaribu kurekebisha.', q: ['Ukimkosea rafiki unasema nini?', ['Samahani', 'Sijali', 'Nenda'], 0] },
      { t: 'Kushirikiana', x: 'Kushirikiana midoli na chakula kunajenga urafiki mzuri.', q: ['Rafiki mzuri hufanya nini?', ['Anashirikiana', 'Ananyang\'anya', 'Anacheka wengine'], 0] },
    ],
  },
};

/* ---------- Imani (mzazi amechagua) ---------- */
const FAITH = {
  islam: {
    name: 'Uislamu',
    cards: [
      { t: 'Bismillah', ar: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', tr: 'Bismillāhi r-raḥmāni r-raḥīm', x: 'Kwa jina la Mwenyezi Mungu, Mwingi wa rehema, Mwenye kurehemu. Tunasema kabla ya kuanza jambo lolote.' },
      { t: 'Kabla ya kula', ar: 'بِسْمِ اللَّهِ', tr: 'Bismillāh', x: 'Tunasema "Bismillah" kabla ya kula, na tunakula kwa mkono wa kulia.' },
      { t: 'Baada ya kula', ar: 'الْحَمْدُ لِلَّهِ', tr: 'Al-ḥamdu lillāh', x: 'Sifa njema zote ni za Mwenyezi Mungu. Tunashukuru baada ya kula.' },
      { t: 'Kabla ya kulala', ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', tr: 'Bismika Allāhumma amūtu wa aḥyā', x: 'Kwa jina lako ee Mwenyezi Mungu ninakufa (ninalala) na ninakuwa hai (ninaamka).' },
      { t: 'Surat Al-Fatiha', ar: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ۝ الرَّحْمَٰنِ الرَّحِيمِ ۝ مَالِكِ يَوْمِ الدِّينِ ۝ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ۝ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ۝ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', tr: 'Al-ḥamdu lillāhi rabbi l-ʿālamīn. Ar-raḥmāni r-raḥīm. Māliki yawmi d-dīn. Iyyāka naʿbudu wa iyyāka nastaʿīn. Ihdinā ṣ-ṣirāṭa l-mustaqīm. Ṣirāṭa lladhīna anʿamta ʿalayhim, ghayri l-maghḍūbi ʿalayhim wa lā ḍ-ḍāllīn.', x: 'Sura ya kwanza ya Qur\'an. Tunaisoma kila rakaa ya swala.' },
      { t: 'Nguzo tano za Uislamu', x: 'Shahada, Swala, Zaka, Saumu (kufunga Ramadhani) na Hija.' },
      { t: 'Swala tano', x: 'Alfajiri, Adhuhuri, Alasiri, Magharibi na Isha. Kabla ya kuswali tunatawadha (udhu).' },
      { t: 'Udhu kwa ufupi', x: 'Nia, osha mikono, sukutua kinywa, pandisha maji puani, osha uso, osha mikono hadi viwiko, pangusa kichwa, osha masikio, osha miguu hadi vifundo.' },
      { t: 'Salamu', ar: 'السَّلَامُ عَلَيْكُمْ', tr: 'As-salāmu ʿalaykum', x: 'Amani iwe juu yenu. Jibu: Wa ʿalaykumu s-salām.' },
    ],
    quiz: [
      ['Tunasema nini kabla ya kula?', ['Bismillah', 'Kwaheri', 'Asante'], 0],
      ['Swala za faradhi ni ngapi kwa siku?', ['Tatu', 'Tano', 'Saba'], 1],
      ['Kitabu kitakatifu cha Uislamu ni?', ['Qur\'an', 'Kamusi', 'Daftari'], 0],
      ['Mwezi wa kufunga ni upi?', ['Ramadhani', 'Desemba', 'Shawwal'], 0],
      ['Kaaba iko mji gani?', ['Madina', 'Makka', 'Dar es Salaam'], 1],
      ['Tunasema nini baada ya kula?', ['Alhamdulillah', 'Habari', 'Pole'], 0],
      ['Kabla ya swala tunafanya nini?', ['Tunacheza', 'Tunatawadha (udhu)', 'Tunalala'], 1],
      ['Sikukuu baada ya Ramadhani ni?', ['Idd el-Fitr', 'Krismasi', 'Mwaka mpya'], 0],
      ['Mtume wa mwisho ni nani?', ['Mtume Muhammad (s.a.w)', 'Mtume Nuhu (a.s)', 'Mtume Musa (a.s)'], 0],
      ['Tunamsalimiaje Muislamu mwenzetu?', ['As-salamu alaykum', 'Bonjour', 'Hello'], 0],
    ],
  },
  christian: {
    name: 'Ukristo',
    cards: [
      { t: 'Sala ya Bwana', x: 'Baba yetu uliye mbinguni, jina lako litukuzwe. Ufalme wako uje. Mapenzi yako yatimizwe hapa duniani kama huko mbinguni. Utupe leo riziki yetu. Utusamehe makosa yetu, kama sisi tunavyowasamehe waliotukosea. Usitutie majaribuni, lakini utuokoe na yule mwovu. Amina.' },
      { t: 'Sala kabla ya kula', x: 'Asante Mungu kwa chakula hiki. Kibariki, na uwabariki waliokiandaa. Kwa jina la Yesu, Amina.' },
      { t: 'Sala ya kulala', x: 'Mungu wangu, asante kwa siku ya leo. Unilinde usiku huu, uilinde familia yangu. Kwa jina la Yesu, Amina.' },
      { t: 'Kuzaliwa kwa Yesu', x: 'Yesu alizaliwa Bethlehemu. Mama yake ni Maria na Yusufu alimlea. Tunasherehekea kuzaliwa kwake siku ya Krismasi.' },
      { t: 'Safina ya Nuhu', x: 'Mungu alimwambia Nuhu ajenge safina. Nuhu, familia yake na wanyama wawili wawili waliokolewa wakati wa gharika.' },
      { t: 'Daudi na Goliathi', x: 'Daudi alikuwa kijana mdogo, lakini kwa imani kwa Mungu alimshinda Goliathi mkubwa kwa kombeo na jiwe.' },
      { t: 'Amri kuu', x: 'Yesu alisema: Mpende Bwana Mungu wako kwa moyo wako wote, na mpende jirani yako kama nafsi yako.' },
      { t: 'Msamaria mwema', x: 'Msamaria alimsaidia mtu aliyeumizwa njiani, ingawa hakumjua. Yesu anatufundisha kuwasaidia wote.' },
    ],
    quiz: [
      ['Yesu alizaliwa mji gani?', ['Bethlehemu', 'Nazareti', 'Dodoma'], 0],
      ['Mama yake Yesu anaitwa nani?', ['Maria', 'Sara', 'Ruthu'], 0],
      ['Kitabu kitakatifu cha Wakristo ni?', ['Biblia', 'Kamusi', 'Gazeti'], 0],
      ['Nani alijenga safina?', ['Musa', 'Nuhu', 'Petro'], 1],
      ['Daudi alimshinda nani?', ['Goliathi', 'Farao', 'Herode'], 0],
      ['Sikukuu ya kuzaliwa Yesu ni?', ['Pasaka', 'Krismasi', 'Idd'], 1],
      ['Sikukuu ya kufufuka Yesu ni?', ['Pasaka', 'Krismasi', 'Mwaka mpya'], 0],
      ['Sala aliyotufundisha Yesu inaanza na?', ['Baba yetu', 'Habari zenu', 'Asante sana'], 0],
      ['Yesu alikuwa na wanafunzi wangapi?', ['Saba', 'Kumi na wawili', 'Watatu'], 1],
      ['Msamaria mwema alifanya nini?', ['Alimsaidia mtu aliyeumia', 'Alikimbia', 'Alicheka'], 0],
    ],
  },
  values: {
    name: 'Maadili',
    cards: [
      { t: 'Kusema ukweli', x: 'Mtu mkweli anaaminiwa na wote. Hata ukikosea, sema ukweli.' },
      { t: 'Heshima', x: 'Waheshimu wazazi, walimu na wazee. Sema "shikamoo" kwa wakubwa.' },
      { t: 'Shukrani', x: 'Sema "asante" mtu anapokusaidia au kukupa kitu.' },
      { t: 'Kusaidia', x: 'Wasaidie wengine nyumbani na shuleni: kubeba, kufagia, kumfundisha mdogo wako.' },
      { t: 'Kusamehe', x: 'Rafiki akikuomba msamaha, msamehe. Kusamehe kunaleta amani.' },
      { t: 'Bidii', x: 'Fanya kazi zako kwa bidii hata zikiwa ngumu. Kila siku unakua zaidi.' },
    ],
    quiz: [
      ['Mtu anapokusaidia unasema nini?', ['Asante', 'Nenda', 'Sijali'], 0],
      ['Ukikosea unafanya nini?', ['Unaficha', 'Unasema ukweli', 'Unamlaumu mwingine'], 1],
      ['Unamsalimiaje bibi au babu?', ['Shikamoo', 'Mambo vipi', 'Kimya'], 0],
      ['Rafiki akiomba msamaha?', ['Unamsamehe', 'Unamchukia', 'Unampiga'], 0],
      ['Mdogo wako akishindwa kazi?', ['Unamcheka', 'Unamsaidia', 'Unamfukuza'], 1],
      ['Kazi ikiwa ngumu?', ['Unaacha', 'Unajaribu kwa bidii', 'Unalia tu'], 1],
    ],
  },
};
