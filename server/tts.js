/* English narration using Azure Speech. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { q, DATA_DIR } = require('./db');

const VOICE = { locale: 'en-TZ', name: 'en-TZ-ImaniNeural' };
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
const ready = () => { const c = cfg(); return !!(c.key && /^[a-z0-9]+$/i.test(c.region) && c.enabled); };

const hits = new Map();
function allow(ip) {
  const now = Date.now(), h = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (h.length >= 150) return false;
  h.push(now); hits.set(ip, h);
  return true;
}

const xml = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function file(text, ip) {
  text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 600);
  if (!text) throw Object.assign(new Error('Hakuna maandishi'), { code: 400 });
  const id = crypto.createHash('sha1').update(VOICE.name + '|' + text).digest('hex');
  const out = path.join(DIR, id + '.mp3');
  if (fs.existsSync(out)) return out;
  if (!ready()) throw Object.assign(new Error('Sauti ya Nuru haijawekwa'), { code: 503 });
  if (!allow(ip)) throw Object.assign(new Error('Maombi mengi mno'), { code: 429 });
  const c = cfg();

  const body = xml(text).replace(/([.!?])\s+/g, '$1 <break time="350ms"/> ');
  const ssml = `<speak version="1.0" xml:lang="${VOICE.locale}"><voice name="${VOICE.name}"><prosody rate="-8%">${body}</prosody></voice></speak>`;
  const r = await fetch(`https://${c.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: 'POST',
    headers: { 'Ocp-Apim-Subscription-Key': c.key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'hugo-kid' },
    body: ssml,
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) throw Object.assign(new Error('Azure Speech: ' + r.status), { code: 502 });
  const buf = Buffer.from(await r.arrayBuffer());
  const temporary = out + '.' + crypto.randomUUID() + '.tmp';
  try { fs.writeFileSync(temporary, buf); fs.renameSync(temporary, out); }
  finally { fs.rmSync(temporary, { force: true }); }
  return out;
}

module.exports = { cfg, ready, file };
