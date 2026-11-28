/* English narration via Azure Imani, with device English as a fallback. */
const Voice = {
  enabled: false,
  audio: null,
  async check() {
    try {
      const r = await fetch(Net.base() + '/api/tts/status', { cache: 'no-store', signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined });
      this.enabled = !!(await r.json()).enabled;
    } catch (e) { this.enabled = false; }
  },
  url(text) { return Net.base() + '/api/tts?text=' + encodeURIComponent(text); },
  stop() {
    clearTimeout(this.timeout);
    if (this.audio) { this.audio.onplaying = this.audio.onerror = this.audio.onended = null; this.audio.pause(); this.audio = null; }
  },
};
const EN_U = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_T = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
function enNum(n) {
  if (n < 20) return EN_U[n];
  if (n < 100) return EN_T[Math.floor(n / 10)] + (n % 10 ? '-' + EN_U[n % 10] : '');
  if (n < 1000) return EN_U[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + enNum(n % 100) : '');
  if (n < 1e6) return enNum(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? (n % 1000 < 100 ? ' and ' : ' ') + enNum(n % 1000) : '');
  return enNum(Math.floor(n / 1e6)) + ' million' + (n % 1e6 ? ' ' + enNum(n % 1e6) : '');
}

function spokenText(text, lang) {
  let t = String(text || '');
  if (lang !== 'en') return t;
  const num = s => +String(s).replace(/,/g, '');
  const words = n => Number.isSafeInteger(n) && n >= 0 && n < 1e9 ? enNum(n) : String(n);
  const money = n => words(n) + ' shillings';
  t = t.replace(/TSh\.?\s?(\d[\d,]*)/gi, (_, n) => money(num(n)));
  t = t.replace(/(\d[\d,]*)\s?\/=/g, (_, n) => money(num(n)));
  t = t.replace(/(\d+)\s?\/\s?(\d+)/g, (_, a, b) => words(+a) + ' out of ' + words(+b));
  t = t.replace(/(?<![\d:])(\d{1,3}(?:,\d{3})+|\d{1,7})(?![\d:])/g, (_, n) => words(num(n)));
  t = t.replace(/\s×\s/g, ' times ').replace(/\s\+\s/g, ' plus ');
  return t;
}

const _speakDevice = speak;
speak = function (text) {
  const said = spokenText(text, 'en');
  Voice.stop();
  if (!said.trim()) return;
  const device = () => _speakDevice(said, 'en');
  if (!Voice.enabled || navigator.onLine === false) return device();
  try { window.speechSynthesis?.cancel(); window.HugoNative?.stopSpeaking?.(); } catch (e) {}
  const chunks = said.match(/.{1,500}(?:\s|$)|.{1,500}/gs) || [said];
  const play = i => {
    if (i >= chunks.length) return Voice.stop();
    const a = new Audio(Voice.url(chunks[i].trim()));
    Voice.audio = a;
    const fail = () => {
      if (Voice.audio !== a) return;
      Voice.stop();
      _speakDevice(chunks.slice(i).join(' '), 'en');
    };
    Voice.timeout = setTimeout(fail, 4500);
    a.onplaying = () => clearTimeout(Voice.timeout);
    a.onended = () => { if (Voice.audio === a) play(i + 1); };
    a.onerror = fail;
    a.play().catch(fail);
  };
  play(0);
};

window.addEventListener('online', () => Voice.check());
setTimeout(() => Voice.check(), 300);
