/* English UI support for older labels and saved records. */

const I18N = Object.freeze({ lang: 'en', locale: () => 'en-GB' });

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

  if (/^[a-z]+$/.test(core)) { const cap = I18N_EXACT.get(core[0].toUpperCase() + core.slice(1)); if (cap != null && !/\s/.test(cap)) return lead + cap.toLowerCase() + trail; }
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

new MutationObserver(list => {
  if (I18N.lang !== 'sw') list.forEach(m => {
    if (m.type === 'characterData') i18nNode(m.target);
    else if (m.type === 'attributes') i18nNode(m.target);
    else m.addedNodes.forEach(i18nNode);
  });
  enhancePasswords(document.getElementById('app'));
}).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: I18N_ATTRS });

const _speakI18n = speak;
speak = function (text) { return _speakI18n(T(text), 'en'); };
['fillText', 'strokeText'].forEach(fn => {
  const orig = CanvasRenderingContext2D.prototype[fn];
  CanvasRenderingContext2D.prototype[fn] = function (text, ...rest) { return orig.call(this, I18N.lang === 'en' ? T(text) : text, ...rest); };
});
const _toLD = Date.prototype.toLocaleDateString, _toLS = Date.prototype.toLocaleString;
Date.prototype.toLocaleDateString = function (loc, o) { return _toLD.call(this, loc === 'sw-TZ' ? I18N.locale() : loc, o); };
Date.prototype.toLocaleString = function (loc, o) { return _toLS.call(this, loc === 'sw-TZ' ? I18N.locale() : loc, o); };

document.documentElement.lang = I18N.lang;
