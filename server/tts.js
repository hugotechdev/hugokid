// HUGO KID server - tts.js : sauti ya Nuru (Microsoft Azure Speech, sauti za neural)
// Kiswahili: Rehema (sw-TZ), Kiingereza: Imani (en-TZ). Sauti moja ya kike ya Tanzania kwa lugha zote mbili.
// Weka kwenye Railway: AZURE_SPEECH_KEY na AZURE_SPEECH_REGION, au uweke kwenye dashboard ya HUGO TECH.
// Kila sentensi inatengenezwa mara moja tu, kisha inahifadhiwa kwenye DATA_DIR/tts.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { q, DATA_DIR } = require('./db');

const VOICES = {
  sw: ['sw-TZ', 'sw-TZ-RehemaNeural'],
  en: ['en-TZ', 'en-TZ-ImaniNeural'],
  fr: ['fr-FR', 'fr-FR-DeniseNeural'],
  zh: ['zh-CN', 'zh-CN-XiaoxiaoNeural'],
  ar: ['ar-SA', 'ar-SA-ZariyahNeural'],
};
const DIR = path.join(DATA_DIR, 'tts');
fs.mkdirSync(DIR, { recursive: true });

function cfg() {
  const s = q.get(`SELECT value FROM settings WHERE key = 'tts'`);
  const db = s ? JSON.parse(s.value) : {};
  return {
    key: db.key || process.env.AZURE_SPEECH_KEY || '',
    region: db.region || process.env.AZURE_SPEECH_REGION || '',
    enabled: db.enabled !== false,
  };
}
const ready = () => { const c = cfg(); return !!(c.key && c.region && c.enabled); };

/* kikomo: sentensi mpya 150 kwa kila anwani ya mtandao ndani ya dakika 10 (zilizohifadhiwa hazihesabiwi) */
const hits = new Map();
function allow(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (h.length >= 150) return false;
  h.push(now); hits.set(ip, h);
  return true;
}

const xml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* rudisha njia ya faili la mp3 la sentensi hii (linatengenezwa kama halipo) */
async function file(lang, text, ip) {
  const v = VOICES[lang] || VOICES.sw;
  text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 600);
  if (!text) throw Object.assign(new Error('Hakuna maandishi'), { code: 400 });
  const id = crypto.createHash('sha1').update(v[1] + '|' + text).digest('hex');
  const out = path.join(DIR, id + '.mp3');
  if (fs.existsSync(out)) return out;
  if (!ready()) throw Object.assign(new Error('Sauti ya Nuru haijawekwa'), { code: 503 });
  if (!allow(ip)) throw Object.assign(new Error('Maombi mengi mno'), { code: 429 });
  const c = cfg();
  /* pumziko fupi kati ya sentensi ili mtoto asikie kitendo kimoja kwa wakati */
  const body = xml(text).replace(/([.!?])\s+/g, '$1 <break time="350ms"/> ');
  const ssml = `<speak version="1.0" xml:lang="${v[0]}"><voice name="${v[1]}"><prosody rate="-8%">${body}</prosody></voice></speak>`;
  const r = await fetch(`https://${c.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': c.key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'hugo-kid' },
    body: ssml,
  });
  if (!r.ok) throw Object.assign(new Error('Azure Speech: ' + r.status), { code: 502 });
  const buf = Buffer.from(await r.arrayBuffer());
  fs.writeFileSync(out + '.tmp', buf); fs.renameSync(out + '.tmp', out);
  return out;
}

module.exports = { cfg, ready, file, VOICES };
