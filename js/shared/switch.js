/* ==========================================================
   Home page "Why clubs switch" section (#tour)
   - Chapter rail: tabs with arrow-key support and Back / Next
   - Calculator: works out hours and cash from the visitor's own
     numbers (nothing is sent anywhere)
   ========================================================== */
(function () {
  'use strict';
  var box = document.querySelector('[data-switch]');
  if (!box) return;
  var tabs = [].slice.call(box.querySelectorAll('[role=tab]'));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
  var rail = box.querySelector('.sw-rail');
  var cur = document.getElementById('sw-cur');
  var idx = 0;

  function show(i, focus) {
    idx = (i + tabs.length) % tabs.length;
    tabs.forEach(function (t, k) {
      var on = k === idx;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (panels[k]) panels[k].hidden = !on;
    });
    rail.style.setProperty('--p', String(idx / (tabs.length - 1) * 100));
    if (cur) cur.textContent = String(idx + 1);
    if (focus) tabs[idx].focus();
    var t = tabs[idx];
    if (rail.scrollWidth > rail.clientWidth && t.scrollIntoView) t.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  tabs.forEach(function (t, k) {
    t.addEventListener('click', function () { show(k); });
    t.addEventListener('keydown', function (e) {
      var d = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : (e.key === 'ArrowUp' || e.key === 'ArrowLeft') ? -1 : 0;
      if (e.key === 'Home') { e.preventDefault(); show(0, true); return; }
      if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); return; }
      if (!d) return;
      e.preventDefault(); show(k + d, true);
    });
  });
  [].forEach.call(box.querySelectorAll('[data-sw]'), function (b) {
    b.addEventListener('click', function () { show(idx + Number(b.getAttribute('data-sw'))); });
  });

  /* ----- calculator ----- */
  var S = document.getElementById('sw-s'), F = document.getElementById('sw-f'), M = document.getElementById('sw-m'),
      U = document.getElementById('sw-u'), P = document.getElementById('sw-p');
  if (S && F && M && U && P) {
    var rm = function (n) { return 'RM ' + Math.round(n).toLocaleString('en-MY'); };
    var put = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    var calc = function () {
      var s = +S.value, f = +F.value, m = +M.value, u = +U.value, p = +P.value;
      var hrs = s * m / 60;
      put('swo-s', s); put('swo-f', rm(f)); put('swo-m', m); put('swo-u', u + '%'); put('swo-p', p + '%');
      put('sw-r-bill', rm(s * f)); put('sw-r-due', rm(s * f * u / 100));
      put('sw-r-hrs', hrs.toFixed(1)); put('sw-r-back', (hrs * p / 100).toFixed(1));
    };
    [S, F, M, U, P].forEach(function (el) { el.addEventListener('input', calc); });
    calc();
  }
  show(0);
})();
