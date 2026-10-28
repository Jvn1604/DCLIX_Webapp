/* Spinning globe of club logos (home page).
   Club list and logos: assets/clubs/clubs.js (see the notes at the top of that file). */
(function () {
  'use strict';
  var box = document.getElementById('clubGlobe');
  if (!box) return;
  var canvas = box.querySelector('canvas');
  var label = box.querySelector('.h-globe-name');
  var ctx = canvas.getContext('2d');
  var clubs = (window.DCLIX_CLUBS || []).slice(0, 120);
  if (!clubs.length) { box.hidden = true; return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TILT = 0.38, SPIN = reduce ? 0 : 0.22;
  var W = 0, D = 1, rotY = 0, extra = 0, visible = false, raf = 0, last = 0, frame = 0;
  var accent = '#de9836', fg = '#f5efe6';
  var dragging = false, moved = 0, lastX = 0, hits = [];

  /* points spread evenly over a sphere */
  var nodes = clubs.map(function (c, i) {
    var n = clubs.length, y = 1 - (i + 0.5) * 2 / n, r = Math.sqrt(1 - y * y), phi = i * 2.399963;
    return { club: c, x: Math.cos(phi) * r, y: y, z: Math.sin(phi) * r, img: null, ph: !c.logo };
  });

  function placeholder(i) {
    var s = 96, c = document.createElement('canvas'), g;
    c.width = c.height = s; g = c.getContext('2d');
    var hues = [28, 200, 350, 150, 265, 45, 10, 180];
    var h = hues[(i * 5 + 3) % hues.length] + (i * 37) % 24;
    g.fillStyle = 'hsl(' + h + ',62%,' + (i % 2 ? 38 : 46) + '%)'; g.fillRect(0, 0, s, s);
    g.translate(s / 2, s / 2); g.fillStyle = g.strokeStyle = '#fff'; g.lineWidth = 7;
    var k = i % 5, j, a, r;
    if (k === 0) { g.beginPath(); g.arc(0, 0, 24, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill(); }
    else if (k === 1) { g.beginPath(); g.moveTo(0, -30); g.lineTo(26, 0); g.lineTo(0, 30); g.lineTo(-26, 0); g.closePath(); g.fill(); }
    else if (k === 2) { g.beginPath(); for (j = 0; j < 10; j++) { a = -Math.PI / 2 + j * Math.PI / 5; r = j % 2 ? 13 : 30; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); }
    else if (k === 3) { g.beginPath(); g.moveTo(-22, -24); g.lineTo(22, -24); g.lineTo(22, 4); g.quadraticCurveTo(22, 24, 0, 32); g.quadraticCurveTo(-22, 24, -22, 4); g.closePath(); g.fill(); }
    else { g.fillRect(-30, -16, 60, 10); g.fillRect(-30, 6, 60, 10); }
    return c;
  }

  nodes.forEach(function (n, i) {
    if (n.ph) { n.img = placeholder(i); return; }
    var im = new Image();
    im.onload = function () { n.img = im; if (!raf) draw(); };
    im.onerror = function () { n.ph = true; n.img = placeholder(i); if (!raf) draw(); };
    im.src = n.club.logo;
  });

  function colors() {
    var cs = getComputedStyle(document.documentElement);
    accent = cs.getPropertyValue('--accent').trim() || accent;
    fg = cs.getPropertyValue('--fg').trim() || fg;
  }

  function size() {
    D = Math.min(window.devicePixelRatio || 1, 2); W = box.clientWidth || 300;
    canvas.width = canvas.height = Math.round(W * D);
  }

  function project(x, y, z) {
    var cr = Math.cos(rotY), sr = Math.sin(rotY), ct = Math.cos(TILT), st = Math.sin(TILT);
    var x1 = x * cr + z * sr, z1 = -x * sr + z * cr;
    return [x1, y * ct - z1 * st, y * st + z1 * ct];
  }

  function grid(cx, cy, R) {
    var front = new Path2D(), back = new Path2D(), step = Math.PI / 30, p, q, m, i, lat, lon, path;
    function seg(a, b) {
      path = (a[2] + b[2]) > 0 ? front : back;
      path.moveTo(cx + a[0] * R, cy - a[1] * R); path.lineTo(cx + b[0] * R, cy - b[1] * R);
    }
    for (lat = -60; lat <= 60; lat += 30) {
      var la = lat * Math.PI / 180, cy2 = Math.cos(la), sy = Math.sin(la);
      for (i = 0; i < 60; i++) {
        p = project(Math.cos(i * step * 2) * cy2, sy, Math.sin(i * step * 2) * cy2);
        q = project(Math.cos((i + 1) * step * 2) * cy2, sy, Math.sin((i + 1) * step * 2) * cy2);
        seg(p, q);
      }
    }
    for (lon = 0; lon < 12; lon++) {
      var lo = lon * Math.PI / 6;
      for (i = 0; i < 30; i++) {
        var a1 = -Math.PI / 2 + i * Math.PI / 30, a2 = a1 + Math.PI / 30;
        p = project(Math.cos(a1) * Math.cos(lo), Math.sin(a1), Math.cos(a1) * Math.sin(lo));
        q = project(Math.cos(a2) * Math.cos(lo), Math.sin(a2), Math.cos(a2) * Math.sin(lo));
        seg(p, q);
      }
    }
    ctx.lineWidth = 1; ctx.strokeStyle = fg;
    ctx.globalAlpha = 0.06; ctx.stroke(back);
    ctx.globalAlpha = 0.2; ctx.stroke(front);
  }

  function draw() {
    if (!W) size();
    if (frame++ % 30 === 0) colors();
    var cx = W / 2, cy = W / 2, R = W * 0.38, rl = W * 0.056;
    ctx.setTransform(D, 0, 0, D, 0, 0); ctx.clearRect(0, 0, W, W);
    ctx.globalAlpha = 0.07; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.35; ctx.strokeStyle = accent; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    grid(cx, cy, R);
    var list = nodes.map(function (n) { var p = project(n.x, n.y, n.z); return { n: n, x: cx + p[0] * R, y: cy - p[1] * R, z: p[2] }; });
    list.sort(function (a, b) { return a.z - b.z; });
    hits = [];
    list.forEach(function (o) {
      if (!o.n.img) return;
      var t = (o.z + 1) / 2, r = rl * (0.6 + 0.4 * t), alpha = o.z > 0 ? 0.55 + 0.45 * t : 0.14 + 0.2 * t;
      ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip();
      var im = o.n.img, w = im.width || im.naturalWidth, h = im.height || im.naturalHeight;
      if (o.n.ph) ctx.drawImage(im, o.x - r, o.y - r, r * 2, r * 2);
      else { var k = (r * 1.5) / Math.max(w, h); ctx.drawImage(im, o.x - w * k / 2, o.y - h * k / 2, w * k, h * k); }
      ctx.restore();
      ctx.globalAlpha = alpha * 0.8; ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.stroke();
      if (o.z > 0) hits.push({ x: o.x, y: o.y, r: r, name: o.n.club.name });
    });
    ctx.globalAlpha = 1;
  }

  function loop(ts) {
    if (!visible || document.hidden) { raf = 0; return; }
    var dt = Math.min((ts - last) / 1000, 0.05); last = ts;
    rotY += (SPIN + extra) * dt; extra *= Math.pow(0.05, dt);
    draw(); raf = requestAnimationFrame(loop);
  }
  function start() { if (!raf && visible && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  function pos(e) { var b = canvas.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; }
  function nameAt(e) {
    var p = pos(e), best = null, i;
    for (i = hits.length - 1; i >= 0; i--) { var h = hits[i]; if (Math.hypot(p[0] - h.x, p[1] - h.y) <= h.r) { best = h; break; } }
    label.textContent = best ? best.name : ''; box.style.cursor = best ? 'pointer' : 'grab';
  }
  canvas.addEventListener('pointerdown', function (e) { dragging = true; moved = 0; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); box.style.cursor = 'grabbing'; });
  canvas.addEventListener('pointermove', function (e) {
    if (!dragging) { nameAt(e); return; }
    var dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
    rotY += dx * 0.008; extra = Math.max(-3, Math.min(3, dx * 0.45)); if (!raf) draw();
  });
  function up(e) { if (!dragging) return; dragging = false; if (moved < 5) nameAt(e); else box.style.cursor = 'grab'; }
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', function () { if (!dragging) label.textContent = ''; });

  function resize() { size(); draw(); }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(box); else window.addEventListener('resize', resize);
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { rootMargin: '100px' }).observe(box);
  else { visible = true; start(); }
  document.addEventListener('visibilitychange', start);
  size(); colors(); draw();
})();
