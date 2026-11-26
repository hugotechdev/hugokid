

const PROFILE_KEYS = ['religion', 'faithOn', 'grade', 'lang', 'needs', 'acc', 'avatar', 'place', 'placeAsked', 'modeOverride'];
const PROGRESS_KEYS = ['stars', 'coins', 'racing', 'gp', 'learned', 'skillLog', 'tut', 'daily', 'saladStory', 'safariSeries'];
function progressOf(c) {
  const o = { profile: {}, at: Date.now(), lessons: Store.get('lessons_' + c.id, {}), week: Store.weekUsage(c.id).map(w => ({ game: w.game || 0, learn: w.learn || 0 })) };
  PROFILE_KEYS.forEach(k => { if (c[k] !== undefined) o.profile[k] = c[k]; });
  PROGRESS_KEYS.forEach(k => { if (c[k] !== undefined) o[k] = c[k]; });
  return o;
}

const SchoolSync = {

  async pushChildren() {
    if (!(Net.online() && Net.role() === 'parent')) return;
    for (const c of Store.children()) {
      const r = await Net.post('/api/children', { name: c.name, birth: c.birth, color: c.color, local_id: c.id });
      const cc = Store.child(c.id); if (!cc) continue;
      cc.serverId = r.id; cc.school = r.school; cc.className = r.class_name; Store.saveChild(cc);
      await Net.put(`/api/children/${r.id}/progress`, { progress: progressOf(cc) }).catch(() => {});
    }
    Store.set('lastPush', Date.now());
  },

  async pullChildren() {
    if (!(Net.online() && Net.role() === 'parent')) return 0;
    const list = await Net.get('/api/children');
    let added = 0;
    for (const s of list) {
      const local = Store.children().find(c => c.serverId === s.id || (s.local_id && c.id === s.local_id));
      if (local) { local.serverId = s.id; local.school = s.school; local.className = s.class_name; Store.saveChild(local); continue; }
      const pr = s.progress || {};
      const c = Object.assign({ id: s.local_id || uid(), name: s.name, birth: s.birth || '', color: s.color || AVATAR_COLORS[0], religion: 'values', faithOn: true, stars: 0, coins: 0, created: Date.now() },
        pr.profile || {}, Object.fromEntries(PROGRESS_KEYS.filter(k => pr[k] !== undefined).map(k => [k, pr[k]])),
        { serverId: s.id, school: s.school, className: s.class_name });
      if (pr.lessons) Store.set('lessons_' + c.id, pr.lessons);
      Store.saveChild(c); added++;
    }
    if (added && !Store.activeId()) Store.setActive(Store.children()[0].id);
    return added;
  },

  maybePush() {
    if (Date.now() - Store.get('lastPush', 0) > 10 * 60 * 1000) this.pushChildren().catch(() => {});
  },

  async pull(c) {
    if (!(Net.online() && Net.role() === 'parent' && c && c.serverId)) return;
    const list = await Net.get(`/api/children/${c.serverId}/homework`);
    for (const h of list) {
      const id = 's' + h.id;
      const ex = await HWDB.get(id);
      const sub = h.submission;
      const st = !sub ? (ex && ex.status === 'doing' ? 'doing' : 'new') : sub.status === 'marked' ? 'approved' : sub.status === 'returned' ? 'returned' : 'submitted';
      const pages = ex ? ex.pages : (h.pages && h.pages.length ? h.pages.map(p => ({ ...p, strokes: [] })) : (h.kind === 'quiz' ? [] : [{ bg: null, questions: [h.instructions || h.title], strokes: [] }]));
      await HWDB.put(Object.assign(ex || { id, created: h.created, pages, attach: [] }, {
        origin: 'school', remoteId: h.id, childId: c.id, title: h.title, subject: h.subject || 'Shule', kind: h.kind,
        instructions: h.instructions, files: h.attachments || [], questions: h.questions || [], due: h.due, max_score: h.max_score,
        teacher: h.teacher, status: ex && ex.status === 'doing' && !sub ? 'doing' : st,
        score: sub ? sub.score : null, stars: sub ? sub.stars : 0, feedback: sub ? sub.feedback : '', marked: sub ? sub.marked : null,
      }));
    }
  },
  async submit(hw, extra = {}) {
    const c = Store.child(hw.childId);
    if (!c || !c.serverId) throw new Error("Child not linked to a school");
    const r = await Net.post(`/api/children/${c.serverId}/submit`, { homework_id: hw.remoteId, pages: extra.pages || [], answers: extra.answers, attachments: hw.attach || [] });
    hw.status = r.status === 'marked' ? 'approved' : 'submitted';
    hw.score = r.score; hw.stars = r.stars; hw.detail = r.detail;
    await HWDB.put(hw);
    markMission('hw');
    return r;
  },
};

function attachmentsHTML(files) {
  if (!files || !files.length) return '';
  return `<div class="att-list">${files.map((f, i) => {
    const ic = /^image/.test(f.mime) ? 'image' : /^audio/.test(f.mime) ? 'volume' : /^video/.test(f.mime) ? 'camera' : 'file';
    return `<button class="chip" data-att="${i}">${icon(ic, 18)} ${esc(f.label || (ic === 'file' ? 'PDF' : ic === 'volume' ? 'Sauti' : ic === 'camera' ? 'Video' : 'Picha'))}</button>`;
  }).join('')}</div>`;
}
function bindAttachments(root, files) {
  $$('[data-att]', root).forEach(b => b.onclick = () => {
    const f = files[+b.dataset.att]; const url = Net.fileUrl(f.file);
    if (/pdf/.test(f.mime)) return Net.openExternal(url);
    const media = /^image/.test(f.mime) ? `<img src="${url}" style="width:100%;border-radius:16px">`
      : /^audio/.test(f.mime) ? `<audio controls autoplay src="${url}" style="width:100%"></audio>`
      : `<video controls autoplay playsinline src="${url}" style="width:100%;border-radius:16px;max-height:60vh"></video>`;
    modal(root, { title: f.label || '', html: media + '<div style="height:14px"></div>', buttons: [{ label: "Close", cls: 'ghost' }] });
  });
}

async function addResponse(root, hw, type) {
  const c = Store.child(hw.childId);
  if (type === 'audio' && navigator.mediaDevices && window.MediaRecorder) return recordAudio(root, hw);
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*';
  inp.setAttribute('capture', type === 'photo' ? 'environment' : '');
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    let blob = f;
    if (type === 'photo') { const r = await fileToImageData(f, 1800); blob = dataToBlob(r.data); }
    await uploadResponse(root, hw, blob, type === 'photo' ? 'Picha ya daftari' : type === 'video' ? 'Video' : 'Sauti', c);
  };
  inp.click();
}
async function uploadResponse(root, hw, blob, label, c) {
  const w = modal(root, { iconName: 'nuru', title: 'Inatuma...', text: 'Subiri kidogo', buttons: [] });
  try {
    const r = await Net.upload(blob, label, c && c.serverId);
    hw.attach = [...(hw.attach || []), { file: r.file, mime: r.mime, label }];
    if (hw.status === 'new' || hw.status === 'returned') hw.status = 'doing';
    await HWDB.put(hw);
    w.remove(); Sfx.good(); toast(label + ' imeongezwa');
    const box = $('#myatt', root); if (box) box.innerHTML = myAttHTML(hw);
  } catch (e) { w.remove(); toast(e.message); }
}
const myAttHTML = hw => (hw.attach || []).length ? `<span class="muted" style="font-size:12px;font-weight:600">Umeambatisha: ${hw.attach.map(a => esc(a.label)).join(', ')}</span>` : '';
function recordAudio(root, hw) {
  let rec, chunks = [], stream, t0;
  const ov = modal(root, { iconName: 'mic', iconColor: 'var(--coral)', title: "Record audio", html: '<p id="rt" style="font-size:28px;font-weight:700">0:00</p>', buttons: [
    { label: "Start recording", cls: 'coral', icon: 'mic', keepOpen: true, onClick: async (o) => {
      const btn = $$('.btn', o)[0];
      if (rec && rec.state === 'recording') { rec.stop(); btn.disabled = true; return; }
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { o.remove(); return toast("Microphone permission was denied"); }
      rec = new MediaRecorder(stream); chunks = [];
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = async () => { stream.getTracks().forEach(t => t.stop()); o.remove(); await uploadResponse(root, hw, new Blob(chunks, { type: rec.mimeType || 'audio/webm' }), 'Sauti', Store.child(hw.childId)); };
      rec.start(); t0 = Date.now(); btn.innerHTML = icon('check', 20) + ' Maliza';
      const tick = setInterval(() => { const r = $('#rt', o); if (!r || rec.state !== 'recording') return clearInterval(tick); const s = Math.floor((Date.now() - t0) / 1000); r.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }, 300);
    } },
    { label: 'Ghairi', cls: 'ghost', onClick: () => { if (rec && rec.state === 'recording') { rec.onstop = null; rec.stop(); } if (stream) stream.getTracks().forEach(t => t.stop()); } },
  ] });
  return ov;
}

HK.screens.hwQuiz = (el, p) => {
  const c = Store.active();
  const t0 = Date.now();
  HWDB.get(p.id).then(hw => {
    if (!hw) return HK.back();
    const answers = hw.answers || [];
    const done = hw.status === 'approved' || hw.status === 'submitted';
    const qHTML = (qn, i) => {
      const a = answers[i];
      const res = hw.detail ? hw.detail[i] : null;
      const mark = res === true ? `<span class="chip-tag teal">${icon('check', 14)} Sahihi</span>` : res === false ? `<span class="chip-tag coral">${icon('x', 14)} Si sahihi</span>` : '';
      let body = '';
      if (qn.type === 'mcq') body = `<div class="g-opts" style="padding:8px 0 0;grid-template-columns:1fr">${(qn.options || []).map((o, k) => `<button class="g-opt ${+a === k ? 'sel' : ''}" data-q="${i}" data-v="${k}" style="font-size:17px;min-height:54px" ${done ? 'disabled' : ''}>${esc(o)}</button>`).join('')}</div>`;
      else if (qn.type === 'match') {
        const rights = (qn.pairs || []).map(x => x[1]);
        body = (qn.pairs || []).map((pr, k) => `<div class="row" style="margin-top:8px"><b class="grow">${esc(pr[0])}</b><select class="field" data-m="${i}" data-k="${k}" style="width:55%" ${done ? 'disabled' : ''}><option value="">Choose</option>${rights.map((r, j) => `<option value="${j}" ${a && +a[k] === j ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></div>`).join('');
      } else body = `<input class="field" data-t="${i}" style="margin-top:8px" ${qn.type === 'math' ? 'inputmode="decimal"' : ''} value="${esc(a ?? '')}" placeholder="Jibu lako" ${done ? 'disabled' : ''}>`;
      return `<div class="card"><div class="row" style="align-items:flex-start"><b class="grow" style="font-size:17px">${i + 1}. ${esc(qn.q)}</b><button class="icon-btn" data-say="${i}" style="width:38px;height:38px">${icon('volume', 18)}</button></div>${body}<div style="margin-top:8px">${mark}</div></div>`;
    };
    el.innerHTML = `
      <div class="topbar"><button class="icon-btn" id="bk">${icon('back')}</button><div class="grow"><h1 style="font-size:18px">${esc(hw.title)}</h1><div class="sub">${esc(hw.subject)}${hw.teacher ? ' · Mwl. ' + esc(hw.teacher) : ''}</div></div></div>
      <div class="scroll">
        ${hw.status === 'approved' ? `<div class="trophy-hero" style="margin:0 0 14px"><div class="big">${hw.score}/${hw.max_score}</div><div class="earned" style="margin:8px 0 0">${starsHTML(hw.stars || 0, 3, 32)}</div>${hw.feedback ? `<p style="color:#fff;margin-top:8px">${esc(hw.feedback)}</p>` : ''}</div>` : ''}
        ${hw.instructions ? `<div class="card"><p>${esc(hw.instructions)}</p>${attachmentsHTML(hw.files)}</div>` : attachmentsHTML(hw.files)}
        ${hw.questions.map(qHTML).join('')}
        ${done ? '' : `<button class="btn block" id="send">${icon('send', 20)} Tuma majibu</button>`}
      </div>`;
    $('#bk', el).onclick = () => HK.back();
    bindAttachments(el, hw.files);
    $$('[data-say]', el).forEach(b => b.onclick = () => speak(hw.questions[+b.dataset.say].q, c.lang === 'en' ? 'en' : 'sw'));
    $$('[data-q]', el).forEach(b => b.onclick = () => { answers[+b.dataset.q] = +b.dataset.v; $$(`[data-q="${b.dataset.q}"]`, el).forEach(x => x.classList.toggle('sel', x === b)); Sfx.tap(); });
    $$('[data-t]', el).forEach(i => i.oninput = () => { answers[+i.dataset.t] = i.value; });
    $$('[data-m]', el).forEach(s => s.onchange = () => { const i = +s.dataset.m; answers[i] = answers[i] || []; answers[i][+s.dataset.k] = s.value === '' ? null : +s.value; });
    const send = $('#send', el);
    if (send) send.onclick = () => {
      const empty = hw.questions.filter((_, i) => answers[i] === undefined || answers[i] === '').length;
      confirmBox(el, "Send answers?", empty ? `Maswali ${empty} hayajajibiwa.` : 'Majibu yatasahihishwa papo hapo.', "Send", async () => {
        try {
          hw.answers = answers;
          const r = await SchoolSync.submit(hw, { answers });
          Sfx.win(); confetti(el);
          if (r.status === 'marked') { speak(`Umepata ${r.score} kati ya ${r.max_score}`); toast(`Alama: ${r.score}/${r.max_score}`); }
          else toast("Sent. The teacher will mark it");
          HK.render();
        } catch (e) { toast(e.message); }
      }, '');
    };
  });
  return () => HK.addLearnTime(c, Math.round((Date.now() - t0) / 1000));
};
