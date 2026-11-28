

const HW_STATUS = {
  new: { label: "New", cls: 'blue' },
  doing: { label: 'Anaifanya', cls: 'sun' },
  submitted: { label: 'Imetumwa', cls: 'coral' },
  returned: { label: 'Irekebishwe', cls: 'sun' },
  approved: { label: 'Imekubaliwa', cls: 'teal' },
};
const SUBJECTS = ['Math', 'English', 'Kiswahili', 'Science', 'Faith', 'Other'];
const PAGE_W = 1000, PAGE_H = 1414;

function wrapText(ctx, text, maxW) {
  const out = [];
  String(text).split('\n').forEach(par => {
    let line = '';
    par.split(' ').forEach(w => {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    });
    out.push(line);
  });
  return out;
}

function pageSize(pg) {
  if (pg.bg && pg.w) return { w: PAGE_W, h: Math.round(PAGE_W * pg.h / pg.w) };
  return { w: PAGE_W, h: PAGE_H };
}

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

async function drawPageBg(ctx, pg, isCurrent = () => true) {
  const { w, h } = pageSize(pg);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  if (pg.bg) {
    const img = await loadImg(pg.bg);
    if (isCurrent()) ctx.drawImage(img, 0, 0, w, h);
    return;
  }

  ctx.strokeStyle = '#D6E2F3'; ctx.lineWidth = 2;
  for (let y = 120; y < h - 30; y += 56) { ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 40, y); ctx.stroke(); }
  ctx.strokeStyle = '#F7B4AE'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(110, 30); ctx.lineTo(110, h - 30); ctx.stroke();
  // maswali
  const qs = pg.questions || [];
  ctx.fillStyle = '#0D2461';
  ctx.font = 'bold 34px Outfit, Roboto, sans-serif';
  ctx.textBaseline = 'alphabetic';
  let y = 112;
  qs.forEach((q, i) => {
    const lines = wrapText(ctx, q, w - 180);
    lines.forEach(l => { ctx.fillText(l, 130, y - 12); y += 56; });
    y += 56 * (qs.length > 1 ? 3 : 8); 
  });
}

function drawStrokes(ctx, strokes) {
  strokes.forEach(s => {
    ctx.save();
    ctx.globalCompositeOperation = s.erase ? 'destination-out' : 'source-over';
    ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
    ctx.lineWidth = s.width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const p = s.points;
    if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0][0], p[0][1], s.width / 2, 0, Math.PI * 2); ctx.fill(); }
    else {
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
        ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
      }
      ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
      ctx.stroke();
    }
    ctx.restore();
  });
}

async function renderPage(pg, quality = 0.8) {
  const { w, h } = pageSize(pg);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d');
  await drawPageBg(x, pg);
  const ink = document.createElement('canvas'); ink.width = w; ink.height = h;
  drawStrokes(ink.getContext('2d'), pg.strokes || []);
  x.drawImage(ink, 0, 0);
  return c.toDataURL('image/jpeg', quality);
}

HK.screens.hwNew = (el) => {
  const kids = Store.children();
  if (!kids.length) return HK.go('childForm', { first: true }, { replace: true });
  const hw = { id: uid(), childId: Store.active()?.id || kids[0].id, title: '', subject: SUBJECTS[0], files: [], pages: [], status: 'new', created: Date.now(), stars: 0, feedback: '' };

  el.innerHTML = `
    <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>New homework</h1></div>
    <div class="scroll">
      ${kids.length > 1 ? `<label class="label">Whose is it?</label><div class="chips" id="kid">${kids.map(k => `<button class="chip ${k.id === hw.childId ? 'on' : ''}" data-id="${k.id}">${esc(k.name)}</button>`).join('')}</div>` : ''}
      <label class="label">Jina la homework</label>
      <input class="field" id="title" aria-label="Homework title" placeholder="Mfano: Hesabu ukurasa 12">
      <label class="label">Lesson</label>
      <div class="chips" id="sub">${SUBJECTS.map(s => `<button class="chip ${s === hw.subject ? 'on' : ''}">${s}</button>`).join('')}</div>
      <label class="label">Kurasa</label>
      <div class="pages-grid" id="pages"></div>
      <div style="height:12px"></div>
      <div class="btn-row">
        <button class="btn blue" id="photo">${icon('camera', 22)} Picha</button>
        <button class="btn ghost" id="blank">${icon('file', 22)} Andika swali</button>
      </div>
      <div style="height:12px"></div>
      <button class="btn block navy hidden" id="ai">${icon('book', 22)} Soma picha kwa AI (iwe rahisi kuandika)</button>
      <label class="label" for="document">Attach Word or PDF</label><input class="field" id="document" type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"><div id="documents"></div>
      <input type="file" id="file" accept="image/*" multiple class="hidden">
      <div style="height:22px"></div>
      <button class="btn block" id="save">${icon('send', 22)} Mpe mtoto</button>
    </div>`;
  $('#bk', el).onclick = () => HK.back();

  $$('#kid .chip', el).forEach(b => b.onclick = () => { hw.childId = b.dataset.id; $$('#kid .chip', el).forEach(x => x.classList.toggle('on', x === b)); });
  $$('#sub .chip', el).forEach(b => b.onclick = () => { hw.subject = b.textContent; $$('#sub .chip', el).forEach(x => x.classList.toggle('on', x === b)); });

  const drawPages = () => {
    const box = $('#pages', el);
    box.innerHTML = hw.pages.map((p, i) => `<div class="page-thumb">
      ${p.bg ? `<img src="${esc(p.bg)}">` : `<div class="ph-text">${esc((p.questions || []).join('\n'))}</div>`}
      <span class="num">${i + 1}</span><button class="rm" data-i="${i}">${icon('x', 16)}</button></div>`).join('')
      || '<p class="muted" style="grid-column:span 3;font-weight:700;margin:0">Piga picha ya kila ukurasa wa homework, au andika swali.</p>';
    $$('.rm', box).forEach(b => b.onclick = () => { hw.pages.splice(+b.dataset.i, 1); drawPages(); });
    $('#ai', el).classList.toggle('hidden', !hw.pages.some(p => p.bg));
  };

  $('#photo', el).onclick = () => $('#file', el).click();
  $('#file', el).onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    for (const f of files) {
      try { const r = await fileToImageData(f); hw.pages.push({ bg: r.data, w: r.w, h: r.h, strokes: [] }); }
      catch (err) { toast("One photo didn't open"); }
    }
    e.target.value = '';
    drawPages();
  };
  $('#document', el).onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    const save = $('#save', el);
    save.disabled = true;
    e.target.disabled = true;
    try {
      const child = Store.child(hw.childId);
      const uploaded = await Net.upload(file, file.name, child?.serverId);
      hw.files.push({ file: uploaded.file, mime: uploaded.mime, label: file.name });
      $('#documents', el).textContent = hw.files.map(f => f.label).join(', ');
    } catch (error) { toast(error.message); }
    finally { save.disabled = false; e.target.disabled = false; e.target.value = ''; }
  };
  $('#blank', el).onclick = () => {
    const ov = modal(el, {
      title: "Enter a question", html: '<label class="label" for="topic">Ask Nuru to draft questions</label><input id="topic" class="field" placeholder="Topic, e.g. counting fruit"><button type="button" class="btn ghost" id="suggest">Generate questions</button><label class="label" for="q">Review or write your questions</label><textarea class="field" id="q" placeholder="Example: What is 5 + 3?" style="margin-bottom:16px;text-align:left"></textarea>',
      buttons: [{ label: 'Add page', keepOpen: true, onClick: (o) => {
        const t = $('#q', o).value.trim();
        if (!t) return toast('Enter at least one question.');
        const questions = t.split(/\n+/).map(line => line.trim()).filter(Boolean);
        for (let i = 0; i < questions.length; i += 3) {
          hw.pages.push({ bg: null, questions: questions.slice(i, i + 3), strokes: [] });
        }
        o.remove();
        drawPages();
      } }, { label: 'Ghairi', cls: 'ghost' }],
    });
    $('#suggest', ov).onclick = async e => {
      const topic = $('#topic', ov).value.trim();
      if (!topic) return toast('Enter a topic first.');
      const button = e.currentTarget;
      button.disabled = true;
      try {
        const draft = AI.ready() ? await AI.ask({ system: 'Draft three short age-appropriate homework questions, one per line, without answers. Use English except for a Kiswahili lesson.', text: hw.subject + ': ' + topic, maxTokens: 300 }) : (await Net.post('/api/ai/generate', { task: 'worksheet', topic, subject: hw.subject, level: Store.child(hw.childId)?.grade, count: 3, lang: hw.subject === 'Kiswahili' ? 'Kiswahili' : 'English' })).text;
        const field = $('#q', ov);
        field.value = [field.value.trim(), draft].filter(Boolean).join('\n');
      } catch (error) { toast(error.message); }
      finally { button.disabled = false; }
    };
    setTimeout(() => $('#q', ov) && $('#q', ov).focus(), 100);
  };

  $('#ai', el).onclick = async () => {
    if (!AI.cfg().key) {
      return modal(el, { iconName: 'sliders', title: "Set up AI first", text: "Choose Gemini, Claude or ChatGPT and enter the API key in Settings.", buttons: [{ label: "Open AI settings", onClick: () => HK.go('aiSettings') }, { label: 'Baadaye', cls: 'ghost' }] });
    }
    const b = $('#ai', el); b.disabled = true; b.innerHTML = 'AI inasoma homework...';
    try {
      const photos = hw.pages.filter(p => p.bg);
      const r = await AI.readHomework(photos.map(p => p.bg));
      const qs = r.questions;
      const per = qs.length > 8 ? 4 : qs.length > 4 ? 3 : Math.max(1, Math.min(4, qs.length));
      const newPages = [];
      for (let i = 0; i < qs.length; i += per) newPages.push({ bg: null, questions: qs.slice(i, i + per), strokes: [] });
      hw.original = photos.map(p => p.bg);
      hw.pages = newPages;
      if (!$('#title', el).value.trim() && r.title) $('#title', el).value = r.title;
      if (r.subject && SUBJECTS.includes(r.subject)) { hw.subject = r.subject; $$('#sub .chip', el).forEach(x => x.classList.toggle('on', x.textContent === r.subject)); }
      drawPages();
      modal(el, { iconName: 'check', title: 'Imesomwa', text: `AI imepata maswali ${qs.length} na kuyaweka kwenye kurasa ${newPages.length} zenye nafasi ya kuandika. Picha ya asili imehifadhiwa kwa ajili yako.`, buttons: [{ label: 'Sawa' }] });
    } catch (e) {
      modal(el, { iconName: 'x', iconColor: 'var(--coral)', title: 'Haikuweza kusoma', text: e.message + '. Mtoto bado anaweza kuandika juu ya picha.', buttons: [{ label: 'Sawa' }] });
    }
    b.disabled = false; b.innerHTML = icon('book', 22) + ' Soma picha kwa AI (iwe rahisi kuandika)';
    $('#ai', el).classList.toggle('hidden', !hw.pages.some(p => p.bg));
  };

  $('#save', el).onclick = async () => {
    hw.title = $('#title', el).value.trim() || hw.subject;
    if (!hw.pages.length && hw.files.length) hw.pages.push({ bg: null, questions: ["Open the attachment and write your answers here."], strokes: [] });
    if (!hw.pages.length) return toast("Add at least one page");
    await HWDB.put(hw);
    Sfx.good(); toast("Homework sent to the child");
    HK.back();
  };
  drawPages();
};

HK.screens.hwReview = (el, p) => {
  el.innerHTML = '<div class="center-col">Inapakia...</div>';
  HWDB.get(p.id).then(async hw => {
    if (!el.isConnected) return;
    if (!hw || !Store.child(hw.childId)) { HK.back(); return; }
    const c = Store.child(hw.childId);
    const st = HW_STATUS[hw.status];
    const imgs = hw.status === 'submitted' || hw.status === 'approved' || hw.status === 'returned'
      ? (hw.merged && hw.merged.length ? hw.merged : await Promise.all(hw.pages.map(pg => renderPage(pg))))
      : await Promise.all(hw.pages.map(pg => renderPage(pg)));
    let stars = hw.stars || 3;
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button>
        <div class="grow"><h1 style="font-size:19px">${esc(hw.title)}</h1><div class="sub">${esc(c ? c.name : '')} · ${esc(hw.subject)}</div></div>
        <span class="chip-tag ${st.cls}">${st.label}</span></div>
      <div class="scroll">
        ${attachmentsHTML(hw.files)}
        ${imgs.map(s => `<img class="review-page" src="${esc(s)}">`).join('')}
        ${hw.original ? `<div class="section-title">Original photo</div>${hw.original.map(s => `<img class="review-page" src="${esc(s)}">`).join('')}` : ''}
        ${hw.status === 'submitted' ? `
          <div class="card" style="text-align:center">
            <h3>Give stars</h3>
            <div class="stars-pick">${[1, 2, 3].map(n => `<button data-s="${n}">${icon('star', 46, 1.6)}</button>`).join('')}</div>
            <textarea class="field" id="fb" placeholder="Ujumbe kwa mtoto (si lazima)" style="margin-top:12px;min-height:70px"></textarea>
            <div style="height:14px"></div>
            <button class="btn block" id="ok">${icon('check', 22)} Kubali homework</button>
            <div style="height:12px"></div>
            <button class="btn block sun" id="ret">${icon('repeat', 22)} Arekebishe</button>
          </div>` : ''}
        ${hw.status === 'approved' ? `<div class="card" style="text-align:center"><div class="earned">${starsHTML(hw.stars)}</div>${hw.feedback ? `<p>${esc(hw.feedback)}</p>` : ''}</div>` : ''}
        <button class="btn block ghost" id="del">${icon('trash', 20)} Futa homework</button>
      </div>`;
    bindAttachments(el, hw.files);
    $('#bk', el).onclick = () => HK.back();
    const paint = () => $$('.stars-pick button', el).forEach(b => b.classList.toggle('on', +b.dataset.s <= stars));
    $$('.stars-pick button', el).forEach(b => b.onclick = () => { stars = +b.dataset.s; Sfx.tap(); paint(); });
    paint();
    const ok = $('#ok', el);
    if (ok) ok.onclick = async () => {
      hw.status = 'approved'; hw.stars = stars; hw.feedback = $('#fb', el).value.trim();
      await HWDB.put(hw);
      const kid = Store.child(hw.childId);
      if (kid) { kid.stars = (kid.stars || 0) + stars; kid.coins = (kid.coins || 0) + stars * 10; Store.saveChild(kid); }
      const bonus = Store.settings().bonusMin;
      if (bonus) HK.addBonus(hw.childId, bonus);
      Sfx.win(); confetti(el);
      toast(`Nyota ${stars}${bonus ? ' na dakika ' + bonus + ' za michezo' : ''} zimetolewa`);
      setTimeout(() => HK.back(), 900);
    };
    const ret = $('#ret', el);
    if (ret) ret.onclick = async () => {
      hw.status = 'returned'; hw.feedback = $('#fb', el).value.trim() || "Check your work again and fix it.";
      await HWDB.put(hw); toast("Returned to the child"); HK.back();
    };
    $('#del', el).onclick = () => confirmBox(el, "Delete homework?", "This work will be deleted permanently.", "Delete", async () => { await HWDB.del(hw.id); HK.back(); });
  });
};

HK.screens.hwList = (el) => {
  const c = Store.active();
  el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><h1>Homework yangu</h1></div><div class="scroll" id="list"></div>`;
  $('#bk', el).onclick = () => HK.back();
  SchoolSync.pull(c).catch(() => {}).then(() => HWDB.byChild(c.id)).then(list => {
    const box = $('#list', el); if (!box) return;
    if (!list.length) {
      box.innerHTML = `<div class="empty scene-empty">${mascot('tembo', 148, 'mascot-peek')}<br>Huna homework sasa hivi.<br>Ask your parent to take a photo of your homework.</div>`;
      speak("You have no homework right now");
      return;
    }
    const order = { returned: 0, new: 1, doing: 2, submitted: 3, approved: 4 };
    list.sort((a, b) => order[a.status] - order[b.status] || b.created - a.created);
    box.innerHTML = list.map(h => {
      const st = HW_STATUS[h.status];
      const col = { new: 'var(--blue)', doing: 'var(--sun)', returned: 'var(--coral)', submitted: 'var(--navy-2)', approved: 'var(--teal)' }[h.status];
      return `<button class="item" data-id="${h.id}">
        <div class="i-ic" style="background:${col}">${icon(h.status === 'approved' ? 'trophy' : 'pencil', 26)}</div>
        <div class="grow"><div class="i-title">${esc(h.title)}</div><div class="i-sub">${esc(h.subject)}${h.origin === 'school' ? ' · ' + (h.teacher ? 'Mwl. ' + esc(h.teacher) : 'Shule') + (h.due ? ' · hadi ' + esc(h.due) : '') : ' · kurasa ' + h.pages.length}</div></div>
        ${h.status === 'approved' ? (h.score != null ? `<span class="chip-tag teal">${h.score}/${h.max_score}</span>` : `<span class="earned" style="margin:0">${starsHTML(h.stars, 3, 18)}</span>`) : `<span class="chip-tag ${st.cls}">${st.label}</span>`}
      </button>`;
    }).join('');
    $$('.item', box).forEach(b => b.onclick = () => {
      const h = list.find(x => x.id === b.dataset.id);
      Sfx.tap();
      if (h.status === 'submitted' && h.kind !== 'quiz') { speak(h.origin === 'school' ? "This work is waiting for the teacher" : "This work is waiting for the parent to check"); toast(h.origin === 'school' ? "Waiting for the teacher to mark" : 'Inasubiri mzazi aikague'); return; }
      HK.go(h.kind === 'quiz' ? 'hwQuiz' : 'hwDo', { id: h.id });
    });
  });
};

HK.screens.hwDo = (el, p) => {
  const c = Store.active();
  el.classList.add('hw-screen');
  el.innerHTML = '<div class="center-col">Inafungua...</div>';
  let hw, pageI = 0, tool = 'pen', color = '#0D2461', width = 5;
  let bgCanvas, inkCanvas, ictx, paper, drawing = null, saveT = null, renderId = 0;
  let cancelRecording;
  const t0 = Date.now();
  const readOnly = () => hw.status === 'approved';

  const COLORS = ['#0D2461', '#1EA7F0', '#F65B4F', '#0FB394'];

  HWDB.get(p.id).then(h => {
    if (!el.isConnected) return;
    hw = h;
    if (!hw || hw.childId !== c?.id) { hw = null; return HK.back(); }
    const school = hw.origin === 'school';
    if (school && readOnly() && hw.marked && hw.marked.length) {
      el.innerHTML = `<div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><div class="grow"><h1 style="font-size:18px">${esc(hw.title)}</h1><div class="sub">Imesahihishwa na Mwl. ${esc(hw.teacher || '')}</div></div></div>
        <div class="scroll"><div class="trophy-hero" style="margin:0 0 14px"><div class="big">${hw.score ?? '-'}/${hw.max_score}</div><div class="earned" style="margin:8px 0 0">${starsHTML(hw.stars || 0, 3, 32)}</div>${hw.feedback ? `<p style="color:inherit;margin-top:8px">${esc(hw.feedback)}</p>` : ''}</div>
        ${hw.marked.map(m => `<img class="review-page" src="${esc(m)}">`).join('')}</div>`;
      $('#bk', el).onclick = () => HK.back();
      if (hw.feedback) speak(hw.feedback);
      return;
    }
    el.innerHTML = `
      <div class="topbar" style="background:#fff">
        <button class="icon-btn" id="bk">${icon('back')}</button>
        <div class="grow"><h1 style="font-size:18px">${esc(hw.title)}</h1><div class="sub">${esc(hw.subject)}</div></div>
        ${readOnly() ? '' : `<button class="btn small navy" id="help">${icon('help', 18)} Msaada</button>`}
      </div>
      ${hw.status === 'returned' && hw.feedback ? `<div class="feedback">${icon('edit', 20)} ${esc(hw.feedback)}</div>` : ''}
      ${readOnly() && hw.feedback ? `<div class="feedback" style="background:#E3F8F3;color:var(--teal-d)">${icon('star', 20)} ${esc(hw.feedback)}</div>` : ''}
      ${(school && hw.instructions || (hw.files || []).length) ? `<div class="feedback" style="background:#fff;color:var(--navy);flex-direction:column;align-items:stretch">
        <div class="row"><span class="grow">${esc(hw.instructions || '')}</span>${hw.instructions ? `<button class="icon-btn" id="sayins" style="width:38px;height:38px">${icon('volume', 18)}</button>` : ''}</div>${attachmentsHTML(hw.files)}</div>` : ''}
      <div class="hw-stage" id="stage"><div class="hw-paper" id="paper"><canvas id="bg"></canvas><canvas id="ink"></canvas></div></div>
      ${readOnly() ? '' : `<div class="hw-tools">
        ${COLORS.map((col, i) => `<button class="tool ${i === 0 ? 'on' : ''}" data-col="${col}"><span class="dot" style="width:22px;height:22px;background:${col}"></span></button>`).join('')}
        <span class="tool-sep"></span>
        <button class="tool" id="size"><span class="dot" style="width:8px;height:8px;background:var(--navy)"></span></button>
        <button class="tool" id="eraser">${icon('eraser', 24)}</button>
        <button class="tool" id="undo">${icon('undo', 24)}</button>
        <button class="tool" id="clear">${icon('trash', 24)}</button>
      </div>`}
      ${school && !readOnly() ? `<div class="hw-tools" style="border-top:0;padding-top:0">
        <button class="btn small ghost" id="r-photo">${icon('camera', 18)} Picha ya daftari</button>
        <button class="btn small ghost" id="r-audio">${icon('mic', 18)} Sauti</button>
        <button class="btn small ghost" id="r-video">${icon('play', 18)} Video</button></div>
        <div id="myatt" style="padding:0 14px;background:#fff">${myAttHTML(hw)}</div>` : ''}
      <div class="hw-foot">
        <button class="icon-btn" id="prev">${icon('chevL')}</button>
        <div class="page-ind" id="pi"></div>
        <button class="icon-btn" id="next">${icon('chevR')}</button>
        <div class="grow"></div>
        ${readOnly() ? '' : `<button class="btn" id="submit">${icon('send', 20)} Wasilisha</button>`}
      </div>`;

    paper = $('#paper', el);
    bgCanvas = $('#bg', el); inkCanvas = $('#ink', el);
    ictx = inkCanvas.getContext('2d');
    $('#bk', el).onclick = () => HK.back();

    $$('[data-col]', el).forEach(b => b.onclick = () => {
      tool = 'pen'; color = b.dataset.col; Sfx.tap();
      $$('[data-col]', el).forEach(x => x.classList.toggle('on', x === b));
      $('#eraser', el).classList.remove('on');
    });
    if ($('#size', el)) $('#size', el).onclick = () => {
      width = width === 5 ? 11 : 5; Sfx.tap();
      const d = $('#size .dot', el); d.style.width = d.style.height = (width === 5 ? 8 : 18) + 'px';
    };
    if (!readOnly()) {
      $('#eraser', el).onclick = () => { tool = tool === 'eraser' ? 'pen' : 'eraser'; $('#eraser', el).classList.toggle('on', tool === 'eraser'); Sfx.tap(); };
      $('#undo', el).onclick = () => { const pg = hw.pages[pageI]; if (pg.strokes.length) { pg.strokes.pop(); redrawInk(); queueSave(); Sfx.tap(); } };
      $('#clear', el).onclick = () => confirmBox(el, "Erase what you wrote?", "This page will be clean again.", "Yes, delete", () => { hw.pages[pageI].strokes = []; redrawInk(); queueSave(); });
      $('#submit', el).onclick = submit;
      $('#help', el).onclick = askHelp;
    }
    $('#prev', el).onclick = () => { if (pageI > 0) { pageI--; Sfx.tap(); showPage(); } };
    $('#next', el).onclick = () => { if (pageI < hw.pages.length - 1) { pageI++; Sfx.tap(); showPage(); } };

    bindAttachments(el, hw.files);
    if (school) {
      const si = $('#sayins', el); if (si) { si.onclick = () => speak(hw.instructions); if (['toddler', 'beginner'].includes(kidMode(c))) setTimeout(() => speak(hw.instructions), 600); }
      const rb = (id, t) => { const b = $('#' + id, el); if (b) b.onclick = () => { cancelRecording = addResponse(el, hw, t); }; };
      rb('r-photo', 'photo'); rb('r-audio', 'audio'); rb('r-video', 'video');
    }
    bindDrawing();
    showPage();
    window.addEventListener('resize', fit);
    if (!readOnly() && !GT.seen(c, 'homework')) setTimeout(() => GT.show(el, 'homework', 0), 300);
    else if (hw.status === 'new') speak("Let's start the homework. Write with your finger.");
  });

  function fit() {
    if (!hw) return;
    const pg = hw.pages[pageI];
    const { w, h } = pageSize(pg);
    const stage = $('#stage', el); if (!stage) return;
    const sw = stage.clientWidth - 20, sh = stage.clientHeight - 12;
    const k = Math.min(sw / w, sh / h);
    paper.style.width = Math.floor(w * k) + 'px';
    paper.style.height = Math.floor(h * k) + 'px';
  }

  async function showPage() {
    const pg = hw.pages[pageI];
    pg.strokes = pg.strokes || [];
    const { w, h } = pageSize(pg);
    bgCanvas.width = inkCanvas.width = w;
    bgCanvas.height = inkCanvas.height = h;
    fit();
    const id = ++renderId;
    const isCurrent = () => id === renderId && el.isConnected;
    try { await drawPageBg(bgCanvas.getContext('2d'), pg, isCurrent); }
    catch { if (isCurrent()) toast('This page image could not be opened.'); }
    if (!isCurrent()) return;
    redrawInk();
    $('#pi', el).textContent = (pageI + 1) + ' / ' + hw.pages.length;
    $('#prev', el).style.visibility = pageI > 0 ? 'visible' : 'hidden';
    $('#next', el).style.visibility = pageI < hw.pages.length - 1 ? 'visible' : 'hidden';
  }

  function redrawInk() {
    ictx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    drawStrokes(ictx, hw.pages[pageI].strokes);
  }

  function pos(e) {
    const r = inkCanvas.getBoundingClientRect();
    return [Math.round((e.clientX - r.left) * inkCanvas.width / r.width), Math.round((e.clientY - r.top) * inkCanvas.height / r.height)];
  }

  function bindDrawing() {
    if (readOnly()) return;
    inkCanvas.addEventListener('pointerdown', e => {
      if (drawing) return;
      inkCanvas.setPointerCapture(e.pointerId);
      const er = tool === 'eraser';
      drawing = { id: e.pointerId, s: { color: er ? '#000' : color, width: er ? 34 : width, erase: er, points: [pos(e)] } };
      hw.pages[pageI].strokes.push(drawing.s);
      redrawLast();
    });
    inkCanvas.addEventListener('pointermove', e => {
      if (!drawing || e.pointerId !== drawing.id) return;
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      evs.forEach(ev => drawing.s.points.push(pos(ev)));
      redrawLast();
    });
    const end = e => {
      if (!drawing || e.pointerId !== drawing.id) return;
      drawing = null;
      if (hw.status === 'new' || hw.status === 'returned') hw.status = 'doing';
      queueSave();
    };
    inkCanvas.addEventListener('pointerup', end);
    inkCanvas.addEventListener('pointercancel', end);
  }

  function redrawLast() {

    const s = drawing && drawing.s; if (!s) return;
    if (s.erase || s.points.length < 3) { redrawInk(); return; }
    const p = s.points, n = p.length;
    ictx.save();
    ictx.strokeStyle = s.color; ictx.lineWidth = s.width; ictx.lineCap = 'round'; ictx.lineJoin = 'round';
    ictx.beginPath(); ictx.moveTo(p[n - 3][0], p[n - 3][1]);
    ictx.quadraticCurveTo(p[n - 2][0], p[n - 2][1], p[n - 1][0], p[n - 1][1]);
    ictx.stroke(); ictx.restore();
  }

  function queueSave() {
    clearTimeout(saveT);
    saveT = setTimeout(() => HWDB.put(hw), 600);
  }

  async function askHelp() {
    if (!AI.ready()) {
      speak("Ask your parent to help you");
      return modal(el, { iconName: 'user', iconColor: 'var(--blue)', title: "Ask your parent", text: "When your parent sets up AI, Nuru will help you here. For now, ask your parent or teacher to help you.", buttons: [{ label: 'Sawa' }] });
    }
    const ov = modal(el, { iconName: 'nuru', title: 'Nuru anafikiri...', text: 'Subiri kidogo', buttons: [] });
    try {
      const img = await renderPage(hw.pages[pageI], 0.7);
      const pg = hw.pages[pageI];
      const qtext = pg.questions && pg.questions.length ? 'Maswali ya ukurasa huu: ' + pg.questions.join(' | ') + '. ' : '';
      const a = await AI.ask({
        text: `${qtext}Mtoto ${c.name} (miaka ${ageYears(c.birth)}) anafanya homework hii na ameomba msaada. Angalia alichokwisha kuandika. Mpe kidokezo KIMOJA kifupi cha kumsaidia kuendelea na swali ambalo hajalimaliza au amekosea. USIMPE jibu la mwisho.`,
        images: [img], maxTokens: 300,
      });
      ov.remove();
      speak(a);
      AI.log(c.id, '[Msaada wa homework: ' + hw.title + ']', a);
      modal(el, { iconName: 'nuru', title: 'Kidokezo cha Nuru', text: a, buttons: [{ label: "Listen again", icon: 'volume', keepOpen: true, onClick: () => speak(a) }, { label: 'Asante Nuru' }] });
    } catch (e) {
      ov.remove();
      modal(el, { iconName: 'x', iconColor: 'var(--coral)', title: 'Nuru hayupo sasa', text: "Make sure there is internet, then try again.", buttons: [{ label: 'Sawa' }] });
    }
  }

  function submit() {
    const empty = hw.pages.filter(pg => !pg.strokes || !pg.strokes.length).length;
    const school = hw.origin === 'school';
    confirmBox(el, "Are you done?", empty && !(hw.attach || []).length ? `Kurasa ${empty} bado hazina majibu. Unataka kutuma hivyo hivyo?` : school ? "Your work will be sent to the teacher." : "Your work will be sent to your parent to check.", "Yes, send", async () => {
      hw.merged = await Promise.all(hw.pages.map(pg => renderPage(pg)));
      if (school) {
        try {
          const touched = hw.pages.map((pg, i) => (pg.strokes || []).length || pg.bg ? hw.merged[i] : null).filter(Boolean);
          await SchoolSync.submit(hw, { pages: touched });
          Sfx.win(); confetti(el);
          speak('Well done, ' + c.name + '! Your homework was sent to your teacher.');
          return modal(el, { iconName: 'trophy', iconColor: 'var(--sun)', title: 'Imetumwa!', text: "The teacher will mark it and you will see your score here.", buttons: [{ label: 'Sawa', onClick: () => HK.back() }] });
        } catch (e) { return toast(e.message); }
      }
      hw.status = 'submitted';
      hw.submittedAt = Date.now();
      await HWDB.put(hw);
      markMission('hw');
      Sfx.win(); confetti(el);
      speak('Well done, ' + c.name + '! Your homework was sent to your parent.');
      modal(el, { iconName: 'trophy', iconColor: 'var(--sun)', title: 'Hongera!', text: "Your work has been sent to your parent. If they approve it, you get stars and extra game minutes.", buttons: [{ label: 'Sawa', onClick: () => HK.back() }] });
    }, '');
  }

  return () => {
    cancelRecording?.();
    window.removeEventListener('resize', fit);
    clearTimeout(saveT);
    if (hw && !readOnly()) HWDB.put(hw);
    if (c) HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
  };
};
