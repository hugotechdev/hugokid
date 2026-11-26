/* HUGO KID - voice.js : sauti ya Nuru
   Mtandao ukiwepo na HUGO TECH ameweka Azure Speech: sauti ya binadamu ya Rehema (Kiswahili)
   au Imani (Kiingereza). Bila mtandao: sauti ya simu. Namba zinasomwa kwa maneno. */

const Voice = {
  enabled: false,
  audio: null,
  async check() {
    try {
      const r = await fetch(Net.base() + '/api/tts/status', { cache: 'no-store' });
      this.enabled = !!(await r.json()).enabled;
    } catch (e) { this.enabled = false; }
  },
  url(text, lang) { return Net.base() + '/api/tts?lang=' + lang + '&text=' + encodeURIComponent(text); },
  stop() {
    if (this.audio) { this.audio.onplaying = this.audio.onerror = null; this.audio.pause(); this.audio = null; }
  },
};
const VOICE_LANGS = ['sw', 'en', 'fr', 'zh', 'ar'];

/* ---------- namba kwa maneno ---------- */
const SW_U = ['sifuri', 'moja', 'mbili', 'tatu', 'nne', 'tano', 'sita', 'saba', 'nane', 'tisa'];
const SW_T = ['', 'kumi', 'ishirini', 'thelathini', 'arobaini', 'hamsini', 'sitini', 'sabini', 'themanini', 'tisini'];
function swNum(n) {
  if (n < 10) return SW_U[n];
  if (n < 100) return SW_T[Math.floor(n / 10)] + (n % 10 ? ' na ' + SW_U[n % 10] : '');
  if (n < 1000) return 'mia ' + SW_U[Math.floor(n / 100)] + (n % 100 ? ' na ' + swNum(n % 100) : '');
  if (n < 1e6) return 'elfu ' + swNum(Math.floor(n / 1000)) + (n % 1000 ? ' na ' + swNum(n % 1000) : '');
  return 'milioni ' + swNum(Math.floor(n / 1e6)) + (n % 1e6 ? ' na ' + swNum(n % 1e6) : '');
}
const EN_U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function enNum(n) {
  if (n < 20) return EN_U[n];
  if (n < 100) return EN_T[Math.floor(n / 10)] + (n % 10 ? '-' + EN_U[n % 10] : '');
  if (n < 1000) return EN_U[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + enNum(n % 100) : '');
  if (n < 1e6) return enNum(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ' ') + enNum(n % 1000) : '');
  return enNum(Math.floor(n / 1e6)) + ' million' + (n % 1e6 ? ' ' + enNum(n % 1e6) : '');
}

/* maandishi ya skrini -> maneno ya kutamka (TSh 1,500 -> shilingi elfu moja na mia tano) */
function spokenText(text, lang) {
  let t = String(text || '');
  if (lang !== 'sw' && lang !== 'en') return t;
  const num = s => +String(s).replace(/,/g, '');
  const words = n => (lang === 'sw' ? swNum : enNum)(n);
  const money = n => lang === 'sw' ? 'shilingi ' + words(n) : words(n) + ' shillings';
  t = t.replace(/TSh\.?\s?(\d[\d,]*)/gi, (_, n) => money(num(n)));
  t = t.replace(/(\d[\d,]*)\s?\/=/g, (_, n) => money(num(n)));
  t = t.replace(/(\d+)\s?\/\s?(\d+)/g, (_, a, b) => lang === 'sw' ? words(+a) + ' kati ya ' + words(+b) : words(+a) + ' out of ' + words(+b));
  t = t.replace(/(?<![\d:])(\d{1,3}(?:,\d{3})+|\d{1,7})(?![\d:])/g, (_, n) => words(num(n)));
  t = t.replace(/\s×\s/g, lang === 'sw' ? ' mara ' : ' times ').replace(/\s\+\s/g, lang === 'sw' ? ' jumlisha ' : ' plus ');
  return t;
}

/* kukisia lugha ya jibu la Nuru (mtoto akiuliza kwa Kiingereza, Nuru ajibu kwa sauti ya Kiingereza) */
function guessLang(text) {
  const w = String(text).toLowerCase().match(/[a-z']+/g) || [];
  if (!w.length) return I18N.lang === 'en' ? 'en' : 'sw';
  const en = w.filter(x => /^(the|and|is|are|you|your|to|of|it|a|an|in|what|this|that|can|let's|we|i|my|with|for|do|how|good|great)$/.test(x)).length;
  const sw = w.filter(x => /^(na|ya|wa|ni|kwa|la|za|cha|hii|hiyo|sasa|tena|wewe|mimi|sana|vizuri|hebu|je|gani|nini)$/.test(x)).length;
  return en > sw ? 'en' : sw > en ? 'sw' : (I18N.lang === 'en' ? 'en' : 'sw');
}

/* speak ya simu inabaki kama akiba; sauti ya Nuru inatangulia */
const _speakDevice = speak;
speak = function (text, lang = 'sw') {
  const L = String(lang || 'sw').slice(0, 2);
  const said = spokenText(text, L);
  Voice.stop();
  if (!Voice.enabled || navigator.onLine === false || !VOICE_LANGS.includes(L)) return _speakDevice(said, lang);
  try { window.speechSynthesis && speechSynthesis.cancel(); if (window.HugoNative && HugoNative.stopSpeaking) HugoNative.stopSpeaking(); } catch (e) {}
  const a = new Audio(Voice.url(said, L));
  Voice.audio = a;
  let started = false;
  const fallback = () => { if (Voice.audio === a && !started) { Voice.stop(); _speakDevice(said, lang); } };
  const slow = setTimeout(fallback, 4500); /* mtandao wa polepole: tumia sauti ya simu */
  a.onplaying = () => { started = true; clearTimeout(slow); };
  a.onerror = () => { clearTimeout(slow); fallback(); };
  a.play().catch(() => { clearTimeout(slow); fallback(); });
};

window.addEventListener('online', () => Voice.check());
setTimeout(() => Voice.check(), 300);
