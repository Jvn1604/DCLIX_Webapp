/* ==========================================================
   D-Clix Admin — Operations
   attendance · grading · activities · tournaments · rankings
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, M = A.M, C = M.C, FL = M.FL, F = M.F, esc = A.esc, $ = A.$, $$ = A.$$;
  function D() { return DB.data; }
  var STATUSES = ['Present', 'Absent', 'Late', 'Excused'];
  var METHODS = ['QR Code', 'Manual', 'Fingerprint', 'Mobile Check-In'];

  /* ======================================================
     ATTENDANCE
     ====================================================== */
  A.views.attendance = { title: 'Attendance', group: 'Operations', icon: 'calendarcheck', render: function (main, p) {
    var canTake = A.can('attendance', 'create');
    main.innerHTML = A.pageHead('Attendance', 'QR scan, fingerprint, mobile check-in or manual marking.') + '<div data-tabs></div>';
    var tabs = [];
    if (canTake) tabs.push({ label: 'Take attendance', icon: 'checksquare', render: function (b) { takeAttendance(b, p[0] === 'take' ? p[1] : ''); } });
    tabs.push({ label: 'Records', icon: 'sheet', render: records });
    tabs.push({ label: 'Summary', icon: 'chart', render: summary });
    A.tabs($('[data-tabs]', main), tabs, 0);
  } };

  function takeAttendance(b, classId) {
    var classes = A.rows('classes').filter(function (c) { return c.status === 'Active'; });
    if (!classes.length) { b.innerHTML = '<div class="a-empty">' + A.icon('calendardays', 'w-8') + '<b>No active classes.</b><span class="muted">Create a class first, then take attendance here.</span></div>'; return; }
    b.innerHTML = '<div class="a-card pad"><div class="a-form-grid">' +
      '<div class="a-field"><label class="a-lbl" for="atClass">Class <span class="req">*</span></label><select class="a-input" id="atClass">' + classes.map(function (c) { return '<option value="' + c.id + '"' + (c.id === classId ? ' selected' : '') + '>' + esc(c.name + ' · ' + A.nameOf('centres', c.centreId) + ' · ' + c.days.join('/') + ' ' + c.start) + '</option>'; }).join('') + '</select></div>' +
      '<div class="a-field"><label class="a-lbl" for="atDate">Date <span class="req">*</span></label><input class="a-input" type="date" id="atDate" value="' + A.today() + '" max="' + A.today() + '" /></div>' +
      '<div class="a-field"><label class="a-lbl" for="atMethod">Method</label><select class="a-input" id="atMethod">' + METHODS.map(function (m) { return '<option>' + m + '</option>'; }).join('') + '</select></div>' +
      '<div class="a-field"><label class="a-lbl" for="atScan">Scan QR / enter student ID</label><div class="a-copy"><input class="a-input" id="atScan" placeholder="DCLIX:ST0001 or ST0001" autocomplete="off" /><button type="button" class="a-btn ghost" id="atScanBtn">' + A.icon('qr') + 'Check in</button></div><p class="a-help">A scanner that types the code and presses Enter works here.</p></div>' +
      '</div></div><div id="atList"></div>';
    var sel = $('#atClass', b), date = $('#atDate', b), method = $('#atMethod', b);
    var state = {};
    function load() {
      var c = A.byId('classes', sel.value); if (!c) return;
      var existing = D().attendance.filter(function (a) { return a.classId === c.id && a.date === date.value; });
      state = {};
      existing.forEach(function (a) { state[a.studentId] = a.status; });
      var studs = D().students.filter(function (s) { return c.studentIds.indexOf(s.id) >= 0; });
      var dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date.value).getDay()];
      var warn = c.recurring === 'Weekly' && c.days.indexOf(dn) < 0 ? '<p class="a-warn">' + A.icon('alert') + ' ' + esc(c.name) + ' does not normally run on ' + dn + '. You can still record attendance (e.g. a replacement class).</p>' : '';
      $('#atList', b).innerHTML = warn + (studs.length ? '<div class="a-card"><div class="a-att-head"><b>' + esc(c.name) + '</b> · ' + A.date(date.value) + ' · ' + studs.length + ' students' + (existing.length ? ' · <span class="a-badge warn">Already recorded — saving will update it</span>' : '') +
        '<span class="sp"></span><button type="button" class="a-btn ghost sm" data-all="Present">All present</button><button type="button" class="a-btn ghost sm" data-all="Absent">All absent</button></div>' +
        '<div class="a-att-list">' + studs.map(function (s) {
          var cur = state[s.id] || 'Present';
          state[s.id] = cur;
          return '<div class="a-att-row" data-sid="' + s.id + '"><span class="a-person">' + A.avatar(s.name, s.photo) + '<span><b>' + esc(s.name) + '</b><small>' + esc(s.id) + ' · ' + esc(s.grade) + '</small></span></span><div class="a-seg" role="radiogroup" aria-label="Attendance for ' + esc(s.name) + '">' +
            STATUSES.map(function (st) { return '<button type="button" role="radio" aria-checked="' + (cur === st) + '" class="' + (cur === st ? 'on ' + A.cssStatus(st) : '') + '" data-st="' + st + '">' + st + '</button>'; }).join('') + '</div></div>';
        }).join('') + '</div><div class="a-att-foot"><span data-tally></span><button type="button" class="a-btn primary" data-save>' + A.icon('check') + 'Save attendance</button></div></div>'
        : '<div class="a-empty">' + A.icon('users', 'w-8') + '<b>No students in this class yet.</b>' + (A.can('classes', 'edit') ? '<a class="a-btn ghost sm" href="#/classes/' + c.id + '">Add students to the class</a>' : '') + '</div>');
      tally();
    }
    function tally() { var t = $('[data-tally]', b); if (!t) return; var n = {}; Object.keys(state).forEach(function (k) { n[state[k]] = (n[state[k]] || 0) + 1; }); t.innerHTML = STATUSES.map(function (s) { return A.badge(s) + ' ' + (n[s] || 0); }).join(' &nbsp; '); }
    function setRow(sid, st) {
      state[sid] = st;
      var row = $('[data-sid="' + sid + '"]', b); if (!row) return false;
      $$('[data-st]', row).forEach(function (x) { var on = x.getAttribute('data-st') === st; x.className = on ? 'on ' + A.cssStatus(st) : ''; x.setAttribute('aria-checked', String(on)); });
      tally(); return true;
    }
    b.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.hasAttribute('data-st')) setRow(t.closest('[data-sid]').getAttribute('data-sid'), t.getAttribute('data-st'));
      if (t.hasAttribute('data-all')) Object.keys(state).forEach(function (k) { setRow(k, t.getAttribute('data-all')); });
      if (t.hasAttribute('data-save')) save();
      if (t.id === 'atScanBtn') scan();
    });
    $('#atScan', b).addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); scan(); } });
    function scan() {
      var inp = $('#atScan', b); var id = inp.value.trim().toUpperCase().replace(/^DCLIX:/, '');
      if (!id) return;
      var s = A.byId('students', id);
      if (!s) A.toast('No student found with ID ' + id + '.', 'error');
      else if (!(id in state)) A.toast(s.name + ' is not enrolled in this class.', 'error');
      else { setRow(id, 'Present'); method.value = 'QR Code'; A.toast(s.name + ' checked in.'); }
      inp.value = ''; inp.focus();
    }
    function save() {
      var c = A.byId('classes', sel.value);
      if (!date.value || date.value > A.today()) { A.toast('Pick a valid date (today or earlier).', 'error'); return; }
      var d = D(), now = new Date(); var time = DB.pad(now.getHours(), 2) + ':' + DB.pad(now.getMinutes(), 2);
      var changed = 0;
      Object.keys(state).forEach(function (sid) {
        var ex = d.attendance.filter(function (a) { return a.classId === c.id && a.date === date.value && a.studentId === sid; })[0];
        var st = state[sid];
        if (ex) { if (ex.status !== st) { ex.status = st; ex.method = st === 'Absent' ? '' : method.value; changed++; } }
        else { d.attendance.push({ id: DB.nextId('attendance', 'AT', 6), date: date.value, classId: c.id, studentId: sid, clubId: c.clubId, centreId: c.centreId, instructorId: c.instructorId, status: st, method: st === 'Absent' ? '' : method.value, time: st === 'Absent' ? '' : time }); changed++; }
      });
      A.audit('Update', 'attendance', c.id, [], 'Recorded attendance for ' + c.name + ' on ' + A.date(date.value) + ' (' + Object.keys(state).length + ' students)');
      DB.save(); A.toast('Attendance saved (' + changed + ' change' + (changed === 1 ? '' : 's') + ').'); load();
    }
    sel.addEventListener('change', load); date.addEventListener('change', load);
    load();
  }

  function records(b) {
    M.table(b, {
      rows: function () { return A.rows('attendance'); }, dateKey: 'date', defaultSort: { k: 'date', dir: -1 },
      search: function (r) { var s = A.byId('students', r.studentId); return r.studentId + ' ' + (s ? s.name : ''); }, searchPlaceholder: 'Search student name or ID…',
      filters: FL.club().concat([FL.centre, FL.instructor, { k: 'classId', l: 'Class', opts: function () { return A.rows('classes').map(function (c) { return [c.id, c.name + ' · ' + A.nameOf('centres', c.centreId)]; }); } }, FL.status(STATUSES), FL.plain('method', 'Method', METHODS)]),
      cols: [C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.ref('classId', 'Class', 'classes'), C.ref('centreId', 'Training centre', 'centres'), C.ref('instructorId', 'Instructor', 'instructors'), C.status(), C.text('method', 'Method'), C.text('time', 'Time'), C.actions],
      actions: function (r) { return [{ icon: 'edit', label: 'Change status', show: A.can('attendance', 'edit'), fn: function () {
        A.openForm({ title: 'Update attendance', size: 'sm', rec: r, fields: [{ k: 'status', l: 'Status', type: 'select', opts: STATUSES, req: true }, { k: 'method', l: 'Method', type: 'select', opts: METHODS }],
          onSave: function (v) { if (v.status === 'Absent') v.method = ''; A.put('attendance', Object.assign({ id: r.id }, v), 'attendance', 'Attendance ' + A.nameOf('students', r.studentId) + ' ' + A.date(r.date)); return true; } });
      } }]; },
      exportName: 'Attendance records', canExport: A.can('attendance', 'export')
    });
  }

  function summary(b) {
    b.innerHTML = '<div class="a-filterbar inline"><label class="a-date"><span>Group by</span><select class="a-input" id="sumBy"><option value="studentId">Student</option><option value="classId">Class</option><option value="centreId">Training centre</option><option value="instructorId">Instructor</option><option value="date">Day</option><option value="month">Month</option></select></label>' +
      '<label class="a-date"><span>From</span><input class="a-input" type="date" id="sumFrom" value="' + DB.iso(DB.addDays(new Date(), -28)) + '" /></label><label class="a-date"><span>To</span><input class="a-input" type="date" id="sumTo" value="' + A.today() + '" /></label></div><div id="sumOut"></div>';
    function run() {
      var by = $('#sumBy', b).value, from = $('#sumFrom', b).value, to = $('#sumTo', b).value;
      var recs = A.rows('attendance').filter(function (a) { return (!from || a.date >= from) && (!to || a.date <= to); });
      var groups = {};
      recs.forEach(function (a) { var k = by === 'month' ? a.date.slice(0, 7) : a[by]; var g = groups[k] || (groups[k] = { id: k, total: 0, Present: 0, Absent: 0, Late: 0, Excused: 0 }); g.total++; g[a.status]++; });
      var coll = { studentId: 'students', classId: 'classes', centreId: 'centres', instructorId: 'instructors' }[by];
      var rows = Object.keys(groups).map(function (k) { var g = groups[k]; g.name = coll ? A.nameOf(coll, k) : by === 'month' ? A.monthLabel(k) : A.date(k); g.rate = Math.round(100 * (g.Present + g.Late) / g.total); return g; });
      M.table($('#sumOut', b), { rows: function () { return rows; }, search: ['id', 'name'], defaultSort: { k: by === 'date' || by === 'month' ? 'id' : 'rate', dir: by === 'date' || by === 'month' ? -1 : 1 },
        cols: [{ k: 'name', l: $('#sumBy', b).selectedOptions[0].text, fmt: function (r) { return '<b>' + esc(r.name) + '</b>'; }, text: function (r) { return r.name; } }, C.num('total', 'Records'), C.num('Present', 'Present'), C.num('Late', 'Late'), C.num('Absent', 'Absent'), C.num('Excused', 'Excused'),
          { k: 'rate', l: 'Attendance %', cls: 'num', fmt: function (r) { return '<span class="a-meter"><i style="width:' + r.rate + '%" class="' + (r.rate >= 80 ? 'ok' : r.rate >= 60 ? 'warn' : 'bad') + '"></i></span> ' + r.rate + '%'; }, sort: function (r) { return r.rate; }, text: function (r) { return r.rate + '%'; } }],
        exportName: 'Attendance summary', canExport: A.can('attendance', 'export'), empty: 'No attendance in this date range.' });
    }
    ['#sumBy', '#sumFrom', '#sumTo'].forEach(function (s) { $(s, b).addEventListener('change', run); });
    run();
  }

  /* ======================================================
     GRADING
     ====================================================== */
  function gradingStats(g) {
    var c = D().candidates.filter(function (x) { return x.gradingId === g.id; });
    return { all: c, registered: c.length, paid: c.filter(function (x) { return x.paid; }).length, completed: c.filter(function (x) { return x.result === 'Pass' || x.result === 'Fail'; }).length, absent: c.filter(function (x) { return x.result === 'Absent'; }).length, pass: c.filter(function (x) { return x.result === 'Pass'; }).length };
  }
  function certificate(title, name, line, sub) {
    return '<div class="cert"><p class="muted">' + esc(A.settings().systemName) + '</p><h1>' + esc(title) + '</h1><p>This certifies that</p><div class="big">' + esc(name) + '</div><p>' + esc(line) + '</p><p class="muted">' + esc(sub) + '</p><br><br><table style="border:0;width:70%;margin:0 auto"><tr><td style="border:0;border-top:1px solid #333;text-align:center">Examiner / Organiser</td><td style="border:0;width:20%"></td><td style="border:0;border-top:1px solid #333;text-align:center">Club Admin</td></tr></table></div>';
  }
  A.views.gradings = M.crud({
    key: 'gradings', coll: 'gradings', title: 'Grading', single: 'Grading', group: 'Operations', icon: 'gradcap', prefix: 'GR',
    sub: 'Belt / grade examinations, candidates, fees and results.',
    search: ['id', 'name', 'examiner'], dateKey: 'date', sort: { k: 'date', dir: -1 },
    cols: function () { return [C.id, C.name('Grading'), C.ref('clubId', 'Club', 'clubs'), C.date('date', 'Date'), C.calc('grades', 'Grade', function (r) { return r.currentGrade + ' → ' + r.nextGrade; }), C.ref('centreId', 'Exam centre', 'centres'), C.money('fee', 'Fee'),
      C.calc('cands', 'Registered / paid', function (r) { var s = gradingStats(r); return s.registered + ' / ' + s.paid; }), C.date('deadline', 'Deadline'), C.status()]; },
    filters: function () { return FL.club().concat([FL.status(['Draft', 'Open', 'Completed', 'Cancelled']), { k: 'centreId', l: 'Exam centre', opts: FL.centre.opts }]); },
    fields: function () { var g = A.settings().grades; return [
      { k: 'name', l: 'Grading name', req: true }, { k: 'sport', l: 'Martial art', type: 'select', opts: DB.SPORTS, req: true },
      { k: 'currentGrade', l: 'Current grade', type: 'select', opts: g, req: true }, { k: 'nextGrade', l: 'Next grade', type: 'select', opts: g, req: true, check: function (v, all) { return g.indexOf(v) <= g.indexOf(all.currentGrade) ? 'Next grade must be higher than the current grade.' : ''; } },
      { k: 'centreId', l: 'Exam centre', type: 'select', ref: 'centres', req: true }, { k: 'examiner', l: 'Examiner', req: true },
      { k: 'date', l: 'Date', type: 'date', req: true }, { k: 'time', l: 'Time', type: 'time', req: true, def: '09:00' },
      { k: 'fee', l: 'Grading fee', type: 'number', min: 0, req: true, def: 80 }, { k: 'deadline', l: 'Registration deadline', type: 'date', req: true, check: function (v, all) { return all.date && v > all.date ? 'Deadline must be on or before the grading date.' : ''; } },
      F.status(['Draft', 'Open', 'Completed', 'Cancelled'], 'Open')
    ]; },
    canDelete: function (r) { return D().candidates.some(function (c) { return c.gradingId === r.id; }) ? 'This grading has candidates. Cancel it instead of deleting.' : null; },
    detail: gradingDetail
  });
  function gradingDetail(main, g, view) {
    var s = gradingStats(g);
    var eligible = A.rows('students').filter(function (x) { return x.status === 'Active' && x.clubId === g.clubId && x.grade === g.currentGrade; });
    var canE = A.can('gradings', 'edit');
    main.innerHTML = M.detailHead('gradings', 'All gradings', g.name, A.date(g.date) + ' ' + g.time + ' · ' + A.nameOf('centres', g.centreId) + ' · Examiner ' + g.examiner,
      (canE ? A.btn('Edit', 'edit', 'data-edit', 'ghost') + A.btn('Add candidates', 'userplus', 'data-add') : '')) +
      '<div class="a-stats">' + A.statCard('Eligible students', A.num(eligible.length), 'users', 'at ' + esc(g.currentGrade)) + A.statCard('Registered', A.num(s.registered), 'userplus') + A.statCard('Paid', A.num(s.paid), 'wallet', A.money(s.paid * g.fee)) +
      A.statCard('Completed', A.num(s.completed), 'checkcircle', s.completed ? Math.round(100 * s.pass / s.completed) + '% pass' : '') + A.statCard('Absent', A.num(s.absent), 'eyeoff') + '</div>' +
      '<div class="a-card" data-c></div>';
    var on = function (sel, f) { var b = $(sel, main); if (b) b.addEventListener('click', f); };
    on('[data-edit]', function () { view.openEdit(g, A.refresh); });
    on('[data-add]', function () {
      var already = s.all.map(function (c) { return c.studentId; });
      var pool = eligible.filter(function (x) { return already.indexOf(x.id) < 0; });
      if (!pool.length) { A.toast('No more eligible students. Candidates must be active ' + g.currentGrade + ' students of this club.', 'info'); return; }
      if (g.deadline < A.today()) A.toast('Note: the registration deadline (' + A.date(g.deadline) + ') has passed.', 'info');
      A.openForm({ title: 'Add candidates', fields: [{ k: 'ids', l: 'Eligible students (active, currently ' + g.currentGrade + ')', type: 'multi', opts: pool.map(function (x) { return [x.id, x.name + ' · ' + A.nameOf('centres', x.centreId)]; }) }],
        rec: {}, extraValidate: function (v) { return v.ids.length ? {} : { ids: 'Select at least one student.' }; },
        onSave: function (v) { v.ids.forEach(function (id) { var st = A.byId('students', id); A.put('candidates', { id: DB.nextId('candidates', 'GC', 5), gradingId: g.id, studentId: id, clubId: st.clubId, centreId: st.centreId, fromGrade: st.grade, paid: false, result: 'Pending', score: '', gradeAwarded: '', remarks: '' }, 'gradings', 'Registered ' + st.name + ' for ' + g.name); }); return true; }, after: A.refresh });
    });
    M.table($('[data-c]', main), {
      rows: function () { return D().candidates.filter(function (c) { return c.gradingId === g.id; }); },
      search: function (c) { return c.studentId + ' ' + A.nameOf('students', c.studentId); },
      filters: [{ k: 'result', l: 'Result', opts: ['Pending', 'Pass', 'Fail', 'Absent'] }, { k: 'paid', l: 'Fee', opts: [['true', 'Paid'], ['false', 'Unpaid']], val: function (c) { return String(!!c.paid); } }],
      cols: [C.ref('studentId', 'Candidate', 'students'), C.text('fromGrade', 'Current grade'), { k: 'paid', l: 'Fee', fmt: function (c) { return A.badge(c.paid ? 'Paid' : 'Unpaid'); }, text: function (c) { return c.paid ? 'Paid' : 'Unpaid'; } }, C.status('result', 'Result'), C.text('score', 'Score'), C.text('gradeAwarded', 'Grade awarded'), C.text('remarks', 'Examiner remarks'), C.actions],
      exportName: g.name + ' candidates', canExport: A.can('gradings', 'export'), empty: 'No candidates yet. Use "Add candidates".',
      bulk: canE ? [{ label: 'Mark fee paid', icon: 'wallet', fn: function (rows) { rows.forEach(markPaid); A.toast('Updated.'); } }] : [],
      actions: function (c) { return [
        { icon: 'wallet', label: 'Mark fee paid', show: canE && !c.paid, fn: function () { markPaid(c); M.reload(); A.toast('Fee recorded and receipt issued.'); } },
        { icon: 'edit', label: 'Record result', show: canE, fn: function () { recordResult(c); } },
        { icon: 'award', label: 'Print certificate', show: c.result === 'Pass', fn: function () { A.printHTML('Certificate', certificate('Certificate of Grading', A.nameOf('students', c.studentId), 'has been awarded the grade of ' + c.gradeAwarded + ' in ' + g.sport, g.name + ' · ' + A.date(g.date) + ' · Score ' + c.score)); } },
        { icon: 'trash', label: 'Remove candidate', danger: true, show: canE && c.result === 'Pending', fn: function () { A.confirm('Remove ' + A.nameOf('students', c.studentId) + ' from this grading?', { danger: true, ok: 'Remove' }).then(function (ok) { if (ok) { A.remove('candidates', c.id, 'gradings'); M.reload(); } }); } }
      ]; }
    });
    function markPaid(c) {
      if (c.paid) return;
      var st = A.byId('students', c.studentId);
      var p = { id: DB.nextId('payments', 'PAY', 5), studentId: c.studentId, clubId: st.clubId, centreId: st.centreId, type: 'Grading Fee', desc: g.name, amount: g.fee, paid: g.fee, discount: 0, tax: 0, method: 'Cash', date: A.today(), dueDate: A.today(), status: 'Paid', collectedBy: A.user().name };
      p.invoiceNo = M.fmtNo(A.settings().invoiceFormat, p.id); p.receiptNo = M.fmtNo(A.settings().receiptFormat, p.id);
      A.put('payments', p, 'payments', 'Grading fee for ' + st.name);
      A.put('candidates', { id: c.id, paid: true, paymentId: p.id }, 'gradings');
    }
    function recordResult(c) {
      A.openForm({ title: 'Result · ' + A.nameOf('students', c.studentId), size: 'sm', rec: c, fields: [
        { k: 'result', l: 'Result', type: 'select', opts: ['Pending', 'Pass', 'Fail', 'Absent'], req: true },
        { k: 'score', l: 'Score (0–100)', type: 'number', min: 0, max: 100 }, { k: 'remarks', l: 'Examiner remarks', type: 'textarea' }],
        extraValidate: function (v) { return (v.result === 'Pass' || v.result === 'Fail') && v.score === '' ? { score: 'Enter a score for a pass or fail result.' } : {}; },
        onSave: function (v) {
          v.gradeAwarded = v.result === 'Pass' ? g.nextGrade : '';
          A.put('candidates', Object.assign({ id: c.id }, v), 'gradings', 'Result for ' + A.nameOf('students', c.studentId) + ': ' + v.result);
          var st = A.byId('students', c.studentId);
          if (v.result === 'Pass' && st && st.grade !== g.nextGrade) A.put('students', { id: st.id, grade: g.nextGrade }, 'students', 'Promoted ' + st.name + ' to ' + g.nextGrade + ' (' + g.name + ')');
          if (c.result === 'Pass' && v.result !== 'Pass' && st && st.grade === g.nextGrade) A.put('students', { id: st.id, grade: c.fromGrade }, 'students', 'Reverted grade for ' + st.name);
          return true;
        } });
    }
  }

  /* ======================================================
     ACTIVITIES
     ====================================================== */
  A.views.activities = M.crud({
    key: 'activities', coll: 'activities', title: 'Activities', single: 'Activity', group: 'Operations', icon: 'sparkles', prefix: 'ACT',
    sub: 'Seminars, training camps, workshops, demonstrations and club events.',
    search: ['id', 'name', 'location', 'organizer'], dateKey: 'date', sort: { k: 'date', dir: -1 },
    cols: function () { return [C.id, C.name('Activity'), C.text('type', 'Type'), C.date('date', 'Date'), C.text('time', 'Time'), C.text('location', 'Location'), C.text('organizer', 'Organizer'),
      C.calc('reg', 'Registered', function (r) { return r.registered + ' / ' + r.capacity; }), C.money('fee', 'Fee'), C.status()]; },
    filters: function () { return FL.club().concat([FL.plain('type', 'Type', ['Seminar', 'Training Camp', 'Workshop', 'Demonstration', 'Club Event']), FL.status(['Open', 'Full', 'Completed', 'Cancelled'])]); },
    fields: function () { return [
      { k: 'name', l: 'Activity name', req: true }, { k: 'type', l: 'Type', type: 'select', opts: ['Seminar', 'Training Camp', 'Workshop', 'Demonstration', 'Club Event'], req: true },
      { k: 'description', l: 'Description', type: 'textarea' }, { k: 'date', l: 'Date', type: 'date', req: true }, { k: 'time', l: 'Time', type: 'time', req: true },
      { k: 'location', l: 'Location', req: true }, { k: 'organizer', l: 'Organizer', req: true }, F.club(),
      { k: 'capacity', l: 'Capacity', type: 'number', min: 1, req: true, def: 30 }, { k: 'registered', l: 'Participants registered', type: 'number', min: 0, def: 0, check: function (v, all) { return +v > +all.capacity ? 'Participants cannot exceed capacity.' : ''; } },
      { k: 'fee', l: 'Fee', type: 'number', min: 0, def: 0 }, F.status(['Open', 'Full', 'Completed', 'Cancelled'])
    ]; },
    beforeSave: function (o) { if (+o.registered >= +o.capacity && o.status === 'Open') o.status = 'Full'; if (!o.centreId) o.centreId = ''; }
  });

  /* ======================================================
     TOURNAMENTS
     ====================================================== */
  var MEDAL_POINTS = { Gold: 100, Silver: 60, Bronze: 35, None: 10 };
  A.views.tournaments = M.crud({
    key: 'tournaments', coll: 'tournaments', title: 'Tournaments', single: 'Tournament', group: 'Operations', icon: 'trophy', prefix: 'TR',
    sub: 'Competitions, player selection, categories, results and medals.',
    search: ['id', 'name', 'location', 'organizer'], dateKey: 'date', sort: { k: 'date', dir: -1 },
    cols: function () { return [C.id, C.name('Tournament'), C.date('date', 'Date'), C.text('location', 'Location'), C.text('organizer', 'Organizer'), C.date('deadline', 'Reg. deadline'),
      C.num('n', 'Participants', function (r) { return A.scope(D().participants).filter(function (p) { return p.tournamentId === r.id; }).length; }),
      C.calc('m', 'Medals', function (r) { var ps = A.scope(D().participants).filter(function (p) { return p.tournamentId === r.id; }); return ['Gold', 'Silver', 'Bronze'].map(function (m) { return ps.filter(function (p) { return p.medal === m; }).length; }).join(' / '); }), C.status()]; },
    filters: function () { return [FL.status(['Upcoming', 'Registration Open', 'Registration Closed', 'Completed', 'Cancelled']), FL.plain('sport', 'Sport', DB.SPORTS)]; },
    fields: function () { return [
      { k: 'name', l: 'Tournament name', req: true }, { k: 'sport', l: 'Sport', type: 'select', opts: DB.SPORTS, req: true },
      { k: 'location', l: 'Location', req: true }, { k: 'organizer', l: 'Organizer', req: true },
      { k: 'date', l: 'Date', type: 'date', req: true }, { k: 'deadline', l: 'Registration deadline', type: 'date', req: true, check: function (v, all) { return all.date && v > all.date ? 'Deadline must be before the tournament date.' : ''; } },
      { k: 'categories', l: 'Competition categories', ph: 'Kyorugi, Poomsae', help: 'Comma separated.' }, { k: 'ageCategory', l: 'Age categories', ph: 'Cadet, Junior, Senior' },
      { k: 'weightCategory', l: 'Weight categories', ph: '-45kg, -55kg' }, { k: 'genderCategory', l: 'Gender categories', def: 'Male, Female' },
      F.status(['Upcoming', 'Registration Open', 'Registration Closed', 'Completed', 'Cancelled'], 'Registration Open')
    ]; },
    beforeSave: function (o) { if (M.isSuper()) o.clubId = ''; },
    canDelete: function (r) { return D().participants.some(function (p) { return p.tournamentId === r.id; }) ? 'This tournament has participants. Cancel it instead of deleting.' : null; },
    detail: tournamentDetail
  });
  function split(s) { return String(s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); }
  function tournamentDetail(main, t, view) {
    var ps = A.scope(D().participants).filter(function (p) { return p.tournamentId === t.id; });
    var canE = A.can('tournaments', 'edit');
    main.innerHTML = M.detailHead('tournaments', 'All tournaments', t.name, A.date(t.date) + ' · ' + t.location + ' · ' + t.organizer,
      (canE ? A.btn('Edit', 'edit', 'data-edit', 'ghost') + A.btn('Select players', 'userplus', 'data-add') : '')) +
      '<div class="a-stats">' + A.statCard('Participants', A.num(ps.length), 'users') + ['Gold', 'Silver', 'Bronze'].map(function (m, i) { return A.statCard(m, A.num(ps.filter(function (p) { return p.medal === m; }).length), 'medal'); }).join('') +
      A.statCard('Status', A.badge(t.status), 'info', 'Deadline ' + A.date(t.deadline)) + '</div>' +
      '<div class="a-panel">' + A.dl([['Categories', esc(t.categories)], ['Age', esc(t.ageCategory)], ['Weight', esc(t.weightCategory)], ['Gender', esc(t.genderCategory)]]) + '</div><div class="a-card" data-p></div>';
    var on = function (s, f) { var b = $(s, main); if (b) b.addEventListener('click', f); };
    on('[data-edit]', function () { view.openEdit(t, A.refresh); });
    on('[data-add]', function () {
      var already = ps.map(function (p) { return p.studentId; });
      var pool = A.rows('students').filter(function (s) { return s.status === 'Active' && already.indexOf(s.id) < 0; });
      A.openForm({ title: 'Select players', fields: [
        { k: 'ids', l: 'Players', type: 'multi', opts: pool.map(function (s) { return [s.id, s.name + ' · ' + A.nameOf('clubs', s.clubId) + ' · ' + s.grade]; }) },
        { k: 'category', l: 'Category', type: 'select', opts: split(t.categories), req: true }, { k: 'ageCategory', l: 'Age category', type: 'select', opts: split(t.ageCategory), req: true },
        { k: 'weight', l: 'Weight category', type: 'select', opts: split(t.weightCategory) }],
        rec: {}, extraValidate: function (v) { return v.ids.length ? {} : { ids: 'Select at least one player.' }; },
        onSave: function (v) { v.ids.forEach(function (id) { var s = A.byId('students', id); A.put('participants', { id: DB.nextId('participants', 'TP', 5), tournamentId: t.id, studentId: id, clubId: s.clubId, centreId: s.centreId, category: v.category, ageCategory: v.ageCategory, weight: v.weight, gender: s.gender, wins: 0, losses: 0, medal: '', points: 0, status: 'Registered' }, 'tournaments', 'Selected ' + s.name + ' for ' + t.name); }); return true; }, after: A.refresh });
    });
    M.table($('[data-p]', main), {
      rows: function () { return A.scope(D().participants).filter(function (p) { return p.tournamentId === t.id; }); },
      search: function (p) { return p.studentId + ' ' + A.nameOf('students', p.studentId); },
      filters: [FL.plain('category', 'Category'), FL.plain('ageCategory', 'Age'), FL.plain('gender', 'Gender', ['Male', 'Female']), FL.plain('medal', 'Medal', ['Gold', 'Silver', 'Bronze', 'None'])].concat(FL.club()),
      cols: [C.ref('studentId', 'Player', 'students'), C.ref('clubId', 'Club', 'clubs'), C.text('category', 'Category'), C.text('ageCategory', 'Age'), C.text('weight', 'Weight'), C.text('gender', 'Gender'), C.num('wins', 'W'), C.num('losses', 'L'), C.status('medal', 'Medal'), C.num('points', 'Points'), C.status(), C.actions],
      exportName: t.name + ' participants', canExport: A.can('tournaments', 'export'), empty: 'No players selected yet.',
      actions: function (p) { return [
        { icon: 'edit', label: 'Record result', show: canE, fn: function () {
          A.openForm({ title: 'Result · ' + A.nameOf('students', p.studentId), size: 'sm', rec: p, fields: [{ k: 'wins', l: 'Wins', type: 'number', min: 0, req: true }, { k: 'losses', l: 'Losses', type: 'number', min: 0, req: true }, { k: 'medal', l: 'Medal', type: 'select', opts: ['Gold', 'Silver', 'Bronze', 'None'], req: true }],
            onSave: function (v) { v.points = MEDAL_POINTS[v.medal] + v.wins * 5; v.status = 'Completed'; A.put('participants', Object.assign({ id: p.id }, v), 'tournaments', 'Result for ' + A.nameOf('students', p.studentId) + ' at ' + t.name); return true; } });
        } },
        { icon: 'award', label: 'Print certificate', show: p.status === 'Completed', fn: function () { A.printHTML('Certificate', certificate(p.medal && p.medal !== 'None' ? p.medal + ' Medal' : 'Certificate of Participation', A.nameOf('students', p.studentId), (p.medal && p.medal !== 'None' ? 'won the ' + p.medal + ' medal in ' : 'took part in ') + p.category + ' (' + p.ageCategory + (p.weight ? ', ' + p.weight : '') + ')', t.name + ' · ' + t.location + ' · ' + A.date(t.date))); } },
        { icon: 'trash', label: 'Remove', danger: true, show: canE && p.status !== 'Completed', fn: function () { A.confirm('Remove this player?', { danger: true, ok: 'Remove' }).then(function (ok) { if (ok) { A.remove('participants', p.id, 'tournaments'); M.reload(); } }); } }
      ]; }
    });
  }

  /* ======================================================
     PLAYER RANKING
     ====================================================== */
  M.rankings = function () {
    var by = {};
    A.scope(D().participants).forEach(function (p) {
      var t = A.byId('tournaments', p.tournamentId); var year = t ? t.date.slice(0, 4) : '';
      var key = p.studentId + '|' + p.category + '|' + year;
      var r = by[key] || (by[key] = { id: key, studentId: p.studentId, clubId: p.clubId, centreId: p.centreId, category: p.category, ageCategory: p.ageCategory, year: year, events: 0, wins: 0, losses: 0, Gold: 0, Silver: 0, Bronze: 0, points: 0 });
      r.events++; r.wins += +p.wins || 0; r.losses += +p.losses || 0; if (r[p.medal] != null) r[p.medal]++; r.points += +p.points || 0;
    });
    var rows = Object.keys(by).map(function (k) { return by[k]; }).filter(function (r) { return r.points > 0; });
    rows.sort(function (a, b) { return b.points - a.points || b.Gold - a.Gold || b.wins - a.wins; });
    rows.forEach(function (r, i) { r.rank = i + 1; });
    return rows;
  };
  A.views.rankings = { title: 'Player Ranking', navTitle: 'Rankings', group: 'Operations', icon: 'medal', render: function (main) {
    main.innerHTML = A.pageHead('Player Ranking', 'Points: Gold 100 · Silver 60 · Bronze 35 · Participation 10 · +5 per win.') + '<div class="a-card" data-t></div>';
    var years = {}; M.rankings().forEach(function (r) { years[r.year] = 1; });
    M.table($('[data-t]', main), {
      rows: M.rankings, search: function (r) { return r.studentId + ' ' + A.nameOf('students', r.studentId); }, searchPlaceholder: 'Search player…',
      filters: FL.club().concat([FL.centre, FL.plain('category', 'Category'), FL.plain('ageCategory', 'Age'), FL.plain('year', 'Year', Object.keys(years).sort().reverse())]),
      defaultSort: { k: 'rank', dir: 1 },
      cols: [{ k: 'rank', l: 'Rank', cls: 'num', fmt: function (r) { return '<span class="a-rank r' + Math.min(r.rank, 4) + '">' + r.rank + '</span>'; }, sort: function (r) { return r.rank; }, text: function (r) { return r.rank; } },
        C.ref('studentId', 'Player', 'students'), C.ref('clubId', 'Club', 'clubs'), C.ref('centreId', 'Training centre', 'centres'), C.text('category', 'Category'), C.text('year', 'Year'), C.num('events', 'Events'), C.num('wins', 'Wins'), C.num('losses', 'Losses'), C.num('Gold', 'Gold'), C.num('Silver', 'Silver'), C.num('Bronze', 'Bronze'), C.num('points', 'Total points')],
      onRow: function (r) { if (A.can('students')) A.go('#/students/' + r.studentId); },
      exportName: 'Player ranking', canExport: A.can('rankings', 'export') || A.can('reports', 'export'), empty: 'No tournament results yet.'
    });
  } };
})();
