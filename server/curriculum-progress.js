const { db, q } = require('./db');
const { fail, J } = require('./router');
const { merge } = require('../app/src/main/assets/www/js/curriculum-state');

db.exec(`CREATE TABLE IF NOT EXISTS curriculum_progress (
  child_id INTEGER PRIMARY KEY REFERENCES children(id) ON DELETE CASCADE,
  progress TEXT NOT NULL
)`);

function syncCurriculum(child, incoming) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) fail(400,'Enter valid curriculum progress.');
  if (JSON.stringify(incoming).length > 145000) fail(413,'Curriculum progress is too large.');
  db.exec('BEGIN IMMEDIATE');
  try {
    const saved = J(q.get('SELECT progress FROM curriculum_progress WHERE child_id = ?',child.id)?.progress);
    const progress = merge(saved,incoming);
    q.run(`INSERT INTO curriculum_progress(child_id,progress) VALUES(?,?)
      ON CONFLICT(child_id) DO UPDATE SET progress=excluded.progress`,child.id,JSON.stringify(progress));
    db.exec('COMMIT');
    return progress;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

module.exports = { syncCurriculum };
