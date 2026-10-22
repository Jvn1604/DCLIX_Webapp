/* Loaded on demand by main.js. */
(function () {
  'use strict';
  if (window.__fx) { window.__fx(); return; }

  var SRC = (document.currentScript && document.currentScript.src) || '';
  var IMG = SRC.replace(/js\/shared\/fx\.js(\?.*)?$/, 'assets/images/fx-sheet.webp$1');

  // Sprite atlas: [x, y, w, h] for each frame
  var F = {"idle":[[0,0,94,116],[96,0,86,112],[184,0,94,116],[280,0,94,116]],"run":[[376,0,81,116],[459,0,77,116],[538,0,86,116],[626,0,86,116],[714,0,82,116],[798,0,79,116]],"jump":[[879,0,81,96],[0,118,85,107],[87,118,93,124],[182,118,94,130],[278,118,60,107]],"die":[[340,118,81,121],[423,118,112,112],[537,118,120,91],[659,118,133,61],[794,118,128,48],[0,250,111,70]],"spikeG":[[113,250,115,128]],"spikeB":[[230,250,111,99]],"caltrop":[[343,250,103,86]],"trapD":[[448,250,102,56]],"bricks":[[552,250,103,86]],"dummy":[[657,250,69,124]],"barrel":[[728,250,98,90],[828,250,98,90]],"ball":[[928,250,93,86]],"kunai":[[0,380,103,30],[105,380,103,21],[210,380,82,21]],"shuri":[[294,380,107,47],[403,380,56,55]]};

  // Obstacles: sprite, scale, from score, extra speed, spin, flying
  var KINDS = [
    { s: 'caltrop', k: 0.30, at: 0 },
    { s: 'spikeB', k: 0.32, at: 0 },
    { s: 'spikeG', k: 0.34, at: 60 },
    { s: 'trapD', k: 0.40, at: 0 },
    { s: 'bricks', k: 0.36, at: 100 },
    { s: 'dummy', k: 0.38, at: 250 },
    { s: 'barrel', k: 0.36, at: 150, roll: 1.2 },
    { s: 'ball', k: 0.35, at: 200, roll: 1.6, spin: true },
    { s: 'kunai', k: 0.42, at: 300, roll: 2, fly: true },
    { s: 'shuri', k: 0.45, at: 400, roll: 1.5, fly: true, spin: true, f: 1 }
  ];

  var W = 600, H = 170, GROUND = 152, RX = 64, RK = 0.42;
  var GRAV = 0.62, JUMP = -10.6, SPEED0 = 6, SPEEDMAX = 13;
  var HIKEY = 'fx-hi';

  var img = new Image(); img.src = IMG;
  var hi = 0; try { hi = +localStorage.getItem(HIKEY) || 0; } catch (e) {}

  /* ---------- Overlay ---------- */
  var css = document.createElement('style');
  css.textContent =
    '.fx-wrap{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,8,10,.72);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;transition:opacity .2s}' +
    '.fx-wrap.on{opacity:1}' +
    '.fx-box{position:relative;width:100%;max-width:760px;background:#f6f1e8;border:2px solid #de9836;border-radius:18px;padding:14px 14px 10px;box-shadow:0 24px 60px rgba(0,0,0,.45)}' +
    '.fx-box canvas{display:block;width:100%;height:auto;aspect-ratio:600/170;touch-action:manipulation;cursor:pointer;border-radius:10px}' +
    '.fx-x{position:absolute;top:-14px;right:-14px;width:34px;height:34px;border-radius:50%;border:2px solid #de9836;background:#19191b;color:#f5efe6;font:700 18px/1 system-ui,sans-serif;cursor:pointer}' +
    '.fx-x:focus-visible{outline:3px solid #f2b45a;outline-offset:2px}' +
    '.fx-tip{margin:8px 2px 0;font:12px/1.4 system-ui,sans-serif;color:#6b655c;text-align:center}';
  document.head.appendChild(css);

  var wrap = document.createElement('div');
  wrap.className = 'fx-wrap';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-modal', 'true');
  wrap.setAttribute('aria-label', 'Dojo Run');
  wrap.setAttribute('data-no-i18n', '');
  wrap.innerHTML = '<div class="fx-box"><canvas width="600" height="170"></canvas>' +
    '<p class="fx-tip">Space / &uarr; / tap: jump &middot; &darr;: drop faster &middot; Esc: close</p>' +
    '<button type="button" class="fx-x" aria-label="Close">&times;</button></div>';
  var cv = wrap.querySelector('canvas'), ctx = cv.getContext('2d');
  var closeBtn = wrap.querySelector('.fx-x');

  /* ---------- State ---------- */
  var st, raf = 0, last = 0, acc = 0, open = false, back = null, keyDrop = false;

  function reset() {
    st = {
      mode: 'ready', t: 0, speed: SPEED0, dist: 0, score: 0, flash: 0,
      y: 0, vy: 0, air: false, dieT: 0, overAt: 0,
      obs: [], next: 60, ground: 0,
      clouds: [{ x: 120, y: 34 }, { x: 380, y: 22 }, { x: 560, y: 48 }]
    };
  }

  function jump() {
    if (st.mode === 'ready') { st.mode = 'run'; }
    if (st.mode === 'over') { if (performance.now() - st.overAt > 500) { reset(); st.mode = 'run'; } return; }
    if (st.mode === 'run' && !st.air) { st.vy = JUMP; st.air = true; }
  }

  function pick() {
    var ok = KINDS.filter(function (k) { return st.score >= k.at; });
    return ok[Math.floor(Math.random() * ok.length)];
  }

  function spawn() {
    var k = pick(), fr = F[k.s][k.f || 0], w = fr[2] * k.k, h = fr[3] * k.k;
    var o = { k: k, x: W + 10, w: w, h: h, bottom: GROUND, rot: 0 };
    if (k.fly) {
      // low: jump over it; high: stay on the ground and let it pass
      o.bottom = Math.random() < 0.5 ? GROUND - 8 : GROUND - 50;
    }
    st.obs.push(o);
    // frames until the next one: always long enough to land and jump again
    st.next = 62 + Math.round(Math.random() * 55);
  }

  function hit(o) {
    var rw = 22, rh = 42, rx = RX - rw / 2, ry = GROUND - st.y - rh;
    var ix = o.w * 0.18, iy = o.h * 0.2;
    var ox = o.x + ix, oy = o.bottom - o.h + iy, ow = o.w - ix * 2, oh = o.h - iy * 2;
    return rx < ox + ow && rx + rw > ox && ry < oy + oh && ry + rh > oy;
  }

  function step() {
    st.t++;
    if (st.mode === 'ready') return;
    if (st.mode === 'dead') {
      st.dieT++;
      if (st.dieT > 6 * 7) { st.mode = 'over'; st.overAt = performance.now(); }
      return;
    }
    if (st.mode !== 'run') return;

    st.speed = Math.min(SPEEDMAX, st.speed + 0.0015);
    st.dist += st.speed;
    var s = Math.floor(st.dist * 0.025);
    if (Math.floor(s / 100) > Math.floor(st.score / 100)) st.flash = 50;
    st.score = s;
    if (st.flash) st.flash--;
    st.ground = (st.ground + st.speed) % 24;

    // runner
    if (st.air) {
      st.vy += GRAV * (keyDrop ? 2.4 : 1);
      st.y -= st.vy;
      if (st.y <= 0) { st.y = 0; st.vy = 0; st.air = false; }
    }

    // clouds drift slowly
    st.clouds.forEach(function (c) { c.x -= st.speed * 0.12; if (c.x < -60) { c.x = W + Math.random() * 120; c.y = 16 + Math.random() * 40; } });

    // obstacles
    if (--st.next <= 0) spawn();
    for (var i = st.obs.length - 1; i >= 0; i--) {
      var o = st.obs[i];
      o.x -= st.speed + (o.k.roll || 0);
      if (o.k.spin) o.rot -= 0.25;
      if (o.x + o.w < -10) { st.obs.splice(i, 1); continue; }
      if (hit(o)) {
        st.mode = 'dead'; st.dieT = 0;
        if (st.score > hi) { hi = st.score; try { localStorage.setItem(HIKEY, hi); } catch (e) {} }
      }
    }
  }

  /* ---------- Drawing ---------- */
  function sprite(fr, x, bottom, k, rot) {
    var w = fr[2] * k, h = fr[3] * k;
    if (rot) {
      ctx.save(); ctx.translate(x + w / 2, bottom - h / 2); ctx.rotate(rot);
      ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(img, fr[0], fr[1], fr[2], fr[3], x, bottom - h, w, h);
    }
  }

  function runner() {
    var fr;
    if (st.mode === 'ready') fr = F.idle[Math.floor(st.t / 14) % 4];
    else if (st.mode === 'dead' || st.mode === 'over') fr = F.die[Math.min(5, Math.floor(st.dieT / 7))];
    else if (st.air) fr = st.vy < -6 ? F.jump[1] : st.vy < 2 ? F.jump[3] : F.jump[2];
    else fr = F.run[Math.floor(st.dist / 22) % 6];
    sprite(fr, RX - fr[2] * RK / 2, GROUND - st.y + 2, RK);
  }

  function pad(n) { return ('00000' + n).slice(-5); }

  function draw() {
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.fillStyle = '#f6f1e8'; ctx.fillRect(0, 0, W, H);

    // sun and clouds
    ctx.fillStyle = 'rgba(222,152,54,.18)';
    ctx.beginPath(); ctx.arc(440, 44, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e4ddd1';
    st.clouds.forEach(function (c) {
      ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, 7); ctx.arc(c.x + 12, c.y - 5, 10, 0, 7); ctx.arc(c.x + 26, c.y, 8, 0, 7); ctx.fill();
      ctx.fillRect(c.x, c.y, 26, 8);
    });

    // ground: line plus moving pebbles
    ctx.fillStyle = '#2b2925'; ctx.fillRect(0, GROUND, W, 2);
    ctx.fillStyle = '#9d958a';
    for (var x = -st.ground; x < W; x += 24) { ctx.fillRect(x + 3, GROUND + 6, 3, 1); ctx.fillRect(x + 15, GROUND + 11, 2, 1); }

    if (img.complete && img.naturalWidth) {
      st.obs.forEach(function (o) {
        var list = F[o.k.s], fr;
        if (o.k.s === 'kunai') fr = list[Math.floor(st.t / 5) % 2];
        else if (o.k.s === 'barrel') fr = list[Math.floor(st.t / 6) % 2];
        else fr = list[o.k.f || 0];
        var w = fr[2] * o.k.k, h = fr[3] * o.k.k;
        sprite(fr, o.x + (o.w - w), o.bottom, o.k.k, o.k.spin ? o.rot : 0);
      });
      runner();
    }

    // score
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'right'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#8c857a'; ctx.fillText('HI ' + pad(hi), W - 82, 10);
    if (!st.flash || Math.floor(st.flash / 8) % 2) { ctx.fillStyle = '#2b2925'; ctx.fillText(pad(st.score), W - 12, 10); }

    ctx.textAlign = 'center';
    if (st.mode === 'ready') {
      ctx.fillStyle = '#9a5a0b'; ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillText('DOJO RUN', W / 2, 52);
      ctx.fillStyle = '#5f6672'; ctx.font = '12px "Courier New", monospace';
      ctx.fillText('Press Space or tap to start', W / 2, 78);
    } else if (st.mode === 'over') {
      ctx.fillStyle = '#2b2925'; ctx.font = 'bold 18px "Courier New", monospace';
      ctx.fillText('G A M E   O V E R', W / 2, 52);
      ctx.fillStyle = '#5f6672'; ctx.font = '12px "Courier New", monospace';
      ctx.fillText('Space or tap to try again', W / 2, 78);
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    if (!last) last = now;
    acc += Math.min(100, now - last); last = now;
    while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
    draw();
  }

  function size() {
    var r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.width * d * H / W);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  }

  /* ---------- Open / close ---------- */
  var GAME_KEYS = { ' ': 1, Spacebar: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, w: 1, W: 1 };
  function onKey(e) {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') { e.preventDefault(); closeBtn.focus(); return; }
    if (!GAME_KEYS[e.key]) return;
    e.preventDefault(); e.stopPropagation();
    if (e.key === 'ArrowDown') { keyDrop = true; return; }
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { if (!e.repeat) jump(); }
  }
  function onKeyUp(e) { if (e.key === 'ArrowDown') keyDrop = false; }
  // pause while the tab is hidden
  function onVis() {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; acc = 0; }
    else if (open && !raf) raf = requestAnimationFrame(loop);
  }

  function show() {
    if (open) return;
    open = true; back = document.activeElement;
    reset();
    document.body.appendChild(wrap);
    document.documentElement.style.overflow = 'hidden';
    size();
    requestAnimationFrame(function () { wrap.classList.add('on'); });
    closeBtn.focus({ preventScroll: true });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKeyUp, true);
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', onVis);
    last = 0; acc = 0; raf = requestAnimationFrame(loop);
  }

  function close() {
    if (!open) return;
    open = false; keyDrop = false;
    cancelAnimationFrame(raf); raf = 0;
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('keyup', onKeyUp, true);
    window.removeEventListener('resize', size);
    document.removeEventListener('visibilitychange', onVis);
    document.documentElement.style.overflow = '';
    wrap.classList.remove('on');
    setTimeout(function () { wrap.remove(); }, 200);
    if (back && back.focus) back.focus({ preventScroll: true });
  }

  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); jump(); });
  closeBtn.addEventListener('click', close);
  wrap.addEventListener('pointerdown', function (e) { if (e.target === wrap) close(); });

  window.__fx = show;
  show();
})();
