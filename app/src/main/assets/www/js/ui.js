/* Shared UI, icons and audio helpers. */

const ICONS = {
  home: '<path d="M3 11l9-7 9 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-2.6 3.5M6.6 6.6C3.7 8.4 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/><path d="M3 3l18 18"/>',
  chevR: '<path d="M9 5l7 7-7 7"/>',
  chevL: '<path d="M15 5l-7 7 7 7"/>',
  game: '<rect x="2.5" y="7" width="19" height="11" rx="5.5"/><path d="M7.5 10.5v4M5.5 12.5h4"/><circle cx="15.5" cy="11.5" r="1"/><circle cx="18" cy="14" r="1"/>',
  book: '<path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z"/><path d="M12 6.5v13"/>',
  pencil: '<path d="M4 20l1-4.5L16 4.5l3.5 3.5-11 11z"/><path d="M14 7l3 3"/>',
  star: '<path d="M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  eraser: '<path d="M8 20h12"/><path d="M4.5 15.5l9.5-9.5 5 5-8 8H8.5z"/><path d="M9 11l5 5"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  trash: '<path d="M4 7h16"/><path d="M9 7V4.5h6V7"/><path d="M6 7l1 13h10l1-13"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  sliders: '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 21h7M10 17h4"/>',
  coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  pause: '<path d="M9 5v14M15 5v14"/>',
  play: '<path d="M7 4.5l12 7.5-12 7.5z"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4.5L17 13H5"/>',
  car: '<path d="M4.5 15l1.4-4.6A2 2 0 0 1 7.8 9h8.4a2 2 0 0 1 1.9 1.4L19.5 15"/><rect x="3" y="15" width="18" height="4.5" rx="1.8"/><path d="M7 19.5V21M17 19.5V21"/><path d="M6.5 17.2h1M16.5 17.2h1"/>',
  sunrise: '<path d="M3 19h18M6.5 19a5.5 5.5 0 0 1 11 0M12 4v4M5 10.5l1.6 1.4M19 10.5l-1.6 1.4"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M2.5 9h19M12 9v11"/><path d="M12 9c-1.5-3.5-5.5-4-5.5-1.5S12 9 12 9s5.5 1 5.5-1.5S13.5 5.5 12 9z"/>',
  volume: '<path d="M4 9.5v5h3.5L13 19V5L7.5 9.5z"/><path d="M16.5 9a4.2 4.2 0 0 1 0 6M19 6.5a7.7 7.7 0 0 1 0 11"/>',
  send: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-14 5.3L4 15"/><path d="M4 20v-5h5"/>',
  run: '<circle cx="14" cy="4.5" r="2"/><path d="M6 21l3.5-5.5 3 2.5V22M8 12l3-4 4 2 2.5 3.5M11 8l-1.5 5 3 3"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5l4 3-1.5 4.5h-5L8 10.5z"/><path d="M12 3v4.5M16 10.5l4.5-1.5M14.5 15l2.5 4M9.5 15L7 19M8 10.5L3.5 9"/>',
  plane: '<path d="M21 4L3 11l6.5 2.5L12 20l3-6.5z"/><path d="M9.5 13.5L21 4"/>',
  build: '<path d="M3 21h18"/><path d="M5 21V10l5-4 5 4v11"/><path d="M15 21v-7h4v7"/><path d="M8.5 13h3v3h-3z"/>',
  pot: '<path d="M4 10h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z"/><path d="M2 10h20"/><path d="M9 6.5c0-1 1-1.5 1-2.5M14 6.5c0-1 1-1.5 1-2.5"/>',
  bubbles: '<circle cx="8" cy="15" r="5"/><circle cx="16.5" cy="8.5" r="4"/><circle cx="18" cy="17.5" r="2.5"/>',
  balloon: '<path d="M12 3a6 6 0 0 1 6 6c0 4-3.5 7.5-6 7.5S6 13 6 9a6 6 0 0 1 6-6z"/><path d="M12 16.5L11 19l1.5 2"/>',
  letters: '<path d="M3 18l4-12 4 12M4.5 14h5"/><path d="M14 6h4a3 3 0 0 1 0 6h-4zM14 12h4.5a3 3 0 0 1 0 6H14z"/>',
  cards: '<rect x="3" y="5" width="11" height="15" rx="2"/><path d="M17 4.5l3.5 1.5-4.5 13"/>',
  robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/><circle cx="12" cy="3.5" r="1"/>',
  shop: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9h16v2a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 11z"/><path d="M5.5 13v7h13v-7"/><path d="M10 20v-4h4v4"/>',
  shapes: '<path d="M7 3l4.5 7.5h-9z"/><rect x="13" y="13" width="8" height="8" rx="1.5"/><circle cx="17" cy="7" r="4"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  logout: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  hand: '<path d="M9 11.5V4.8a1.6 1.6 0 0 1 3.2 0v5.7"/><path d="M12.2 10V8.6a1.6 1.6 0 0 1 3.2 0v2"/><path d="M15.4 10.4a1.6 1.6 0 0 1 3.2 0v4.1A6.5 6.5 0 0 1 12.1 21h-.6a6.5 6.5 0 0 1-5.3-2.8L3.8 14.6a1.6 1.6 0 0 1 2.6-1.9L9 15.3"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.6 2.6 0 0 1 5 .8c0 1.8-2.5 2.2-2.5 3.7"/><path d="M12 17.2h.01"/>',
};

function icon(name, size = 24, stroke = 2.2) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

const AVATAR_COLORS = ['#0FB394', '#1EA7F0', '#FFC20E', '#F65B4F', '#7B61FF', '#FF8A3D'];

function avatarSVG(color, size = 56, mood = 'happy', acc = '') {
  const mouth = mood === 'sleep'
    ? '<path d="M40 66 Q50 70 60 66" stroke="#0D2461" stroke-width="4" fill="none" stroke-linecap="round"/>'
    : '<path d="M36 62 Q50 76 64 62" stroke="#0D2461" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
  const eyes = mood === 'sleep'
    ? '<path d="M31 47 Q37 52 43 47M57 47 Q63 52 69 47" stroke="#0D2461" stroke-width="4" fill="none" stroke-linecap="round"/>'
    : '<circle cx="37" cy="46" r="5.5" fill="#0D2461"/><circle cx="63" cy="46" r="5.5" fill="#0D2461"/><circle cx="39" cy="44" r="1.8" fill="#fff"/><circle cx="65" cy="44" r="1.8" fill="#fff"/>';
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" class="avatar">
    <circle cx="50" cy="50" r="48" fill="${color}"/>
    <circle cx="50" cy="54" r="34" fill="#FFF3E2"/>
    <path d="M18 40 Q26 12 50 12 Q74 12 82 40 Q70 26 50 26 Q30 26 18 40z" fill="${color}" opacity=".9"/>
    ${eyes}
    <circle cx="28" cy="60" r="5" fill="#F65B4F" opacity=".25"/><circle cx="72" cy="60" r="5" fill="#F65B4F" opacity=".25"/>
    ${mouth}
    ${ACCESSORIES[acc] ? ACCESSORIES[acc].svg : ''}
  </svg>`;
}
const ACCESSORIES = {
  cap: { name: 'Kofia', cost: 20, svg: '<path d="M20 36Q22 10 50 10T80 36z" fill="#F65B4F"/><path d="M58 30h34q4 0 2 5H60z" fill="#C63D33"/><circle cx="50" cy="11" r="4" fill="#fff"/>' },
  glasses: { name: 'Miwani', cost: 30, svg: '<g fill="none" stroke="#0D2461" stroke-width="3.5"><circle cx="37" cy="46" r="10"/><circle cx="63" cy="46" r="10"/><path d="M47 46h6M27 44l-6-3M73 44l6-3"/></g>' },
  bow: { name: 'Kipepeo', cost: 30, svg: '<path d="M50 20l-18-10v20zM50 20l18-10v20z" fill="#E0476B"/><circle cx="50" cy="20" r="5" fill="#C1305A"/>' },
  crown: { name: 'Taji', cost: 80, svg: '<path d="M26 26l8 14 16-22 16 22 8-14 2 18H24z" fill="#FFC20E" stroke="#D29E00" stroke-width="2" stroke-linejoin="round"/><circle cx="50" cy="20" r="3" fill="#F65B4F"/>' },
};
const KID_AVATARS = ['1', '2', '3', '4', '5', '6'];
function kidAvatarSrc(c) {
  return KID_AVATARS.includes(c?.avatar) ? `img/safari/avatar-${c.avatar}.webp` : '';
}
function kidAvatar(c, size = 56, mood = 'happy', accessory = c?.acc) {
  const src = kidAvatarSrc(c);
  if (!src) return avatarSVG(c?.color || '#1EA7F0', size, mood, accessory || '');
  const extra = ACCESSORIES[accessory];
  return `<span class="kid-portrait" style="--portrait-size:${size}px" aria-hidden="true"><img src="${src}" alt="" decoding="async">${extra ? `<svg class="portrait-accessory" viewBox="0 0 100 100">${extra.svg}</svg>` : ''}</span>`;
}

function mascot(name, size = 88, cls = '') {
  const eyes = name === 'nuru' ? '<i class="mascot-lid"></i><i class="mascot-lid right"></i>' : '';
  return `<span class="mascot ${cls}" style="--mascot-size:${size}px" aria-hidden="true"><img src="img/safari/${name}.webp" alt="" decoding="async">${eyes}</span>`;
}

const GAME_SCENES = {
  racing: 'town', runner: 'runner', pilot: 'pilot', penalty: 'penalty',
  bubbles: 'bubbles', village: 'village', kitchen: 'kitchen', balloons: 'namba',
  letters: 'herufi', memory: 'ziwa', robot: 'roboti', market: 'soko',
  shapes: 'maumbo', speak: 'lugha', faith: 'kilimanjaro',
};

function sceneBanner(scene, character) {
  return `<div class="scene-banner scene-${scene}" aria-hidden="true">${mascot(character, 104, 'mascot-peek')}</div>`;
}

function celebrateMascot(root, name = 'nuru') {
  if (root.querySelector('.mascot-feedback')) return;
  const feedback = document.createElement('div');
  feedback.className = 'mascot-feedback';

  const sparks = Array.from({ length: 7 }, (_, i) => {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2, d = 46 + (i % 3) * 10;
    return `<i class="spark" style="--sx:${Math.round(Math.cos(a) * d)}px;--sy:${Math.round(Math.sin(a) * d)}px;--sd:${i * 25}ms"></i>`;
  }).join('');
  feedback.innerHTML = mascot(name, 76) + sparks;
  root.appendChild(feedback);
  setTimeout(() => feedback.remove(), 900);
}

document.addEventListener('pointerdown', e => {
  const host = e.target.closest && e.target.closest('.tile, .scene-banner, .game-card, .profile-avatars button, .trophy-hero, .home-hero, .mascot, .kid-portrait');
  if (!host) return;
  const m = host.matches('.mascot, .kid-portrait') ? host : host.querySelector('.mascot, .kid-portrait');
  if (!m) return;
  m.classList.remove('is-tapped'); void m.offsetWidth; m.classList.add('is-tapped');
  clearTimeout(m._tap); m._tap = setTimeout(() => m.classList.remove('is-tapped'), 650);
}, { passive: true });

const ART = {
  homework: mascot('tembo', 108, 'mascot-tile mascot-peek'),
  games: mascot('simba', 108, 'mascot-tile mascot-peek'),
  lessons: mascot('twiga', 110, 'mascot-tile mascot-peek'),
  reading: mascot('kobe', 108, 'mascot-tile mascot-peek'),
  math: mascot('pundamilia', 108, 'mascot-tile mascot-peek'),
  faith: `<svg class="art" viewBox="0 0 110 110"><circle cx="58" cy="70" r="24" fill="#FFE27A"/><g stroke="#fff" stroke-width="5" stroke-linecap="round"><path d="M58 30v-10M38 44l-7-7M86 44l7-7M20 70H10M96 70h10"/></g><path d="M8 78q30-14 50-4t52-4v40H8z" fill="#fff"/></svg>`,
};

function speak(text, lang = 'sw') {
  try {
    if (window.HugoNative && HugoNative.speak) { HugoNative.speak(String(text), lang); return; }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = { sw: 'sw-TZ', en: 'en-GB', fr: 'fr-FR', ar: 'ar', zh: 'zh-CN' }[lang] || 'sw-TZ';
      u.rate = 0.95;
      speechSynthesis.speak(u);
    }
  } catch (e) { /* kimya */ }
}

function vibrate(ms = 30) {
  try {
    if (window.HugoNative && HugoNative.vibrate) HugoNative.vibrate(ms);
    else if (navigator.vibrate) navigator.vibrate(ms);
  } catch (e) {}
}

const Sfx = {
  ctx: null,
  on: true,
  ac() {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.on = false; } }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, dur = 0.12, type = 'sine', vol = 0.18, delay = 0, slide = 0) {
    if (!this.on) return;
    const ac = this.ac(); if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t); o.stop(t + dur + 0.05);
  },
  tap() { this.tone(660, 0.06, 'triangle', 0.12); },
  coin() { this.tone(988, 0.08, 'square', 0.08); this.tone(1319, 0.14, 'square', 0.08, 0.07); },
  good() { [523, 659, 784].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.16, i * 0.09)); },
  bad() { this.tone(220, 0.25, 'sawtooth', 0.08, 0, -80); },
  crash() { this.tone(140, 0.3, 'square', 0.12, 0, -90); },
  win() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.18, 'triangle', 0.16, i * 0.12)); },
};

/* ---------- toast ---------- */
let _toastT;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastT);
  _toastT = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ---------- vitu vidogo ---------- */
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function $(sel, root = document) { return root.querySelector(sel); }
function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function confetti(root) {
  const box = document.createElement('div');
  box.className = 'confetti';
  const cols = ['#0FB394', '#1EA7F0', '#FFC20E', '#F65B4F', '#7B61FF'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = cols[i % cols.length];
    p.style.animationDuration = (1.6 + Math.random() * 1.6) + 's';
    p.style.animationDelay = (Math.random() * 0.5) + 's';
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    box.appendChild(p);
  }
  (root || document.body).appendChild(box);
  setTimeout(() => box.remove(), 4000);
}

function modal(root, { iconName, iconColor = 'var(--teal)', title, text, html = '', buttons = [] }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="modal">
    ${iconName === 'nuru' ? `<div style="display:flex;justify-content:center;margin-bottom:4px">${mascot('nuru', 100)}</div>` : iconName ? `<div class="big-ic" style="background:${iconColor}">${icon(iconName, 50, 2.4)}</div>` : ''}
    ${title ? `<h2>${esc(title)}</h2>` : ''}
    ${text ? `<p>${esc(text)}</p>` : ''}
    ${html}
    <div class="btn-row" style="flex-direction:column;gap:12px"></div>
  </div>`;
  const row = ov.querySelector('.btn-row');
  buttons.forEach(b => {
    const bt = document.createElement('button');
    bt.className = 'btn block ' + (b.cls || '');
    bt.innerHTML = (b.icon ? icon(b.icon, 22) : '') + esc(b.label);
    bt.onclick = () => { Sfx.tap(); if (b.keepOpen !== true) ov.remove(); b.onClick && b.onClick(ov); };
    row.appendChild(bt);
  });
  (root || document.getElementById('app')).appendChild(ov);
  return ov;
}

function confirmBox(root, title, text, yesLabel, onYes, cls = 'coral') {
  return modal(root, {
    title, text,
    buttons: [
      { label: yesLabel, cls, onClick: onYes },
      { label: 'No', cls: 'ghost' },
    ],
  });
}

function starsHTML(n, max = 3, size = 30) {
  let s = '';
  for (let i = 0; i < max; i++) s += `<svg class="${i < n ? '' : 'off'}" width="${size}" height="${size}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="${'M12 3.2l2.6 5.5 6 .8-4.4 4.1 1.1 6L12 16.7l-5.3 2.9 1.1-6L3.4 9.5l6-.8z'}"/></svg>`;
  return s;
}

function enhancePasswords(root = document) {
  root.querySelectorAll && root.querySelectorAll('input[type="password"]:not([data-pw])').forEach(inp => {
    inp.dataset.pw = '1';
    const wrap = document.createElement('div');
    wrap.className = 'pw-wrap';
    inp.parentNode.insertBefore(wrap, inp);
    wrap.appendChild(inp);
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'pw-eye'; b.title = 'Onyesha nenosiri';
    b.innerHTML = icon('eye', 20);
    b.onclick = () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      b.innerHTML = icon(show ? 'eyeOff' : 'eye', 20);
      b.title = show ? 'Ficha nenosiri' : 'Onyesha nenosiri';
      inp.focus();
    };
    wrap.appendChild(b);
  });
}
