/* ==========================================================
   D-Clix Admin — Communication, Reports, Administration
   notifications · reports · users · roles · approvals ·
   audit log · settings · my profile · navigation + boot
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, M = A.M, C = M.C, FL = M.FL, esc = A.esc, $ = A.$, $$ = A.$$;
  function D() { return DB.data; }
  function S() { return A.settings(); }

  /* ======================================================
     NOTIFICATIONS
     ====================================================== */
  var RECIPIENTS = ['All Students', 'Selected Students', 'Parents', 'Instructors', 'Training Centre', 'Specific Class', 'Specific Grade'];
  var CHANNELS = ['Push', 'WhatsApp', 'Email', 'Announcement'];
  function targetOptions(type) {
    if (type === 'Selected Students') return A.rows('students').filter(function (s) { return s.status === 'Active'; }).map(function (s) { return [s.id, s.name + ' · ' + s.id]; });
    if (type === 'Training Centre') return A.rows('centres').map(function (c) { return [c.id, c.name]; });
    if (type === 'Specific Class') return A.rows('classes').filter(function (c) { return c.status === 'Active'; }).map(function (c) { return [c.id, c.name + ' · ' + A.nameOf('centres', c.centreId)]; });
    if (type === 'Specific Grade') return S().grades.map(function (g) { return [g, g]; });
    return [];
  }
  function audienceSize(type, target) {
    var st = A.rows('students').filter(function (s) { return s.status === 'Active'; });
    var t = String(target || '').split(',').filter(Boolean);
    switch (type) {
      case 'All Students': return st.length;
      case 'Parents': return st.filter(function (s) { return s.guardian; }).length;
      case 'Instructors': return A.rows('instructors').filter(function (i) { return i.status === 'Active'; }).length;
      case 'Selected Students': return t.length;
      case 'Training Centre': return st.filter(function (s) { return t.indexOf(s.centreId) >= 0; }).length;
      case 'Specific Class': return A.rows('classes').filter(function (c) { return t.indexOf(c.id) >= 0; }).reduce(function (n, c) { return n + c.studentIds.length; }, 0);
      case 'Specific Grade': return st.filter(function (s) { return t.indexOf(s.grade) >= 0; }).length;
    }
    return 0;
  }
  function channelOn(ch) { return ch === 'Announcement' || (ch === 'Email' && S().notifyEmail) || (ch === 'WhatsApp' && S().notifyWhatsApp) || (ch === 'Push' && S().notifyPush); }
  function compose(prefill) {
    var fields = [
      { k: 'title', l: 'Title', req: true }, { k: 'message', l: 'Message', type: 'textarea', rows: 4, req: true, check: function (v, all) { return all.channels && all.channels.indexOf('WhatsApp') >= 0 && v.length > 1000 ? 'WhatsApp messages are limited to 1000 characters.' : ''; } },
      { k: 'channels', l: 'Send via', type: 'multi', opts: CHANNELS.map(function (c) { return [c, c + (channelOn(c) ? '' : ' (off in Settings)')]; }), req: true },
      { k: 'recipients', l: 'Recipients', type: 'select', opts: RECIPIENTS, req: true, def: 'All Students' },
      { k: 'target', l: 'Target', type: 'multi', opts: function (r) { return targetOptions(r.recipients || 'All Students'); }, help: 'Only needed for selected students, a centre, a class or a grade.' },
      { k: 'attachment', l: 'Attachment', type: 'file', accept: '.pdf,.jpg,.jpeg,.png' },
      { k: 'schedule', l: 'Schedule (leave empty to send now)', type: 'datetime-local' }
    ];
    A.openForm({ title: 'Send notification', rec: Object.assign({ recipients: 'All Students' }, prefill || {}), fields: fields, size: 'lg',
      onOpen: function (m, form) {
        var sel = form.recipients; var box = $('#f_target', form);
        var info = document.createElement('p'); info.className = 'a-help'; box.parentNode.appendChild(info);
        function refill() {
          var opts = targetOptions(sel.value);
          box.innerHTML = opts.length ? opts.map(function (o) { return '<label class="a-check"><input type="checkbox" name="target" value="' + esc(o[0]) + '" /> ' + esc(o[1]) + '</label>'; }).join('') : '<span class="muted">Not needed for ' + esc(sel.value.toLowerCase()) + '.</span>';
          count();
        }
        function count() { var t = $$('input[name=target]:checked', form).map(function (c) { return c.value; }).join(','); info.textContent = 'Audience: about ' + audienceSize(sel.value, t) + ' recipient(s).'; }
        sel.addEventListener('change', refill); box.addEventListener('change', count); count();
      },
      extraValidate: function (v) {
        var e = {};
        var off = (v.channels || []).filter(function (c) { return !channelOn(c); });
        if (off.length) e.channels = off.join(', ') + ' is turned off in Settings → Notifications.';
        if (targetOptions(v.recipients).length && !(v.target || []).length) e.target = 'Choose at least one target for "' + v.recipients + '".';
        if (v.schedule && new Date(v.schedule) < new Date()) e.schedule = 'The scheduled time is in the past.';
        if (!e.target && !audienceSize(v.recipients, (v.target || []).join(','))) e.recipients = 'No recipients match this selection.';
        return e;
      },
      onSave: function (v) {
        var target = (v.target || []).join(','), total = audienceSize(v.recipients, target);
        var later = !!v.schedule;
        var made = v.channels.map(function (ch) {
          return M.notify({ title: v.title, message: v.message, channel: ch, recipients: v.recipients, target: target, attachment: v.attachment && v.attachment[0] ? v.attachment[0].name : '',
            schedule: later ? v.schedule : new Date().toISOString().slice(0, 16), status: later ? 'Scheduled' : 'Sent', total: total, delivered: later ? 0 : total, read: 0 });
        });
        A.toast(later ? 'Scheduled for ' + A.datetime(v.schedule) + '.' : 'Sent to ' + total + ' recipient(s) via ' + v.channels.join(', ') + ' (demo — no real messages are sent).', 'info');
        return made[0];
      } });
  }
  A.views.notifications = M.crud({
    key: 'notifications', coll: 'notifications', title: 'Notifications', single: 'Notification', group: 'Communication', icon: 'bell', prefix: 'NT',
    sub: 'Push, WhatsApp, email and announcements to students, parents and instructors.', noEdit: true, noCreate: true,
    headActions: function () { return A.can('notifications', 'create') ? A.btn('Send notification', 'send', 'data-compose') : ''; },
    afterList: function (main) { var b = $('[data-compose]', main); if (b) b.addEventListener('click', function () { compose(); }); if (location.hash.split('/')[2] === 'new' && b) compose(); },
    search: ['id', 'title', 'message'], dateKey: 'schedule', dateLabel: 'Sent', sort: { k: 'schedule', dir: -1 },
    cols: function () { return [C.id, C.text('title', 'Title'), C.status('channel', 'Channel'), C.text('recipients', 'Recipients'), C.calc('when', 'Date', function (r) { return A.datetime(r.schedule); }),
      C.calc('dl', 'Delivered', function (r) { return r.delivered + ' / ' + r.total; }), { k: 'read', l: 'Read', cls: 'num', fmt: function (r) { var p = r.total ? Math.round(100 * r.read / r.total) : 0; return '<span class="a-meter"><i class="ok" style="width:' + p + '%"></i></span> ' + p + '%'; }, sort: function (r) { return r.total ? r.read / r.total : 0; }, text: function (r) { return r.read; } }, C.text('by', 'By'), C.status()]; },
    filters: function () { return [FL.plain('channel', 'Channel', CHANNELS), FL.plain('recipients', 'Recipients', RECIPIENTS), FL.status(['Sent', 'Scheduled', 'Cancelled'])]; },
    actions: function (r) { return [
      { icon: 'eye', label: 'View', fn: function () { A.modal({ title: r.title, body: A.dl([['Channel', A.badge(r.channel)], ['Recipients', esc(r.recipients) + (r.target ? ' · ' + esc(r.target.split(',').length + ' selected') : '')], ['Date', A.datetime(r.schedule)], ['Status', A.badge(r.status)], ['Delivery', r.delivered + ' of ' + r.total + ' delivered · ' + r.read + ' read'], ['Attachment', esc(r.attachment)], ['Sent by', esc(r.by)]]) + '<div class="a-msg">' + esc(r.message) + '</div>', actions: [{ label: 'Close', cls: 'ghost' }] }); } },
      { icon: 'copy', label: 'Send again', show: A.can('notifications', 'create'), fn: function () { compose({ title: r.title, message: r.message, recipients: r.recipients, channels: [r.channel] }); } },
      { icon: 'x', label: 'Cancel scheduled', danger: true, show: r.status === 'Scheduled' && A.can('notifications', 'edit'), fn: function () { A.put('notifications', { id: r.id, status: 'Cancelled' }, 'notifications'); M.reload(); } }
    ]; }
  });

  /* ======================================================
     REPORTS
     ====================================================== */
  function agg(rows, keyFn, init, add) { var g = {}; rows.forEach(function (r) { var k = keyFn(r); if (k == null || k === '') return; var o = g[k] || (g[k] = Object.assign({ id: k }, init())); add(o, r); }); return Object.keys(g).map(function (k) { return g[k]; }); }
  function paid() { return A.rows('payments').filter(function (p) { return +p.paid > 0; }); }
  var studentCols = [C.id, C.name('Student'), C.text('ic', 'IC'), C.text('phone', 'Phone'), C.ref('centreId', 'Centre', 'centres'), C.text('grade', 'Grade'), C.date('joinDate', 'Joined'), C.status()];
  var attCols = function (l) { return [{ k: 'name', l: l, fmt: function (r) { return '<b>' + esc(r.name) + '</b>'; }, text: function (r) { return r.name; } }, C.num('total', 'Records'), C.num('Present', 'Present'), C.num('Late', 'Late'), C.num('Absent', 'Absent'), C.num('Excused', 'Excused'), C.calc('rate', 'Attendance %', function (r) { return Math.round(100 * (r.Present + r.Late) / r.total) + '%'; }, 'num')]; };
  function attAgg(keyFn, nameFn) { return function () { return agg(A.rows('attendance'), keyFn, function () { return { total: 0, Present: 0, Late: 0, Absent: 0, Excused: 0 }; }, function (o, a) { o.total++; o[a.status]++; o.date = a.date; }).map(function (o) { o.name = nameFn(o.id); return o; }); }; }
  var REPORTS = [
    { id: 'student-list', g: 'Student Reports', t: 'Student list', rows: function () { return A.rows('students'); }, cols: studentCols, dateKey: 'joinDate', filters: function () { return [FL.centre, FL.status(['Active', 'Inactive', 'Suspended'])]; } },
    { id: 'student-active', g: 'Student Reports', t: 'Active students', rows: function () { return A.rows('students').filter(function (s) { return s.status === 'Active'; }); }, cols: studentCols, filters: function () { return [FL.centre]; } },
    { id: 'student-inactive', g: 'Student Reports', t: 'Inactive students', rows: function () { return A.rows('students').filter(function (s) { return s.status !== 'Active'; }); }, cols: studentCols, filters: function () { return [FL.centre]; } },
    { id: 'student-new', g: 'Student Reports', t: 'New registrations', rows: function () { var from = DB.iso(DB.addDays(new Date(), -90)); return A.rows('students').filter(function (s) { return s.joinDate >= from; }); }, cols: studentCols, dateKey: 'joinDate', note: 'Students who joined in the last 90 days. Use the date range to narrow it.' },
    { id: 'student-centre', g: 'Student Reports', t: 'Students by centre', rows: function () { return A.rows('centres').map(function (c) { var s = A.rows('students').filter(function (x) { return x.centreId === c.id; }); return { id: c.id, name: c.name, clubId: c.clubId, total: s.length, active: s.filter(function (x) { return x.status === 'Active'; }).length, capacity: c.capacity }; }); }, cols: [C.name('Centre'), C.ref('clubId', 'Club', 'clubs'), C.num('total', 'Students'), C.num('active', 'Active'), C.num('capacity', 'Capacity')] },
    { id: 'att-daily', g: 'Attendance Reports', t: 'Daily attendance', rows: attAgg(function (a) { return a.date; }, A.date), cols: attCols('Date'), dateKey: 'id', sort: { k: 'id', dir: -1 } },
    { id: 'att-monthly', g: 'Attendance Reports', t: 'Monthly attendance', rows: attAgg(function (a) { return a.date.slice(0, 7); }, A.monthLabel), cols: attCols('Month'), sort: { k: 'id', dir: -1 } },
    { id: 'att-student', g: 'Attendance Reports', t: 'Student attendance', rows: attAgg(function (a) { return a.studentId; }, function (k) { return A.nameOf('students', k); }), cols: attCols('Student') },
    { id: 'att-instructor', g: 'Attendance Reports', t: 'Instructor attendance', rows: attAgg(function (a) { return a.instructorId; }, function (k) { return A.nameOf('instructors', k); }), cols: attCols('Instructor') },
    { id: 'att-centre', g: 'Attendance Reports', t: 'Centre attendance', rows: attAgg(function (a) { return a.centreId; }, function (k) { return A.nameOf('centres', k); }), cols: attCols('Training centre') },
    { id: 'att-class', g: 'Attendance Reports', t: 'Class attendance', rows: attAgg(function (a) { return a.classId; }, function (k) { return A.nameOf('classes', k) + ' · ' + k; }), cols: attCols('Class') },
    { id: 'fin-collection', g: 'Financial Reports', t: 'Collection', rows: paid, cols: [C.text('receiptNo', 'Receipt'), C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.ref('centreId', 'Centre', 'centres'), C.text('type', 'Type'), C.text('method', 'Method'), C.money('paid', 'Amount')], dateKey: 'date', filters: function () { return [FL.centre, FL.plain('method', 'Method', S().paymentMethods), FL.plain('type', 'Type', S().paymentTypes)]; }, total: 'paid' },
    { id: 'fin-cash', g: 'Financial Reports', t: 'Cash collection', rows: function () { return paid().filter(function (p) { return p.method === 'Cash'; }); }, cols: [C.text('receiptNo', 'Receipt'), C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.ref('centreId', 'Centre', 'centres'), C.text('collectedBy', 'Collected by'), C.money('paid', 'Amount')], dateKey: 'date', filters: function () { return [FL.centre]; }, total: 'paid' },
    { id: 'fin-online', g: 'Financial Reports', t: 'Online payment', rows: function () { return paid().filter(function (p) { return M.isOnline(p.method); }); }, cols: [C.text('txnId', 'Transaction'), C.text('gatewayRef', 'Gateway ID'), C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.text('method', 'Method'), C.money('paid', 'Amount')], dateKey: 'date', filters: function () { return [FL.centre, FL.plain('method', 'Method')]; }, total: 'paid' },
    { id: 'fin-outstanding', g: 'Financial Reports', t: 'Outstanding payment', rows: function () { return A.rows('payments').filter(function (p) { return ['Unpaid', 'Overdue', 'Partial'].indexOf(p.status) >= 0; }); }, cols: [C.text('invoiceNo', 'Invoice'), C.ref('studentId', 'Student', 'students'), C.ref('centreId', 'Centre', 'centres'), C.date('dueDate', 'Due'), C.status(), C.calc('bal', 'Balance', function (p) { return M.balance(p).toFixed(2); }, 'num')], dateKey: 'dueDate', filters: function () { return [FL.centre, FL.status(['Unpaid', 'Overdue', 'Partial'])]; } },
    { id: 'fin-revenue', g: 'Financial Reports', t: 'Revenue by month', rows: function () { return agg(paid(), function (p) { return p.date.slice(0, 7); }, function () { return { total: 0, cash: 0, online: 0, n: 0 }; }, function (o, p) { o.total += +p.paid; o.n++; if (p.method === 'Cash') o.cash += +p.paid; else o.online += +p.paid; }); }, cols: [C.calc('m', 'Month', function (r) { return A.monthLabel(r.id); }), C.num('n', 'Payments'), C.money('cash', 'Cash'), C.money('online', 'Online'), C.money('total', 'Total')], sort: { k: 'id', dir: -1 } },
    { id: 'fin-refund', g: 'Financial Reports', t: 'Refunds', rows: function () { return A.rows('refunds').filter(function (r) { return r.kind === 'Refund'; }); }, cols: [C.id, C.ref('studentId', 'Student', 'students'), C.money('amount', 'Amount'), C.text('reason', 'Reason'), C.date('requested', 'Requested'), C.status()], dateKey: 'requested', total: 'amount' },
    { id: 'fin-reimb', g: 'Financial Reports', t: 'Reimbursements', rows: function () { return A.rows('refunds').filter(function (r) { return r.kind === 'Reimbursement'; }); }, cols: [C.id, C.text('requestedBy', 'Payee'), C.money('amount', 'Amount'), C.text('reason', 'Reason'), C.date('requested', 'Requested'), C.status()], dateKey: 'requested', total: 'amount' },
    { id: 'gr-registered', g: 'Grading Reports', t: 'Registered candidates', rows: function () { return A.scope(D().candidates); }, cols: [C.ref('gradingId', 'Grading', 'gradings'), C.ref('studentId', 'Student', 'students'), C.text('fromGrade', 'Grade'), C.calc('p', 'Fee', function (c) { return c.paid ? 'Paid' : 'Unpaid'; }), C.status('result', 'Result')], filters: function () { return [{ k: 'gradingId', l: 'Grading', opts: function () { return A.rows('gradings').map(function (g) { return [g.id, g.name]; }); } }]; } },
    { id: 'gr-results', g: 'Grading Reports', t: 'Completed results', rows: function () { return A.scope(D().candidates).filter(function (c) { return c.result !== 'Pending'; }); }, cols: [C.ref('gradingId', 'Grading', 'gradings'), C.ref('studentId', 'Student', 'students'), C.text('fromGrade', 'From'), C.text('gradeAwarded', 'Awarded'), C.text('score', 'Score'), C.status('result', 'Result'), C.text('remarks', 'Remarks')], filters: function () { return [FL.plain('result', 'Result', ['Pass', 'Fail', 'Absent'])]; } },
    { id: 'gr-passfail', g: 'Grading Reports', t: 'Pass / fail summary', rows: function () { return A.rows('gradings').map(function (g) { var c = D().candidates.filter(function (x) { return x.gradingId === g.id; }); var done = c.filter(function (x) { return x.result === 'Pass' || x.result === 'Fail'; }); return { id: g.id, name: g.name, date: g.date, n: c.length, pass: c.filter(function (x) { return x.result === 'Pass'; }).length, fail: c.filter(function (x) { return x.result === 'Fail'; }).length, absent: c.filter(function (x) { return x.result === 'Absent'; }).length, rate: done.length ? Math.round(100 * c.filter(function (x) { return x.result === 'Pass'; }).length / done.length) + '%' : '—' }; }); }, cols: [C.name('Grading'), C.date('date', 'Date'), C.num('n', 'Candidates'), C.num('pass', 'Pass'), C.num('fail', 'Fail'), C.num('absent', 'Absent'), C.text('rate', 'Pass rate')], dateKey: 'date' },
    { id: 'gr-centre', g: 'Grading Reports', t: 'By exam centre', rows: function () { return agg(A.rows('gradings'), function (g) { return g.centreId; }, function () { return { n: 0, cands: 0 }; }, function (o, g) { o.n++; o.cands += D().candidates.filter(function (c) { return c.gradingId === g.id; }).length; }).map(function (o) { o.name = A.nameOf('centres', o.id); return o; }); }, cols: [C.name('Exam centre'), C.num('n', 'Gradings'), C.num('cands', 'Candidates')] },
    { id: 'tr-participants', g: 'Tournament Reports', t: 'Participants', rows: function () { return A.scope(D().participants); }, cols: [C.ref('tournamentId', 'Tournament', 'tournaments'), C.ref('studentId', 'Player', 'students'), C.ref('clubId', 'Club', 'clubs'), C.text('category', 'Category'), C.text('ageCategory', 'Age'), C.text('weight', 'Weight'), C.status()], filters: function () { return [{ k: 'tournamentId', l: 'Tournament', opts: function () { return A.rows('tournaments').map(function (t) { return [t.id, t.name]; }); } }, FL.plain('category', 'Category')]; } },
    { id: 'tr-results', g: 'Tournament Reports', t: 'Results', rows: function () { return A.scope(D().participants).filter(function (p) { return p.status === 'Completed'; }); }, cols: [C.ref('tournamentId', 'Tournament', 'tournaments'), C.ref('studentId', 'Player', 'students'), C.text('category', 'Category'), C.num('wins', 'Wins'), C.num('losses', 'Losses'), C.status('medal', 'Medal'), C.num('points', 'Points')], filters: function () { return [{ k: 'tournamentId', l: 'Tournament', opts: function () { return A.rows('tournaments').map(function (t) { return [t.id, t.name]; }); } }]; } },
    { id: 'tr-rankings', g: 'Tournament Reports', t: 'Rankings', rows: function () { return M.rankings(); }, cols: [C.num('rank', 'Rank'), C.ref('studentId', 'Player', 'students'), C.ref('clubId', 'Club', 'clubs'), C.text('category', 'Category'), C.text('year', 'Year'), C.num('Gold', 'Gold'), C.num('Silver', 'Silver'), C.num('Bronze', 'Bronze'), C.num('points', 'Points')], sort: { k: 'rank', dir: 1 } },
    { id: 'tr-medals', g: 'Tournament Reports', t: 'Medal winners', rows: function () { return A.scope(D().participants).filter(function (p) { return ['Gold', 'Silver', 'Bronze'].indexOf(p.medal) >= 0; }); }, cols: [C.ref('tournamentId', 'Tournament', 'tournaments'), C.ref('studentId', 'Player', 'students'), C.ref('clubId', 'Club', 'clubs'), C.text('category', 'Category'), C.status('medal', 'Medal')], filters: function () { return [FL.plain('medal', 'Medal', ['Gold', 'Silver', 'Bronze'])]; } }
  ];
  A.views.reports = { title: 'Reports', group: 'Reports', icon: 'chart', render: function (main, p) {
    var rep = REPORTS.filter(function (r) { return r.id === p[0]; })[0];
    if (!rep) {
      var groups = {}; REPORTS.forEach(function (r) { (groups[r.g] = groups[r.g] || []).push(r); });
      main.innerHTML = A.pageHead('Reports', 'Every report supports search, filters, date range, pagination, Excel / PDF export and print.') +
        '<div class="a-report-grid">' + Object.keys(groups).map(function (g) { return '<section class="a-panel"><div class="a-panel-h"><h3>' + esc(g) + '</h3></div><div class="a-panel-b"><ul class="a-list">' + groups[g].map(function (r) { return '<li><a href="#/reports/' + r.id + '">' + A.icon('sheet', 'w-5') + '<span><b>' + esc(r.t) + '</b></span>' + A.icon('right') + '</a></li>'; }).join('') + '</ul></div></section>'; }).join('') + '</div>';
      return;
    }
    main.innerHTML = '<a class="a-back" href="#/reports">' + A.icon('arrowleft') + ' All reports</a>' + A.pageHead(rep.t, rep.g + (rep.note ? ' · ' + rep.note : '')) + '<div data-total></div><div class="a-card" data-t></div>';
    var t = M.table($('[data-t]', main), { rows: rep.rows, cols: rep.cols, dateKey: rep.dateKey, defaultSort: rep.sort, filters: FL.club().filter(function () { return rep.rows().length && 'clubId' in (rep.rows()[0] || {}); }).concat(rep.filters ? rep.filters() : []),
      search: function (r) { return Object.keys(r).map(function (k) { return typeof r[k] === 'object' ? '' : r[k]; }).join(' ') + ' ' + (r.studentId ? A.nameOf('students', r.studentId) : ''); },
      exportName: rep.t + ' report', canExport: A.can('reports', 'export'), pageSize: 25 });
    if (rep.total) $('[data-total]', main).innerHTML = '<p class="muted">Total of all rows (before filters): <b>' + A.money(A.sum(rep.rows(), rep.total)) + '</b></p>';
    A.audit('View', 'reports', rep.id, [], 'Opened report ' + rep.t); DB.save();
    return t;
  } };

  /* ======================================================
     USERS
     ====================================================== */
  var ROLE_KEYS = ['superadmin', 'clubadmin', 'centreadmin', 'instructor', 'finance'];
  function pwCheck(v) { return v.length < 8 || !/[A-Z]/.test(v) || !/[a-z]/.test(v) || !/[0-9]/.test(v) ? 'Use at least 8 characters with upper-case, lower-case and a number.' : ''; }
  M.pwCheck = pwCheck;
  A.views.users = M.crud({
    key: 'users', coll: 'users', title: 'Users', single: 'User', group: 'Administration', icon: 'users', prefix: 'USR',
    sub: 'People who can log in to this admin portal.',
    rows: function () { var u = A.user(); return M.isSuper() ? D().users : D().users.filter(function (x) { return x.clubId === u.clubId && x.role !== 'superadmin'; }); },
    search: ['id', 'name', 'email', 'phone'],
    cols: function () { return [C.id, C.name('Name', true), C.text('email', 'Email'), C.text('phone', 'Phone'), C.calc('role', 'Role', function (r) { return (D().roles[r.role] || {}).name || r.role; }), C.ref('clubId', 'Club', 'clubs'), C.ref('centreId', 'Training centre', 'centres'), C.calc('ll', 'Last login', function (r) { return r.lastLogin ? A.datetime(r.lastLogin) : 'Never'; }), C.status()]; },
    filters: function () { return [{ k: 'role', l: 'Role', opts: ROLE_KEYS.map(function (k) { return [k, D().roles[k].name]; }) }, FL.status(['Active', 'Inactive', 'Locked'])].concat(FL.club()); },
    fields: function () {
      return [
        { k: 'name', l: 'Full name', req: true }, { k: 'email', l: 'Email (login)', type: 'email', req: true, unique: true }, { k: 'phone', l: 'Phone', type: 'tel' },
        { k: 'role', l: 'Role', type: 'select', req: true, opts: ROLE_KEYS.filter(function (k) { return M.isSuper() || k !== 'superadmin'; }).map(function (k) { return [k, D().roles[k].name]; }) },
        { k: 'clubId', l: 'Club', type: 'select', ref: 'clubs', hide: M.notSuper, help: 'Not needed for Super Admin.' },
        { k: 'centreId', l: 'Training centre', type: 'select', ref: 'centres', help: 'Required for Centre Admin and Instructor.' },
        { k: 'password', l: 'Temporary password', type: 'password', hide: function (r) { return !!r.id; }, help: 'At least 8 characters with upper-case, lower-case and a number. Share it securely.' },
        { k: 'twoFactor', l: 'Two-factor authentication', type: 'checkbox', text: 'Require a verification code at login' },
        M.F.status(['Active', 'Inactive', 'Locked'])
      ];
    },
    validate: function (v) {
      var e = {};
      if ('password' in v) { if (!v.password) e.password = 'Temporary password is required.'; else if (pwCheck(v.password)) e.password = pwCheck(v.password); }
      var scope = (D().roles[v.role] || {}).scope;
      if (M.isSuper() && scope && scope !== 'all' && !v.clubId && !v.centreId) e.clubId = 'Choose the club this user belongs to.';
      if (scope === 'centre' && !v.centreId) e.centreId = 'Choose the training centre for this role.';
      return e;
    },
    beforeSave: function (o, old, isNew) {
      if (o.centreId) { var c = A.byId('centres', o.centreId); if (c) o.clubId = c.clubId; }
      if (o.role === 'superadmin') { o.clubId = ''; o.centreId = ''; }
      if ((D().roles[o.role] || {}).scope === 'club') o.centreId = '';
      if (isNew) { o.salt = DB.newSalt(); o.pwHash = DB.hashPassword(o.password, o.salt); o.lastLogin = ''; o.createdAt = A.today(); o.mustChange = true; }
      delete o.password;
      if (old && old.id === A.user().id && (o.status !== 'Active' || o.role !== old.role)) { A.toast('You cannot change your own role or deactivate yourself.', 'error'); return false; }
      if (old && old.role === 'superadmin' && o.role !== 'superadmin' && D().users.filter(function (u) { return u.role === 'superadmin' && u.status === 'Active'; }).length < 2) { A.toast('There must always be at least one active Super Admin.', 'error'); return false; }
    },
    canDelete: function (r) { return r.id === A.user().id ? 'You cannot delete your own account.' : r.role === 'superadmin' && D().users.filter(function (u) { return u.role === 'superadmin'; }).length < 2 ? 'There must always be at least one Super Admin.' : null; },
    actions: function (r) { return [
      { icon: 'key', label: 'Reset password', show: A.can('users', 'edit'), fn: function () {
        A.openForm({ title: 'Reset password · ' + r.name, size: 'sm', rec: {}, fields: [{ k: 'password', l: 'New temporary password', type: 'password', req: true, check: pwCheck }, { k: 'confirm', l: 'Confirm password', type: 'password', req: true }],
          extraValidate: function (v) { return v.password !== v.confirm ? { confirm: 'Passwords do not match.' } : {}; },
          onSave: function (v) { var salt = DB.newSalt(); A.put('users', { id: r.id, salt: salt, pwHash: DB.hashPassword(v.password, salt), mustChange: true, status: r.status === 'Locked' ? 'Active' : r.status }, 'users', 'Reset password for ' + r.name); return true; } });
      } },
      { icon: r.status === 'Active' ? 'lock' : 'check', label: r.status === 'Active' ? 'Deactivate' : 'Activate / unlock', show: A.can('users', 'edit') && r.id !== A.user().id, fn: function () { A.put('users', { id: r.id, status: r.status === 'Active' ? 'Inactive' : 'Active' }, 'users'); M.reload(); } }
    ]; }
  });

  /* ======================================================
     ROLES & PERMISSIONS
     ====================================================== */
  var ACTIONS = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
  A.views.roles = { title: 'Roles & Permissions', group: 'Administration', icon: 'shieldcheck', render: function (main) {
    var canE = A.can('roles', 'edit');
    main.innerHTML = A.pageHead('Roles & Permissions', 'Decide which pages and actions each role can use. Super Admin always has full access.') +
      '<p class="a-warn">' + A.icon('info') + ' In this demo, permissions are checked in the browser. When a backend is added, the server must check the same permissions on every request.</p><div data-tabs></div>';
    A.tabs($('[data-tabs]', main), ROLE_KEYS.map(function (rk) { var role = D().roles[rk]; return { label: role.name, render: function (b) { matrix(b, rk, canE && rk !== 'superadmin'); } }; }));
  } };
  function matrix(b, rk, editable) {
    var role = D().roles[rk];
    var mods = window.ADMIN_MODULE_KEYS;
    var label = function (m) { return (A.views[m] && A.views[m].title) || m; };
    b.innerHTML = '<p class="muted">' + esc(role.desc) + ' Data scope: <b>' + esc({ all: 'All clubs', club: 'Own club only', centre: 'Assigned centre only' }[role.scope]) + '</b>.</p>' +
      '<div class="a-tbl-scroll"><table class="a-tbl a-matrix"><thead><tr><th>Module</th>' + ACTIONS.map(function (a) { return '<th>' + a[0].toUpperCase() + a.slice(1) + (editable ? '<br><input type="checkbox" data-col="' + a + '" aria-label="Toggle ' + a + ' for all modules" />' : '') + '</th>'; }).join('') + '</tr></thead><tbody>' +
      mods.map(function (m) { return '<tr><th scope="row">' + esc(label(m)) + '</th>' + ACTIONS.map(function (a) { var on = role.perms[m] && role.perms[m].indexOf(a) >= 0; return '<td><input type="checkbox" data-m="' + m + '" data-a="' + a + '"' + (on ? ' checked' : '') + (editable ? '' : ' disabled') + ' aria-label="' + esc(label(m) + ' ' + a) + '" /></td>'; }).join('') + '</tr>'; }).join('') +
      '</tbody></table></div>' + (editable ? '<div class="a-att-foot"><span class="muted">"View" is needed for a page to appear in the menu.</span><button type="button" class="a-btn primary" data-save>' + A.icon('check') + 'Save permissions</button></div>' : '');
    if (!editable) return;
    $$('[data-col]', b).forEach(function (c) { c.addEventListener('change', function () { $$('[data-a="' + c.getAttribute('data-col') + '"]', b).forEach(function (x) { x.checked = c.checked; }); }); });
    $('[data-save]', b).addEventListener('click', function () {
      var before = JSON.stringify(role.perms), perms = {};
      mods.forEach(function (m) { perms[m] = $$('[data-m="' + m + '"]:checked', b).map(function (x) { return x.getAttribute('data-a'); }); if (perms[m].length && perms[m].indexOf('view') < 0) perms[m].unshift('view'); });
      role.perms = perms;
      var ch = []; mods.forEach(function (m) { var o = JSON.parse(before)[m] || []; if (o.join() !== perms[m].join()) ch.push({ field: m, from: o.join(', '), to: perms[m].join(', ') }); });
      A.audit('Update', 'roles', rk, ch, 'Changed permissions for ' + role.name); DB.save();
      A.toast(ch.length ? 'Permissions saved for ' + role.name + '.' : 'No changes.'); matrix(b, rk, editable);
    });
  }

  /* ======================================================
     APPROVAL CENTRE
     ====================================================== */
  function approvalItems() {
    var d = D(), out = [];
    A.scope(d.registrations).forEach(function (r) { out.push({ id: 'REG:' + r.id, type: r.type + ' registration', ref: r.id, summary: r.name + ' · ' + A.nameOf('centres', r.centreId), requested: r.submitted, by: r.source, status: r.status === 'Pending' ? 'Pending' : r.status, perm: 'registrations', rec: r, kind: 'reg' }); });
    A.scope(d.refunds).forEach(function (r) { var st = r.status === 'Pending Approval' || r.status === 'Requested' ? 'Pending' : r.status === 'Rejected' ? 'Rejected' : 'Approved'; out.push({ id: 'RF:' + r.id, type: r.kind, ref: r.id, summary: A.money(r.amount) + ' · ' + (r.studentId ? A.nameOf('students', r.studentId) : r.requestedBy) + ' · ' + r.reason, requested: r.requested, by: r.requestedBy, status: st, perm: 'refunds', rec: r, kind: 'refund' }); });
    A.scope(d.purchases).forEach(function (r) { out.push({ id: 'PR:' + r.id, type: 'Purchase request', ref: r.id, summary: r.qty + ' × ' + A.nameOf('products', r.productId) + ' · ' + A.money(r.qty * r.unitCost), requested: r.requested, by: r.requestedBy, status: r.status, perm: 'purchases', rec: r, kind: 'purchase' }); });
    A.scope(d.transfers).forEach(function (r) { out.push({ id: 'TF:' + r.id, type: 'Student transfer', ref: r.id, summary: A.nameOf('students', r.studentId) + ': ' + A.nameOf('centres', r.fromCentreId) + ' → ' + A.nameOf('centres', r.toCentreId) + ' · ' + r.reason, requested: r.requested, by: r.requestedBy || '', status: r.status, perm: 'approvals', rec: r, kind: 'transfer' }); });
    return out;
  }
  function decide(it, ok) {
    var r = it.rec;
    var finish = function (note) {
      if (it.kind === 'reg') { if (ok) M.approveRegistration(r); else M.rejectRegistration(r, note); }
      if (it.kind === 'refund') M.decideRefund(r, ok, note);
      if (it.kind === 'purchase') M.decidePurchase(r, ok, note);
      if (it.kind === 'transfer') { A.put('transfers', { id: r.id, status: ok ? 'Approved' : 'Rejected', decidedBy: A.user().name, note: note || '' }, 'approvals', (ok ? 'Approved' : 'Rejected') + ' transfer ' + r.id); if (ok) M.applyTransfer(r); }
      A.toast(it.type + ' ' + (ok ? 'approved.' : 'rejected.'), ok ? 'ok' : 'info'); M.reload();
    };
    if (ok) A.confirm('Approve this ' + it.type.toLowerCase() + '?\n' + it.summary, { ok: 'Approve' }).then(function (y) { if (y) finish(); });
    else A.prompt('Reject ' + it.type.toLowerCase(), 'Reason', { required: true, danger: true, ok: 'Reject' }).then(function (n) { if (n) finish(n); });
  }
  A.views.approvals = { title: 'Approval Centre', navTitle: 'Approvals', group: 'Administration', icon: 'checksquare', badge: function () { return M.pendingCount(); }, render: function (main) {
    var items = approvalItems();
    var n = function (s) { return items.filter(function (i) { return i.status === s; }).length; };
    main.innerHTML = A.pageHead('Approval Centre', 'Registrations, refunds, reimbursements, purchase requests and student transfers in one place.') + '<div data-tabs></div>';
    var mk = function (status) { return function (b) {
      M.table(b, { rows: function () { return approvalItems().filter(function (i) { return i.status === status; }); }, dateKey: 'requested', defaultSort: { k: 'requested', dir: -1 },
        search: ['ref', 'summary', 'by', 'type'], filters: [FL.plain('type', 'Type')],
        cols: [C.text('type', 'Type'), C.text('ref', 'Reference'), { k: 'summary', l: 'Details', cls: 'wrap' }, C.date('requested', 'Requested'), C.text('by', 'Requested by / source'), C.status(), C.actions],
        bulk: status === 'Pending' ? [{ label: 'Approve selected', icon: 'check', fn: function (rows) { var ok = rows.filter(function (i) { return A.can(i.perm, 'approve') || A.can('approvals', 'approve'); }); return A.confirm('Approve ' + ok.length + ' item(s)?', { ok: 'Approve' }).then(function (y) { if (!y) return false; ok.forEach(function (it) { if (it.kind === 'reg') M.approveRegistration(it.rec); if (it.kind === 'refund') M.decideRefund(it.rec, true); if (it.kind === 'purchase') M.decidePurchase(it.rec, true); if (it.kind === 'transfer') { A.put('transfers', { id: it.rec.id, status: 'Approved', decidedBy: A.user().name }, 'approvals'); M.applyTransfer(it.rec); } }); A.toast(ok.length + ' approved.'); A.updateBadges(); }); } }] : [],
        actions: function (it) { var can = A.can(it.perm, 'approve') || A.can('approvals', 'approve'); return [
          { icon: 'check', label: 'Approve', show: status === 'Pending' && can, fn: function () { decide(it, true); } },
          { icon: 'x', label: 'Reject', danger: true, show: status === 'Pending' && can, fn: function () { decide(it, false); } },
          { icon: 'arrowright', label: 'Open', fn: function () { A.go('#/' + { reg: 'registrations', refund: 'refunds', purchase: 'purchases', transfer: 'students/' + it.rec.studentId }[it.kind]); } }
        ]; },
        exportName: 'Approvals ' + status, empty: status === 'Pending' ? 'Nothing waiting for approval.' : 'No ' + status.toLowerCase() + ' items.' });
    }; };
    A.tabs($('[data-tabs]', main), [{ label: 'Pending', count: n('Pending'), render: mk('Pending') }, { label: 'Approved', count: n('Approved'), render: mk('Approved') }, { label: 'Rejected', count: n('Rejected'), render: mk('Rejected') }]);
  } };

  /* ======================================================
     AUDIT LOG + LOGIN HISTORY
     ====================================================== */
  A.views.audit = { title: 'Audit Log', group: 'Administration', icon: 'history', render: function (main) {
    main.innerHTML = A.pageHead('Audit Log', 'Who changed what, when. Financial and student changes are recorded with before/after values.') + '<div data-tabs></div>';
    var u = A.user();
    var scoped = function () { if (M.isSuper()) return D().audit; var ids = D().users.filter(function (x) { return x.clubId === u.clubId; }).map(function (x) { return x.id; }); return D().audit.filter(function (a) { return ids.indexOf(a.userId) >= 0; }); };
    A.tabs($('[data-tabs]', main), [
      { label: 'Audit trail', icon: 'history', render: function (b) {
        M.table(b, { rows: scoped, dateKey: 'at', defaultSort: { k: 'at', dir: -1 }, pageSize: 25,
          search: function (r) { return [r.user, r.action, r.module, r.recordId, r.summary].concat(r.changes.map(function (c) { return c.field + ' ' + c.from + ' ' + c.to; })).join(' '); }, searchPlaceholder: 'Search user, record, field, value…',
          filters: [FL.plain('action', 'Action'), FL.plain('module', 'Module'), FL.plain('user', 'User')],
          cols: [C.calc('at', 'Date & time', function (r) { return A.datetime(r.at); }), C.text('user', 'User'), C.status('action', 'Action'), C.text('module', 'Module'), C.text('recordId', 'Record'),
            { k: 'changes', l: 'Change', cls: 'wrap', fmt: function (r) { return esc(r.summary || '') + (r.changes.length ? '<div class="a-changes">' + r.changes.slice(0, 3).map(function (c) { return '<code>' + esc(c.field) + '</code> ' + esc(c.from || '—') + ' → ' + esc(c.to || '—'); }).join('<br>') + (r.changes.length > 3 ? '<br>+' + (r.changes.length - 3) + ' more' : '') + '</div>' : ''); }, text: function (r) { return (r.summary || '') + ' ' + r.changes.map(function (c) { return c.field + ': ' + c.from + ' -> ' + c.to; }).join('; '); } },
            C.text('ip', 'IP address')],
          exportName: 'Audit log', canExport: A.can('audit', 'export'), empty: 'No activity recorded yet.' });
      } },
      { label: 'Login history', icon: 'key', render: function (b) {
        var emails = M.isSuper() ? null : D().users.filter(function (x) { return x.clubId === u.clubId; }).map(function (x) { return x.email.toLowerCase(); });
        var rows = function () { return D().logins.filter(function (l) { return !emails || emails.indexOf(String(l.email).toLowerCase()) >= 0; }).map(function (l, i) { return Object.assign({ id: 'L' + i, result: l.ok ? 'Success' : 'Failed' }, l); }); };
        var day = DB.iso(DB.addDays(new Date(), -1));
        var fails = rows().filter(function (l) { return !l.ok && l.at.slice(0, 10) >= day; });
        b.innerHTML = '<div class="a-stats three">' + A.statCard('Failed logins (24h)', A.num(fails.length), 'alert', fails.length ? 'Most: ' + esc(Object.entries(fails.reduce(function (o, f) { o[f.email] = (o[f.email] || 0) + 1; return o; }, {})).sort(function (a, b2) { return b2[1] - a[1]; })[0][0]) : 'none') +
          A.statCard('Locked accounts', A.num(D().users.filter(function (x) { return x.status === 'Locked' && (!emails || emails.indexOf(x.email.toLowerCase()) >= 0); }).length), 'lock', 'after ' + S().maxFailedLogins + ' failed attempts') +
          A.statCard('Successful logins (24h)', A.num(rows().filter(function (l) { return l.ok && l.at.slice(0, 10) >= day; }).length), 'checkcircle') + '</div><div data-t></div>';
        M.table($('[data-t]', b), { rows: rows, dateKey: 'at', defaultSort: { k: 'at', dir: -1 }, search: ['email', 'reason'], filters: [FL.plain('result', 'Result', ['Success', 'Failed'])],
          cols: [C.calc('at', 'Date & time', function (r) { return A.datetime(r.at); }), C.text('email', 'Email'), C.status('result', 'Result'), C.text('reason', 'Detail'), C.text('agent', 'Browser')], exportName: 'Login history', canExport: A.can('audit', 'export'), empty: 'No logins recorded yet.' });
      } }
    ]);
  } };

  /* ======================================================
     SETTINGS
     ====================================================== */
  function settingsForm(b, fields, toRec, fromVals, title) {
    var editable = A.can('settings', 'edit');
    b.innerHTML = '<form class="a-card pad" novalidate>' + A.formHTML(fields, toRec()) + (editable ? '<div class="a-att-foot"><span></span><button class="a-btn primary" type="submit">' + A.icon('check') + 'Save ' + esc(title.toLowerCase()) + '</button></div>' : '<p class="muted">You can view but not change settings.</p>') + '</form>';
    var form = $('form', b);
    if (!editable) { $$('input,select,textarea', form).forEach(function (x) { x.disabled = true; }); return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = A.readForm(form, fields); var errs = A.validate(fields, v);
      if (!A.showErrors(form, errs)) return;
      var s = S(), before = JSON.parse(JSON.stringify(s));
      fromVals(v, s);
      var ch = Object.keys(s).filter(function (k) { return JSON.stringify(before[k]) !== JSON.stringify(s[k]); }).map(function (k) { return { field: k, from: JSON.stringify(before[k]).slice(0, 100), to: JSON.stringify(s[k]).slice(0, 100) }; });
      A.audit('Update', 'settings', title, ch, 'Updated ' + title + ' settings'); DB.save();
      A.toast(title + ' settings saved.');
      $('#sysName').textContent = s.systemName;
    });
  }
  var lines = function (a) { return (a || []).join('\n'); };
  var unlines = function (t) { return String(t || '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); };
  A.views.settings = { title: 'Settings', group: 'Administration', icon: 'settings', render: function (main) {
    main.innerHTML = A.pageHead('System Settings', 'General, club configuration, finance, notifications, integrations, security and data.') + '<div data-tabs></div>';
    A.tabs($('[data-tabs]', main), [
      { label: 'General', icon: 'settings', render: function (b) { settingsForm(b, [
        { k: 'systemName', l: 'System name', req: true }, { k: 'currency', l: 'Currency symbol', req: true }, { k: 'dateFormat', l: 'Date format', type: 'select', opts: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], req: true },
        { k: 'timeZone', l: 'Time zone', type: 'select', opts: ['Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Jakarta', 'Asia/Bangkok', 'UTC'], req: true }, { k: 'language', l: 'Language', type: 'select', opts: ['English', 'Bahasa Melayu', '中文'], help: 'Translations are not included in the demo.' }
      ], function () { return S(); }, function (v, s) { Object.assign(s, v); }, 'General'); } },
      { label: 'Club configuration', icon: 'sliders', render: function (b) { settingsForm(b, [
        { k: 'grades', l: 'Grades (lowest first, one per line)', type: 'textarea', rows: 6, req: true }, { k: 'membershipTypes', l: 'Membership types', type: 'textarea', rows: 4, req: true },
        { k: 'paymentTypes', l: 'Payment types', type: 'textarea', rows: 5, req: true }, { k: 'attendanceTypes', l: 'Attendance statuses', type: 'textarea', rows: 4, req: true, help: 'The four core statuses are used for reports.' },
        { k: 'studentStatuses', l: 'Student statuses', type: 'textarea', rows: 3, req: true }, { k: 'classTypes', l: 'Class types', type: 'textarea', rows: 4, req: true }
      ], function () { var s = S(); return { grades: lines(s.grades), membershipTypes: lines(s.membershipTypes), paymentTypes: lines(s.paymentTypes), attendanceTypes: lines(s.attendanceTypes), studentStatuses: lines(s.studentStatuses), classTypes: lines(s.classTypes) }; },
        function (v, s) { Object.keys(v).forEach(function (k) { s[k] = unlines(v[k]); }); if (s.studentStatuses.indexOf('Active') < 0) s.studentStatuses.unshift('Active'); }, 'Club configuration'); } },
      { label: 'Financial', icon: 'wallet', render: function (b) { settingsForm(b, [
        { k: 'gateway', l: 'Payment gateway', type: 'select', opts: ['FPX (not connected)', 'Billplz', 'iPay88', 'Stripe', 'toyyibPay'] }, { k: 'gatewayMode', l: 'Gateway mode', type: 'select', opts: ['Sandbox', 'Live'] },
        { k: 'taxRate', l: 'Tax rate (%)', type: 'number', min: 0, max: 100, step: '0.01' }, { k: 'paymentMethods', l: 'Payment methods (one per line)', type: 'textarea', rows: 5, req: true },
        { k: 'invoiceFormat', l: 'Invoice number format', req: true, help: '{YYYY} = year, {#####} = running number.', check: function (v) { return /\{#+\}/.test(v) ? '' : 'Include a running number such as {#####}.'; } },
        { k: 'receiptFormat', l: 'Receipt number format', req: true, check: function (v) { return /\{#+\}/.test(v) ? '' : 'Include a running number such as {#####}.'; } }
      ], function () { var s = S(); return Object.assign({}, s, { paymentMethods: lines(s.paymentMethods) }); }, function (v, s) { v.paymentMethods = unlines(v.paymentMethods); if (v.paymentMethods.indexOf('Cash') < 0) v.paymentMethods.unshift('Cash'); Object.assign(s, v); }, 'Financial');
        b.insertAdjacentHTML('beforeend', '<p class="a-warn">' + A.icon('lock') + ' Gateway API keys and secrets are never stored here. They belong in the server configuration (environment variables), because this repository is public.</p>'); } },
      { label: 'Notifications', icon: 'bell', render: function (b) { settingsForm(b, [
        { k: 'notifyEmail', l: 'Email', type: 'checkbox', text: 'Allow email notifications' }, { k: 'notifyWhatsApp', l: 'WhatsApp', type: 'checkbox', text: 'Allow WhatsApp messages' }, { k: 'notifyPush', l: 'Push notification', type: 'checkbox', text: 'Allow mobile push notifications' }
      ], function () { return S(); }, function (v, s) { Object.assign(s, v); }, 'Notification'); } },
      { label: 'Integrations', icon: 'plug', render: function (b) {
        var s = S(), canE = A.can('settings', 'edit');
        b.innerHTML = '<div class="a-card pad"><ul class="a-int">' + s.integrations.map(function (it, i) { return '<li>' + A.icon('plug', 'w-5') + '<span><b>' + esc(it.name) + '</b><small>' + (it.on ? 'Enabled — needs server credentials to work' : 'Not connected') + '</small></span><label class="a-switch"><input type="checkbox" data-int="' + i + '"' + (it.on ? ' checked' : '') + (canE ? '' : ' disabled') + ' aria-label="' + esc(it.name) + '" /><span></span></label></li>'; }).join('') + '</ul><p class="a-help">Third-party connections (payment gateways, tournament scoring, WhatsApp, email) run on the backend. These switches only record which ones the club wants.</p></div>';
        $$('[data-int]', b).forEach(function (c) { c.addEventListener('change', function () { var it = s.integrations[+c.getAttribute('data-int')]; it.on = c.checked; A.audit('Update', 'settings', 'integrations', [{ field: it.name, from: String(!c.checked), to: String(c.checked) }], (c.checked ? 'Enabled ' : 'Disabled ') + it.name); DB.save(); A.toast(it.name + (c.checked ? ' enabled.' : ' disabled.')); A.refresh(); }); });
      } },
      { label: 'Security', icon: 'shield', render: function (b) { settingsForm(b, [
        { k: 'sessionMinutes', l: 'Session timeout (minutes of inactivity)', type: 'number', min: 5, max: 480, req: true }, { k: 'maxFailedLogins', l: 'Lock account after failed logins', type: 'number', min: 3, max: 20, req: true },
        { k: 'lockMinutes', l: 'Lock duration (minutes)', type: 'number', min: 1, max: 1440, req: true }, { k: 'require2fa', l: 'Two-factor authentication', type: 'checkbox', text: 'Require 2FA for every user' }
      ], function () { return S(); }, function (v, s) { Object.assign(s, v); }, 'Security'); } },
      { label: 'Data & backup', icon: 'database', render: function (b) {
        var canE = A.can('settings', 'edit') && M.isSuper();
        var size = 0; try { size = (localStorage.getItem('dclix_admin_db_v1') || '').length; } catch (e) {}
        b.innerHTML = '<div class="a-card pad"><p>Demo data is stored in this browser (' + Math.round(size / 1024) + ' KB). It is not shared with other people or devices.</p><div class="a-btn-row">' +
          A.btn('Download backup (JSON)', 'download', 'data-backup', 'ghost') + (canE ? A.btn('Restore from backup', 'upload', 'data-restore', 'ghost') + A.btn('Reset demo data', 'refresh', 'data-reset', 'danger') : '') +
          '</div><input type="file" accept=".json,application/json" hidden data-file /><p class="a-help">A real deployment should back up the database on the server every day and test restores regularly.</p></div>';
        $('[data-backup]', b).addEventListener('click', function () { A.download(new Blob([DB.exportJSON()], { type: 'application/json' }), 'dclix-admin-backup-' + A.today() + '.json'); A.audit('Export', 'settings', 'backup', [], 'Downloaded full backup'); DB.save(); });
        if (!canE) return;
        var file = $('[data-file]', b);
        $('[data-restore]', b).addEventListener('click', function () { file.click(); });
        file.addEventListener('change', function () {
          var f = file.files[0]; if (!f) return;
          if (f.size > 5 * 1024 * 1024) { A.toast('Backup file is too large.', 'error'); return; }
          A.confirm('Replace ALL current data with "' + f.name + '"? This cannot be undone.', { danger: true, ok: 'Restore' }).then(function (ok) {
            if (!ok) return; var r = new FileReader();
            r.onload = function () { try { DB.importJSON(r.result); A.toast('Backup restored.'); setTimeout(function () { location.reload(); }, 600); } catch (e) { A.toast(e.message || 'That file could not be read.', 'error'); } };
            r.readAsText(f);
          });
        });
        $('[data-reset]', b).addEventListener('click', function () { A.confirm('Reset to fresh demo data? All changes made in this browser will be lost and you will be logged out.', { danger: true, ok: 'Reset' }).then(function (ok) { if (ok) { DB.reset(); A.endSession('reset'); } }); });
      } }
    ]);
  } };

  /* ======================================================
     MY PROFILE
     ====================================================== */
  A.views.profile = { title: 'My Profile', perm: 'profile', hidden: true, icon: 'user', render: function (main) {
    var u = A.user(), role = A.role();
    main.innerHTML = A.pageHead('My Profile', role.name) + '<div class="a-profile">' + A.avatar(u.name, u.photo, 'xl') + '<div><h2>' + esc(u.name) + '</h2><p class="muted">' + esc(u.email) + ' · ' + esc(role.name) + (u.clubId ? ' · ' + esc(A.nameOf('clubs', u.clubId)) : '') + '</p></div></div>' + (u.mustChange ? '<p class="a-warn">' + A.icon('key') + ' You are using a temporary password. Please change it below.</p>' : '') + '<div data-tabs></div>';
    A.tabs($('[data-tabs]', main), [
      { label: 'Profile', icon: 'user', render: function (b) {
        var fields = [{ k: 'name', l: 'Full name', req: true }, { k: 'phone', l: 'Phone', type: 'tel' }, { k: 'photo', l: 'Profile picture', type: 'file', image: true, accept: 'image/*' }];
        b.innerHTML = '<form class="a-card pad" novalidate>' + A.formHTML(fields, u) + A.dl([['Email (login)', esc(u.email)], ['Role', esc(role.name)], ['Last login', u.lastLogin ? A.datetime(u.lastLogin) : '—']]) + '<div class="a-att-foot"><span></span><button class="a-btn primary" type="submit">' + A.icon('check') + 'Save profile</button></div></form>';
        var form = $('form', b);
        form.addEventListener('submit', function (e) {
          e.preventDefault(); var v = A.readForm(form, fields);
          if (!A.showErrors(form, A.validate(fields, v))) return;
          A.readFiles(form, fields).then(function (f) { if (f.__error) { var x = {}; x[f.__error.k] = f.__error.msg; A.showErrors(form, x); return; } if (f.photo) v.photo = f.photo; A.put('users', Object.assign({ id: u.id }, v), 'users', 'Updated own profile'); A.toast('Profile saved.'); location.reload(); });
        });
      } },
      { label: 'Change password', icon: 'key', render: function (b) {
        var fields = [{ k: 'current', l: 'Current password', type: 'password', req: true }, { k: 'password', l: 'New password', type: 'password', req: true, check: pwCheck }, { k: 'confirm', l: 'Confirm new password', type: 'password', req: true }];
        b.innerHTML = '<form class="a-card pad narrow" novalidate>' + A.formHTML(fields, {}) + '<div class="a-att-foot"><span></span><button class="a-btn primary" type="submit">' + A.icon('key') + 'Change password</button></div></form>';
        var form = $('form', b);
        form.addEventListener('submit', function (e) {
          e.preventDefault(); var v = A.readForm(form, fields); var errs = A.validate(fields, v);
          if (!errs.current && DB.hashPassword(v.current, u.salt) !== u.pwHash) errs.current = 'Current password is incorrect.';
          if (!errs.confirm && v.password !== v.confirm) errs.confirm = 'Passwords do not match.';
          if (!errs.password && v.password === v.current) errs.password = 'Choose a password you have not used here.';
          if (!A.showErrors(form, errs)) return;
          var salt = DB.newSalt(); A.put('users', { id: u.id, salt: salt, pwHash: DB.hashPassword(v.password, salt), mustChange: false }, 'users', 'Changed own password');
          form.reset(); A.toast('Password changed.');
        });
      } },
      { label: 'Security', icon: 'shield', render: function (b) {
        b.innerHTML = '<div class="a-card pad"><label class="a-switch"><input type="checkbox" id="my2fa"' + (u.twoFactor ? ' checked' : '') + (S().require2fa ? ' disabled' : '') + ' /><span></span> Two-factor authentication ' + (S().require2fa ? '(required by your organisation)' : '') + '</label><p class="a-help">When on, you enter a 6-digit code after your password. In this demo the code is shown on screen; a real system sends it by SMS/email or uses an authenticator app.</p></div>';
        $('#my2fa', b).addEventListener('change', function (e) { A.put('users', { id: u.id, twoFactor: e.target.checked }, 'users', (e.target.checked ? 'Enabled' : 'Disabled') + ' 2FA'); A.toast('Two-factor authentication ' + (e.target.checked ? 'enabled.' : 'disabled.')); });
      } },
      { label: 'Login history', icon: 'history', render: function (b) {
        M.table(b, { rows: function () { return D().logins.filter(function (l) { return String(l.email).toLowerCase() === u.email.toLowerCase(); }).map(function (l, i) { return Object.assign({ id: 'L' + i, result: l.ok ? 'Success' : 'Failed' }, l); }); },
          defaultSort: { k: 'at', dir: -1 }, cols: [C.calc('at', 'Date & time', function (r) { return A.datetime(r.at); }), C.status('result', 'Result'), C.text('reason', 'Detail'), C.text('agent', 'Browser')], exportName: 'My login history', empty: 'No logins recorded yet.' });
      } }
    ]);
  } };

  /* ---------- Menu order ---------- */
  A.nav = ['dashboard', 'clubs', 'centres', 'students', 'instructors', 'classes', 'registrations',
    'attendance', 'gradings', 'activities', 'tournaments', 'rankings',
    'payments', 'collections', 'invoices', 'refunds', 'payroll', 'outstanding',
    'products', 'stock', 'purchases', 'deliveries', 'notifications', 'reports',
    'users', 'roles', 'approvals', 'audit', 'settings'];
  A.views.products.group = A.views.stock.group = A.views.purchases.group = A.views.deliveries.group = 'Inventory';

  A.boot();
})();
