

const Store = {
  key(k) {
    const parentKeys = ['parent', 'children', 'active', 'ai', 'lastPush'];
    if (['remoteUntil','offlinePin','deviceSetup'].includes(k) || k.startsWith('night_') || parentKeys.includes(k) || /^(use_|lessons_|ailog_|creations_)/.test(k)) {
      const user = this.get('acct', null)?.user;
      if (user?.role === 'child') return 'hk_linked_' + user.id + '_' + k;
      const owner = this.get('profileOwner', null);
      if (user?.role === 'parent' && owner && user.id !== owner) return 'hk_parent_' + user.id + '_' + k;
    }
    return 'hk_' + k;
  },
  get(k, d) {
    try { const v = localStorage.getItem(this.key(k)); return v == null ? d : JSON.parse(v); }
    catch (e) { return d; }
  },
  set(k, v) { localStorage.setItem(this.key(k), JSON.stringify(v)); },

  parent() { return this.get('parent', null); },
  saveParent(p) { this.set('parent', p); },
  settings() {
    const p = this.parent() || {};
    return Object.assign({ gameLimitMin: 20, bedtime: '20:30', bonusMin: 5 }, p.settings || {});
  },
  saveSettings(s) { const p = this.parent() || {}; p.settings = s; this.saveParent(p); },

  /* ----- watoto ----- */
  children() { return this.get('children', []); },
  child(id) { return this.children().find(c => c.id === id) || null; },
  saveChild(c) {
    const list = this.children();
    const i = list.findIndex(x => x.id === c.id);
    if (i >= 0) {
      const saved = list[i].curriculum;
      if (saved && c.curriculum && JSON.stringify(saved)!==JSON.stringify(c.curriculum)) {
        c.curriculum = CurriculumState.merge(saved,c.curriculum);
      } else if (saved && !c.curriculum) c.curriculum = saved;
      list[i] = c;
    } else list.push(c);
    this.set('children', list);
  },
  removeChild(id) { this.set('children', this.children().filter(c => c.id !== id)); },
  activeId() { return this.get('active', null); },
  setActive(id) { this.set('active', id); },
  active() { const id = this.activeId(); return id ? this.child(id) : null; },

  today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  usage(childId, day) { return this.get('use_' + childId + '_' + (day || this.today()), { game: 0, bonus: 0, learn: 0 }); },
  saveUsage(childId, u) { this.set('use_' + childId + '_' + this.today(), u); },
  weekUsage(childId) {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      out.push({ day: d, ...this.usage(childId, key) });
    }
    return out;
  },
};

function faithOn(child) { return !child || child.faithOn !== false; }

function ageYears(birth) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birth || '')) return 7;
  const b = new Date(birth + 'T00:00:00'), n = new Date();
  if (!Number.isFinite(b.getTime()) || b > n) return 7;
  let a = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--;
  return a;
}

function ageGroup(child) {
  return MODES[kidMode(child)].group;
}
const GROUPS = {
  explorer: { name: 'Early Explorers', range: 'Miaka 3-5', color: 'var(--sun)' },
  adventurer: { name: 'Adventurers', range: 'Miaka 6-9', color: 'var(--teal)' },
  master: { name: 'Young Masters', range: 'Miaka 10-12', color: 'var(--blue)' },
};
const RELIGIONS = {
  islam: { name: 'Uislamu', tile: 'Imani' },
  christian: { name: 'Ukristo', tile: 'Imani' },
  values: { name: 'Maadili ya jumla', tile: 'Maadili' },
};

async function hashPin(pin) {
  const text = 'hugokid::' + pin;
  try {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(x => x.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}
  let h = 5381; for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return 'f' + h.toString(16);
}

const HWDB = {
  _db: null,
  open() {
    if (this._db) return Promise.resolve(this._db);
    return new Promise((res, rej) => {
      const r = indexedDB.open('hugokid', 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('homework')) {
          const s = db.createObjectStore('homework', { keyPath: 'id' });
          s.createIndex('childId', 'childId');
        }
      };
      r.onsuccess = () => { this._db = r.result; res(this._db); };
      r.onerror = () => rej(r.error);
    });
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('homework', mode);
      const s = t.objectStore('homework');
      let out;
      Promise.resolve(fn(s, v => (out = v))).catch(rej);
      t.oncomplete = () => res(out);
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error || new Error('Homework could not be saved.'));
    });
  },
  all() {
    return this.tx('readonly', (s, set) => { const r = s.getAll(); r.onsuccess = () => set(r.result || []); })
      .then(list => list.sort((a, b) => b.created - a.created));
  },
  byChild(childId) {
    return this.tx('readonly', (s, set) => {
      const request = s.index('childId').getAll(childId);
      request.onsuccess = () => set(request.result);
    }).then(list => list.sort((a, b) => b.created - a.created));
  },
  get(id) { return this.tx('readonly', (s, set) => { const r = s.get(id); r.onsuccess = () => set(r.result || null); }); },
  put(obj) { obj.updated = Date.now(); return this.tx('readwrite', s => { s.put(obj); }); },
  del(id) { return this.tx('readwrite', s => { s.delete(id); }); },
};

function fileToImageData(file, max = 1600) {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        const k = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * k); h = Math.round(h * k);
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
        x.drawImage(img, 0, 0, w, h);
        res({ data: c.toDataURL('image/jpeg', 0.85), w, h });
      };
      img.onerror = () => rej(new Error("The photo didn't open"));
      img.src = fr.result;
    };
    fr.onerror = () => rej(fr.error);
    fr.readAsDataURL(file);
  });
}
