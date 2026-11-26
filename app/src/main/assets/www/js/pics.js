

const _leaf = (x, y, r = 0) => `<path d="M${x} ${y}q7-9 15-4q-6 9-15 4z" fill="#3FA34D" transform="rotate(${r} ${x} ${y})"/>`;
const _shine = (x, y, rx = 4, ry = 6) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45"/>`;

const PICS = {
  /* ---- matunda ---- */
  embe: `<path d="M18 40c-4-15 8-28 22-26 12 2 16 16 10 28-6 12-28 14-32-2z" fill="#FFB020"/><path d="M40 14c8 2 14 10 13 20" stroke="#FF8A00" stroke-width="3" fill="none" opacity=".5"/>${_leaf(38, 15, -20)}${_shine(27, 30)}`,
  chungwa: `<circle cx="32" cy="36" r="20" fill="#FF8A3D"/><circle cx="32" cy="36" r="20" fill="none" stroke="#E86F1F" stroke-width="2" stroke-dasharray="1 5" opacity=".6"/>${_leaf(32, 17, -10)}<circle cx="32" cy="17" r="2.5" fill="#6B8E23"/>${_shine(24, 28)}`,
  ndizi: `<path d="M14 22c2 20 16 32 38 28 4-1 4-5 0-5-16 2-28-8-31-24-1-4-7-4-7 1z" fill="#FFD93D"/><path d="M18 26c4 14 14 22 30 21" stroke="#E5B800" stroke-width="2.5" fill="none"/><path d="M12 20l4-4 4 4z" fill="#7A5A2B"/>`,
  nanasi: `<ellipse cx="32" cy="40" rx="14" ry="18" fill="#E3B341"/><path d="M22 30l20 20M22 40l14 14M26 24l18 18M42 30L22 50M42 40L28 54M38 24L20 42" stroke="#B8862A" stroke-width="2"/><path d="M32 22l-8-14 8 6 0-10 4 10 6-8-4 14z" fill="#3FA34D"/>`,
  tikiti: `<path d="M8 28h48a24 24 0 0 1-48 0z" fill="#3FA34D"/><path d="M12 28h40a20 20 0 0 1-40 0z" fill="#E85D5D"/><g fill="#2A1A12"><ellipse cx="24" cy="36" rx="1.6" ry="2.6"/><ellipse cx="32" cy="40" rx="1.6" ry="2.6"/><ellipse cx="40" cy="36" rx="1.6" ry="2.6"/><ellipse cx="28" cy="44" rx="1.6" ry="2.6"/><ellipse cx="36" cy="45" rx="1.6" ry="2.6"/></g>`,
  parachichi: `<path d="M32 10c10 0 18 16 18 30a18 18 0 0 1-36 0c0-14 8-30 18-30z" fill="#4E7A27"/><path d="M32 16c7 0 13 13 13 24a13 13 0 0 1-26 0c0-11 6-24 13-24z" fill="#C8E07A"/><circle cx="32" cy="42" r="7" fill="#8A5A2B"/>`,
  ndimu: `<ellipse cx="32" cy="36" rx="20" ry="16" fill="#B6D94C"/><path d="M12 36l-4-2 4-2zM52 36l4-2-4-2z" fill="#9DC23A"/>${_leaf(30, 21, -15)}${_shine(24, 31, 5, 4)}`,
  tufaha: `<path d="M32 22c-6-5-20-4-20 12 0 14 10 22 20 18 10 4 20-4 20-18 0-16-14-17-20-12z" fill="#E23B3B"/><path d="M32 22c0-5 1-9 4-12" stroke="#7A5A2B" stroke-width="3" fill="none" stroke-linecap="round"/>${_leaf(34, 16, -10)}${_shine(22, 32)}`,
  nyanya: `<circle cx="32" cy="38" r="18" fill="#E23B3B"/><path d="M32 22l-8-4 5 6-8 2 9 2-2 6 4-5 4 5-2-6 9-2-8-2 5-6z" fill="#3FA34D"/>${_shine(24, 32)}`,
  karoti: `<path d="M24 22l16 4-10 34z" fill="#F28C28"/><path d="M27 32h8M28 40h6M29 48h4" stroke="#D9701A" stroke-width="2" stroke-linecap="round"/><path d="M30 22l-4-12 6 9 2-11 2 12 6-8-4 12z" fill="#3FA34D"/>`,
  kitunguu: `<path d="M32 14c3 6 16 12 16 26a16 16 0 0 1-32 0c0-14 13-20 16-26z" fill="#C9A0DC"/><path d="M32 18c-4 8-8 14-8 22M32 18c4 8 8 14 8 22" stroke="#A97CC0" stroke-width="2" fill="none"/><path d="M28 56h8" stroke="#8A6A40" stroke-width="3" stroke-linecap="round"/>`,

  maji: `<path d="M32 8c8 12 18 22 18 34a18 18 0 0 1-36 0c0-12 10-22 18-34z" fill="#4FB6F0"/>${_shine(25, 40, 4, 7)}`,
  chai: `<path d="M14 26h30v14a15 15 0 0 1-30 0z" fill="#fff" stroke="#C9D3E3" stroke-width="2"/><path d="M17 30h24v10a12 12 0 0 1-24 0z" fill="#B5743A"/><path d="M44 30h4a6 6 0 0 1 0 12h-4" stroke="#C9D3E3" stroke-width="3" fill="none"/><path d="M24 20c0-4 4-4 4-8M32 20c0-4 4-4 4-8" stroke="#9AA8C0" stroke-width="2" fill="none" stroke-linecap="round"/>`,
  maziwa: `<path d="M22 14h20v8l6 8v26H16V30l6-8z" fill="#fff" stroke="#C9D3E3" stroke-width="2"/><path d="M16 36h32v20H16z" fill="#4FB6F0"/><path d="M22 14h20v6H22z" fill="#1EA7F0"/>`,
  sukari: `<g fill="#fff" stroke="#C9D3E3" stroke-width="2"><rect x="12" y="32" width="16" height="16" rx="3"/><rect x="32" y="32" width="16" height="16" rx="3"/><rect x="22" y="16" width="16" height="16" rx="3"/></g>`,
  unga: `<path d="M18 20h28l4 36H14z" fill="#F3E3C3" stroke="#D9C49A" stroke-width="2"/><path d="M18 20l4-6h20l4 6" fill="#E8D3A8"/><circle cx="32" cy="38" r="7" fill="#E0A100" opacity=".6"/>`,
  mafuta: `<path d="M26 8h12v8l6 6v34H20V22l6-6z" fill="#F2C14E" stroke="#D9A72E" stroke-width="2"/><rect x="26" y="6" width="12" height="5" rx="2" fill="#E23B3B"/>${_shine(26, 36, 3, 9)}`,
  chumvi: `<path d="M22 26h20l-2 30H24z" fill="#fff" stroke="#C9D3E3" stroke-width="2"/><path d="M22 26c0-10 20-10 20 0z" fill="#9AA8C0"/><g fill="#6B778C"><circle cx="28" cy="20" r="1.4"/><circle cx="32" cy="18" r="1.4"/><circle cx="36" cy="20" r="1.4"/></g>`,
  mchele: `<path d="M10 34h44a22 18 0 0 1-44 0z" fill="#fff" stroke="#C9D3E3" stroke-width="2"/><path d="M12 34c4-12 36-12 40 0z" fill="#FAFAF5" stroke="#E6E6DA" stroke-width="2"/><g fill="#E6E6DA"><ellipse cx="24" cy="29" rx="2" ry="1"/><ellipse cx="32" cy="27" rx="2" ry="1"/><ellipse cx="40" cy="29" rx="2" ry="1"/></g>`,
  sabuni: `<rect x="12" y="26" width="40" height="24" rx="10" fill="#9BE7FF"/><g fill="#fff" opacity=".9"><circle cx="20" cy="18" r="5"/><circle cx="30" cy="14" r="4"/><circle cx="42" cy="18" r="6"/></g>`,
  mchanga: `<path d="M8 48c6-14 16-20 24-20s18 6 24 20z" fill="#D9B26F"/><g fill="#B88A45"><circle cx="24" cy="42" r="1.5"/><circle cx="34" cy="38" r="1.5"/><circle cx="42" cy="44" r="1.5"/></g>`,
  pipi: `<path d="M8 24l10 8-10 8zM56 24l-10 8 10 8z" fill="#FF9FD0"/><circle cx="32" cy="32" r="14" fill="#FF6FB5"/><path d="M22 26c6 4 14 4 20 0M22 38c6-4 14-4 20 0" stroke="#fff" stroke-width="3" fill="none" opacity=".7"/>`,

  /* ---- vitu vya kila siku ---- */
  shule: `<path d="M10 28L32 14l22 14v26H10z" fill="#F6C56B"/><path d="M6 30L32 12l26 18" stroke="#E23B3B" stroke-width="5" fill="none" stroke-linejoin="round"/><rect x="27" y="40" width="10" height="14" fill="#8A5A2B"/><rect x="15" y="34" width="8" height="8" fill="#7CC8F5"/><rect x="41" y="34" width="8" height="8" fill="#7CC8F5"/><path d="M32 12V4h8v4h-8" fill="#1EA7F0" stroke="#1EA7F0" stroke-width="2"/>`,
  kitabu: `<path d="M32 18c-8-5-16-5-22-3v34c6-2 14-2 22 3z" fill="#1EA7F0"/><path d="M32 18c8-5 16-5 22-3v34c-6-2-14-2-22 3z" fill="#0FB394"/><path d="M32 18v34" stroke="#fff" stroke-width="2"/>`,
  jua: `<circle cx="32" cy="32" r="12" fill="#FFC20E"/><g stroke="#FFC20E" stroke-width="4" stroke-linecap="round"><path d="M32 8v6M32 50v6M8 32h6M50 32h6M15 15l4 4M45 45l4 4M49 15l-4 4M19 45l-4 4"/></g>`,
  nyumba: `<path d="M14 30L32 14l18 16v24H14z" fill="#F4E1C1"/><path d="M8 32L32 10l24 22" stroke="#C0573A" stroke-width="5" fill="none" stroke-linejoin="round"/><rect x="27" y="38" width="10" height="16" fill="#8A5A2B"/><rect x="18" y="34" width="7" height="7" fill="#7CC8F5"/>`,
  mpira: `<circle cx="32" cy="32" r="20" fill="#fff" stroke="#20232B" stroke-width="2"/><path d="M32 22l8 6-3 10H27l-3-10z" fill="#20232B"/><path d="M32 22v-10M40 28l9-4M37 38l6 8M27 38l-6 8M24 28l-9-4" stroke="#20232B" stroke-width="2"/>`,
  gari: `<path d="M8 38l6-12h28l10 12h4v10H8z" fill="#E23B3B"/><path d="M18 28h10v9H14zM31 28h9l7 9H31z" fill="#BFE6FB"/><circle cx="18" cy="48" r="6" fill="#20232B"/><circle cx="46" cy="48" r="6" fill="#20232B"/><circle cx="18" cy="48" r="2.5" fill="#C9D3E3"/><circle cx="46" cy="48" r="2.5" fill="#C9D3E3"/>`,
  kalamu: `<path d="M14 50l4-12 28-28 8 8-28 28z" fill="#FFC20E"/><path d="M46 10l8 8 4-4-8-8z" fill="#FF8FA3"/><path d="M14 50l4-12 8 8z" fill="#F4E1C1"/><path d="M14 50l2-5 3 3z" fill="#20232B"/>`,
  mkate: `<path d="M10 30c0-10 10-14 22-14s22 4 22 14v20H10z" fill="#D9A15B"/><path d="M14 30c0-7 8-10 18-10s18 3 18 10v16H14z" fill="#F3D9A4"/><path d="M22 26v4M32 24v4M42 26v4" stroke="#C98A42" stroke-width="2.5" stroke-linecap="round"/>`,
  /* mwili */
  kichwa: `<circle cx="32" cy="32" r="20" fill="#9B6B47"/><path d="M12 28c2-14 38-18 40 0-6-6-34-6-40 0z" fill="#2A1A12"/><circle cx="25" cy="33" r="2.5" fill="#1A1410"/><circle cx="39" cy="33" r="2.5" fill="#1A1410"/><path d="M26 42q6 5 12 0" stroke="#5A2E1A" stroke-width="2.5" fill="none" stroke-linecap="round"/>`,
  mkono: `<path d="M20 58V30c0-3 5-3 5 0v10V16c0-3 5-3 5 0v22V12c0-3 5-3 5 0v26V16c0-3 5-3 5 0v26l4-8c2-3 6-1 5 2l-6 14c-3 7-8 10-14 10h-4c-5 0-9-4-9-12z" fill="#9B6B47"/>`,
  mguu: `<path d="M24 8h12v32l14 8c4 2 3 8-2 8H24z" fill="#9B6B47"/><path d="M24 48h26" stroke="#7E5434" stroke-width="2"/>`,
  jicho: `<path d="M6 32c8-12 44-12 52 0-8 12-44 12-52 0z" fill="#fff" stroke="#5A3A24" stroke-width="2.5"/><circle cx="32" cy="32" r="10" fill="#6B4423"/><circle cx="32" cy="32" r="5" fill="#1A1410"/><circle cx="35" cy="29" r="2" fill="#fff"/>`,
  pua: `<path d="M32 12c-2 14-12 24-12 32 0 6 6 8 12 8s12-2 12-8c0-8-10-18-12-32z" fill="#9B6B47"/><ellipse cx="26" cy="46" rx="3" ry="2" fill="#5A3A24"/><ellipse cx="38" cy="46" rx="3" ry="2" fill="#5A3A24"/>`,
  mdomo: `<path d="M10 32c8-8 16-8 22-4 6-4 14-4 22 4-8 12-36 12-44 0z" fill="#D9475A"/><path d="M12 32c10 3 30 3 40 0" stroke="#A82E40" stroke-width="2"/>`,
  mti: `<rect x="28" y="36" width="8" height="20" rx="2" fill="#8A5A2B"/><circle cx="32" cy="26" r="16" fill="#3FA34D"/><circle cx="22" cy="32" r="10" fill="#4FB55A"/><circle cx="42" cy="32" r="10" fill="#4FB55A"/>`,
};

const _person = (skin, hair, shirt, opts = {}) => `<circle cx="32" cy="22" r="12" fill="${skin}"/>${opts.grey ? '<path d="M20 20c0-12 24-12 24 0-4-4-20-4-24 0z" fill="#D6D6D6"/>' : opts.long ? `<path d="M19 22c0-16 26-16 26 0v12h-5V22H24v12h-5z" fill="${hair}"/>` : `<path d="M20 19c1-11 23-11 24 0-5-4-19-4-24 0z" fill="${hair}"/>`}<circle cx="28" cy="23" r="1.6" fill="#1A1410"/><circle cx="36" cy="23" r="1.6" fill="#1A1410"/><path d="M28 28q4 3 8 0" stroke="#5A2E1A" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M14 58c0-14 8-22 18-22s18 8 18 22z" fill="${shirt}"/>${opts.glasses ? '<g fill="none" stroke="#3A2A1A" stroke-width="1.6"><circle cx="28" cy="23" r="3.5"/><circle cx="36" cy="23" r="3.5"/><path d="M31.5 23h1"/></g>' : ''}`;
Object.assign(PICS, {
  mama: _person('#9B6B47', '#2A1A12', '#E0476B', { long: true }),
  baba: _person('#8A5C3C', '#1A1410', '#1EA7F0'),
  kaka: _person('#9B6B47', '#1A1410', '#0FB394'),
  dada: _person('#A8774F', '#2A1A12', '#FFC20E', { long: true }),
  bibi: _person('#8A5C3C', '#D6D6D6', '#7B61FF', { grey: true, glasses: true }),
  babu: _person('#7E5434', '#D6D6D6', '#3A4D80', { grey: true, glasses: true }),
});

/* rangi: duara la rangi hiyo */
const PIC_COLORS = { nyekundu: '#F65B4F', red: '#F65B4F', bluu: '#1EA7F0', blue: '#1EA7F0', njano: '#FFC20E', yellow: '#FFC20E', kijani: '#0FB394', green: '#0FB394',
  zambarau: '#7B61FF', purple: '#7B61FF', nyeusi: '#20232B', black: '#20232B', nyeupe: '#FFFFFF', white: '#FFFFFF' };
/* namba: vitone vya kuhesabu */
const PIC_NUMS = { moja: 1, one: 1, mbili: 2, two: 2, tatu: 3, three: 3, nne: 4, four: 4, tano: 5, five: 5, sita: 6, six: 6, saba: 7, seven: 7, nane: 8, eight: 8, tisa: 9, nine: 9, kumi: 10, ten: 10 };
function _numDots(n) {
  const cols = n > 6 ? 5 : n > 4 ? 3 : n > 2 ? 2 : n, rows = Math.ceil(n / cols), gap = Math.min(18, 56 / Math.max(cols, rows));
  const x0 = 32 - (cols * gap) / 2 + gap / 2, y0 = 32 - (rows * gap) / 2 + gap / 2;
  return Array.from({ length: n }, (_, i) => `<circle cx="${x0 + (i % cols) * gap}" cy="${y0 + Math.floor(i / cols) * gap}" r="${gap / 2 - 1.5}" fill="${['#F65B4F', '#1EA7F0', '#FFC20E', '#0FB394', '#7B61FF'][i % 5]}"/>`).join('');
}

const PIC_ALIAS = {
  mango: 'embe', orange: 'chungwa', banana: 'ndizi', pineapple: 'nanasi', watermelon: 'tikiti', avocado: 'parachichi',
  lime: 'ndimu', limau: 'ndimu', lemon: 'ndimu', apple: 'tufaha', tomato: 'nyanya', carrot: 'karoti', onion: 'kitunguu',
  water: 'maji', tea: 'chai', 'majani ya chai': 'chai', 'tea leaves': 'chai', milk: 'maziwa', sugar: 'sukari', flour: 'unga', oil: 'mafuta', salt: 'chumvi',
  rice: 'mchele', wali: 'mchele', soap: 'sabuni', sand: 'mchanga', candy: 'pipi',
  school: 'shule', book: 'kitabu', sun: 'jua', house: 'nyumba', ball: 'mpira', car: 'gari', pen: 'kalamu', tree: 'mti',
  bread: 'mkate', head: 'kichwa', hand: 'mkono', leg: 'mguu', eye: 'jicho', nose: 'pua', mouth: 'mdomo',
  mother: 'mama', father: 'baba', brother: 'kaka', sister: 'dada', grandmother: 'bibi', grandfather: 'babu',
  elephant: 'tembo', lion: 'simba', giraffe: 'twiga', cat: 'paka', dog: 'mbwa', fish: 'samaki', bird: 'ndege', chicken: 'kuku',
};

function pic(word, size = 56) {
  if (!word) return '';
  let k = String(word).trim().toLowerCase();
  k = PIC_ALIAS[k] || k;
  if (PIC_COLORS[k]) return `<span class="pic" style="--pic:${size}px"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="${PIC_COLORS[k]}" stroke="#D5DCE8" stroke-width="2"/>${_shine(24, 24, 5, 7)}</svg></span>`;
  if (PIC_NUMS[k]) return `<span class="pic" style="--pic:${size}px"><svg viewBox="0 0 64 64">${_numDots(PIC_NUMS[k])}</svg></span>`;
  if (PICS[k]) return `<span class="pic" style="--pic:${size}px"><svg viewBox="0 0 64 64">${PICS[k]}</svg></span>`;
  const an = typeof ANIMALS !== 'undefined' && ANIMALS[k.charAt(0).toUpperCase() + k.slice(1)];
  if (an) return `<span class="pic" style="--pic:${size}px">${an()}</span>`;
  return '';
}
const hasPic = w => !!pic(w);

function picLabel(word, size = 48, label = word) {
  const p = pic(word, size);
  return p ? `<span class="pic-label">${p}<span>${esc(label)}</span></span>` : esc(label);
}
