/* ==========================================================
   D-Clix Admin — Finance + Inventory
   payments · collections · invoices · refunds · payroll ·
   outstanding · products · stock · purchase requests · deliveries
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, M = A.M, C = M.C, FL = M.FL, esc = A.esc, $ = A.$;
  function D() { return DB.data; }
  var PAY_STATUSES = ['Paid', 'Unpaid', 'Partial', 'Overdue', 'Refunded'];
  function S() { return A.settings(); }

  /* ---------- Invoice / receipt document ---------- */
  function invoiceHTML(p, kind) {
    var s = A.byId('students', p.studentId) || {};
    var isReceipt = kind === 'receipt';
    var lines = '<tr><td>' + esc(p.type) + (p.desc ? ' — ' + esc(p.desc) : '') + '</td><td class="right">' + A.money(p.amount) + '</td></tr>' +
      (+p.discount ? '<tr><td>Discount</td><td class="right">- ' + A.money(p.discount) + '</td></tr>' : '') +
      (+p.tax ? '<tr><td>Tax</td><td class="right">' + A.money(p.tax) + '</td></tr>' : '') +
      '<tr class="tot"><td>Total</td><td class="right">' + A.money(M.total(p)) + '</td></tr>' +
      '<tr><td>Paid</td><td class="right">' + A.money(p.paid) + '</td></tr><tr class="tot"><td>Balance due</td><td class="right">' + A.money(M.balance(p)) + '</td></tr>';
    return '<h1>' + (isReceipt ? 'OFFICIAL RECEIPT' : 'INVOICE') + '</h1><table style="border:0;margin-top:0"><tr><td style="border:0;padding-left:0"><b>' + esc(A.nameOf('clubs', p.clubId)) + '</b><br>' + esc(A.nameOf('centres', p.centreId)) +
      '</td><td style="border:0" class="right">' + (isReceipt ? 'Receipt no: <b>' + esc(p.receiptNo) + '</b><br>' : '') + 'Invoice no: <b>' + esc(p.invoiceNo) + '</b><br>Date: ' + A.date(isReceipt ? p.date : p.dueDate || p.date) + (isReceipt ? '' : '<br>Due: ' + A.date(p.dueDate)) + '</td></tr></table>' +
      '<div class="box"><b>Bill to</b><br>' + esc(s.name || p.studentId) + ' (' + esc(p.studentId) + ')<br>' + (s.guardian ? 'c/o ' + esc(s.guardian) + '<br>' : '') + esc(s.phone || '') + ' · ' + esc(s.email || '') + '</div>' +
      '<table><thead><tr><th>Description</th><th class="right">Amount</th></tr></thead><tbody>' + lines + '</tbody></table>' +
      '<p style="margin-top:14px">Payment method: <b>' + esc(p.method || '—') + '</b>' + (p.txnId ? ' · Transaction ID ' + esc(p.txnId) : '') + (p.collectedBy ? ' · Collected by ' + esc(p.collectedBy) : '') + ' · Status: <b>' + esc(p.status) + '</b></p>' +
      '<p class="muted" style="margin-top:24px">This is a computer-generated document. No signature is required.</p>';
  }
  M.showInvoice = function (p) {
    var hasReceipt = !!p.receiptNo;
    var kind = hasReceipt ? 'receipt' : 'invoice';
    var acts = [{ label: 'Close', cls: 'ghost' }];
    acts.push({ label: 'Email', cls: 'ghost', icon: 'mail', onClick: function () {
      var s = A.byId('students', p.studentId);
      if (!s || !s.email) { A.toast('This student has no email address on file.', 'error'); return false; }
      if (!S().notifyEmail) { A.toast('Email is turned off in Settings → Notifications.', 'error'); return false; }
      A.audit('Email', 'invoices', p.id, [], 'Emailed ' + kind + ' ' + (hasReceipt ? p.receiptNo : p.invoiceNo) + ' to ' + s.email); DB.save();
      A.toast('Queued: ' + kind + ' to ' + s.email + ' (demo — connect an email service to send).', 'info'); return false;
    } });
    if (hasReceipt) acts.push({ label: 'Invoice', cls: 'ghost', icon: 'file', onClick: function () { A.printHTML(p.invoiceNo, invoiceHTML(p, 'invoice')); return false; } });
    acts.push({ label: 'Print / PDF', cls: 'primary', icon: 'printer', onClick: function () { A.printHTML(hasReceipt ? p.receiptNo : p.invoiceNo, invoiceHTML(p, kind)); return false; } });
    A.modal({ title: (hasReceipt ? 'Receipt ' + p.receiptNo : 'Invoice ' + p.invoiceNo), size: 'lg', body: '<div class="a-doc">' + invoiceHTML(p, kind) + '</div>', actions: acts });
  };

  /* ---------- Shared payment creation ---------- */
  M.newPayment = function (v) {
    var st = A.byId('students', v.studentId);
    var p = Object.assign({ discount: 0, tax: 0, paid: 0, collectedBy: '', desc: '' }, v);
    p.id = DB.nextId('payments', 'PAY', 5);
    p.clubId = st.clubId; p.centreId = st.centreId;
    p.invoiceNo = M.fmtNo(S().invoiceFormat, p.id);
    finalizePayment(p);
    return p;
  };
  function finalizePayment(p) {
    var total = M.total(p);
    if (p.status !== 'Refunded') {
      if (+p.paid >= total && total > 0) p.status = 'Paid';
      else if (+p.paid > 0) p.status = 'Partial';
      else if (p.status === 'Paid' || p.status === 'Partial') p.status = 'Unpaid';
      if (p.status === 'Unpaid' && p.dueDate && p.dueDate < A.today()) p.status = 'Overdue';
    }
    if ((p.status === 'Paid' || p.status === 'Partial') && !p.receiptNo) p.receiptNo = M.fmtNo(S().receiptFormat, p.id);
    if (M.isOnline(p.method) && +p.paid > 0 && !p.txnId) { p.txnId = 'TXN' + String(Date.now()).slice(-8); p.gatewayRef = p.method === 'FPX' || p.method === 'Card' ? 'GW-' + String(Math.random()).slice(2, 8) : ''; }
    if (p.method === 'Cash' && +p.paid > 0 && !p.collectedBy) p.collectedBy = A.user().name;
  }
  function payFields(forEdit) {
    return [
      { k: 'studentId', l: 'Student', type: 'select', ref: 'students', req: true, refFilter: function (s) { return s.status !== 'Suspended'; }, refLabel: function (s) { return ' · ' + s.id; }, ro: forEdit },
      { k: 'type', l: 'Payment type', type: 'select', opts: S().paymentTypes, req: true }, { k: 'desc', l: 'Description', ph: 'e.g. Monthly fee Nov 2026' },
      { k: 'amount', l: 'Amount', type: 'number', min: 0.01, step: '0.01', req: true }, { k: 'discount', l: 'Discount', type: 'number', min: 0, step: '0.01', def: 0 },
      { k: 'tax', l: 'Tax', type: 'number', min: 0, step: '0.01', def: 0, help: S().taxRate ? 'Tax rate in settings: ' + S().taxRate + '%' : '' },
      { k: 'paid', l: 'Amount paid', type: 'number', min: 0, step: '0.01', def: 0 }, { k: 'method', l: 'Payment method', type: 'select', opts: S().paymentMethods },
      { k: 'date', l: 'Payment date', type: 'date', req: true, def: A.today, check: function (v) { return v > A.today() ? 'Payment date cannot be in the future.' : ''; } }, { k: 'dueDate', l: 'Due date', type: 'date', def: A.today },
      { k: 'collectedBy', l: 'Collected by', help: 'For cash. Defaults to you.' }
    ];
  }
  function payValidate(v) {
    var e = {}, total = (+v.amount || 0) - (+v.discount || 0) + (+v.tax || 0);
    if (+v.discount > +v.amount) e.discount = 'Discount cannot be more than the amount.';
    if (+v.paid > total + 0.001) e.paid = 'Amount paid (' + A.money(v.paid) + ') is more than the total due (' + A.money(total) + ').';
    if (+v.paid > 0 && !v.method) e.method = 'Choose how the payment was made.';
    return e;
  }

  /* ======================================================
     PAYMENTS
     ====================================================== */
  A.views.payments = M.crud({
    key: 'payments', coll: 'payments', title: 'Payments', single: 'Payment', group: 'Finance', icon: 'wallet', prefix: 'PAY', idLen: 5,
    sub: 'Every fee, online or offline. Receipts are issued automatically when money is received.', addLabel: 'Record payment',
    search: function (r) { var s = A.byId('students', r.studentId); return [r.id, r.invoiceNo, r.receiptNo, r.txnId, r.studentId, s ? s.name : '', s ? s.phone : ''].join(' '); },
    searchPlaceholder: 'Search invoice, receipt, transaction, student…', dateKey: 'date', sort: { k: 'date', dir: -1 },
    cols: function () { return [C.id, C.ref('studentId', 'Student', 'students'), C.ref('centreId', 'Centre', 'centres'), C.text('type', 'Type'), C.money('amount', 'Amount'), C.money('paid', 'Paid'), C.text('method', 'Method'), C.date('date', 'Date'), C.text('receiptNo', 'Receipt no.'), C.status()]; },
    filters: function () { return FL.club().concat([FL.centre, FL.plain('type', 'Payment type', S().paymentTypes), FL.plain('method', 'Method', S().paymentMethods), FL.status(PAY_STATUSES)]); },
    fields: function () { return payFields(false); }, validate: payValidate,
    newRec: function () { return { type: 'Monthly Fee', method: 'Cash', status: 'Unpaid' }; },
    beforeSave: function (o, old, isNew) {
      var st = A.byId('students', o.studentId); o.clubId = st.clubId; o.centreId = st.centreId;
      if (isNew) o.invoiceNo = M.fmtNo(S().invoiceFormat, o.id);
      if (!o.dueDate) o.dueDate = o.date;
      finalizePayment(o);
    },
    canDelete: function (r) { return r.receiptNo ? 'Payments with a receipt cannot be deleted. Create a refund instead so the books stay consistent.' : null; },
    actions: function (r) { return [
      { icon: 'receipt', label: r.receiptNo ? 'View receipt' : 'View invoice', fn: function () { M.showInvoice(r); } },
      { icon: 'check', label: 'Receive payment', show: A.can('payments', 'edit') && ['Unpaid', 'Overdue', 'Partial'].indexOf(r.status) >= 0, fn: function () { receive(r); } },
      { icon: 'undo', label: 'Request refund', show: A.can('refunds', 'create') && (r.status === 'Paid' || r.status === 'Partial'), fn: function () { M.requestRefund(r); } }
    ]; }
  });
  function receive(r) {
    A.openForm({ title: 'Receive payment · ' + r.invoiceNo, size: 'sm', rec: { amountNow: M.balance(r), method: 'Cash', date: A.today() }, fields: [
      { k: 'amountNow', l: 'Amount received (balance ' + A.money(M.balance(r)) + ')', type: 'number', min: 0.01, step: '0.01', req: true, check: function (v) { return +v > M.balance(r) + 0.001 ? 'This is more than the balance due.' : ''; } },
      { k: 'method', l: 'Method', type: 'select', opts: S().paymentMethods, req: true }, { k: 'date', l: 'Date', type: 'date', req: true, check: function (v) { return v > A.today() ? 'Date cannot be in the future.' : ''; } }],
      onSave: function (v) {
        var p = Object.assign({}, r, { paid: (+r.paid || 0) + (+v.amountNow), method: v.method, date: v.date });
        finalizePayment(p);
        A.put('payments', p, 'payments', 'Received ' + A.money(v.amountNow) + ' for ' + r.invoiceNo);
        return p;
      }, after: function (p) { M.reload(); M.showInvoice(p); } });
  }

  /* ======================================================
     COLLECTIONS (cash · online · reconciliation)
     ====================================================== */
  A.views.collections = { title: 'Collections', group: 'Finance', icon: 'dollar', render: function (main) {
    main.innerHTML = A.pageHead('Collections', 'Money received, split by cash and online, and checked against payment and receipt records.') + '<div data-tabs></div>';
    var received = function () { return A.rows('payments').filter(function (p) { return +p.paid > 0; }); };
    A.tabs($('[data-tabs]', main), [
      { label: 'Reconciliation', icon: 'checkcircle', render: recon },
      { label: 'Cash collection', icon: 'dollar', render: function (b) {
        M.table(b, { rows: function () { return received().filter(function (p) { return p.method === 'Cash'; }); }, dateKey: 'date', defaultSort: { k: 'date', dir: -1 },
          search: function (r) { return [r.receiptNo, r.studentId, A.nameOf('students', r.studentId), r.collectedBy].join(' '); },
          filters: FL.club().concat([FL.centre, { k: 'instructor', l: 'Instructor', val: function (r) { var s = A.byId('students', r.studentId); return s ? s.instructorId : ''; }, opts: FL.instructor.opts }, FL.plain('collectedBy', 'Collected by')]),
          cols: [C.text('receiptNo', 'Receipt'), C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.calc('ins', 'Instructor', function (r) { var s = A.byId('students', r.studentId); return s ? A.nameOf('instructors', s.instructorId) : ''; }), C.ref('centreId', 'Training centre', 'centres'), C.money('paid', 'Amount'), C.text('collectedBy', 'Collected by')],
          onRow: M.showInvoice, exportName: 'Cash collection', canExport: A.can('collections', 'export') });
      } },
      { label: 'Online collection', icon: 'globe', render: function (b) {
        M.table(b, { rows: function () { return received().filter(function (p) { return M.isOnline(p.method); }); }, dateKey: 'date', defaultSort: { k: 'date', dir: -1 },
          search: function (r) { return [r.txnId, r.gatewayRef, r.receiptNo, r.studentId, A.nameOf('students', r.studentId)].join(' '); }, searchPlaceholder: 'Search transaction ID, gateway ID, student…',
          filters: FL.club().concat([FL.centre, FL.plain('method', 'Method', S().paymentMethods.filter(function (m) { return m !== 'Cash'; })), FL.status(['Paid', 'Partial', 'Refunded'])]),
          cols: [C.text('txnId', 'Transaction ID'), C.text('gatewayRef', 'Gateway ID'), C.ref('studentId', 'Student', 'students'), C.text('method', 'Method'), C.money('paid', 'Amount'), C.date('date', 'Date'), C.status()],
          onRow: M.showInvoice, exportName: 'Online collection', canExport: A.can('collections', 'export') });
      } }
    ]);
  } };
  function recon(b) {
    var months = A.lastMonths(6).reverse();
    b.innerHTML = '<div class="a-filterbar inline"><label class="a-date"><span>Month</span><select class="a-input" id="rcMonth">' + months.map(function (m) { return '<option value="' + m + '">' + A.monthLabel(m) + '</option>'; }).join('') + '</select></label>' +
      '<label class="a-date"><span>Training centre</span><select class="a-input" id="rcCentre"><option value="">All centres</option>' + A.rows('centres').map(function (c) { return '<option value="' + c.id + '">' + esc(c.name) + '</option>'; }).join('') + '</select></label></div><div id="rcOut"></div>';
    function run() {
      var m = $('#rcMonth', b).value, c = $('#rcCentre', b).value;
      var pays = A.rows('payments').filter(function (p) { return A.monthKey(p.date) === m && (!c || p.centreId === c); });
      var received = pays.filter(function (p) { return +p.paid > 0; });
      var paymentsSum = A.sum(received, 'paid');
      var receipts = received.filter(function (p) { return p.receiptNo; });
      var receiptSum = A.sum(receipts, 'paid');
      var cash = received.filter(function (p) { return p.method === 'Cash'; }), online = received.filter(function (p) { return M.isOnline(p.method); });
      var collSum = A.sum(cash, 'paid') + A.sum(online, 'paid');
      var issues = [];
      received.filter(function (p) { return !p.receiptNo; }).forEach(function (p) { issues.push({ id: p.id, p: p, issue: 'Money received but no receipt issued' }); });
      received.filter(function (p) { return !p.method; }).forEach(function (p) { issues.push({ id: p.id + 'm', p: p, issue: 'Payment method missing — not counted as cash or online' }); });
      pays.filter(function (p) { return p.receiptNo && !(+p.paid > 0); }).forEach(function (p) { issues.push({ id: p.id + 'r', p: p, issue: 'Receipt exists but no amount recorded as paid' }); });
      var seen = {}; A.rows('payments').forEach(function (p) { if (!p.receiptNo) return; if (seen[p.receiptNo] && (A.monthKey(p.date) === m)) issues.push({ id: p.id + 'd', p: p, issue: 'Duplicate receipt number ' + p.receiptNo }); seen[p.receiptNo] = 1; });
      var ok = !issues.length && Math.abs(paymentsSum - receiptSum) < 0.01 && Math.abs(paymentsSum - collSum) < 0.01;
      $('#rcOut', b).innerHTML = '<div class="a-recon ' + (ok ? 'ok' : 'bad') + '">' + A.icon(ok ? 'checkcircle' : 'alert', 'w-6') + '<div><b>' + (ok ? 'All three records agree for ' + A.monthLabel(m) + '.' : issues.length + ' issue(s) need attention for ' + A.monthLabel(m) + '.') + '</b><span>Collection report ↔ payment records ↔ receipt records</span></div></div>' +
        '<div class="a-stats three">' + A.statCard('Collection report', A.money(collSum), 'dollar', (cash.length + online.length) + ' transactions · cash ' + A.money(A.sum(cash, 'paid')) + ' · online ' + A.money(A.sum(online, 'paid'))) +
        A.statCard('Payment records', A.money(paymentsSum), 'wallet', received.length + ' payments with money received') + A.statCard('Receipt records', A.money(receiptSum), 'receipt', receipts.length + ' receipts issued') + '</div><div id="rcIssues"></div>';
      if (issues.length) M.table($('#rcIssues', b), { rows: function () { return issues; }, cols: [{ k: 'issue', l: 'Issue', fmt: function (r) { return '<span class="bad">' + esc(r.issue) + '</span>'; }, text: function (r) { return r.issue; } }, C.calc('pid', 'Payment', function (r) { return r.p.id; }), C.calc('inv', 'Invoice', function (r) { return r.p.invoiceNo; }), C.calc('st', 'Student', function (r) { return A.nameOf('students', r.p.studentId); }), C.calc('amt', 'Paid', function (r) { return A.money(r.p.paid); }), C.calc('mt', 'Method', function (r) { return r.p.method; })], onRow: function (r) { M.showInvoice(r.p); }, exportName: 'Reconciliation issues ' + m });
    }
    $('#rcMonth', b).addEventListener('change', run); $('#rcCentre', b).addEventListener('change', run);
    run();
  }

  /* ======================================================
     INVOICES & RECEIPTS
     ====================================================== */
  A.views.invoices = { title: 'Invoices & Receipts', navTitle: 'Invoices', group: 'Finance', icon: 'receipt', render: function (main) {
    var canC = A.can('invoices', 'create') || A.can('payments', 'create');
    main.innerHTML = A.pageHead('Invoices & Receipts', 'Generate, print, download as PDF and email invoices and receipts.', canC ? A.btn('Generate invoice', 'plus', 'data-add') : '') + '<div class="a-card" data-t></div>';
    var add = $('[data-add]', main);
    if (add) add.addEventListener('click', function () {
      A.openForm({ title: 'Generate invoice', rec: { type: 'Monthly Fee', dueDate: DB.iso(DB.addDays(new Date(), 7)) }, fields: [
        { k: 'studentId', l: 'Student', type: 'select', ref: 'students', req: true, refFilter: function (s) { return s.status === 'Active'; }, refLabel: function (s) { return ' · ' + s.id; } },
        { k: 'type', l: 'Fee type', type: 'select', opts: S().paymentTypes, req: true }, { k: 'desc', l: 'Description', req: true },
        { k: 'amount', l: 'Amount', type: 'number', min: 0.01, step: '0.01', req: true }, { k: 'discount', l: 'Discount', type: 'number', min: 0, def: 0 }, { k: 'tax', l: 'Tax', type: 'number', min: 0, def: 0 },
        { k: 'dueDate', l: 'Due date', type: 'date', req: true }],
        extraValidate: payValidate,
        onSave: function (v) { v.paid = 0; v.method = ''; v.date = A.today(); v.status = 'Unpaid'; var p = M.newPayment(v); A.put('payments', p, 'invoices', 'Generated invoice ' + p.invoiceNo); return p; },
        after: function (p) { M.reload(); M.showInvoice(p); } });
    });
    M.table($('[data-t]', main), {
      rows: function () { return A.rows('payments'); }, dateKey: 'date', defaultSort: { k: 'invoiceNo', dir: -1 },
      search: function (r) { return [r.invoiceNo, r.receiptNo, r.studentId, A.nameOf('students', r.studentId)].join(' '); }, searchPlaceholder: 'Search invoice / receipt number or student…',
      filters: FL.club().concat([FL.centre, FL.status(PAY_STATUSES), { k: 'doc', l: 'Document', opts: ['Receipt issued', 'Invoice only'], val: function (r) { return r.receiptNo ? 'Receipt issued' : 'Invoice only'; } }]),
      cols: [C.text('invoiceNo', 'Invoice no.'), C.text('receiptNo', 'Receipt no.'), C.date('date', 'Date'), C.ref('studentId', 'Student', 'students'), C.calc('d', 'Description', function (r) { return r.type + (r.desc ? ' — ' + r.desc : ''); }),
        { k: 'total', l: 'Total', cls: 'num', fmt: function (r) { return A.money(M.total(r)); }, sort: M.total, text: function (r) { return M.total(r).toFixed(2); } }, C.money('paid', 'Paid'),
        { k: 'bal', l: 'Balance', cls: 'num', fmt: function (r) { return A.money(M.balance(r)); }, sort: M.balance, text: function (r) { return M.balance(r).toFixed(2); } }, C.text('method', 'Method'), C.status(), C.actions],
      actions: function (r) { return [
        { icon: 'eye', label: 'View', fn: function () { M.showInvoice(r); } },
        { icon: 'printer', label: 'Print / PDF', fn: function () { A.printHTML(r.receiptNo || r.invoiceNo, invoiceHTML(r, r.receiptNo ? 'receipt' : 'invoice')); } }
      ]; },
      onRow: M.showInvoice, exportName: 'Invoices and receipts', canExport: A.can('invoices', 'export')
    });
  } };

  /* ======================================================
     REFUNDS & REIMBURSEMENTS
     ====================================================== */
  var FLOW = { 'Requested': 'Pending Approval', 'Approved': 'Paid', 'Paid': 'Completed' };
  M.requestRefund = function (p) {
    A.openForm({ title: 'Request refund · ' + p.invoiceNo, size: 'sm', rec: { amount: p.paid }, fields: [
      { k: 'amount', l: 'Refund amount (max ' + A.money(p.paid) + ')', type: 'number', min: 0.01, step: '0.01', req: true, check: function (v) { return +v > +p.paid ? 'Refund cannot exceed the amount paid (' + A.money(p.paid) + ').' : ''; } },
      { k: 'reason', l: 'Reason', type: 'textarea', req: true }, { k: 'document', l: 'Supporting document', type: 'file', accept: '.pdf,.jpg,.jpeg,.png' }],
      onSave: function (v) {
        if (D().refunds.some(function (x) { return x.paymentId === p.id && ['Rejected', 'Completed'].indexOf(x.status) < 0; })) { A.toast('There is already an open refund for this payment.', 'error'); return false; }
        var r = { id: DB.nextId('refunds', 'RF'), kind: 'Refund', studentId: p.studentId, paymentId: p.id, clubId: p.clubId, centreId: p.centreId, amount: v.amount, reason: v.reason, document: v.document && v.document[0] ? v.document[0].name : '', requested: A.today(), requestedBy: A.user().name, status: 'Pending Approval', approvedBy: '', payStatus: 'Unpaid' };
        A.put('refunds', r, 'refunds', 'Refund requested for ' + p.invoiceNo); return r;
      }, after: function () { M.reload(); A.toast('Refund sent for approval.', 'info'); } });
  };
  M.decideRefund = function (r, approve, note) {
    A.put('refunds', { id: r.id, status: approve ? 'Approved' : 'Rejected', approvedBy: A.user().name, decisionNote: note || '' }, 'refunds', (approve ? 'Approved ' : 'Rejected ') + r.kind.toLowerCase() + ' ' + r.id);
  };
  function advanceRefund(r) {
    var next = FLOW[r.status]; if (!next) return;
    var patch = { id: r.id, status: next };
    if (next === 'Paid') {
      patch.payStatus = 'Paid'; patch.paidOn = A.today();
      if (r.kind === 'Refund' && r.paymentId) { var p = A.byId('payments', r.paymentId); if (p) A.put('payments', { id: p.id, status: 'Refunded', refundedAmount: r.amount }, 'payments', 'Refunded ' + A.money(r.amount) + ' on ' + p.invoiceNo); }
    }
    A.put('refunds', patch, 'refunds', r.kind + ' ' + r.id + ' → ' + next);
  }
  A.views.refunds = M.crud({
    key: 'refunds', coll: 'refunds', title: 'Refunds & Reimbursements', navTitle: 'Reimbursements', single: 'Request', group: 'Finance', icon: 'undo', prefix: 'RF',
    sub: 'Requested → Pending approval → Approved → Paid → Completed (or Rejected).', addLabel: 'New reimbursement',
    search: function (r) { return [r.id, r.studentId, A.nameOf('students', r.studentId), r.reason, r.requestedBy].join(' '); }, dateKey: 'requested', sort: { k: 'requested', dir: -1 },
    cols: function () { return [C.id, C.text('kind', 'Type'), C.calc('who', 'Student / payee', function (r) { return r.studentId ? A.nameOf('students', r.studentId) : r.requestedBy; }), C.calc('txn', 'Original transaction', function (r) { var p = A.byId('payments', r.paymentId); return p ? p.invoiceNo : '—'; }), C.money('amount', 'Amount'), C.text('reason', 'Reason'), C.date('requested', 'Requested'), C.text('requestedBy', 'Requested by'), C.status(), C.text('approvedBy', 'Approved by'), C.status('payStatus', 'Payment')]; },
    filters: function () { return FL.club().concat([FL.plain('kind', 'Type', ['Refund', 'Reimbursement']), FL.status(['Requested', 'Pending Approval', 'Approved', 'Paid', 'Completed', 'Rejected'])]); },
    fields: function () { return [{ k: 'requestedBy', l: 'Payee (staff / instructor)', req: true, def: function () { return A.user().name; } }, M.F.centre(), { k: 'amount', l: 'Amount', type: 'number', min: 0.01, step: '0.01', req: true }, { k: 'reason', l: 'Reason', type: 'textarea', req: true }, { k: 'document', l: 'Supporting document', type: 'file', accept: '.pdf,.jpg,.jpeg,.png' }]; },
    beforeSave: function (o, old, isNew) { if (isNew) { o.kind = 'Reimbursement'; o.studentId = ''; o.paymentId = ''; o.requested = A.today(); o.status = 'Requested'; o.approvedBy = ''; o.payStatus = 'Unpaid'; } if (Array.isArray(o.document)) o.document = o.document[0] ? o.document[0].name : ''; },
    noEdit: true, noDelete: true,
    actions: function (r) { var canA = A.can('refunds', 'approve'); return [
      { icon: 'send', label: 'Submit for approval', show: r.status === 'Requested' && A.can('refunds', 'create'), fn: function () { advanceRefund(r); M.reload(); } },
      { icon: 'check', label: 'Approve', show: r.status === 'Pending Approval' && canA, fn: function () { M.decideRefund(r, true); M.reload(); A.toast('Approved.'); } },
      { icon: 'x', label: 'Reject', danger: true, show: (r.status === 'Pending Approval' || r.status === 'Requested') && canA, fn: function () { A.prompt('Reject ' + r.id, 'Reason', { required: true, danger: true, ok: 'Reject' }).then(function (n) { if (n) { M.decideRefund(r, false, n); M.reload(); } }); } },
      { icon: 'wallet', label: 'Mark paid', show: r.status === 'Approved' && A.can('refunds', 'edit'), fn: function () { A.confirm('Mark ' + A.money(r.amount) + ' as paid out?').then(function (ok) { if (ok) { advanceRefund(r); M.reload(); } }); } },
      { icon: 'checkcircle', label: 'Complete', show: r.status === 'Paid' && A.can('refunds', 'edit'), fn: function () { advanceRefund(r); M.reload(); } },
      { icon: 'history', label: 'History', fn: function () { var m = A.modal({ title: 'History · ' + r.id, body: '<div></div>', actions: [{ label: 'Close', cls: 'ghost' }] }); M.historyTab(m.body, r.id); } }
    ]; }
  });

  /* ======================================================
     PAYROLL
     ====================================================== */
  function payslip(p) {
    var i = A.byId('instructors', p.instructorId) || {};
    return '<h1>PAYSLIP — ' + esc(A.monthLabel(p.month)) + '</h1><div class="box">' + esc(i.name) + ' (' + esc(p.instructorId) + ')<br>' + esc(A.nameOf('centres', p.centreId)) + ' · ' + esc(i.employment || '') + '<br>IC: ' + esc(i.ic || '') + '</div>' +
      '<table><thead><tr><th>Earnings</th><th class="right">Amount</th><th>Deductions</th><th class="right">Amount</th></tr></thead><tbody>' +
      '<tr><td>Basic salary</td><td class="right">' + A.money(p.salary) + '</td><td>Statutory (EPF/SOCSO/EIS)</td><td class="right">' + A.money(p.deduction) + '</td></tr>' +
      '<tr><td>Allowance</td><td class="right">' + A.money(p.allowance) + '</td><td></td><td></td></tr><tr><td>Commission (' + p.sessions + ' sessions)</td><td class="right">' + A.money(p.commission) + '</td><td></td><td></td></tr>' +
      '<tr><td>Bonus</td><td class="right">' + A.money(p.bonus) + '</td><td></td><td></td></tr>' +
      '<tr class="tot"><td>Gross</td><td class="right">' + A.money(+p.salary + +p.allowance + +p.commission + +p.bonus) + '</td><td>Total deductions</td><td class="right">' + A.money(p.deduction) + '</td></tr></tbody></table>' +
      '<h2>Net pay: ' + A.money(p.net) + '</h2><p class="muted">Status: ' + esc(p.status) + (p.paidOn ? ' on ' + A.date(p.paidOn) : '') + '</p>';
  }
  function calcNet(o) { o.net = (+o.salary || 0) + (+o.allowance || 0) + (+o.commission || 0) + (+o.bonus || 0) - (+o.deduction || 0); return o; }
  A.views.payroll = M.crud({
    key: 'payroll', coll: 'payroll', title: 'Payroll', single: 'Payroll entry', group: 'Finance', icon: 'card', prefix: 'PY', idLen: 5,
    sub: 'Instructor salary, allowance, commission (from sessions taught), bonus and deductions.', noCreate: true,
    search: function (r) { return r.instructorId + ' ' + A.nameOf('instructors', r.instructorId); }, sort: { k: 'month', dir: -1 },
    headActions: function () { return A.can('payroll', 'create') ? A.btn('Generate payroll', 'refresh', 'data-gen') : ''; },
    afterList: function (main) { var b = $('[data-gen]', main); if (b) b.addEventListener('click', generate); },
    cols: function () { return [C.calc('m', 'Month', function (r) { return A.monthLabel(r.month); }), C.ref('instructorId', 'Instructor', 'instructors'), C.ref('centreId', 'Centre', 'centres'), C.num('sessions', 'Sessions'), C.money('salary', 'Salary'), C.money('allowance', 'Allowance'), C.money('commission', 'Commission'), C.money('bonus', 'Bonus'), C.money('deduction', 'Deduction'), C.money('net', 'Net pay'), C.status()]; },
    filters: function () { var ms = {}; A.rows('payroll').forEach(function (p) { ms[p.month] = 1; }); return FL.club().concat([{ k: 'month', l: 'Payroll month', opts: Object.keys(ms).sort().reverse().map(function (m) { return [m, A.monthLabel(m)]; }) }, FL.centre, FL.status(['Pending', 'Paid'])]); },
    fields: function () { return [{ k: 'salary', l: 'Salary', type: 'number', min: 0, req: true }, { k: 'allowance', l: 'Allowance', type: 'number', min: 0 }, { k: 'commission', l: 'Commission', type: 'number', min: 0 }, { k: 'bonus', l: 'Bonus', type: 'number', min: 0 }, { k: 'deduction', l: 'Deduction', type: 'number', min: 0 }, M.F.status(['Pending', 'Paid'])]; },
    beforeSave: function (o) { calcNet(o); if (o.status === 'Paid' && !o.paidOn) o.paidOn = A.today(); if (o.net < 0) { A.toast('Deductions are larger than earnings. Please check the figures.', 'error'); return false; } },
    bulk: function () { return [{ label: 'Mark paid', icon: 'wallet', perm: 'edit', fn: function (rows) { rows.forEach(function (r) { if (r.status !== 'Paid') A.put('payroll', { id: r.id, status: 'Paid', paidOn: A.today() }, 'payroll'); }); A.toast('Marked as paid.'); } }]; },
    actions: function (r) { return [
      { icon: 'file', label: 'Payslip', fn: function () { A.modal({ title: 'Payslip', size: 'lg', body: '<div class="a-doc">' + payslip(r) + '</div>', actions: [{ label: 'Close', cls: 'ghost' }, { label: 'Print / PDF', cls: 'primary', icon: 'printer', onClick: function () { A.printHTML('Payslip ' + r.instructorId + ' ' + r.month, payslip(r)); return false; } }] }); } },
      { icon: 'wallet', label: 'Mark paid', show: r.status !== 'Paid' && A.can('payroll', 'edit'), fn: function () { A.put('payroll', { id: r.id, status: 'Paid', paidOn: A.today() }, 'payroll'); M.reload(); } }
    ]; }
  });
  function generate() {
    var months = A.lastMonths(3).reverse();
    A.openForm({ title: 'Generate payroll', size: 'sm', rec: { month: months[0] }, fields: [{ k: 'month', l: 'Payroll month', type: 'select', opts: months.map(function (m) { return [m, A.monthLabel(m)]; }), req: true }, { k: 'rate', l: 'Commission per session taught', type: 'number', min: 0, def: 15, req: true }, { k: 'allowance', l: 'Standard allowance', type: 'number', min: 0, def: 150 }],
      onSave: function (v) {
        var made = 0, skipped = 0;
        A.rows('instructors').filter(function (i) { return i.status === 'Active'; }).forEach(function (i) {
          if (D().payroll.some(function (p) { return p.instructorId === i.id && p.month === v.month; })) { skipped++; return; }
          var sess = {}; D().attendance.forEach(function (a) { if (a.instructorId === i.id && A.monthKey(a.date) === v.month) sess[a.date + a.classId] = 1; });
          var n = Object.keys(sess).length;
          var o = calcNet({ id: DB.nextId('payroll', 'PY', 5), instructorId: i.id, clubId: i.clubId, centreId: i.centreId, month: v.month, salary: i.baseSalary, allowance: v.allowance || 0, commission: n * v.rate, bonus: 0, deduction: Math.round(i.baseSalary * 0.11), sessions: n, status: 'Pending', paidOn: '' });
          A.put('payroll', o, 'payroll', 'Generated payroll ' + v.month + ' for ' + i.name); made++;
        });
        A.toast(made + ' payroll entr' + (made === 1 ? 'y' : 'ies') + ' created' + (skipped ? ', ' + skipped + ' already existed' : '') + '.', 'info');
        return true;
      } });
  }

  /* ======================================================
     OUTSTANDING PAYMENTS
     ====================================================== */
  A.views.outstanding = { title: 'Outstanding Payments', navTitle: 'Outstanding', group: 'Finance', icon: 'alert', badge: function () { return A.rows('payments').filter(function (p) { return p.status === 'Overdue'; }).length; }, render: function (main) {
    M.normalize();
    var rows = function () { return A.rows('payments').filter(function (p) { return ['Unpaid', 'Overdue', 'Partial'].indexOf(p.status) >= 0; }); };
    var all = rows();
    var overdueDays = function (p) { return p.dueDate && p.dueDate < A.today() ? Math.round((new Date(A.today()) - new Date(p.dueDate)) / 864e5) : 0; };
    var aging = [['Not yet due', 0, 0], ['1–30 days', 1, 30], ['31–60 days', 31, 60], ['61+ days', 61, 1e9]].map(function (b) { var list = all.filter(function (p) { var d = overdueDays(p); return d >= b[1] && d <= b[2]; }); return A.statCard(b[0], A.money(A.sum(list, M.balance)), 'clock', list.length + ' bills'); }).join('');
    main.innerHTML = A.pageHead('Outstanding Payments', 'Unpaid, partially paid and overdue bills.') + '<div class="a-stats">' + A.statCard('Total outstanding', A.money(A.sum(all, M.balance)), 'alert', all.length + ' bills · ' + Object.keys(all.reduce(function (o, p) { o[p.studentId] = 1; return o; }, {})).length + ' students') + aging + '</div><div class="a-card" data-t></div>';
    M.table($('[data-t]', main), {
      rows: rows, dateKey: 'dueDate', dateLabel: 'Due from', defaultSort: { k: 'days', dir: -1 },
      search: function (r) { var s = A.byId('students', r.studentId); return [r.invoiceNo, r.studentId, s ? s.name : '', s ? s.phone : ''].join(' '); },
      filters: FL.club().concat([FL.centre, FL.status(['Unpaid', 'Overdue', 'Partial']), FL.plain('type', 'Payment type', S().paymentTypes)]),
      cols: [C.text('invoiceNo', 'Invoice'), C.ref('studentId', 'Student', 'students'), C.calc('ph', 'Phone', function (r) { var s = A.byId('students', r.studentId); return s ? s.phone : ''; }), C.ref('centreId', 'Centre', 'centres'), C.text('type', 'Type'), C.date('dueDate', 'Due date'),
        { k: 'days', l: 'Days overdue', cls: 'num', fmt: function (r) { var d = overdueDays(r); return d ? '<span class="' + (d > 30 ? 'bad' : 'warn') + '">' + d + '</span>' : '—'; }, sort: overdueDays, text: overdueDays },
        { k: 'bal', l: 'Balance', cls: 'num', fmt: function (r) { return '<b>' + A.money(M.balance(r)) + '</b>'; }, sort: M.balance, text: function (r) { return M.balance(r).toFixed(2); } }, C.status(), C.actions],
      actions: function (r) { return [{ icon: 'eye', label: 'View invoice', fn: function () { M.showInvoice(r); } }, { icon: 'send', label: 'Send reminder', show: A.can('notifications', 'create'), fn: function () { remind([r]); } }]; },
      bulk: A.can('notifications', 'create') ? [{ label: 'Send reminders', icon: 'send', fn: function (sel) { remind(sel); } }] : [],
      exportName: 'Outstanding payments', canExport: A.can('outstanding', 'export'), empty: 'Nothing outstanding. 🎉'
    });
    function remind(list) {
      var students = {}; list.forEach(function (p) { students[p.studentId] = 1; });
      var ch = S().notifyWhatsApp ? 'WhatsApp' : S().notifyEmail ? 'Email' : 'Push';
      M.notify({ title: 'Payment reminder', message: 'You have an outstanding balance. Please pay at your centre or online.', channel: ch, recipients: 'Selected Students', target: Object.keys(students).join(','), total: Object.keys(students).length, delivered: Object.keys(students).length });
      A.toast('Reminder sent by ' + ch + ' to ' + Object.keys(students).length + ' student(s) (demo).', 'info');
    }
  } };

  /* ======================================================
     INVENTORY — products, stock, purchase requests, deliveries
     ====================================================== */
  function stockState(p) { return p.stock <= 0 ? 'Out of stock' : p.stock <= p.minStock ? 'Low stock' : 'In stock'; }
  M.lowStock = function () { return A.rows('products').filter(function (p) { return p.status === 'Active' && p.stock <= p.minStock; }); };
  function moveStock(prefill, done) {
    A.openForm({ title: 'Stock movement', size: 'sm', rec: Object.assign({ type: 'Stock In', date: A.today() }, prefill || {}), fields: [
      { k: 'productId', l: 'Product', type: 'select', ref: 'products', req: true, refLabel: function (p) { return ' (stock ' + p.stock + ')'; } },
      { k: 'type', l: 'Movement', type: 'select', opts: ['Stock In', 'Stock Out', 'Adjustment', 'Transfer'], req: true },
      { k: 'qty', l: 'Quantity', type: 'number', req: true, help: 'For an adjustment, use a negative number to reduce stock.' },
      { k: 'fromCentreId', l: 'From centre (transfer)', type: 'select', ref: 'centres' }, { k: 'toCentreId', l: 'To centre (transfer)', type: 'select', ref: 'centres' },
      { k: 'date', l: 'Date', type: 'date', req: true }, { k: 'note', l: 'Note', type: 'textarea', rows: 2 }],
      extraValidate: function (v) {
        var e = {}, p = A.byId('products', v.productId); var q = +v.qty;
        if (!q) e.qty = 'Quantity cannot be zero.';
        else if (v.type !== 'Adjustment' && q < 0) e.qty = 'Quantity must be positive.';
        else if (p && v.type === 'Stock Out' && q > p.stock) e.qty = 'Only ' + p.stock + ' in stock.';
        else if (p && v.type === 'Adjustment' && p.stock + q < 0) e.qty = 'Stock cannot go below zero.';
        if (v.type === 'Transfer') { if (!v.fromCentreId) e.fromCentreId = 'Choose the centre sending stock.'; if (!v.toCentreId) e.toCentreId = 'Choose the receiving centre.'; if (v.fromCentreId && v.fromCentreId === v.toCentreId) e.toCentreId = 'Pick a different centre.'; }
        if (v.type === 'Adjustment' && !v.note) e.note = 'Explain the reason for the adjustment.';
        return e;
      },
      onSave: function (v) {
        var p = A.byId('products', v.productId); var q = +v.qty;
        var delta = v.type === 'Stock In' ? q : v.type === 'Stock Out' ? -q : v.type === 'Adjustment' ? q : 0;
        var m = Object.assign({ id: DB.nextId('stockMoves', 'SM', 5), by: A.user().name }, v, { qty: q });
        A.put('stockMoves', m, 'stock', v.type + ' ' + q + ' × ' + p.name);
        if (delta) A.put('products', { id: p.id, stock: p.stock + delta }, 'products');
        return m;
      }, after: done || M.reload });
  }
  A.views.products = M.crud({
    key: 'products', coll: 'products', title: 'Products', single: 'Product', group: 'Inventory', icon: 'package', prefix: 'PRD',
    sub: 'Uniforms, belts, gloves, protective gear and club merchandise.', badge: function () { return M.lowStock().length; },
    search: ['id', 'name', 'sku', 'supplier'],
    cols: function () { return [C.id, C.name('Product'), C.text('sku', 'SKU'), C.text('category', 'Category'), C.money('price', 'Price'), C.money('cost', 'Cost'), C.num('stock', 'Stock'), C.num('minStock', 'Min.'),
      { k: 'level', l: 'Stock level', fmt: function (r) { return A.badge(stockState(r)); }, sort: stockState, text: stockState }, C.text('supplier', 'Supplier'), C.status()]; },
    filters: function () { return [FL.plain('category', 'Category', ['Uniform', 'Belt', 'Gloves', 'Protective Gear', 'Club Merchandise']), { k: 'level', l: 'Stock level', opts: ['In stock', 'Low stock', 'Out of stock'], val: stockState }, FL.status(['Active', 'Discontinued'])]; },
    fields: function () { return [{ k: 'name', l: 'Product name', req: true }, { k: 'sku', l: 'SKU', req: true, unique: true }, { k: 'category', l: 'Category', type: 'select', opts: ['Uniform', 'Belt', 'Gloves', 'Protective Gear', 'Club Merchandise'], req: true },
      { k: 'supplier', l: 'Supplier' }, { k: 'price', l: 'Selling price', type: 'number', min: 0, step: '0.01', req: true }, { k: 'cost', l: 'Cost', type: 'number', min: 0, step: '0.01', req: true },
      { k: 'stock', l: 'Opening stock', type: 'number', min: 0, def: 0, hide: function (r) { return !!r.id; } }, { k: 'minStock', l: 'Minimum stock (alert level)', type: 'number', min: 0, def: 10, req: true }, M.F.status(['Active', 'Discontinued'])]; },
    beforeSave: function (o, old, isNew) { if (M.isSuper()) o.clubId = o.clubId || ''; if (isNew) o.stock = +o.stock || 0; },
    canDelete: function (r) { return D().stockMoves.some(function (m) { return m.productId === r.id; }) ? 'This product has stock history. Set it to Discontinued instead.' : null; },
    top: function (host) { var low = M.lowStock(); if (low.length) host.innerHTML = '<div class="a-warn">' + A.icon('alert') + ' <b>Low stock alert:</b> ' + low.map(function (p) { return esc(p.name) + ' (' + p.stock + ')'; }).join(', ') + (A.can('purchases', 'create') ? ' <a class="a-link" href="#/purchases/new">Create purchase request</a>' : '') + '</div>'; },
    actions: function (r) { return [{ icon: 'layers', label: 'Adjust stock', show: A.can('stock', 'create'), fn: function () { moveStock({ productId: r.id }); } }]; }
  });
  A.views.stock = { title: 'Stock', group: 'Inventory', icon: 'layers', render: function (main) {
    main.innerHTML = A.pageHead('Stock movements', 'Stock in, stock out, adjustments and transfers between centres.', A.can('stock', 'create') ? A.btn('Record movement', 'plus', 'data-add') : '') + '<div class="a-card" data-t></div>';
    var add = $('[data-add]', main); if (add) add.addEventListener('click', function () { moveStock(); });
    M.table($('[data-t]', main), {
      rows: function () { return D().stockMoves; }, dateKey: 'date', defaultSort: { k: 'date', dir: -1 },
      search: function (r) { return r.id + ' ' + A.nameOf('products', r.productId) + ' ' + r.note; },
      filters: [{ k: 'productId', l: 'Product', opts: function () { return D().products.map(function (p) { return [p.id, p.name]; }); } }, FL.plain('type', 'Movement', ['Stock In', 'Stock Out', 'Adjustment', 'Transfer'])],
      cols: [C.id, C.date('date', 'Date'), C.ref('productId', 'Product', 'products'), C.status('type', 'Movement'), C.num('qty', 'Qty'), C.ref('fromCentreId', 'From', 'centres'), C.ref('toCentreId', 'To', 'centres'), C.text('note', 'Note'), C.text('by', 'By')],
      exportName: 'Stock movements', canExport: A.can('stock', 'export')
    });
  } };
  A.views.purchases = M.crud({
    key: 'purchases', coll: 'purchases', title: 'Purchase Requests', navTitle: 'Purchase Requests', single: 'Purchase request', group: 'Inventory', icon: 'sheet', prefix: 'PR',
    sub: 'Request stock → approval → delivery.', noEdit: true, badge: function () { return A.rows('purchases').filter(function (p) { return p.status === 'Pending'; }).length; },
    search: function (r) { return r.id + ' ' + A.nameOf('products', r.productId) + ' ' + r.supplier + ' ' + r.requestedBy; }, dateKey: 'requested', sort: { k: 'requested', dir: -1 },
    cols: function () { return [C.id, C.ref('productId', 'Product', 'products'), C.num('qty', 'Qty'), C.money('unitCost', 'Unit cost'), { k: 'total', l: 'Total', cls: 'num', fmt: function (r) { return A.money(r.qty * r.unitCost); }, sort: function (r) { return r.qty * r.unitCost; }, text: function (r) { return (r.qty * r.unitCost).toFixed(2); } }, C.text('supplier', 'Supplier'), C.text('requestedBy', 'Requested by'), C.date('requested', 'Requested'), C.status(), C.text('note', 'Note')]; },
    filters: function () { return [FL.status(['Pending', 'Approved', 'Rejected'])]; },
    fields: function () { return [{ k: 'productId', l: 'Product', type: 'select', ref: 'products', req: true, refLabel: function (p) { return ' (stock ' + p.stock + ')'; } }, { k: 'qty', l: 'Quantity', type: 'number', min: 1, req: true }, { k: 'unitCost', l: 'Unit cost', type: 'number', min: 0, step: '0.01', req: true }, { k: 'supplier', l: 'Supplier', req: true }, { k: 'note', l: 'Justification', type: 'textarea' }]; },
    formOpen: function (m, form) { var sel = form.productId; sel.addEventListener('change', function () { var p = A.byId('products', sel.value); if (p) { form.unitCost.value = p.cost; form.supplier.value = p.supplier; } }); },
    beforeSave: function (o, old, isNew) { if (isNew) { o.status = 'Pending'; o.requested = A.today(); o.requestedBy = A.user().name; o.clubId = M.isSuper() ? '' : A.user().clubId; } },
    canDelete: function (r) { return r.status === 'Approved' ? 'Approved requests cannot be deleted.' : null; },
    actions: function (r) { return [
      { icon: 'check', label: 'Approve', show: r.status === 'Pending' && A.can('purchases', 'approve'), fn: function () { M.decidePurchase(r, true); M.reload(); A.toast('Approved. A delivery has been created.'); } },
      { icon: 'x', label: 'Reject', danger: true, show: r.status === 'Pending' && A.can('purchases', 'approve'), fn: function () { A.prompt('Reject ' + r.id, 'Reason', { required: true, danger: true, ok: 'Reject' }).then(function (n) { if (n) { M.decidePurchase(r, false, n); M.reload(); } }); } }
    ]; }
  });
  M.decidePurchase = function (r, ok, note) {
    A.put('purchases', { id: r.id, status: ok ? 'Approved' : 'Rejected', note: note || r.note, decidedBy: A.user().name }, 'purchases', (ok ? 'Approved ' : 'Rejected ') + 'purchase ' + r.id);
    if (ok) A.put('deliveries', { id: DB.nextId('deliveries', 'DL'), purchaseId: r.id, productId: r.productId, qty: r.qty, courier: '', tracking: '', eta: DB.iso(DB.addDays(new Date(), 7)), status: 'Pending', toCentreId: '' }, 'deliveries', 'Delivery created for ' + r.id);
  };
  A.views.deliveries = M.crud({
    key: 'deliveries', coll: 'deliveries', title: 'Deliveries', single: 'Delivery', group: 'Inventory', icon: 'truck', prefix: 'DL', noCreate: true, noDelete: true,
    sub: 'Track approved purchases. Marking a delivery as Delivered adds the stock automatically.',
    search: ['id', 'tracking', 'courier', 'purchaseId'], dateKey: 'eta', dateLabel: 'ETA',
    cols: function () { return [C.id, C.text('purchaseId', 'Purchase'), C.ref('productId', 'Product', 'products'), C.num('qty', 'Qty'), C.text('courier', 'Courier'), C.text('tracking', 'Tracking no.'), C.date('eta', 'ETA'), C.ref('toCentreId', 'Deliver to', 'centres'), C.status()]; },
    filters: function () { return [FL.status(['Pending', 'In Transit', 'Delivered'])]; },
    fields: function () { return [{ k: 'courier', l: 'Courier', type: 'select', opts: ['J&T Express', 'Pos Laju', 'Ninja Van', 'DHL', 'Supplier van'] }, { k: 'tracking', l: 'Tracking number' }, { k: 'eta', l: 'ETA', type: 'date', req: true }, { k: 'toCentreId', l: 'Deliver to', type: 'select', ref: 'centres' }]; },
    actions: function (r) { return [
      { icon: 'truck', label: 'Mark in transit', show: r.status === 'Pending' && A.can('deliveries', 'edit'), fn: function () { if (!r.tracking) { A.toast('Add the courier and tracking number first (Edit).', 'error'); return; } A.put('deliveries', { id: r.id, status: 'In Transit' }, 'deliveries'); M.reload(); } },
      { icon: 'checkcircle', label: 'Mark delivered', show: r.status !== 'Delivered' && A.can('deliveries', 'edit'), fn: function () {
        A.confirm('Confirm ' + r.qty + ' × ' + A.nameOf('products', r.productId) + ' received? Stock will increase.').then(function (ok) {
          if (!ok) return; var p = A.byId('products', r.productId);
          A.put('deliveries', { id: r.id, status: 'Delivered', deliveredOn: A.today() }, 'deliveries');
          A.put('stockMoves', { id: DB.nextId('stockMoves', 'SM', 5), productId: r.productId, type: 'Stock In', qty: r.qty, date: A.today(), fromCentreId: '', toCentreId: r.toCentreId, note: 'Delivery ' + r.id, by: A.user().name }, 'stock');
          if (p) A.put('products', { id: p.id, stock: p.stock + r.qty }, 'products');
          A.toast('Stock updated.'); M.reload();
        });
      } }
    ]; }
  });
})();
