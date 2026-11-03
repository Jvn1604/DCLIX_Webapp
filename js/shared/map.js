/* Club globe (home page): a globe zoomed in on Malaysia.
   Drag to spin it; let go and it glides back to Malaysia. Each state with clubs has a glowing dot:
   click it and the globe turns to that state and the panel shows its clubs.
   Club list: assets/clubs/clubs.js · state outlines: assets/clubs/malaysia-geo.js */
(function () {
  'use strict';
  var box = document.getElementById('clubMap');
  var GEO = window.DCLIX_MY_GEO, clubs = window.DCLIX_CLUBS || [];
  if (!box || !GEO) return;
  var SRC = (document.currentScript && document.currentScript.src) || '';
  var ROOT = SRC.replace(/js\/shared\/map\.js(\?.*)?$/, ''), VER = (SRC.match(/\?v=[^#]*/) || [''])[0];
  var WORLD = null;    // other countries, loaded when the globe first comes into view (assets/clubs/world.js)
  var globe = box.querySelector('.mg-globe'), canvas = globe.querySelector('canvas'), ctx = canvas.getContext('2d');
  var dotsLayer = globe.querySelector('.mg-dots'), panel = box.querySelector('.mg-panel'), more = document.getElementById('clubMore');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var D2R = Math.PI / 180;
  var bm = function () { return document.documentElement.lang === 'ms'; };
  var count = function (n) { return n + (bm() ? ' kelab' : n === 1 ? ' club' : ' clubs'); };

  /* ---------- clubs per state ---------- */
  var ALIAS = { 'malacca': 'melaka', 'pulau pinang': 'penang', 'wp kuala lumpur': 'kuala lumpur', 'kl': 'kuala lumpur' };
  var byName = {}, unplaced = [];
  GEO.forEach(function (s) {
    byName[s.name.toLowerCase()] = s; s.clubs = []; s.ext = 0.05;
    s.rings.forEach(function (r) { r.forEach(function (p) { s.ext = Math.max(s.ext, Math.hypot(p[0] - s.c[0], p[1] - s.c[1])); }); });
  });
  clubs.forEach(function (c) {
    var k = (c.state || '').trim().toLowerCase(); k = ALIAS[k] || k;
    if (byName[k]) byName[k].clubs.push(c); else unplaced.push(c);
  });
  var withClubs = GEO.filter(function (s) { return s.clubs.length; }).sort(function (a, b) { return b.clubs.length - a.clubs.length || a.name.localeCompare(b.name); });
  var max = Math.max.apply(null, GEO.map(function (s) { return s.clubs.length; }).concat(1));

  /* ---------- view: centre (lon, lat) and zoom, easing towards a target ---------- */
  var HOME = { lon: 109.45, lat: 4.3, zoom: 5.7 };          // the whole of Malaysia fills the globe
  var view = { lon: HOME.lon, lat: HOME.lat, zoom: HOME.zoom }, target = { lon: HOME.lon, lat: HOME.lat, zoom: HOME.zoom };
  var selected = null, focus = HOME, dragging = false, last = null, vel = { lon: 0, lat: 0 }, idleAt = 0, raf = 0, onScreen = false, size = 0, dpr = 1;

  function project(lon, lat) {
    var l = (lon - view.lon) * D2R, p = lat * D2R, p0 = view.lat * D2R, R = size / 2 * view.zoom;
    var cosc = Math.sin(p0) * Math.sin(p) + Math.cos(p0) * Math.cos(p) * Math.cos(l);
    var x = R * Math.cos(p) * Math.sin(l), y = -R * (Math.cos(p0) * Math.sin(p) - Math.sin(p0) * Math.cos(p) * Math.cos(l));
    if (cosc < 0) { var k = R / (Math.hypot(x, y) || 1); x *= k; y *= k; }   // behind the globe: pin to the edge
    return [size / 2 + x, size / 2 + y, cosc];
  }

  /* ---------- drawing ---------- */
  function resize() {
    size = Math.round(globe.clientWidth);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = canvas.height = size * dpr;
  }
  function draw() {
    var r = size / 2, R = r * view.zoom;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath(); ctx.arc(r, r, r - 1, 0, 7); ctx.clip();
    // ocean
    var sea = ctx.createRadialGradient(r * .7, r * .6, r * .1, r, r, r * 1.05);
    sea.addColorStop(0, '#1d1a15'); sea.addColorStop(1, '#0b0a09');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, size, size);
    // the sphere's edge when zoomed out
    if (R < r * 1.6) { ctx.beginPath(); ctx.arc(r, r, R, 0, 7); ctx.strokeStyle = 'rgba(222,152,54,.45)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    // graticule
    ctx.strokeStyle = 'rgba(222,152,54,.10)'; ctx.lineWidth = 1;
    var step = view.zoom > 2 ? 5 : 15;
    for (var lo = -180; lo < 180; lo += step) line(function (t) { return [lo, -80 + t * 160]; });
    for (var la = -75; la <= 75; la += step) line(function (t) { return [-180 + t * 360, la]; });
    // other countries: dim outlines; skip any that are out of view
    if (WORLD) {
      var p0 = view.lat * D2R, sp0 = Math.sin(p0), cp0 = Math.cos(p0);
      var reach = view.zoom > 1 ? Math.asin(1 / view.zoom) / D2R : 90;
      ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.strokeStyle = 'rgba(245,239,230,.2)'; ctx.lineWidth = .7;
      ctx.beginPath();
      WORLD.forEach(function (c) {
        var pc = c[1] * D2R, cosd = sp0 * Math.sin(pc) + cp0 * Math.cos(pc) * Math.cos((c[0] - view.lon) * D2R);
        var d = Math.acos(Math.max(-1, Math.min(1, cosd))) / D2R;
        if (d > Math.min(reach, 90) + c[2] + 2) return;
        var f = c[3];
        for (var i = 0; i < f.length; i += 2) { var q = project(f[i], f[i + 1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
        ctx.closePath();
      });
      ctx.fill(); ctx.stroke();
    }
    // states
    GEO.forEach(function (s) {
      var n = s.clubs.length, on = !!selected && selected.indexOf(s) >= 0;
      ctx.beginPath();
      s.rings.forEach(function (ring) {
        var pts = ring.map(function (pt) { return project(pt[0], pt[1]); });
        if (!pts.some(function (q) { return q[2] > 0; })) return;      // fully behind the globe
        pts.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
        ctx.closePath();
      });
      ctx.fillStyle = on ? 'rgba(242,180,90,.92)' : n ? 'rgba(222,152,54,' + (0.3 + 0.45 * n / max).toFixed(2) + ')' : 'rgba(255,255,255,.07)';
      ctx.fill();
      ctx.strokeStyle = on ? '#fbe3a8' : 'rgba(222,152,54,.55)'; ctx.lineWidth = on ? 1.6 : .8; ctx.stroke();
    });
    ctx.restore();
    // glass shading so it reads as a sphere
    var shade = ctx.createRadialGradient(r * .62, r * .5, r * .05, r, r, r);
    shade.addColorStop(0, 'rgba(255,240,210,.10)'); shade.addColorStop(.55, 'rgba(0,0,0,0)'); shade.addColorStop(1, 'rgba(0,0,0,.55)');
    ctx.beginPath(); ctx.arc(r, r, r - 1, 0, 7); ctx.fillStyle = shade; ctx.fill();
    placeDots();
  }
  function line(fn) {
    ctx.beginPath(); var pen = false;
    for (var i = 0; i <= 60; i++) {
      var p = fn(i / 60), q = project(p[0], p[1]);
      if (q[2] <= 0) { pen = false; continue; }
      if (pen) ctx.lineTo(q[0], q[1]); else { ctx.moveTo(q[0], q[1]); pen = true; }
    }
    ctx.stroke();
  }

  /* ---------- state dots ---------- */
  withClubs.forEach(function (s) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mg-dot';
    b.setAttribute('aria-label', s.name + ', ' + count(s.clubs.length));
    b.innerHTML = '<span class="ring"></span><b>' + s.clubs.length + '</b>';
    b.addEventListener('click', function () { select([s]); });
    s.dot = b; dotsLayer.appendChild(b);
  });
  // dots closer than GAP px merge into one cluster dot (KL, Putrajaya, Selangor…); zooming in splits them
  var GAP = 34, pool = [];
  function clusterBtn(i) {
    if (pool[i]) return pool[i];
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'mg-dot many';
    b.innerHTML = '<span class="ring"></span><b></b>';
    b.addEventListener('click', function () { select(b._states); });
    dotsLayer.appendChild(b); pool[i] = b; return b;
  }
  function placeDots() {
    var r = size / 2, pts = [];
    withClubs.forEach(function (s) {
      var q = project(s.c[0], s.c[1]);
      var show = q[2] > 0.15 && Math.hypot(q[0] - r, q[1] - r) < r - 10;
      s.dot.classList.add('off'); s.dot.tabIndex = -1;
      if (show) pts.push({ s: s, x: q[0], y: q[1], used: false });
    });
    // keep merging the two closest dots until none are closer than GAP
    var groups = pts.map(function (p) { return { m: [p], x: p.x, y: p.y }; });
    for (;;) {
      var best = null, bd = GAP;
      for (var i = 0; i < groups.length; i++) for (var j = i + 1; j < groups.length; j++) {
        var d = Math.hypot(groups[i].x - groups[j].x, groups[i].y - groups[j].y);
        if (d < bd) { bd = d; best = [i, j]; }
      }
      if (!best) break;
      var A = groups[best[0]], B = groups.splice(best[1], 1)[0];
      A.m = A.m.concat(B.m);
      A.x = A.m.reduce(function (t, o) { return t + o.x; }, 0) / A.m.length;
      A.y = A.m.reduce(function (t, o) { return t + o.y; }, 0) / A.m.length;
    }
    var used = 0;
    groups.forEach(function (gp) {
      var group = gp.m, x = gp.x, y = gp.y, n = 0;
      group.forEach(function (o) { n += o.s.clubs.length; });
      var btn = group.length === 1 ? group[0].s.dot : clusterBtn(used++);
      if (group.length > 1) {
        btn._states = group.map(function (o) { return o.s; });
        btn.querySelector('b').textContent = n;
        btn.setAttribute('aria-label', btn._states.map(function (o) { return o.name; }).join(', ') + ': ' + count(n));
      }
      btn.style.translate = x.toFixed(1) + 'px ' + y.toFixed(1) + 'px';   // translate (not transform), so the hover/selected scale doesn't shift it
      btn.classList.remove('off'); btn.tabIndex = 0;
      btn.classList.toggle('on', !!selected && group.every(function (o) { return selected.indexOf(o.s) >= 0; }));
    });
    for (var i = used; i < pool.length; i++) { pool[i].classList.add('off'); pool[i].tabIndex = -1; }
  }

  /* ---------- panel ---------- */
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function showAll() {
    panel.innerHTML = '';
    panel.appendChild(el('span', 'mg-kicker', 'Clubs across Malaysia'));
    panel.appendChild(el('h3', null, 'Tap a glowing dot to see the clubs in that state'));
    var list = el('div', 'mg-states');
    withClubs.forEach(function (s) {
      var b = el('button', 'mg-chip'); b.type = 'button';
      b.appendChild(el('span', null, s.name)); b.appendChild(el('b', null, String(s.clubs.length)));
      b.addEventListener('click', function () { select([s]); });
      list.appendChild(b);
    });
    panel.appendChild(list);
    panel.appendChild(el('p', 'mg-hint', 'Drag the globe to spin it, scroll to zoom.'));
  }
  function clubGrid(list) {
    var grid = el('ul', 'mg-clubs');
    list.forEach(function (c, i) {
      var li = el('li'); li.style.animationDelay = (i * 0.06) + 's';
      var pic = el('span', 'pic'), img = el('img');
      img.src = ROOT + c.logo; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
      img.addEventListener('error', function () { pic.textContent = c.name.replace(/[^A-Z]/g, '').slice(0, 2); });
      pic.appendChild(img); li.appendChild(pic); li.appendChild(el('span', 'nm', c.name));
      grid.appendChild(li);
    });
    return grid;
  }
  function showStates(list) {
    panel.innerHTML = '';
    var back = el('button', 'mg-back'); back.type = 'button';
    back.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    back.appendChild(el('span', null, 'All states'));
    back.addEventListener('click', function () { select(null); });
    panel.appendChild(back);
    var total = list.reduce(function (n, o) { return n + o.clubs.length; }, 0);
    panel.appendChild(el('span', 'mg-kicker', count(total) + (bm() ? ' menggunakan D-Clix' : ' on D-Clix')));
    if (list.length === 1) { panel.appendChild(el('h3', 'mg-state', list[0].name)); panel.appendChild(clubGrid(list[0].clubs)); return; }
    panel.appendChild(el('h3', 'mg-state', list.map(function (o) { return o.name; }).join(' · ')));
    list.forEach(function (o) {
      var h = el('h4', 'mg-sub'); h.appendChild(el('span', null, o.name)); h.appendChild(el('b', null, String(o.clubs.length))); panel.appendChild(h);
      panel.appendChild(clubGrid(o.clubs));
    });
  }
  // select(null) = all of Malaysia; select([states]) = turn to them and zoom in until their dots separate
  function select(list) {
    selected = list && list.length ? list : null;
    if (selected) {
      var lon = 0, lat = 0, near = 3;
      selected.forEach(function (o) { lon += o.c[0]; lat += o.c[1]; });
      selected.forEach(function (a) { selected.forEach(function (b) { if (a !== b) near = Math.min(near, Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1])); }); });
      lon /= selected.length; lat /= selected.length;
      var reach = 0; selected.forEach(function (o) { reach = Math.max(reach, Math.hypot(o.c[0] - lon, o.c[1] - lat) + o.ext); });
      var fill = 0.7 / (reach * D2R), apart = selected.length > 1 ? (GAP + 8) / ((size / 2) * near * D2R) : 0;
      focus = { lon: lon, lat: lat, zoom: Math.min(90, Math.max(HOME.zoom, fill, apart)) };
      showStates(selected);
    } else { focus = HOME; showAll(); }
    if (resetBtn) resetBtn.hidden = !selected;
    target.lon = focus.lon; target.lat = focus.lat; target.zoom = focus.zoom;
    vel.lon = vel.lat = 0; idleAt = 0; kick(true);
  }

  /* ---------- drag to spin ----------
     A press only becomes a drag once the pointer moves a few pixels, so a plain click does nothing.
     From the starting view the globe eases out a little while spinning and glides back afterwards;
     once the visitor has zoomed in with the wheel, dragging just pans and the view stays where they leave it. */
  var press = null, dragZoom = 0;
  globe.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.mg-dot, .mg-reset') || e.button > 0) return;
    press = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  globe.addEventListener('pointermove', function (e) {
    if (press && !dragging) {
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) < 6) return;
      dragging = true; last = [press.x, press.y]; vel.lon = vel.lat = 0; idleAt = 0;
      try { globe.setPointerCapture(press.id); } catch (err) {}
      globe.classList.add('grab');
      dragZoom = target.zoom;
      if (!focus.custom) target.zoom = Math.max(MIN_ZOOM, view.zoom * 0.75);
      kick(true);
    }
    if (!dragging) return;
    var R = size / 2 * view.zoom, dx = e.clientX - last[0], dy = e.clientY - last[1];
    last = [e.clientX, e.clientY];
    vel.lon = -dx / R / D2R; vel.lat = dy / R / D2R;
    view.lon += vel.lon; view.lat = Math.max(-70, Math.min(70, view.lat + vel.lat));
    target.lon = view.lon; target.lat = view.lat;
  });
  function release() {
    press = null;
    if (!dragging) return;
    dragging = false; globe.classList.remove('grab');
    if (focus.custom) { target.zoom = dragZoom; focus = { lon: view.lon, lat: view.lat, zoom: dragZoom, custom: true }; vel.lon *= .5; vel.lat *= .5; }
    else idleAt = performance.now() + 900;                       // glide back to Malaysia (or the chosen state)
    kick(true);
  }
  globe.addEventListener('pointerup', release);

  /* ---------- mouse wheel / trackpad: zoom towards the pointer ---------- */
  var MIN_ZOOM = 1.15, MAX_ZOOM = 90;
  // the longitude/latitude under a point on the globe (inverse of project), for view v
  function unproject(px, py, v) {
    var R = size / 2 * v.zoom, x = px - size / 2, y = -(py - size / 2), rho = Math.hypot(x, y);
    if (rho >= R) return null;
    if (rho < 1e-6) return [v.lon, v.lat];
    var c = Math.asin(rho / R), p0 = v.lat * D2R;
    var lat = Math.asin(Math.cos(c) * Math.sin(p0) + y * Math.sin(c) * Math.cos(p0) / rho);
    var lon = v.lon * D2R + Math.atan2(x * Math.sin(c), rho * Math.cos(p0) * Math.cos(c) - y * Math.sin(p0) * Math.sin(c));
    return [lon / D2R, lat / D2R];
  }
  globe.addEventListener('wheel', function (e) {
    var from = target.zoom, to = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, from * Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0015))));
    if (to === from) return;                                     // already fully in or out: let the page scroll
    e.preventDefault();
    var r = globe.getBoundingClientRect(), k = size / r.width, at = unproject((e.clientX - r.left) * k, (e.clientY - r.top) * k, target);   // where the view is heading, so quick scrolls don't drift
    if (at) {                                                    // keep the spot under the pointer in place
      var f = 1 - from / to, dl = ((at[0] - target.lon + 540) % 360) - 180;
      target.lon += dl * f; target.lat = Math.max(-70, Math.min(70, target.lat + (at[1] - target.lat) * f));
    }
    target.zoom = to;
    focus = { lon: target.lon, lat: target.lat, zoom: to, custom: true };   // the visitor's own view: dragging won't snap back
    vel.lon = vel.lat = 0; idleAt = 0; resetBtn.hidden = false; kick(true);
  }, { passive: false });

  // "Reset view" appears once the visitor has zoomed or chosen a state
  var resetBtn = document.createElement('button');
  resetBtn.type = 'button'; resetBtn.className = 'mg-reset'; resetBtn.hidden = true;
  resetBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>Reset view</span>';
  resetBtn.addEventListener('click', function () { select(null); });
  globe.appendChild(resetBtn);
  globe.addEventListener('pointercancel', release);

  /* ---------- animation loop (runs only while something is moving and the globe is on screen) ---------- */
  function tick(t) {
    raf = 0;
    var moving = false;
    if (!dragging) {
      if (Math.abs(vel.lon) + Math.abs(vel.lat) > 0.01) {          // spin on after letting go
        view.lon += vel.lon; view.lat = Math.max(-70, Math.min(70, view.lat + vel.lat));
        vel.lon *= 0.94; vel.lat *= 0.94; target.lon = view.lon; target.lat = view.lat; moving = true;
        if (focus.custom) { focus.lon = view.lon; focus.lat = view.lat; }
      } else if (idleAt && t > idleAt) {
        target.lon = focus.lon; target.lat = focus.lat; target.zoom = focus.zoom; idleAt = 0;
      } else if (idleAt) moving = true;
    }
    // shortest way round in longitude
    var dl = ((target.lon - view.lon + 540) % 360) - 180;
    var e = reduce ? 1 : 0.09;
    view.lon += dl * e; view.lat += (target.lat - view.lat) * e; view.zoom *= Math.pow(target.zoom / view.zoom, reduce ? 1 : 0.1);
    if (Math.abs(dl) > 0.01 || Math.abs(target.lat - view.lat) > 0.01 || Math.abs(target.zoom / view.zoom - 1) > 0.002) moving = true;
    draw();
    if ((moving || dragging) && onScreen) raf = requestAnimationFrame(tick);
  }
  // a click or drag means the globe is in view, even if the browser hasn't reported it yet
  function kick(user) { if (user) onScreen = true; if (!raf && onScreen) raf = requestAnimationFrame(tick); }

  /* ---------- clubs without a state: a row under the globe ---------- */
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

  resize(); showAll(); draw();
  // redraw whenever the globe's size changes (page layout, window resize)
  if ('ResizeObserver' in window) new ResizeObserver(function () { if (Math.round(globe.clientWidth) !== size) { resize(); draw(); } }).observe(globe);
  else window.addEventListener('resize', function () { resize(); draw(); });
  function loadWorld() {
    if (loadWorld.done) return; loadWorld.done = true;
    var sc = document.createElement('script');
    sc.src = ROOT + 'assets/clubs/world.js' + VER;
    sc.onload = function () { WORLD = window.DCLIX_WORLD || null; draw(); };
    document.head.appendChild(sc);
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { onScreen = en[0].isIntersecting; if (onScreen) { loadWorld(); kick(); } }, { rootMargin: '300px' }).observe(globe);
  else { onScreen = true; loadWorld(); }
})();
