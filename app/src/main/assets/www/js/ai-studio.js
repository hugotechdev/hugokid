

LESSONS.ai = {
  name: 'AI ni nini?', icon: 'robot', color: 'var(--navy)', hidden: true,
  cards: [
    { t: 'AI ni nini', x: 'AI ni programu ya kompyuta iliyojifunza kutoka kwa mifano mingi sana. Inaweza kuandika, kujibu maswali na kusaidia kuunda vitu.', q: ['AI inajifunza kutoka wapi?', ['Mifano mingi', 'Ndoto', 'Hewa'], 0] },
    { t: 'Agizo (prompt)', x: 'Unachoiambia AI kinaitwa agizo. Agizo zuri linasema: unataka nini, kwa ajili ya nani, na kwa mtindo gani.', q: ['Agizo lipi ni bora?', ['"Hadithi"', '"Hadithi fupi ya kuchekesha kuhusu twiga anayejifunza kuogelea"', '"Andika"'], 1] },
    { t: 'AI inaweza kukosea', x: 'AI haijui kila kitu. Wakati mwingine inakosea au inabuni mambo. Kagua majibu yake kwenye kitabu au muulize mwalimu.', q: ['AI ikikupa jibu, ufanye nini?', ['Uamini kila kitu', 'Ulikague', 'Ulifute'], 1] },
    { t: 'Usalama', x: 'Usiiambie AI jina lako kamili, anwani, shule, namba ya simu wala picha zako. Ukiona jambo baya, mwambie mzazi.', q: ['Ni kipi hupaswi kuiambia AI?', ['Rangi unayopenda', 'Anwani ya nyumbani', 'Mnyama unayempenda'], 1] },
    { t: 'Kuwa mkweli', x: 'AI ni msaidizi, si mbadala wako. Tumia mawazo yako kwanza. Ukitumia AI kwenye kazi, sema ulisaidiwa na AI.', q: ['Ukitumia AI kwenye kazi yako ufanye nini?', ['Uifiche', 'Useme ulisaidiwa', 'Umlaumu mwenzako'], 1] },
    { t: 'Wewe ni mbunifu', x: 'AI inasaidia, lakini wazo bora linatoka kwako. Ukiwa na wazo zuri, AI inakusaidia kulijenga haraka.', q: ['Wazo bora linatoka wapi?', ['Kwako', 'Kwenye simu tu', 'Hakuna'], 0] },
  ],
};

const STUDIO_RULES = AI_CHILD_RULES + `
- Uko kwenye Studio ya AI: unamfundisha mtoto KUTUMIA AI kuunda vitu. Maudhui yote yawe ya umri wa watoto: bila vurugu, hofu, mapenzi wala chapa za biashara au wahusika wa filamu zenye hakimiliki.
- Mpongeze mtoto kwa mawazo yake na umpe kidokezo kimoja cha kuboresha agizo lake.`;

const PROJECTS = [
  { id: 'story', name: 'Tunga hadithi', sub: 'Wewe na Nuru mnaandika pamoja', icon: 'book', color: '#7B61FF' },
  { id: 'quiz', name: 'Tengeneza mchezo wa maswali', sub: 'Kisha uucheze', icon: 'game', color: '#F65B4F' },
  { id: 'draw', name: 'Chora kwa maneno', sub: 'Eleza picha, AI inaichora', icon: 'image', color: '#1EA7F0' },
  { id: 'video', name: 'Panga video fupi', sub: 'Matukio ya kuigiza na kurekodi', icon: 'camera', color: '#0FB394' },
  { id: 'design', name: 'Buni mchezo', sub: 'Sheria, ngazi na lengo', icon: 'robot', color: '#FF8A3D' },
];

function studioAllowed(c) { return ageYears(c.birth) >= 8; }
function creations(c) { return Store.get('creations_' + c.id, []); }
function saveCreation(c, item) {
  const list = creations(c);
  list.unshift(Object.assign({ id: uid(), t: Date.now() }, item));
  Store.set('creations_' + c.id, list.slice(0, 60));
  AI.log(c.id, '[Studio: ' + item.type + '] ' + item.title, item.summary || '');
}
async function askJSON(text, maxTokens = 900) {
  const raw = await AI.ask({ system: STUDIO_RULES + '\nJibu kwa JSON halali TU, bila maelezo mengine.', text, maxTokens });
  const m = raw.match(/[\[{][\s\S]*[\]}]/);
  if (!m) throw new Error('Jibu la AI halikueleweka');
  return JSON.parse(m[0]);
}

function safeSVG(src) {
  const m = String(src).match(/<svg[\s\S]*<\/svg>/i);
  if (!m) return '';
  const doc = new DOMParser().parseFromString(m[0], 'image/svg+xml');
  const svg = doc.documentElement;
  if (!svg || svg.nodeName.toLowerCase() !== 'svg') return '';
  svg.querySelectorAll('script, foreignObject, image, a, iframe, use').forEach(n => n.remove());
  svg.querySelectorAll('*').forEach(n => [...n.attributes].forEach(a => { if (/^on/i.test(a.name) || /href/i.test(a.name)) n.removeAttribute(a.name); }));
  svg.setAttribute('width', '100%'); svg.removeAttribute('height');
  return new XMLSerializer().serializeToString(svg);
}

/* ---------- Studio ---------- */
HK.screens.aiStudio = (el) => {
  const c = Store.active();
  const mine = creations(c);
  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>AI Studio</h1></div>
    <div class="scroll">
      <div class="hero" style="margin:4px 0 0;background:linear-gradient(135deg,#7B61FF,#1EA7F0)">
        <div class="row"><span>${mascot('nuru', 64)}</span><div><div class="nm" style="font-size:20px">Create with Nuru</div><div class="hi">Learn to use AI to create stories, games, pictures and videos.</div></div></div>
      </div>
      <div class="section-title">Start here</div>
      <button class="item" data-lesson="1"><div class="i-ic" style="background:var(--navy)">${icon('robot', 26)}</div>
        <div class="grow"><div class="i-title">What is AI?</div><div class="i-sub">A short lesson and 5 questions</div></div>${icon('chevR', 22)}</button>
      <div class="section-title">Miradi</div>
      ${PROJECTS.map(p => `<button class="item" data-p="${p.id}"><div class="i-ic" style="background:${p.color}">${icon(p.icon, 26)}</div>
        <div class="grow"><div class="i-title">${p.name}</div><div class="i-sub">${p.sub}</div></div>${icon('chevR', 22)}</button>`).join('')}
      <div class="section-title">Kazi zangu (${mine.length})</div>
      ${mine.length ? mine.slice(0, 12).map(m => `<button class="item" data-m="${m.id}"><div class="i-ic" style="background:${(PROJECTS.find(p => p.id === m.type) || {}).color || 'var(--blue)'}">${icon((PROJECTS.find(p => p.id === m.type) || {}).icon || 'file', 24)}</div>
        <div class="grow"><div class="i-title">${esc(m.title)}</div><div class="i-sub">${new Date(m.t).toLocaleDateString()}</div></div></button>`).join('') : '<p class="muted" style="font-weight:500;margin:0 2px">Kazi utakazounda zitaonekana hapa.</p>'}
    </div>`;
  $('#bk', el).onclick = () => HK.back();
  $('[data-lesson]', el).onclick = () => HK.go('cardLesson', { key: 'ai' });
  $$('[data-p]', el).forEach(b => b.onclick = () => {
    if (!AI.ready()) return modal(el, { iconName: 'nuru', title: "Ask your parent", text: 'Studio ya AI inahitaji mzazi aweke AI kwenye Mipangilio.', buttons: [{ label: 'Sawa' }] });
    HK.go('proj_' + b.dataset.p);
  });
  $$('[data-m]', el).forEach(b => b.onclick = () => HK.go('creation', { id: b.dataset.m }));
};

function projFrame(el, title, intro) {
  const c = Store.active();
  const t0 = Date.now();
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(title)}</h1></div>
    <div class="scroll" id="pb"><div class="card row" style="align-items:flex-start;gap:12px"><span>${mascot('nuru', 48)}</span><p style="font-size:15px">${esc(intro)}</p></div><div id="pw"></div></div>`;
  $('#bk', el).onclick = () => HK.back();
  speak(intro);
  return { c, body: $('#pw', el), done: () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000)) };
}
const busyBtn = (b, on, label) => { b.disabled = on; b.innerHTML = on ? 'Nuru anaunda...' : label; };
const promptTip = (txt) => `<div class="card" style="background:#F2EEFF;border-color:#E2DAFF"><b style="font-size:13px;color:#5A43D6">Your instruction to the AI</b><p style="font-size:14px;margin-top:4px;font-style:italic">${esc(txt)}</p></div>`;

/* ---------- 1. Hadithi ---------- */
HK.screens.proj_story = (el) => {
  const P = projFrame(el, 'Tunga hadithi', 'Chagua mhusika, mahali na tatizo. Nitaandika mwanzo, kisha wewe utaamua kinachofuata!');
  const story = [];
  P.body.innerHTML = `
    <label class="label">Mhusika mkuu</label><input class="field" id="who" placeholder="Mfano: Twiga mdogo anayeitwa Zuri">
    <label class="label">Mahali</label><input class="field" id="where" placeholder="Mfano: Mlima Kilimanjaro">
    <label class="label">Problem or challenge</label><input class="field" id="prob" placeholder="Mfano: amepoteza rafiki yake">
    <div style="height:16px"></div><button class="btn block" id="go">${icon('send', 20)} Anza hadithi</button><div id="out"></div>`;
  let round = 0;
  const step = async (choice) => {
    const b = $('#go', el) || $('.choice', el);
    const ctx = story.map(s => s.text).join('\n');
    const who = $('#who', el) ? $('#who', el).value : '';
    const prompt = round === 0
      ? `Andika mwanzo wa hadithi kwa watoto (sentensi 4-5). Mhusika: ${who}. Mahali: ${$('#where', el).value}. Tatizo: ${$('#prob', el).value}. Rudisha {"title":"jina la hadithi","text":"...","choices":["chaguo 1 la kinachofuata","chaguo 2"],"tip":"kidokezo kimoja cha kuandika agizo bora"}`
      : `Hadithi hadi sasa:\n${ctx}\nMtoto amechagua: ${choice}. Endeleza sentensi 4-5. ${round >= 2 ? 'Maliza hadithi kwa mwisho mzuri na funzo. choices iwe [].' : 'Toa chaguo 2 za kinachofuata.'} Rudisha {"text":"...","choices":[...]}`;
    if (b) busyBtn(b, true);
    try {
      const j = await askJSON(prompt);
      if (round === 0) { story.title = j.title || who; story.tip = j.tip; }
      story.push({ text: j.text, choice });
      round++;
      speak(j.text);
      $('#out', el).innerHTML = (round === 1 ? promptTip(`Hadithi kuhusu ${who}, mahali ${$('#where', el).value}, tatizo: ${$('#prob', el).value}`) : '') +
        `<div class="lesson-card" style="text-align:left;margin:12px 0"><b style="font-size:20px">${esc(story.title)}</b>${story.map(s => `${s.choice ? `<p class="muted" style="font-size:13px;margin:10px 0 2px">Ulichagua: ${esc(s.choice)}</p>` : ''}<p style="font-size:16px;line-height:1.6;color:var(--navy)">${esc(s.text)}</p>`).join('')}</div>` +
        (story.tip ? `<div class="card"><b style="font-size:13px">Kidokezo cha Nuru</b><p>${esc(story.tip)}</p></div>` : '') +
        ((j.choices || []).length ? `<div class="section-title">Nini kinafuata?</div>${j.choices.map(x => `<button class="btn block ghost choice" style="margin-bottom:10px">${esc(x)}</button>`).join('')}` :
          `<button class="btn block" id="save">${icon('check', 20)} Hifadhi hadithi yangu</button>`);
      $$('.choice', el).forEach(x => x.onclick = () => step(x.textContent));
      const sv = $('#save', el);
      if (sv) sv.onclick = () => { saveCreation(P.c, { type: 'story', title: story.title, data: story.map(s => s.text), summary: story.map(s => s.text).join(' ').slice(0, 300) }); Sfx.win(); confetti(el); toast("Story saved"); HK.back(); };
      const go = $('#go', el); if (go) go.remove();
      $$('#who, #where, #prob', el).forEach(i => i.disabled = true);
    } catch (e) { toast("Nuru couldn't write it. Try again"); if (b) busyBtn(b, false, 'Jaribu tena'); }
  };
  $('#go', el).onclick = () => {
    if (!$('#who', el).value.trim() || !$('#where', el).value.trim()) return toast("Fill in the character and the place");
    step('');
  };
  return P.done;
};

HK.screens.proj_quiz = (el) => {
  const P = projFrame(el, 'Mchezo wa maswali', 'Chagua mada unayoipenda. Nitatengeneza maswali, wewe utayakagua kisha utacheza mchezo wako!');
  P.body.innerHTML = `
    <label class="label">Mada</label><input class="field" id="topic" placeholder="Mfano: Wanyama wa Serengeti">
    <label class="label">Ugumu</label><div class="chips" id="lvl"><button class="chip on">Easy</button><button class="chip">Wastani</button><button class="chip">Mgumu</button></div>
    <div style="height:16px"></div><button class="btn block" id="go">${icon('send', 20)} Tengeneza maswali</button><div id="out"></div>`;
  let lvl = 'Rahisi';
  $$('#lvl .chip', el).forEach(b => b.onclick = () => { lvl = b.textContent; $$('#lvl .chip', el).forEach(x => x.classList.toggle('on', x === b)); });
  $('#go', el).onclick = async () => {
    const topic = $('#topic', el).value.trim(); if (!topic) return toast("Enter a topic");
    const b = $('#go', el); busyBtn(b, true);
    try {
      const qs = await askJSON(`Tengeneza maswali 5 ya chaguo kuhusu "${topic}" kwa mtoto wa miaka ${ageYears(P.c.birth)}, kiwango ${lvl}. Ukweli uwe sahihi. Rudisha [{"q":"swali","opts":["a","b","c"],"a":0}] ambapo a ni namba ya jibu sahihi.`);
      const list = qs.filter(q => q && q.q && Array.isArray(q.opts) && q.opts.length >= 2).slice(0, 5);
      if (!list.length) throw new Error('empty');
      $('#out', el).innerHTML = promptTip(`Maswali 5 kuhusu ${topic}, kiwango ${lvl}`) +
        `<div class="section-title">Kagua maswali yako</div>` +
        list.map((q, i) => `<div class="card"><b>${i + 1}. ${esc(q.q)}</b><p style="margin-top:6px">${q.opts.map((o, k) => `${k === q.a ? '<b style="color:var(--teal-d)">' + esc(o) + ' (sahihi)</b>' : esc(o)}`).join(' · ')}</p></div>`).join('') +
        `<div class="card" style="background:#FFF4D2"><p>Are all the answers correct? AI can make mistakes. If you see an error, create again.</p></div>
        <div class="btn-row"><button class="btn ghost" id="again">${icon('repeat', 20)} Upya</button><button class="btn" id="save" style="flex:2">${icon('play', 20)} Hifadhi na ucheze</button></div>`;
      $('#again', el).onclick = () => $('#go', el).click();
      $('#save', el).onclick = () => {
        const title = 'Maswali: ' + topic;
        saveCreation(P.c, { type: 'quiz', title, data: list, summary: list.map(q => q.q).join(' | ') });
        HK.go('playQuiz', { title, list }, { replace: true });
      };
      busyBtn(b, false, icon('send', 20) + ' Tengeneza tena');
    } catch (e) { toast("That didn't work. Try another topic"); busyBtn(b, false, icon('send', 20) + ' Jaribu tena'); }
  };
  return P.done;
};
HK.screens.playQuiz = (el, p) => {
  const c = Store.active();
  runQuiz(el, p.title, p.list.map(q => ({ text: q.q, say: q.q, cols: 1, opts: shuffle(q.opts.map((o, k) => ({ label: o, ok: k === q.a, style: 'font-size:18px;min-height:60px' }))) })),
    stars => { const cc = Store.active(); cc.coins = (cc.coins || 0) + stars * 3; Store.saveChild(cc); });
  const t0 = Date.now();
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};

HK.screens.proj_draw = (el) => {
  const P = projFrame(el, 'Chora kwa maneno', 'Eleza picha unayotaka: nini kiwepo, rangi zake, na kiko wapi. Kadiri unavyoeleza vizuri, ndivyo picha inavyokuwa bora!');
  P.body.innerHTML = `
    <label class="label">Eleza picha yako</label>
    <textarea class="field" id="d" placeholder="Mfano: Nyumba ndogo ya bluu juu ya mlima, jua la njano angani, na mti wa kijani pembeni"></textarea>
    <div class="chips" style="margin-top:10px">${['rangi angavu', 'mtindo wa katuni', 'usiku wenye nyota', 'ufukweni'].map(x => `<button class="chip add">+ ${x}</button>`).join('')}</div>
    <div style="height:16px"></div><button class="btn block" id="go">${icon('image', 20)} Chora</button><div id="out"></div>`;
  $$('.add', el).forEach(b => b.onclick = () => { const t = $('#d', el); t.value = (t.value ? t.value + ', ' : '') + b.textContent.slice(2); });
  $('#go', el).onclick = async () => {
    const d = $('#d', el).value.trim(); if (d.length < 8) return toast("Describe the picture a little more");
    const b = $('#go', el); busyBtn(b, true);
    try {
      const raw = await AI.ask({ system: STUDIO_RULES, maxTokens: 2500, text: `Chora picha hii kama SVG rahisi ya mtindo wa katuni kwa watoto: "${d}". Tumia viewBox="0 0 300 300", maumbo (rect, circle, ellipse, path, polygon) na rangi angavu. Usitumie maandishi, picha za nje wala script. Kisha mstari mmoja baada ya SVG: TIP: kidokezo kimoja cha kuboresha maelezo.` });
      const svg = safeSVG(raw);
      if (!svg) throw new Error('nosvg');
      const tip = (raw.split(/TIP:/i)[1] || '').trim();
      $('#out', el).innerHTML = promptTip(d) + `<div class="lesson-card" style="padding:12px;margin:12px 0">${svg}</div>` +
        (tip ? `<div class="card"><b style="font-size:13px">Kidokezo cha Nuru</b><p>${esc(tip)}</p></div>` : '') +
        `<div class="btn-row"><button class="btn ghost" id="again">${icon('repeat', 20)} Badilisha</button><button class="btn" id="save" style="flex:2">${icon('check', 20)} Hifadhi picha</button></div>`;
      $('#again', el).onclick = () => { $('#d', el).focus(); toast("Add details, then Draw again"); };
      $('#save', el).onclick = () => { saveCreation(P.c, { type: 'draw', title: d.slice(0, 40), data: svg, summary: d }); Sfx.win(); toast("Picture saved"); HK.back(); };
      busyBtn(b, false, icon('image', 20) + ' Chora tena');
    } catch (e) { toast("It didn't draw well. Try again"); busyBtn(b, false, icon('image', 20) + ' Jaribu tena'); }
  };
  return P.done;
};

/* ---------- 4. Video fupi (matukio) ---------- */
HK.screens.proj_video = (el) => {
  const P = projFrame(el, 'Panga video fupi', 'Video nzuri huanza na mpango. Niambie wazo lako, nitakusaidia kupanga matukio 4 ya kuigiza na kurekodi na mzazi.');
  P.body.innerHTML = `
    <label class="label">Wazo la video</label><input class="field" id="idea" placeholder="Mfano: Jinsi ya kupanda mti nyumbani">
    <label class="label">Aina</label><div class="chips" id="kind">${['Ya kufundisha', 'Ya kuchekesha', 'Hadithi'].map((k, i) => `<button class="chip ${i ? '' : 'on'}">${k}</button>`).join('')}</div>
    <div style="height:16px"></div><button class="btn block" id="go">${icon('camera', 20)} Panga matukio</button><div id="out"></div>`;
  let kind = 'Ya kufundisha';
  $$('#kind .chip', el).forEach(b => b.onclick = () => { kind = b.textContent; $$('#kind .chip', el).forEach(x => x.classList.toggle('on', x === b)); });
  $('#go', el).onclick = async () => {
    const idea = $('#idea', el).value.trim(); if (!idea) return toast("Write an idea");
    const b = $('#go', el); busyBtn(b, true);
    try {
      const j = await askJSON(`Panga video fupi (dakika 1) ${kind.toLowerCase()} ambayo mtoto anaweza kurekodi nyumbani na mzazi: "${idea}". Rudisha {"title":"...","scenes":[{"scene":"Tukio 1: ...","action":"anachofanya","say":"maneno ya kusema"}],"tip":"kidokezo kimoja cha kurekodi vizuri"} na matukio 4.`);
      $('#out', el).innerHTML = promptTip(`Video ${kind.toLowerCase()} kuhusu ${idea}`) + `<div class="section-title">${esc(j.title || idea)}</div>` +
        (j.scenes || []).map((s, i) => `<div class="card"><span class="chip-tag teal">Tukio ${i + 1}</span><h3 style="margin-top:8px">${esc(s.scene)}</h3><p>${esc(s.action)}</p>${s.say ? `<p style="margin-top:6px;font-style:italic">"${esc(s.say)}"</p>` : ''}</div>`).join('') +
        (j.tip ? `<div class="card" style="background:#FFF4D2"><b style="font-size:13px">Kidokezo</b><p>${esc(j.tip)}</p></div>` : '') +
        `<button class="btn block" id="save">${icon('check', 20)} Hifadhi mpango</button>`;
      $('#save', el).onclick = () => { saveCreation(P.c, { type: 'video', title: j.title || idea, data: j, summary: idea }); Sfx.win(); toast("Plan saved. Ask your parent to record it with you!"); HK.back(); };
      busyBtn(b, false, icon('camera', 20) + ' Panga upya');
    } catch (e) { toast("That didn't work. Try again"); busyBtn(b, false, icon('camera', 20) + ' Jaribu tena'); }
  };
  return P.done;
};

HK.screens.proj_design = (el) => {
  const P = projFrame(el, 'Buni mchezo', 'Kila mchezo una lengo, sheria na ngazi. Niambie wazo lako, tutaujenga pamoja!');
  P.body.innerHTML = `
    <label class="label">Wazo la mchezo</label><textarea class="field" id="idea" placeholder="Mfano: Kobe anakusanya matunda msituni huku akiepuka mvua"></textarea>
    <div style="height:16px"></div><button class="btn block" id="go">${icon('robot', 20)} Buni mchezo</button><div id="out"></div>`;
  $('#go', el).onclick = async () => {
    const idea = $('#idea', el).value.trim(); if (idea.length < 8) return toast("Describe the idea a little more");
    const b = $('#go', el); busyBtn(b, true);
    try {
      const j = await askJSON(`Msaidie mtoto kubuni mchezo wa simu kutokana na wazo hili: "${idea}". Rudisha {"name":"jina la mchezo","goal":"lengo","controls":"jinsi ya kucheza kwa kugusa","rules":["sheria 3"],"levels":["ngazi 1","ngazi 2","ngazi 3"],"twist":"kitu kimoja cha kushangaza","learn":"mtoto atajifunza nini","question":"swali moja la kumfanya mtoto afikiri zaidi kuhusu mchezo wake"}`);
      const sec = (t, x) => `<div class="card"><b style="font-size:13px;color:var(--muted)">${t}</b><div style="margin-top:4px">${x}</div></div>`;
      $('#out', el).innerHTML = promptTip(idea) +
        `<div class="hero" style="margin:12px 0;background:linear-gradient(135deg,#FF8A3D,#F65B4F)"><div class="nm">${esc(j.name)}</div><div class="hi" style="margin-top:4px">${esc(j.goal)}</div></div>` +
        sec('Jinsi ya kucheza', esc(j.controls)) +
        sec('Sheria', (j.rules || []).map(r => '• ' + esc(r)).join('<br>')) +
        sec('Ngazi', (j.levels || []).map((r, i) => `${i + 1}. ${esc(r)}`).join('<br>')) +
        sec('Kitu cha kushangaza', esc(j.twist)) +
        sec('Utajifunza', esc(j.learn)) +
        (j.question ? `<div class="card" style="background:#F2EEFF"><b style="font-size:13px;color:#5A43D6">Nuru anakuuliza</b><p>${esc(j.question)}</p></div>` : '') +
        `<button class="btn block" id="save">${icon('check', 20)} Hifadhi mchezo wangu</button>`;
      if (j.question) speak(j.question);
      $('#save', el).onclick = () => { saveCreation(P.c, { type: 'design', title: j.name, data: j, summary: idea }); Sfx.win(); confetti(el); toast("Your game is saved"); HK.back(); };
      busyBtn(b, false, icon('robot', 20) + ' Buni upya');
    } catch (e) { toast("That didn't work. Try again"); busyBtn(b, false, icon('robot', 20) + ' Jaribu tena'); }
  };
  return P.done;
};

HK.screens.creation = (el, p) => {
  const c = Store.active();
  const m = creations(c).find(x => x.id === p.id);
  if (!m) { HK.back(); return; }
  let html = '';
  if (m.type === 'story') html = `<div class="lesson-card" style="text-align:left">${m.data.map(t => `<p style="font-size:16px;line-height:1.6;color:var(--navy)">${esc(t)}</p>`).join('')}</div>`;
  if (m.type === 'draw') html = `<div class="lesson-card" style="padding:12px">${safeSVG(m.data)}</div><p class="muted" style="padding:0 4px">${esc(m.summary)}</p>`;
  if (m.type === 'quiz') html = `<button class="btn block" id="play">${icon('play', 20)} Cheza</button>` + m.data.map((q, i) => `<div class="card" style="margin-top:12px"><b>${i + 1}. ${esc(q.q)}</b></div>`).join('');
  if (m.type === 'video') html = (m.data.scenes || []).map((s, i) => `<div class="card"><span class="chip-tag teal">Tukio ${i + 1}</span><h3 style="margin-top:8px">${esc(s.scene)}</h3><p>${esc(s.action)}</p>${s.say ? `<p style="font-style:italic">"${esc(s.say)}"</p>` : ''}</div>`).join('');
  if (m.type === 'design') html = `<div class="card"><h3>${esc(m.data.goal)}</h3><p>${esc(m.data.controls)}</p><p style="margin-top:8px">${(m.data.rules || []).map(r => '• ' + esc(r)).join('<br>')}</p></div>`;
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>${esc(m.title)}</h1></div><div class="scroll">${html}
    <div style="height:14px"></div><button class="btn block ghost" id="del">${icon('trash', 20)} Futa</button></div>`;
  $('#bk', el).onclick = () => HK.back();
  const pl = $('#play', el); if (pl) pl.onclick = () => HK.go('playQuiz', { title: m.title, list: m.data });
  $('#del', el).onclick = () => confirmBox(el, "Delete this task?", '', "Delete", () => { Store.set('creations_' + c.id, creations(c).filter(x => x.id !== m.id)); HK.back(); });
};
