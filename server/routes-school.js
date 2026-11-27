
const { db, q } = require('./db');
const hub = require('./hub');
const ai = require('./ai');
const { issueWaitingInvoices, checkRegistration } = require('./routes-registration');
const { route, fail, need, J, now, role, classFor, childFor, className } = require('./router');

const DEFAULT_SUBJECTS = ['Kiswahili', 'English', 'Hisabati', 'Sayansi', 'Maarifa ya Jamii', 'Uraia na Maadili', 'Dini', 'Michezo na Sanaa'];
route('GET', '/api/subjects', u => {
  if (!u || !u.school_id) fail(403, "You don't have a school");
  const rows = q.all('SELECT id, name FROM subjects WHERE school_id = ? ORDER BY name', u.school_id);
  return rows.length ? rows : DEFAULT_SUBJECTS.map((name, i) => ({ id: -(i + 1), name }));
});
route('POST', '/api/subjects', (u, b) => {
  role(u, 'school_admin');
  if (!q.get('SELECT id FROM subjects WHERE school_id = ?', u.school_id)) DEFAULT_SUBJECTS.forEach(n => q.run('INSERT INTO subjects(school_id, name) VALUES (?,?)', u.school_id, n));
  const name = need(b.name, "Enter the subject name");
  if (!q.get('SELECT id FROM subjects WHERE school_id = ? AND lower(name) = lower(?)', u.school_id, name)) q.run('INSERT INTO subjects(school_id, name) VALUES (?,?)', u.school_id, name);
  return { ok: true };
});
route('DELETE', '/api/subjects/:id', (u, b, req, p) => { role(u, 'school_admin'); q.run('DELETE FROM subjects WHERE id = ? AND school_id = ?', +p.id, u.school_id); return { ok: true }; });

/* ---------- Mahudhurio ---------- */
route('GET', '/api/classes/:id/attendance', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, p.id);
  const day = new URL(req.url, 'http://x').searchParams.get('day') || new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(new Date());
  const rows = q.all('SELECT child_id, present FROM attendance WHERE class_id = ? AND day = ?', c.id, day);
  return { day, students: q.all('SELECT id, name FROM children WHERE class_id = ? ORDER BY name', c.id).map(k => { const r = rows.find(x => x.child_id === k.id); return { id: k.id, name: k.name, present: r ? !!r.present : null }; }) };
});
route('POST', '/api/classes/:id/attendance', (u, b, req, p) => {
  role(u, 'school_admin', 'teacher');
  const c = classFor(u, p.id);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(b.day || '') ? b.day : new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(new Date());
  Object.entries(b.present || {}).forEach(([cid, v]) => {
    if (!q.get('SELECT id FROM children WHERE id = ? AND class_id = ?', +cid, c.id)) return;
    q.run('INSERT INTO attendance(class_id, child_id, day, present) VALUES (?,?,?,?) ON CONFLICT(child_id, day) DO UPDATE SET present = excluded.present, class_id = excluded.class_id', c.id, +cid, day, v ? 1 : 0);
  });
  return { ok: true };
});

/* ---------- Matangazo ---------- */
route('POST', '/api/announcements', (u, b) => {
  role(u, 'school_admin');
  const audience = ['all', 'parents', 'teachers', 'students'].includes(b.audience) ? b.audience : 'all';
  const id = Number(q.run('INSERT INTO announcements(school_id, author_id, audience, title, body, created) VALUES (?,?,?,?,?,?)', u.school_id, u.id, audience, need(b.title, "Enter a title"), (b.body || '').slice(0, 3000), now()).lastInsertRowid);
  const msg = { t: 'announcement', title: b.title };
  if (audience === 'all' || audience === 'teachers') q.all(`SELECT id FROM users WHERE school_id = ? AND role = 'teacher'`, u.school_id).forEach(t => hub.toUser(t.id, msg));
  if (audience !== 'teachers') q.all('SELECT DISTINCT parent_id FROM children WHERE school_id = ? AND parent_id IS NOT NULL', u.school_id).forEach(r => hub.toUser(r.parent_id, msg));
  return { id };
});
route('GET', '/api/announcements', u => {
  if (!u) fail(401, "Sign in first");
  if (u.role === 'school_admin') return q.all('SELECT * FROM announcements WHERE school_id = ? ORDER BY created DESC LIMIT 50', u.school_id);
  if (u.role === 'teacher') return q.all(`SELECT * FROM announcements WHERE school_id = ? AND audience IN ('all','teachers') ORDER BY created DESC LIMIT 50`, u.school_id);
  if (u.role === 'parent') {
    const schools = q.all('SELECT DISTINCT school_id FROM children WHERE parent_id = ? AND school_id IS NOT NULL', u.id).map(r => r.school_id);
    if (!schools.length) return [];
    return q.all(`SELECT a.*, s.name school FROM announcements a JOIN schools s ON s.id = a.school_id WHERE a.school_id IN (${schools.map(() => '?').join(',')}) AND a.audience IN ('all','parents','students') ORDER BY a.created DESC LIMIT 50`, ...schools);
  }
  return [];
});
route('DELETE', '/api/announcements/:id', (u, b, req, p) => { role(u, 'school_admin'); q.run('DELETE FROM announcements WHERE id = ? AND school_id = ?', +p.id, u.school_id); return { ok: true }; });

function otherParty(u, ch) {
  if (u.role === 'parent') {
    const c = ch.class_id ? q.get('SELECT teacher_id FROM classes WHERE id = ?', ch.class_id) : null;
    if (!c || !c.teacher_id) fail(400, "The child has no class teacher yet");
    return c.teacher_id;
  }
  if (!ch.parent_id) fail(400, 'Mzazi bado hajaunganishwa');
  return ch.parent_id;
}
route('GET', '/api/children/:id/messages', (u, b, req, p) => {
  if (!u) fail(401, "Sign in first");
  const ch = childFor(u, p.id);
  q.run('UPDATE messages SET seen = 1 WHERE child_id = ? AND to_id = ?', ch.id, u.id);
  return q.all('SELECT m.*, us.name from_name, us.role from_role FROM messages m JOIN users us ON us.id = m.from_id WHERE m.child_id = ? ORDER BY m.created', ch.id);
});
route('POST', '/api/children/:id/messages', (u, b, req, p) => {
  if (!u) fail(401, "Sign in first");
  const ch = childFor(u, p.id);
  const to = otherParty(u, ch);
  const body = need(b.body, "Type a message").slice(0, 2000);
  q.run('INSERT INTO messages(child_id, from_id, to_id, body, created) VALUES (?,?,?,?,?)', ch.id, u.id, to, body, now());
  hub.toUser(to, { t: 'message', child_id: ch.id, from: u.name });
  return { ok: true };
});
route('GET', '/api/inbox', u => {
  if (!u) fail(401, "Sign in first");
  return q.all(`SELECT m.child_id, c.name child, max(m.created) last, sum(CASE WHEN m.to_id = ? AND m.seen = 0 THEN 1 ELSE 0 END) unread
    FROM messages m JOIN children c ON c.id = m.child_id WHERE m.from_id = ? OR m.to_id = ? GROUP BY m.child_id ORDER BY last DESC`, u.id, u.id, u.id);
});

function childStats(ch) {
  const hws = ch.class_id ? q.all('SELECT id, title, subject, max_score, due, created FROM homework WHERE class_id = ?', ch.class_id) : [];
  const subs = q.all('SELECT * FROM submissions WHERE child_id = ?', ch.id);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Dar_es_Salaam' }).format(new Date());
  const pending = hws.filter(h => !subs.find(s => s.homework_id === h.id));
  const bySubject = {};
  subs.forEach(s => {
    if (s.score === null || s.score === undefined) return;
    const h = hws.find(x => x.id === s.homework_id); const k = (h && h.subject) || 'Mengineyo';
    (bySubject[k] = bySubject[k] || []).push(s.score / s.max_score * 100);
  });
  const subjects = Object.entries(bySubject).map(([name, arr]) => ({ name, pct: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) })).sort((a, b) => b.pct - a.pct);
  const att = q.all('SELECT present FROM attendance WHERE child_id = ?', ch.id);
  return {
    sent: subs.length,
    marked: subs.filter(s => s.status === 'marked').length,
    waiting: subs.filter(s => s.status === 'submitted').length,
    pending: pending.length,
    upcoming: pending.filter(h => h.due && h.due >= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5).map(h => ({ title: h.title, subject: h.subject, due: h.due })),
    overdue: pending.filter(h => h.due && h.due < today).length,
    subjects,
    attendance: att.length ? Math.round(att.filter(a => a.present).length / att.length * 100) : null,
    unread: q.get('SELECT count(*) n FROM messages WHERE child_id = ? AND to_id = ? AND seen = 0', ch.id, ch.parent_id || 0).n,
  };
}
route('GET', '/api/children/:id/report', (u, b, req, p) => {
  if (!u) fail(401, "Sign in first");
  const ch = childFor(u, p.id);
  const cls = ch.class_id ? q.get('SELECT * FROM classes WHERE id = ?', ch.class_id) : null;
  const teacher = cls && cls.teacher_id ? q.get('SELECT name FROM users WHERE id = ?', cls.teacher_id) : null;
  const cached = q.get('SELECT value FROM settings WHERE key = ?', 'report_' + ch.id);
  return { child: { id: ch.id, name: ch.name, class_name: className(cls), teacher: teacher ? teacher.name : null }, stats: childStats(ch), ai: cached ? J(cached.value) : null };
});
route('POST', '/api/children/:id/report/ai', async (u, b, req, p) => {
  if (!u) fail(401, "Sign in first");
  const ch = childFor(u, p.id);
  if (!ai.ready()) fail(400, 'AI ya ripoti haijawekwa kwenye server');
  const stats = { ...childStats(ch), local: b.local || null };
  const text = await ai.childReport({ name: ch.name, stats });
  const v = { text, at: now() };
  q.run('INSERT INTO settings(key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', 'report_' + ch.id, JSON.stringify(v));
  return v;
});

route('GET', '/api/school/analytics', u => {
  role(u, 'school_admin');
  const sid = u.school_id;
  const classes = q.all('SELECT * FROM classes WHERE school_id = ? ORDER BY level, stream', sid);
  const { classStats } = require('./routes-homework');
  const perClass = classes.map(c => {
    const st = classStats(c.id);
    const avgs = st.students.map(s => s.avg).filter(v => v !== null);
    const comp = st.students.map(s => s.completion).filter(v => v !== null);
    const att = st.students.map(s => s.attendance).filter(v => v !== null);
    const mean = a => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : null;
    return { id: c.id, name: className(c), students: st.students.length, performance: mean(avgs), completion: mean(comp), attendance: mean(att) };
  });
  const mean = k => { const v = perClass.map(c => c[k]).filter(x => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; };
  return {
    students: q.get('SELECT count(*) n FROM children WHERE school_id = ?', sid).n,
    teachers: q.get(`SELECT count(*) n FROM users WHERE school_id = ? AND role = 'teacher'`, sid).n,
    parents: q.get('SELECT count(DISTINCT parent_id) n FROM children WHERE school_id = ? AND parent_id IS NOT NULL', sid).n,
    performance: mean('performance'), completion: mean('completion'), attendance: mean('attendance'),
    classes: perClass,
  };
});

/* ---------- Malipo (billing) ---------- */
const getSetting = (k, d) => { const r = q.get('SELECT value FROM settings WHERE key = ?', k); return r ? J(r.value) : d; };
const setSetting = (k, v) => q.run('INSERT INTO settings(key, value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', k, JSON.stringify(v));
const invoiceFields = 'i.*, d.provider, d.account_name, d.receipt IS NOT NULL AS has_receipt';
const invoiceDetails = 'LEFT JOIN invoice_payment_details d ON d.invoice_id = i.id';

function billingInvoice(user, id, adminCanRead = false) {
  if (!user) fail(401, 'Sign in first');
  const invoice = q.get('SELECT * FROM invoices WHERE id = ?', Number(id));
  if (!invoice) fail(404, 'Invoice not found.');
  const permitted = (user.role === 'school_admin' && invoice.school_id === user.school_id) ||
    (user.role === 'parent' && invoice.parent_id === user.id) ||
    (adminCanRead && user.role === 'superadmin');
  if (!permitted) fail(403, 'You cannot access this invoice.');
  return invoice;
}

route('GET', '/api/billing', u => {
  if (!u) fail(401, 'Sign in first');
  const plans = getSetting('plans', { school_student_term: 0, parent_month: 0, pay_info: '' });
  let rows = [];
  if (u.role === 'school_admin') rows = q.all(`SELECT ${invoiceFields} FROM invoices i ${invoiceDetails} WHERE i.school_id = ? ORDER BY i.created DESC`, u.school_id);
  else if (u.role === 'parent') rows = q.all(`SELECT ${invoiceFields} FROM invoices i ${invoiceDetails} WHERE i.parent_id = ? ORDER BY i.created DESC`, u.id);
  else if (u.role === 'superadmin') rows = q.all(`SELECT ${invoiceFields}, s.name school, us.name parent, COALESCE(s.phone,us.phone) phone FROM invoices i ${invoiceDetails}
    LEFT JOIN schools s ON s.id = i.school_id LEFT JOIN users us ON us.id = i.parent_id ORDER BY i.created DESC LIMIT 300`);
  return { plans, invoices: rows };
});

route('GET', '/api/billing/:id/receipt', (u, b, req, p) => {
  const invoice = billingInvoice(u, p.id, true);
  const detail = q.get('SELECT receipt FROM invoice_payment_details WHERE invoice_id = ?', invoice.id);
  if (!detail?.receipt) fail(404, 'This invoice has no receipt image.');
  return { image: 'data:image/jpeg;base64,' + Buffer.from(detail.receipt).toString('base64') };
});

route('POST', '/api/billing/:id/pay', (u, b, req, p) => {
  const invoice = billingInvoice(u, p.id);
  if (invoice.status !== 'unpaid') fail(409, invoice.status === 'paid' ? 'This invoice is already paid.' : 'This payment is awaiting verification.');
  const reference = typeof b.reference === 'string' ? b.reference.trim().slice(0, 60) : '';
  const legacy = !b.payment_type && b.provider === undefined && b.account_name === undefined && b.receipt === undefined;
  let method, provider, account, receipt = null;
  if (legacy) {
    method = typeof b.method === 'string' ? b.method.trim().slice(0, 40) || 'M-Pesa' : 'M-Pesa';
  } else {
    method = b.payment_type;
    if (!['Mobile money', 'Bank transfer', 'Other'].includes(method)) fail(400, 'Choose a payment type.');
    provider = need(typeof b.provider === 'string' ? b.provider : '', 'Enter the bank, mobile network or payment provider.').slice(0, 100);
    account = need(typeof b.account_name === 'string' ? b.account_name : '', 'Enter the account holder name.').slice(0, 120);
    if (b.receipt) {
      const prefix = 'data:image/jpeg;base64,';
      const maxBytes = 2 * 1024 * 1024;
      if (typeof b.receipt !== 'string' || !b.receipt.startsWith(prefix) || b.receipt.length > prefix.length + 4 * Math.ceil(maxBytes / 3)) fail(400, 'Upload a receipt image up to 2 MB.');
      const encoded = b.receipt.slice(prefix.length);
      receipt = Buffer.from(encoded, 'base64');
      if (receipt.length < 5 || receipt.length > maxBytes || receipt.toString('base64') !== encoded ||
          receipt[0] !== 0xff || receipt[1] !== 0xd8 || receipt[2] !== 0xff ||
          receipt[receipt.length - 2] !== 0xff || receipt[receipt.length - 1] !== 0xd9) fail(400, 'The receipt must be a valid JPEG image.');
    }
  }
  if (!reference && !receipt) fail(400, 'Attach a receipt image or enter the transaction reference.');
  db.exec('BEGIN IMMEDIATE');
  try {
    if (!q.run("UPDATE invoices SET status = 'pending', method = ?, reference = ? WHERE id = ? AND status = 'unpaid'", method, reference || null, invoice.id).changes) fail(409, 'This invoice has already been submitted.');
    if (legacy) q.run('DELETE FROM invoice_payment_details WHERE invoice_id = ?', invoice.id);
    else q.run('INSERT OR REPLACE INTO invoice_payment_details (invoice_id, provider, account_name, receipt) VALUES (?, ?, ?, ?)', invoice.id, provider, account, receipt);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { ok: true };
});
route('PUT', '/api/admin/plans', (u, b) => {
  role(u, 'superadmin');
  setSetting('plans', { school_student_term: Math.max(0, +b.school_student_term || 0), parent_month: Math.max(0, +b.parent_month || 0), pay_info: (b.pay_info || '').slice(0, 500) });
  issueWaitingInvoices();
  return { ok: true };
});
route('POST', '/api/admin/invoices', (u, b) => {
  role(u, 'superadmin');
  const amount = Math.round(Number(b.amount));
  if (!Number.isSafeInteger(amount) || amount <= 0) fail(400, 'Enter a valid amount.');
  const schoolId = b.school_id ? Number(b.school_id) : null;
  const parentId = b.parent_id ? Number(b.parent_id) : null;
  if (Boolean(schoolId) === Boolean(parentId)) fail(400, 'Choose one school or parent.');
  if (schoolId && !q.get('SELECT id FROM schools WHERE id = ?', schoolId)) fail(404, 'School not found.');
  if (parentId && !q.get("SELECT id FROM users WHERE id = ? AND role = 'parent'", parentId)) fail(404, 'Parent not found.');
  checkRegistration(parentId, schoolId);
  q.run('INSERT INTO invoices(school_id, parent_id, plan, amount, period, created) VALUES (?,?,?,?,?,?)', schoolId, parentId, String(b.plan || 'HUGO KID').slice(0, 60), amount, need(b.period, 'Enter a period.').slice(0, 40), now());
  return { ok: true };
});
route('POST', '/api/admin/invoices/:id/status', (u, b, req, p) => {
  role(u, 'superadmin');
  const st = b.status;
  if (!['unpaid', 'pending', 'paid'].includes(st)) fail(400, 'Choose a payment status.');
  const invoice = q.get('SELECT * FROM invoices WHERE id = ?', +p.id);
  if (!invoice) fail(404, 'Invoice not found.');
  if (invoice.status === st) return { ok: true };
  db.exec('BEGIN IMMEDIATE');
  try {
    q.run('UPDATE invoices SET status = ?, paid = ? WHERE id = ?', st, st === 'paid' ? now() : null, invoice.id);
    if (st === 'paid') {
      if (invoice.parent_id) q.run("UPDATE users SET access_status = 'active' WHERE id = ? AND role = 'parent'", invoice.parent_id);
      if (invoice.school_id) q.run("UPDATE schools SET status = 'active' WHERE id = ?", invoice.school_id);
    }
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { ok: true };
});
route('PUT', '/api/admin/ai', (u, b) => {
  role(u, 'superadmin');
  const old = ai.cfg();
  setSetting('ai', { provider: ['gemini', 'claude', 'openai'].includes(b.provider) ? b.provider : 'gemini', key: (b.key || '').trim() || old.key, model: (b.model || '').trim() });
  return { ok: true };
});

route('GET', '/api/admin/tts', u => { role(u, 'superadmin'); const c = require('./tts').cfg(); return { region: c.region, has_key: !!c.key, enabled: c.enabled }; });
route('PUT', '/api/admin/tts', (u, b) => {
  role(u, 'superadmin');
  const old = getSetting('tts', {});
  setSetting('tts', { key: (b.key || '').trim() || old.key || '', region: (b.region || '').trim().toLowerCase() || old.region || '', enabled: b.enabled !== false });
  return { ok: true };
});
route('GET', '/api/admin/ai', u => { role(u, 'superadmin'); const c = ai.cfg(); return { provider: c.provider, model: c.model, has_key: !!c.key }; });
