/* ==========================================================
   D-Clix Admin — shared module helpers + Dashboard + Management
   (clubs, centres, students, instructors, classes, registration)
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, esc = A.esc, $ = A.$, $$ = A.$$;
  var M = A.M = {};
  function D() { return DB.data; }
  M.isSuper = function () { return A.role().scope === 'all'; };
  M.notSuper = function () { return !M.isSuper(); };

  /* ---------- Column helpers ---------- */
  var C = M.C = {
    id: { k: 'id', l: 'ID', cls: 'mono' },
    name: function (l, photo) { return { k: 'name', l: l || 'Name', fmt: function (r) { return '<span class="a-person">' + (photo ? A.avatar(r.name, r.photo) : '') + '<b>' + esc(r.name) + '</b></span>'; }, text: function (r) { return r.name; } }; },
    text: function (k, l) { return { k: k, l: l }; },
    ref: function (k, l, coll) { return { k: k, l: l, fmt: function (r) { return esc(A.nameOf(coll, r[k])); }, sort: function (r) { return A.nameOf(coll, r[k]); }, text: function (r) { return A.nameOf(coll, r[k]); } }; },
    money: function (k, l) { return { k: k, l: l, cls: 'num', fmt: function (r) { return A.money(r[k]); }, sort: function (r) { return +r[k] || 0; }, text: function (r) { return (+r[k] || 0).toFixed(2); } }; },
    num: function (k, l, fn) { return { k: k, l: l, cls: 'num', fmt: function (r) { return A.num(fn ? fn(r) : r[k]); }, sort: function (r) { return +(fn ? fn(r) : r[k]) || 0; }, text: function (r) { return fn ? fn(r) : r[k]; } }; },
    date: function (k, l) { return { k: k, l: l, fmt: function (r) { return A.date(r[k]); }, text: function (r) { return A.date(r[k]); } }; },
    status: function (k, l) { k = k || 'status'; return { k: k, l: l || 'Status', fmt: function (r) { return A.badge(r[k]); }, text: function (r) { return r[k]; } }; },
    calc: function (k, l, fn, cls) { return { k: k, l: l, cls: cls, fmt: function (r) { return esc(fn(r)); }, sort: fn, text: fn }; },
    actions: { k: '_actions', l: 'Actions' }
  };
  /* ---------- Filter helpers ---------- */
  var FL = M.FL = {
    club: function () { return M.isSuper() ? [{ k: 'clubId', l: 'Club', opts: function () { return A.rows('clubs').map(function (c) { return [c.id, c.name]; }); } }] : []; },
    centre: { k: 'centreId', l: 'Training centre', opts: function () { return A.rows('centres').map(function (c) { return [c.id, c.name]; }); } },
    instructor: { k: 'instructorId', l: 'Instructor', opts: function () { return A.rows('instructors').map(function (c) { return [c.id, c.name]; }); } },
    status: function (opts, k, l) { return { k: k || 'status', l: l || 'Status', opts: opts }; },
    plain: function (k, l, opts) { return { k: k, l: l, opts: opts }; }
  };
  /* ---------- Field helpers ---------- */
  var F = M.F = {
    club: function (req) { return { k: 'clubId', l: 'Club', type: 'select', ref: 'clubs', req: req !== false, hide: M.notSuper }; },
    centre: function (req) { return { k: 'centreId', l: 'Training centre', type: 'select', ref: 'centres', req: req !== false, refFilter: function (c) { return c.status === 'Active'; } }; },
    status: function (opts, def) { return { k: 'status', l: 'Status', type: 'select', opts: opts, req: true, def: def || opts[0] }; }
  };

  /* Fill clubId from the chosen centre, and lock scope for non-super users. */
  M.stamp = function (rec) {
    var u = A.user(), r = A.role();
    if (rec.centreId) { var c = A.byId('centres', rec.centreId); if (c) rec.clubId = c.clubId; }
    if (r.scope !== 'all' && 'clubId' in rec && !rec.clubId) rec.clubId = u.clubId;
    if (r.scope !== 'all' && rec.clubId && rec.clubId !== u.clubId) rec.clubId = u.clubId;
    return rec;
  };
  M.fmtNo = function (fmt, id) { var n = parseInt(String(id).replace(/\D/g, ''), 10) || 0; return String(fmt).replace('{YYYY}', new Date().getFullYear()).replace(/\{(#+)\}/, function (_, h) { return DB.pad(n, h.length); }); };

  /* Keep a handle on the visible table so actions refresh it without losing filters. */
  var CUR = { table: null, host: null };
  M.table = function (host, o) { var t = A.table(host, o); CUR.table = t; CUR.host = host; return t; };
  M.reload = function () { if (CUR.table && CUR.host && document.body.contains(CUR.host)) CUR.table.refresh(); else A.refresh(); A.updateBadges(); };

  /* ---------- Generic CRUD view ----------
     cfg: key, coll, title, single, group, icon, prefix, idLen, sub, cols(), fields(), filters(), search, dateKey, dateLabel,
          rows(), actions(r), bulk(), detail(main, rec), beforeSave(obj, old, isNew), afterSave(obj, old, isNew),
          canDelete(r) -> message|null, newRec(), headActions(), top(main), afterList(main), sort, empty, noCreate, badge */
  M.crud = function (cfg) {
    var view = { title: cfg.title, navTitle: cfg.navTitle, group: cfg.group, icon: cfg.icon, perm: cfg.perm || cfg.key, badge: cfg.badge, hidden: cfg.hidden };
    var perm = view.perm;
    function fields() { return typeof cfg.fields === 'function' ? cfg.fields() : cfg.fields; }
    view.openEdit = function (rec, after) {
      A.openForm({ title: (rec && rec.id ? 'Edit ' : 'Add ') + cfg.single, fields: fields(), rec: rec || (cfg.newRec ? cfg.newRec() : {}), coll: cfg.coll, module: perm,
        extraValidate: cfg.validate, onOpen: cfg.formOpen, size: cfg.formSize,
        onSave: function (vals, isNew) {
          var obj = Object.assign({}, rec || {}, vals);
          if (isNew) obj.id = DB.nextId(cfg.coll, cfg.prefix, cfg.idLen);
          M.stamp(obj);
          if (cfg.beforeSave && cfg.beforeSave(obj, rec, isNew) === false) return false;
          var saved = A.put(cfg.coll, obj, perm);
          if (cfg.afterSave) cfg.afterSave(saved, rec, isNew);
          DB.save();
          return saved;
        },
        after: function (saved) { if (after) after(saved); else M.reload(); A.updateBadges(); } });
    };
    view.del = function (r) {
      var why = cfg.canDelete ? cfg.canDelete(r) : null;
      if (why) { A.toast(why, 'error'); return; }
      A.confirm('Delete ' + cfg.single.toLowerCase() + ' "' + (r.name || r.title || r.id) + '"? This cannot be undone.', { ok: 'Delete', danger: true }).then(function (ok) {
        if (!ok) return; A.remove(cfg.coll, r.id, perm); A.toast(cfg.single + ' deleted.');
        if (location.hash.split('/')[2]) A.go('#/' + cfg.key); else M.reload();
      });
    };
    view.render = function (main, p) {
      if (p[0] && p[0] !== 'new' && cfg.detail) {
        var rec = A.byId(cfg.coll, p[0]);
        if (!rec || !A.inScope(rec, cfg.coll)) { main.innerHTML = '<div class="a-notice">' + A.icon('search', 'w-12') + '<h2>' + esc(cfg.single) + ' not found</h2><p>It may have been deleted, or it belongs to a club you cannot access.</p><a class="a-btn primary" href="#/' + cfg.key + '">Back to ' + esc(cfg.title.toLowerCase()) + '</a></div>'; return; }
        cfg.detail(main, rec, view); return;
      }
      var canC = A.can(perm, 'create') && !cfg.noCreate;
      main.innerHTML = A.pageHead(cfg.title, cfg.sub, (cfg.headActions ? cfg.headActions() : '') + (canC ? A.btn(cfg.addLabel || 'Add ' + cfg.single, 'plus', 'data-add') : '')) +
        '<div class="a-top"></div><div class="a-card" data-tbl></div>';
      if (cfg.top) cfg.top($('.a-top', main));
      var add = $('[data-add]', main); if (add) add.addEventListener('click', function () { view.openEdit(null); });
      var bulk = (cfg.bulk ? cfg.bulk() : []).filter(function (b) { return !b.perm || A.can(perm, b.perm); });
      if (A.can(perm, 'delete') && !cfg.noDelete) bulk.push({ label: 'Delete', icon: 'trash', danger: true, fn: function (rows) {
        return A.confirm('Delete ' + rows.length + ' selected record(s)? This cannot be undone.', { ok: 'Delete', danger: true }).then(function (ok) {
          if (!ok) return false;
          var skipped = 0;
          rows.forEach(function (r) { if (cfg.canDelete && cfg.canDelete(r)) { skipped++; return; } A.remove(cfg.coll, r.id, perm); });
          A.toast((rows.length - skipped) + ' deleted.' + (skipped ? ' ' + skipped + ' skipped because they are still in use.' : ''), skipped ? 'info' : 'ok');
        });
      } });
      M.table($('[data-tbl]', main), {
        rows: function () { return cfg.rows ? cfg.rows() : A.rows(cfg.coll); },
        cols: cfg.cols().concat([C.actions]), search: cfg.search, filters: cfg.filters ? cfg.filters() : [],
        dateKey: cfg.dateKey, dateLabel: cfg.dateLabel, defaultSort: cfg.sort, empty: cfg.empty,
        exportName: cfg.title, canExport: A.can(perm, 'export'), bulk: bulk,
        onRow: cfg.detail ? function (r) { A.go('#/' + cfg.key + '/' + encodeURIComponent(r.id)); } : null,
        actions: function (r) {
          var std = [];
          if (cfg.detail) std.push({ icon: 'eye', label: 'View', fn: function () { A.go('#/' + cfg.key + '/' + encodeURIComponent(r.id)); } });
          if (A.can(perm, 'edit') && !cfg.noEdit) std.push({ icon: 'edit', label: 'Edit', fn: function () { view.openEdit(r); } });
          var extra = cfg.actions ? cfg.actions(r, view) : [];
          var del = A.can(perm, 'delete') && !cfg.noDelete ? [{ icon: 'trash', label: 'Delete', danger: true, fn: function () { view.del(r); } }] : [];
          return std.concat(extra).concat(del);
        }
      });
      if (cfg.afterList) cfg.afterList(main);
      if (p[0] === 'new') {
        try { history.replaceState(null, '', '#/' + cfg.key); } catch (e) {}
        if (canC && !cfg.noCreate) view.openEdit(null);
      }
    };
    return view;
  };

  /* A small reusable "related records" table inside a detail page. */
  M.subTable = function (host, o) { return A.table(host, Object.assign({ pageSize: 5, canExport: true }, o)); };
  M.detailHead = function (backKey, backLabel, title, sub, actions) {
    return '<a class="a-back" href="#/' + backKey + '">' + A.icon('arrowleft') + ' ' + esc(backLabel) + '</a>' + A.pageHead(title, sub, actions);
  };

  /* ---------- Shared calculations ---------- */
  M.attRate = function (recs) { if (!recs.length) return null; var ok = recs.filter(function (a) { return a.status === 'Present' || a.status === 'Late'; }).length; return Math.round(100 * ok / recs.length); };
  M.pct = function (v) { return v == null ? '—' : v + '%'; };
  M.balance = function (p) { return Math.max(0, (+p.amount || 0) - (+p.discount || 0) + (+p.tax || 0) - (+p.paid || 0)); };
  M.total = function (p) { return (+p.amount || 0) - (+p.discount || 0) + (+p.tax || 0); };
  M.isOnline = function (m) { return m && m !== 'Cash'; };
  /* Mark unpaid bills past their due date as overdue. */
  M.normalize = function () {
    var t = A.today(), changed = false;
    if (!A.can('payments', 'edit')) return;
    D().payments.forEach(function (p) {
      if (p.status === 'Unpaid' && p.dueDate && p.dueDate < t && A.inScope(p, 'payments')) { p.status = 'Overdue'; changed = true; A.audit('Update', 'payments', p.id, [], 'Marked overdue automatically (due date passed)'); }
    });
    if (changed) DB.save();
  };
  M.pendingCount = function () {
    var d = D();
    return A.scope(d.registrations).filter(function (r) { return r.status === 'Pending'; }).length +
      A.scope(d.refunds).filter(function (r) { return r.status === 'Pending Approval'; }).length +
      A.scope(d.purchases).filter(function (r) { return r.status === 'Pending'; }).length +
      A.scope(d.transfers).filter(function (r) { return r.status === 'Pending'; }).length;
  };
  M.notify = function (n) {
    var rec = Object.assign({ id: DB.nextId('notifications', 'NT'), attachment: '', target: '', clubId: A.role().scope === 'all' ? '' : A.user().clubId,
      schedule: new Date().toISOString().slice(0, 16), status: 'Sent', delivered: n.total || 0, read: 0, by: A.user().name }, n);
    A.put('notifications', rec, 'notifications', 'Sent "' + rec.title + '"');
    return rec;
  };

  /* ======================================================
     DASHBOARD
     ====================================================== */
  A.views.dashboard = { title: 'Dashboard', icon: 'grid', render: function (main) {
    M.normalize();
    var d = D(), today = A.today(), month = today.slice(0, 7);
    var students = A.rows('students'), active = students.filter(function (s) { return s.status === 'Active'; });
    var pays = A.rows('payments'), att = A.rows('attendance');
    var paidMonth = pays.filter(function (p) { return (p.status === 'Paid' || p.status === 'Partial') && A.monthKey(p.date) === month; });
    var outstanding = pays.filter(function (p) { return ['Unpaid', 'Overdue', 'Partial'].indexOf(p.status) >= 0; });
    var attToday = att.filter(function (a) { return a.date === today; });
    var attMonth = att.filter(function (a) { return A.monthKey(a.date) === month; });
    var in30 = DB.iso(DB.addDays(new Date(), 30));
    var upGrad = A.rows('gradings').filter(function (g) { return g.date >= today && g.date <= in30; });
    var upTour = A.rows('tournaments').filter(function (t) { return t.date >= today; });
    var newReg = students.filter(function (s) { return A.monthKey(s.joinDate) === month; }).length + A.rows('registrations').filter(function (r) { return r.status === 'Pending'; }).length;
    var pending = M.pendingCount();
    var u = A.user();
    var cards = [
      M.isSuper() ? A.statCard('Total clubs', A.num(A.rows('clubs').length), 'building', A.rows('clubs').filter(function (c) { return c.status === 'Active'; }).length + ' active', A.can('clubs') ? '#/clubs' : '') : '',
      A.statCard('Training centres', A.num(A.rows('centres').length), 'mappin', '', A.can('centres') ? '#/centres' : ''),
      A.statCard('Total students', A.num(students.length), 'users', '', A.can('students') ? '#/students' : ''),
      A.statCard('Active students', A.num(active.length), 'checkcircle', Math.round(100 * active.length / (students.length || 1)) + '% of all'),
      A.statCard('Inactive students', A.num(students.length - active.length), 'eyeoff'),
      A.statCard('Instructors', A.num(A.rows('instructors').length), 'award', '', A.can('instructors') ? '#/instructors' : ''),
      A.statCard('Classes', A.num(A.rows('classes').filter(function (c) { return c.status === 'Active'; }).length), 'calendardays', '', A.can('classes') ? '#/classes' : ''),
      A.statCard("Today's attendance", attToday.length ? A.num(attToday.filter(function (a) { return a.status !== 'Absent'; }).length) + ' / ' + A.num(attToday.length) : '—', 'calendarcheck', attToday.length ? 'checked in today' : 'no classes recorded yet', A.can('attendance') ? '#/attendance' : ''),
      A.statCard('Monthly attendance', M.pct(M.attRate(attMonth)), 'activity', A.num(attMonth.length) + ' records this month'),
      A.statCard('Outstanding payments', A.money(A.sum(outstanding, M.balance)), 'alert', outstanding.length + ' bills', A.can('outstanding') ? '#/outstanding' : ''),
      A.statCard('Collection this month', A.money(A.sum(paidMonth, 'paid')), 'wallet', paidMonth.length + ' payments', A.can('collections') ? '#/collections' : ''),
      A.statCard('Online collection', A.money(A.sum(paidMonth.filter(function (p) { return M.isOnline(p.method); }), 'paid')), 'globe', 'FPX, card, banking'),
      A.statCard('Cash collection', A.money(A.sum(paidMonth.filter(function (p) { return p.method === 'Cash'; }), 'paid')), 'dollar', 'this month'),
      A.statCard('Upcoming grading', A.num(upGrad.length), 'gradcap', upGrad[0] ? 'next ' + A.date(upGrad.sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0].date) : 'next 30 days', A.can('gradings') ? '#/gradings' : ''),
      A.statCard('Upcoming tournaments', A.num(upTour.length), 'trophy', upTour[0] ? esc(upTour.sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0].name) : '', A.can('tournaments') ? '#/tournaments' : ''),
      A.statCard('New registrations', A.num(newReg), 'userplus', 'joined this month + pending', A.can('registrations') ? '#/registrations' : ''),
      A.statCard('Pending approvals', A.num(pending), 'checksquare', pending ? 'needs your action' : 'all clear', A.can('approvals') ? '#/approvals' : '')
    ].join('');
    if (A.can('leads')) {
      var leads = A.rows('leads'), subs = A.rows('subscriptions');
      var newLeads = leads.filter(function (l) { return String(l.createdAt).slice(0, 7) === month; });
      var subPaid = subs.filter(function (s) { return s.status === 'Paid' && String(s.paidAt).slice(0, 7) === month; });
      var waiting = leads.filter(function (l) { return ['New', 'Payment Pending', 'Payment Failed'].indexOf(l.status) >= 0; });
      cards = A.statCard('Website signups', A.num(newLeads.length), 'userplus', 'this month · ' + newLeads.filter(function (l) { return l.status === 'Paid'; }).length + ' paid', '#/leads') +
        A.statCard('Subscription revenue', A.money(A.sum(subPaid, 'total')), 'card', 'this month · ' + subPaid.length + ' payments', '#/subscriptions') +
        A.statCard('Leads to follow up', A.num(waiting.length), 'phone', waiting.length ? 'unpaid or new signups' : 'all followed up', '#/leads') + cards;
    }

    var months = A.lastMonths(6);
    var paidAll = pays.filter(function (p) { return p.status === 'Paid' || p.status === 'Partial'; });
    var revenue = months.map(function (m) { return A.sum(paidAll.filter(function (p) { return A.monthKey(p.date) === m; }), 'paid'); });
    var cashM = months.map(function (m) { return A.sum(paidAll.filter(function (p) { return A.monthKey(p.date) === m && p.method === 'Cash'; }), 'paid'); });
    var onlineM = months.map(function (m, i) { return revenue[i] - cashM[i]; });
    var growth = months.map(function (m) { return students.filter(function (s) { return A.monthKey(s.joinDate) === m; }).length; });
    var outM = months.map(function (m) { return A.sum(outstanding.filter(function (p) { return A.monthKey(p.dueDate) === m; }), M.balance); });
    var days = []; for (var i = 27; i >= 0; i--) days.push(DB.iso(DB.addDays(new Date(), -i)));
    var weeks = [0, 1, 2, 3].map(function (w) { return days.slice(w * 7, w * 7 + 7); });
    var attTrend = weeks.map(function (wk) { return M.attRate(att.filter(function (a) { return wk.indexOf(a.date) >= 0; })) || 0; });
    var byCentre = A.rows('centres').map(function (c) { return { label: c.name, value: students.filter(function (s) { return s.centreId === c.id; }).length }; }).sort(function (a, b) { return b.value - a.value; }).slice(0, 8);
    var gradesList = A.settings().grades; var byGrade = gradesList.map(function (g) { return { label: g, value: active.filter(function (s) { return s.grade === g; }).length }; }).filter(function (x) { return x.value; });

    var qa = [['students', 'Add Student', 'userplus'], ['instructors', 'Add Instructor', 'award'], ['centres', 'Add Training Centre', 'mappin'], ['payments', 'Record Payment', 'wallet'], ['classes', 'Create Class', 'calendardays'], ['gradings', 'Create Grading', 'gradcap'], ['notifications', 'Send Notification', 'send']]
      .filter(function (q) { return A.can(q[0], 'create'); }).map(function (q) { return '<a class="a-qa" href="#/' + q[0] + '/new">' + A.icon(q[2], 'w-5') + '<span>+ ' + esc(q[1]) + '</span></a>'; }).join('');

    var upcoming = [].concat(
      A.rows('gradings').filter(function (g) { return g.date >= today; }).map(function (g) { return { d: g.date, t: g.name, k: 'Grading', l: '#/gradings/' + g.id, i: 'gradcap' }; }),
      upTour.map(function (t) { return { d: t.date, t: t.name, k: 'Tournament', l: '#/tournaments/' + t.id, i: 'trophy' }; }),
      A.rows('activities').filter(function (a) { return a.date >= today; }).map(function (a) { return { d: a.date, t: a.name, k: a.type, l: '#/activities', i: 'sparkles' }; })
    ).sort(function (a, b) { return a.d < b.d ? -1 : 1; }).slice(0, 6);
    var audit = A.can('audit', 'view') ? d.audit.slice(0, 6) : [];

    main.innerHTML = A.pageHead('Welcome back, ' + u.name.split(' ')[0], A.role().name + ' · ' + (M.isSuper() ? 'All clubs' : A.nameOf('clubs', u.clubId) + (u.centreId ? ' · ' + A.nameOf('centres', u.centreId) : '')) + ' · ' + new Date().toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) +
      (qa ? '<div class="a-qas">' + qa + '</div>' : '') +
      '<div class="a-stats">' + cards + '</div>' +
      '<div class="a-grid2">' +
        A.panel('Monthly revenue', A.chart({ type: 'line', labels: months.map(A.monthLabel), series: [{ name: 'Revenue', values: revenue }], fmt: A.money, title: 'Monthly revenue' })) +
        A.panel('Payment collection', A.chart({ type: 'stacked', labels: months.map(A.monthLabel), series: [{ name: 'Cash', values: cashM }, { name: 'Online', values: onlineM, color: '#3b82f6' }], fmt: A.money, title: 'Cash vs online collection' })) +
        A.panel('Student registration growth', A.chart({ type: 'bar', labels: months.map(A.monthLabel), series: [{ name: 'New students', values: growth, color: '#10b981' }], title: 'New students per month' })) +
        A.panel('Attendance trend', A.chart({ type: 'line', labels: ['3 wks ago', '2 wks ago', 'Last week', 'This week'], series: [{ name: 'Attendance %', values: attTrend, color: '#a855f7' }], fmt: function (v) { return v + '%'; }, title: 'Weekly attendance rate' })) +
        A.panel('Outstanding payment', A.chart({ type: 'bar', labels: months.map(A.monthLabel), series: [{ name: 'Outstanding', values: outM, color: '#ef4444' }], fmt: A.money, title: 'Outstanding by due month' })) +
        A.panel('Active vs inactive students', A.donut([{ label: 'Active', value: active.length, color: '#10b981' }, { label: 'Inactive', value: students.length - active.length, color: '#6b7280' }], { center: 'students' })) +
        A.panel('Students by training centre', byCentre.length ? A.hbars(byCentre) : '<p class="muted">No centres yet.</p>') +
        A.panel('Students by grade', byGrade.length ? A.donut(byGrade, { center: 'active' }) : '<p class="muted">No students yet.</p>') +
      '</div>' +
      '<div class="a-grid2">' +
        A.panel('Upcoming events', upcoming.length ? '<ul class="a-list">' + upcoming.map(function (x) { return '<li><a href="' + x.l + '">' + A.icon(x.i, 'w-5') + '<span><b>' + esc(x.t) + '</b><small>' + esc(x.k) + ' · ' + A.date(x.d) + '</small></span></a></li>'; }).join('') + '</ul>' : '<p class="muted">Nothing scheduled.</p>') +
        (audit.length ? A.panel('Recent activity', '<ul class="a-list">' + audit.map(function (x) { return '<li><span class="a-dot ' + (x.action === 'Delete' ? 'bad' : x.action === 'Create' ? 'ok' : 'neutral') + '"></span><span><b>' + esc(x.user) + '</b> ' + esc(x.action.toLowerCase()) + ' · ' + esc(x.summary || (x.module + ' ' + x.recordId)) + '<small>' + A.datetime(x.at) + '</small></span></li>'; }).join('') + '</ul>', '<a class="a-link" href="#/audit">View all</a>') :
          A.panel('Pending approvals', pending ? '<p>' + pending + ' item(s) waiting.</p><a class="a-btn primary sm" href="#/approvals">Open Approval Centre</a>' : '<p class="muted">Nothing waiting for approval.</p>')) +
      '</div>';
  } };

  /* ======================================================
     CLUBS (system level)
     ====================================================== */
  A.views.clubs = M.crud({
    key: 'clubs', coll: 'clubs', title: 'Clubs', single: 'Club', group: 'Management', icon: 'building', prefix: 'CLB',
    sub: 'Every club using D-Clix, its subscription and status.',
    search: ['id', 'name', 'owner', 'phone', 'email', 'regNo'],
    cols: function () { return [C.id, { k: 'name', l: 'Club name', fmt: function (r) { return '<span class="a-person">' + (r.logo ? '<img class="a-avatar" src="' + esc(r.logo) + '" alt="" />' : A.avatar(r.name)) + '<b>' + esc(r.name) + '</b></span>'; }, text: function (r) { return r.name; } }, C.text('owner', 'Owner'), C.text('phone', 'Phone'), C.text('email', 'Email'),
      C.num('students', 'Students', function (r) { return D().students.filter(function (s) { return s.clubId === r.id; }).length; }),
      C.num('centres', 'Centres', function (r) { return D().centres.filter(function (s) { return s.clubId === r.id; }).length; }),
      C.text('plan', 'Subscription'), C.status()]; },
    filters: function () { return [FL.status(['Active', 'Pending Payment', 'Suspended', 'Archived']), FL.plain('plan', 'Plan', ['Basic', 'Standard', 'Premium']), FL.plain('sport', 'Sport')]; },
    fields: function () { return [
      { k: 'name', l: 'Club name', req: true, unique: true }, { k: 'regNo', l: 'Business registration no.', ph: 'e.g. 202301012345 (1234567-X)' },
      { k: 'owner', l: 'Owner / PIC', req: true }, { k: 'type', l: 'Club type', type: 'select', opts: ['Academy', 'Association', 'Private Club', 'School Club'], req: true },
      { k: 'phone', l: 'Phone', type: 'tel', req: true }, { k: 'email', l: 'Email', type: 'email', req: true, unique: true },
      { k: 'sport', l: 'Martial art / sport', type: 'select', opts: DB.SPORTS, req: true }, { k: 'monthlyFee', l: 'Default monthly fee', type: 'number', min: 0, req: true, def: 100 },
      { k: 'address', l: 'Address', type: 'textarea', rows: 2 },
      { k: 'plan', l: 'Subscription plan', type: 'select', opts: ['Basic', 'Standard', 'Premium'], req: true, hide: M.notSuper },
      { k: 'subStart', l: 'Subscription start', type: 'date', req: true, def: A.today, hide: M.notSuper },
      { k: 'subEnd', l: 'Subscription end', type: 'date', req: true, hide: M.notSuper, check: function (v, all) { return all.subStart && v < all.subStart ? 'End date must be after the start date.' : ''; } },
      { k: 'logo', l: 'Club logo', type: 'file', image: true, accept: 'image/*', help: 'PNG/JPG/SVG under 300 KB.' },
      F.status(['Active', 'Pending Payment', 'Suspended', 'Archived'])
    ]; },
    beforeSave: function (o, old, isNew) { if (isNew) o.createdAt = A.today(); },
    canDelete: function (r) { return D().centres.some(function (c) { return c.clubId === r.id; }) || D().students.some(function (s) { return s.clubId === r.id; }) ? 'This club still has centres or students. Archive it instead of deleting.' : null; },
    actions: function (r) { return [
      { icon: r.status === 'Active' ? 'lock' : 'check', label: r.status === 'Active' ? 'Suspend' : 'Activate', show: A.can('clubs', 'edit') && M.isSuper(), fn: function () {
        var next = r.status === 'Active' ? 'Suspended' : 'Active';
        A.confirm((next === 'Suspended' ? 'Suspend ' : 'Activate ') + r.name + '?' + (next === 'Suspended' ? ' Its users will not be able to log in until reactivated.' : ''), { danger: next === 'Suspended' }).then(function (ok) { if (ok) { A.put('clubs', { id: r.id, status: next }, 'clubs'); A.toast(r.name + ' is now ' + next.toLowerCase() + '.'); M.reload(); } });
      } },
      { icon: 'box', label: 'Archive', show: A.can('clubs', 'edit') && M.isSuper() && r.status !== 'Archived', fn: function () { A.confirm('Archive ' + r.name + '? It will be hidden from active lists but kept for records.').then(function (ok) { if (ok) { A.put('clubs', { id: r.id, status: 'Archived' }, 'clubs'); M.reload(); } }); } }
    ]; },
    detail: function (main, r, view) {
      var d = D();
      var centres = d.centres.filter(function (c) { return c.clubId === r.id; }), st = d.students.filter(function (s) { return s.clubId === r.id; });
      var ins = d.instructors.filter(function (s) { return s.clubId === r.id; });
      var month = A.today().slice(0, 7);
      var rev = A.sum(d.payments.filter(function (p) { return p.clubId === r.id && A.monthKey(p.date) === month && (p.status === 'Paid' || p.status === 'Partial'); }), 'paid');
      var daysLeft = Math.round((new Date(r.subEnd) - new Date()) / 864e5);
      main.innerHTML = M.detailHead('clubs', 'All clubs', r.name, r.sport + ' · ' + r.type + ' · ' + r.id, A.can('clubs', 'edit') ? A.btn('Edit club', 'edit', 'data-edit') : '') +
        '<div class="a-stats">' + A.statCard('Students', A.num(st.length), 'users', st.filter(function (s) { return s.status === 'Active'; }).length + ' active') + A.statCard('Centres', A.num(centres.length), 'mappin') +
        A.statCard('Instructors', A.num(ins.length), 'award') + A.statCard('Revenue this month', A.money(rev), 'wallet') +
        A.statCard('Subscription', esc(r.plan), 'card', daysLeft >= 0 ? daysLeft + ' days left' : '<span class="bad">Expired ' + (-daysLeft) + ' days ago</span>') + '</div>' +
        '<div class="a-grid2">' + A.panel('Club information', A.dl([['Status', A.badge(r.status)], ['Owner', esc(r.owner)], ['Phone', esc(r.phone)], ['Email', esc(r.email)], ['Business reg. no.', esc(r.regNo)], ['Address', esc(r.address)], ['Default monthly fee', A.money(r.monthlyFee)], ['Subscription', esc(r.plan) + ' · ' + A.date(r.subStart) + ' – ' + A.date(r.subEnd)]])) +
        A.panel('Training centres', '<div data-c></div>') + '</div>' +
        (A.can('subscriptions') ? A.panel('D-Clix subscription invoices', '<div data-subs></div>') : '');
      var e = $('[data-edit]', main); if (e) e.addEventListener('click', function () { view.openEdit(r, function () { A.refresh(); }); });
      var sh = $('[data-subs]', main);
      if (sh) M.subTable(sh, { rows: function () { return A.rows('subscriptions').filter(function (s) { return s.clubId === r.id; }); }, cols: [C.text('invoiceNo', 'Invoice'), C.text('planName', 'Plan'), C.text('billing', 'Billing'), C.money('total', 'Total'), C.status(), C.calc('p', 'Period', function (s) { return s.periodStart ? A.date(s.periodStart) + ' – ' + A.date(s.periodEnd) : ''; })], onRow: function (s) { M.showSubscription(s); }, exportName: r.name + ' subscriptions', empty: 'No online subscription payments for this club.' });
      M.subTable($('[data-c]', main), { rows: function () { return centres; }, cols: [C.id, C.text('name', 'Centre'), C.num('n', 'Students', function (c) { return st.filter(function (s) { return s.centreId === c.id; }).length; }), C.status()], onRow: function (c) { A.go('#/centres/' + c.id); }, exportName: r.name + ' centres' });
    }
  });

  /* ======================================================
     TRAINING CENTRES
     ====================================================== */
  A.views.centres = M.crud({
    key: 'centres', coll: 'centres', title: 'Training Centres', single: 'Training centre', group: 'Management', icon: 'mappin', prefix: 'TC',
    sub: 'Branches where classes run. Club → Training centre → Classes → Students.',
    search: ['id', 'name', 'address', 'phone', 'email'],
    cols: function () { return [C.id, C.name('Centre'), C.ref('clubId', 'Club', 'clubs'), C.text('phone', 'Phone'),
      C.num('students', 'Students', function (r) { return D().students.filter(function (s) { return s.centreId === r.id && s.status === 'Active'; }).length; }),
      C.calc('cap', 'Capacity', function (r) { var n = D().students.filter(function (s) { return s.centreId === r.id && s.status === 'Active'; }).length; return n + ' / ' + r.capacity; }),
      C.num('instructors', 'Instructors', function (r) { return D().instructors.filter(function (s) { return s.centreId === r.id; }).length; }), C.status()]; },
    filters: function () { return FL.club().concat([FL.status(['Active', 'Inactive'])]); },
    fields: function () { return [
      { k: 'name', l: 'Centre name', req: true }, F.club(), { k: 'phone', l: 'Phone', type: 'tel', req: true }, { k: 'email', l: 'Email', type: 'email' },
      { k: 'address', l: 'Address', type: 'textarea', rows: 2, req: true }, { k: 'hours', l: 'Operating hours', ph: 'Mon–Fri 4pm–10pm, Sat 9am–6pm' },
      { k: 'capacity', l: 'Student capacity', type: 'number', min: 1, req: true, def: 80 }, F.status(['Active', 'Inactive'])
    ]; },
    beforeSave: function (o, old, isNew) { if (isNew) o.createdAt = A.today(); },
    canDelete: function (r) { return D().students.some(function (s) { return s.centreId === r.id; }) || D().classes.some(function (s) { return s.centreId === r.id; }) ? 'This centre still has students or classes. Transfer them or set the centre to Inactive.' : null; },
    detail: function (main, r, view) {
      var d = D();
      var st = d.students.filter(function (s) { return s.centreId === r.id; }), ins = d.instructors.filter(function (s) { return s.centreId === r.id; }), cls = d.classes.filter(function (s) { return s.centreId === r.id; });
      var month = A.today().slice(0, 7);
      main.innerHTML = M.detailHead('centres', 'All training centres', r.name, A.nameOf('clubs', r.clubId) + ' · ' + r.id, A.can('centres', 'edit') ? A.btn('Edit centre', 'edit', 'data-edit') : '') +
        '<div class="a-stats">' + A.statCard('Active students', A.num(st.filter(function (s) { return s.status === 'Active'; }).length) + ' / ' + r.capacity, 'users', 'capacity used') + A.statCard('Instructors', A.num(ins.length), 'award') +
        A.statCard('Classes', A.num(cls.length), 'calendardays') + A.statCard('Attendance this month', M.pct(M.attRate(d.attendance.filter(function (a) { return a.centreId === r.id && A.monthKey(a.date) === month; }))), 'activity') + '</div>' +
        '<div class="a-panel">' + A.dl([['Status', A.badge(r.status)], ['Address', esc(r.address)], ['Phone', esc(r.phone)], ['Email', esc(r.email)], ['Operating hours', esc(r.hours)]]) + '</div><div data-tabs></div>';
      var e = $('[data-edit]', main); if (e) e.addEventListener('click', function () { view.openEdit(r, A.refresh); });
      A.tabs($('[data-tabs]', main), [
        { label: 'Classes', count: cls.length, render: function (b) { M.subTable(b, { rows: function () { return cls; }, cols: [C.id, C.text('name', 'Class'), C.ref('instructorId', 'Instructor', 'instructors'), C.calc('days', 'Schedule', function (c) { return c.days.join(', ') + ' ' + c.start + '–' + c.end; }), C.status()], onRow: function (c) { A.go('#/classes/' + c.id); }, exportName: r.name + ' classes' }); } },
        { label: 'Instructors', count: ins.length, render: function (b) { M.subTable(b, { rows: function () { return ins; }, cols: [C.id, C.name('Instructor'), C.text('rank', 'Rank'), C.text('phone', 'Phone'), C.status()], onRow: function (c) { A.go('#/instructors/' + c.id); }, exportName: r.name + ' instructors' }); } },
        { label: 'Students', count: st.length, render: function (b) { M.subTable(b, { rows: function () { return st; }, search: ['id', 'name', 'phone'], cols: [C.id, C.name('Student'), C.text('grade', 'Grade'), C.status()], onRow: function (c) { A.go('#/students/' + c.id); }, exportName: r.name + ' students' }); } }
      ]);
    }
  });

  /* ======================================================
     STUDENTS
     ====================================================== */
  function studentFields() {
    var s = A.settings();
    return [
      { k: 'name', l: 'Full name', req: true }, { k: 'ic', l: 'IC / Passport', req: true, unique: true, ic: true, ph: '900101-14-5678' },
      { k: 'dob', l: 'Date of birth', type: 'date', req: true, check: function (v) { return v > A.today() ? 'Date of birth cannot be in the future.' : A.age(v) > 100 ? 'Please check the date of birth.' : ''; } },
      { k: 'gender', l: 'Gender', type: 'select', opts: ['Male', 'Female'], req: true },
      { k: 'phone', l: 'Phone', type: 'tel', req: true }, { k: 'email', l: 'Email', type: 'email', unique: true },
      { k: 'guardian', l: 'Parent / guardian', help: 'Required for students under 18.' }, { k: 'guardianPhone', l: 'Guardian phone', type: 'tel' },
      F.centre(), { k: 'instructorId', l: 'Instructor', type: 'select', ref: 'instructors', refLabel: function (i) { return ' (' + A.nameOf('centres', i.centreId) + ')'; } },
      { k: 'joinDate', l: 'Join date', type: 'date', req: true, def: A.today }, { k: 'grade', l: 'Current grade', type: 'select', opts: s.grades, req: true, def: s.grades[0] },
      { k: 'membership', l: 'Membership type', type: 'select', opts: s.membershipTypes, req: true, def: s.membershipTypes[0] },
      F.status(s.studentStatuses),
      { k: 'photo', l: 'Profile photo', type: 'file', image: true, accept: 'image/*', help: 'Optional. Under 300 KB.' }
    ];
  }
  function validateStudent(v) {
    var e = {};
    if (v.dob && A.age(v.dob) < 18 && !v.guardian) e.guardian = 'A parent or guardian is required for students under 18.';
    if (v.instructorId && v.centreId) { var i = A.byId('instructors', v.instructorId); if (i && i.centreId !== v.centreId) e.instructorId = 'This instructor teaches at ' + A.nameOf('centres', i.centreId) + '. Pick one from the selected centre.'; }
    return e;
  }
  function transferStudent(s, done) {
    var opts = D().centres.filter(function (c) { return c.id !== s.centreId && c.status === 'Active' && (M.isSuper() || c.clubId === s.clubId); });
    var fields = [{ k: 'toCentreId', l: 'Transfer to', type: 'select', opts: opts.map(function (c) { return [c.id, c.name + (M.isSuper() ? ' · ' + A.nameOf('clubs', c.clubId) : '')]; }), req: true }, { k: 'reason', l: 'Reason', type: 'textarea', req: true }];
    var direct = A.can('approvals', 'approve');
    A.openForm({ title: 'Transfer ' + s.name, fields: fields, rec: {}, size: 'sm', onSave: function (v) {
      var t = { id: DB.nextId('transfers', 'TF'), studentId: s.id, clubId: s.clubId, centreId: s.centreId, fromCentreId: s.centreId, toCentreId: v.toCentreId, reason: v.reason, requested: A.today(), requestedBy: A.user().name, status: direct ? 'Approved' : 'Pending' };
      A.put('transfers', t, 'approvals', 'Transfer request for ' + s.name);
      if (direct) M.applyTransfer(t);
      A.toast(direct ? s.name + ' moved to ' + A.nameOf('centres', v.toCentreId) + '.' : 'Transfer request sent for approval.', 'info');
      return t;
    }, after: done || M.reload });
  }
  M.applyTransfer = function (t) {
    var to = A.byId('centres', t.toCentreId), s = A.byId('students', t.studentId); if (!to || !s) return;
    var ins = D().instructors.filter(function (i) { return i.centreId === to.id && i.status === 'Active'; })[0];
    A.put('students', { id: s.id, centreId: to.id, clubId: to.clubId, instructorId: ins ? ins.id : '' }, 'students', 'Transferred ' + s.name + ' from ' + A.nameOf('centres', t.fromCentreId) + ' to ' + to.name);
    D().classes.forEach(function (c) { var i = c.studentIds.indexOf(s.id); if (i >= 0 && c.centreId !== to.id) c.studentIds.splice(i, 1); });
    DB.save();
  };
  M.memberCard = function (s) {
    var html = '<div style="width:340px;border-radius:14px;border:1px solid #ddd;overflow:hidden;font-family:inherit"><div style="background:' + A.accent() + ';color:#fff;padding:10px 14px;font-weight:700">' + esc(A.nameOf('clubs', s.clubId)) + '<div style="font-size:10px;font-weight:400">MEMBERSHIP CARD</div></div>' +
      '<div style="display:flex;gap:12px;padding:14px;align-items:center"><div>' + A.qrSVG('DCLIX:' + s.id, 100) + '</div><div><div style="font-size:15px;font-weight:700">' + esc(s.name) + '</div><div>ID: ' + esc(s.id) + '</div><div>Grade: ' + esc(s.grade) + '</div><div>Centre: ' + esc(A.nameOf('centres', s.centreId)) + '</div><div>Since ' + A.date(s.joinDate) + '</div></div></div></div>';
    return html;
  };
  M.studentQR = function (s) {
    A.modal({ title: 'QR code · ' + s.name, size: 'sm', body: '<div class="a-qr-box">' + A.qrSVG('DCLIX:' + s.id, 200) + '<p class="mono">DCLIX:' + esc(s.id) + '</p><p class="muted">Scan at the centre to check in for attendance.</p></div>',
      actions: [{ label: 'Close', cls: 'ghost' }, { label: 'Print membership card', cls: 'primary', icon: 'printer', onClick: function () { A.printHTML('Membership card ' + s.id, M.memberCard(s)); } }] });
  };
  A.views.students = M.crud({
    key: 'students', coll: 'students', title: 'Students', single: 'Student', group: 'Management', icon: 'users', prefix: 'ST',
    sub: 'Members, their training centre, grade, membership and payment status.',
    search: function (r) { return [r.id, r.name, r.ic, r.phone, r.email, r.guardian].join(' '); }, dateKey: 'joinDate', dateLabel: 'Joined',
    sort: { k: 'id', dir: -1 },
    cols: function () { return [C.id, C.name('Student', true), C.text('ic', 'IC / Passport'), C.calc('age', 'Age', function (r) { return A.age(r.dob); }, 'num'), C.text('phone', 'Phone'), C.ref('centreId', 'Training centre', 'centres'), C.ref('instructorId', 'Instructor', 'instructors'), C.text('grade', 'Grade'),
      { k: 'pay', l: 'Payment', fmt: function (r) { return A.badge(M.payState(r)); }, sort: M.payState, text: M.payState },
      { k: 'att', l: 'Attendance', cls: 'num', fmt: function (r) { return M.pct(M.studentAtt(r)); }, sort: function (r) { return M.studentAtt(r) || 0; }, text: function (r) { return M.pct(M.studentAtt(r)); } },
      C.status()]; },
    filters: function () { return FL.club().concat([FL.centre, FL.instructor, FL.plain('grade', 'Grade', A.settings().grades), FL.status(A.settings().studentStatuses), { k: 'pay', l: 'Payment status', opts: ['Paid', 'Unpaid', 'Overdue'], val: M.payState }, FL.plain('gender', 'Gender', ['Male', 'Female'])]); },
    fields: studentFields, validate: validateStudent,
    beforeSave: function (o, old, isNew) { if (isNew) { o.documents = []; } if (o.photo === undefined && old) o.photo = old.photo; },
    canDelete: function (r) { return D().payments.some(function (p) { return p.studentId === r.id; }) ? 'This student has payment records. Set the student to Inactive instead of deleting.' : null; },
    bulk: function () { return [
      { label: 'Activate', icon: 'check', perm: 'edit', fn: function (rows) { rows.forEach(function (r) { A.put('students', { id: r.id, status: 'Active' }, 'students'); }); A.toast(rows.length + ' student(s) activated.'); } },
      { label: 'Deactivate', icon: 'eyeoff', perm: 'edit', fn: function (rows) { rows.forEach(function (r) { A.put('students', { id: r.id, status: 'Inactive' }, 'students'); }); A.toast(rows.length + ' student(s) deactivated.'); } }
    ]; },
    actions: function (r) { return [
      { icon: 'qr', label: 'QR code / card', fn: function () { M.studentQR(r); } },
      { icon: 'swap', label: 'Transfer centre', show: A.can('students', 'edit'), fn: function () { transferStudent(r); } },
      { icon: r.status === 'Active' ? 'eyeoff' : 'check', label: r.status === 'Active' ? 'Deactivate' : 'Activate', show: A.can('students', 'edit'), fn: function () { A.put('students', { id: r.id, status: r.status === 'Active' ? 'Inactive' : 'Active' }, 'students'); A.toast(r.name + ' updated.'); M.reload(); } }
    ]; },
    detail: function (main, s, view) { studentDetail(main, s, view); }
  });
  M.payState = function (s) {
    var p = D().payments.filter(function (x) { return x.studentId === s.id; });
    if (p.some(function (x) { return x.status === 'Overdue'; })) return 'Overdue';
    if (p.some(function (x) { return x.status === 'Unpaid' || x.status === 'Partial'; })) return 'Unpaid';
    return 'Paid';
  };
  var attCache = { at: 0, map: null };
  M.studentAtt = function (s) {
    if (!attCache.map || Date.now() - attCache.at > 2000) {
      attCache.map = {}; attCache.at = Date.now();
      D().attendance.forEach(function (a) { var m = attCache.map[a.studentId] || (attCache.map[a.studentId] = [0, 0]); m[1]++; if (a.status === 'Present' || a.status === 'Late') m[0]++; });
    }
    var m = attCache.map[s.id]; return m ? Math.round(100 * m[0] / m[1]) : null;
  };
  function studentDetail(main, s, view) {
    var d = D();
    var att = d.attendance.filter(function (a) { return a.studentId === s.id; });
    var pays = d.payments.filter(function (p) { return p.studentId === s.id; });
    var grads = d.candidates.filter(function (c) { return c.studentId === s.id; });
    var tours = d.participants.filter(function (c) { return c.studentId === s.id; });
    var classes = d.classes.filter(function (c) { return c.studentIds.indexOf(s.id) >= 0; });
    var canE = A.can('students', 'edit');
    main.innerHTML = M.detailHead('students', 'All students', s.name, s.id + ' · ' + s.grade + ' · ' + A.nameOf('centres', s.centreId),
      (canE ? A.btn('Edit', 'edit', 'data-edit', 'ghost') + A.btn('Transfer', 'swap', 'data-transfer', 'ghost') + A.btn('Assign classes', 'calendardays', 'data-classes', 'ghost') : '') + A.btn('QR / Card', 'qr', 'data-qr')) +
      '<div class="a-profile">' + A.avatar(s.name, s.photo, 'xl') + '<div><h2>' + esc(s.name) + ' ' + A.badge(s.status) + '</h2><p class="muted">' + esc(s.gender) + ' · ' + A.age(s.dob) + ' years · ' + esc(s.membership) + ' member since ' + A.date(s.joinDate) + '</p></div>' +
      '<div class="a-mini-stats"><div><b>' + M.pct(M.attRate(att)) + '</b><span>Attendance</span></div><div><b>' + A.money(A.sum(pays.filter(function (p) { return ['Unpaid', 'Overdue', 'Partial'].indexOf(p.status) >= 0; }), M.balance)) + '</b><span>Outstanding</span></div><div><b>' + grads.filter(function (g) { return g.result === 'Pass'; }).length + '</b><span>Gradings passed</span></div><div><b>' + tours.filter(function (t) { return t.medal && t.medal !== 'None'; }).length + '</b><span>Medals</span></div></div></div>' +
      '<div data-tabs></div>';
    var on = function (sel, fn) { var b = $(sel, main); if (b) b.addEventListener('click', fn); };
    on('[data-edit]', function () { view.openEdit(s, A.refresh); });
    on('[data-transfer]', function () { transferStudent(s, A.refresh); });
    on('[data-qr]', function () { M.studentQR(s); });
    on('[data-classes]', function () {
      var opts = d.classes.filter(function (c) { return c.centreId === s.centreId && c.status === 'Active'; });
      A.openForm({ title: 'Assign classes · ' + s.name, size: 'sm', fields: [{ k: 'cls', l: 'Classes at ' + A.nameOf('centres', s.centreId), type: 'multi', opts: opts.map(function (c) { return [c.id, c.name + ' (' + c.days.join('/') + ' ' + c.start + ') · ' + c.studentIds.length + '/' + c.capacity]; }) }],
        rec: { cls: classes.map(function (c) { return c.id; }) },
        extraValidate: function (v) { var full = opts.filter(function (c) { return v.cls.indexOf(c.id) >= 0 && c.studentIds.indexOf(s.id) < 0 && c.studentIds.length >= c.capacity; }); return full.length ? { cls: full[0].name + ' is full (' + full[0].capacity + ' students).' } : {}; },
        onSave: function (v) {
          opts.forEach(function (c) { var has = c.studentIds.indexOf(s.id) >= 0, want = v.cls.indexOf(c.id) >= 0; if (has !== want) { var ids = c.studentIds.slice(); if (want) ids.push(s.id); else ids.splice(ids.indexOf(s.id), 1); A.put('classes', { id: c.id, studentIds: ids }, 'classes', (want ? 'Added ' : 'Removed ') + s.name + (want ? ' to ' : ' from ') + c.name); } });
          return true;
        }, after: A.refresh });
    });
    A.tabs($('[data-tabs]', main), [
      { label: 'Profile', icon: 'user', render: function (b) {
        b.innerHTML = '<div class="a-grid2">' + A.panel('Personal details', A.dl([['Student ID', esc(s.id)], ['IC / Passport', esc(s.ic)], ['Date of birth', A.date(s.dob) + ' (' + A.age(s.dob) + ')'], ['Gender', esc(s.gender)], ['Phone', esc(s.phone)], ['Email', esc(s.email)], ['Parent / guardian', esc(s.guardian) + (s.guardianPhone ? ' · ' + esc(s.guardianPhone) : '')]])) +
          A.panel('Membership', A.dl([['Club', esc(A.nameOf('clubs', s.clubId))], ['Training centre', esc(A.nameOf('centres', s.centreId))], ['Instructor', esc(A.nameOf('instructors', s.instructorId))], ['Current grade', esc(s.grade)], ['Membership', esc(s.membership)], ['Classes', classes.map(function (c) { return '<a class="a-link" href="#/classes/' + c.id + '">' + esc(c.name) + '</a>'; }).join(', ')], ['Status', A.badge(s.status)]])) + '</div>';
      } },
      { label: 'Attendance', icon: 'calendarcheck', count: att.length, render: function (b) { M.subTable(b, { rows: function () { return att; }, defaultSort: { k: 'date', dir: -1 }, dateKey: 'date', filters: [FL.status(['Present', 'Absent', 'Late', 'Excused'])], cols: [C.date('date', 'Date'), C.ref('classId', 'Class', 'classes'), C.status(), C.text('method', 'Method')], exportName: s.name + ' attendance', pageSize: 10 }); } },
      { label: 'Payments', icon: 'wallet', count: pays.length, render: function (b) { M.subTable(b, { rows: function () { return pays; }, defaultSort: { k: 'date', dir: -1 }, cols: [C.text('invoiceNo', 'Invoice'), C.date('date', 'Date'), C.text('desc', 'Description'), C.money('amount', 'Amount'), C.money('paid', 'Paid'), C.text('method', 'Method'), C.status()], onRow: function (p) { M.showInvoice(p); }, exportName: s.name + ' payments', pageSize: 10 }); } },
      { label: 'Grading', icon: 'gradcap', count: grads.length, render: function (b) { M.subTable(b, { rows: function () { return grads; }, cols: [C.ref('gradingId', 'Grading', 'gradings'), C.calc('date', 'Date', function (c) { var g = A.byId('gradings', c.gradingId); return g ? A.date(g.date) : ''; }), C.text('fromGrade', 'From'), C.text('gradeAwarded', 'Awarded'), C.text('score', 'Score'), C.status('result', 'Result'), C.text('remarks', 'Examiner remarks')], onRow: function (c) { A.go('#/gradings/' + c.gradingId); }, exportName: s.name + ' grading history' }); } },
      { label: 'Tournament', icon: 'trophy', count: tours.length, render: function (b) { M.subTable(b, { rows: function () { return tours; }, cols: [C.ref('tournamentId', 'Tournament', 'tournaments'), C.text('category', 'Category'), C.text('weight', 'Weight'), C.num('wins', 'Wins'), C.num('losses', 'Losses'), C.status('medal', 'Medal'), C.num('points', 'Points')], onRow: function (c) { A.go('#/tournaments/' + c.tournamentId); }, exportName: s.name + ' tournaments' }); } },
      { label: 'Documents', icon: 'file', count: (s.documents || []).length, render: function (b) {
        var docs = s.documents || [];
        b.innerHTML = (canE ? '<form class="a-upload"><input class="a-input" type="file" name="docs" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" aria-label="Upload documents" /><button class="a-btn primary" type="submit">' + A.icon('upload') + 'Upload</button><p class="a-help">PDF, JPG, PNG or DOC up to 5 MB. Demo mode stores the file name only.</p><p class="a-err" data-err="docs"></p></form>' : '') +
          (docs.length ? '<ul class="a-files">' + docs.map(function (f, i) { return '<li>' + A.icon('file', 'w-5') + '<span><b>' + esc(f.name) + '</b><small>' + (f.size ? Math.round(f.size / 1024) + ' KB · ' : '') + 'uploaded ' + A.date(f.at) + '</small></span>' + (canE ? '<button class="icon-btn sm danger" data-rm="' + i + '" aria-label="Remove ' + esc(f.name) + '">' + A.icon('trash') + '</button>' : '') + '</li>'; }).join('') + '</ul>' : '<div class="a-empty">' + A.icon('file', 'w-8') + '<b>No documents uploaded yet.</b></div>');
        var form = $('form', b);
        if (form) form.addEventListener('submit', function (e) {
          e.preventDefault();
          A.readFiles(form, [{ k: 'docs', type: 'file' }]).then(function (out) {
            if (out.__error) { A.showErrors(form, { docs: out.__error.msg }); return; }
            if (!out.docs) { A.showErrors(form, { docs: 'Choose at least one file.' }); return; }
            A.put('students', { id: s.id, documents: docs.concat(out.docs) }, 'students', 'Uploaded ' + out.docs.length + ' document(s) for ' + s.name); A.toast('Uploaded.'); A.refresh();
          });
        });
        $$('[data-rm]', b).forEach(function (btn) { btn.addEventListener('click', function () { var i = +btn.getAttribute('data-rm'); A.confirm('Remove ' + docs[i].name + '?', { danger: true, ok: 'Remove' }).then(function (ok) { if (ok) { var nd = docs.slice(); nd.splice(i, 1); A.put('students', { id: s.id, documents: nd }, 'students'); A.refresh(); } }); }); });
      } },
      { label: 'Activity History', icon: 'history', render: function (b) { M.historyTab(b, s.id); } }
    ]);
  }
  M.historyTab = function (b, id) {
    if (!A.can('audit', 'view') && !A.can('students', 'edit')) { b.innerHTML = '<p class="muted">You do not have access to the activity history.</p>'; return; }
    var rows = D().audit.filter(function (x) { return x.recordId === id || (x.summary || '').indexOf(id) >= 0; });
    b.innerHTML = rows.length ? '<ul class="a-timeline">' + rows.map(function (x) { return '<li><span class="a-dot ' + (x.action === 'Delete' ? 'bad' : x.action === 'Create' ? 'ok' : 'neutral') + '"></span><div><b>' + esc(x.user) + '</b> · ' + esc(x.action) + (x.summary ? ' — ' + esc(x.summary) : '') + '<small>' + A.datetime(x.at) + '</small>' + (x.changes.length ? '<ul>' + x.changes.map(function (c) { return '<li><code>' + esc(c.field) + '</code>: ' + esc(c.from || '—') + ' → ' + esc(c.to || '—') + '</li>'; }).join('') + '</ul>' : '') + '</div></li>'; }).join('') + '</ul>'
      : '<div class="a-empty">' + A.icon('history', 'w-8') + '<b>No changes recorded yet.</b><span class="muted">Edits made in this portal will appear here.</span></div>';
  };

  /* ======================================================
     INSTRUCTORS
     ====================================================== */
  A.views.instructors = M.crud({
    key: 'instructors', coll: 'instructors', title: 'Instructors', single: 'Instructor', group: 'Management', icon: 'award', prefix: 'INS',
    sub: 'Coaches and trainers, their qualifications and assignments.',
    search: function (r) { return [r.id, r.name, r.ic, r.phone, r.email].join(' '); },
    cols: function () { return [C.id, C.name('Instructor', true), C.text('phone', 'Phone'), C.ref('centreId', 'Training centre', 'centres'), C.text('sport', 'Sport'), C.text('rank', 'Rank'),
      C.num('classes', 'Classes', function (r) { return D().classes.filter(function (c) { return c.instructorId === r.id && c.status === 'Active'; }).length; }),
      C.num('students', 'Students', function (r) { return D().students.filter(function (c) { return c.instructorId === r.id && c.status === 'Active'; }).length; }), C.text('employment', 'Employment'), C.status()]; },
    filters: function () { return FL.club().concat([FL.centre, FL.plain('employment', 'Employment', ['Full-time', 'Part-time', 'Contract']), FL.status(['Active', 'Inactive'])]); },
    fields: function () { return [
      { k: 'name', l: 'Full name', req: true }, { k: 'ic', l: 'IC / Passport', req: true, unique: true, ic: true },
      { k: 'phone', l: 'Phone', type: 'tel', req: true }, { k: 'email', l: 'Email', type: 'email', req: true, unique: true },
      F.centre(), { k: 'sport', l: 'Martial art / sport', type: 'select', opts: DB.SPORTS, req: true },
      { k: 'qualification', l: 'Qualification' }, { k: 'certification', l: 'Certification' },
      { k: 'rank', l: 'Rank / grade', type: 'select', opts: A.settings().grades, req: true }, { k: 'joinDate', l: 'Join date', type: 'date', req: true, def: A.today },
      { k: 'employment', l: 'Employment status', type: 'select', opts: ['Full-time', 'Part-time', 'Contract'], req: true },
      { k: 'baseSalary', l: 'Base salary', type: 'number', min: 0, req: true, def: 1800 },
      { k: 'address', l: 'Address', type: 'textarea', rows: 2 }, F.status(['Active', 'Inactive']),
      { k: 'photo', l: 'Photo', type: 'file', image: true, accept: 'image/*' }
    ]; },
    canDelete: function (r) { return D().classes.some(function (c) { return c.instructorId === r.id; }) || D().payroll.some(function (c) { return c.instructorId === r.id; }) ? 'This instructor has classes or payroll records. Set them to Inactive instead.' : null; },
    actions: function (r) { return [{ icon: r.status === 'Active' ? 'eyeoff' : 'check', label: r.status === 'Active' ? 'Deactivate' : 'Activate', show: A.can('instructors', 'edit'), fn: function () { A.put('instructors', { id: r.id, status: r.status === 'Active' ? 'Inactive' : 'Active' }, 'instructors'); M.reload(); } }]; },
    detail: function (main, r, view) {
      var d = D();
      var cls = d.classes.filter(function (c) { return c.instructorId === r.id; });
      var st = d.students.filter(function (s) { return s.instructorId === r.id; });
      var att = d.attendance.filter(function (a) { return a.instructorId === r.id; });
      var sessions = {}; att.forEach(function (a) { sessions[a.date + a.classId] = { id: a.date + a.classId, date: a.date, classId: a.classId }; });
      var sess = Object.keys(sessions).map(function (k) { return sessions[k]; });
      var pay = d.payroll.filter(function (p) { return p.instructorId === r.id; });
      var cands = d.candidates.filter(function (c) { var s = A.byId('students', c.studentId); return s && s.instructorId === r.id && c.result !== 'Pending'; });
      var pass = cands.length ? Math.round(100 * cands.filter(function (c) { return c.result === 'Pass'; }).length / cands.length) : null;
      main.innerHTML = M.detailHead('instructors', 'All instructors', r.name, r.rank + ' · ' + r.sport + ' · ' + A.nameOf('centres', r.centreId), A.can('instructors', 'edit') ? A.btn('Edit', 'edit', 'data-edit') : '') +
        '<div class="a-stats">' + A.statCard('Classes', A.num(cls.length), 'calendardays') + A.statCard('Students', A.num(st.length), 'users') + A.statCard('Sessions (28 days)', A.num(sess.length), 'calendarcheck') +
        A.statCard('Class attendance rate', M.pct(M.attRate(att)), 'activity', 'performance') + A.statCard('Grading pass rate', M.pct(pass), 'gradcap', cands.length + ' results') + '</div><div data-tabs></div>';
      var e = $('[data-edit]', main); if (e) e.addEventListener('click', function () { view.openEdit(r, A.refresh); });
      A.tabs($('[data-tabs]', main), [
        { label: 'Profile', render: function (b) { b.innerHTML = A.panel('Details', A.dl([['IC / Passport', esc(r.ic)], ['Phone', esc(r.phone)], ['Email', esc(r.email)], ['Address', esc(r.address)], ['Qualification', esc(r.qualification)], ['Certification', esc(r.certification)], ['Employment', esc(r.employment)], ['Joined', A.date(r.joinDate)], ['Status', A.badge(r.status)]])); } },
        { label: 'Classes', count: cls.length, render: function (b) { M.subTable(b, { rows: function () { return cls; }, cols: [C.id, C.text('name', 'Class'), C.calc('s', 'Schedule', function (c) { return c.days.join(', ') + ' ' + c.start + '–' + c.end; }), C.calc('n', 'Students', function (c) { return c.studentIds.length + ' / ' + c.capacity; }), C.status()], onRow: function (c) { A.go('#/classes/' + c.id); }, exportName: r.name + ' classes' }); } },
        { label: 'Students', count: st.length, render: function (b) { M.subTable(b, { rows: function () { return st; }, search: ['id', 'name'], cols: [C.id, C.name('Student'), C.text('grade', 'Grade'), C.status()], onRow: function (c) { A.go('#/students/' + c.id); }, exportName: r.name + ' students' }); } },
        { label: 'Class history', count: sess.length, render: function (b) { M.subTable(b, { rows: function () { return sess; }, defaultSort: { k: 'date', dir: -1 }, cols: [C.date('date', 'Date'), C.ref('classId', 'Class', 'classes'), C.calc('p', 'Present', function (x) { return att.filter(function (a) { return a.date === x.date && a.classId === x.classId && a.status !== 'Absent'; }).length + ' / ' + att.filter(function (a) { return a.date === x.date && a.classId === x.classId; }).length; })], exportName: r.name + ' sessions' }); } },
        { label: 'Payroll', count: pay.length, show: A.can('payroll', 'view'), render: function (b) { M.subTable(b, { rows: function () { return pay; }, cols: [C.text('month', 'Month'), C.money('salary', 'Salary'), C.money('net', 'Net pay'), C.status()], exportName: r.name + ' payroll' }); } }
      ].filter(function (t) { return t.show !== false; }));
    }
  });

  /* ======================================================
     CLASSES
     ====================================================== */
  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function manageClassStudents(c, done) {
    var pool = D().students.filter(function (s) { return s.centreId === c.centreId && s.status === 'Active'; });
    A.openForm({ title: 'Students in ' + c.name, size: 'lg', fields: [{ k: 'studentIds', l: 'Active students at ' + A.nameOf('centres', c.centreId) + ' (capacity ' + c.capacity + ')', type: 'multi', opts: pool.map(function (s) { return [s.id, s.name + ' · ' + s.grade]; }) }],
      rec: { studentIds: c.studentIds.slice() },
      extraValidate: function (v) { return v.studentIds.length > c.capacity ? { studentIds: 'This class holds ' + c.capacity + ' students. You selected ' + v.studentIds.length + '.' } : {}; },
      onSave: function (v) { A.put('classes', { id: c.id, studentIds: v.studentIds }, 'classes', 'Updated students in ' + c.name); return true; }, after: done || M.reload });
  }
  A.views.classes = M.crud({
    key: 'classes', coll: 'classes', title: 'Classes', single: 'Class', group: 'Management', icon: 'calendardays', prefix: 'CL',
    sub: 'Recurring and one-off classes per centre.',
    search: ['id', 'name', 'ageGroup', 'level'],
    cols: function () { return [C.id, C.name('Class'), C.ref('centreId', 'Training centre', 'centres'), C.ref('instructorId', 'Instructor', 'instructors'),
      C.calc('sched', 'Schedule', function (r) { return (r.recurring === 'Weekly' ? r.days.join(', ') : A.date(r.date)) + ' · ' + r.start + '–' + r.end; }),
      C.calc('cap', 'Students', function (r) { return r.studentIds.length + ' / ' + r.capacity; }), C.text('level', 'Level'), C.text('ageGroup', 'Age group'), C.status()]; },
    filters: function () { return FL.club().concat([FL.centre, FL.instructor, FL.plain('type', 'Class type', A.settings().classTypes), FL.status(['Active', 'Cancelled'])]); },
    fields: function () { return [
      { k: 'name', l: 'Class name', req: true }, { k: 'type', l: 'Class type', type: 'select', opts: A.settings().classTypes, req: true },
      F.centre(), { k: 'instructorId', l: 'Instructor', type: 'select', ref: 'instructors', req: true, refFilter: function (i) { return i.status === 'Active'; }, refLabel: function (i) { return ' (' + A.nameOf('centres', i.centreId) + ')'; } },
      { k: 'recurring', l: 'Schedule type', type: 'select', opts: ['Weekly', 'One-off'], req: true, def: 'Weekly' },
      { k: 'days', l: 'Days (weekly classes)', type: 'multi', opts: DAYS }, { k: 'date', l: 'Date (one-off classes)', type: 'date' },
      { k: 'start', l: 'Start time', type: 'time', req: true }, { k: 'end', l: 'End time', type: 'time', req: true, check: function (v, all) { return all.start && v <= all.start ? 'End time must be after the start time.' : ''; } },
      { k: 'capacity', l: 'Student capacity', type: 'number', min: 1, req: true, def: 20 }, { k: 'level', l: 'Grade / level', type: 'select', opts: A.settings().grades },
      { k: 'ageGroup', l: 'Age group', ph: 'e.g. 5–12' }, F.status(['Active', 'Cancelled'])
    ]; },
    validate: function (v) {
      var e = {};
      if (v.recurring === 'Weekly' && !(v.days || []).length) e.days = 'Pick at least one day for a weekly class.';
      if (v.recurring === 'One-off' && !v.date) e.date = 'Pick the date for a one-off class.';
      var i = A.byId('instructors', v.instructorId); if (i && v.centreId && i.centreId !== v.centreId) e.instructorId = 'This instructor is based at ' + A.nameOf('centres', i.centreId) + '.';
      return e;
    },
    newRec: function () { return { days: [], studentIds: [] }; },
    beforeSave: function (o) { if (!o.studentIds) o.studentIds = []; if (o.recurring === 'One-off') o.days = []; },
    canDelete: function (r) { return D().attendance.some(function (a) { return a.classId === r.id; }) ? 'This class has attendance records. Cancel it instead of deleting.' : null; },
    actions: function (r) { return [
      { icon: 'calendarcheck', label: 'Take attendance', show: A.can('attendance', 'create'), fn: function () { A.go('#/attendance/take/' + r.id); } },
      { icon: 'users', label: 'Add / remove students', show: A.can('classes', 'edit'), fn: function () { manageClassStudents(r); } },
      { icon: 'copy', label: 'Duplicate', show: A.can('classes', 'create'), fn: function () { var c = Object.assign({}, r, { id: DB.nextId('classes', 'CL'), name: r.name + ' (copy)', studentIds: [] }); A.put('classes', c, 'classes', 'Duplicated ' + r.name); A.toast('Class duplicated without students.'); M.reload(); } },
      { icon: 'x', label: r.status === 'Cancelled' ? 'Re-activate' : 'Cancel class', show: A.can('classes', 'edit'), fn: function () { var nx = r.status === 'Cancelled' ? 'Active' : 'Cancelled'; A.confirm((nx === 'Cancelled' ? 'Cancel ' : 'Re-activate ') + r.name + '?', { danger: nx === 'Cancelled' }).then(function (ok) { if (ok) { A.put('classes', { id: r.id, status: nx }, 'classes'); M.reload(); } }); } }
    ]; },
    detail: function (main, c, view) {
      var d = D(); var att = d.attendance.filter(function (a) { return a.classId === c.id; });
      main.innerHTML = M.detailHead('classes', 'All classes', c.name, A.nameOf('centres', c.centreId) + ' · ' + (c.recurring === 'Weekly' ? c.days.join(', ') : A.date(c.date)) + ' ' + c.start + '–' + c.end,
        (A.can('classes', 'edit') ? A.btn('Edit', 'edit', 'data-edit', 'ghost') + A.btn('Add / remove students', 'users', 'data-st', 'ghost') : '') + (A.can('attendance', 'create') ? A.btn('Take attendance', 'calendarcheck', 'data-att') : '')) +
        '<div class="a-stats">' + A.statCard('Students', c.studentIds.length + ' / ' + c.capacity, 'users') + A.statCard('Instructor', esc(A.nameOf('instructors', c.instructorId)), 'award') + A.statCard('Attendance rate', M.pct(M.attRate(att)), 'activity', '28 days') + A.statCard('Status', A.badge(c.status), 'info') + '</div><div data-tabs></div>';
      var on = function (s, f) { var b = $(s, main); if (b) b.addEventListener('click', f); };
      on('[data-edit]', function () { view.openEdit(c, A.refresh); }); on('[data-st]', function () { manageClassStudents(c, A.refresh); }); on('[data-att]', function () { A.go('#/attendance/take/' + c.id); });
      var st = d.students.filter(function (s) { return c.studentIds.indexOf(s.id) >= 0; });
      A.tabs($('[data-tabs]', main), [
        { label: 'Students', count: st.length, render: function (b) { M.subTable(b, { rows: function () { return st; }, cols: [C.id, C.name('Student'), C.text('grade', 'Grade'), C.calc('r', 'Attendance', function (s) { return M.pct(M.attRate(att.filter(function (a) { return a.studentId === s.id; }))); }, 'num'), C.status()], onRow: function (s) { A.go('#/students/' + s.id); }, exportName: c.name + ' students' }); } },
        { label: 'Attendance', count: att.length, render: function (b) { M.subTable(b, { rows: function () { return att; }, dateKey: 'date', defaultSort: { k: 'date', dir: -1 }, filters: [FL.status(['Present', 'Absent', 'Late', 'Excused'])], cols: [C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.status(), C.text('method', 'Method')], exportName: c.name + ' attendance', pageSize: 10 }); } }
      ]);
    }
  });

  /* ======================================================
     ONLINE REGISTRATION
     ====================================================== */
  function regLink() { var base = location.href.replace(/[^/]*$/, ''); return base + 'player-register.html?ref=' + encodeURIComponent(A.settings().regLinkSlug || 'join') + (A.role().scope !== 'all' ? '&club=' + A.user().clubId : ''); }
  M.approveRegistration = function (r) {
    if (r.type === 'Instructor') {
      var club = A.byId('clubs', r.clubId);
      var ins = { id: DB.nextId('instructors', 'INS'), name: r.name, ic: r.ic, phone: r.phone, email: r.email, address: '', clubId: r.clubId, centreId: r.centreId, sport: club ? club.sport : '', qualification: '', certification: '', rank: 'Black 1st Dan', joinDate: A.today(), employment: 'Part-time', status: 'Active', baseSalary: 1200 };
      A.put('instructors', ins, 'instructors', 'Created from registration ' + r.id);
      A.put('registrations', { id: r.id, status: 'Approved', convertedTo: ins.id, decidedBy: A.user().name, decidedOn: A.today() }, 'registrations');
      return ins;
    }
    var ins2 = D().instructors.filter(function (i) { return i.centreId === r.centreId && i.status === 'Active'; })[0];
    var st = { id: DB.nextId('students', 'ST'), name: r.name, ic: r.ic, dob: r.dob, gender: r.gender, phone: r.phone, email: r.email, guardian: r.guardian || '', guardianPhone: '', clubId: r.clubId, centreId: r.centreId, instructorId: ins2 ? ins2.id : '', joinDate: A.today(), grade: A.settings().grades[0], membership: 'Monthly', status: 'Active', documents: r.documents ? [{ name: r.documents, at: r.submitted }] : [] };
    A.put('students', st, 'students', 'Created from registration ' + r.id);
    if (r.fee) {
      var p = { id: DB.nextId('payments', 'PAY', 5), studentId: st.id, clubId: st.clubId, centreId: st.centreId, type: 'Registration Fee', desc: 'Registration fee (' + r.id + ')', amount: +r.fee, paid: r.feePaid ? +r.fee : 0, discount: 0, tax: 0, method: r.feePaid ? 'FPX' : '', date: A.today(), dueDate: A.today(), status: r.feePaid ? 'Paid' : 'Unpaid', collectedBy: '' };
      p.invoiceNo = M.fmtNo(A.settings().invoiceFormat, p.id); p.receiptNo = r.feePaid ? M.fmtNo(A.settings().receiptFormat, p.id) : ''; if (r.feePaid) p.txnId = 'TXN' + Date.now().toString().slice(-8);
      A.put('payments', p, 'payments');
    }
    A.put('registrations', { id: r.id, status: 'Approved', convertedTo: st.id, decidedBy: A.user().name, decidedOn: A.today() }, 'registrations');
    return st;
  };
  M.rejectRegistration = function (r, reason) { A.put('registrations', { id: r.id, status: 'Rejected', reason: reason, decidedBy: A.user().name, decidedOn: A.today() }, 'registrations'); };
  A.views.registrations = M.crud({
    key: 'registrations', coll: 'registrations', title: 'Online Registration', navTitle: 'Registration', single: 'Application', group: 'Management', icon: 'userplus', prefix: 'REG',
    sub: 'Applications from the public registration link, QR code and walk-ins.',
    addLabel: 'Add walk-in application', badge: function () { return A.rows('registrations').filter(function (r) { return r.status === 'Pending'; }).length; },
    search: function (r) { return [r.id, r.name, r.ic, r.phone, r.email].join(' '); }, dateKey: 'submitted', dateLabel: 'Submitted', sort: { k: 'submitted', dir: -1 },
    cols: function () { return [C.id, C.text('type', 'Type'), C.name('Applicant'), C.text('ic', 'IC / Passport'), C.text('phone', 'Phone'), C.ref('centreId', 'Training centre', 'centres'), C.date('submitted', 'Submitted'), C.text('source', 'Source'),
      { k: 'fee', l: 'Fee', fmt: function (r) { return A.money(r.fee) + ' ' + A.badge(r.feePaid ? 'Paid' : 'Unpaid'); }, text: function (r) { return r.fee + (r.feePaid ? ' paid' : ' unpaid'); } }, C.status()]; },
    filters: function () { return FL.club().concat([FL.status(['Pending', 'Approved', 'Rejected']), FL.plain('type', 'Type', ['Student', 'Instructor']), FL.centre, FL.plain('source', 'Source', ['Registration link', 'QR code', 'Walk-in'])]); },
    fields: function () { var rf = A.settings().regFields || {}; return [
      { k: 'type', l: 'Applying as', type: 'select', opts: ['Student', 'Instructor'], req: true, def: 'Student' }, { k: 'name', l: 'Full name', req: true },
      { k: 'ic', l: 'IC / Passport', req: !!rf.ic, ic: true }, { k: 'dob', l: 'Date of birth', type: 'date', req: !!rf.dob },
      { k: 'gender', l: 'Gender', type: 'select', opts: ['Male', 'Female'], req: true }, { k: 'phone', l: 'Phone', type: 'tel', req: true }, { k: 'email', l: 'Email', type: 'email', req: true },
      { k: 'guardian', l: 'Parent / guardian', help: rf.guardian ? 'Required for applicants under 18.' : '' }, F.centre(),
      { k: 'fee', l: 'Registration fee', type: 'number', min: 0, def: 50 }, { k: 'feePaid', l: 'Fee', type: 'checkbox', text: 'Registration fee paid' },
      { k: 'documents', l: 'Supporting document', req: !!rf.documents, ph: 'e.g. IC copy.pdf' }
    ]; },
    validate: function (v) {
      var e = {};
      if ((A.settings().regFields || {}).guardian && v.type === 'Student' && v.dob && A.age(v.dob) < 18 && !v.guardian) e.guardian = 'A parent or guardian is required for applicants under 18.';
      if (v.ic) { var dup = D().students.filter(function (s) { return s.ic.replace(/-/g, '') === v.ic.replace(/-/g, ''); })[0]; if (dup) e.ic = 'A student with this IC already exists: ' + dup.name + ' (' + dup.id + ').'; }
      return e;
    },
    beforeSave: function (o, old, isNew) { if (isNew) { o.submitted = A.today(); o.status = 'Pending'; o.source = 'Walk-in'; } if (o.guardian === undefined) o.guardian = ''; },
    actions: function (r) { return [
      { icon: 'check', label: 'Approve & convert', show: r.status === 'Pending' && A.can('registrations', 'approve'), fn: function () { A.confirm('Approve ' + r.name + ' and create a new ' + r.type.toLowerCase() + ' record?', { ok: 'Approve' }).then(function (ok) { if (!ok) return; var rec = M.approveRegistration(r); A.toast(r.name + ' approved as ' + rec.id + '.'); M.reload(); }); } },
      { icon: 'x', label: 'Reject', danger: true, show: r.status === 'Pending' && A.can('registrations', 'approve'), fn: function () { A.prompt('Reject ' + r.name, 'Reason', { required: true, ok: 'Reject', danger: true }).then(function (why) { if (why) { M.rejectRegistration(r, why); A.toast('Application rejected.', 'info'); M.reload(); } }); } },
      { icon: 'arrowright', label: 'Open converted record', show: !!r.convertedTo, fn: function () { A.go('#/' + (r.type === 'Instructor' ? 'instructors' : 'students') + '/' + r.convertedTo); } }
    ]; },
    noEdit: false,
    top: function (host) {
      var link = regLink();
      var pending = A.rows('registrations').filter(function (r) { return r.status === 'Pending'; }).length;
      var approved = A.rows('registrations').filter(function (r) { return r.status === 'Approved'; }).length;
      var rejected = A.rows('registrations').filter(function (r) { return r.status === 'Rejected'; }).length;
      host.innerHTML = '<div class="a-grid2 tight"><section class="a-panel"><div class="a-panel-h"><h3>Registration link & QR</h3></div><div class="a-panel-b a-reglink"><div>' + A.qrSVG(link, 120) + '</div><div><p class="muted">Share this link or QR code. Students and instructors fill in the form and appear below as pending applications.</p><div class="a-copy"><input class="a-input" readonly value="' + esc(link) + '" aria-label="Registration link" /><button type="button" class="a-btn ghost" data-copy>' + A.icon('copy') + 'Copy</button></div>' +
        (A.can('settings', 'edit') || A.can('registrations', 'edit') ? '<button type="button" class="a-btn ghost sm" data-builder>' + A.icon('sliders') + 'Form builder</button> ' : '') + '<button type="button" class="a-btn ghost sm" data-printqr>' + A.icon('printer') + 'Print QR poster</button></div></div></section>' +
        '<section class="a-panel"><div class="a-panel-h"><h3>Applications</h3></div><div class="a-panel-b"><div class="a-mini-stats"><div><b>' + pending + '</b><span>Pending</span></div><div><b>' + approved + '</b><span>Approved</span></div><div><b>' + rejected + '</b><span>Rejected</span></div></div></div></section></div>';
      $('[data-copy]', host).addEventListener('click', function () { var i = $('.a-copy input', host); i.select(); try { navigator.clipboard.writeText(link).then(function () { A.toast('Link copied.'); }, function () { document.execCommand('copy'); A.toast('Link copied.'); }); } catch (e) { document.execCommand('copy'); A.toast('Link copied.'); } });
      $('[data-printqr]', host).addEventListener('click', function () { A.printHTML('Registration QR', '<div class="cert"><h1>Join ' + esc(M.isSuper() ? 'D-CLIX' : A.nameOf('clubs', A.user().clubId)) + '</h1><p>Scan to register online</p><div style="display:flex;justify-content:center;margin:20px 0">' + A.qrSVG(link, 260) + '</div><p class="muted">' + esc(link) + '</p></div>'); });
      var b = $('[data-builder]', host);
      if (b) b.addEventListener('click', function () {
        var rf = A.settings().regFields || {};
        A.openForm({ title: 'Registration form builder', size: 'sm', rec: rf, fields: [
          { k: 'ic', l: 'IC / Passport', type: 'checkbox', text: 'Required' }, { k: 'dob', l: 'Date of birth', type: 'checkbox', text: 'Required' },
          { k: 'guardian', l: 'Parent / guardian (under 18)', type: 'checkbox', text: 'Required' }, { k: 'documents', l: 'Document upload', type: 'checkbox', text: 'Required' },
          { k: 'address', l: 'Address', type: 'checkbox', text: 'Required' }],
          onSave: function (v) { var s = A.settings(); var before = JSON.stringify(s.regFields); s.regFields = v; A.audit('Update', 'settings', 'regFields', [{ field: 'regFields', from: before, to: JSON.stringify(v) }], 'Changed registration form fields'); DB.save(); return true; }, after: A.refresh });
      });
    }
  });
})();
