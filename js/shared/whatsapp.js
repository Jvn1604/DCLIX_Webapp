/* ==========================================================
   Floating WhatsApp chat widget (bottom-right on public pages).
   One panel: a short greeting that "types" in, quick topics that
   open WhatsApp with the question already written, and a big
   "Chat on WhatsApp" button.
   >>> Put the sales WhatsApp number in NUMBER below
       (country code + number, digits only, e.g. '60123456789').
   Until a number is set, the buttons go to the contact page.
   ========================================================== */
(function () {
  'use strict';
  var NUMBER = '60182809057';                 // e.g. '60123456789'  <-- SET THIS
  var AGENT = 'Harith';
  var TEAM = 'D-Clix Sales Team';
  var GREETING = 'Hi D-Clix, I would like to know more about the club management system.';
  // quick topics: [button text, message written for the visitor in WhatsApp]
  var TOPICS = [
    ['Book a free demo', 'Hi D-Clix, I would like to book a free demo for my club.'],
    ['Which plan suits my club?', 'Hi D-Clix, which plan would suit my club?'],
    ['How do online fee payments work?', 'Hi D-Clix, how do online fee payments work?'],
    ['Something else', GREETING]
  ];

  // Site root, so links and images work from pages inside arena/ too
  var me = document.currentScript && document.currentScript.src;
  var root = me ? me.replace(/js\/shared\/whatsapp\.js(\?.*)?$/, '') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '<svg viewBox="0 0 24 24" aria-hidden="true" class="wa-logo"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.22 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true" class="wa-arrow"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function link(text) { return NUMBER ? 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(text) : root + 'contact.html'; }
  function ext() { return NUMBER ? ' target="_blank" rel="noopener noreferrer"' : ''; }
  function now() { var d = new Date(); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }

  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.wa-widget')) return;
    var w = document.createElement('div'); w.className = 'wa-widget';
    w.innerHTML =
      '<div class="wa-pop" role="dialog" aria-label="Chat with us on WhatsApp" hidden>' +
        '<div class="wa-top">' +
          '<span class="wa-aurora" aria-hidden="true"></span>' +
          '<span class="wa-av"><img src="' + root + 'assets/dclix-logo.webp" alt="" /><i class="wa-online" aria-hidden="true"></i></span>' +
          '<span class="wa-who"><b>' + TEAM + '</b><small><i class="wa-dot" aria-hidden="true"></i>' + AGENT + ' · We typically reply within a few minutes</small></span>' +
          '<button type="button" class="wa-x" aria-label="Close chat"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></button>' +
        '</div>' +
        '<div class="wa-thread" aria-live="polite">' +
          '<span class="wa-day">Today</span>' +
          '<div class="wa-typing" aria-hidden="true"><i></i><i></i><i></i></div>' +
          '<div class="wa-msg" hidden><b class="wa-from">' + AGENT + '</b><p>Hey there 👋 I\'m ' + AGENT + ' from the D-Clix sales team.</p><time>' + now() + '</time></div>' +
          '<div class="wa-msg" hidden><p>Ask me anything about running your club with D-Clix, or pick a topic below.</p><time>' + now() + '</time></div>' +
          '<div class="wa-topics" hidden>' + TOPICS.map(function (t) { return '<a class="wa-chip" href="' + link(t[1]) + '"' + ext() + '><span>' + t[0] + '</span>' + ARROW + '</a>'; }).join('') + '</div>' +
        '</div>' +
        '<div class="wa-foot">' +
          '<a class="wa-start" href="' + link(GREETING) + '"' + ext() + '>' + WA + '<span>' + (NUMBER ? 'Chat on WhatsApp' : 'Leave your details') + '</span></a>' +
          '<small>' + (NUMBER ? 'Opens WhatsApp on your phone or computer' : 'We will get back to you soon') + '</small>' +
        '</div>' +
      '</div>' +
      '<div class="wa-tease" hidden><button type="button" class="wa-tease-open">Questions? <b>Chat with us</b></button><button type="button" class="wa-tease-x" aria-label="Hide">&times;</button></div>' +
      '<button type="button" class="wa-fab" aria-label="Chat with us on WhatsApp" aria-expanded="false">' + WA + '</button>';
    document.body.appendChild(w);

    var pop = w.querySelector('.wa-pop'), fab = w.querySelector('.wa-fab'), tease = w.querySelector('.wa-tease');
    var typing = w.querySelector('.wa-typing'), steps = $all('.wa-msg').concat($all('.wa-topics')), played = false, timers = [];

    // the greeting "types" in the first time the panel opens
    function play() {
      if (played || reduce) { typing.hidden = true; steps.forEach(function (s) { s.hidden = false; }); played = true; return; }
      played = true;
      steps.forEach(function (s) { s.hidden = true; });
      typing.hidden = false;
      [700, 1500, 2000].forEach(function (t, i) {
        timers.push(setTimeout(function () {
          steps[i].hidden = false;
          if (i === 0) { typing.hidden = true; if (steps[1]) { typing.hidden = false; w.querySelector('.wa-thread').insertBefore(typing, steps[1]); } }
          if (i === 1) typing.hidden = true;
        }, t));
      });
    }
    function toggle(open) {
      pop.hidden = !open; fab.setAttribute('aria-expanded', String(open));
      w.classList.toggle('open', open);
      if (open) { hideTease(); play(); setTimeout(function () { var f = w.querySelector('.wa-start'); if (f) f.focus({ preventScroll: true }); }, 50); }
    }
    fab.addEventListener('click', function () { toggle(pop.hidden); });
    w.querySelector('.wa-x').addEventListener('click', function () { toggle(false); fab.focus(); });
    $all('.wa-chip, .wa-start').forEach(function (a) { a.addEventListener('click', function () { if (NUMBER) setTimeout(function () { toggle(false); }, 150); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { toggle(false); fab.focus(); } });
    // any button with data-whatsapp-open (e.g. Community page) opens the same panel
    document.addEventListener('click', function (e) { if (e.target.closest('[data-whatsapp-open]')) { e.preventDefault(); toggle(true); } });

    // a small "Questions?" bubble next to the button, once per visit, after a while on the page
    var seen = false; try { seen = sessionStorage.getItem('wa-tease') === '1'; } catch (e) {}
    function hideTease() { tease.hidden = true; try { sessionStorage.setItem('wa-tease', '1'); } catch (e) {} }
    if (!seen) setTimeout(function () { if (pop.hidden) tease.hidden = false; }, 12000);
    w.querySelector('.wa-tease-open').addEventListener('click', function () { toggle(true); });
    w.querySelector('.wa-tease-x').addEventListener('click', hideTease);

    function $all(s) { return Array.prototype.slice.call(w.querySelectorAll(s)); }
  });
})();
