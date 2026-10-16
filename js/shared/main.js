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

  document.addEventListener('DOMContentLoaded', function () {
    window.hydrateIcons();
    initTheme();
    initMenu();
    initReveal();
    initFaq();
    initLeadForm();
    initSparkles();
    initParallax();
    initHexTilt();
    initPricing();
    initReferral();
    initEduDownload();
    initImageFallbacks();
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
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
      // TODO: send `data` to your own backend / email service, e.g.
      // fetch('/api/enquiry', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
      console.log('Lead ready to send:', data);
      form.reset();
      toast.classList.add('show');
      setTimeout(function () { toast.classList.remove('show'); }, 3500);
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
    size(); raf = requestAnimationFrame(tick);
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) cancelAnimationFrame(raf); else raf = requestAnimationFrame(tick);
    });
  }

  /* ---------- Parallax karate background (home page) ---------- */
  function initParallax() {
    var root = $('#parallax'); if (!root) return;
    var poses = $$('.pose', root), spot = $('.spot', root);
    var ranges = [
      { x: [-240, 180], y: [130, -120], r: [-16, 10] },
      { x: [260, -160], y: [160, -80], r: [14, -12] },
      { x: [-220, 210], y: [200, -180], r: [-22, 16] },
      { x: [240, -220], y: [120, -140], r: [16, -14] }
    ];
    var MAXO = 0.58, total = poses.length, smooth = 0, target = 0;
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
    function loop() { smooth += (target - smooth) * .08; update(smooth); requestAnimationFrame(loop); }
    window.addEventListener('scroll', function () { target = progress(); }, { passive: true });
    target = smooth = progress(); update(smooth);
    if (!reduceMotion) requestAnimationFrame(loop);
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
          '<div class="price">' + (mode === 'monthly' ? p.m : p.y) + '<small>/' + (mode === 'monthly' ? 'month' : 'Year') + '</small></div>' +
          '<div class="save">' + (mode === 'yearly' ? p.save : '') + '</div>' +
          '<div class="desc">' + p.desc + '</div>' +
          '<ul>' + p.items.map(function (t) { return '<li><span class="tick">' + window.icon('check') + '</span><span>' + t + '</span></li>'; }).join('') + '</ul>' +
          '<a class="btn-primary block" href="arena/payment.html?plan=' + p.name.split(' ')[0].toLowerCase() + '&billing=' + mode + '">Select Plan</a></div></div>';
      }).join('');
    }
    $$('.billing button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.billing button').forEach(function (o) { o.classList.toggle('active', o === b); o.setAttribute('aria-pressed', String(o === b)); });
        render(b.getAttribute('data-mode'));
      });
    });
    render('monthly');
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

  /* ---------- Edu-Hub: build + download a simple PDF guide (no libraries) ---------- */
  function initEduDownload() {
    var btn = $('#downloadGuide'); if (!btn) return;
    btn.addEventListener('click', function () {
      var lines = [
        ['Elevate Your Club: A Comprehensive Guide to D-Clix', 18, 780, 'F2', '0.97 0.45 0.09'],
        ['A quick start guide for registration, payments, attendance, and reporting.', 11, 752, 'F1', '0.35 0.38 0.42'],
        ['1) Digitalize member registration and approvals', 12, 700, 'F1', '0.12 0.12 0.12'],
        ['2) Enable online payments and automated receipts', 12, 678, 'F1', '0.12 0.12 0.12'],
        ['3) Track attendance with QR / fingerprint / manual methods', 12, 656, 'F1', '0.12 0.12 0.12'],
        ['4) Manage grading schedules and results', 12, 634, 'F1', '0.12 0.12 0.12'],
        ['5) Use reports to retain members and improve operations', 12, 612, 'F1', '0.12 0.12 0.12'],
        ['Need help? Contact D-Clix support for onboarding assistance.', 12, 568, 'F1', '0.12 0.12 0.12']
      ];
      var esc = function (s) { return s.replace(/[\\()]/g, '\\$&'); };
      var stream = lines.map(function (l) { return 'BT /' + l[3] + ' ' + l[1] + ' Tf ' + l[4] + ' rg 56 ' + l[2] + ' Td (' + esc(l[0]) + ') Tj ET'; }).join('\n');
      var objs = [
        '<< /Type /Catalog /Pages 2 0 R >>',
        '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
        '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
        '<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream'
      ];
      var pdf = '%PDF-1.4\n', offs = [];
      objs.forEach(function (o, n) { offs.push(pdf.length); pdf += (n + 1) + ' 0 obj\n' + o + '\nendobj\n'; });
      var xref = pdf.length;
      pdf += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n' + offs.map(function (o) { return ('0000000000' + o).slice(-10) + ' 00000 n \n'; }).join('');
      pdf += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF';
      var url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
      var a = document.createElement('a'); a.href = url; a.download = 'Elevate-Your-Club-DClix-Guide.pdf'; a.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
  }

  /* ---------- Remote images: hide broken ones so the gradient shows ---------- */
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
})();