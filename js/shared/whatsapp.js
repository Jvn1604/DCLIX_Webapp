/* ==========================================================
   Floating WhatsApp chat widget (bottom-right on public pages).
   Step 1: greeting + agent  ->  Step 2: "Start chat" opens WhatsApp.
   >>> Put the sales WhatsApp number in NUMBER below
       (country code + number, digits only, e.g. '60123456789').
   Until a number is set, "Start chat" falls back to the contact form.
   ========================================================== */
(function () {
  'use strict';
  var NUMBER = '60182809057';                 // e.g. '60123456789'  <-- SET THIS
  var AGENT = 'Harith';
  var ROLE = 'Sales Team';
  var GREETING = 'Hi D-Clix, I would like to know more about the club management system.';

  // Site root, so links and images work from pages inside arena/ too
  var me = document.currentScript && document.currentScript.src;
  var root = me ? me.replace(/js\/shared\/whatsapp\.js(\?.*)?$/, '') : '';
  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true" class="wa-logo"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.22 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>';
  var WAVE = '<svg class="wa-wave" viewBox="0 0 340 24" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8 C60 26 110 0 180 10 C240 19 290 4 340 12 L340 24 L0 24 Z"/></svg>';
  var AV = '<span class="wa-av"><img src="' + root + 'assets/dclix-logo.png" alt="" />' + WA + '</span>';
  var WHO = '<span class="wa-who"><b>' + AGENT + '</b><small>' + ROLE + '</small></span>';

  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.wa-widget')) return;
    var w = document.createElement('div'); w.className = 'wa-widget';
    var startBtn = NUMBER
      ? '<a class="wa-start" href="https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(GREETING) + '" target="_blank" rel="noopener">Start chat</a>'
      : '<a class="wa-start" href="' + root + 'index.html#contact">Leave your details</a>';
    w.innerHTML =
      '<div class="wa-pop" role="dialog" aria-label="Chat with us on WhatsApp" hidden>' +
        '<div class="wa-view" data-v="1">' +
          '<div class="wa-head"><button type="button" class="wa-x" aria-label="Close chat">&times;</button>' +
            '<b class="wa-hey">Hey 👋</b><p>Welcome to WhatsApp Chat and Share. Feel free to ask us anything 💫</p><small>We typically reply within a few minutes</small>' + WAVE + '</div>' +
          '<div class="wa-body"><button type="button" class="wa-agent" data-wa-next>' + AV + WHO + '</button></div>' +
        '</div>' +
        '<div class="wa-view" data-v="2" hidden>' +
          '<div class="wa-head slim"><button type="button" class="wa-back" aria-label="Back">&#8249;</button>' + AV + WHO +
            '<button type="button" class="wa-x" aria-label="Close chat">&times;</button>' + WAVE + '</div>' +
          '<div class="wa-body wa-chat"><div class="wa-bubble">We typically reply within a few minutes</div></div>' +
          '<div class="wa-foot">' + startBtn + '</div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="wa-fab" aria-label="Chat with us on WhatsApp" aria-expanded="false">' + WA + '</button>';
    document.body.appendChild(w);

    var pop = w.querySelector('.wa-pop'), fab = w.querySelector('.wa-fab');
    var v1 = w.querySelector('[data-v="1"]'), v2 = w.querySelector('[data-v="2"]');
    function view(n) { v1.hidden = n !== 1; v2.hidden = n !== 2; var f = (n === 1 ? v1 : v2).querySelector('.wa-agent, .wa-start'); if (f) f.focus(); }
    function toggle(open) {
      pop.hidden = !open; fab.setAttribute('aria-expanded', String(open));
      if (open) view(1);
    }
    fab.addEventListener('click', function () { toggle(pop.hidden); });
    $all('.wa-x').forEach(function (b) { b.addEventListener('click', function () { toggle(false); fab.focus(); }); });
    w.querySelector('[data-wa-next]').addEventListener('click', function () { view(2); });
    w.querySelector('.wa-back').addEventListener('click', function () { view(1); });
    w.querySelector('.wa-start').addEventListener('click', function () { if (NUMBER) setTimeout(function () { toggle(false); }, 150); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { toggle(false); fab.focus(); } });
    // any button with data-whatsapp-open (e.g. Community page) opens the same popup
    document.addEventListener('click', function (e) { if (e.target.closest('[data-whatsapp-open]')) { e.preventDefault(); toggle(true); } });
    function $all(s) { return Array.prototype.slice.call(w.querySelectorAll(s)); }
  });
})();
