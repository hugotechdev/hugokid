// HUGO KID server - db.js : hifadhidata (SQLite iliyo ndani ya Node 22)
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const FILES_DIR = path.join(DATA_DIR, 'files');
fs.mkdirSync(FILES_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'hugokid.db'));

db.exec(`
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'school',          -- school | tutor
  region TEXT, district TEXT, phone TEXT,
  levels TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',        -- active | blocked
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,                            -- superadmin | school_admin | teacher | parent
  name TEXT NOT NULL,
  phone TEXT, email TEXT,
  pass TEXT NOT NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  must_change INTEGER NOT NULL DEFAULT 0,
  terms TEXT,
  created INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS users_phone ON users(phone) WHERE phone IS NOT NULL AND phone <> '';
CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email) WHERE email IS NOT NULL AND email <> '';
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  stream TEXT NOT NULL DEFAULT '',
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  birth TEXT,
  color TEXT,
  parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  link_code TEXT UNIQUE,
  local_id TEXT,
  allow_audio INTEGER NOT NULL DEFAULT 1,
  allow_video INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS files (
  name TEXT PRIMARY KEY,
  mime TEXT NOT NULL,
  size INTEGER NOT NULL,
  label TEXT,
  owner_id INTEGER,
  school_id INTEGER,
  child_id INTEGER,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS homework (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT,
  kind TEXT NOT NULL DEFAULT 'paper',            -- paper | quiz | open
  instructions TEXT,
  pages TEXT NOT NULL DEFAULT '[]',
  questions TEXT NOT NULL DEFAULT '[]',
  attachments TEXT NOT NULL DEFAULT '[]',
  max_score INTEGER NOT NULL DEFAULT 10,
  due TEXT,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  homework_id INTEGER NOT NULL REFERENCES homework(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  status TEXT NOT NULL,                          -- submitted | marked | returned
  pages TEXT NOT NULL DEFAULT '[]',
  answers TEXT,
  attachments TEXT NOT NULL DEFAULT '[]',
  marked TEXT,
  auto_score REAL, ai_score REAL, ai_comment TEXT,
  score REAL, max_score INTEGER NOT NULL DEFAULT 10,
  stars INTEGER NOT NULL DEFAULT 0,
  feedback TEXT,
  submitted INTEGER, reviewed INTEGER,
  UNIQUE(homework_id, child_id)
);
CREATE TABLE IF NOT EXISTS attendance (
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  present INTEGER NOT NULL,
  PRIMARY KEY (child_id, day)
);
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  author_id INTEGER,
  audience TEXT NOT NULL DEFAULT 'all',          -- all | parents | teachers | students
  title TEXT NOT NULL, body TEXT,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  from_id INTEGER NOT NULL,
  to_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  seen INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  period TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',         -- unpaid | pending | paid
  method TEXT, reference TEXT,
  created INTEGER NOT NULL, paid INTEGER
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
CREATE TABLE IF NOT EXISTS invites (
  code TEXT PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  expires INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  b INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  created INTEGER NOT NULL,
  UNIQUE(a, b)
);
CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  a INTEGER NOT NULL, b INTEGER NOT NULL,
  media TEXT, started INTEGER NOT NULL, ended INTEGER
);
`);

/* maboresho ya hifadhidata zilizopo (yanaongezwa mara moja) */
for (const sql of ['ALTER TABLE children ADD COLUMN progress TEXT']) { try { db.exec(sql); } catch (e) { /* tayari ipo */ } }

const q = {
  get: (sql, ...a) => db.prepare(sql).get(...a),
  all: (sql, ...a) => db.prepare(sql).all(...a),
  run: (sql, ...a) => db.prepare(sql).run(...a),
};

module.exports = { db, q, DATA_DIR, FILES_DIR };
