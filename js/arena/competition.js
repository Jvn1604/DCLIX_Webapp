/* ==========================================================
   Competition portal (D-CLIX Arena)
   competition.html · live.html · club-register.html ·
   player-register.html · dashboard.html
   The sport is passed in the URL:  live.html?sport=karate
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = document.body.getAttribute('data-page');
  var sportId = window.currentSportId();
  var sport = window.getSport(sportId);
  var q = function (p) { return p + '.html?sport=' + sportId; };

  document.addEventListener('DOMContentLoaded', function () {
    // keep sport in links that point to sport pages
    $$('[data-sport-link]').forEach(function (a) { a.setAttribute('href', q(a.getAttribute('data-sport-link'))); });
    renderTicker();
    if (page === 'competition') initLanding();
    if (page === 'live') initLive();
    if (page === 'club') initClub();
    if (page === 'player') initPlayer();
    if (page === 'dashboard') initDashboard();
    window.hydrateIcons();
  });

  function notFound() {
    var m = $('main'); if (m) m.innerHTML = '<div class="empty" style="padding-top:200px">Sport not found. <a class="accent" href="competition.html">Choose a sport</a></div>';
  }

  /* ---------- Live score ticker ---------- */
  var MATCHES = [
    { a: 'Northvale', s: '0 - 0', b: 'Goldbridge', st: "34'", live: true, act: true },
    { a: 'Crestmore', s: '3 - 2', b: 'Portside', st: 'FT' },
    { a: 'Elkwood', s: '1 - 3', b: 'Halton Utd', st: 'FT' },
    { a: 'Ironbrook', s: '2 - 2', b: 'Ashfeld', st: 'FT' },
    { a: 'Stoke City', s: '2 - 1', b: 'Riverside FC', st: "87'", live: true },
    { a: 'Oakridge', s: '1 - 0', b: 'Mapleton', st: "12'", live: true }
  ];
  function renderTicker() {
    var all = MATCHES.concat(MATCHES, MATCHES, MATCHES);
    var html = all.map(function (m) {
      return '<div class="m">' +
        '<span class="tm' + (m.act ? ' act' : '') + '">' + m.a + '</span>' +
        '<span class="sc">' + m.s + '</span><span class="tm">' + m.b + '</span>' +
        '<span class="st' + (m.live ? ' live' : '') + '">' + m.st + '</span></div>';
    }).join('');
    $$('.ticker .track').forEach(function (t) { t.innerHTML = html; });
  }

  /* ---------- Landing: sport selector -> portal options ---------- */
  function initLanding() {
    var selector = $('#sportSelector'), actions = $('#sportActions'), grid = $('#sportGrid');
    grid.innerHTML = window.SPORTS.map(function (s, i) {
      return '<div class="card sport-card" role="button" tabindex="0" data-id="' + s.id + '" style="animation-delay:' + (i * .02) + 's">' +
        '<div class="ic">' + window.icon(s.icon) + '</div><span>' + s.name + '</span></div>';
    }).join('');
    function select(id) {
      var s = window.getSport(id); if (!s) return;
      sportId = id; sport = s;
      history.replaceState(null, '', '?sport=' + id);
      $('#selIcon').innerHTML = window.icon(s.icon);
      $('#selName').textContent = s.name;
      var opts = [
        { l: 'Watch Live Event', d: 'Real-time match tracking and live brackets', i: 'tv', p: 'live' },
        { l: 'New Club Registration', d: 'Register your academy for the upcoming season', i: 'userplus', p: 'club-register' },
        { l: 'Player Registration', d: 'Register athletes and manage team rosters', i: 'users', p: 'player-register' },
        { l: 'Competition Setting', d: 'Admin panel for tournament configuration', i: 'settings', p: 'dashboard' }
      ];
      $('#optGrid').innerHTML = opts.map(function (o) {
        return '<a class="card opt" href="' + o.p + '.html?sport=' + id + '"><div class="l"><div class="icon-box" style="width:64px;height:64px">' + window.icon(o.i, 'w-8') +
          '</div><div><h3>' + o.l + '</h3><p>' + o.d + '</p></div></div><span class="chev">' + window.icon('right') + '</span></a>';
      }).join('');
      selector.classList.add('hidden'); actions.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    grid.addEventListener('click', function (e) { var c = e.target.closest('.sport-card'); if (c) select(c.getAttribute('data-id')); });
    grid.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var c = e.target.closest('.sport-card'); if (c) select(c.getAttribute('data-id')); } });
    $('#changeSport').addEventListener('click', function () {
      history.replaceState(null, '', location.pathname);
      actions.classList.add('hidden'); selector.classList.remove('hidden');
    });
    if (new URLSearchParams(location.search).get('sport')) select(sportId);
    if (location.hash) setTimeout(function () { var el = $(location.hash); if (el) el.scrollIntoView({ behavior: 'smooth' }); }, 50);
  }

  /* ---------- Watch Live ---------- */
  function initLive() {
    if (!sport) return notFound();
    $('#sportIcon').innerHTML = window.icon(sport.icon, 'w-8');
    $('#sportName').textContent = sport.name;
    var live = [
      { cat: 'Senior Male -68kg', court: 'Court 1', p1: ['Alex Johnson', 'Dragon Martial Arts', 12], p2: ['Chen Wei', 'Tiger Elite Academy', 8], st: 'Round 2', t: '01:45' },
      { cat: 'Senior Female -52kg', court: 'Court 2', p1: ['Sarah Miller', 'Phoenix Combat Club', 5], p2: ['Elena Petrova', 'Iron Fist Dojo', 5], st: 'Round 1', t: '00:30' }
    ];
    var sched = [
      { t: '14:30', cat: 'Junior Male -55kg', court: 'Court 1', a: 'Ravi Kumar', b: 'Sofia Rossi', ca: 'Global', cb: 'Elite' },
      { t: '15:00', cat: 'Junior Female -48kg', court: 'Court 3', a: 'Liam Smith', b: 'Yuki Tanaka', ca: 'Rising', cb: 'Shadow' },
      { t: '15:15', cat: 'Cadet Male -45kg', court: 'Court 2', a: 'Omar Hassan', b: 'Isabella Garcia', ca: 'Dragon', cb: 'Phoenix' },
      { t: '16:00', cat: 'Veteran Open Weight', court: 'Court 4', a: 'Noah Williams', b: 'Mila Kunis', ca: 'Iron', cb: 'Elite' }
    ];
    var wins = [
      ['Senior Male -68kg', 'Alex Johnson', 'Dragon MA'], ['Senior Female -52kg', 'Sarah Miller', 'Elite Sports'], ['Junior Male -55kg', 'Noah Williams', 'Tiger Elite']
    ];
    function match(m) {
      return '<div class="card match"><div class="top"><span class="cat">' + m.cat + '</span><span class="court">' + m.court + '</span></div><div class="bd">' +
        '<div class="pl red"><div class="tag">' + window.icon('users') + '</div><div class="side" style="color:#ef4444">RED</div><h3>' + m.p1[0] + '</h3><p>' + m.p1[1] + '</p></div>' +
        '<div><div class="score"><span>' + m.p1[2] + '</span><span>:</span><span>' + m.p2[2] + '</span></div><div class="meta"><span class="pill-live">' + m.st + '</span><span class="tmr">' + window.icon('timer') + m.t + '</span></div></div>' +
        '<div class="pl blue"><div class="tag">' + window.icon('users') + '</div><div class="side" style="color:#3b82f6">BLUE</div><h3>' + m.p2[0] + '</h3><p>' + m.p2[1] + '</p></div></div></div>';
    }
    $('#paneMatches').innerHTML = live.length ? '<div class="stack-g">' + live.map(match).join('') + '</div>' : '<div class="card empty">No active matches at the moment</div>';
    var today = new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'long' });
    $('#paneSchedule').innerHTML = '<div class="sched-head"><h3>Upcoming Bouts</h3><div class="d">Today, ' + today + '</div></div><div class="stack-g">' +
      sched.map(function (m) {
        return '<div class="card bout"><div class="l"><div class="time">' + window.icon('clock') + m.t + '</div><div><div class="cat">' + m.cat + '</div><h4>' + m.a + ' <span>VS</span> ' + m.b +
          '</h4><div class="mt"><span>' + window.icon('mappin') + m.court + '</span><span>' + window.icon('users') + m.ca + ' / ' + m.cb + '</span></div></div></div><span class="muted">' + window.icon('right', 'w-6') + '</span></div>';
      }).join('') + '</div>';
    var ties = [1, 2, 3, 4].map(function (i) { return '<div class="tie"><div><span>Player A' + i + '</span><span>10</span></div><hr><div><span>Player B' + i + '</span><span>8</span></div></div>'; }).join('');
    $('#paneBracket').innerHTML = '<div class="card bracket"><div class="col">' + ties + '</div><div class="col"><div class="ln"></div></div>' +
      '<div class="col">' + [1, 2].map(function () { return '<div class="tie"><div><span>TBD</span><span>–</span></div><hr><div><span>TBD</span><span>–</span></div></div>'; }).join('') + '</div>' +
      '<div class="col"><div class="ln"></div></div><div class="final">' + window.icon('trophy') + '<h4>Grand Final</h4><p>Coming Soon</p></div></div>';
    $('#paneMedals').innerHTML = '<div class="stack-g">' + wins.map(function (w) {
      return '<div class="card win"><div class="medal">' + window.icon('award') + '</div><div><h4>' + w[0] + '</h4><h3>' + w[1] + '</h3><p>' + w[2] + '</p></div>' +
        '<div class="gold">' + window.icon('star') + ' 1st PLACE GOLD ' + window.icon('star') + '</div></div>';
    }).join('') + '</div>';
    $$('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        $$('.tabs button').forEach(function (o) { o.classList.toggle('active', o === b); });
        $$('.tabpane').forEach(function (p) { p.classList.toggle('active', p.id === 'pane' + b.getAttribute('data-tab')); });
      });
    });
  }

  /* ---------- Club registration ---------- */
  function initClub() {
    if (!sport) return notFound();
    $('#clubType').innerHTML = '<option>' + sport.id.toUpperCase() + '-' + sport.name + '</option>';
    var form = $('#clubForm'), modal = $('#successModal');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var pw = $('#pw').value, pw2 = $('#pw2').value;
      if (pw.length < 8) { $('#pw').setCustomValidity('Password must be at least 8 characters'); form.reportValidity(); $('#pw').setCustomValidity(''); return; }
      if (pw !== pw2) { $('#pw2').setCustomValidity('Passwords do not match'); form.reportValidity(); $('#pw2').setCustomValidity(''); return; }
      // TODO: send the club data to your backend here (never store the password in the browser).
      try { localStorage.setItem('dclixClubAccount', JSON.stringify({ clubName: $('#clubName').value, clubCode: $('#clubCode').value, email: $('#clubEmail').value, clubType: sport.id })); } catch (err) {}
      modal.classList.add('show');
      setTimeout(function () { location.href = q('dashboard'); }, 2000);
    });
    $('#cancelBtn').addEventListener('click', function () { location.href = 'competition.html?sport=' + sportId; });
  }

  /* ---------- Player registration ---------- */
  function initPlayer() {
    if (!sport) return notFound();
    $$('.sport-name').forEach(function (e) { e.textContent = sport.name; });
    var T = [
      { name: 'GRAND MASTERS INVITATIONAL CHAMPIONSHIP 2026', date: '15 Mar 2026 – 20 Mar 2026', loc: 'GLOBAL SPORTS ARENA, KUALA LUMPUR' },
      { name: 'ELITE WARRIORS REGIONAL CHALLENGE – SERIES 1', date: '12 Apr 2026 – 14 Apr 2026', loc: 'NORTHERN EXPO CENTER, PENANG' },
      { name: 'NATIONAL COMBAT GAMES & ATHLETE SELECTION 2026', date: '05 May 2026 – 10 May 2026', loc: 'OLYMPIC HUB CENTER, JOHOR BAHRU' }
    ];
    var list = $('#tList'), listView = $('#viewList'), formView = $('#viewForm');
    list.innerHTML = T.map(function (t, i) {
      return '<div class="card t-card2" role="button" tabindex="0" data-i="' + i + '"><div class="icon-box">' + window.icon('trophy', 'w-6') + '</div><div><h3>' + t.name + '</h3>' +
        '<div class="row">' + window.icon('calendar') + '<span>' + t.date + '</span></div><div class="row">' + window.icon('mappin') + '<span>' + t.loc + '</span></div></div>' +
        '<div class="go"><span>Select Tournament</span>' + window.icon('arrowright', 'w-5') + '</div></div>';
    }).join('');
    function open(i) { $('#selName').textContent = T[i].name; listView.classList.add('hidden'); formView.classList.remove('hidden'); window.scrollTo({ top: 0 }); }
    function back() { formView.classList.add('hidden'); listView.classList.remove('hidden'); }
    list.addEventListener('click', function (e) { var c = e.target.closest('.t-card2'); if (c) open(+c.getAttribute('data-i')); });
    list.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var c = e.target.closest('.t-card2'); if (c) open(+c.getAttribute('data-i')); } });
    $$('[data-back]').forEach(function (b) { b.addEventListener('click', back); });
    // stepper: step 3 (Tournament) is active
    var steps = ['Player Info', 'Emergency', 'Tournament'], step = 3;
    $('#stepper').innerHTML = steps.map(function (n, i) {
      var id = i + 1, cls = step > id ? 'done' : step === id ? 'now' : '';
      return '<div class="s"><div class="c ' + cls + '">' + (step > id ? window.icon('check', 'w-4') : id) + '</div><span class="nm' + (step >= id ? ' on' : '') + '">' + n + '</span></div>' +
        (i < steps.length - 1 ? '<div class="ln' + (step > id ? ' on' : '') + '"></div>' : '');
    }).join('');
    $('#playerForm').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!e.target.checkValidity()) { e.target.reportValidity(); return; }
      // TODO: send the form data to your backend here.
      location.href = q('dashboard');
    });
  }

  /* ---------- Dashboard ---------- */
  function initDashboard() {
    var label = sportId.split('-').map(function (p) { return p ? p[0].toUpperCase() + p.slice(1) : p; }).join(' ');
    $$('.sport-label').forEach(function (e) { e.textContent = label; });
    var user = { name: 'User', email: 'user@example.com', phone: 'Not provided', id: '—', idLabel: 'Player ID' };
    try { // set when a club is registered
      var acct = JSON.parse(localStorage.getItem('dclixClubAccount') || 'null');
      if (acct && acct.clubName) { user.name = acct.clubName; user.email = acct.email || user.email; user.id = acct.clubCode || '—'; user.idLabel = 'Club code'; }
    } catch (err) {}
    $('#uName').textContent = user.name;
    $('#hl').innerHTML = [['sparkles', 'Instant registrations', 'Create players and clubs in minutes.'], ['calendardays', 'Fixtures & schedules', 'Keep matches organized and on time.'], ['shieldcheck', 'Secure access', 'Clean, role-ready dashboard structure.']]
      .map(function (h) { return '<div>' + window.icon(h[0]) + '<b>' + h[1] + '</b><span>' + h[2] + '</span></div>'; }).join('');
    $('#fixList').innerHTML = [['No fixtures yet', 'Create fixtures to show match times'], ['No venues yet', 'Add locations to improve planning']]
      .map(function (f) { return '<div class="li"><div><b>' + f[0] + '</b><span>' + f[1] + '</span></div><span class="arr">' + window.icon('right') + '</span></div>'; }).join('');
    $('#annList').innerHTML = [['sparkles', 'Blue theme enabled', 'UI update'], ['trophy', 'Add your first players to unlock registrations', 'Getting started'], ['activity', 'Go live when your fixtures are ready', 'Live activity']]
      .map(function (a) { return '<div class="li"><div class="ib">' + window.icon(a[0]) + '</div><div><b>' + a[1] + '</b><span>' + a[2] + '</span></div></div>'; }).join('');
    $('#nextList').innerHTML = [['Register Players', 'Add athletes to your tournament roster.', 'player-register'], ['Register Clubs', 'Create clubs and assign participants.', 'club-register'], ['Watch Live', 'Follow matches and live updates.', 'live']]
      .map(function (s) { return '<a class="li" style="margin-bottom:12px" href="' + q(s[2]) + '"><div><b>' + s[0] + '</b><span>' + s[1] + '</span></div><span class="arr">' + window.icon('arrowupright') + '</span></a>'; }).join('');
    var rows = [['Name', user.name, 'user'], ['Email', user.email, 'mail'], ['Phone', user.phone, 'phone'], [user.idLabel, user.id, 'hash']];
    $('#infoList').innerHTML = rows
      .map(function (r) { return '<div class="info-row"><div class="k">' + window.icon(r[2]) + r[0] + '</div><p>' + r[1] + '</p></div>'; }).join('');
  }
})();