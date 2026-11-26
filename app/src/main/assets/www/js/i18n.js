/* HUGO KID - i18n.js : lugha ya programu (Kiswahili / English) */

const I18N = {
  lang: (() => {
    try { const v = localStorage.getItem('hk_uilang'); if (v === 'sw' || v === 'en') return v; } catch (e) {}
    return /^sw/i.test(navigator.language || '') ? 'sw' : 'en';
  })(),
  locale() { return this.lang === 'en' ? 'en-GB' : 'sw-TZ'; },
  set(lang) {
    this.lang = lang;
    try { localStorage.setItem('hk_uilang', lang); } catch (e) {}
    document.documentElement.lang = lang;
    HK.render();
  },
};

/* kamusi: maneno kamili, na mifumo yenye {0} kwa maandishi yanayobadilika */
const I18N_EXACT = new Map();
const I18N_PATTERNS = [];
(() => {
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  Object.entries(I18N_EN).forEach(([sw, en]) => {
    if (!/\{\d+\}/.test(sw)) { I18N_EXACT.set(norm(sw), en); return; }
    const order = [];
    const src = norm(sw).split(/(\{\d+\})/).map(part => {
      const m = part.match(/^\{(\d+)\}$/);
      if (m) { order.push(+m[1]); return '(.*?)'; }
      return reEsc(part);
    }).join('');
    const fixed = sw.replace(/\{\d+\}/g, '').replace(/\s/g, '').length;
    if (fixed < 3) return;
    I18N_PATTERNS.push({ re: new RegExp('^' + src + '$', 's'), order, en, fixed });
  });
  I18N_PATTERNS.sort((a, b) => b.fixed - a.fixed);
})();

const _trCache = new Map();
function T(s) {
  if (I18N.lang === 'sw' || s == null) return s;
  s = String(s);
  if (!/[a-z]/i.test(s)) return s;
  if (_trCache.has(s)) return _trCache.get(s);
  const out = _translate(s, 0);
  if (_trCache.size > 4000) _trCache.clear();
  _trCache.set(s, out);
  return out;
}
function _translate(s, depth) {
  const lead = s.match(/^\s*/)[0], trail = s.match(/\s*$/)[0];
  const core = s.replace(/\s+/g, ' ').trim();
  if (!core) return s;
  const hit = I18N_EXACT.get(core);
  if (hit != null) return lead + hit + trail;
  if (depth < 3) {
    for (const p of I18N_PATTERNS) {
      const m = core.match(p.re);
      if (!m) continue;
      const vals = {};
      p.order.forEach((n, i) => { vals[n] = _translate(m[i + 1], depth + 1); });
      return lead + p.en.replace(/\{(\d+)\}/g, (_, n) => vals[n] ?? '') + trail;
    }
    /* sentensi kadhaa zilizounganishwa */
    const parts = core.split(/(?<=[.!?:])\s+/);
    if (parts.length > 1) {
      const tr = parts.map(x => _translate(x, depth + 1));
      if (tr.some((x, i) => x !== parts[i])) return lead + tr.join(' ') + trail;
    }
  }
  return s;
}

/* majina ya watu (mf. mtoto anaitwa Zawadi au Imani) yasitafsiriwe */
function i18nIsName(v) {
  const k = String(v).trim();
  if (!k || k.length > 40) return false;
  try {
    if (Store.children().some(c => c.name === k)) return true;
    const p = Store.parent(); if (p && p.name === k) return true;
    const u = Net.user(); if (u && u.name === k) return true;
  } catch (e) {}
  return false;
}

/* tafsiri ukurasa wenyewe (maandishi na alama za fomu) */
const I18N_ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
function i18nNode(node) {
  if (I18N.lang === 'sw') return;
  if (node.nodeType === 3) {
    const p = node.parentNode;
    if (!p || p.closest && p.closest('script,style,textarea,.notr,[contenteditable]')) return;
    const v = node.nodeValue;
    if (i18nIsName(v)) return;
    const t = T(v);
    if (t !== v) node.nodeValue = t;
    return;
  }
  if (node.nodeType !== 1 || node.matches('script,style,.notr')) return;
  I18N_ATTRS.forEach(a => {
    if (node.hasAttribute(a)) { const v = node.getAttribute(a), t = T(v); if (t !== v) node.setAttribute(a, t); }
  });
  if (node.tagName === 'INPUT' && /^(button|submit)$/i.test(node.type) && node.value) node.value = T(node.value);
  const w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n = w.nextNode();
  while (n) {
    if (n.nodeType === 3) i18nNode(n);
    else if (!n.matches('script,style,.notr')) I18N_ATTRS.forEach(a => {
      if (n.hasAttribute(a)) { const v = n.getAttribute(a), t = T(v); if (t !== v) n.setAttribute(a, t); }
    });
    n = w.nextNode();
  }
}

/* kitufe cha lugha kwenye skrini za mzazi, shule na kuingia */
const I18N_SCREENS = ['welcome', 'acctAuth', 'terms', 'pin', 'changePass', 'parentHome', 'pickChild', 'childForm', 'schoolHome', 'superHome'];
function i18nSwitch() {
  const top = HK.stack[HK.stack.length - 1];
  const scr = $('#app > .screen');
  if (!scr || !top || !I18N_SCREENS.includes(top.name) || $('.lang-switch', scr)) return;
  const b = document.createElement('div');
  b.className = 'lang-switch notr';
  b.innerHTML = `<button data-l="sw" class="${I18N.lang === 'sw' ? 'on' : ''}">SW</button><button data-l="en" class="${I18N.lang === 'en' ? 'on' : ''}">EN</button>`;
  b.onclick = e => { const l = e.target.dataset && e.target.dataset.l; if (l && l !== I18N.lang) { Sfx.tap(); I18N.set(l); } };
  const bar = $('.topbar', scr);
  if (bar) { b.classList.add('in-bar'); bar.appendChild(b); } else scr.appendChild(b);
}

new MutationObserver(list => {
  if (I18N.lang !== 'sw') list.forEach(m => {
    if (m.type === 'characterData') i18nNode(m.target);
    else if (m.type === 'attributes') i18nNode(m.target);
    else m.addedNodes.forEach(i18nNode);
  });
  i18nSwitch();
}).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });

/* sauti, michoro ya canvas na tarehe zifuate lugha */
const _speakI18n = speak;
speak = function (text, lang) {
  if (lang === 'sw-raw') return _speakI18n(text, 'sw');
  if (I18N.lang === 'en' && (!lang || lang === 'sw')) {
    const t = T(text);
    if (t !== text || !lang) return _speakI18n(t, 'en');
  }
  return _speakI18n(text, lang);
};
['fillText', 'strokeText'].forEach(fn => {
  const orig = CanvasRenderingContext2D.prototype[fn];
  CanvasRenderingContext2D.prototype[fn] = function (text, ...rest) { return orig.call(this, I18N.lang === 'en' ? T(text) : text, ...rest); };
});
const _toLD = Date.prototype.toLocaleDateString, _toLS = Date.prototype.toLocaleString;
Date.prototype.toLocaleDateString = function (loc, o) { return _toLD.call(this, loc === 'sw-TZ' ? I18N.locale() : loc, o); };
Date.prototype.toLocaleString = function (loc, o) { return _toLS.call(this, loc === 'sw-TZ' ? I18N.locale() : loc, o); };

document.documentElement.lang = I18N.lang;
