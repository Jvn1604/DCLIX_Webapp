/* ==========================================================
   Shared behaviour for every page
   theme · mobile menu · scroll reveal · FAQ · sparkles ·
   parallax background · hex tilt · pricing · referral · forms
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Site root (pages in arena/ are one folder down), worked out from this script's own address
  var ROOT = ((document.currentScript && document.currentScript.src) || '').replace(/js\/shared\/main\.js(\?.*)?$/, '');

  document.addEventListener('DOMContentLoaded', function () {
    window.hydrateIcons();
    initTheme();
    initMenu();
    initReveal();
    initFaq();
    initLeadForm();
    initSparkles();
    addBackdrop();
    initParallax();
    initHexTilt();
    initPricing();
    initReferral();
    initImageFallbacks();
    initRipple();
    initCardGlow();
    initTabs();
    initScrollBar();
    initCountUp();
    initModules();
    initKeys();
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  });

  /* ---------- Theme ---------- */
  function initTheme() {
    $$('[data-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var root = document.documentElement;
        var next = root.classList.contains('light') ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(next);
        try { localStorage.setItem('theme', next); } catch (e) {}
      });
    });
  }

  /* ---------- Mobile menu ---------- */
  function initMenu() {
    var btn = $('#menuToggle'), menu = $('#mobileMenu');
    if (!btn || !menu) return;
    btn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      btn.innerHTML = window.icon(open ? 'x' : 'menu', 'w-6');
    });
  }

  /* ---------- Scroll reveal ---------- */
  function initReveal() {
    var items = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) { items.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.15 });
    items.forEach(function (el) {
      var d = el.getAttribute('data-delay'); if (d) el.style.transitionDelay = d + 's';
      io.observe(el);
    });
  }

  /* ---------- FAQ accordion (first item open, one at a time) ---------- */
  function initFaq() {
    var items = $$('.faq-item');
    items.forEach(function (item) {
      var btn = $('.faq-q', item);
      btn.addEventListener('click', function () {
        var willOpen = !item.classList.contains('open');
        items.forEach(function (o) { o.classList.remove('open'); $('.faq-q', o).setAttribute('aria-expanded', 'false'); });
        if (willOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
      });
    });
  }

  /* ---------- Contact / lead form (front-end only) ---------- */
  function initLeadForm() {
    var form = $('#leadForm'); if (!form) return;
    var toast = $('#leadToast');
    var btn = form.querySelector('button[type=submit]'), label = btn.textContent;
    function say(msg, ok) {
      toast.textContent = msg; toast.classList.toggle('err', !ok); toast.classList.add('show');
      clearTimeout(say.t); say.t = setTimeout(function () { toast.classList.remove('show'); }, ok ? 4500 : 7000);
    }
    // Country code picker: show the chosen code (e.g. "MY +60") on the button
    var cc = $('#leadCC'), ccShow = $('.tel-cc-show b', form), tel = $('#leadTel');
    function showCode() { var o = cc.options[cc.selectedIndex]; ccShow.textContent = o.getAttribute('data-iso') + ' ' + o.value; }
    if (cc) { cc.addEventListener('change', function () { showCode(); $('#leadPhone').focus(); }); showCode(); }
    // Errors shown under each field (field name in the API → element to mark)
    var MSG = { name: 'Enter your name.', phone: 'Enter a phone number.', phoneBad: 'Enter a valid phone number, digits only.', email: 'Enter a valid email address.', club: 'Enter your club name.', inquiries: 'Tell us how we can help.' };
    function target(k) { return k === 'phone' ? tel : form.elements[k]; }
    function clearErr(el) { if (!el) return; el.removeAttribute('aria-invalid'); var n = el.nextElementSibling; if (n && n.classList.contains('field-err')) n.remove(); }
    function setErr(k, msg) {
      var el = target(k); if (!el) return; clearErr(el);
      el.setAttribute('aria-invalid', 'true');
      var p = document.createElement('small'); p.className = 'field-err'; p.setAttribute('role', 'alert'); p.textContent = msg;
      el.insertAdjacentElement('afterend', p);
    }
    $$('input, textarea', form).forEach(function (el) { el.addEventListener('input', function () { clearErr(el.name === 'phoneNumber' ? tel : el); }); });
    function check() {
      var v = function (n) { return (form.elements[n].value || '').trim(); }, errs = {};
      if (!v('name')) errs.name = MSG.name;
      var num = v('phoneNumber');
      if (!num) errs.phone = MSG.phone; else if (!/^[0-9 \-]{6,15}$/.test(num)) errs.phone = MSG.phoneBad;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('email'))) errs.email = MSG.email;
      if (!v('club')) errs.club = MSG.club;
      if (!v('inquiries')) errs.inquiries = MSG.inquiries;
      return errs;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      ['name', 'phone', 'email', 'club', 'inquiries'].forEach(function (k) { clearErr(target(k)); });
      var errs = check(), keys = Object.keys(errs);
      if (keys.length) {
        keys.forEach(function (k) { setErr(k, errs[k]); });
        var first = target(keys[0]); (first === tel ? $('#leadPhone') : first).focus();
        return;
      }
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      // One phone number for the API: country code + number without its leading 0, e.g. "+60 12-345 6789"
      data.phone = data.phoneCode + ' ' + String(data.phoneNumber).trim().replace(/^0+/, '');
      delete data.phoneCode; delete data.phoneNumber;
      if (!window.dclixApi) { say('Sorry, the form is not available right now. Please call us at +603-7804 1412.', false); return; }
      btn.disabled = true; btn.textContent = 'Sending…';
      // Saved as a lead in Admin → Leads; sales is alerted and the visitor gets a confirmation email.
      window.dclixApi('contact.php', { body: data }).then(function () {
        form.reset(); if (cc) showCode();
        say('Thanks! We have received your details. A D-Clix expert will contact you soon.', true);
      }, function (err) {
        var fields = err.data && err.data.fields;
        if (fields) Object.keys(fields).forEach(function (k) { setErr(k, fields[k]); });
        say(err.offline ? 'Online enquiries are not connected yet. Please call us at +603-7804 1412 or email us.' : (fields ? fields[Object.keys(fields)[0]] : err.message), false);
      }).then(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  /* ---------- Sparkles (hero particle background) ---------- */
  function initSparkles() {
    var c = $('canvas.sparkles'); if (!c || reduceMotion) return;
    var ctx = c.getContext('2d'), dots = [], w = 0, h = 0, raf;
    function size() {
      var r = c.parentElement.getBoundingClientRect();
      w = c.width = r.width; h = c.height = r.height;
      dots = [];
      var n = Math.min(160, Math.floor((w * h) / 9000));
      for (var i = 0; i < n; i++) dots.push({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.4 + .4, p: Math.random() * 6.28, s: .6 + Math.random() * 1.6, vy: -(.05 + Math.random() * .15) });
    }
    function tick(t) {
      ctx.clearRect(0, 0, w, h);
      dots.forEach(function (d) {
        d.y += d.vy; if (d.y < -4) { d.y = h + 4; d.x = Math.random() * w; }
        var a = .25 + .75 * Math.abs(Math.sin(t / 1000 * d.s + d.p));
        ctx.beginPath(); ctx.fillStyle = 'rgba(225,29,72,' + a.toFixed(2) + ')'; ctx.arc(d.x, d.y, d.r, 0, 6.28); ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    }
    var onScreen = true;
    function run() {
      cancelAnimationFrame(raf); raf = 0;
      if (onScreen && !document.hidden) raf = requestAnimationFrame(tick);
    }
    size(); run();
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', run);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; run(); }).observe(c);
  }

  /* ---------- Parallax karate background (home page) ---------- */
  // The moving karate figures behind every page (pages can opt out with <body data-no-backdrop>)
  function addBackdrop() {
    if ($('#parallax') || document.body.hasAttribute('data-no-backdrop')) return;
    // phones get half-size images (the figures are faint background art)
    var sm = window.matchMedia('(max-width: 760px)').matches ? '-sm' : '';
    var poses = [1, 2, 3, 4].map(function (n) {
      var src = ROOT + 'assets/images/karate-' + n + sm + '.webp';
      return '<div class="pose"><img class="main" src="' + src + '" alt="" draggable="false" decoding="async" fetchpriority="low" /></div>';
    }).join('');
    var el = document.createElement('div');
    el.className = 'parallax'; el.id = 'parallax'; el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<div class="base"></div><div class="tint"></div><div class="spot"></div>' + poses + '<div class="fade"></div>';
    document.body.insertBefore(el, document.body.firstChild);
  }

  function initParallax() {
    var root = $('#parallax'); if (!root) return;
    var poses = $$('.pose', root), spot = $('.spot', root);
    var ranges = [
      { x: [-240, 180], y: [130, -120], r: [-16, 10] },
      { x: [260, -160], y: [160, -80], r: [14, -12] },
      { x: [-220, 210], y: [200, -180], r: [-22, 16] },
      { x: [240, -220], y: [120, -140], r: [16, -14] }
    ];
    var MAXO = 0.32, total = poses.length, smooth = 0, target = 0;
    function lerp(p, i0, i1, o0, o1) { var t = Math.min(1, Math.max(0, (p - i0) / ((i1 - i0) || 1))); return o0 + (o1 - o0) * t; }
    function interp3(p, a, b, c, oa, ob, oc) { return p <= b ? lerp(p, a, b, oa, ob) : lerp(p, b, c, ob, oc); }
    function update(p) {
      spot.style.setProperty('--sx', lerp(p, 0, 1, 35, 65) + '%');
      spot.style.setProperty('--sy', lerp(p, 0, 1, 30, 55) + '%');
      spot.style.opacity = interp3(p, 0, .5, 1, .25, .35, .3);
      poses.forEach(function (el, i) {
        var slice = 1 / total, start = i * slice, peak = start + slice / 2, end = start + slice;
        var first = i === 0, last = i === total - 1;
        var op = interp3(p, first ? 0 : start - slice * .4, peak, last ? 1 : end + slice * .4, first ? MAXO : 0, MAXO, last ? MAXO : 0);
        var sc = interp3(p, start, peak, end, .82, 1.22, .86);
        var rg = ranges[i % ranges.length];
        var x = lerp(p, 0, 1, rg.x[0], rg.x[1]), y = lerp(p, 0, 1, rg.y[0], rg.y[1]), rot = lerp(p, 0, 1, rg.r[0], rg.r[1]);
        el.style.opacity = reduceMotion ? MAXO : op;
        el.style.transform = reduceMotion ? 'translate(-50%,-50%)' : 'translate(-50%,-50%) translate(' + x + 'px,' + y + 'px) rotate(' + rot + 'deg) scale(' + sc + ')';
      });
    }
    function progress() { var m = document.documentElement.scrollHeight - innerHeight; return m > 0 ? scrollY / m : 0; }
    var running = false;
    function loop() {
      smooth += (target - smooth) * .08;
      if (Math.abs(target - smooth) < .0005) { smooth = target; running = false; }
      update(smooth);
      if (running) requestAnimationFrame(loop);
    }
    function kick() { if (!running && !reduceMotion) { running = true; requestAnimationFrame(loop); } }
    window.addEventListener('scroll', function () { target = progress(); kick(); }, { passive: true });
    window.addEventListener('resize', function () { target = progress(); kick(); });
    target = smooth = progress(); update(smooth);
    $$('img', root).forEach(function (img) { img.addEventListener('error', function () { var pose = img.closest('.pose'); if (pose) pose.remove(); }); });
  }

  /* ---------- Hex card tilt ---------- */
  function initHexTilt() {
    if (reduceMotion) return;
    $$('.hex-wrap').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = 'perspective(900px) rotateX(' + (-py * 4) + 'deg) rotateY(' + (px * 4) + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Pricing (monthly / yearly) ---------- */
  function initPricing() {
    var grid = $('#planGrid'); if (!grid) return;
    var plans = [
      { name: 'Basic Plan', m: 'RM100', y: 'RM1000', save: '(Save RM200)', desc: 'Essential Features',
        items: ['User management tools', 'Online student registrations', 'Fee management', 'Manual attendance (Portal)', 'QR Code+ Scan attendance', 'Discount module', 'Shared workspace', 'Push notification', 'Reimbursement', 'Web and mobile app', '3 Basic classes, 1 advanced class a week', 'Dedicated WhatsApp group support'] },
      { name: 'Standard Plan', m: 'RM150', y: 'RM1500', save: '(Save RM300)', desc: 'Essential Features +', featured: true,
        items: ['Grading management', 'Activities management', 'Inventory stock management', '5 Basic classes, 2 advanced classes a week', 'Prepaid account management', 'Dedicated WhatsApp group support'] },
      { name: 'Premium Plan', m: 'RM200', y: 'RM2000', save: '(Save RM400)', desc: 'BASIC + STANDARD +',
        items: ['Contribution', 'Purchase request by branch to HQ', 'Purchase request by students to branch', 'Tournament participations, scores, results & history', 'Financial reports customizations', 'Payroll module', 'HQ approval on manual payment', 'Student class booking via app', 'Dedicated WhatsApp group support'] }
    ];
    function render(mode) {
      grid.innerHTML = plans.map(function (p, i) {
        return '<div class="reveal in" style="transition-delay:' + (i * .08) + 's"><div class="card plan' + (p.featured ? ' featured' : '') + '">' +
          '<div class="pn">' + p.name + '</div>' +
          '<div class="price">' + (mode === 'monthly' ? p.m : p.y) + '<small>/' + (mode === 'monthly' ? 'month' : 'year') + '</small></div>' +
          '<div class="save">' + (mode === 'yearly' ? p.save : '') + '</div>' +
          '<div class="desc">' + p.desc + '</div>' +
          '<ul>' + p.items.map(function (t) { return '<li><span class="tick">' + window.icon('check') + '</span><span>' + t + '</span></li>'; }).join('') + '</ul>' +
          '<a class="btn-primary block" href="arena/club-register.html?plan=' + p.name.split(' ')[0].toLowerCase() + '&billing=' + mode + '">Select Plan</a></div></div>';
      }).join('');
    }
    function pick(mode) {
      $$('.billing button').forEach(function (o) { var on = o.getAttribute('data-mode') === mode; o.classList.toggle('active', on); o.setAttribute('aria-pressed', String(on)); });
      render(mode);
    }
    $$('.billing button').forEach(function (b) {
      b.addEventListener('click', function () { pick(b.getAttribute('data-mode')); });
    });
    // pricing.html?billing=yearly opens on the yearly prices (used by the Deepavali banner)
    pick(new URLSearchParams(location.search).get('billing') === 'yearly' ? 'yearly' : 'monthly');
  }

  /* ---------- Referral slideshow ---------- */
  function initReferral() {
    var box = $('#refCarousel'); if (!box) return;
    var slides = window.REFERRAL_SLIDES || [], i = 0;
    var title = $('.ct', box), sub = $('.cs', box), img = $('.slide', box), dots = $('.dots', box);
    dots.innerHTML = slides.map(function (_, n) { return '<button type="button" aria-label="Slide ' + (n + 1) + '" data-i="' + n + '"></button>'; }).join('');
    function show(n) {
      i = (n + slides.length) % slides.length;
      var s = slides[i];
      title.textContent = s.title; sub.textContent = s.subtitle;
      img.style.animation = 'none'; void img.offsetWidth; img.style.animation = '';
      img.setAttribute('data-title', s.title);
      img.src = s.image; img.alt = s.title; img.style.visibility = 'visible';
      $$('button', dots).forEach(function (b, k) { b.classList.toggle('active', k === i); });
    }
    img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
    $('.prev', box).addEventListener('click', function () { show(i - 1); });
    $('.next', box).addEventListener('click', function () { show(i + 1); });
    dots.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b) show(+b.getAttribute('data-i')); });
    show(0);
  }

  /* ---------- Image fallbacks (placeholder when a photo fails to load) ---------- */
  function initImageFallbacks() {
    var person = '<svg viewBox="0 0 100 140" fill="currentColor" aria-hidden="true" style="color:#cfd3da;width:50%;height:100%"><circle cx="50" cy="20" r="13"/><path d="M28 140V70c0-14 9-24 22-24s22 10 22 24v70h-14V92h-16v48z"/></svg>';
    function bind(img) {
      var done = false;
      function fail() {
        if (done) return; done = true;
        if (img.hasAttribute('data-person')) { var w = document.createElement('span'); w.innerHTML = person; img.replaceWith(w.firstChild); }
        else img.style.display = 'none';
      }
      img.addEventListener('error', fail);
      if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    }
    $$('img[data-fallback], img[data-person]').forEach(bind);
  }

  /* ---------- Click ripple on buttons (styles: "Micro-interactions" in style.css) ---------- */
  var RIPPLE = '.btn-primary, .btn-outline, .btn-ghost, .billing button, .mobile-menu a, .icon-btn.boxed, .lang-btn, .wa-fab, .faq-q';
  function initRipple() {
    if (reduceMotion) return;
    // Delegated, so buttons added later (pricing cards, payment links) get it too
    document.addEventListener('pointerdown', function (e) {
      var el = e.target.closest && e.target.closest(RIPPLE);
      if (!el || el.disabled) return;
      var r = el.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
      var dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = 'width:' + size + 'px;height:' + size + 'px;left:' + (e.clientX - r.left - size / 2) + 'px;top:' + (e.clientY - r.top - size / 2) + 'px';
      el.classList.add('ripple-host');
      el.appendChild(dot);
      setTimeout(function () { dot.remove(); }, 650);
    });
  }

  /* ---------- Soft glow that follows the mouse on cards ---------- */
  function initCardGlow() {
    if (reduceMotion || !window.matchMedia('(hover: hover)').matches) return;
    var cards = '.benefit, .feature-card, .elevate-card, .t-card, .plan, .demo-card';
    $$(cards).forEach(function (c) { c.classList.add('glow-card'); });
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest(cards);
      if (!c) return;
      if (!c.classList.contains('glow-card')) c.classList.add('glow-card');
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- Tabs (home page product tour: [data-tabs] with role=tab buttons) ---------- */
  function initTabs() {
    $$('[data-tabs]').forEach(function (box) {
      var tabs = $$('[role=tab]', box), list = $('[role=tablist]', box);
      // A gold pill that slides to the selected tab
      var pill = document.createElement('span'); pill.className = 'tab-pill'; pill.setAttribute('aria-hidden', 'true');
      if (list) { list.appendChild(pill); list.classList.add('has-pill'); }
      function place() {
        var t = tabs.filter(function (x) { return x.getAttribute('aria-selected') === 'true'; })[0]; if (!t || !list) return;
        pill.style.width = t.offsetWidth + 'px';
        pill.style.transform = 'translateX(' + (t.offsetLeft - list.clientLeft) + 'px)';
      }
      function show(t, focus) {
        tabs.forEach(function (x) {
          var on = x === t;
          x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1;
          var pane = document.getElementById(x.getAttribute('aria-controls')); if (pane) pane.hidden = !on;
        });
        place();
        if (focus) t.focus();
      }
      place();
      window.addEventListener('resize', place);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
      tabs.forEach(function (t, i) {
        t.addEventListener('click', function () { show(t); });
        t.addEventListener('keydown', function (e) {
          var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return;
          e.preventDefault(); show(tabs[(i + d + tabs.length) % tabs.length], true);
        });
      });
    });
  }

  /* ---------- Home page: gold reading-progress line at the top ---------- */
  function initScrollBar() {
    if (!document.body.classList.contains('home')) return;
    var bar = document.createElement('div'); bar.className = 'scroll-bar'; bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var ticking = false;
    function draw() {
      var m = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, scrollY / m) : 0) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(draw); } }, { passive: true });
    draw();
  }

  /* ---------- Numbers count up when they scroll into view (e.g. 29,000+, RM 18,420, 92%) ---------- */
  function initCountUp() {
    var els = $$('[data-count], .h-facts b, .h-trust-nums b, .h-kpis b');
    if (!els.length || reduceMotion || !('IntersectionObserver' in window)) return;
    els.forEach(function (el) {
      var m = el.textContent.trim().match(/^(\D*?)(\d[\d,]*)(\.\d+)?(\D*)$/);
      if (!m || /\//.test(el.textContent)) return; // skip things like 24/7
      el.dataset.countTo = m[2].replace(/,/g, '') + (m[3] || '');
      el.dataset.countFmt = JSON.stringify([m[1], m[4], m[2].indexOf(',') >= 0, m[3] ? m[3].length - 1 : 0]);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        run(en.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { if (el.dataset.countTo) io.observe(el); });
    function run(el) {
      var to = parseFloat(el.dataset.countTo), f = JSON.parse(el.dataset.countFmt), t0 = null, dur = 1400;
      function fmt(v) {
        var s = v.toFixed(f[3]);
        if (f[2]) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return f[0] + s + f[1];
      }
      function step(t) {
        if (!t0) t0 = t;
        var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e);
        if (p < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
      }
      requestAnimationFrame(step);
    }
  }

  /* ---------- Core modules: the node at the end of each line opens and closes the details ---------- */
  function initModules() {
    $$('.h-mod-toggle').forEach(function (btn) {
      var mod = btn.closest('.h-module'), name = (btn.getAttribute('aria-label') || '').replace(/^(Show|Hide) /, '');
      var label = btn.querySelector('span');
      btn.addEventListener('click', function () {
        var open = !mod.classList.contains('open');
        mod.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', (open ? 'Hide ' : 'Show ') + name);
        if (label) label.textContent = open ? 'Show less' : 'What it does';
      });
    });
  }



  /* ---------- Keyboard shortcuts ---------- */
  function initKeys() {
    var seq = [38, 38, 40, 40, 37, 39], at = 0;
    document.addEventListener('keydown', function (e) {
      var t = e.target, tag = t && t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (t && t.isContentEditable)) { at = 0; return; }
      at = e.keyCode === seq[at] ? at + 1 : e.keyCode === 38 ? (at === 2 ? 2 : 1) : 0;
      if (at < seq.length) return;
      at = 0;
      if (window.__fx) { window.__fx(); return; }
      var s = document.createElement('script');
      s.src = ROOT + 'js/shared/fx.js' + (((document.querySelector('script[src*="main.js"]') || {}).src || '').match(/\?v=[^#]*/) || [''])[0];
      document.head.appendChild(s);
    });
  }
})();
