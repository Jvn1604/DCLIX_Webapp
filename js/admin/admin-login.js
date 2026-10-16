/* ==========================================================
   D-Clix Admin — login page
   Server mode (API reachable): the PHP API checks the password
   (bcrypt), locks accounts, emails 2FA and reset codes.
   Demo mode (no server): the same flow runs in the browser
   with sample accounts — not real security.
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, $ = A.$, esc = A.esc;
  var MODE = 'demo';
  var S = null; // demo-mode settings

  var MESSAGES = {
    timeout: ['info', 'You were logged out after a period of inactivity.'],
    expired: ['info', 'Your session has ended. Please log in again.'],
    loggedout: ['ok', 'You have logged out.'],
    disabled: ['error', 'Your account is not active. Contact your administrator.'],
    club: ['error', 'Your club account is not active. Contact D-Clix support.'],
    reset: ['info', 'Demo data was reset. Log in again.']
  };
  /* Admin page to open after login (?next=#/leads/LD0001), only if it is a safe in-app path. */
  function nextHash() { var n = new URLSearchParams(location.search).get('next') || ''; return /^#\/[\w\/%.-]+$/.test(n) ? n : ''; }
  var pending = null, code = null, codeExp = 0; // 2FA (demo) / pending id (server)
  var resetFor = null;                         // password reset in progress

  document.addEventListener('DOMContentLoaded', function () {
    window.hydrateIcons();
    var reason = new URLSearchParams(location.search).get('reason');
    if (reason && MESSAGES[reason]) msg(MESSAGES[reason][1], MESSAGES[reason][0]);
    wire();
    decideMode().then(function () {
      var s = A.session();
      if (MODE === 'api' && s && s.token) {
        window.dclixApi('auth.php', { body: { action: 'me' }, token: s.token }).then(function () { location.replace('index.html' + nextHash()); }, function () {});
      } else if (MODE === 'demo' && s && !s.token) {
        var u = A.user(); if (u && u.status === 'Active' && !A.sessionExpired()) location.replace('index.html' + nextHash());
      }
    });
  });

  function decideMode() {
    if (!DB.apiConfigured()) return Promise.resolve(startDemo());
    return window.dclixApi('public.php?action=health').then(function () {
      MODE = 'api';
      $('#demoBox').hidden = true;
      $('#codeNote').textContent = 'We emailed a 6-digit code to you.';
    }, function () {
      startDemo();
      msg('The D-Clix server is not reachable, so this is the offline demo with sample data.', 'info');
    });
  }
  function startDemo() {
    MODE = 'demo';
    DB.load(); S = DB.data.settings;
    $('#demoList').innerHTML = DB.data.users.filter(function (u) { return /@demo\.dclix$/.test(u.email); }).map(function (u) {
      return '<button type="button" class="demo-acc" data-email="' + esc(u.email) + '"><b>' + esc(DB.data.roles[u.role].name) + '</b><span>' + esc(u.email) + '</span></button>';
    }).join('');
    $('#demoPw').textContent = DB.DEMO_PASSWORD;
    $('#demoBox').hidden = false;
  }

  function wire() {
    $('#demoList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-email]'); if (!b) return;
      $('#email').value = b.getAttribute('data-email'); $('#password').value = DB.DEMO_PASSWORD; $('#password').focus();
    });
    var saved = null; try { saved = localStorage.getItem('dclix_admin_remember_email'); } catch (e) {}
    if (saved) { $('#email').value = saved; $('#remember').checked = true; }
    $('#togglePw').addEventListener('click', function () {
      var p = $('#password'); var show = p.type === 'password'; p.type = show ? 'text' : 'password';
      this.innerHTML = A.icon(show ? 'eyeoff' : 'eye', 'w-5'); this.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); this.setAttribute('aria-pressed', String(show));
    });
    $('#loginForm').addEventListener('submit', login);
    $('#codeForm').addEventListener('submit', verifyCode);
    $('#codeBack').addEventListener('click', function () { show('loginForm'); pending = null; });
    $('#forgotLink').addEventListener('click', function (e) { e.preventDefault(); $('#fpEmail').value = $('#email').value; show('forgotForm'); });
    $('#forgotBack').addEventListener('click', function () { show('loginForm'); });
    $('#forgotForm').addEventListener('submit', forgot);
    $('#resetForm').addEventListener('submit', resetPw);
    $('#resetBack').addEventListener('click', function () { show('loginForm'); });
  }

  function show(id) { ['loginForm', 'codeForm', 'forgotForm', 'resetForm'].forEach(function (f) { $('#' + f).hidden = f !== id; }); var first = $('#' + id + ' input'); if (first) first.focus(); }
  function msg(text, type) { var m = $('#msg'); m.className = 'login-msg ' + (type || 'error'); m.innerHTML = A.icon(type === 'ok' ? 'checkcircle' : type === 'info' ? 'info' : 'alert', 'w-5') + '<span>' + esc(text) + '</span>'; m.hidden = !text; }
  function fieldErr(id, text) { var el = $('#' + id); el.classList.toggle('invalid', !!text); $('[data-err="' + id + '"]').textContent = text || ''; }
  function busy(btn, on) { btn.disabled = on; btn.classList.toggle('loading', on); }
  function findUser(email) { email = email.trim().toLowerCase(); return DB.data.users.filter(function (u) { return u.email.toLowerCase() === email; })[0]; }
  function rememberEmail(email) { try { if ($('#remember').checked) localStorage.setItem('dclix_admin_remember_email', email); else localStorage.removeItem('dclix_admin_remember_email'); } catch (e) {} }
  function devNote(el, codeValue) { el.innerHTML = codeValue ? 'Test setup: emails are not sent yet, so your code is <b>' + esc(codeValue) + '</b>' : ''; el.hidden = !codeValue; }

  /* ---------- Login ---------- */
  function login(e) {
    e.preventDefault();
    msg('');
    var email = $('#email').value.trim(), pw = $('#password').value;
    fieldErr('email', !email ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Enter a valid email address.' : '');
    fieldErr('password', pw ? '' : 'Password is required.');
    if (!email || !pw || $('#email').classList.contains('invalid')) return;
    var btn = $('#loginBtn'); busy(btn, true);
    if (MODE === 'api') {
      window.dclixApi('auth.php', { body: { action: 'login', email: email, password: pw, remember: $('#remember').checked } }).then(function (res) {
        busy(btn, false);
        if (res.need2fa) { pending = res.pending; devNote($('#codeDev'), res.devCode); show('codeForm'); return; }
        finishApi(res);
      }, function (err) {
        busy(btn, false);
        msg(err.message);
        if (err.status === 401) { $('#password').value = ''; $('#password').focus(); }
      });
      return;
    }
    setTimeout(function () { busy(btn, false); demoLogin(email, pw); }, 450);
  }
  function finishApi(res) {
    rememberEmail(res.user.email);
    A.startSession(res.user, $('#remember').checked, res.token);
    location.replace('index.html' + (res.user.mustChange ? '#/profile' : nextHash()));
  }
  function verifyCode(e) {
    e.preventDefault();
    var v = $('#code').value.trim();
    if (!/^\d{6}$/.test(v)) { fieldErr('code', 'Enter the 6-digit code.'); return; }
    if (MODE === 'api') {
      window.dclixApi('auth.php', { body: { action: 'verify2fa', pending: pending, code: v } }).then(finishApi, function (err) { fieldErr('code', err.message); });
      return;
    }
    if (Date.now() > codeExp) { fieldErr('code', 'This code has expired. Go back and log in again.'); return; }
    if (v !== code) { A.logLogin(pending.email, false, 'Wrong 2FA code'); fieldErr('code', 'That code is not correct.'); return; }
    completeDemo(pending);
  }

  /* ---------- Forgot / reset ---------- */
  function forgot(e) {
    e.preventDefault();
    var email = $('#fpEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fieldErr('fpEmail', 'Enter a valid email address.'); return; }
    fieldErr('fpEmail', '');
    var info = 'If an account exists for <b>' + esc(email) + '</b>, a reset code has been sent.';
    if (MODE === 'api') {
      window.dclixApi('auth.php', { body: { action: 'forgot', email: email } }).then(function (res) {
        resetFor = { pending: res.pending };
        $('#resetInfo').innerHTML = info + (res.devCode ? '<br><span class="demo-note">Test setup: emails are not sent yet, so your code is <b>' + esc(res.devCode) + '</b></span>' : '');
        show('resetForm');
      }, function (err) { fieldErr('fpEmail', err.message); });
      return;
    }
    var u = findUser(email);
    A.logLogin(email, false, 'Password reset requested');
    resetFor = u ? { user: u, token: String(Math.floor(100000 + Math.random() * 900000)), exp: Date.now() + 15 * 60000 } : null;
    $('#resetInfo').innerHTML = info + (resetFor ? '<br><span class="demo-note">Demo: no email is sent. Your code is <b>' + resetFor.token + '</b></span>' : '');
    show('resetForm');
  }
  function resetPw(e) {
    e.preventDefault();
    var t = $('#rsCode').value.trim(), p1 = $('#rsPw').value, p2 = $('#rsPw2').value;
    var weak = p1.length < 8 || !/[A-Z]/.test(p1) || !/[a-z]/.test(p1) || !/[0-9]/.test(p1);
    fieldErr('rsPw', weak ? 'Use at least 8 characters with upper-case, lower-case and a number.' : '');
    fieldErr('rsPw2', p1 !== p2 ? 'Passwords do not match.' : '');
    fieldErr('rsCode', /^\d{6}$/.test(t) ? '' : 'Enter the 6-digit code.');
    if (weak || p1 !== p2 || !/^\d{6}$/.test(t)) return;
    if (MODE === 'api') {
      window.dclixApi('auth.php', { body: { action: 'reset', pending: resetFor ? resetFor.pending : '', code: t, password: p1 } }).then(function (res) {
        resetFor = null; $('#resetForm').reset(); show('loginForm'); $('#email').value = res.email; msg('Password updated. You can log in now.', 'ok');
      }, function (err) { fieldErr(err.data && err.data.field === 'password' ? 'rsPw' : 'rsCode', err.message); });
      return;
    }
    if (!resetFor || t !== resetFor.token || Date.now() > resetFor.exp) { fieldErr('rsCode', 'The code is incorrect or has expired.'); return; }
    var u = resetFor.user; u.salt = DB.newSalt(); u.pwHash = DB.hashPassword(p1, u.salt); u.failed = 0; u.mustChange = false;
    if (u.status === 'Locked') { u.status = 'Active'; u.lockedUntil = 0; }
    A.audit('Update', 'auth', u.id, [{ field: 'password', from: '••••', to: '•••• (reset)' }], 'Password reset via code'); DB.save();
    resetFor = null; $('#resetForm').reset();
    show('loginForm'); $('#email').value = u.email; msg('Password updated. You can log in now.', 'ok');
  }

  /* ---------- Demo mode (browser only) ---------- */
  function demoLogin(email, pw) {
    var u = findUser(email);
    if (u && u.status === 'Locked') {
      if (u.lockedUntil && Date.now() > u.lockedUntil) { u.status = 'Active'; u.failed = 0; u.lockedUntil = 0; DB.save(); }
      else { A.logLogin(email, false, 'Account locked'); msg('This account is locked after too many failed attempts. Try again in ' + Math.max(1, Math.ceil(((u.lockedUntil || Date.now()) - Date.now()) / 60000)) + ' minute(s), or ask an administrator to unlock it.'); return; }
    }
    if (!u || DB.hashPassword(pw, u.salt) !== u.pwHash) {
      if (u) {
        u.failed = (u.failed || 0) + 1;
        if (u.failed >= S.maxFailedLogins) { u.status = 'Locked'; u.lockedUntil = Date.now() + S.lockMinutes * 60000; }
        DB.save();
      }
      A.logLogin(email, false, u ? 'Wrong password' + (u.status === 'Locked' ? ' — account locked' : '') : 'Unknown email');
      var left = u ? S.maxFailedLogins - u.failed : 0;
      msg('Email or password is incorrect.' + (u && left > 0 && left <= 2 ? ' ' + left + ' attempt(s) left before the account is locked.' : u && u.status === 'Locked' ? ' The account is now locked for ' + S.lockMinutes + ' minutes.' : ''));
      $('#password').value = ''; $('#password').focus();
      return;
    }
    if (u.status !== 'Active') { A.logLogin(email, false, 'Account ' + u.status); msg('Your account is ' + u.status.toLowerCase() + '. Contact your administrator.'); return; }
    var club = u.clubId ? DB.data.clubs.filter(function (c) { return c.id === u.clubId; })[0] : null;
    if (club && club.status !== 'Active') { A.logLogin(email, false, 'Club ' + club.status); msg(club.name + ' is ' + club.status.toLowerCase() + '. Contact D-Clix support.'); return; }
    if (u.twoFactor || S.require2fa) {
      pending = u; code = String(Math.floor(100000 + Math.random() * 900000)); codeExp = Date.now() + 5 * 60000;
      devNote($('#codeDev'), code); show('codeForm'); return;
    }
    completeDemo(u);
  }
  function completeDemo(u) {
    u.failed = 0; u.lockedUntil = 0; u.lastLogin = new Date().toISOString();
    DB.save();
    A.logLogin(u.email, true, (u.twoFactor || S.require2fa) ? 'Password + 2FA' : 'Password');
    rememberEmail(u.email);
    A.startSession(u, $('#remember').checked);
    A.audit('Login', 'auth', u.id, [], u.name + ' logged in'); DB.save();
    location.replace('index.html' + (u.mustChange ? '#/profile' : nextHash()));
  }
})();
