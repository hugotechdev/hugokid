/* HUGO KID - ai.js : AI (Gemini, Claude au ChatGPT) kwa API key ya mzazi */

const AI_PROVIDERS = {
  gemini: { name: 'Gemini (Google)', model: 'gemini-2.0-flash', keyHint: 'AIza...', link: 'aistudio.google.com' },
  claude: { name: 'Claude (Anthropic)', model: 'claude-sonnet-4-5', keyHint: 'sk-ant-...', link: 'console.anthropic.com' },
  openai: { name: 'ChatGPT (OpenAI)', model: 'gpt-4o-mini', keyHint: 'sk-...', link: 'platform.openai.com' },
};

const AI_CHILD_RULES = `Wewe ni "Nuru", rafiki na mwalimu msaidizi mpole ndani ya programu ya watoto HUGO KID (Tanzania).
Sheria zako:
- Unaongea na mtoto wa miaka 3 hadi 12. Tumia lugha rahisi, sentensi fupi, na upole.
- Jibu kwa Kiswahili isipokuwa mtoto aandike kwa lugha nyingine au aombe kujifunza lugha nyingine.
- Kwenye homework au maswali ya shule: USIMPE jibu la mwisho. Mwongoze hatua kwa hatua kwa maswali madogo na mfano unaofanana.
- Usizungumze mambo yasiyofaa watoto (vurugu, mapenzi, vitisho, siasa, mambo ya kutisha). Mtoto akiuliza hayo, mwambie kwa upole amuulize mzazi au mwalimu.
- Usiulize wala kuhifadhi taarifa binafsi (anwani, simu, shule). Mtoto akisema yuko hatarini au ana huzuni kubwa, mwambie amweleze mzazi au mtu mzima anayemwamini sasa hivi.
- Msifu kwa juhudi zake. Majibu yasizidi sentensi 5.`;

const AI = {
  cfg() {
    return Object.assign({ provider: 'gemini', key: '', model: '', enabled: true }, Store.get('ai', {}));
  },
  save(c) { Store.set('ai', c); },
  ready() { const c = this.cfg(); return !!(c.enabled && c.key); },

  /* opts: { system, text, images: [dataURL], maxTokens, history: [{role:'user'|'assistant', text}] } */
  async ask(opts) {
    const c = this.cfg();
    if (!c.key) throw new Error('Mzazi hajaweka API key ya AI');
    const p = c.provider;
    const model = (c.model || AI_PROVIDERS[p].model).trim();
    const max = opts.maxTokens || 700;
    /* programu ikiwa English, majibu ya maandishi yawe kwa Kiingereza */
    if (typeof I18N !== 'undefined' && I18N.lang === 'en' && !/kama lilivyo/.test(opts.text)) {
      const json = /JSON|Rudisha [{[]/.test((opts.system || '') + opts.text);
      opts = { ...opts, text: opts.text + (json ? '\n\n(Write every text value in simple English. Keep the JSON keys unchanged.)' : '\n\n(Reply in simple English.)') };
    }
    const imgs = (opts.images || []).map(d => {
      const m = /^data:(image\/[a-z+]+);base64,(.*)$/i.exec(d) || [];
      return { mime: m[1] || 'image/jpeg', data: m[2] || '' };
    });
    const hist = opts.history || [];
    let res, j;

    if (p === 'claude') {
      const content = [];
      imgs.forEach(i => content.push({ type: 'image', source: { type: 'base64', media_type: i.mime, data: i.data } }));
      content.push({ type: 'text', text: opts.text });
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': c.key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model, max_tokens: max, system: opts.system || AI_CHILD_RULES,
          messages: [...hist.map(h => ({ role: h.role, content: h.text })), { role: 'user', content }],
        }),
      });
      j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j.error && j.error.message) || ('Claude error ' + res.status));
      return (j.content || []).map(x => x.text || '').join('').trim();
    }

    if (p === 'openai') {
      const content = [{ type: 'text', text: opts.text }];
      imgs.forEach(i => content.push({ type: 'image_url', image_url: { url: 'data:' + i.mime + ';base64,' + i.data } }));
      res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'authorization': 'Bearer ' + c.key },
        body: JSON.stringify({
          model, max_tokens: max,
          messages: [{ role: 'system', content: opts.system || AI_CHILD_RULES },
            ...hist.map(h => ({ role: h.role, content: h.text })), { role: 'user', content }],
        }),
      });
      j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((j.error && j.error.message) || ('OpenAI error ' + res.status));
      return ((j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '').trim();
    }

    // Gemini
    const parts = [];
    imgs.forEach(i => parts.push({ inline_data: { mime_type: i.mime, data: i.data } }));
    parts.push({ text: opts.text });
    res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent?key=' + encodeURIComponent(c.key), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: opts.system || AI_CHILD_RULES }] },
        contents: [...hist.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })), { role: 'user', parts }],
        generationConfig: { maxOutputTokens: max },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
      }),
    });
    j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((j.error && j.error.message) || ('Gemini error ' + res.status));
    const cand = j.candidates && j.candidates[0];
    const txt = cand && cand.content && cand.content.parts ? cand.content.parts.map(x => x.text || '').join('') : '';
    if (!txt) throw new Error('AI haikutoa jibu (huenda limezuiwa kwa usalama)');
    return txt.trim();
  },

  /* Soma homework kutoka kwenye picha -> maswali yanayoweza kuhaririwa */
  async readHomework(images) {
    const sys = 'You extract school homework from photos for a children\'s app. Output ONLY valid JSON, no markdown.';
    const prompt = `Soma homework kwenye picha hizi. Rudisha JSON hii tu:
{"title":"jina fupi la homework","subject":"Hesabu|Kiingereza|Kiswahili|Sayansi|Nyingine","questions":["swali 1 kamili kama lilivyoandikwa","swali 2", "..."]}
Andika kila swali kama lilivyo kwenye karatasi (pamoja na namba na hesabu). Usitoe majibu.`;
    const raw = await this.ask({ system: sys, text: prompt, images, maxTokens: 1500 });
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI haikusoma homework vizuri, jaribu picha iliyo wazi zaidi');
    const j = JSON.parse(m[0]);
    if (!Array.isArray(j.questions) || !j.questions.length) throw new Error('Hakuna maswali yaliyosomeka');
    return j;
  },

  log(childId, q, a) {
    const k = 'ailog_' + childId;
    const list = Store.get(k, []);
    list.push({ t: Date.now(), q, a });
    Store.set(k, list.slice(-80));
  },
};

/* Kuweka AI (kwa mzazi) */
HK.screens.aiSettings = (el) => {
  const c = AI.cfg();
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>AI ya HUGO KID</h1></div>
    <div class="scroll">
      <div class="card"><p>Chagua AI na uweke API key yako. AI inasoma homework kutoka kwenye picha na inamsaidia mtoto hatua kwa hatua bila kumpa jibu. Key inakaa kwenye simu hii tu.</p></div>
      <label class="label">Chagua AI</label>
      <div class="chips" id="prov">${Object.entries(AI_PROVIDERS).map(([k, v]) => `<button class="chip ${c.provider === k ? 'on' : ''}" data-p="${k}">${v.name}</button>`).join('')}</div>
      <label class="label">API key</label>
      <input class="field" id="key" type="password" autocomplete="off" placeholder="" value="${esc(c.key)}">
      <p class="muted" style="font-size:13px;font-weight:700;margin:8px 2px 0" id="where"></p>
      <label class="label">Model (si lazima)</label>
      <input class="field" id="model" placeholder="" value="${esc(c.model)}">
      <label class="label">Msaidizi Nuru kwa mtoto</label>
      <div class="chips" id="en"><button class="chip ${c.enabled ? 'on' : ''}" data-v="1">Washa</button><button class="chip ${!c.enabled ? 'on' : ''}" data-v="0">Zima</button></div>
      <div style="height:22px"></div>
      <div class="btn-row"><button class="btn ghost" id="test">${icon('send', 20)} Jaribu</button><button class="btn" id="save">${icon('check', 20)} Hifadhi</button></div>
      <div style="height:18px"></div>
      <button class="btn block ghost" id="log">${icon('file', 20)} Mazungumzo ya mtoto na Nuru</button>
    </div>`;
  let prov = c.provider, enabled = c.enabled;
  const upd = () => {
    const P = AI_PROVIDERS[prov];
    $('#key', el).placeholder = P.keyHint;
    $('#model', el).placeholder = P.model;
    $('#where', el).textContent = 'Pata key kwenye ' + P.link;
  };
  $$('#prov .chip', el).forEach(b => b.onclick = () => { prov = b.dataset.p; $$('#prov .chip', el).forEach(x => x.classList.toggle('on', x === b)); $('#model', el).value = ''; upd(); });
  $$('#en .chip', el).forEach(b => b.onclick = () => { enabled = b.dataset.v === '1'; $$('#en .chip', el).forEach(x => x.classList.toggle('on', x === b)); });
  const collect = () => ({ provider: prov, key: $('#key', el).value.trim(), model: $('#model', el).value.trim(), enabled });
  $('#save', el).onclick = () => { AI.save(collect()); Sfx.good(); toast('AI imehifadhiwa'); HK.back(); };
  $('#test', el).onclick = async () => {
    AI.save(collect());
    const b = $('#test', el); b.disabled = true; b.textContent = 'Inajaribu...';
    try {
      const a = await AI.ask({ text: 'Sema "Habari! Mimi ni Nuru" kwa sentensi moja.', maxTokens: 60 });
      modal(el, { iconName: 'check', title: 'AI inafanya kazi', text: a, buttons: [{ label: 'Sawa' }] });
    } catch (e) {
      modal(el, { iconName: 'x', iconColor: 'var(--coral)', title: 'Imeshindikana', text: e.message, buttons: [{ label: 'Sawa' }] });
    }
    b.disabled = false; b.innerHTML = icon('send', 20) + ' Jaribu';
  };
  $('#log', el).onclick = () => HK.go('aiLog');
  $('#bk', el).onclick = () => HK.back();
  upd();
};

HK.screens.aiLog = (el) => {
  const kids = Store.children();
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Mazungumzo na Nuru</h1></div>
    <div class="scroll">${kids.map(k => {
      const l = Store.get('ailog_' + k.id, []).slice().reverse();
      return `<div class="section-title">${esc(k.name)}</div>` + (l.length ? l.map(x => `<div class="card">
        <div class="muted" style="font-size:12px;font-weight:800">${new Date(x.t).toLocaleString()}</div>
        <p style="margin:6px 0"><b>${esc(k.name)}:</b> ${esc(x.q)}</p><p><b>Nuru:</b> ${esc(x.a)}</p></div>`).join('') : '<p class="muted" style="font-weight:700">Hakuna mazungumzo bado.</p>');
    }).join('')}</div>`;
  $('#bk', el).onclick = () => HK.back();
};

/* ---------- Msaidizi Nuru (mtoto anaongea na AI) ---------- */
HK.screens.tutor = (el) => {
  const c = Store.active();
  const hist = [];
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button>
      ${nuruSVG(40)}<h1>Uliza Nuru</h1></div>
    <div class="scroll" id="chat" style="padding-top:6px"></div>
    <div style="padding:8px 12px 6px;display:flex;gap:8px;overflow-x:auto" id="quick">
      ${['Nifundishe neno jipya la Kiingereza', 'Nipe swali la hesabu', 'Nieleze kuhusu tembo', 'Nipe hadithi fupi'].map(q => `<button class="chip" style="white-space:nowrap;flex:none">${q}</button>`).join('')}
    </div>
    <div style="display:flex;gap:8px;padding:6px 12px 14px;background:var(--bg)">
      <input class="field" id="msg" placeholder="Andika swali lako..." style="flex:1">
      <button class="btn" id="send" style="padding:0 18px">${icon('send', 22)}</button>
    </div>`;
  $('#bk', el).onclick = () => HK.back();
  const chat = $('#chat', el);
  const bubble = (who, text) => {
    const d = document.createElement('div');
    d.style.cssText = `max-width:84%;padding:12px 15px;border-radius:20px;margin:8px 0;font-weight:700;font-size:16px;line-height:1.45;${who === 'me'
      ? 'margin-left:auto;background:var(--blue);color:#fff;border-bottom-right-radius:6px'
      : 'background:#fff;box-shadow:0 3px 0 var(--line);border-bottom-left-radius:6px'}`;
    d.textContent = text;
    if (who !== 'me') { d.onclick = () => speak(text); }
    chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
    return d;
  };
  if (!AI.ready()) {
    bubble('hugo', 'Habari! Mzazi wako akiweka AI kwenye Mipangilio, tutaongea na kujifunza pamoja.');
    $('#send', el).disabled = true;
    return;
  }
  const hello = 'Habari ' + c.name + '! Mimi ni Nuru. Niulize chochote unachotaka kujifunza.';
  bubble('hugo', hello); speak(hello);
  const t0 = Date.now();
  const send = async (text) => {
    text = (text || '').trim(); if (!text) return;
    $('#msg', el).value = '';
    bubble('me', text);
    const wait = bubble('hugo', '...');
    try {
      const age = ageYears(c.birth);
      const langNote = c.lang === 'en' ? ' Jibu kwa Kiingereza rahisi.' : '';
      const a = await AI.ask({ text: `(Mtoto anaitwa ${c.name}, ana miaka ${age}.${langNote}) ${text}`, history: hist.slice(-8), maxTokens: 400 });
      wait.textContent = a; speak(a);
      hist.push({ role: 'user', text }, { role: 'assistant', text: a });
      AI.log(c.id, text, a);
    } catch (e) {
      wait.textContent = 'Samahani, sijaweza kujibu sasa. Hakikisha kuna intaneti.';
    }
  };
  $('#send', el).onclick = () => send($('#msg', el).value);
  $('#msg', el).onkeydown = e => { if (e.key === 'Enter') send($('#msg', el).value); };
  $$('#quick .chip', el).forEach(b => b.onclick = () => send(b.textContent));
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};
