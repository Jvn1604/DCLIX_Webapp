/* ==========================================================
   Event banners: every element with data-banner="home" or
   data-banner="pricing" (the page name) becomes a banner.
   The slides come from assets/banners/banners.js — edit that file,
   not this one. A slide shows on the pages in its `pages` list
   (home only when it has none). One slide shows as a single banner;
   two or more become a slider (auto-plays, arrows, dots, swipe).
   ========================================================== */
(function () {
  'use strict';
  var cfg = window.DCLIX_BANNERS;
  if (!cfg || !Array.isArray(cfg.slides)) return;

  var FOLDER = 'assets/banners/';
  var host = location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1' || host === '' || /\.localhost$|\.test$/.test(host);
  var today = new Date(); today = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ms = Math.max(2, +cfg.seconds || 6) * 1000;

  function url(f) { return /^(https?:)?\/\//.test(f) || f.indexOf('/') === 0 ? f : FOLDER + f; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function isVideo(f) { return /\.(mp4|webm)(\?|$)/i.test(f); }

  [].forEach.call(document.querySelectorAll('[data-banner]'), setup);

  function setup(box) {
    var page = box.getAttribute('data-banner') || 'home';
    var slides = cfg.slides.filter(function (s) {
      if (!s || !s.src) return false;
      if ((s.pages || ['home']).indexOf(page) < 0) return false;
      if (s.preview && !isLocal) return false;
      if (s.start && today < s.start) return false;
      if (s.end && today > s.end) return false;
      return true;
    });
    if (!slides.length) return;

    var many = slides.length > 1;
    var html = slides.map(function (s, i) {
      var media = isVideo(s.src)
        ? '<video src="' + esc(url(s.src)) + '" muted playsinline preload="metadata"' + (many ? '' : ' loop autoplay') + ' aria-label="' + esc(s.alt) + '"></video>'
        : '<picture>' + (s.mobileSrc ? '<source media="(max-width: 640px)" srcset="' + esc(url(s.mobileSrc)) + '">' : '') +
          '<img src="' + esc(url(s.src)) + '" alt="' + esc(s.alt) + '"' + (i ? ' loading="lazy"' : '') + ' draggable="false"></picture>';
      var ext = /^https?:/.test(s.link || '');
      var inner = s.link ? '<a href="' + esc(s.link) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + ' tabindex="' + (i ? -1 : 0) + '">' + media + '</a>' : media;
      return '<div class="ev-slide' + (s.mobileSrc ? ' has-mobile' : '') + '" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + ' of ' + slides.length + '"' + (i ? ' aria-hidden="true"' : '') + '>' + inner + '</div>';
    }).join('');

    box.innerHTML = '<div class="ev-frame"><div class="ev-track">' + html + '</div></div>' +
      (many ? '<button class="ev-arrow prev" type="button" aria-label="Previous banner"><i data-icon="arrowleft" class="w-5"></i></button>' +
        '<button class="ev-arrow next" type="button" aria-label="Next banner"><i data-icon="arrowright" class="w-5"></i></button>' +
        '<div class="ev-dots" role="tablist" aria-label="Choose banner">' + slides.map(function (s, i) {
          return '<button type="button" role="tab" aria-label="Banner ' + (i + 1) + '" aria-selected="' + (i ? 'false' : 'true') + '"><i></i></button>';
        }).join('') + '</div>' : '');
    // Phone shape (4:3) only when every slide has a phone picture; otherwise phones show the whole wide banner
    if (slides.every(function (s) { return s.mobileSrc; })) box.querySelector('.ev-frame').classList.add('phone-art');
    var holder = box.closest('.ev-top, .h-events, section'); if (holder) holder.hidden = false;
    if (window.hydrateIcons) window.hydrateIcons(box);

    var track = box.querySelector('.ev-track'), items = [].slice.call(box.querySelectorAll('.ev-slide'));
    var dots = [].slice.call(box.querySelectorAll('.ev-dots button'));
    var cur = 0, timer = null, paused = false;

    function video(i) { return items[i] && items[i].querySelector('video'); }
    function go(n) {
      var prev = video(cur); if (prev) prev.pause();
      cur = (n + items.length) % items.length;
      track.style.transform = 'translateX(' + (-cur * 100) + '%)';
      items.forEach(function (el, i) {
        el.setAttribute('aria-hidden', String(i !== cur));
        var a = el.querySelector('a'); if (a) a.tabIndex = i === cur ? 0 : -1;
      });
      dots.forEach(function (d, i) { d.setAttribute('aria-selected', String(i === cur)); d.classList.remove('run'); });
      var v = video(cur);
      if (v) { try { v.currentTime = 0; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!many || paused || reduceMotion) return;
      var v = video(cur);
      if (v) { v.onended = function () { go(cur + 1); }; return; } // a video slide moves on when it finishes
      var d = dots[cur]; if (d) { void d.offsetWidth; d.style.setProperty('--ev-ms', ms + 'ms'); d.classList.add('run'); }
      timer = setTimeout(function () { go(cur + 1); }, ms);
    }

    if (!many) { var v0 = video(0); if (v0 && !reduceMotion) { var p0 = v0.play(); if (p0 && p0.catch) p0.catch(function () {}); } return; }

    box.querySelector('.ev-arrow.prev').addEventListener('click', function () { go(cur - 1); });
    box.querySelector('.ev-arrow.next').addEventListener('click', function () { go(cur + 1); });
    dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
    box.addEventListener('mouseenter', function () { paused = true; box.classList.add('paused'); clearTimeout(timer); });
    box.addEventListener('mouseleave', function () { paused = false; box.classList.remove('paused'); schedule(); });
    box.addEventListener('focusin', function () { paused = true; clearTimeout(timer); });
    box.addEventListener('focusout', function () { paused = false; schedule(); });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
    });
    // Swipe on touch screens
    var x0 = null;
    track.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; paused = true; clearTimeout(timer); }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var dx = x0 == null ? 0 : e.changedTouches[0].clientX - x0; x0 = null; paused = false;
      if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1)); else schedule();
    });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else schedule(); });
    go(0);
  }
})();
