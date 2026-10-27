/* ==========================================================
   Language switcher: English / Bahasa Melayu
   Adds an "EN / BM" menu to the top bar and translates the
   public pages in place. Translations are matched on the exact
   English text, so if you change English wording on a page,
   update the same line in i18n-bm.js too. Text without a translation
   simply stays in English (the competition portal and the
   admin portal are English only).
   Wording follows d-clix.com/ms where that page has it.
   ========================================================== */
(function () {
  'use strict';
  var KEY = 'dclix_lang';
  // The word list lives in i18n-bm.js and is fetched only when BM is used
  var BM = window.DCLIX_BM || null, bmWait = [];
  var BM_SRC = ((document.currentScript && document.currentScript.src) || '').replace(/i18n\.js(\?.*)?$/, 'i18n-bm.js$1');
  function needBM(cb) {
    if (BM) { cb(); return; }
    bmWait.push(cb);
    if (bmWait.length > 1) return;
    var sc = document.createElement('script');
    sc.src = BM_SRC;
    sc.onload = function () { BM = window.DCLIX_BM || {}; bmWait.splice(0).forEach(function (f) { f(); }); };
    sc.onerror = function () { bmWait = []; };
    document.head.appendChild(sc);
  }

  var lang = 'en';
  try { lang = localStorage.getItem(KEY) || ((navigator.language || '').toLowerCase().indexOf('ms') === 0 ? 'ms' : 'en'); } catch (e) {}
  if (lang === 'ms') needBM(function () {});
  var original = new WeakMap(); // text node → its English text
  var ATTRS = ['placeholder', 'aria-label', 'title', 'label'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  function norm(t) { return t.replace(/\s+/g, ' ').trim(); }

  function doText(node) {
    if (!original.has(node)) original.set(node, node.nodeValue);
    var en = original.get(node), key = norm(en);
    if (!key) return;
    var bm = lang === 'ms' && BM ? BM[key] : null;
    // Optional: a data-bm="…" on the element holding this text gives its Malay right in the page
    // (used for the first piece of text in that element), so the word list file need not be edited
    if (lang === 'ms') {
      var pe = node.parentNode;
      if (pe && pe.nodeType === 1 && pe.hasAttribute('data-bm')) {
        var c = pe.firstChild; while (c && !(c.nodeType === 3 && norm(original.has(c) ? original.get(c) : c.nodeValue))) c = c.nextSibling;
        if (c === node) bm = pe.getAttribute('data-bm');
      }
    }
    // keep the surrounding spaces so words next to links/icons stay separated
    var want = bm ? en.match(/^\s*/)[0] + bm + en.match(/\s*$/)[0] : en;
    if (node.nodeValue !== want) node.nodeValue = want;
  }
  function doAttrs(el) {
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var store = 'data-en-' + a;
      if (!el.hasAttribute(store)) el.setAttribute(store, el.getAttribute(a));
      var en = el.getAttribute(store), bm = BM ? BM[norm(en)] : null;
      el.setAttribute(a, lang === 'ms' && bm ? bm : en);
    });
  }
  function walk(root) {
    if (!root || (root.nodeType === 1 && (SKIP[root.tagName] || root.closest('[data-no-i18n]')))) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType === 1) doAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) { return n.nodeType === 1 && (SKIP[n.tagName] || n.hasAttribute('data-no-i18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var n; while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function apply() {
    if (lang === 'ms' && !BM) { needBM(apply); return; }
    document.documentElement.lang = lang === 'ms' ? 'ms' : 'en';
    walk(document.body);
    $$('[data-lang-label]').forEach(function (b) { b.textContent = lang === 'ms' ? 'BM' : 'EN'; });
    $$('[data-lang-pick]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-lang-pick') === lang)); });
  }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function switcher() {
    var w = document.createElement('div'); w.className = 'lang-switch';
    w.innerHTML = '<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Language"><i data-icon="globe" class="w-4"></i><span data-lang-label>EN</span></button>' +
      '<div class="lang-menu" role="menu" hidden><button type="button" role="menuitemradio" data-lang-pick="en">English</button><button type="button" role="menuitemradio" data-lang-pick="ms">Bahasa Melayu</button></div>';
    w.setAttribute('data-no-i18n', '');
    return w;
  }
  function setLang(l) { lang = l; try { localStorage.setItem(KEY, l); } catch (e) {} apply(); }
  window.dclixSetLang = setLang;

  document.addEventListener('DOMContentLoaded', function () {
    // one switcher in the desktop menu and one next to the mobile menu button
    $$('.nav-links, .nav-mobile-actions').forEach(function (bar) {
      var theme = bar.querySelector('[data-theme-toggle]');
      var sw = switcher();
      if (theme) bar.insertBefore(sw, theme); else bar.appendChild(sw);
    });
    if (window.hydrateIcons) window.hydrateIcons();
    document.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-lang-pick]');
      if (pick) { setLang(pick.getAttribute('data-lang-pick')); }
      var btn = e.target.closest('.lang-btn');
      $$('.lang-switch').forEach(function (s) {
        var open = btn && s.contains(btn) && s.querySelector('.lang-menu').hidden;
        s.querySelector('.lang-menu').hidden = !open; s.querySelector('.lang-btn').setAttribute('aria-expanded', String(!!open));
      });
    });
    apply();
    // text added later (pricing cards, slides, FAQ answers, chat popup…) is translated as it appears
    new MutationObserver(function (list) {
      if (lang !== 'ms' || !BM) return;
      list.forEach(function (m) { m.addedNodes.forEach(walk); });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
