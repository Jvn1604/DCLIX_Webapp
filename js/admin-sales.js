/* ==========================================================
   D-Clix Admin — Sales (website signups)
   leads · subscriptions (plan invoices / Billplz) · email log
   Leads and subscriptions are created by the website signup
   (api/signup.php, api/checkout.php) and updated automatically
   when Billplz confirms a payment.
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, M = A.M, C = M.C, FL = M.FL, esc = A.esc, $ = A.$;
  function D() { return DB.data; }
  var LEAD_STATUSES = ['New', 'Payment Pending', 'Payment Failed', 'Paid', 'Contacted', 'Follow-up', 'Converted', 'Lost'];
  var PLAN_NAMES = { basic: 'Basic Plan', standard: 'Standard Plan', premium: 'Premium Plan' };
  function digits(p) { return String(p || '').replace(/\D/g, ''); }
  function waLink(p) { var d = digits(p); if (d.indexOf('0') === 0) d = '6' + d; return d.length >= 9 ? 'https://wa.me/' + d : ''; }

  /* ======================================================
     LEADS
     ====================================================== */
  A.views.leads = M.crud({
    key: 'leads', coll: 'leads', title: 'Leads', single: 'Lead', group: 'Sales', icon: 'userplus', prefix: 'LD',
    sub: 'Every club that registers on the website, with payment status, for the sales team to follow up.',
    addLabel: 'Add lead', sort: { k: 'createdAt', dir: -1 }, dateKey: 'createdAt', dateLabel: 'Created',
    badge: function () { return A.rows('leads').filter(function (l) { return ['New', 'Payment Pending', 'Payment Failed'].indexOf(l.status) >= 0; }).length; },
    search: function (r) { return [r.id, r.clubName, r.clubCode, r.contactName, r.email, r.phone].join(' '); }, searchPlaceholder: 'Search club, contact, email, phone…',
    cols: function () { return [C.id, C.calc('created', 'Created', function (r) { return A.datetime(r.createdAt); }), { k: 'clubName', l: 'Club', fmt: function (r) { return '<b>' + esc(r.clubName) + '</b>' + (r.clubCode ? ' <span class="muted mono">' + esc(r.clubCode) + '</span>' : ''); }, text: function (r) { return r.clubName; } },
      C.text('contactName', 'Contact'), C.text('email', 'Email'), C.text('phone', 'Phone'), C.text('sport', 'Sport'),
      C.calc('plan', 'Plan', function (r) { return (r.planName || PLAN_NAMES[r.plan] || '') + (r.billing ? ' · ' + r.billing : ''); }), C.money('amount', 'Amount'), C.text('source', 'Source'),
      { k: 'stage', l: 'Progress', fmt: function (r) { return M.stageChips(r); }, sort: function (r) { return M.leadStage(r).n; }, text: function (r) { return M.leadStage(r).label; } },
      C.status(), C.date('followUp', 'Follow-up')]; },
    filters: function () { return [FL.status(LEAD_STATUSES), FL.plain('plan', 'Plan', [['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']]), FL.plain('billing', 'Billing', [['monthly', 'Monthly'], ['yearly', 'Yearly']]), FL.plain('source', 'Source'), FL.plain('sport', 'Sport')]; },
    fields: function () { return [
      { k: 'clubName', l: 'Club name', req: true }, { k: 'contactName', l: 'Contact person' },
      { k: 'email', l: 'Email', type: 'email', req: true }, { k: 'phone', l: 'Phone / WhatsApp', type: 'tel' },
      { k: 'sport', l: 'Sport', type: 'select', opts: DB.SPORTS }, { k: 'plan', l: 'Interested plan', type: 'select', opts: [['basic', 'Basic'], ['standard', 'Standard'], ['premium', 'Premium']] },
      { k: 'billing', l: 'Billing', type: 'select', opts: [['monthly', 'Monthly'], ['yearly', 'Yearly']] }, { k: 'status', l: 'Status', type: 'select', opts: LEAD_STATUSES, req: true, def: 'New' },
      { k: 'assignedTo', l: 'Assigned to', type: 'select', opts: function () { return D().users.filter(function (u) { return u.role === 'superadmin' && u.status === 'Active'; }).map(function (u) { return [u.name, u.name]; }); } },
      { k: 'followUp', l: 'Next follow-up', type: 'date' }, { k: 'notes', l: 'Notes', type: 'textarea', rows: 4 }
    ]; },
    beforeSave: function (o, old, isNew) {
      if (isNew) { o.createdAt = new Date().toISOString(); o.source = 'Manual'; o.clubId = ''; o.amount = 0; }
      o.planName = PLAN_NAMES[o.plan] || o.planName || '';
    },
    canDelete: function (r) { return r.clubId ? 'This lead created a club account. Mark it as Lost instead of deleting it.' : null; },
    actions: function (r) { return [
      { icon: 'phone', label: 'WhatsApp', show: !!waLink(r.phone), fn: function () { window.open(waLink(r.phone), '_blank', 'noopener'); } },
      { icon: 'mail', label: 'Email', show: !!r.email, fn: function () { location.href = 'mailto:' + encodeURIComponent(r.email) + '?subject=' + encodeURIComponent('D-Clix registration — ' + r.clubName); } },
      { icon: 'building', label: 'Open club', show: !!r.clubId && A.can('clubs'), fn: function () { A.go('#/clubs/' + r.clubId); } },
      { icon: 'check', label: 'Mark contacted', show: A.can('leads', 'edit') && ['Paid', 'Converted', 'Lost', 'Contacted'].indexOf(r.status) < 0, fn: function () { A.put('leads', { id: r.id, status: 'Contacted' }, 'leads', 'Contacted ' + r.clubName); M.reload(); } }
    ]; },
    detail: function (main, r, view) { M.leadDetail(main, r, view); }
  });

  /* ======================================================
     SUBSCRIPTIONS (plan invoices + Billplz payments)
     ====================================================== */
  function subDoc(s) {
    var club = A.byId('clubs', s.clubId) || {}, b = s.billTo || {};
    var paid = s.status === 'Paid';
    return '<h1>' + (paid ? 'OFFICIAL RECEIPT' : 'INVOICE') + '</h1><table style="border:0;margin-top:0"><tr><td style="border:0;padding-left:0"><b>Raig Technologies (M) Sdn Bhd</b><br>D-Clix Club Management System</td><td style="border:0" class="right">' +
      (paid ? 'Receipt no: <b>' + esc(s.receiptNo) + '</b><br>' : '') + 'Invoice no: <b>' + esc(s.invoiceNo) + '</b><br>Date: ' + A.date(paid ? s.paidAt : s.createdAt) + '</td></tr></table>' +
      '<div class="box"><b>Bill to</b><br>' + esc(b.company || club.name || '') + '<br>' + esc([b.firstName, b.lastName].filter(Boolean).join(' ')) + '<br>' + esc([b.address, b.zip, b.city, b.country].filter(Boolean).join(', ')) + '<br>' + esc(b.email || '') + '</div>' +
      '<table><thead><tr><th>Description</th><th class="right">Amount</th></tr></thead><tbody><tr><td>' + esc(s.planName + ' — ' + s.billing + ' subscription' + (s.periodStart ? ' (' + A.date(s.periodStart) + ' – ' + A.date(s.periodEnd) + ')' : '')) + '</td><td class="right">' + A.money(s.price) + '</td></tr>' +
      '<tr><td>Payment gateway fee</td><td class="right">' + A.money(s.fee) + '</td></tr><tr class="tot"><td>Total</td><td class="right">' + A.money(s.total) + '</td></tr>' +
      '<tr class="tot"><td>' + (paid ? 'Paid' : 'Balance due') + '</td><td class="right">' + A.money(paid ? s.paidAmount || s.total : s.total) + '</td></tr></tbody></table>' +
      '<p style="margin-top:14px">Status: <b>' + esc(s.status) + '</b>' + (s.method ? ' · ' + esc(s.method) : '') + (s.txnId ? ' · Bill ' + esc(s.txnId) : '') + '</p><p class="muted" style="margin-top:24px">This is a computer-generated document. No signature is required.</p>';
  }
  M.showSubscription = function (s) {
    A.modal({ title: (s.status === 'Paid' ? 'Receipt ' + s.receiptNo : 'Invoice ' + s.invoiceNo), size: 'lg', body: '<div class="a-doc">' + subDoc(s) + '</div>',
      actions: [{ label: 'Close', cls: 'ghost' }].concat(s.billUrl && s.status !== 'Paid' ? [{ label: 'Copy payment link', cls: 'ghost', icon: 'copy', onClick: function () { try { navigator.clipboard.writeText(s.billUrl); A.toast('Payment link copied.'); } catch (e) { A.toast(s.billUrl, 'info'); } return false; } }] : [])
        .concat([{ label: 'Print / PDF', cls: 'primary', icon: 'printer', onClick: function () { A.printHTML(s.receiptNo || s.invoiceNo, subDoc(s)); return false; } }]) });
  };
  A.views.subscriptions = M.crud({
    key: 'subscriptions', coll: 'subscriptions', title: 'Subscriptions', single: 'Subscription', group: 'Sales', icon: 'card', prefix: 'SUB',
    sub: 'D-Clix plan invoices and Billplz payments. Paid invoices activate the club automatically.', noCreate: true, noEdit: true, noDelete: true,
    sort: { k: 'createdAt', dir: -1 }, dateKey: 'createdAt', dateLabel: 'Created',
    search: function (r) { return [r.id, r.invoiceNo, r.receiptNo, r.txnId, A.nameOf('clubs', r.clubId)].join(' '); }, searchPlaceholder: 'Search invoice, receipt, Billplz bill, club…',
    cols: function () { return [C.text('invoiceNo', 'Invoice'), C.calc('created', 'Created', function (r) { return A.datetime(r.createdAt); }), C.ref('clubId', 'Club', 'clubs'), C.text('planName', 'Plan'), C.text('billing', 'Billing'), C.money('total', 'Total'), C.status(),
      C.calc('paid', 'Paid at', function (r) { return r.paidAt ? A.datetime(r.paidAt) : ''; }), C.text('receiptNo', 'Receipt'), C.calc('period', 'Period', function (r) { return r.periodStart ? A.date(r.periodStart) + ' – ' + A.date(r.periodEnd) : ''; }), C.text('txnId', 'Billplz bill')]; },
    filters: function () { return [FL.status(['Pending', 'Paid', 'Payment Failed']), FL.plain('billing', 'Billing', [['monthly', 'Monthly'], ['yearly', 'Yearly']]), FL.plain('planName', 'Plan')].concat(FL.club()); },
    actions: function (r) { return [{ icon: 'receipt', label: r.status === 'Paid' ? 'View receipt' : 'View invoice', fn: function () { M.showSubscription(r); } }, { icon: 'userplus', label: 'Open lead', show: !!r.leadId && A.can('leads'), fn: function () { A.go('#/leads/' + r.leadId); } }]; },
    top: function (host) {
      var month = A.today().slice(0, 7), all = A.rows('subscriptions');
      var paidM = all.filter(function (s) { return s.status === 'Paid' && String(s.paidAt).slice(0, 7) === month; });
      var exp = A.rows('clubs').filter(function (c) { return c.status === 'Active' && c.subEnd && c.subEnd <= DB.iso(DB.addDays(new Date(), 30)); });
      host.innerHTML = '<div class="a-stats">' + A.statCard('Paid this month', A.money(A.sum(paidM, 'total')), 'wallet', paidM.length + ' payments') +
        A.statCard('Waiting for payment', A.num(all.filter(function (s) { return s.status === 'Pending'; }).length), 'clock') +
        A.statCard('Failed / cancelled', A.num(all.filter(function (s) { return s.status === 'Payment Failed'; }).length), 'alert') +
        A.statCard('Renewals due (30 days)', A.num(exp.length), 'calendar', exp.slice(0, 2).map(function (c) { return esc(c.name); }).join(', ')) + '</div>';
    }
  });

  /* ======================================================
     EMAIL LOG
     ====================================================== */
  M.showEmail = function (e) {
    var m = A.modal({ title: e.subject, size: 'lg', body: A.dl([['To', esc(e.to)], ['Type', esc(e.kind)], ['Status', A.badge(e.status) + (e.error ? ' <span class="bad">' + esc(e.error) + '</span>' : '')], ['Created', A.datetime(e.createdAt)]]) + '<div class="a-email-frame"><p class="muted">Loading…</p></div>', actions: [{ label: 'Close', cls: 'ghost' }] });
    if (DB.mode !== 'api') { $('.a-email-frame', m.el).innerHTML = '<p class="muted">Email content is only available when connected to the server.</p>'; return; }
    window.dclixApi('data.php?action=email&id=' + encodeURIComponent(e.id), { token: DB.token() }).then(function (res) {
      var f = document.createElement('iframe'); f.setAttribute('sandbox', ''); f.setAttribute('title', 'Email preview'); f.srcdoc = res.html;
      var box = $('.a-email-frame', m.el); box.innerHTML = ''; box.appendChild(f);
    }, function (err) { $('.a-email-frame', m.el).innerHTML = '<p class="bad">' + esc(err.message) + '</p>'; });
  };
  A.views.emails = { title: 'Email Log', group: 'Administration', icon: 'mail', render: function (main) {
    var mode = (D().server || {}).mail;
    main.innerHTML = A.pageHead('Email Log', 'Every email the system sends: signup confirmations, welcome emails, receipts, sales alerts, codes.') +
      (DB.mode !== 'api' ? '<p class="a-warn">' + A.icon('info') + ' Emails are only recorded when the portal is connected to the server.</p>'
        : mode !== 'smtp' ? '<p class="a-warn">' + A.icon('info') + ' Test setup: emails are saved here but not sent. Set <code>mail.driver</code> to <code>smtp</code> in api/config.php to send them for real.</p>' : '') +
      '<div class="a-card" data-t></div>';
    M.table($('[data-t]', main), { rows: function () { return D().emails || []; }, dateKey: 'createdAt', defaultSort: { k: 'createdAt', dir: -1 },
      search: ['to', 'subject', 'kind', 'relatedId'], filters: [FL.status(['sent', 'logged', 'failed', 'queued']), FL.plain('kind', 'Type')],
      cols: [C.calc('at', 'Date', function (x) { return A.datetime(x.createdAt); }), C.text('kind', 'Type'), C.text('to', 'To'), C.text('subject', 'Subject'), C.status(), C.text('relatedId', 'Related')],
      onRow: M.showEmail, exportName: 'Email log', canExport: A.can('emails', 'export'), empty: 'No emails yet.' });
  } };
})();
