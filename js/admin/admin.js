/* ==========================================================
   D-Clix Admin — core
   session · permissions · data scope · router · table · forms ·
   modal · toast · charts · export/print · audit log
   NOTE: this is a front-end demo. Login, roles and scoping run in
   the browser, so they are not real security. A backend must
   re-check every permission before this handles real data.
   ========================================================== */
(function () {
  'use strict';
  var DB = window.ADMIN_DB;
  var A = window.ADMIN = window.ADMIN || {};
  var SESSION_KEY = 'dclix_admin_session';

  /* ---------- Extra icons used by the admin ---------- */
  Object.assign(window.ICONS, {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    trash: '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61M2 2l20 20"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    package: '<path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
    truck: '<path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8M12 17.5v-11"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65M22 12.65l-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    grid: '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
    checksquare: '<path d="m9 11 3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4M12 17h.01"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    swap: '<path d="m16 3 4 4-4 4M20 7H4M8 21l-4-4 4-4M4 17h16"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    gradcap: '<path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    medal: '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8"/><circle cx="12" cy="17" r="5"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    plug: '<path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
    sort: '<path d="m7 15 5 5 5-5M7 9l5-5 5 5"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
    idcard: '<rect width="20" height="16" x="2" y="4" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 17a3 3 0 0 1 6 0M14 9h5M14 13h5"/>'
  });

  /* ---------- Small helpers ---------- */
  var $ = A.$ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = A.$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = A.esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  A.icon = function (n, c) { return window.icon(n, c || 'w-4'); };
  A.today = function () { return DB.iso(new Date()); };
  A.money = function (n) { var s = A.settings(); return (s.currency || 'RM') + ' ' + Number(n || 0).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  A.num = function (n) { return Number(n || 0).toLocaleString('en-MY'); };
  A.date = function (d) {
    if (!d) return '';
    var s = String(d).slice(0, 10).split('-'); if (s.length < 3) return esc(d);
    var f = (A.settings().dateFormat || 'DD/MM/YYYY');
    return f.replace('DD', s[2]).replace('MM', s[1]).replace('YYYY', s[0]);
  };
  A.datetime = function (d) { if (!d) return ''; var t = new Date(d); if (isNaN(t)) return esc(d); return A.date(DB.iso(t)) + ' ' + DB.pad(t.getHours(), 2) + ':' + DB.pad(t.getMinutes(), 2); };
  A.initials = function (n) { return String(n || '?').split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join('').toUpperCase(); };
  A.avatar = function (name, photo, cls) { return photo ? '<img class="a-avatar ' + (cls || '') + '" src="' + esc(photo) + '" alt="" />' : '<span class="a-avatar ' + (cls || '') + '">' + esc(A.initials(name)) + '</span>'; };
  A.age = function (dob) { if (!dob) return ''; var d = new Date(dob), n = new Date(); var a = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
  A.settings = function () { return DB.data.settings; };
  A.monthKey = function (d) { return String(d).slice(0, 7); };
  A.monthLabel = function (key) { var p = key.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleString('en', { month: 'short' }) + ' ' + p[0].slice(2); };
  A.lastMonths = function (n) { var out = [], d = new Date(); d.setDate(1); for (var i = n - 1; i >= 0; i--) { var x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push(DB.iso(x).slice(0, 7)); } return out; };
  A.sum = function (arr, f) { return arr.reduce(function (t, r) { return t + (+(typeof f === 'function' ? f(r) : r[f]) || 0); }, 0); };
  A.byId = function (coll, id) { if (!id) return null; var list = DB.data[coll] || []; for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  A.nameOf = function (coll, id) { var r = A.byId(coll, id); return r ? r.name : (id ? id : ''); };
  A.cssStatus = function (s) {
    s = String(s || '').toLowerCase();
    if (/^(active|paid|present|approved|pass|completed|delivered|sent|open|registered|in stock|success|gold)$/.test(s)) return 'ok';
    if (/(pending|partial|late|scheduled|requested|in transit|draft|silver|unpaid|registration open|low stock)/.test(s)) return 'warn';
    if (/(inactive|suspended|absent|overdue|rejected|fail|cancelled|archived|refunded|failed|locked|out of stock)/.test(s)) return 'bad';
    if (/(excused|bronze|shipped)/.test(s)) return 'info';
    return 'neutral';
  };
  A.badge = function (s) { return s ? '<span class="a-badge ' + A.cssStatus(s) + '">' + esc(s) + '</span>' : ''; };
  A.debounce = function (fn, ms) { var t; return function () { var a = arguments, self = this; clearTimeout(t); t = setTimeout(function () { fn.apply(self, a); }, ms); }; };

  /* ---------- Session ---------- */
  function readSession() {
    var raw = null;
    try { raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY); } catch (e) {}
    try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  function writeSession(s) {
    try {
      var store = s.remember ? localStorage : sessionStorage;
      store.setItem(SESSION_KEY, JSON.stringify(s));
    } catch (e) {}
  }
  A.startSession = function (user, remember) {
    writeSession({ userId: user.id, remember: !!remember, at: Date.now(), last: Date.now() });
  };
  A.endSession = function (reason) {
    try { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); } catch (e) {}
    location.href = 'admin-login.html' + (reason ? '?reason=' + encodeURIComponent(reason) : '');
  };
  A.user = function () { var s = readSession(); return s ? A.byId('users', s.userId) : null; };
  A.touchSession = function () { var s = readSession(); if (s) { s.last = Date.now(); writeSession(s); } };
  A.sessionExpired = function () {
    var s = readSession(); if (!s) return true;
    var mins = +A.settings().sessionMinutes || 30;
    return Date.now() - s.last > mins * 60000;
  };

  /* Record a login attempt (used by the login page) */
  A.logLogin = function (email, ok, reason) {
    DB.data.logins.unshift({ email: email, ok: ok, reason: reason || '', at: new Date().toISOString(), agent: navigator.userAgent.slice(0, 90) });
    DB.data.logins = DB.data.logins.slice(0, 500);
    DB.save();
  };

  /* ---------- Permissions + data scope ---------- */
  A.role = function () { var u = A.user(); return u ? DB.data.roles[u.role] : null; };
  A.can = function (mod, action) {
    var r = A.role(); if (!r) return false;
    var p = r.perms[mod]; return !!(p && p.indexOf(action || 'view') >= 0);
  };
  /* Filter a collection to what the current user may see. */
  A.scope = function (rows, coll) {
    var u = A.user(), r = A.role(); if (!u || !r) return [];
    if (r.scope === 'all') return rows;
    if (coll === 'clubs') return rows.filter(function (x) { return x.id === u.clubId; });
    if (coll === 'centres' && r.scope === 'centre') return rows.filter(function (x) { return x.id === u.centreId; });
    return rows.filter(function (x) {
      if (!('clubId' in x) || x.clubId === '') return true; // platform-wide records (e.g. tournaments, products)
      if (r.scope === 'club') return x.clubId === u.clubId;
      if (r.scope === 'centre') return x.centreId ? x.centreId === u.centreId : x.clubId === u.clubId;
      return false;
    });
  };
  A.rows = function (coll) { return A.scope(DB.data[coll] || [], coll); };
  A.inScope = function (rec, coll) { return A.scope([rec], coll).length === 1; };

  /* ---------- Audit + persistence ---------- */
  A.audit = function (action, module, recordId, changes, summary) {
    var u = A.user();
    DB.data.audit.unshift({ id: 'AU' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: new Date().toISOString(),
      user: u ? u.name : 'System', userId: u ? u.id : '', action: action, module: module, recordId: recordId || '', changes: changes || [],
      summary: summary || '', ip: 'n/a (browser demo)' });
    DB.data.audit = DB.data.audit.slice(0, 3000);
  };
  function diff(before, after) {
    var out = [];
    Object.keys(after).forEach(function (k) {
      if (k === 'pwHash' || k === 'salt') { if (before && before[k] !== after[k] && k === 'pwHash') out.push({ field: 'password', from: '••••', to: '•••• (changed)' }); return; }
      var a = before ? before[k] : undefined, b = after[k];
      if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ field: k, from: a == null ? '' : (typeof a === 'object' ? JSON.stringify(a) : String(a)).slice(0, 120), to: b == null ? '' : (typeof b === 'object' ? JSON.stringify(b) : String(b)).slice(0, 120) });
    });
    return out;
  }
  /* Create or update a record; logs to the audit trail. */
  A.put = function (coll, rec, moduleKey, summary) {
    var list = DB.data[coll]; var i = -1;
    for (var k = 0; k < list.length; k++) if (list[k].id === rec.id) { i = k; break; }
    if (i >= 0) {
      var before = list[i]; var after = Object.assign({}, before, rec);
      var ch = diff(before, after);
      list[i] = after;
      if (ch.length) A.audit('Update', moduleKey || coll, rec.id, ch, summary);
      DB.save(); return after;
    }
    list.unshift(rec);
    A.audit('Create', moduleKey || coll, rec.id, [], summary || ('Created ' + (rec.name || rec.title || rec.id)));
    DB.save(); return rec;
  };
  A.remove = function (coll, id, moduleKey) {
    var list = DB.data[coll]; var rec = A.byId(coll, id); if (!rec) return;
    DB.data[coll] = list.filter(function (r) { return r.id !== id; });
    A.audit('Delete', moduleKey || coll, id, diff({}, rec).map(function (c) { return { field: c.field, from: c.to, to: '' }; }), 'Deleted ' + (rec.name || rec.title || id));
    DB.save();
  };

  /* ---------- Toast / modal / confirm ---------- */
  A.toast = function (msg, type) {
    var box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'a-toasts'; document.body.appendChild(box); }
    var t = document.createElement('div'); t.className = 'a-toast ' + (type || 'ok'); t.setAttribute('role', 'status');
    t.innerHTML = A.icon(type === 'error' ? 'alert' : type === 'info' ? 'info' : 'checkcircle', 'w-5') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, type === 'error' ? 5000 : 3200);
  };
  var modalStack = [];
  A.modal = function (o) {
    var wrap = document.createElement('div'); wrap.className = 'a-modal-wrap';
    wrap.innerHTML = '<div class="a-modal ' + (o.size || '') + '" role="dialog" aria-modal="true" aria-label="' + esc(o.title) + '">' +
      '<div class="a-modal-h"><h3>' + esc(o.title) + '</h3><button class="icon-btn" type="button" data-close aria-label="Close">' + A.icon('x', 'w-5') + '</button></div>' +
      '<div class="a-modal-b">' + (o.body || '') + '</div>' +
      (o.actions && o.actions.length ? '<div class="a-modal-f">' + o.actions.map(function (b, i) { return '<button type="button" class="a-btn ' + (b.cls || '') + '" data-act="' + i + '">' + (b.icon ? A.icon(b.icon) : '') + esc(b.label) + '</button>'; }).join('') + '</div>' : '') + '</div>';
    document.body.appendChild(wrap);
    var prevFocus = document.activeElement;
    function close() { wrap.remove(); modalStack.pop(); if (prevFocus && prevFocus.focus) prevFocus.focus(); if (o.onClose) o.onClose(); }
    var api = { el: wrap, body: $('.a-modal-b', wrap), close: close };
    modalStack.push(api);
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    $$('[data-close]', wrap).forEach(function (b) { b.addEventListener('click', close); });
    $$('[data-act]', wrap).forEach(function (b) { b.addEventListener('click', function () { var a = o.actions[+b.getAttribute('data-act')]; if (a.onClick) { if (a.onClick(api) !== false) close(); } else close(); }); });
    setTimeout(function () { var f = $('input:not([type=hidden]):not([disabled]), select, textarea, button.primary', wrap); if (f) f.focus(); }, 30);
    if (o.onOpen) o.onOpen(api);
    return api;
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modalStack.length) modalStack[modalStack.length - 1].close(); });
  A.confirm = function (msg, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var done = false;
      A.modal({ title: opts.title || 'Please confirm', size: 'sm', body: '<p class="a-confirm">' + esc(msg) + '</p>',
        onClose: function () { if (!done) res(false); },
        actions: [{ label: 'Cancel', cls: 'ghost' }, { label: opts.ok || 'Confirm', cls: opts.danger ? 'danger' : 'primary', onClick: function () { done = true; res(true); } }] });
    });
  };
  A.prompt = function (title, label, opts) {
    opts = opts || {};
    return new Promise(function (res) {
      var done = false;
      A.modal({ title: title, size: 'sm', body: '<label class="a-lbl">' + esc(label) + (opts.required ? ' <span class="req">*</span>' : '') + '</label><textarea class="a-input" rows="3" id="promptVal"></textarea><p class="a-err" id="promptErr"></p>',
        onClose: function () { if (!done) res(null); },
        actions: [{ label: 'Cancel', cls: 'ghost' }, { label: opts.ok || 'Submit', cls: opts.danger ? 'danger' : 'primary', onClick: function (m) {
          var v = $('#promptVal', m.el).value.trim();
          if (opts.required && !v) { $('#promptErr', m.el).textContent = 'Please enter a ' + label.toLowerCase() + '.'; return false; }
          done = true; res(v);
        } }] });
    });
  };

  /* ---------- Forms + validation ---------- */
  /* Field: {k, l, type:text|email|tel|number|date|time|select|textarea|checkbox|multi|file|password, req, unique, opts:[..]|fn, ref:'coll', min, max, help, full, hide:fn} */
  function optionsOf(f, rec) {
    var o = typeof f.opts === 'function' ? f.opts(rec) : f.opts;
    if (f.ref) o = A.rows(f.ref).filter(function (r) { return !f.refFilter || f.refFilter(r, rec); }).map(function (r) { return [r.id, r.name + (f.refLabel ? f.refLabel(r) : '')]; });
    return (o || []).map(function (x) { return Array.isArray(x) ? x : [x, x]; });
  }
  A.formHTML = function (fields, rec) {
    rec = rec || {};
    return '<div class="a-form-grid">' + fields.map(function (f) {
      if (f.hide && f.hide(rec)) return '';
      var v = rec[f.k] != null ? rec[f.k] : (f.def != null ? (typeof f.def === 'function' ? f.def() : f.def) : '');
      var id = 'f_' + f.k; var req = f.req ? ' <span class="req">*</span>' : '';
      var attrs = ' id="' + id + '" name="' + f.k + '"' + (f.req ? ' aria-required="true"' : '') + (f.ro ? ' disabled' : '');
      var input;
      if (f.type === 'select') {
        var opts = optionsOf(f, rec);
        input = opts.length || !f.ref ? '<select class="a-input"' + attrs + '><option value="">' + esc(f.placeholder || 'Select…') + '</option>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'
          : '<div class="a-empty-inline">' + A.icon('info') + ' No ' + esc(f.l.toLowerCase()) + ' records yet. Add one first.</div><input type="hidden"' + attrs + ' value="" />';
      } else if (f.type === 'multi') {
        var mo = optionsOf(f, rec); var vals = Array.isArray(v) ? v : [];
        input = '<div class="a-checks" id="' + id + '">' + (mo.length ? mo.map(function (o) { return '<label class="a-check"><input type="checkbox" name="' + f.k + '" value="' + esc(o[0]) + '"' + (vals.indexOf(o[0]) >= 0 ? ' checked' : '') + ' /> ' + esc(o[1]) + '</label>'; }).join('') : '<span class="muted">No options available.</span>') + '</div>';
      } else if (f.type === 'textarea') {
        input = '<textarea class="a-input" rows="' + (f.rows || 3) + '"' + attrs + '>' + esc(v) + '</textarea>';
      } else if (f.type === 'checkbox') {
        input = '<label class="a-switch"><input type="checkbox"' + attrs + (v === true || v === 'true' ? ' checked' : '') + ' /><span></span> ' + esc(f.text || '') + '</label>';
      } else if (f.type === 'file') {
        input = '<input class="a-input" type="file"' + attrs + (f.accept ? ' accept="' + f.accept + '"' : '') + (f.multiple ? ' multiple' : '') + ' />' + (v ? '<p class="a-help">Current: ' + esc(Array.isArray(v) ? v.map(function (x) { return x.name || x; }).join(', ') : (String(v).slice(0, 5) === 'data:' ? 'image uploaded' : v)) + '</p>' : '');
      } else {
        input = '<input class="a-input" type="' + (f.type || 'text') + '"' + attrs + ' value="' + esc(v) + '"' + (f.min != null ? ' min="' + f.min + '"' : '') + (f.max != null ? ' max="' + f.max + '"' : '') + (f.step ? ' step="' + f.step + '"' : '') + (f.ph ? ' placeholder="' + esc(f.ph) + '"' : '') + ' />';
      }
      return '<div class="a-field' + (f.full || f.type === 'textarea' || f.type === 'multi' ? ' full' : '') + '"><label class="a-lbl" for="' + id + '">' + esc(f.l) + req + '</label>' + input + (f.help ? '<p class="a-help">' + esc(f.help) + '</p>' : '') + '<p class="a-err" data-err="' + f.k + '"></p></div>';
    }).join('') + '</div>';
  };
  A.readForm = function (root, fields, rec) {
    var out = {};
    fields.forEach(function (f) {
      if (f.hide && f.hide(rec || {})) return;
      if (f.ro) return;
      if (f.type === 'multi') { out[f.k] = $$('input[name="' + f.k + '"]:checked', root).map(function (c) { return c.value; }); return; }
      var el = $('[name="' + f.k + '"]', root); if (!el) return;
      if (f.type === 'checkbox') out[f.k] = el.checked;
      else if (f.type === 'number') out[f.k] = el.value === '' ? '' : Number(el.value);
      else if (f.type === 'file') return;
      else out[f.k] = el.value.trim();
    });
    return out;
  };
  /* Read file inputs (images → data URL, others → names). Resolves with {k: value}. */
  A.readFiles = function (root, fields) {
    var jobs = [];
    var out = {};
    fields.filter(function (f) { return f.type === 'file'; }).forEach(function (f) {
      var el = $('[name="' + f.k + '"]', root); if (!el || !el.files || !el.files.length) return;
      var files = Array.prototype.slice.call(el.files);
      if (f.image) {
        var file = files[0];
        if (file.size > 300 * 1024) { out.__error = { k: f.k, msg: 'Image is too large. Please use a file under 300 KB.' }; return; }
        if (!/^image\/(png|jpe?g|webp|gif|svg\+xml)$/.test(file.type)) { out.__error = { k: f.k, msg: 'Only PNG, JPG, WEBP, GIF or SVG images are allowed.' }; return; }
        jobs.push(new Promise(function (res) { var r = new FileReader(); r.onload = function () { out[f.k] = r.result; res(); }; r.onerror = res; r.readAsDataURL(file); }));
      } else {
        var bad = files.filter(function (x) { return x.size > 5 * 1024 * 1024 || !/\.(pdf|jpe?g|png|docx?)$/i.test(x.name); });
        if (bad.length) { out.__error = { k: f.k, msg: 'Allowed: PDF, JPG, PNG, DOC up to 5 MB each.' }; return; }
        out[f.k] = files.map(function (x) { return { name: x.name, size: x.size, at: A.today() }; });
      }
    });
    return Promise.all(jobs).then(function () { return out; });
  };
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^\+?[0-9][0-9\s-]{7,15}$/;
  A.validate = function (fields, vals, coll, id) {
    var errs = {};
    fields.forEach(function (f) {
      if (!(f.k in vals)) return;
      var v = vals[f.k]; var empty = v === '' || v == null || (Array.isArray(v) && !v.length);
      if (f.req && empty) { errs[f.k] = f.l + ' is required.'; return; }
      if (empty) return;
      if (f.type === 'email' && !EMAIL_RE.test(v)) errs[f.k] = 'Please enter a valid email address, e.g. name@example.com.';
      if (f.type === 'tel' && !PHONE_RE.test(v)) errs[f.k] = 'Please enter a valid phone number, e.g. 012-345 6789.';
      if (f.type === 'number') {
        if (isNaN(v)) errs[f.k] = f.l + ' must be a number.';
        else if (f.min != null && v < f.min) errs[f.k] = f.min === 0 ? f.l + ' cannot be negative.' : f.l + ' must be at least ' + f.min + '.';
        else if (f.max != null && v > f.max) errs[f.k] = f.l + ' must be at most ' + f.max + '.';
      }
      if (f.type === 'date' && isNaN(new Date(v))) errs[f.k] = 'Please enter a valid date.';
      if (f.ic && !/^\d{6}-?\d{2}-?\d{4}$|^[A-Z][0-9]{6,9}$/i.test(v)) errs[f.k] = 'Use IC format 900101-14-5678 or a passport number.';
      if (f.unique && coll) {
        var norm = function (x) { return String(x || '').toLowerCase().replace(/[\s-]/g, ''); };
        var dup = DB.data[coll].filter(function (r) { return r.id !== id && norm(r[f.k]) === norm(v); })[0];
        if (dup) errs[f.k] = f.l + ' is already used by ' + (dup.name || dup.id) + ' (' + dup.id + ').';
      }
      if (f.check) { var m = f.check(v, vals); if (m) errs[f.k] = m; }
    });
    return errs;
  };
  A.showErrors = function (root, errs) {
    $$('[data-err]', root).forEach(function (p) { p.textContent = ''; var inp = $('[name="' + p.getAttribute('data-err') + '"]', root); if (inp) inp.classList.remove('invalid'); });
    var first = null;
    Object.keys(errs).forEach(function (k) {
      var p = $('[data-err="' + k + '"]', root); if (p) p.textContent = errs[k];
      var inp = $('[name="' + k + '"]', root); if (inp) { inp.classList.add('invalid'); first = first || inp; }
    });
    if (first) first.focus();
    return !Object.keys(errs).length;
  };
  /* Open a create/edit form. opts: {title, fields, rec, coll, module, onSave(vals, isNew) -> record|false} */
  A.openForm = function (o) {
    var isNew = !o.rec || !o.rec.id;
    A.modal({ title: o.title, size: o.size || 'lg', body: '<form novalidate class="a-form">' + A.formHTML(o.fields, o.rec || {}) + '</form>',
      onOpen: function (m) {
        var form = $('form', m.el);
        form.addEventListener('submit', function (e) { e.preventDefault(); $('.a-modal-f .primary', m.el).click(); });
        if (o.onOpen) o.onOpen(m, form);
      },
      actions: [{ label: 'Cancel', cls: 'ghost' }, { label: isNew ? 'Create' : 'Save changes', cls: 'primary', icon: 'check', onClick: function (m) {
        var form = $('form', m.el);
        var vals = A.readForm(form, o.fields, o.rec);
        var errs = A.validate(o.fields, vals, o.coll, o.rec && o.rec.id);
        if (o.extraValidate) Object.assign(errs, o.extraValidate(vals) || {});
        if (!A.showErrors(form, errs)) return false;
        A.readFiles(form, o.fields).then(function (files) {
          if (files.__error) { var e2 = {}; e2[files.__error.k] = files.__error.msg; A.showErrors(form, e2); return; }
          delete files.__error;
          Object.keys(files).forEach(function (k) {
            var f = o.fields.filter(function (x) { return x.k === k; })[0];
            vals[k] = f && !f.image && o.rec && Array.isArray(o.rec[k]) ? o.rec[k].concat(files[k]) : files[k];
          });
          try {
            var saved = o.onSave(vals, isNew);
            if (saved === false) return;
            m.close();
            A.toast(isNew ? 'Created successfully.' : 'Changes saved.');
            if (o.after) o.after(saved);
          } catch (err) { console.error(err); A.toast('Something went wrong while saving. Please try again.', 'error'); }
        });
        return false;
      } }] });
  };

  /* ---------- Export / print ---------- */
  function cellText(c, r) { var v = c.text ? c.text(r) : c.fmt ? String(c.fmt(r)).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : r[c.k]; return v == null ? '' : String(v); }
  A.exportCSV = function (name, cols, rows) {
    var cs = cols.filter(function (c) { return c.k !== '_actions' && !c.noExport; });
    var lines = [cs.map(function (c) { return c.l; })].concat(rows.map(function (r) { return cs.map(function (c) { return cellText(c, r); }); }));
    var csv = lines.map(function (l) { return l.map(function (v) { v = String(v); if (/^[=+\-@]/.test(v)) v = "'" + v; return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\r\n');
    var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    A.download(blob, name.replace(/[^\w-]+/g, '_') + '_' + A.today() + '.csv');
    A.audit('Export', name, '', [], 'Exported ' + rows.length + ' rows to Excel (CSV)');
    DB.save();
  };
  A.download = function (blob, filename) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  /* Print HTML in a hidden iframe. Choosing "Save as PDF" in the dialog gives the PDF export. */
  A.printHTML = function (title, html) {
    var f = document.createElement('iframe'); f.className = 'a-print-frame'; f.setAttribute('aria-hidden', 'true'); document.body.appendChild(f);
    var d = f.contentWindow.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><title>' + esc(title) + '</title><style>' +
      'body{font-family:"DM Sans",system-ui,sans-serif;color:#111;margin:24px;font-size:12px}h1{font-size:18px;margin:0 0 4px}h2{font-size:14px;margin:18px 0 6px}.muted{color:#666}' +
      'table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top}th{background:#f3f4f6}' +
      '.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #f97316;padding-bottom:10px;margin-bottom:12px}.brand{font-weight:700;color:#f97316;font-size:16px}' +
      '.right{text-align:right}.tot td{font-weight:700}.box{border:1px solid #ddd;border-radius:8px;padding:12px;margin-top:12px}.cert{text-align:center;border:8px double #f97316;padding:60px 40px;margin-top:40px}.cert h1{font-size:34px}.cert .big{font-size:26px;font-weight:700;margin:16px 0}' +
      '@page{margin:14mm}</style></head><body>' +
      '<div class="head"><div><div class="brand">' + esc(A.settings().systemName) + '</div><div class="muted">Raig Technologies (M) Sdn Bhd</div></div><div class="right muted">Printed ' + A.datetime(new Date()) + '<br>' + esc((A.user() || {}).name || '') + '</div></div>' +
      html + '</body></html>');
    d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { A.toast('Printing is blocked in this browser.', 'error'); } setTimeout(function () { f.remove(); }, 1500); }, 250);
  };
  A.tableHTML = function (cols, rows) {
    var cs = cols.filter(function (c) { return c.k !== '_actions' && !c.noExport; });
    return '<table><thead><tr>' + cs.map(function (c) { return '<th>' + esc(c.l) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr>' + cs.map(function (c) { return '<td>' + esc(cellText(c, r)) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
  };

  /* ---------- QR (uses qrcode-generator from CDN when available) ---------- */
  A.qrSVG = function (text, size) {
    size = size || 160;
    if (typeof window.qrcode !== 'function') return '<div class="a-qr-fallback" style="width:' + size + 'px;height:' + size + 'px">' + A.icon('qr', 'w-12') + '<small>' + esc(text) + '</small></div>';
    var q = window.qrcode(0, 'M'); q.addData(text); q.make();
    var n = q.getModuleCount(), cell = size / (n + 8), d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + ((c + 4) * cell).toFixed(2) + ' ' + ((r + 4) * cell).toFixed(2) + 'h' + cell.toFixed(2) + 'v' + cell.toFixed(2) + 'h-' + cell.toFixed(2) + 'z';
    return '<svg class="a-qr" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  };

  /* ---------- Charts (inline SVG) ---------- */
  var PALETTE = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#eab308', '#ef4444', '#14b8a6', '#ec4899'];
  A.palette = PALETTE;
  function niceMax(v) { if (v <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(v))); var n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function shortNum(v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'k' : String(Math.round(v)); }
  function legend(series) { return series.length > 1 ? '<div class="a-legend">' + series.map(function (s, i) { return '<span><i style="background:' + (s.color || PALETTE[i]) + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : ''; }
  /* type: 'line' | 'bar' | 'stacked' */
  A.chart = function (o) {
    var W = 560, H = 220, pl = 40, pr = 10, pt = 12, pb = 26;
    var labels = o.labels, series = o.series, n = labels.length;
    var max = niceMax(o.type === 'stacked' ? Math.max.apply(null, labels.map(function (_, i) { return A.sum(series, function (s) { return s.values[i]; }); })) : Math.max.apply(null, series.map(function (s) { return Math.max.apply(null, s.values.concat([0])); })));
    var iw = W - pl - pr, ih = H - pt - pb;
    var g = '';
    for (var t = 0; t <= 4; t++) { var y = pt + ih - ih * t / 4; g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + shortNum(max * t / 4) + '</text>'; }
    var step = iw / n;
    labels.forEach(function (l, i) { if (n > 12 && i % Math.ceil(n / 12)) return; g += '<text x="' + (pl + step * i + step / 2) + '" y="' + (H - 8) + '" text-anchor="middle">' + esc(l) + '</text>'; });
    var body = '';
    if (o.type === 'line') {
      series.forEach(function (s, si) {
        var c = s.color || PALETTE[si];
        var pts = s.values.map(function (v, i) { return [pl + step * i + step / 2, pt + ih - ih * v / max]; });
        if (si === 0 && series.length === 1) body += '<path d="M' + pts[0][0] + ' ' + (pt + ih) + pts.map(function (p) { return 'L' + p[0] + ' ' + p[1]; }).join('') + 'L' + pts[pts.length - 1][0] + ' ' + (pt + ih) + 'Z" fill="' + c + '" opacity=".12"/>';
        body += '<path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + '" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-linejoin="round"/>';
        body += pts.map(function (p, i) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3.5" fill="' + c + '"><title>' + esc(labels[i] + ' · ' + s.name + ': ' + (o.fmt ? o.fmt(s.values[i]) : A.num(s.values[i]))) + '</title></circle>'; }).join('');
      });
    } else {
      var groups = o.type === 'stacked' ? 1 : series.length; var bw = Math.min(28, (step * 0.7) / groups);
      labels.forEach(function (l, i) {
        var base = pt + ih;
        series.forEach(function (s, si) {
          var v = s.values[i] || 0, h = ih * v / max, c = s.color || PALETTE[si];
          var x = o.type === 'stacked' ? pl + step * i + (step - bw) / 2 : pl + step * i + (step - bw * groups) / 2 + bw * si;
          var y = o.type === 'stacked' ? base - h : pt + ih - h;
          body += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + Math.max(0, h).toFixed(1) + '" rx="3" fill="' + c + '"><title>' + esc(l + ' · ' + s.name + ': ' + (o.fmt ? o.fmt(v) : A.num(v))) + '</title></rect>';
          if (o.type === 'stacked') base -= h;
        });
      });
    }
    return '<div class="a-chart">' + legend(series) + '<svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="img" aria-label="' + esc(o.title || 'Chart') + '">' + g + body + '</svg></div>';
  };
  A.donut = function (items, o) {
    o = o || {};
    var total = A.sum(items, 'value') || 1, r = 52, c = 2 * Math.PI * r, off = 0;
    var arcs = items.map(function (it, i) {
      var len = c * it.value / total;
      var s = '<circle r="' + r + '" cx="70" cy="70" fill="none" stroke="' + (it.color || PALETTE[i % PALETTE.length]) + '" stroke-width="22" stroke-dasharray="' + len.toFixed(2) + ' ' + (c - len).toFixed(2) + '" stroke-dashoffset="' + (-off).toFixed(2) + '" transform="rotate(-90 70 70)"><title>' + esc(it.label + ': ' + A.num(it.value)) + '</title></circle>';
      off += len; return s;
    }).join('');
    return '<div class="a-donut"><svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label="' + esc(o.title || 'Chart') + '">' + arcs + '<text x="70" y="68" text-anchor="middle" class="big">' + A.num(A.sum(items, 'value')) + '</text><text x="70" y="86" text-anchor="middle">' + esc(o.center || 'total') + '</text></svg>' +
      '<ul>' + items.map(function (it, i) { return '<li><i style="background:' + (it.color || PALETTE[i % PALETTE.length]) + '"></i><span>' + esc(it.label) + '</span><b>' + A.num(it.value) + '</b></li>'; }).join('') + '</ul></div>';
  };
  A.hbars = function (items, o) {
    o = o || {}; var max = Math.max.apply(null, items.map(function (x) { return x.value; }).concat([1]));
    return '<div class="a-hbars">' + items.map(function (it, i) { return '<div class="row"><span class="l" title="' + esc(it.label) + '">' + esc(it.label) + '</span><span class="bar"><i style="width:' + (100 * it.value / max).toFixed(1) + '%;background:' + (it.color || PALETTE[(o.colorIdx || 0) % PALETTE.length]) + '"></i></span><b>' + (o.fmt ? o.fmt(it.value) : A.num(it.value)) + '</b></div>'; }).join('') + '</div>';
  };

  /* ---------- Data table ----------
     opts: { id, rows: fn()->[], cols:[{k,l,fmt,sort,text,noExport,cls}], search:[keys] | fn(row)->text,
             filters:[{k,l,opts:[..]|fn, val:fn(row)}], dateKey, dateLabel, actions:fn(row)->[{icon,label,fn,danger,show}],
             bulk:[{label,icon,fn(rows),danger}], onRow:fn(row), exportName, canExport, pageSize, empty, toolbar:html, defaultSort:{k,dir} } */
  A.table = function (host, o) {
    var st = { q: '', f: {}, from: '', to: '', sort: o.defaultSort ? o.defaultSort.k : null, dir: o.defaultSort ? o.defaultSort.dir : 1, page: 1, size: o.pageSize || 10, sel: {} };
    var canExport = o.canExport !== false;
    var selectable = !!(o.bulk && o.bulk.length);
    host.innerHTML =
      '<div class="a-tbl-wrap">' +
      '<form class="a-filterbar" role="search">' +
        '<div class="a-search">' + A.icon('search') + '<input class="a-input" type="search" name="q" placeholder="' + esc(o.searchPlaceholder || 'Search by ID, name, phone, email…') + '" aria-label="Search" /></div>' +
        (o.filters || []).map(function (f, i) {
          return '<select class="a-input" data-filter="' + i + '" aria-label="' + esc(f.l) + '"><option value="">Any ' + esc(f.l.toLowerCase()) + '</option></select>';
        }).join('') +
        (o.dateKey ? '<label class="a-date"><span>' + esc(o.dateLabel || 'From') + '</span><input class="a-input" type="date" name="from" aria-label="Date from" /></label><label class="a-date"><span>To</span><input class="a-input" type="date" name="to" aria-label="Date to" /></label>' : '') +
        '<div class="a-filter-btns"><button class="a-btn primary" type="submit">' + A.icon('search') + 'Search</button><button class="a-btn ghost" type="button" data-reset>' + A.icon('refresh') + 'Reset</button>' +
        (canExport ? '<div class="a-dd"><button class="a-btn ghost" type="button" data-export aria-haspopup="true">' + A.icon('download') + 'Export ' + A.icon('down', 'w-3') + '</button><div class="a-dd-menu" hidden><button type="button" data-x="csv">' + A.icon('sheet') + 'Excel (CSV)</button><button type="button" data-x="pdf">' + A.icon('file') + 'PDF</button><button type="button" data-x="print">' + A.icon('printer') + 'Print</button></div></div>' : '') +
        '</div></form>' +
      (o.toolbar ? '<div class="a-tbl-toolbar">' + o.toolbar + '</div>' : '') +
      '<div class="a-bulk" hidden><span data-selcount></span>' + (o.bulk || []).map(function (b, i) { return '<button type="button" class="a-btn sm ' + (b.danger ? 'danger' : 'ghost') + '" data-bulk="' + i + '">' + (b.icon ? A.icon(b.icon) : '') + esc(b.label) + '</button>'; }).join('') + '<button type="button" class="a-btn sm ghost" data-clearsel>Clear</button></div>' +
      '<div class="a-tbl-scroll"><table class="a-tbl"><thead></thead><tbody></tbody></table></div>' +
      '<div class="a-pager"><span data-info></span><label>Rows per page <select class="a-input sm" data-size>' + [10, 25, 50, 100].map(function (n) { return '<option' + (n === st.size ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '</select></label><div class="a-pages" data-pages></div></div>' +
      '</div>';
    var form = $('.a-filterbar', host), thead = $('thead', host), tbody = $('tbody', host);
    var cache = [];

    function fillFilterOptions() {
      (o.filters || []).forEach(function (f, i) {
        var sel = $('[data-filter="' + i + '"]', host); var cur = sel.value;
        var opts = typeof f.opts === 'function' ? f.opts() : f.opts;
        if (!opts) { var seen = {}; (o.rows() || []).forEach(function (r) { var v = f.val ? f.val(r) : r[f.k]; if (v !== '' && v != null) seen[v] = 1; }); opts = Object.keys(seen).sort(); }
        sel.innerHTML = '<option value="">Any ' + esc(f.l.toLowerCase()) + '</option>' + opts.map(function (x) { x = Array.isArray(x) ? x : [x, x]; return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + '</option>'; }).join('');
        if (st.f[i] != null) sel.value = st.f[i]; else if (cur) sel.value = cur;
      });
    }
    function filtered() {
      var rows = o.rows() || [];
      var q = st.q.toLowerCase();
      if (q) rows = rows.filter(function (r) {
        var hay = typeof o.search === 'function' ? o.search(r) : (o.search || ['id', 'name']).map(function (k) { return r[k]; }).join(' ');
        return String(hay).toLowerCase().indexOf(q) >= 0;
      });
      (o.filters || []).forEach(function (f, i) { var v = st.f[i]; if (v) rows = rows.filter(function (r) { return String(f.val ? f.val(r) : r[f.k]) === v; }); });
      if (o.dateKey) {
        if (st.from) rows = rows.filter(function (r) { return String(r[o.dateKey] || '').slice(0, 10) >= st.from; });
        if (st.to) rows = rows.filter(function (r) { return String(r[o.dateKey] || '').slice(0, 10) <= st.to; });
      }
      if (st.sort) {
        var col = o.cols.filter(function (c) { return c.k === st.sort; })[0];
        var key = col && col.sort ? col.sort : function (r) { return r[st.sort]; };
        rows = rows.slice().sort(function (a, b) { var x = key(a), y = key(b); if (typeof x === 'number' && typeof y === 'number') return (x - y) * st.dir; return String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, { numeric: true }) * st.dir; });
      }
      return rows;
    }
    function render() {
      try {
        cache = filtered();
        var pages = Math.max(1, Math.ceil(cache.length / st.size)); if (st.page > pages) st.page = pages;
        var pageRows = cache.slice((st.page - 1) * st.size, st.page * st.size);
        var allSel = pageRows.length && pageRows.every(function (r) { return st.sel[r.id]; });
        thead.innerHTML = '<tr>' + (selectable ? '<th class="chk"><input type="checkbox" data-selall aria-label="Select all on this page"' + (allSel ? ' checked' : '') + ' /></th>' : '') +
          o.cols.map(function (c) {
            if (c.k === '_actions') return '<th class="act">Actions</th>';
            var s = st.sort === c.k; return '<th class="' + (c.cls || '') + '"><button type="button" class="a-sort' + (s ? ' on' : '') + '" data-sort="' + c.k + '" aria-label="Sort by ' + esc(c.l) + '">' + esc(c.l) + ' ' + A.icon(s ? (st.dir > 0 ? 'down' : 'up') : 'sort', 'w-3') + '</button></th>';
          }).join('') + '</tr>';
        var colspan = o.cols.length + (selectable ? 1 : 0);
        if (!cache.length) {
          var anyFilter = st.q || st.from || st.to || Object.keys(st.f).some(function (k) { return st.f[k]; });
          tbody.innerHTML = '<tr><td colspan="' + colspan + '"><div class="a-empty">' + A.icon(anyFilter ? 'search' : 'box', 'w-8') + '<b>' + esc(anyFilter ? (o.emptyFiltered || 'No records match your search or filters.') : (o.empty || 'No records yet.')) + '</b>' + (anyFilter ? '<button type="button" class="a-btn ghost sm" data-reset>Clear filters</button>' : '') + '</div></td></tr>';
        } else {
          tbody.innerHTML = pageRows.map(function (r, idx) {
            return '<tr data-i="' + idx + '"' + (o.onRow ? ' class="click"' : '') + '>' + (selectable ? '<td class="chk"><input type="checkbox" data-sel="' + esc(r.id) + '" aria-label="Select ' + esc(r.id) + '"' + (st.sel[r.id] ? ' checked' : '') + ' /></td>' : '') +
              o.cols.map(function (c) {
                if (c.k === '_actions') {
                  var acts = (o.actions ? o.actions(r) : []).filter(function (a) { return a.show !== false; });
                  var inline = acts.slice(0, 2), rest = acts.slice(2);
                  return '<td class="act">' + inline.map(function (a, ai) { return '<button type="button" class="icon-btn sm' + (a.danger ? ' danger' : '') + '" data-act="' + ai + '" title="' + esc(a.label) + '" aria-label="' + esc(a.label) + '">' + A.icon(a.icon) + '</button>'; }).join('') +
                    (rest.length ? '<div class="a-dd"><button type="button" class="icon-btn sm" data-more title="More actions" aria-label="More actions" aria-haspopup="true">' + A.icon('more') + '</button><div class="a-dd-menu right" hidden>' + rest.map(function (a, ai) { return '<button type="button" data-act="' + (ai + 2) + '"' + (a.danger ? ' class="danger"' : '') + '>' + A.icon(a.icon) + esc(a.label) + '</button>'; }).join('') + '</div></div>' : '') + '</td>';
                }
                var v = c.fmt ? c.fmt(r) : esc(r[c.k]);
                return '<td class="' + (c.cls || '') + '" data-label="' + esc(c.l) + '">' + (v == null ? '' : v) + '</td>';
              }).join('') + '</tr>';
          }).join('');
        }
        var from = cache.length ? (st.page - 1) * st.size + 1 : 0;
        $('[data-info]', host).textContent = 'Showing ' + from + '–' + Math.min(cache.length, st.page * st.size) + ' of ' + A.num(cache.length);
        var pg = '';
        function pbtn(p, label, dis, cur) { return '<button type="button" class="a-page' + (cur ? ' on' : '') + '" data-page="' + p + '"' + (dis ? ' disabled' : '') + (cur ? ' aria-current="page"' : '') + '>' + label + '</button>'; }
        pg += pbtn(st.page - 1, A.icon('left'), st.page <= 1);
        var lo = Math.max(1, st.page - 2), hi = Math.min(pages, lo + 4); lo = Math.max(1, hi - 4);
        if (lo > 1) pg += pbtn(1, '1') + (lo > 2 ? '<span class="dots">…</span>' : '');
        for (var p = lo; p <= hi; p++) pg += pbtn(p, String(p), false, p === st.page);
        if (hi < pages) pg += (hi < pages - 1 ? '<span class="dots">…</span>' : '') + pbtn(pages, String(pages));
        pg += pbtn(st.page + 1, A.icon('right'), st.page >= pages);
        $('[data-pages]', host).innerHTML = pg;
        var nsel = Object.keys(st.sel).filter(function (k) { return st.sel[k]; }).length;
        var bulk = $('.a-bulk', host); bulk.hidden = !nsel; $('[data-selcount]', host).textContent = nsel + ' selected';
        tbody._rows = pageRows;
      } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="99"><div class="a-empty error">' + A.icon('alert', 'w-8') + '<b>We could not load this list.</b><span class="muted">Please try again. If it keeps happening, reset the demo data in Settings.</span><button type="button" class="a-btn ghost sm" data-retry>Retry</button></div></td></tr>';
      }
    }
    function closeMenus(except) { $$('.a-dd-menu', host).forEach(function (m) { if (m !== except) m.hidden = true; }); }
    form.addEventListener('submit', function (e) { e.preventDefault(); st.q = form.q.value.trim(); st.page = 1; render(); });
    form.q.addEventListener('input', A.debounce(function () { st.q = form.q.value.trim(); st.page = 1; render(); }, 200));
    $$('[data-filter]', host).forEach(function (s) { s.addEventListener('change', function () { st.f[s.getAttribute('data-filter')] = s.value; st.page = 1; render(); }); });
    if (o.dateKey) { ['from', 'to'].forEach(function (k) { form[k].addEventListener('change', function () { st[k] = form[k].value; st.page = 1; render(); }); }); }
    host.addEventListener('click', function (e) {
      var t = e.target.closest('button, input[type=checkbox], tr.click'); if (!t || !host.contains(t)) { closeMenus(); return; }
      if (t.hasAttribute('data-reset')) { st.q = ''; st.f = {}; st.from = st.to = ''; st.page = 1; form.reset(); render(); return; }
      if (t.hasAttribute('data-retry')) { render(); return; }
      if (t.hasAttribute('data-sort')) { var k = t.getAttribute('data-sort'); if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = 1; } render(); return; }
      if (t.hasAttribute('data-page')) { st.page = +t.getAttribute('data-page'); render(); return; }
      if (t.hasAttribute('data-export') || t.hasAttribute('data-more')) { var m = t.nextElementSibling; closeMenus(m); m.hidden = !m.hidden; e.stopPropagation(); return; }
      if (t.hasAttribute('data-x')) {
        closeMenus(); var kind = t.getAttribute('data-x'); var rows = selectedOrAll();
        if (!rows.length) { A.toast('Nothing to export for the current filters.', 'info'); return; }
        if (kind === 'csv') A.exportCSV(o.exportName || 'export', o.cols, rows);
        else { A.printHTML(o.exportName || 'Report', '<h1>' + esc(o.exportName || 'Report') + '</h1><p class="muted">' + rows.length + ' records' + filterSummary() + '</p>' + A.tableHTML(o.cols, rows)); A.audit('Export', o.exportName || 'export', '', [], (kind === 'pdf' ? 'PDF' : 'Print') + ' of ' + rows.length + ' rows'); DB.save(); }
        return;
      }
      if (t.hasAttribute('data-selall')) { (tbody._rows || []).forEach(function (r) { st.sel[r.id] = t.checked; }); render(); return; }
      if (t.hasAttribute('data-sel')) { st.sel[t.getAttribute('data-sel')] = t.checked; render(); return; }
      if (t.hasAttribute('data-clearsel')) { st.sel = {}; render(); return; }
      if (t.hasAttribute('data-bulk')) {
        var b = o.bulk[+t.getAttribute('data-bulk')]; var sel = cacheSelected();
        Promise.resolve(b.fn(sel)).then(function (ok) { if (ok !== false) { st.sel = {}; render(); } });
        return;
      }
      if (t.hasAttribute('data-act')) {
        var tr = t.closest('tr'); var row = tbody._rows[+tr.getAttribute('data-i')];
        var acts = o.actions(row).filter(function (a) { return a.show !== false; });
        closeMenus(); acts[+t.getAttribute('data-act')].fn(row); return;
      }
      if (t.matches('tr.click') && o.onRow) { o.onRow(tbody._rows[+t.getAttribute('data-i')]); }
    });
    $('[data-size]', host).addEventListener('change', function (e) { st.size = +e.target.value; st.page = 1; render(); });
    function cacheSelected() { var all = o.rows() || []; return all.filter(function (r) { return st.sel[r.id]; }); }
    function selectedOrAll() { var s = cacheSelected(); return s.length ? s : cache; }
    function filterSummary() {
      var parts = [];
      if (st.q) parts.push('search "' + st.q + '"');
      (o.filters || []).forEach(function (f, i) { if (st.f[i]) { var s = $('[data-filter="' + i + '"]', host); parts.push(f.l + ': ' + s.options[s.selectedIndex].text); } });
      if (st.from || st.to) parts.push('date ' + (st.from ? A.date(st.from) : '…') + ' – ' + (st.to ? A.date(st.to) : '…'));
      return parts.length ? ' · ' + esc(parts.join(' · ')) : '';
    }
    // loading state, then render
    tbody.innerHTML = '<tr><td colspan="99"><div class="a-skel"><i></i><i></i><i></i><i></i></div></td></tr>';
    setTimeout(function () { fillFilterOptions(); render(); }, 60);
    return { refresh: function () { fillFilterOptions(); render(); }, state: st, setFilter: function (key, val) { (o.filters || []).forEach(function (f, i) { if (f.k === key) { st.f[i] = val; } }); } };
  };

  /* ---------- Shell + router ---------- */
  A.views = {};
  A.nav = [];
  A.go = function (hash) { if (location.hash === hash) route(); else location.hash = hash; };
  function route() {
    var main = $('#view'); if (!main) return;
    var parts = (location.hash || '#/dashboard').replace(/^#\/?/, '').split('/');
    var key = parts[0] || 'dashboard', param = parts.slice(1).map(decodeURIComponent);
    var view = A.views[key];
    $$('.a-side a').forEach(function (a) { var on = a.getAttribute('data-key') === key; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.body.classList.remove('side-open');
    if (!view) { main.innerHTML = notice('search', 'Page not found', 'The page you are looking for does not exist.', '<a class="a-btn primary" href="#/dashboard">Go to dashboard</a>'); return; }
    var perm = view.perm || key;
    if (perm !== 'profile' && !A.can(perm, 'view')) { main.innerHTML = notice('lock', 'Access denied', 'Your role (' + A.role().name + ') does not have permission to open ' + view.title + '. Ask a Super Admin to update your role.', '<a class="a-btn primary" href="#/dashboard">Back to dashboard</a>'); return; }
    document.title = view.title + ' | ' + A.settings().systemName;
    $('#crumb').textContent = view.group ? view.group + ' / ' + view.title : view.title;
    main.innerHTML = '';
    main.scrollTop = 0; window.scrollTo(0, 0);
    try { view.render(main, param); }
    catch (err) { console.error(err); main.innerHTML = notice('alert', 'Something went wrong', 'This page could not be displayed. Please reload, or reset the demo data from Settings if the problem continues.', '<button class="a-btn primary" onclick="location.reload()">Reload</button>'); }
    window.hydrateIcons(main);
  }
  function notice(icon, title, text, btn) { return '<div class="a-notice">' + A.icon(icon, 'w-12') + '<h2>' + esc(title) + '</h2><p>' + esc(text) + '</p>' + (btn || '') + '</div>'; }
  A.refresh = route;
  A.pageHead = function (title, sub, actionsHTML) {
    return '<div class="a-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div><div class="a-head-actions">' + (actionsHTML || '') + '</div></div>';
  };
  A.btn = function (label, icon, attrs, cls) { return '<button type="button" class="a-btn ' + (cls || 'primary') + '" ' + (attrs || '') + '>' + (icon ? A.icon(icon) : '') + esc(label) + '</button>'; };
  A.tabs = function (host, tabs, active) {
    host.innerHTML = '<div class="a-tabs" role="tablist">' + tabs.map(function (t, i) { return '<button type="button" role="tab" data-tab="' + i + '">' + (t.icon ? A.icon(t.icon) : '') + esc(t.label) + (t.count != null ? ' <span class="cnt">' + t.count + '</span>' : '') + '</button>'; }).join('') + '</div><div class="a-tab-body" role="tabpanel"></div>';
    var body = $('.a-tab-body', host);
    function show(i) { $$('[data-tab]', host).forEach(function (b) { var on = +b.getAttribute('data-tab') === i; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); body.innerHTML = ''; tabs[i].render(body); window.hydrateIcons(body); }
    $$('[data-tab]', host).forEach(function (b) { b.addEventListener('click', function () { show(+b.getAttribute('data-tab')); }); });
    show(active || 0);
  };
  A.statCard = function (label, value, icon, sub, link) {
    return '<' + (link ? 'a href="' + link + '"' : 'div') + ' class="a-stat">' + '<span class="ic">' + A.icon(icon, 'w-5') + '</span><div><span class="l">' + esc(label) + '</span><b>' + value + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></' + (link ? 'a' : 'div') + '>';
  };
  A.panel = function (title, body, extra, cls) { return '<section class="a-panel ' + (cls || '') + '"><div class="a-panel-h"><h3>' + esc(title) + '</h3>' + (extra || '') + '</div><div class="a-panel-b">' + body + '</div></section>'; };
  A.dl = function (pairs) { return '<dl class="a-dl">' + pairs.filter(Boolean).map(function (p) { return '<div><dt>' + esc(p[0]) + '</dt><dd>' + (p[1] === '' || p[1] == null ? '<span class="muted">—</span>' : p[1]) + '</dd></div>'; }).join('') + '</dl>'; };

  function buildShell() {
    var u = A.user(), role = A.role();
    var groups = [];
    A.nav.forEach(function (item) {
      var v = A.views[item]; if (!v || v.hidden) return;
      if (!A.can(v.perm || item, 'view')) return;
      var g = groups.filter(function (x) { return x.name === (v.group || ''); })[0];
      if (!g) { g = { name: v.group || '', items: [] }; groups.push(g); }
      g.items.push(item);
    });
    $('#sideNav').innerHTML = groups.map(function (g) {
      return (g.name ? '<p class="a-side-g">' + esc(g.name) + '</p>' : '') + g.items.map(function (k) { var v = A.views[k]; return '<a href="#/' + k + '" data-key="' + k + '">' + A.icon(v.icon || 'grid', 'w-5') + '<span>' + esc(v.navTitle || v.title) + '</span>' + (v.badge ? '<em data-badge="' + k + '"></em>' : '') + '</a>'; }).join('');
    }).join('') + '<p class="a-side-g">Account</p><a href="#/profile" data-key="profile">' + A.icon('user', 'w-5') + '<span>My Profile</span></a><a href="#" data-logout>' + A.icon('logout', 'w-5') + '<span>Logout</span></a>';
    $('#userChip').innerHTML = A.avatar(u.name, u.photo) + '<span><b>' + esc(u.name) + '</b><small>' + esc(role.name) + (u.clubId ? ' · ' + esc(A.nameOf('clubs', u.clubId)) : '') + '</small></span>';
    $('#sysName').textContent = A.settings().systemName;
    A.updateBadges();
  }
  A.updateBadges = function () {
    $$('[data-badge]').forEach(function (el) { var v = A.views[el.getAttribute('data-badge')]; var n = v.badge(); el.textContent = n || ''; el.hidden = !n; });
    var bell = $('#bellCount'); if (bell) { var n = A.views.approvals && A.can('approvals', 'view') ? A.views.approvals.badge() : 0; bell.textContent = n; bell.hidden = !n; }
  };
  A.boot = function () {
    DB.load();
    var u = A.user();
    if (!u || u.status !== 'Active') { A.endSession(u ? 'disabled' : ''); return; }
    if (A.sessionExpired()) { A.endSession('timeout'); return; }
    A.touchSession();
    document.addEventListener('DOMContentLoaded', function () {
      window.hydrateIcons();
      buildShell();
      $$('[data-theme-toggle]').forEach(function (btn) { btn.addEventListener('click', function () { var r = document.documentElement; var n = r.classList.contains('light') ? 'dark' : 'light'; r.classList.remove('light', 'dark'); r.classList.add(n); try { localStorage.setItem('theme', n); } catch (e) {} }); });
      $('#sideToggle').addEventListener('click', function () { document.body.classList.toggle('side-open'); });
      $('#sideScrim').addEventListener('click', function () { document.body.classList.remove('side-open'); });
      document.addEventListener('click', function (e) {
        var lo = e.target.closest('[data-logout]'); if (lo) { e.preventDefault(); A.confirm('Log out of the admin portal?', { ok: 'Logout' }).then(function (ok) { if (ok) { A.audit('Logout', 'auth', (A.user() || {}).id, [], 'Logged out'); DB.save(); A.endSession('loggedout'); } }); }
        var um = e.target.closest('#userBtn'); var menu = $('#userMenu');
        if (um) { menu.hidden = !menu.hidden; } else if (!e.target.closest('#userMenu')) menu.hidden = true;
        if (!e.target.closest('.a-dd')) $$('.a-dd-menu').forEach(function (m) { m.hidden = true; });
      });
      // idle timeout
      var bump = A.debounce(A.touchSession, 1000);
      ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(function (ev) { document.addEventListener(ev, bump, { passive: true }); });
      setInterval(function () { if (A.sessionExpired()) { A.audit('Logout', 'auth', (A.user() || {}).id, [], 'Session timed out'); DB.save(); A.endSession('timeout'); } }, 20000);
      window.addEventListener('hashchange', route);
      // other tabs changing data
      window.addEventListener('storage', function (e) { if (e.key === 'dclix_admin_db_v1') { DB.load(); A.updateBadges(); } });
      route();
    });
  };
})();
