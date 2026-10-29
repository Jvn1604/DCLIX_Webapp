/* ==========================================================
   Video testimonials: portrait carousel (home page).
   - The centre video plays (muted at first); when it ends the next one slides in and plays.
   - Swipe / drag, arrow buttons, dots, side-card click and ← → keys all move between videos.
   - Tap the centre video to pause or play; the speaker button turns sound on.
   - Videos only play while the section is on screen. Add more slides in index.html and they work automatically.
   ========================================================== */
(function () {
  'use strict';
  var root = document.getElementById('vtCarousel');
  if (!root) return;
  var track = root.querySelector('.vt-track');
  var cards = [].slice.call(root.querySelectorAll('.vt-card'));
  var dots = [].slice.call(root.querySelectorAll('.vt-dot'));
  var n = cards.length, cur = 0, soundOn = false, visible = false, userPaused = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function vid(i) { return cards[i].querySelector('video'); }
  function wrap(i) { return (i % n + n) % n; }

  function load(i) {
    var v = vid(i);
    if (v && !v.getAttribute('src') && v.dataset.src) { v.src = v.dataset.src; v.load(); }
  }
  function setBar(i, ratio) { var b = cards[i].querySelector('.vt-bar i'); if (b) b.style.transform = 'scaleX(' + ratio + ')'; }

  function layout() {
    cards.forEach(function (c, i) {
      var d = i - cur;
      if (d > n / 2) d -= n; if (d < -n / 2) d += n;   // shortest way round
      c.dataset.pos = Math.max(-2, Math.min(2, d));
      c.setAttribute('aria-hidden', d === 0 ? 'false' : 'true');
      var isCur = d === 0;
      c.querySelectorAll('button').forEach(function (b) { b.tabIndex = isCur ? 0 : -1; });
    });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === cur); d.setAttribute('aria-current', i === cur ? 'true' : 'false'); });
  }

  function stopOthers() {
    cards.forEach(function (c, i) {
      if (i === cur) return;
      var v = vid(i); if (!v.paused) v.pause();
      try { v.currentTime = 0; } catch (e) {}
      c.classList.remove('playing'); setBar(i, 0);
    });
  }

  function play() {
    var v = vid(cur); load(cur); load(wrap(cur + 1));
    v.muted = !soundOn;
    if (!visible || userPaused || reduce) return;
    var p = v.play();
    if (p && p.catch) p.catch(function () { cards[cur].classList.remove('playing'); });
  }

  function go(i, byUser) {
    var next = wrap(i);
    if (next === cur && byUser !== 'force') return;
    cur = next; userPaused = false;
    layout(); stopOthers();
    var v = vid(cur);
    try { v.currentTime = 0; } catch (e) {}
    setTimeout(play, 250);
  }

  cards.forEach(function (c, i) {
    var v = vid(i);
    v.addEventListener('play', function () { c.classList.add('playing'); });
    v.addEventListener('pause', function () { c.classList.remove('playing'); });
    v.addEventListener('timeupdate', function () { if (v.duration) setBar(i, v.currentTime / v.duration); });
    v.addEventListener('ended', function () { if (i === cur) go(cur + 1); });
    v.addEventListener('error', function () { if (i === cur && v.getAttribute('src')) setTimeout(function () { go(cur + 1); }, 1500); });
    c.querySelector('.vt-play').addEventListener('click', function (e) { e.stopPropagation(); toggle(); });
    c.querySelector('.vt-mute').addEventListener('click', function (e) {
      e.stopPropagation(); soundOn = !soundOn;
      root.querySelectorAll('.vt-mute').forEach(function (b) { b.setAttribute('aria-pressed', soundOn); });
      vid(cur).muted = !soundOn;
    });
  });

  function toggle() {
    var v = vid(cur);
    if (v.paused) { userPaused = false; load(cur); v.muted = !soundOn; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
    else { userPaused = true; v.pause(); }
  }

  root.querySelector('.vt-nav.prev').addEventListener('click', function () { go(cur - 1, true); });
  root.querySelector('.vt-nav.next').addEventListener('click', function () { go(cur + 1, true); });
  dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i, true); }); });
  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { go(cur - 1, true); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { go(cur + 1, true); e.preventDefault(); }
  });

  /* swipe / drag; a plain tap on a side card brings it to the centre, a tap on the centre card plays or pauses */
  var sx = 0, sy = 0, dx = 0, down = false, moved = false;
  track.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    down = true; moved = false; sx = e.clientX; sy = e.clientY; dx = 0;
  });
  track.addEventListener('pointermove', function (e) {
    if (!down) return;
    dx = e.clientX - sx;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - sy)) { moved = true; track.classList.add('drag'); }
  });
  function end(e) {
    if (!down) return; down = false; track.classList.remove('drag');
    if (moved && Math.abs(dx) > 40) { go(cur + (dx < 0 ? 1 : -1), true); return; }
    if (moved) return;
    var c = e.target.closest && e.target.closest('.vt-card');
    if (!c || e.target.closest('button')) return;
    var i = cards.indexOf(c);
    if (i === cur) toggle(); else go(i, true);
  }
  track.addEventListener('pointerup', end);
  track.addEventListener('pointercancel', function () { down = false; track.classList.remove('drag'); });

  /* only play while visible */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { load(cur); play(); } else { var v = vid(cur); if (!v.paused) v.pause(); }
    }, { threshold: 0.45 }).observe(root);
  } else { visible = true; }
  document.addEventListener('visibilitychange', function () { if (document.hidden) { var v = vid(cur); if (!v.paused) v.pause(); } else play(); });

  layout(); load(cur);
})();
