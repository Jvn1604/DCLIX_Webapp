/* ==========================================================
   Built-in TEST API for UAT (runs in the browser).
   Used automatically when the site has no real server, e.g. on
   GitHub Pages while PRODUCTION_API in js/shared/config.js is
   empty. It answers the same requests as the PHP API in api/:
     public.php · signup.php · checkout.php · contact.php
   and saves everything into the admin portal's demo data in this
   browser (localStorage), so new signups, invoices, payments and
   emails appear in the admin (log in on the same browser).
   Payments go to arena/mock-gateway.html (Pay / Cancel, no money).
   Delete nothing here when going live: set PRODUCTION_API instead.
   ========================================================== */
(function () {
  'use strict';
  var root = (window.DCLIX_CONFIG && window.DCLIX_CONFIG.siteRoot) || '';
  var PLANS = { fee: 1.2, items: [
    { id: 'basic', name: 'Basic Plan', monthly: 100, yearly: 1000 },
    { id: 'standard', name: 'Standard Plan', monthly: 150, yearly: 1500 },
    { id: 'premium', name: 'Premium Plan', monthly: 200, yearly: 2000 }] };
  var SALES = 'sales@example.com';

  function DB() { var d = window.ADMIN_DB; if (!d.data) d.load(); var x = d.data; ['leads', 'subscriptions', 'emails', 'bills', 'signupTokens'].forEach(function (k) { if (!x[k]) x[k] = []; }); return d; }
  function now() { return new Date().toISOString(); }
  function today() { return window.ADMIN_DB.iso(new Date()); }
  function err(status, message, extra) { var e = new Error(message); e.status = status; e.data = Object.assign({ error: message }, extra || {}); return e; }
  function token() { var a = new Uint8Array(24); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function str(v, max) { return typeof v === 'string' || typeof v === 'number' ? String(v).trim().slice(0, max || 255) : ''; }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 190; }
  function pwProblem(p) { return p.length < 8 || !/[A-Z]/.test(p) || !/[a-z]/.test(p) || !/\d/.test(p) ? 'Use at least 8 characters with upper-case, lower-case and a number.' : null; }
  function plan(id) { return PLANS.items.filter(function (p) { return p.id === id; })[0] || null; }
  function quote(id, billing) { var p = plan(id); if (!p || ['monthly', 'yearly'].indexOf(billing) < 0) return null; return { plan: p, billing: billing, price: p[billing], fee: PLANS.fee, total: Math.round((p[billing] + PLANS.fee) * 100) / 100 }; }
  function docNo(prefix, id) { return prefix + '-' + new Date().getFullYear() + '-' + ('00000' + String(id).replace(/\D/g, '')).slice(-5); }
  function money(n) { return 'RM ' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function audit(action, module, id, summary) { var d = DB().data; d.audit.unshift({ id: 'AU' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: now(), user: 'System (test API)', userId: '', action: action, module: module, recordId: id, changes: [], summary: summary, ip: 'browser test' }); }
  function save() { DB().save(); }

  /* ---------- emails (saved to the Email Log, never sent) ---------- */
  function layout(title, intro, rows, button, outro) {
    var t = rows && rows.length ? '<table style="width:100%;border-collapse:collapse;margin:16px 0">' + rows.map(function (r) { return '<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;width:40%;font-weight:600">' + esc(r[0]) + '</td><td style="padding:8px 10px;border:1px solid #e5e7eb">' + esc(r[1]) + '</td></tr>'; }).join('') + '</table>' : '';
    var b = button ? '<p style="margin:22px 0"><a href="' + esc(button[1]) + '" style="background:#de9836;color:#1a1208;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;display:inline-block">' + esc(button[0]) + '</a></p>' : '';
    return '<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111"><div style="max-width:600px;margin:0 auto;padding:24px"><div style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb"><div style="background:#0e0e10;color:#fff;padding:18px 24px;font-size:20px;font-weight:700">D-<span style="color:#de9836">CLIX</span></div><div style="padding:24px"><h1 style="font-size:20px;margin:0 0 12px">' + esc(title) + '</h1><p style="line-height:1.6;margin:0">' + intro + '</p>' + t + b + (outro ? '<p style="line-height:1.6;color:#4b5563">' + outro + '</p>' : '') + '</div></div><p style="text-align:center;color:#6b7280;font-size:12px;margin-top:14px">Raig Technologies (M) Sdn Bhd · D-Clix Club Management System · TEST EMAIL (not sent)</p></div></body></html>';
  }
  function mail(to, subject, html, kind, related) {
    var d = DB().data;
    d.emails.unshift({ id: 'EM' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), kind: kind, to: to, subject: subject, status: 'logged', error: '', relatedId: related || '', createdAt: now(), sentAt: '', html: html });
  }

  /* ---------- endpoints ---------- */
  function signup(b) {
    var d = DB().data, A = window.ADMIN_DB;
    var f = { clubCode: str(b.clubCode, 30).toUpperCase(), clubName: str(b.clubName, 120), headInstructor: str(b.headInstructor, 120), sport: str(b.sport, 40), sportName: str(b.sportName, 60),
      address1: str(b.address1), address2: str(b.address2), state: str(b.state, 60), country: str(b.country, 60), phoneCode: str(b.phoneCode, 30), whatsapp: str(b.whatsapp, 30), email: str(b.email, 190).toLowerCase(), username: str(b.username, 60), branch: str(b.branch, 80), regNo: str(b.regNo, 60) };
    var pw = typeof b.password === 'string' ? b.password : '';
    var e = {};
    if (!f.clubName) e.clubName = 'Club name is required.';
    if (!f.regNo) e.regNo = 'Registration number is required (SSM / ROS (JPPM) / PJS).';
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(f.username)) e.username = 'Use 3–30 letters, numbers, . _ or -.';
    if (!f.clubCode) e.clubCode = 'Club code is required.'; else if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(f.clubCode)) e.clubCode = 'Use 2–30 letters, numbers, - or _ (no spaces).';
    if (!validEmail(f.email)) e.email = 'Please enter a valid email address.';
    var pp = pwProblem(pw); if (pp) e.password = pp;
    if (f.whatsapp && !/^[0-9 \-]{6,15}$/.test(f.whatsapp)) e.whatsapp = 'Enter the WhatsApp number using digits only, e.g. 123456789.';
    var p = plan(str(b.plan, 20)) || plan('basic'), billing = b.billing === 'yearly' ? 'yearly' : 'monthly', q = quote(p.id, billing);
    var existing = d.users.filter(function (u) { return u.email.toLowerCase() === f.email; })[0], resume = null;
    if (existing) {
      var lead0 = d.leads.filter(function (l) { return l.userId === existing.id; })[0];
      if (existing.status === 'Pending Payment' && lead0 && A.hashPassword(pw, existing.salt) === existing.pwHash) resume = lead0;
      else e.email = 'An account with this email already exists. Please log in, or use a different email.';
    }
    if (!e.clubCode && d.clubs.some(function (c) { return String(c.clubCode || '').toUpperCase() === f.clubCode && c.id !== (resume && resume.clubId); })) e.clubCode = 'This club code is already taken. Please choose another.';
    if (Object.keys(e).length) throw err(422, 'Please fix the highlighted fields.', { fields: e });

    var phone = f.whatsapp ? (f.phoneCode.replace(/\s*\(.*\)$/, '') + ' ' + f.whatsapp).trim() : '';
    var address = f.address1 + (f.address2 ? ', ' + f.address2 : '');
    var sportName = f.sportName || f.sport;
    var clubId = resume ? resume.clubId : A.nextId('clubs', 'CLB');
    var club = d.clubs.filter(function (c) { return c.id === clubId; })[0];
    if (!club) { club = { id: clubId, createdAt: today(), regNo: '', type: 'Private Club', monthlyFee: 100, subStart: '', subEnd: '', source: 'Website signup' }; d.clubs.unshift(club); }
    Object.assign(club, { name: f.clubName, clubCode: f.clubCode, owner: f.headInstructor, phone: phone, email: f.email, username: f.username, branch: f.branch, regNo: f.regNo, address: address, state: f.state, country: f.country, sport: sportName, plan: p.name.split(' ')[0], billing: billing, status: 'Pending Payment' });
    var user = existing;
    if (!user) {
      var salt = A.newSalt();
      user = { id: A.nextId('users', 'USR'), name: f.headInstructor || f.clubName + ' Admin', email: f.email, phone: phone, role: 'clubadmin', clubId: clubId, centreId: '', status: 'Pending Payment', lastLogin: '', salt: salt, pwHash: A.hashPassword(pw, salt), twoFactor: false, createdAt: today() };
      d.users.push(user);
    }
    var lead = resume || { id: A.nextId('leads', 'LD'), createdAt: now(), source: 'Website', notes: '', followUp: '', assignedTo: '' };
    Object.assign(lead, { status: 'Payment Pending', clubName: f.clubName, clubCode: f.clubCode, contactName: f.headInstructor, email: f.email, phone: phone, sport: sportName, address: address, state: f.state, country: f.country,
      plan: p.id, planName: p.name, billing: billing, amount: q.total, clubId: clubId, userId: user.id, ip: 'browser test' });
    if (!resume) d.leads.unshift(lead);
    var t = token();
    d.signupTokens.push({ token: t, leadId: lead.id, expires: Date.now() + 7 * 864e5 });
    audit(resume ? 'Update' : 'Create', 'leads', lead.id, (resume ? 'Signup resumed: ' : 'Website signup: ') + f.clubName + ' (' + f.email + ')');
    if (!resume) {
      mail(SALES, 'New signup: ' + f.clubName + ' (payment pending)', layout('New club signup', 'A club just registered on the website and is being sent to payment.', [['Club', f.clubName], ['Contact email', f.email], ['Phone', phone], ['Sport', sportName], ['Plan', p.name + ' (' + billing + ')'], ['Lead ID', lead.id]], ['Open in admin', root + 'admin/index.html#/leads']), 'sales_signup', lead.id);
      mail(f.email, 'Complete your D-Clix registration', layout('Thanks for registering, ' + f.clubName, 'We have saved your club details. Your account will be activated as soon as payment is completed.', [['Plan', p.name + ' (' + billing + ')'], ['Login email', f.email]], ['Complete payment', root + 'arena/payment.html?t=' + t], 'If you have already paid, you can ignore this email.'), 'client_signup', lead.id);
    }
    save();
    return { ok: true, token: t, leadId: lead.id, resumed: !!resume };
  }

  function leadFromToken(t) {
    var d = DB().data, row = d.signupTokens.filter(function (x) { return x.token === t; })[0];
    if (!row || row.expires < Date.now()) throw err(410, 'This payment link has expired. Please register again or contact D-Clix.', { reason: 'token' });
    var lead = d.leads.filter(function (l) { return l.id === row.leadId; })[0];
    if (!lead) throw err(404, 'Registration not found. Please register again.', { reason: 'token' });
    if (lead.status === 'Paid') throw err(409, 'This registration is already paid. You can log in now.', { reason: 'paid' });
    return lead;
  }
  function checkout(b) {
    var d = DB().data, A = window.ADMIN_DB, lead = leadFromToken(str(b.token, 200));
    if ((b.action || 'load') === 'load') return { lead: { clubName: lead.clubName, clubCode: lead.clubCode, email: lead.email, phone: lead.phone, plan: lead.plan, billing: lead.billing, billingInfo: lead.billingInfo || null, status: lead.status }, plans: PLANS };
    if (b.action !== 'pay') throw err(404, 'Unknown action.');
    var q = quote(str(b.plan, 20), str(b.billing, 10));
    if (!q) throw err(422, 'Please choose a plan.', { fields: { plan: 'Please choose a plan.' } });
    var bi = b.billingInfo || {}, info = {};
    ['company', 'firstName', 'lastName', 'address', 'zip', 'city', 'country', 'email', 'phone'].forEach(function (k) { info[k] = str(bi[k], 190); });
    info.email = info.email.toLowerCase();
    var e = {};
    [['firstName', 'First name'], ['lastName', 'Last name'], ['address', 'Address'], ['zip', 'Zip'], ['city', 'City']].forEach(function (x) { if (!info[x[0]]) e[x[0]] = x[1] + ' is required.'; });
    if (!validEmail(info.email)) e.email = 'Please enter a valid email address.';
    if (info.phone && !/^\+?[0-9 \-]{7,20}$/.test(info.phone)) e.phone = 'Please enter a valid phone number.';
    if (!b.agreeTerms) e.agreeTerms = 'Please read and agree to the Terms & Conditions and Privacy Policy to continue.';
    if (Object.keys(e).length) throw err(422, 'Please fix the highlighted fields.', { fields: e });
    Object.assign(lead, { plan: q.plan.id, planName: q.plan.name, billing: q.billing, amount: q.total, billingInfo: info, status: 'Payment Pending', termsAcceptedAt: now(), termsAcceptedIp: 'browser test' });
    var club = d.clubs.filter(function (c) { return c.id === lead.clubId; })[0];
    if (club && club.status !== 'Active') { club.plan = q.plan.name.split(' ')[0]; club.billing = q.billing; }
    var sub = d.subscriptions.filter(function (s) { return s.leadId === lead.id && s.status !== 'Paid'; })[0];
    if (!sub) { var id = A.nextId('subscriptions', 'SUB'); sub = { id: id, invoiceNo: docNo('DCX', id), createdAt: now(), leadId: lead.id, clubId: lead.clubId, receiptNo: '', kind: 'New signup' }; d.subscriptions.unshift(sub); }
    Object.assign(sub, { plan: q.plan.id, planName: q.plan.name, billing: q.billing, price: q.price, fee: q.fee, total: q.total, status: 'Pending', billTo: info });
    var bill = { id: 'mock_' + token().slice(0, 12), subscriptionId: sub.id, leadId: lead.id, clubId: lead.clubId, amount: q.total, state: 'due', paid: false, gateway: 'mock', createdAt: now(), paidAt: '', processedAt: '' };
    d.bills.unshift(bill);
    sub.billId = bill.id; sub.billUrl = root + 'arena/mock-gateway.html?bill=' + bill.id;
    save();
    return { ok: true, url: sub.billUrl, invoiceNo: sub.invoiceNo };
  }

  function contact(b) {
    var d = DB().data, A = window.ADMIN_DB;
    var f = { name: str(b.name, 120), phone: str(b.phone, 30), email: str(b.email, 190).toLowerCase(), club: str(b.club, 120), inquiries: str(b.inquiries, 2000) };
    if (str(b.website, 100)) return { ok: true };
    var e = {};
    if (!f.name) e.name = 'Please enter your name.';
    if (!/^\+?[0-9 \-]{7,20}$/.test(f.phone)) e.phone = 'Please enter a valid phone number.';
    if (!validEmail(f.email)) e.email = 'Please enter a valid email address.';
    if (!f.club) e.club = 'Please enter your club name.';
    if (!f.inquiries) e.inquiries = 'Please tell us how we can help.';
    if (Object.keys(e).length) throw err(422, 'Please fix the highlighted fields.', { fields: e });
    var id = A.nextId('leads', 'LD');
    d.leads.unshift({ id: id, createdAt: now(), source: 'Contact form', status: 'New', clubName: f.club, clubCode: '', contactName: f.name, email: f.email, phone: f.phone, sport: '', plan: '', planName: '', billing: '', amount: 0, clubId: '', userId: '', notes: 'Enquiry: ' + f.inquiries, followUp: '', assignedTo: '', ip: 'browser test' });
    audit('Create', 'leads', id, 'Contact form enquiry from ' + f.name + ' (' + f.club + ')');
    mail(SALES, 'New enquiry: ' + f.club + ' — ' + f.name, layout('New website enquiry', 'Someone filled in the contact form on the home page.', [['Name', f.name], ['Club', f.club], ['Phone', f.phone], ['Email', f.email], ['Enquiry', f.inquiries]], ['Open in admin', root + 'admin/index.html#/leads/' + id]), 'sales_enquiry', id);
    mail(f.email, 'We received your enquiry — D-Clix', layout('Thanks, ' + f.name + '!', 'We have received your enquiry about <b>' + esc(f.club) + '</b>. A D-Clix expert will contact you soon, usually within one working day.', [], ['See our plans', root + 'pricing.html'], 'Need help sooner? Call us at +603-7804 1412.'), 'client_enquiry', id);
    save();
    return { ok: true };
  }

  /* ---------- test payment gateway (arena/mock-gateway.html) ---------- */
  function billInfo(billId) {
    var d = DB().data, bill = d.bills.filter(function (x) { return x.id === billId; })[0];
    if (!bill) return null;
    return { bill: bill, sub: d.subscriptions.filter(function (s) { return s.id === bill.subscriptionId; })[0], lead: d.leads.filter(function (l) { return l.id === bill.leadId; })[0] };
  }
  function pay(billId, ok) {
    var d = DB().data, A = window.ADMIN_DB, x = billInfo(billId);
    if (!x) throw err(404, 'Unknown bill.');
    var bill = x.bill, sub = x.sub, lead = x.lead, club = d.clubs.filter(function (c) { return c.id === bill.clubId; })[0];
    if (bill.paid) return { status: 'paid', ref: sub.id };
    if (!ok) {
      bill.state = 'due';
      if (sub.status !== 'Paid') sub.status = 'Payment Failed';
      if (lead.status !== 'Paid') lead.status = 'Payment Failed';
      save(); return { status: 'failed', ref: sub.id };
    }
    bill.paid = true; bill.state = 'paid'; bill.paidAt = now(); bill.processedAt = now();
    var start = club.status === 'Active' && club.subEnd && club.subEnd >= today() ? A.iso(A.addDays(new Date(club.subEnd), 1)) : today();
    var endD = sub.billing === 'yearly' ? A.addMonths(new Date(start), 12) : A.addMonths(new Date(start), 1);
    var end = A.iso(A.addDays(endD, -1));
    Object.assign(sub, { status: 'Paid', paidAt: now(), paidAmount: sub.total, receiptNo: docNo('DCX-R', sub.id), method: 'Test payment', txnId: bill.id, periodStart: start, periodEnd: end });
    Object.assign(club, { status: 'Active', plan: sub.planName.split(' ')[0], billing: sub.billing, subEnd: end });
    if (!club.subStart || club.subStart > start) club.subStart = start;
    if (!d.centres.some(function (c) { return c.clubId === club.id; })) {
      d.centres.unshift({ id: A.nextId('centres', 'TC'), name: club.name + ' — Main Centre', clubId: club.id, address: club.address || '', phone: club.phone || '', email: club.email || '', hours: '', capacity: 100, status: 'Active', createdAt: today() });
    }
    d.users.forEach(function (u) { if (u.id === lead.userId && u.status === 'Pending Payment') u.status = 'Active'; });
    Object.assign(lead, { status: 'Paid', paidAt: now(), subscriptionId: sub.id });
    audit('Update', 'subscriptions', sub.id, 'Payment received for ' + club.name + ' (' + money(sub.total) + ', bill ' + bill.id + ')');
    var login = root + 'admin/login.html';
    mail(lead.email, 'Welcome to D-Clix — your club is active', layout('Welcome to D-Clix!', 'Your payment was successful and <b>' + esc(club.name) + '</b> is now active. Log in with the email and password you chose during registration.', [['Login email', lead.email], ['Plan', sub.planName + ' (' + sub.billing + ')'], ['Active until', end.split('-').reverse().join('/')]], ['Log in to D-Clix', login], 'Next steps: add your training centres, instructors and students.'), 'client_welcome', lead.id);
    mail(lead.email, 'Receipt ' + sub.receiptNo + ' — D-Clix subscription', layout('Payment receipt', 'Thank you for your payment.', [['Receipt no.', sub.receiptNo], ['Invoice no.', sub.invoiceNo], ['Club', club.name], ['Plan', sub.planName + ' (' + sub.billing + ')'], ['Subscription', money(sub.price)], ['Gateway fee', money(sub.fee)], ['Total paid', money(sub.total)], ['Payment method', sub.method], ['Transaction ID', sub.txnId]], null, 'This is a computer-generated receipt. No signature is required.'), 'client_receipt', sub.id);
    mail(SALES, 'Payment received: ' + club.name + ' — ' + money(sub.total), layout('Payment received', 'A new club has paid and been activated automatically.', [['Club', club.name + ' (' + club.id + ')'], ['Plan', sub.planName + ' (' + sub.billing + ')'], ['Amount', money(sub.total)], ['Bill', bill.id], ['Contact', lead.email + ' · ' + lead.phone]], ['Open in admin', root + 'admin/index.html#/leads']), 'sales_paid', sub.id);
    save();
    return { status: 'paid', ref: sub.id };
  }

  /* ---------- router: same paths as the PHP API ---------- */
  function handle(path, opts) {
    var p = path.split('?')[0], qs = new URLSearchParams(path.split('?')[1] || ''), body = (opts && opts.body) || {};
    switch (p) {
      case 'public.php': return qs.get('action') === 'plans' ? PLANS : { ok: true, payments: 'mock', mock: true, time: now() };
      case 'signup.php': return signup(body);
      case 'checkout.php': return checkout(body);
      case 'contact.php': return contact(body);
    }
    throw err(404, 'This feature needs the real server (test mode supports signup, payment and the contact form).');
  }
  window.DCLIX_MOCK = {
    handle: function (path, opts) { return new Promise(function (resolve, reject) { setTimeout(function () { try { resolve(handle(path, opts)); } catch (e) { reject(e); } }, 250); }); },
    billInfo: function (id) { return billInfo(id); },
    pay: pay
  };
})();
