/* ==========================================================
   D-Clix Admin — Signup Automation
   One place to watch the website signup automation:
   funnel, live activity, system health, every signup's full
   timeline and data, plus a "Simulate signup" tool that runs
   the real flow against the test payment gateway.
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, M = A.M, C = M.C, FL = M.FL, esc = A.esc, $ = A.$, $$ = A.$$;
  function D() { return DB.data; }
  function arr(k) { return D()[k] || []; }
  var STAGES = ['Registered', 'Reached payment', 'Paid', 'Logged in', 'Set up club'];

  /* ---------- Everything we know about one signup ---------- */
  M.leadBundle = function (l) {
    var subs = arr('subscriptions').filter(function (s) { return s.leadId === l.id; });
    var subIds = subs.map(function (s) { return s.id; });
    var user = l.userId ? A.byId('users', l.userId) : null;
    var club = l.clubId ? A.byId('clubs', l.clubId) : null;
    var count = function (k) { return l.clubId ? arr(k).filter(function (x) { return x.clubId === l.clubId; }).length : 0; };
    return {
      lead: l, user: user, club: club, subs: subs,
      bills: arr('bills').filter(function (b) { return b.leadId === l.id; }),
      emails: arr('emails').filter(function (e) { return e.relatedId === l.id || subIds.indexOf(e.relatedId) >= 0 || (user && e.relatedId === user.id); }),
      logins: user ? arr('logins').filter(function (x) { return String(x.email).toLowerCase() === user.email.toLowerCase(); }) : [],
      audit: arr('audit').filter(function (a) { return a.recordId === l.id || subIds.indexOf(a.recordId) >= 0 || (l.clubId && a.recordId === l.clubId) || (user && a.recordId === user.id); }),
      centres: count('centres'), students: count('students'), instructors: count('instructors'), classes: count('classes')
    };
  };
  /* How far a signup got: 1 Registered … 5 Set up club */
  M.leadStage = function (l, b) {
    b = b || M.leadBundle(l);
    var paid = l.status === 'Paid' || l.status === 'Converted' || b.subs.some(function (s) { return s.status === 'Paid'; });
    var reached = paid || b.subs.length > 0 || b.bills.length > 0;
    var logged = !!(b.user && b.user.lastLogin) || b.logins.some(function (x) { return x.ok; });
    var setup = b.students + b.instructors + b.classes > 0;
    var done = [true, reached, paid, paid && logged, paid && setup];
    var n = 0; while (n < done.length && done[n]) n++;
    return { done: done, n: n, label: STAGES[Math.max(0, n - 1)], paid: paid, reached: reached, logged: logged, setup: setup };
  };
  M.stageChips = function (l) {
    var st = M.leadStage(l);
    return '<span class="a-chips" title="' + esc(st.label) + '">' + STAGES.map(function (s, i) { return '<i class="' + (st.done[i] ? 'on' : '') + '" title="' + esc(s) + (st.done[i] ? ' ✓' : '') + '"></i>'; }).join('') + '</span>';
  };
  function paidAt(b) { var s = b.subs.filter(function (x) { return x.status === 'Paid'; })[0]; return s ? s.paidAt : (b.lead.paidAt || ''); }
  function minutesBetween(a, b) { return Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000)); }
  function dur(mins) { if (mins == null) return '—'; if (mins < 60) return mins + ' min'; if (mins < 1440) return Math.round(mins / 6) / 10 + ' h'; return Math.round(mins / 144) / 10 + ' days'; }
  function ago(t) { if (!t) return 'never'; var m = minutesBetween(t, new Date()); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }

  /* ---------- Timeline of one signup ---------- */
  M.leadTimeline = function (b) {
    var l = b.lead, ev = [];
    function add(at, icon, kind, title, detail, link) { if (at) ev.push({ at: at, icon: icon, kind: kind, title: title, detail: detail || '', link: link || '', lead: l }); }
    add(l.createdAt, 'userplus', 'info', 'Registered on the website', (l.planName || '') + ' · ' + (l.billing || '') + ' · ' + (l.email || '') + (l.source === 'Simulated test' ? ' · simulated test' : ''));
    if (b.user) add(l.createdAt, 'key', 'neutral', 'Club Admin login created', b.user.email + ' (' + b.user.status + ')');
    if (b.club) add(l.createdAt, 'building', 'neutral', 'Club account created', b.club.name + ' · ' + b.club.id);
    b.subs.forEach(function (s) { add(s.createdAt, 'file', 'neutral', 'Invoice ' + s.invoiceNo + ' issued', A.money(s.total) + ' · ' + s.planName + ' (' + s.billing + ')'); });
    b.bills.slice().reverse().forEach(function (x, i, all) {
      add(x.createdAt, 'card', 'neutral', 'Sent to payment page', 'Attempt ' + (i + 1) + ' · ' + A.money(x.amount) + ' · ' + (x.gateway === 'mock' ? 'test gateway' : 'Billplz ' + x.gateway) + ' · bill ' + x.id);
      if (x.paid) add(x.paidAt || x.processedAt, 'checkcircle', 'ok', 'Payment successful', A.money(x.amount) + ' · bill ' + x.id);
      else if (i < all.length - 1 || l.status === 'Payment Failed') add(x.createdAt, 'x', 'bad', 'Payment not completed', 'Cancelled or failed at the gateway · bill ' + x.id);
    });
    b.subs.filter(function (s) { return s.status === 'Paid'; }).forEach(function (s) {
      add(s.paidAt, 'zap', 'ok', 'Club activated automatically', 'Plan ' + s.planName + ' until ' + A.date(s.periodEnd) + ' · receipt ' + s.receiptNo + (b.centres ? ' · Main Centre created' : ''));
    });
    b.emails.forEach(function (e) { add(e.createdAt, 'mail', e.status === 'failed' ? 'bad' : 'neutral', 'Email: ' + e.subject, 'To ' + e.to + ' · ' + e.status + (e.error ? ' · ' + e.error : ''), 'email:' + e.id); });
    b.logins.forEach(function (x) { add(x.at, x.ok ? 'logout' : 'alert', x.ok ? 'ok' : 'warn', x.ok ? 'Client logged in' : 'Login problem', x.reason + (x.ip ? ' · IP ' + x.ip : '')); });
    b.audit.filter(function (a) { return a.userId && a.action !== 'Login' && a.action !== 'Logout'; }).forEach(function (a) { add(a.at, 'history', 'neutral', a.user + ' · ' + a.action.toLowerCase() + ' ' + a.module, a.summary || a.changes.map(function (c) { return c.field + ': ' + (c.from || '—') + ' → ' + (c.to || '—'); }).join('; ')); });
    ev.sort(function (x, y) { return new Date(x.at) - new Date(y.at); });
    return ev;
  };
  function timelineHTML(ev, opts) {
    opts = opts || {};
    if (!ev.length) return '<div class="a-empty">' + A.icon('history', 'w-8') + '<b>Nothing yet.</b></div>';
    return '<ul class="a-tl">' + ev.map(function (e) {
      return '<li class="' + e.kind + '"><span class="dot">' + A.icon(e.icon) + '</span><div><b>' + esc(e.title) + '</b>' + (opts.showLead ? ' <a class="a-link" href="#/leads/' + esc(e.lead.id) + '">' + esc(e.lead.clubName) + '</a>' : '') +
        '<small>' + esc(e.detail) + '</small><time>' + A.datetime(e.at) + '</time></div>' + (e.link ? '<button type="button" class="a-btn ghost sm" data-email-id="' + esc(e.link.slice(6)) + '">View</button>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function wireEmailButtons(host) {
    host.addEventListener('click', function (ev) { var b = ev.target.closest('[data-email-id]'); if (!b) return; var e = arr('emails').filter(function (x) { return x.id === b.getAttribute('data-email-id'); })[0]; if (e) M.showEmail(e); });
  }

  /* ======================================================
     LEAD DETAIL — everything about one signup
     ====================================================== */
  function waLink(p) { var d = String(p || '').replace(/\D/g, ''); if (d.indexOf('0') === 0) d = '6' + d; return d.length >= 9 ? 'https://wa.me/' + d : ''; }
  M.leadDetail = function (main, l, view) {
    var b = M.leadBundle(l), st = M.leadStage(l, b), bi = l.billingInfo || {}, pAt = paidAt(b);
    var steps = STAGES.map(function (s, i) { return '<li class="' + (st.done[i] ? 'on' : '') + '"><span>' + (st.done[i] ? A.icon('check') : i + 1) + '</span>' + esc(s) + '</li>'; }).join('');
    main.innerHTML = M.detailHead('leads', 'All leads', l.clubName, l.id + ' · ' + (l.source || '') + ' · registered ' + A.datetime(l.createdAt),
      (waLink(l.phone) ? '<a class="a-btn ghost" target="_blank" rel="noopener" href="' + waLink(l.phone) + '">' + A.icon('phone') + 'WhatsApp</a>' : '') +
      (l.email ? '<a class="a-btn ghost" href="mailto:' + esc(l.email) + '">' + A.icon('mail') + 'Email</a>' : '') +
      (A.can('leads', 'edit') ? A.btn('Update lead', 'edit', 'data-edit') : '')) +
      '<ol class="a-steps">' + steps + '</ol>' +
      '<div class="a-stats">' + A.statCard('Status', A.badge(l.status), 'info', l.assignedTo ? 'assigned to ' + esc(l.assignedTo) : 'not assigned') +
      A.statCard('Amount', A.money(l.amount), 'card', esc((l.planName || '') + ' · ' + (l.billing || ''))) +
      A.statCard('Payment attempts', A.num(b.bills.length), 'refresh', b.bills.filter(function (x) { return x.paid; }).length + ' paid') +
      A.statCard('Time to pay', pAt ? dur(minutesBetween(l.createdAt, pAt)) : '—', 'clock', pAt ? 'paid ' + A.datetime(pAt) : 'not paid yet') +
      A.statCard('Emails', A.num(b.emails.length), 'mail', b.emails.filter(function (e) { return e.status === 'failed'; }).length + ' failed') +
      A.statCard('Client logins', A.num(b.logins.filter(function (x) { return x.ok; }).length), 'key', b.user && b.user.lastLogin ? 'last ' + ago(b.user.lastLogin) : 'not logged in yet') + '</div><div data-tabs></div>';
    var e = $('[data-edit]', main); if (e) e.addEventListener('click', function () { view.openEdit(l, A.refresh); });
    A.tabs($('[data-tabs]', main), [
      { label: 'Overview', icon: 'info', render: function (h) {
        h.innerHTML = '<div class="a-grid2">' +
          A.panel('Registration form', A.dl([['Club name', esc(l.clubName)], ['Club code', esc(l.clubCode)], ['Head instructor / contact', esc(l.contactName)], ['Sport / club type', esc(l.sport)], ['Email (login)', esc(l.email)], ['Phone / WhatsApp', esc(l.phone)], ['Address', esc(l.address)], ['State', esc(l.state)], ['Country', esc(l.country)], ['Plan chosen', esc((l.planName || '') + ' · ' + (l.billing || ''))], ['Terms accepted', l.termsAcceptedAt ? A.datetime(l.termsAcceptedAt) + (l.termsAcceptedIp ? ' · IP ' + esc(l.termsAcceptedIp) : '') : '<span class="muted">not yet (accepted on the payment page)</span>'], ['Registered at', A.datetime(l.createdAt)], ['From IP', esc(l.ip)]])) +
          A.panel('Billing details (payment page)', l.billingInfo ? A.dl([['Name', esc([bi.firstName, bi.lastName].filter(Boolean).join(' '))], ['Company', esc(bi.company)], ['Email', esc(bi.email)], ['Phone', esc(bi.phone)], ['Address', esc(bi.address)], ['Zip / City', esc([bi.zip, bi.city].filter(Boolean).join(' '))], ['Country', esc(bi.country)]]) : '<p class="muted">The client has not reached the payment page yet.</p>') +
          A.panel('Sales follow-up', A.dl([['Status', A.badge(l.status)], ['Assigned to', esc(l.assignedTo)], ['Next follow-up', A.date(l.followUp)]]) + (l.notes ? '<div class="a-msg">' + esc(l.notes) + '</div>' : '<p class="muted" style="margin-top:10px">No notes yet. Use “Update lead” to add notes.</p>')) +
          A.panel('What the automation created', A.dl([
            ['Club account', b.club ? '<a class="a-link" href="#/clubs/' + esc(b.club.id) + '">' + esc(b.club.name) + '</a> ' + A.badge(b.club.status) : ''],
            ['Subscription', b.club && b.club.subEnd ? esc(b.club.plan + ' · ' + A.date(b.club.subStart) + ' – ' + A.date(b.club.subEnd)) : ''],
            ['Club Admin login', b.user ? esc(b.user.email) + ' ' + A.badge(b.user.status) : ''], ['Last login', b.user && b.user.lastLogin ? A.datetime(b.user.lastLogin) : 'never'],
            ['Training centres', A.num(b.centres)], ['Instructors / students', A.num(b.instructors) + ' / ' + A.num(b.students)]])) + '</div>';
      } },
      { label: 'Timeline', icon: 'history', render: function (h) { h.innerHTML = '<div class="a-card pad">' + timelineHTML(M.leadTimeline(b)) + '</div>'; wireEmailButtons(h); } },
      { label: 'Payments', icon: 'card', count: b.bills.length, render: function (h) {
        h.innerHTML = '<div data-subs></div><h3 class="a-sub-h">Payment attempts</h3><div data-bills></div>';
        M.subTable($('[data-subs]', h), { rows: function () { return b.subs; }, cols: [C.text('invoiceNo', 'Invoice'), C.calc('c', 'Created', function (s) { return A.datetime(s.createdAt); }), C.text('planName', 'Plan'), C.text('billing', 'Billing'), C.money('price', 'Price'), C.money('fee', 'Fee'), C.money('total', 'Total'), C.status(), C.text('receiptNo', 'Receipt')], onRow: M.showSubscription, exportName: l.clubName + ' invoices', empty: 'No invoice yet — the client has not reached the payment page.' });
        M.subTable($('[data-bills]', h), { rows: function () { return b.bills; }, cols: [C.id, C.calc('c', 'Created', function (x) { return A.datetime(x.createdAt); }), C.money('amount', 'Amount'), C.calc('g', 'Gateway', function (x) { return x.gateway === 'mock' ? 'Test gateway' : 'Billplz ' + x.gateway; }), { k: 'paid', l: 'Result', fmt: function (x) { return A.badge(x.paid ? 'Paid' : 'Not paid'); }, text: function (x) { return x.paid ? 'Paid' : 'Not paid'; } }, C.calc('p', 'Paid at', function (x) { return x.paidAt ? A.datetime(x.paidAt) : ''; }), C.text('subscriptionId', 'Invoice ref')], exportName: l.clubName + ' payment attempts', empty: 'No payment attempts.' });
      } },
      { label: 'Emails', icon: 'mail', count: b.emails.length, render: function (h) { M.subTable(h, { rows: function () { return b.emails; }, defaultSort: { k: 'at', dir: -1 }, cols: [C.calc('at', 'Date', function (x) { return A.datetime(x.createdAt); }), C.text('kind', 'Type'), C.text('to', 'To'), C.text('subject', 'Subject'), C.status()], onRow: M.showEmail, exportName: l.clubName + ' emails', empty: 'No emails yet.' }); } },
      { label: 'Logins', icon: 'key', count: b.logins.length, render: function (h) { M.subTable(h, { rows: function () { return b.logins.map(function (x, i) { return Object.assign({ id: 'L' + i, result: x.ok ? 'Success' : 'Failed' }, x); }); }, defaultSort: { k: 'at', dir: -1 }, cols: [C.calc('at', 'Date', function (x) { return A.datetime(x.at); }), C.status('result', 'Result'), C.text('reason', 'Detail'), C.text('ip', 'IP'), C.text('agent', 'Browser')], exportName: l.clubName + ' logins', empty: 'The client has not tried to log in yet.' }); } },
      { label: 'Raw data', icon: 'database', render: function (h) {
        var clean = function (u) { if (!u) return null; var c = Object.assign({}, u); if (c.photo) c.photo = '(image)'; return c; };
        var blocks = [['Lead', l], ['Club', b.club], ['Club Admin login', clean(b.user)], ['Invoices', b.subs], ['Payment attempts', b.bills]];
        h.innerHTML = '<p class="muted">Exactly what is stored in the database for this signup (passwords are never stored in readable form).</p>' + blocks.map(function (x) { return '<details class="a-raw"' + (x[0] === 'Lead' ? ' open' : '') + '><summary>' + esc(x[0]) + '</summary><pre>' + esc(JSON.stringify(x[1], null, 2)) + '</pre></details>'; }).join('');
      } }
    ]);
  };

  /* ======================================================
     AUTOMATION DASHBOARD
     ====================================================== */
  var PERIODS = [[7, 'Last 7 days'], [30, 'Last 30 days'], [90, 'Last 90 days'], [365, 'Last 12 months'], [0, 'All time']];
  var pref = { period: 30, auto: true };
  try { var saved = JSON.parse(localStorage.getItem('dclix_automation_pref') || 'null'); if (saved) pref = Object.assign(pref, saved); } catch (e) {}
  function savePref() { try { localStorage.setItem('dclix_automation_pref', JSON.stringify(pref)); } catch (e) {} }
  var timer = null;

  A.views.automation = { title: 'Signup Automation', navTitle: 'Automation', group: 'Sales', icon: 'zap', perm: 'leads', render: function (main) {
    clearInterval(timer);
    var server = D().server || {};
    var testMode = DB.mode === 'api' && server.payments === 'mock' && M.isSuper();
    main.innerHTML = A.pageHead('Signup Automation', 'Website → registration → payment → automatic activation → emails. Everything the automation did, live.',
      '<label class="a-inline">Period <select class="a-input sm" id="auPeriod">' + PERIODS.map(function (p) { return '<option value="' + p[0] + '"' + (pref.period === p[0] ? ' selected' : '') + '>' + p[1] + '</option>'; }).join('') + '</select></label>' +
      (DB.mode === 'api' ? '<label class="a-switch sm"><input type="checkbox" id="auAuto"' + (pref.auto ? ' checked' : '') + ' /><span></span> Auto-refresh</label>' + A.btn('Refresh', 'refresh', 'data-refresh', 'ghost') : '') +
      (testMode ? A.btn('Simulate signup', 'zap', 'data-sim') : '')) +
      '<div data-body></div>';
    $('#auPeriod', main).addEventListener('change', function (e) { pref.period = +e.target.value; savePref(); draw(); });
    var auto = $('#auAuto', main);
    if (auto) auto.addEventListener('change', function () { pref.auto = auto.checked; savePref(); schedule(); });
    var rb = $('[data-refresh]', main); if (rb) rb.addEventListener('click', function () { reload(true); });
    var sb = $('[data-sim]', main); if (sb) sb.addEventListener('click', openSimulator);
    function reload(manual) {
      if (DB.pending() || document.querySelector('.a-modal-wrap')) return;
      DB.bootstrap().then(function () { A.updateBadges(); if (document.body.contains(main)) draw(); if (manual) A.toast('Up to date.'); }, function (err) { if (err.status === 401) A.endSession((err.data && err.data.reason) || 'expired'); else if (manual) A.toast(err.message, 'error'); });
    }
    function schedule() {
      clearInterval(timer);
      if (pref.auto && DB.mode === 'api') timer = setInterval(function () { if (!document.body.contains(main)) { clearInterval(timer); return; } if (document.visibilityState === 'visible') reload(false); }, 20000);
    }
    schedule();
    draw();

    function draw() {
      var host = $('[data-body]', main);
      var since = pref.period ? DB.iso(DB.addDays(new Date(), -pref.period + 1)) : '0000';
      var all = A.rows('leads').filter(function (l) { return l.source !== 'Manual' && l.source !== 'Contact form'; });
      var enquiries = A.rows('leads').filter(function (l) { return l.source === 'Contact form' && String(l.createdAt).slice(0, 10) >= since; });
      var leads = all.filter(function (l) { return String(l.createdAt).slice(0, 10) >= since; });
      var info = leads.map(function (l) { var b = M.leadBundle(l); return { l: l, b: b, s: M.leadStage(l, b) }; });
      var paid = info.filter(function (x) { return x.s.paid; });
      var subsPaid = arr('subscriptions').filter(function (s) { return s.status === 'Paid' && String(s.paidAt).slice(0, 10) >= since; });
      var bills = arr('bills').filter(function (x) { return String(x.createdAt).slice(0, 10) >= since; });
      var failedAttempts = bills.filter(function (x) { return !x.paid; }).length;
      var times = paid.map(function (x) { var p = paidAt(x.b); return p ? minutesBetween(x.l.createdAt, p) : null; }).filter(function (v) { return v != null; });
      var avg = times.length ? Math.round(A.sum(times, function (v) { return v; }) / times.length) : null;
      var waiting = all.filter(function (l) { return ['New', 'Payment Pending', 'Payment Failed'].indexOf(l.status) >= 0; });
      var stuck = waiting.filter(function (l) { return minutesBetween(l.createdAt, new Date()) > 1440; });
      var emails = arr('emails').filter(function (e) { return String(e.createdAt).slice(0, 10) >= since; });
      var server = D().server || {};
      var lastLead = all.slice().sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })[0];
      var lastPay = arr('subscriptions').filter(function (s) { return s.status === 'Paid'; }).sort(function (a, b) { return a.paidAt < b.paidAt ? 1 : -1; })[0];
      var failedEmails = arr('emails').filter(function (e) { return e.status === 'failed'; }).length;

      var health = [
        ['Server', DB.mode === 'api' ? 'Connected' : 'Offline demo', DB.mode === 'api' ? 'ok' : 'warn', DB.mode === 'api' ? 'data saved in MySQL' : 'data only in this browser'],
        ['Payments', server.payments === 'mock' ? 'Test gateway' : server.payments === 'sandbox' ? 'Billplz sandbox' : server.payments === 'live' ? 'Billplz live' : '—', server.payments === 'live' ? 'ok' : 'warn', server.payments === 'live' ? 'real payments' : 'no real money'],
        ['Emails', server.mail === 'smtp' ? 'Sending (SMTP)' : 'Logged only', server.mail === 'smtp' ? (failedEmails ? 'bad' : 'ok') : 'warn', server.mail === 'smtp' ? failedEmails + ' failed' : 'see Email Log'],
        ['Last signup', lastLead ? ago(lastLead.createdAt) : 'none yet', 'neutral', lastLead ? esc(lastLead.clubName) : ''],
        ['Last payment', lastPay ? ago(lastPay.paidAt) : 'none yet', 'neutral', lastPay ? A.money(lastPay.total) : ''],
        ['Stuck > 24 h', A.num(stuck.length), stuck.length ? 'bad' : 'ok', stuck.length ? 'registered but not paid' : 'none']
      ];
      var funnel = STAGES.map(function (s, i) { var n = info.filter(function (x) { return x.s.done[i]; }).length; return { label: s, value: n, pct: info.length ? Math.round(100 * n / info.length) : 0 }; });

      // signups per day (or per month for long periods)
      var byMonth = !pref.period || pref.period > 90;
      var keys = [];
      if (byMonth) keys = A.lastMonths(pref.period ? 12 : 12);
      else for (var i = Math.min(pref.period, 30) - 1; i >= 0; i--) keys.push(DB.iso(DB.addDays(new Date(), -i)));
      var keyOf = function (t) { return byMonth ? String(t).slice(0, 7) : String(t).slice(0, 10); };
      var allInfo = all.map(function (l) { return { l: l, s: M.leadStage(l) }; });
      var chartPaid = keys.map(function (k) { return allInfo.filter(function (x) { return keyOf(x.l.createdAt) === k && x.s.paid; }).length; });
      var chartUnpaid = keys.map(function (k) { return allInfo.filter(function (x) { return keyOf(x.l.createdAt) === k && !x.s.paid; }).length; });
      var labels = keys.map(function (k) { return byMonth ? A.monthLabel(k) : k.slice(8) + '/' + k.slice(5, 7); });

      var mix = function (key, names) { var m = {}; leads.forEach(function (l) { var k = l[key] || '—'; m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return { label: names ? names[k] || k : k, value: m[k] }; }).sort(function (a, b) { return b.value - a.value; }); };
      var feed = [];
      info.forEach(function (x) { M.leadTimeline(x.b).forEach(function (e) { if (e.icon !== 'history') feed.push(e); }); });
      feed.sort(function (a, b) { return new Date(b.at) - new Date(a.at); });

      host.innerHTML =
        (DB.mode !== 'api' ? '<p class="a-warn">' + A.icon('info') + ' Test mode (no server): this shows website signups made in <b>this browser</b>. For shared data across testers, connect the real API (PRODUCTION_API in js/shared/config.js).</p>' : '') +
        '<div class="a-health">' + health.map(function (h) { return '<div class="' + h[2] + '"><span>' + esc(h[0]) + '</span><b>' + h[1] + '</b><small>' + h[3] + '</small></div>'; }).join('') + '</div>' +
        '<div class="a-stats">' +
          A.statCard('Signups', A.num(info.length), 'userplus', PERIODS.filter(function (p) { return p[0] === pref.period; })[0][1].toLowerCase(), '#/leads') +
          A.statCard('Reached payment', A.num(info.filter(function (x) { return x.s.reached; }).length), 'card', funnel[1].pct + '% of signups') +
          A.statCard('Paid & activated', A.num(paid.length), 'checkcircle', funnel[2].pct + '% conversion') +
          A.statCard('Revenue', A.money(A.sum(subsPaid, 'total')), 'wallet', subsPaid.length + ' payments', '#/subscriptions') +
          A.statCard('Average time to pay', dur(avg), 'clock', times.length ? 'from registration to payment' : 'no payments yet') +
          A.statCard('Unpaid payment attempts', A.num(failedAttempts), 'alert', 'cancelled or left · ' + bills.length + ' attempts in total') +
          A.statCard('Waiting for payment', A.num(waiting.length), 'phone', 'needs sales follow-up', '#/leads') +
          A.statCard('Emails', A.num(emails.length), 'mail', emails.filter(function (e) { return e.status === 'failed'; }).length + ' failed', '#/emails') +
          A.statCard('Contact enquiries', A.num(enquiries.length), 'phone', enquiries.filter(function (l) { return l.status === 'New'; }).length + ' not contacted yet', '#/leads') +
        '</div>' +
        '<div class="a-grid2">' +
          A.panel('Conversion funnel', '<div class="a-funnel">' + funnel.map(function (f, i) { return '<div class="row"><span class="l">' + esc(f.label) + '</span><span class="bar"><i style="width:' + Math.max(f.pct, f.value ? 3 : 0) + '%;opacity:' + (1 - i * 0.13) + '"></i></span><b>' + f.value + '</b><em>' + f.pct + '%</em></div>'; }).join('') + '</div>') +
          A.panel(byMonth ? 'Signups per month' : 'Signups per day', A.chart({ type: 'stacked', labels: labels, series: [{ name: 'Paid', values: chartPaid, color: '#10b981' }, { name: 'Not paid', values: chartUnpaid, color: '#f97316' }], title: 'Signups' })) +
          A.panel('Plans chosen', leads.length ? A.donut(mix('planName'), { center: 'signups' }) : '<p class="muted">No signups in this period.</p>') +
          A.panel('Billing cycle & sport', leads.length ? '<h4 class="a-mini-h">Billing cycle</h4>' + A.hbars(mix('billing'), { colorIdx: 1 }) + '<h4 class="a-mini-h">Sport</h4>' + A.hbars(mix('sport'), { colorIdx: 2 }) : '<p class="muted">No signups in this period.</p>') +
        '</div>' +
        '<div class="a-grid2">' +
          A.panel('Live activity', '<div class="a-feed">' + timelineHTML(feed.slice(0, 30), { showLead: true }) + '</div>', '<span class="muted">' + (pref.auto && DB.mode === 'api' ? 'refreshes every 20 s' : '') + '</span>') +
          A.panel('Needs attention', attention(stuck, waiting, failedEmails)) +
        '</div>' +
        '<section class="a-panel"><div class="a-panel-h"><h3>Every signup in this period</h3>' + (testMode ? '<button type="button" class="a-btn ghost sm" data-purge>' + A.icon('trash') + 'Remove simulated tests</button>' : '') + '</div><div class="a-panel-b" data-pipe></div></section>';
      wireEmailButtons(host);
      var pb = $('[data-purge]', host); if (pb) pb.addEventListener('click', purgeTests);
      M.table($('[data-pipe]', host), {
        rows: function () { return info.map(function (x) { return Object.assign({ _st: x.s, _b: x.b }, x.l); }); }, defaultSort: { k: 'createdAt', dir: -1 },
        search: function (r) { return [r.id, r.clubName, r.clubCode, r.contactName, r.email, r.phone].join(' '); },
        filters: [FL.status(['New', 'Payment Pending', 'Payment Failed', 'Paid', 'Contacted', 'Follow-up', 'Converted', 'Lost']), { k: 'stage', l: 'Furthest step', opts: STAGES, val: function (r) { return r._st.label; } }, FL.plain('source', 'Source'), FL.plain('planName', 'Plan')],
        cols: [C.calc('createdAt', 'Registered', function (r) { return A.datetime(r.createdAt); }), { k: 'clubName', l: 'Club', fmt: function (r) { return '<b>' + esc(r.clubName) + '</b>' + (r.source === 'Simulated test' ? ' <span class="a-badge info">test</span>' : ''); }, text: function (r) { return r.clubName; } },
          C.text('contactName', 'Contact'), C.text('email', 'Email'), C.calc('plan', 'Plan', function (r) { return (r.planName || '') + ' · ' + (r.billing || ''); }), C.money('amount', 'Amount'),
          { k: 'stage', l: 'Progress', fmt: function (r) { return M.stageChips(r) + ' <small class="muted">' + esc(r._st.label) + '</small>'; }, sort: function (r) { return r._st.n; }, text: function (r) { return r._st.label; } },
          C.calc('attempts', 'Attempts', function (r) { return r._b.bills.length; }, 'num'), C.calc('ttp', 'Time to pay', function (r) { var p = paidAt(r._b); return p ? dur(minutesBetween(r.createdAt, p)) : '—'; }),
          C.calc('emails', 'Emails', function (r) { return r._b.emails.length; }, 'num'), C.status()],
        onRow: function (r) { A.go('#/leads/' + encodeURIComponent(r.id)); }, exportName: 'Website signups', canExport: A.can('leads', 'export'), pageSize: 10,
        empty: testMode ? 'No signups yet. Use “Simulate signup” or register on the website to see the automation work.' : 'No signups in this period.'
      });
      window.hydrateIcons(host);
    }
    function attention(stuck, waiting, failedEmails) {
      var items = [];
      stuck.slice(0, 6).forEach(function (l) { items.push('<li><a href="#/leads/' + esc(l.id) + '">' + A.icon('clock', 'w-5') + '<span><b>' + esc(l.clubName) + '</b><small>Registered ' + ago(l.createdAt) + ' · ' + esc(l.status) + ' · ' + esc(l.phone || l.email) + '</small></span></a></li>'); });
      waiting.filter(function (l) { return stuck.indexOf(l) < 0 && l.status === 'Payment Failed'; }).slice(0, 4).forEach(function (l) { items.push('<li><a href="#/leads/' + esc(l.id) + '">' + A.icon('alert', 'w-5') + '<span><b>' + esc(l.clubName) + '</b><small>Payment failed · registered ' + ago(l.createdAt) + ' — call to help them finish</small></span></a></li>'); });
      if (failedEmails) items.push('<li><a href="#/emails">' + A.icon('mail', 'w-5') + '<span><b>' + failedEmails + ' email(s) failed to send</b><small>Check the SMTP settings in api/config.php</small></span></a></li>');
      return items.length ? '<ul class="a-list">' + items.join('') + '</ul>' : '<div class="a-empty">' + A.icon('checkcircle', 'w-8') + '<b>All good.</b><span class="muted">No stuck signups or failed emails.</span></div>';
    }
  } };

  /* ======================================================
     SIMULATE SIGNUP (test payment mode only)
     Calls the same public API as the website, so it exercises
     the real automation: signup → invoice → payment → activation → emails.
     ====================================================== */
  var NAMES = ['Garuda', 'Harimau', 'Rajawali', 'Naga', 'Merdeka', 'Bintang', 'Kilat', 'Wira', 'Helang', 'Singa', 'Teratai', 'Puncak'];
  var KINDS = ['Taekwondo Academy', 'Karate Club', 'Silat Centre', 'Judo Dojo', 'Muay Thai Gym', 'Boxing Club'];
  var SPORT_IDS = { 'Taekwondo Academy': ['taekwondo', 'Taekwondo'], 'Karate Club': ['karate', 'Karate'], 'Silat Centre': ['silat', 'Silat'], 'Judo Dojo': ['judo', 'Judo'], 'Muay Thai Gym': ['muay-thai', 'Muay Thai'], 'Boxing Club': ['boxing', 'Boxing'] };
  var PEOPLE = ['Aiman Rahman', 'Siti Nurhaliza', 'Kumar Rajan', 'Mei Ling Tan', 'Farah Aziz', 'Daniel Lee', 'Priya Nair', 'Hafiz Yusof'];
  var STATES = ['Selangor', 'Kuala Lumpur', 'Penang', 'Johor', 'Perak', 'Negeri Sembilan'];
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function openSimulator() {
    var outcomes = [['paid', 'Pays successfully'], ['failed', 'Cancels at the payment page'], ['abandon', 'Leaves at the payment page (no action)'], ['register', 'Registers only (never reaches payment)'], ['mix', 'Random mix']];
    A.openForm({ title: 'Simulate website signup', size: 'sm', rec: { count: 1, outcome: 'paid', plan: 'random', billing: 'random' }, fields: [
      { k: 'count', l: 'How many signups', type: 'number', min: 1, max: 10, req: true },
      { k: 'outcome', l: 'What the client does', type: 'select', opts: outcomes, req: true },
      { k: 'plan', l: 'Plan', type: 'select', opts: [['random', 'Random'], ['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']], req: true },
      { k: 'billing', l: 'Billing', type: 'select', opts: [['random', 'Random'], ['monthly', 'Monthly'], ['yearly', 'Yearly']], req: true }],
      onOpen: function (m) { m.body.insertAdjacentHTML('afterbegin', '<p class="a-help" style="margin-bottom:12px">Runs the real website flow with made-up clubs, using the test payment gateway (no real money). Emails go to the Email Log. Tagged “Simulated test” so you can remove them later.</p>'); },
      onSave: function (v) { runSimulation(+v.count, v.outcome, v.plan, v.billing); return true; } });
  }
  function runSimulation(count, outcome, plan, billing) {
    var progress = A.modal({ title: 'Simulating signups…', size: 'sm', body: '<ul class="a-sim-log" id="simLog"></ul>' });
    var log = $('#simLog', progress.el);
    function line(t, kind) { log.insertAdjacentHTML('beforeend', '<li class="' + (kind || '') + '">' + esc(t) + '</li>'); }
    var chain = Promise.resolve(), made = 0;
    for (var i = 0; i < count; i++) chain = chain.then(function () { return simulateOne(outcome === 'mix' ? pick(['paid', 'paid', 'failed', 'abandon', 'register']) : outcome, plan, billing, line).then(function () { made++; }); });
    chain.catch(function (err) { line('Stopped: ' + err.message, 'bad'); }).then(function () {
      line('Done — ' + made + ' signup(s). Reloading data…', 'ok');
      return DB.bootstrap();
    }).then(function () { A.updateBadges(); setTimeout(function () { progress.close(); A.refresh(); A.toast(made + ' simulated signup(s) completed.'); }, 700); });
  }
  function simulateOne(outcome, plan, billing, line) {
    var kind = pick(KINDS), name = pick(NAMES) + ' ' + kind, person = pick(PEOPLE), n = Math.floor(1000 + Math.random() * 9000);
    var p = plan === 'random' ? pick(['basic', 'standard', 'premium']) : plan, b = billing === 'random' ? pick(['monthly', 'yearly']) : billing;
    var email = 'test.' + name.toLowerCase().replace(/[^a-z]+/g, '') + n + '@example.com';
    line('Registering ' + name + ' (' + p + ', ' + b + ')…');
    return window.dclixApi('signup.php', { body: { simulated: true, plan: p, billing: b, clubCode: name.split(' ')[0].toUpperCase().slice(0, 6) + n, clubName: name, headInstructor: person,
      sport: SPORT_IDS[kind][0], sportName: SPORT_IDS[kind][1], address1: n % 200 + ', Jalan ' + pick(NAMES), state: pick(STATES), country: 'Malaysia', phoneCode: '+60 (Malaysia)',
      whatsapp: '1' + String(n) + '4567', email: email, password: 'Test@' + n + 'Ab' } }).then(function (res) {
      if (outcome === 'register') { line('  ✓ saved — client stops here', 'ok'); return; }
      return window.dclixApi('checkout.php', { body: { action: 'pay', token: res.token, plan: p, billing: b, billingInfo: { firstName: person.split(' ')[0], lastName: person.split(' ').slice(1).join(' ') || 'Test',
        address: n % 200 + ', Jalan ' + pick(NAMES), zip: '4' + String(n).slice(0, 4), city: pick(['Petaling Jaya', 'Shah Alam', 'George Town', 'Johor Bahru', 'Ipoh']), country: 'Malaysia', email: email, phone: '01' + n + '567' } } }).then(function (pay) {
        line('  ✓ invoice ' + pay.invoiceNo + ' — sent to payment page');
        if (outcome === 'abandon') { line('  … client left without paying', 'warn'); return; }
        // Press "Pay" or "Cancel" on the test gateway exactly like a browser would.
        return fetch(pay.url, { method: 'POST', mode: 'no-cors', body: new URLSearchParams({ result: outcome === 'paid' ? 'pay' : 'cancel' }) }).then(function () {
          line(outcome === 'paid' ? '  ✓ paid — club activated, emails logged' : '  ✗ payment cancelled', outcome === 'paid' ? 'ok' : 'bad');
        });
      });
    });
  }
  function purgeTests() {
    A.confirm('Remove all simulated test signups, with their clubs, logins, invoices, payment attempts and emails? Real signups are not touched.', { danger: true, ok: 'Remove tests' }).then(function (ok) {
      if (!ok) return;
      window.dclixApi('data.php', { body: { action: 'purge_tests' }, token: DB.token() }).then(function (res) {
        A.toast(res.removed + ' simulated signup(s) removed.');
        return DB.bootstrap().then(function () { A.updateBadges(); A.refresh(); });
      }, function (err) { A.toast(err.message, 'error'); });
    });
  }
})();
