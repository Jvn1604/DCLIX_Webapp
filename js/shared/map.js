/* Malaysia map of clubs using D-Clix (home page).
   States are shaded by how many listed clubs they have, and each club's logo is pinned on its state.
   Club list: assets/clubs/clubs.js · state outlines: assets/clubs/malaysia-map.js */
(function () {
  'use strict';
  var box = document.getElementById('clubMap');
  var MAP = window.DCLIX_MY_MAP, clubs = window.DCLIX_CLUBS || [];
  if (!box || !MAP) return;
  var NS = 'http://www.w3.org/2000/svg';
  var ROOT = ((document.currentScript && document.currentScript.src) || '').replace(/js\/shared\/map\.js(\?.*)?$/, '');
  var stage = box.querySelector('.my-stage'), tip = box.querySelector('.my-tip'), more = document.getElementById('clubMore');
  var bm = function () { return document.documentElement.lang === 'ms'; };
  var count = function (n) { return n + (bm() ? ' kelab' : n === 1 ? ' club' : ' clubs'); };

  // clubs per state (names in clubs.js match the map, plus a few common spellings)
  var ALIAS = { 'malacca': 'melaka', 'pulau pinang': 'penang', 'wp kuala lumpur': 'kuala lumpur', 'kl': 'kuala lumpur' };
  var byName = {};
  MAP.states.forEach(function (s) { byName[s.name.toLowerCase()] = s; s.clubs = []; });
  var unplaced = [];
  clubs.forEach(function (c) {
    var k = (c.state || '').trim().toLowerCase(); k = ALIAS[k] || k;
    if (byName[k]) byName[k].clubs.push(c); else unplaced.push(c);
  });
  var max = Math.max.apply(null, MAP.states.map(function (s) { return s.clubs.length; }).concat(1));

  /* ---------- states ---------- */
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 ' + MAP.w + ' ' + MAP.h);
  svg.setAttribute('aria-hidden', 'true');
  MAP.states.forEach(function (s) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('d', s.d);
    p.setAttribute('class', 'my-state' + (s.clubs.length ? ' has' : ''));
    // deeper colour for states with more clubs
    if (s.clubs.length) p.style.setProperty('--lvl', (0.35 + 0.65 * s.clubs.length / max).toFixed(2));
    p.addEventListener('pointerenter', function (e) { showState(s, e); });
    p.addEventListener('pointermove', move);
    p.addEventListener('pointerleave', hide);
    s.el = p;
    svg.appendChild(p);
  });
  stage.insertBefore(svg, stage.firstChild);

  /* ---------- logo pins (fanned out around the state's centre when there are several) ---------- */
  function pin(c, s) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'my-pin';
    b.setAttribute('aria-label', c.name + ', ' + s.name);
    var img = document.createElement('img');
    img.src = ROOT + c.logo; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', function () { b.classList.add('no-logo'); b.textContent = initials(c.name); });
    b.appendChild(img);
    b.addEventListener('pointerenter', function (e) { showClub(c, s, b, e); });
    b.addEventListener('pointerleave', hide);
    b.addEventListener('focus', function () { showClub(c, s, b); });
    b.addEventListener('blur', hide);
    b.addEventListener('click', function () { showClub(c, s, b); });
    return b;
  }
  function initials(n) { return n.split(/\s+/).filter(function (w) { return /^[A-Z]/.test(w); }).slice(0, 2).map(function (w) { return w[0]; }).join(''); }

  // states close together on the map (KL, Putrajaya, Selangor…) share one cluster so logos don't overlap
  var NEAR = 34, groups = [], all = [];
  MAP.states.filter(function (s) { return s.clubs.length; })
    .sort(function (a, b) { return b.clubs.length - a.clubs.length; })
    .forEach(function (s) {
      var g = groups.filter(function (g) { return Math.hypot(g.x - s.x, g.y - s.y) < NEAR; })[0];
      if (!g) { g = { x: s.x, y: s.y, pins: [] }; groups.push(g); }
      s.clubs.forEach(function (c) { g.pins.push({ c: c, s: s }); });
    });
  groups.forEach(function (g) {
    var n = g.pins.length, el = document.createElement('div');
    el.className = 'my-group' + (n > 1 ? ' many' : '');
    el.style.left = (g.x / MAP.w * 100) + '%';
    el.style.top = (g.y / MAP.h * 100) + '%';
    g.pins.forEach(function (p, i) {
      var b = pin(p.c, p.s);
      var a = -Math.PI / 2 + i * 2 * Math.PI / n, r = n > 1 ? 0.9 + n * 0.14 : 0;
      all.push({ b: b, g: g, fx: Math.cos(a) * r, fy: Math.sin(a) * r });
      el.appendChild(b);
    });
    stage.appendChild(el);
  });

  // on small screens the peninsula is tiny: nudge logos apart until none overlap
  function layout() {
    var W = stage.clientWidth, H = W * MAP.h / MAP.w;
    var P = parseFloat(getComputedStyle(box).getPropertyValue('--pin')) || 40, gap = P * 1.08;
    var pts = all.map(function (p) { return { p: p, x: p.g.x / MAP.w * W + p.fx * P, y: p.g.y / MAP.h * H + p.fy * P }; });
    for (var k = 0; k < 60; k++) {
      var moved = false;
      for (var i = 0; i < pts.length; i++) for (var j = i + 1; j < pts.length; j++) {
        var A = pts[i], B = pts[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
        if (d >= gap) continue;
        if (d < .01) { dx = 1; dy = 0; d = 1; }
        var push = (gap - d) / 2;
        A.x -= dx / d * push; A.y -= dy / d * push; B.x += dx / d * push; B.y += dy / d * push; moved = true;
      }
      if (!moved) break;
    }
    pts.forEach(function (q) {
      q.x = Math.min(W - P / 2, Math.max(P / 2, q.x));
      q.p.b.style.setProperty('--ox', (q.x - q.p.g.x / MAP.w * W).toFixed(1) + 'px');
      q.p.b.style.setProperty('--oy', (q.y - q.p.g.y / MAP.h * H).toFixed(1) + 'px');
    });
  }
  layout();
  var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 120); });

  /* ---------- clubs without a state: a row under the map ---------- */
  if (more) {
    if (!unplaced.length) more.hidden = true;
    var row = more.querySelector('.my-more-row');
    unplaced.forEach(function (c) {
      var f = document.createElement('figure');
      f.className = 'my-more-item';
      f.innerHTML = '<img alt="" loading="lazy" decoding="async" /><figcaption></figcaption>';
      f.querySelector('img').src = ROOT + c.logo;
      f.querySelector('figcaption').textContent = c.name;
      row.appendChild(f);
    });
  }

  /* ---------- tooltip ---------- */
  function place(x, y) {
    var r = box.getBoundingClientRect();
    tip.style.left = Math.min(r.width - 12, Math.max(12, x - r.left)) + 'px';
    tip.style.top = (y - r.top) + 'px';
  }
  function move(e) { place(e.clientX, e.clientY); }
  function showState(s, e) {
    s.el.classList.add('on');
    tip.innerHTML = '<b></b><span></span>';
    tip.querySelector('b').textContent = s.name;
    tip.querySelector('span').textContent = s.clubs.length ? count(s.clubs.length) + (bm() ? ' menggunakan D-Clix' : ' on D-Clix') : (bm() ? 'Tiada kelab disenaraikan lagi' : 'No clubs listed yet');
    tip.hidden = false; place(e.clientX, e.clientY);
  }
  function showClub(c, s, b, e) {
    s.el.classList.add('on');
    tip.innerHTML = '<b></b><span></span>';
    tip.querySelector('b').textContent = c.name;
    tip.querySelector('span').textContent = s.name;
    tip.hidden = false;
    if (e) place(e.clientX, e.clientY);
    else { var r = b.getBoundingClientRect(); place(r.left + r.width / 2, r.top); }
  }
  function hide() {
    tip.hidden = true;
    MAP.states.forEach(function (s) { s.el.classList.remove('on'); });
  }
  box.addEventListener('pointerleave', hide);
})();
