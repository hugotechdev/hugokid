

const { q } = require('./db');

const DEF = { gemini: 'gemini-2.0-flash', claude: 'claude-sonnet-4-5', openai: 'gpt-4o-mini' };

function cfg() {
  const s = q.get(`SELECT value FROM settings WHERE key = 'ai'`);
  const db = s ? JSON.parse(s.value) : {};
  return {
    provider: db.provider || process.env.AI_PROVIDER || 'gemini',
    key: db.key || process.env.AI_KEY || '',
    model: db.model || process.env.AI_MODEL || '',
  };
}
const ready = () => !!cfg().key;

async function ask({ system, text, images = [], max = 900 }) {
  const c = cfg();
  if (!c.key) throw new Error('AI haijawekwa kwenye server');
  const model = c.model || DEF[c.provider];
  const imgs = images.map(d => { const m = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(d) || []; return { mime: m[1] || 'image/jpeg', data: m[2] || '' }; }).filter(i => i.data);
  let r, j;
  if (c.provider === 'claude') {
    r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': c.key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens: max, system, messages: [{ role: 'user', content: [...imgs.map(i => ({ type: 'image', source: { type: 'base64', media_type: i.mime, data: i.data } })), { type: 'text', text }] }] }),
    });
    j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || 'Claude error');
    return (j.content || []).map(x => x.text || '').join('').trim();
  }
  if (c.provider === 'openai') {
    r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + c.key },
      body: JSON.stringify({ model, max_tokens: max, messages: [{ role: 'system', content: system }, { role: 'user', content: [{ type: 'text', text }, ...imgs.map(i => ({ type: 'image_url', image_url: { url: `data:${i.mime};base64,${i.data}` } }))] }] }),
    });
    j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || 'OpenAI error');
    return (j.choices[0].message.content || '').trim();
  }
  r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(c.key)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [...imgs.map(i => ({ inline_data: { mime_type: i.mime, data: i.data } })), { text }] }], generationConfig: { maxOutputTokens: max } }),
  });
  j = await r.json(); if (!r.ok) throw new Error((j.error && j.error.message) || 'Gemini error');
  return ((j.candidates || [])[0]?.content?.parts || []).map(x => x.text || '').join('').trim();
}
async function askJSON(opts) {
  const raw = await ask({ ...opts, system: (opts.system || '') + '\nJibu kwa JSON halali TU.' });
  const m = raw.match(/[\[{][\s\S]*[\]}]/);
  if (!m) throw new Error('AI haikurudisha JSON');
  return JSON.parse(m[0]);
}

const TEACHER_SYS = 'Wewe ni msaidizi wa walimu wa shule za msingi Tanzania (Awali hadi Darasa la 7). Andika maudhui sahihi, yanayofaa umri, kwa lugha rahisi. Fuata mtaala wa Tanzania inapowezekana.';

async function generate({ task, level, subject, topic, count = 5, lang = 'English' }) {
  const n = Math.max(3, Math.min(20, +count || 5));
  if (task === 'quiz') {
    return askJSON({
      system: TEACHER_SYS, max: 2500,
      text: `Tengeneza maswali ${n} ya ${subject || 'somo'} kwa ${level || 'darasa la msingi'}, mada: "${topic}". Lugha: ${lang}.
Changanya aina hizi: "mcq" (chaguo 3-4), "short" (jibu fupi), "math" (jibu la namba). Rudisha:
[{"type":"mcq","q":"swali","options":["a","b","c"],"answer":0,"points":1},{"type":"short","q":"...","answer":"jibu|jibu mbadala","points":1},{"type":"math","q":"...","answer":"12","points":1}]`,
    });
  }
  const txt = await ask({
    system: TEACHER_SYS, max: 1800,
    text: `Tengeneza worksheet ya ${subject || 'somo'} kwa ${level || 'darasa la msingi'}, mada: "${topic}", maswali ${n}, lugha: ${lang}. Anza na maelekezo mafupi kwa mwanafunzi, kisha maswali yenye namba. Usiandike majibu.`,
  });
  return { text: txt };
}

async function suggest({ homework, images, answersText }) {
  return askJSON({
    system: TEACHER_SYS + ' Unasahihisha kazi ya mwanafunzi kwa haki na upole. Mwalimu ndiye atathibitisha alama.',
    images: images.slice(0, 6), max: 600,
    text: `Homework: "${homework.title}" (${homework.subject || ''}). Maelekezo: ${homework.instructions || '-'}.
${answersText ? 'Majibu ya mwanafunzi: ' + answersText : 'Angalia kazi ya mwanafunzi kwenye picha.'}
Toa alama kati ya 0 na ${homework.max_score}. Rudisha {"score": namba, "comment": "maoni mafupi kwa mwalimu (sentensi 2)", "child": "ujumbe mfupi wa kumtia moyo mwanafunzi"}`,
  });
}

async function childReport({ name, stats }) {
  return ask({
    system: 'You are an education adviser writing to a parent in Tanzania. Use clear, kind English.',
    max: 400,
    text: `Andika ripoti fupi (sentensi 3-4) kuhusu ${name}. Taja anapofanya vizuri, sehemu moja inayohitaji msaada, na pendekezo moja la mazoezi nyumbani wiki hii. Takwimu: ${JSON.stringify(stats)}`,
  });
}

module.exports = { ready, ask, askJSON, generate, suggest, childReport, cfg };
