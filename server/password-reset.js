const crypto = require('node:crypto');
const { db, q } = require('./db');
const { hashPass } = require('./auth');
const { route, fail } = require('./router');

const LIFETIME = 30 * 60_000;
const RESEND_INTERVAL = 90_000;
const digest = token => crypto.createHash('sha256').update(token).digest('hex');

db.exec(`
  CREATE TABLE IF NOT EXISTS password_resets (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    digest TEXT NOT NULL UNIQUE,
    requested INTEGER NOT NULL,
    expires INTEGER NOT NULL
  );
  CREATE TRIGGER IF NOT EXISTS clear_reset_after_password_change
    AFTER UPDATE OF pass, email ON users
    WHEN OLD.pass IS NOT NEW.pass OR OLD.email IS NOT NEW.email
    BEGIN DELETE FROM password_resets WHERE user_id = NEW.id; END;
`);

function mailSettings() {
  const { RESEND_API_KEY: key, PASSWORD_RESET_FROM: from, PUBLIC_APP_URL: origin } = process.env;
  if (!key || !from || !origin) return null;
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && !url.username && !url.password) return { key, from, origin: url.origin };
  } catch {}
  return null;
}

route('POST', '/api/password/forgot', async (_user, body) => {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Enter a valid email address.');
  const mail = mailSettings();
  if (!mail) fail(503, 'Password reset email is unavailable. Contact HUGO TECH for help.');
  const accounts = q.all('SELECT id, email FROM users WHERE lower(email) = ? LIMIT 2', email);
  if (accounts.length !== 1) return { ok: true };
  const account = accounts[0];
  const now = Date.now();
  if (q.get('SELECT count(*) AS total FROM password_resets WHERE requested > ?', now - RESEND_INTERVAL).total >= 30) return { ok: true };
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = digest(token);
  const saved = q.run(`
    INSERT INTO password_resets (user_id, digest, requested, expires) VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET digest = excluded.digest, requested = excluded.requested, expires = excluded.expires
    WHERE password_resets.requested <= ?
  `, account.id, tokenHash, now, now + LIFETIME, now - RESEND_INTERVAL);
  if (!saved.changes) return { ok: true };
  const link = new URL('/', mail.origin);
  link.hash = 'reset-password=' + token;
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + mail.key, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(8_000),
      body: JSON.stringify({
        from: mail.from,
        to: [account.email],
        subject: 'Reset your HUGO KID password',
        text: `Choose a new password here:\n\n${link.href}\n\nThis link expires in 30 minutes and can be used once. If you did not request a password reset, you can ignore this email.`,
      }),
    });
    if (!result.ok) throw new Error('Email service rejected the request');
  } catch {
    q.run('UPDATE password_resets SET expires = 0 WHERE digest = ?', tokenHash);
    console.warn('[HUGO KID] Password reset email delivery failed.');
  }
  return { ok: true };
});

route('POST', '/api/password/reset', (_user, body) => {
  const token = typeof body?.token === 'string' ? body.token : '';
  const password = body?.password;
  if (typeof password !== 'string' || password.length < 6 || password.length > 128) {
    fail(400, 'Choose a password between 6 and 128 characters.');
  }
  const invalid = () => fail(400, 'This reset link is invalid or expired. Request a new one.');
  if (!/^[a-f0-9]{64}$/.test(token)) invalid();
  const tokenHash = digest(token);
  db.exec('BEGIN IMMEDIATE');
  try {
    const reset = q.get('DELETE FROM password_resets WHERE digest = ? AND expires > ? RETURNING user_id', tokenHash, Date.now());
    if (!reset) invalid();
    q.run('UPDATE users SET pass = ?, must_change = 0 WHERE id = ?', hashPass(password), reset.user_id);
    q.run('DELETE FROM sessions WHERE user_id = ?', reset.user_id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
  return { ok: true };
});
