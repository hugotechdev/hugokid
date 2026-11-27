
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { q, FILES_DIR } = require('./db');
const hub = require('./hub');
const ai = require('./ai');
const { route, fail, need, J, now, role, classFor, childFor, className, hwOut } = require('./router');

const MAX_FILE = 60 * 1024 * 1024;
const OK_MIME = /^(image\/(png|jpe?g|webp|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|audio\/[\w.+-]+|video\/[\w.+-]+)$/i;

route('UPLOAD', '/api/upload', (u, buf, req) => {
  if (!u) fail(401, "Sign in first");
  const url = new URL(req.url, 'http://x');
  const mime = (req.headers['content-type'] || '').split(';')[0].trim();
  if (!OK_MIME.test(mime)) fail(415, "This file type is not allowed");
  if (!buf || !buf.length) fail(400, "The file is empty");
  if (buf.length > MAX_FILE) fail(413, "The file is too large (max 60 MB)");
  const childId = url.searchParams.get('child_id');
  if (childId) childFor(u, childId);
  const ext = { 'application/pdf': '.pdf', 'application/msword': '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx' }[mime] || ('.' + mime.split('/')[1].replace(/[^a-z0-9]/gi, '').slice(0, 5));
  const name = crypto.randomBytes(16).toString('hex') + ext;
  fs.writeFileSync(path.join(FILES_DIR, name), buf);
  q.run('INSERT INTO files(name, mime, size, label, owner_id, school_id, child_id, created) VALUES (?,?,?,?,?,?,?,?)',
    name, mime, buf.length, (url.searchParams.get('label') || '').slice(0, 120), u.id, u.school_id || null, childId ? +childId : null, now());
  return { file: name, mime, size: buf.length, label: url.searchParams.get('label') || '' };
});
function canSeeFile(u, f) {
  if (!u) return false;
  if (u.role === 'superadmin' || f.owner_id === u.id) return true;
  if (f.school_id && u.school_id === f.school_id) return true;
  if (u.role === 'parent') {
    if (f.child_id && q.get('SELECT id FROM children WHERE id = ? AND parent_id = ?', f.child_id, u.id)) return true;
    if (f.school_id && q.get('SELECT id FROM children WHERE school_id = ? AND parent_id = ?', f.school_id, u.id)) return true;
  }
  if ((u.role === 'teacher' || u.role === 'school_admin') && f.child_id) {
    const ch = q.get('SELECT school_id FROM children WHERE id = ?', f.child_id);
    if (ch && ch.school_id === u.school_id) return true;
  }
  return false;
}
route('FILE', '/api/files/:name', (u, b, req, p) => {
  const f = q.get('SELECT * FROM files WHERE name = ?', p.name);
  if (!f) fail(404, 'Faili halipo');
  if (!canSeeFile(u, f)) fail(403, 'Huna ruhusa');
  return { path: path.join(FILES_DIR, f.name), mime: f.mime };
});

const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[.,;:!?'"]/g, '').replace(/\s+/g, ' ').trim();
function markQuestion(qn, ans) {
  const pts = +qn.points || 1;
  if (ans === undefined || ans === null || ans === '') return { ok: false, pts: 0, max: pts };
  if (qn.type === 'mcq') return { ok: +ans === +qn.answer, pts: +ans === +qn.answer ? pts : 0, max: pts };
  if (qn.type === 'match') {
    const pairs = qn.pairs || []; const a = Array.isArray(ans) ? ans : [];
    const right = pairs.filter((_, i) => a[i] === i || a[i] === String(i)).length;
    return { ok: right === pairs.length, pts: pairs.length ? pts * right / pairs.length : 0, max: pts };
  }
  const accepted = String(qn.answer ?? '').split('|').map(s => s.trim()).filter(Boolean);
  if (!accepted.length) return { ok: null, pts: 0, max: pts, open: true };
  const numeric = value => {
    const text = String(value).trim().replace(',', '.');
    return /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
  };
  const ok = accepted.some(expected => Number.isFinite(numeric(expected))
    ? numeric(ans) === numeric(expected)
    : norm(ans) === norm(expected));
  return { ok, pts: ok ? pts : 0, max: pts };
}
function autoMark(hw, answers) {
  const qs = J(hw.questions) || [];
  if (!qs.length) return null;
  let got = 0, max = 0, open = false;
  const detail = qs.map((qn, i) => { const r = markQuestion(qn, (answers || [])[i]); got += r.pts; max += r.max; if (r.open) open = true; return r.ok; });
  return { score: max ? Math.round(got / max * hw.max_score * 10) / 10 : 0, detail, open };
}
const starsOf = (score, max) => { const p = max ? score / max : 0; return p >= 0.85 ? 3 : p >= 0.6 ? 2 : p > 0 ? 1 : 0; };

route('POST', '/api/homework', (u, b) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, need(b.class_id, "Choose a class"));
  const title = need(b.title, "Enter the homework title");
  const kind = ['paper', 'quiz', 'open'].includes(b.kind) ? b.kind : 'paper';
  const pages = (Array.isArray(b.pages) ? b.pages : []).slice(0, 12).map(pg => ({ bg: pg.bg || null, w: pg.w || null, h: pg.h || null, questions: Array.isArray(pg.questions) ? pg.questions.slice(0, 20) : [] }));
  const questions = (Array.isArray(b.questions) ? b.questions : []).slice(0, 40).map(x => ({
    type: ['mcq', 'short', 'math', 'spelling', 'match', 'text'].includes(x.type) ? x.type : 'short',
    q: String(x.q || '').slice(0, 500), options: Array.isArray(x.options) ? x.options.slice(0, 6).map(String) : undefined,
    pairs: Array.isArray(x.pairs) ? x.pairs.slice(0, 8) : undefined, answer: x.answer, points: +x.points || 1,
  }));
  const attachments = (Array.isArray(b.attachments) ? b.attachments : []).slice(0, 10)
    .flatMap(a => {
      if (typeof a?.file !== 'string') return [];
      const file = q.get('SELECT name, mime, label FROM files WHERE name = ? AND owner_id = ? AND school_id = ? AND child_id IS NULL', a.file, u.id, c.school_id);
      return file ? [{ file: file.name, mime: file.mime, label: file.label || '' }] : [];
    });
  if (kind === 'quiz' && !questions.length) fail(400, 'Ongeza maswali');
  if (kind === 'paper' && !pages.length && !b.instructions && !attachments.length) fail(400, "Add a page or instructions");
  const id = Number(q.run(`INSERT INTO homework(class_id, author_id, title, subject, kind, instructions, pages, questions, attachments, max_score, due, created) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    c.id, u.id, title, b.subject || '', kind, (b.instructions || '').slice(0, 4000), JSON.stringify(pages), JSON.stringify(questions), JSON.stringify(attachments),
    Math.max(1, Math.min(100, +b.max_score || 10)), b.due || null, now()).lastInsertRowid);
  q.all('SELECT DISTINCT parent_id FROM children WHERE class_id = ? AND parent_id IS NOT NULL', c.id).forEach(r => hub.toUser(r.parent_id, { t: 'refresh', what: 'homework' }));
  return { id };
});
route('GET', '/api/homework', (u, b, req) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, new URL(req.url, 'http://x').searchParams.get('class_id'));
  const total = q.get('SELECT count(*) n FROM children WHERE class_id = ?', c.id).n;
  return q.all('SELECT * FROM homework WHERE class_id = ? ORDER BY created DESC', c.id).map(h => ({
    ...hwOut(h), students: total,
    submitted: q.get(`SELECT count(*) n FROM submissions WHERE homework_id = ?`, h.id).n,
    to_review: q.get(`SELECT count(*) n FROM submissions WHERE homework_id = ? AND status = 'submitted'`, h.id).n,
  }));
});
route('GET', '/api/homework/:id', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const h = q.get('SELECT * FROM homework WHERE id = ?', +p.id); if (!h) fail(404, "Homework not found");
  const c = classFor(u, h.class_id);
  return {
    ...hwOut(h, true), class_name: className(c),
    students: q.all('SELECT * FROM children WHERE class_id = ? ORDER BY name', c.id).map(k => ({
      child_id: k.id, name: k.name,
      submission: q.get('SELECT id, status, score, auto_score, ai_score, max_score, stars, submitted, reviewed FROM submissions WHERE homework_id = ? AND child_id = ?', h.id, k.id) || null,
    })),
  };
});
route('DELETE', '/api/homework/:id', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const h = q.get('SELECT * FROM homework WHERE id = ?', +p.id); if (!h) fail(404, "Homework not found");
  classFor(u, h.class_id);
  q.run('DELETE FROM homework WHERE id = ?', h.id);
  return { ok: true };
});

route('GET', '/api/children/:id/homework', (u, b, req, p) => {
  if (!u) fail(401, "Sign in first");
  const ch = childFor(u, p.id);
  if (!ch.class_id) return [];
  return q.all('SELECT * FROM homework WHERE class_id = ? ORDER BY created DESC LIMIT 80', ch.class_id).map(h => {
    const s = q.get('SELECT id, status, score, max_score, stars, feedback, submitted, reviewed, marked FROM submissions WHERE homework_id = ? AND child_id = ?', h.id, ch.id);
    const author = q.get('SELECT name FROM users WHERE id = ?', h.author_id);
    const out = hwOut(h, true);
    if (out.kind === 'quiz') out.questions = out.questions.map(x => ({ ...x, answer: undefined })); 
    return { ...out, teacher: author ? author.name : '', submission: s ? { ...s, marked: J(s.marked) } : null };
  });
});
route('POST', '/api/children/:id/submit', async (u, b, req, p) => {
  role(u, 'parent');
  const ch = childFor(u, p.id);
  const h = q.get('SELECT * FROM homework WHERE id = ? AND class_id = ?', +b.homework_id, ch.class_id);
  if (!h) fail(404, "Homework not found");
  const ex = q.get('SELECT * FROM submissions WHERE homework_id = ? AND child_id = ?', h.id, ch.id);
  if (ex && ex.status === 'marked') fail(409, 'Homework hii imeshasahihishwa');
  const pages = Array.isArray(b.pages) ? b.pages.slice(0, 12) : [];
  const answers = Array.isArray(b.answers) ? b.answers.slice(0, 40) : null;
  const attachments = (Array.isArray(b.attachments) ? b.attachments : []).slice(0, 6).filter(a => a && a.file && q.get('SELECT name FROM files WHERE name = ?', a.file));
  if (!pages.length && !answers && !attachments.length) fail(400, "No answer");

  const am = h.kind === 'quiz' ? autoMark(h, answers) : null;
  let status = 'submitted', score = null, stars = 0;
  if (am && !am.open) { status = 'marked'; score = am.score; stars = starsOf(score, h.max_score); }
  const vals = [status, JSON.stringify(pages), JSON.stringify(answers), JSON.stringify(attachments), am ? am.score : null, score, h.max_score, stars, now()];
  let sid;
  if (ex) { q.run(`UPDATE submissions SET status=?, pages=?, answers=?, attachments=?, auto_score=?, score=?, max_score=?, stars=?, submitted=?, marked=NULL, ai_score=NULL, ai_comment=NULL, feedback=NULL, reviewed=NULL WHERE id=?`, ...vals, ex.id); sid = ex.id; }
  else sid = Number(q.run(`INSERT INTO submissions(homework_id, child_id, status, pages, answers, attachments, auto_score, score, max_score, stars, submitted) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, h.id, ch.id, ...vals).lastInsertRowid);

  if (status === 'submitted' && ai.ready()) {
    const images = pages.filter(x => typeof x === 'string' && x.startsWith('data:image'));
    const qs = J(h.questions) || [];
    const answersText = answers ? qs.map((qn, i) => `${i + 1}. ${qn.q} -> ${answers[i] ?? ''}`).join('\n') : '';
    if (images.length || answersText) {
      ai.suggest({ homework: h, images, answersText })
        .then(r => q.run('UPDATE submissions SET ai_score = ?, ai_comment = ? WHERE id = ?', Math.max(0, Math.min(h.max_score, +r.score || 0)), [r.comment, r.child].filter(Boolean).join(' | '), sid))
        .catch(() => {});
    }
  }
  const cls = q.get('SELECT * FROM classes WHERE id = ?', h.class_id);
  [cls.teacher_id, h.author_id].filter(Boolean).forEach(id => hub.toUser(id, { t: 'refresh', what: 'submissions' }));
  return { ok: true, status, score, max_score: h.max_score, stars, detail: am ? am.detail : null };
});

route('GET', '/api/submissions/:id', (u, b, req, p) => {
  if (!u) fail(401, "Sign in first");
  const s = q.get('SELECT * FROM submissions WHERE id = ?', +p.id); if (!s) fail(404, "Task not found");
  const h = q.get('SELECT * FROM homework WHERE id = ?', s.homework_id);
  if (u.role === 'parent') childFor(u, s.child_id); else classFor(u, h.class_id);
  const ch = q.get('SELECT name FROM children WHERE id = ?', s.child_id);
  const am = h.kind === 'quiz' ? autoMark(h, J(s.answers)) : null;
  return {
    id: s.id, child: ch.name, homework: hwOut(h, true), status: s.status,
    pages: J(s.pages) || [], answers: J(s.answers), attachments: J(s.attachments) || [], marked: J(s.marked),
    auto_score: s.auto_score, ai_score: s.ai_score, ai_comment: s.ai_comment, detail: am ? am.detail : null,
    score: s.score, max_score: s.max_score, stars: s.stars, feedback: s.feedback, submitted: s.submitted, reviewed: s.reviewed,
  };
});
route('POST', '/api/submissions/:id/review', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const s = q.get('SELECT * FROM submissions WHERE id = ?', +p.id); if (!s) fail(404, "Task not found");
  const h = q.get('SELECT * FROM homework WHERE id = ?', s.homework_id);
  classFor(u, h.class_id);
  const status = b.status === 'returned' ? 'returned' : 'marked';
  const score = b.score === undefined || b.score === null || b.score === '' ? s.score : Math.max(0, Math.min(h.max_score, +b.score));
  const stars = b.stars !== undefined ? Math.max(0, Math.min(3, +b.stars)) : starsOf(score || 0, h.max_score);
  const marked = Array.isArray(b.marked) ? JSON.stringify(b.marked.slice(0, 12)) : s.marked;
  q.run('UPDATE submissions SET status = ?, score = ?, stars = ?, feedback = ?, marked = ?, reviewed = ? WHERE id = ?', status, score, stars, (b.feedback || '').slice(0, 1500), marked, now(), s.id);
  const ch = q.get('SELECT parent_id FROM children WHERE id = ?', s.child_id);
  if (ch && ch.parent_id) hub.toUser(ch.parent_id, { t: 'refresh', what: 'homework' });
  return { ok: true };
});
route('POST', '/api/submissions/:id/ai', async (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const s = q.get('SELECT * FROM submissions WHERE id = ?', +p.id); if (!s) fail(404, "Task not found");
  const h = q.get('SELECT * FROM homework WHERE id = ?', s.homework_id);
  classFor(u, h.class_id);
  if (!ai.ready()) fail(400, 'AI haijawekwa kwenye server. Mwambie msimamizi wa HUGO TECH');
  const pages = (J(s.pages) || []).filter(x => typeof x === 'string' && x.startsWith('data:image'));
  const qs = J(h.questions) || []; const ans = J(s.answers);
  const r = await ai.suggest({ homework: h, images: pages, answersText: ans ? qs.map((qn, i) => `${i + 1}. ${qn.q} -> ${ans[i] ?? ''}`).join('\n') : '' });
  const score = Math.max(0, Math.min(h.max_score, +r.score || 0));
  const comment = [r.comment, r.child].filter(Boolean).join(' | ');
  q.run('UPDATE submissions SET ai_score = ?, ai_comment = ? WHERE id = ?', score, comment, s.id);
  return { ai_score: score, ai_comment: comment };
});

function classStats(classId) {
  const kids = q.all('SELECT id, name FROM children WHERE class_id = ? ORDER BY name', classId);
  const hws = q.all('SELECT id, title, subject, max_score, due, created FROM homework WHERE class_id = ? ORDER BY created', classId);
  const subs = q.all(`SELECT s.homework_id, s.child_id, s.status, s.score, s.max_score, s.stars, s.submitted FROM submissions s JOIN homework h ON h.id = s.homework_id WHERE h.class_id = ?`, classId);
  const att = q.all('SELECT child_id, present FROM attendance WHERE class_id = ?', classId);
  const students = kids.map(k => {
    const mine = subs.filter(s => s.child_id === k.id && s.score !== null && s.score !== undefined);
    const pct = mine.map(s => s.score / s.max_score * 100);
    const avg = pct.length ? Math.round(pct.reduce((a, b) => a + b, 0) / pct.length) : null;
    const recent = pct.slice(-3), before = pct.slice(-6, -3);
    const trend = recent.length && before.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length - before.reduce((a, b) => a + b, 0) / before.length) : 0;
    const done = subs.filter(s => s.child_id === k.id).length;
    const a = att.filter(x => x.child_id === k.id);
    return { id: k.id, name: k.name, avg, trend, completion: hws.length ? Math.round(done / hws.length * 100) : null, attendance: a.length ? Math.round(a.filter(x => x.present).length / a.length * 100) : null };
  });
  return { homework: hws, students, results: subs };
}
route('GET', '/api/classes/:id/results', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, p.id);
  const st = classStats(c.id);
  const ranked = st.students.filter(s => s.avg !== null).sort((a, b) => b.avg - a.avg);
  return {
    class_name: className(c), ...st,
    top: ranked.slice(0, 3),
    declining: st.students.filter(s => s.trend <= -10).sort((a, b) => a.trend - b.trend),
    need_help: st.students.filter(s => (s.avg !== null && s.avg < 50) || (s.completion !== null && s.completion < 50)),
  };
});

route('POST', '/api/ai/generate', async (u, b) => {
  role(u, 'school_admin', 'teacher', 'parent');
  if (!ai.ready()) fail(400, 'AI haijawekwa kwenye server. Mwambie msimamizi wa HUGO TECH');
  return ai.generate({ task: b.task === 'worksheet' ? 'worksheet' : 'quiz', level: b.level, subject: b.subject, topic: need(b.topic, "Enter a topic"), count: b.count, lang: b.lang || 'Kiswahili' });
});

module.exports = { classStats, starsOf };
