const assert = require('node:assert/strict');
const { once } = require('node:events');
const { spawn } = require('node:child_process');
const { mkdtemp, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { test } = require('node:test');

const testPass = 'Local-QA-only-password-58';
const adminLogin = 'audit-admin@example.test';
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

test('HUGO KID API roles, registries, files, coursework and realtime lifecycle', { timeout: 30_000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'hugokid-qa-'));
  const child = spawn(process.execPath, ['--no-warnings', 'server/server.js'], {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATA_DIR: directory, PORT: '0', ADMIN_EMAIL: adminLogin, ADMIN_PASSWORD: testPass,
      RESEND_API_KEY: '', PASSWORD_RESET_FROM: '', PUBLIC_APP_URL: '', AZURE_SPEECH_KEY: '', AI_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const stopped = once(child, 'exit');
  t.after(async () => { child.kill(); await stopped; await rm(directory, { recursive: true, force: true }); });
  let output = '', errors = '';
  child.stdout.on('data', bytes => { output += bytes; });
  child.stderr.on('data', bytes => { errors += bytes; });
  for (let attempt = 0; !output.includes('http://localhost:') && attempt < 70; attempt++) await wait(50);
  const port = Number(/http:\/\/localhost:(\d+)/.exec(output)?.[1]);
  assert.ok(port, 'server starts and exposes its bound port: ' + errors);
  const base = 'http://127.0.0.1:' + port;
  const request = (path, options) => fetch(base + path, options);

  async function api(method, path, token, data, status = 200) {
    const res = await request('/api' + path, {
      method,
      headers: { ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: data === undefined ? undefined : JSON.stringify(data),
    });
    const response = await res.json();
    assert.equal(res.status, status, method + ' ' + path + ': ' + JSON.stringify(response));
    return response;
  }
  const get = (path, token, status) => api('GET', path, token, undefined, status);
  const post = (path, token, data, status) => api('POST', path, token, data, status);
  const put = (path, token, data, status) => api('PUT', path, token, data, status);
  const signIn = (login, password = testPass) => post('/login', null, { login, password });
  const register = (kind, name, email) => post('/register', null, { kind, name, email, password: testPass, terms: '1.0' });

  assert.ok((await request('/')).ok);
  assert.ok((await request('/download')).ok);
  assert.equal((await request('/', { method: 'HEAD' })).headers.get('x-content-type-options'), 'nosniff');
  assert.equal((await request('/img/missing.webp')).status, 404);
  assert.equal((await request('/', { method: 'POST' })).status, 405);
  await get('/health');
  await get('/me', null, 401);
  await post('/login', null, null, 400);
  await post('/register', null, { kind: 'parent', name: 'Test Parent', email: 'invalid', password: testPass, terms: '1.0' }, 400);
  await post('/password/forgot', null, { email: 'parent@example.test' }, 503);
  await post('/password/reset', null, { token: '', password: testPass }, 400);
  assert.equal((await get('/android-download')).available, false);
  assert.equal((await request('/download/HUGO-KID.apk')).status, 404);
  assert.equal((await get('/tts/status')).enabled, false);

  const { token: admin } = await signIn(adminLogin);
  const { token: oldAdmin } = await signIn(adminLogin);
  await get('/admin/stats', admin, 403);
  await post('/password', admin, { old: testPass, new: testPass + 'changed' });
  await get('/me', oldAdmin, 401);
  await put('/admin/plans', admin, { school_student_term: 20000, parent_month: 10000, pay_info: 'QA' });

  const school = await register('school', 'Demo School', 'school@example.test');
  const sc = school.token;
  const level = (await get('/registration', sc)).levels[0];
  await put('/registration', sc, { complete: true, name: 'Demo School', region: 'Dar es Salaam', district: 'Ilala', levels: [level], studentCount: 4 });
  const [schoolBill] = (await get('/billing', sc)).invoices;
  assert.equal(schoolBill.amount, 80000);
  await post('/admin/invoices/' + schoolBill.id + '/status', admin, { status: 'paid' });
  await get('/admin/stats', sc, 403);
  const [main] = await get('/classes', sc);
  const otherClass = await post('/classes', sc, { level, stream: 'B' });
  const teacher = await post('/teachers', sc, { name: 'First Teacher', email: 'teacher@example.test' });
  const ta = (await signIn(teacher.login, teacher.password)).token;
  await get('/classes', ta, 403);
  await post('/password', ta, { old: teacher.password, new: testPass });
  await put('/classes/' + main.id, sc, { teacher_id: teacher.id });
  await put('/classes/' + main.id, sc, { stream: 'A' });
  assert.equal((await get('/classes', ta))[0].teacher_id, teacher.id);
  await get('/classes/' + otherClass.id + '/students', ta, 403);

  const parent = await register('parent', 'Demo Parent', 'parent@example.test');
  const pa = parent.token;
  await post('/admin/parents/' + parent.user.id + '/status', admin, { status: 'active' }, 409);
  await put('/registration', pa, { complete: true, children: [{ name: 'Child One', grade: level, age: 8 }, { name: 'Child Two', grade: level, age: 11 }] });
  const [parentBill] = (await get('/billing', pa)).invoices;
  await post('/billing/' + parentBill.id + '/pay', pa, { payment_type: 'Bank transfer', provider: 'Fixture Bank', account_name: 'Fixture Parent' }, 400);
  await post('/billing/' + parentBill.id + '/pay', pa, { payment_type: 'Bank transfer', provider: 'Fixture Bank', account_name: 'Fixture Parent', reference: 'QA-0001' });
  await post('/admin/invoices/' + parentBill.id + '/status', admin, { status: 'paid' });
  const [kidOne, kidTwo] = await get('/children', pa);
  await get('/classes', pa, 403);
  const entries = await post('/classes/' + main.id + '/students', ta, { names: ['Child One', 'Child Two'] });
  for (const [index, kid] of [kidOne, kidTwo].entries()) {
    await post('/children/link', pa, { child_id: kid.id, code: entries[index].link_code });
  }
  const day = '2026-11-27';
  await post('/classes/' + main.id + '/attendance', ta, { day, present: { [kidOne.id]: true, [kidTwo.id]: false } });
  const attendance = await get('/classes/' + main.id + '/attendance?day=' + day, ta);
  assert.deepEqual(attendance.students.map(entry => entry.present), [true, false]);
  await post('/classes/' + main.id + '/attendance', ta, { day: '2026-02-30', present: {} }, 400);

  const upload = await request('/api/upload?label=worksheet.pdf', {
    method: 'POST', headers: { Authorization: 'Bearer ' + ta, 'Content-Type': 'application/pdf' }, body: '%PDF-1.4\nQA fixture\n%%EOF',
  });
  assert.equal(upload.status, 200);
  const { file } = await upload.json();
  const paper = await post('/homework', ta, { class_id: main.id, title: 'Worksheet', kind: 'paper', attachments: [{ file }] });
  await post('/homework', ta, { class_id: main.id, title: 'Invalid points', kind: 'quiz', questions: [{ type: 'text', q: 'Explain', points: -1 }] }, 400);
  const quiz = await post('/homework', ta, {
    class_id: main.id, title: 'Mixed Quiz', subject: 'Maths', kind: 'quiz', max_score: 10,
    questions: [{ type: 'mcq', q: '1 + 1?', options: ['2', '3'], answer: 0 }, { type: 'text', q: 'Explain your answer.' }],
  });
  const link = await post('/children/' + kidOne.id + '/device-code', pa, { bedtime: 'off' });
  const linked = await post('/device/link', null, { code: link.code });
  const student = linked.token;
  assert.equal((await get('/me', student)).user.role, 'child');
  await get('/children', student, 403);
  await get('/children/' + kidTwo.id + '/homework', student, 403);
  const curriculumPath = '/children/' + kidOne.id + '/curriculum';
  const siblingPath = '/children/' + kidTwo.id + '/curriculum';
  const learning = { skills: { 'math.number': { evidence: { 'math.number:1': 20 }, wins: { 'math.number:1': 20 }, seen: { 'math.number:1': 20 } } } };
  await request('/api'+siblingPath, { method:'PUT', headers:{Authorization:'Bearer '+student,'Content-Type':'application/json'}, body:JSON.stringify({progress:learning}) }).then(r=>assert.equal(r.status,403));
  async function curriculum(token, progress) {
    const r = await request('/api'+curriculumPath,{method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({progress})});
    assert.equal(r.status,200);
    return r.json();
  }
  assert.equal((await curriculum(student,learning)).skills['math.number'].seen['math.number:1'],20);
  assert.equal((await curriculum(pa,{episodes:{'racing:1':21}})).skills['math.number'].evidence['math.number:1'],20);
  assert.equal((await curriculum(student,{})).episodes['racing:1'],21);
  const homework = await get('/children/' + kidOne.id + '/homework', student);
  assert.equal(homework.find(h => h.id === quiz.id).questions[0].answer, undefined);
  const filesPath = '/api/files/' + file;
  const fileResult = await request(filesPath, { headers: { Authorization: 'Bearer ' + student, Range: 'bytes=0-3' } });
  assert.equal(fileResult.status, 206);
  assert.equal(await fileResult.text(), '%PDF');
  const range = await request(filesPath, { headers: { Authorization: 'Bearer ' + student, Range: 'bytes=999-1000' } });
  assert.equal(range.status, 416);
  await post('/children/' + kidOne.id + '/submit', student, { homework_id: paper.id, answers: [] }, 400);
  const submitted = await post('/children/' + kidOne.id + '/submit', student, { homework_id: quiz.id, answers: [0] });
  assert.equal(submitted.status, 'submitted');
  const row = (await get('/homework/' + quiz.id, ta)).students.find(x => x.child_id === kidOne.id);
  await post('/submissions/' + row.submission.id + '/review', ta, { score: 9, feedback: 'Good work' });
  assert.equal((await get('/classes/' + main.id + '/results', ta)).top[0].avg, 90);
  assert.equal((await get('/children/' + kidOne.id + '/report', pa)).stats.marked, 1);
  await post('/announcements', sc, { title: 'Fixture notice', body: 'School announcement', audience: 'parents' });
  assert.ok((await get('/announcements', pa)).some(row => row.title === 'Fixture notice'));
  await post('/children/' + kidOne.id + '/messages', pa, { body: 'Hello' });
  assert.equal((await get('/children/' + kidOne.id + '/messages', ta))[0].body, 'Hello');

  const invite = await post('/children/' + kidOne.id + '/invite', pa, {});
  await post('/children/' + kidTwo.id + '/friends', pa, { code: invite.code });
  assert.equal((await get('/children/' + kidOne.id + '/friends', student))[0].child_id, kidTwo.id);
  function socket(token, childId) {
    const ws = new WebSocket(base.replace('http:', 'ws:') + '/ws?token=' + token + '&child=' + childId);
    const messages = [];
    ws.addEventListener('message', event => messages.push(JSON.parse(event.data)));
    return { ws, async message(type) {
      for (let i = 0; i < 80; i++) {
        const index = messages.findIndex(message => message.t === type);
        if (index !== -1) return messages.splice(index, 1)[0];
        await wait(25);
      }
      assert.fail('Missing realtime message ' + type);
    } };
  }
  const one = socket(student, kidOne.id), two = socket(pa, kidTwo.id);
  try {
    await Promise.all([one.message('hello'), two.message('hello')]);
    one.ws.send(JSON.stringify({ t: 'call', to: kidTwo.id, media: 'audio' }));
    assert.equal((await two.message('ring')).from, kidOne.id);
    two.ws.send(JSON.stringify({ t: 'accept', to: kidOne.id, media: 'audio' }));
    await one.message('accepted');
    one.ws.send(JSON.stringify({ t: 'hangup', to: kidTwo.id }));
    await two.message('hangup');
    assert.ok((await get('/children/' + kidOne.id + '/calls', pa))[0].ended);
  } finally { one.ws.close(); two.ws.close(); }
  await post('/device/status', student, { request: true });
  await post('/children/' + kidOne.id + '/device-time', pa, { minutes: 30 });
  assert.ok((await post('/device/status', student, {})).until > Date.now());
  await post('/admin/parents/' + parent.user.id + '/status', admin, { status: 'blocked' });
  await get('/children/' + kidOne.id + '/homework', student, 403);

  const db = new DatabaseSync(join(directory, 'hugokid.db'), { readOnly: true });
  try {
    assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(db.prepare('PRAGMA foreign_key_check').all(), []);
    assert.ok(db.prepare("SELECT count(*) count FROM sqlite_master WHERE type = 'table'").get().count >= 20);
  } finally { db.close(); }
  assert.equal(errors, '');
});
