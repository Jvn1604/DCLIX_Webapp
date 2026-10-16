/* ==========================================================
   D-Clix Admin — login page
   Demo authentication in the browser: hashed passwords, lockout
   after repeated failures, optional 2FA code, remember me and a
   password-reset flow. A real deployment must do all of this on
   the server.
   ========================================================== */
(function () {
  'use strict';
  var A = window.ADMIN, DB = window.ADMIN_DB, $ = A.$, esc = A.esc;
  DB.load();
  var S = DB.data.settings;
  var existing = A.user();
  if (existing && existing.status === 'Active' && !A.sessionExpired()) { location.replace('index.html'); return; }

  var MESSAGES = {
    timeout: ['info', 'You were logged out after ' + S.sessionMinutes + ' minutes of inactivity.'],
    loggedout: ['ok', 'You have logged out.'],
    disabled: ['error', 'Your account is not active. Contact your administrator.'],
    reset: ['info', 'Demo data was reset. Log in again.']
  };
  var pending = null; // user waiting for a 2FA code
  var code = null, codeExp = 0;
  var resetFor = null;

  document.addEventListener('DOMContentLoaded', function () {
    window.hydrateIcons();
    var reason = new URLSearchParams(location.search).get('reason');
    if (reason && MESSAGES[reason]) msg(MESSAGES[reason][1], MESSAGES[reason][0]);
    $('#demoList').innerHTML = DB.data.users.filter(function (u) { return /@demo\.dclix$/.test(u.email); }).map(function (u) {
      return '<button type="button" class="demo-acc" data-email="' + esc(u.email) + '"><b>' + esc(DB.data.roles[u.role].name) + '</b><span>' + esc(u.email) + '</span></button>';
    }).join('');
    $('#demoPw').textContent = DB.DEMO_PASSWORD;
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
  });

  function show(id) { ['loginForm', 'codeForm', 'forgotForm', 'resetForm'].forEach(function (f) { $('#' + f).hidden = f !== id; }); var first = $('#' + id + ' input'); if (first) first.focus(); }
  function msg(text, type) { var m = $('#msg'); m.className = 'login-msg ' + (type || 'error'); m.innerHTML = A.icon(type === 'ok' ? 'checkcircle' : type === 'info' ? 'info' : 'alert', 'w-5') + '<span>' + esc(text) + '</span>'; m.hidden = !text; }
  function fieldErr(id, text) { var el = $('#' + id); el.classList.toggle('invalid', !!text); $('[data-err="' + id + '"]').textContent = text || ''; }
  function findUser(email) { email = email.trim().toLowerCase(); return DB.data.users.filter(function (u) { return u.email.toLowerCase() === email; })[0]; }

  function login(e) {
    e.preventDefault();
    msg('');
    var email = $('#email').value.trim(), pw = $('#password').value;
    fieldErr('email', !email ? 'Email is required.' : !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? 'Enter a valid email address.' : '');
    fieldErr('password', pw ? '' : 'Password is required.');
    if (!email || !pw || $('#email').classList.contains('invalid')) return;
    var u = findUser(email);
    var btn = $('#loginBtn'); btn.disabled = true; btn.classList.add('loading');
    setTimeout(function () { // small delay so the loading state is visible and brute force is slower
      btn.disabled = false; btn.classList.remove('loading');
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
        $('#demoCode').textContent = code; show('codeForm'); return;
      }
      complete(u);
    }, 450);
  }
  function verifyCode(e) {
    e.preventDefault();
    var v = $('#code').value.trim();
    if (!/^\d{6}$/.test(v)) { fieldErr('code', 'Enter the 6-digit code.'); return; }
    if (Date.now() > codeExp) { fieldErr('code', 'This code has expired. Go back and log in again.'); return; }
    if (v !== code) { A.logLogin(pending.email, false, 'Wrong 2FA code'); fieldErr('code', 'That code is not correct.'); return; }
    complete(pending);
  }
  function complete(u) {
    u.failed = 0; u.lockedUntil = 0; u.lastLogin = new Date().toISOString();
    DB.save();
    A.logLogin(u.email, true, (u.twoFactor || S.require2fa) ? 'Password + 2FA' : 'Password');
    var remember = $('#remember').checked;
    try { if (remember) localStorage.setItem('dclix_admin_remember_email', u.email); else localStorage.removeItem('dclix_admin_remember_email'); } catch (e) {}
    A.startSession(u, remember);
    A.audit('Login', 'auth', u.id, [], u.name + ' logged in'); DB.save();
    location.replace('index.html' + (u.mustChange ? '#/profile' : ''));
  }
  function forgot(e) {
    e.preventDefault();
    var email = $('#fpEmail').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fieldErr('fpEmail', 'Enter a valid email address.'); return; }
    fieldErr('fpEmail', '');
    var u = findUser(email);
    A.logLogin(email, false, 'Password reset requested');
    // Same message either way, so the form does not reveal which emails exist.
    resetFor = u ? { user: u, token: String(Math.floor(100000 + Math.random() * 900000)), exp: Date.now() + 15 * 60000 } : null;
    $('#resetInfo').innerHTML = 'If an account exists for <b>' + esc(email) + '</b>, a reset code has been sent.' + (resetFor ? '<br><span class="demo-note">Demo: no email is sent. Your code is <b>' + resetFor.token + '</b></span>' : '');
    show('resetForm');
  }
  function resetPw(e) {
    e.preventDefault();
    var t = $('#rsCode').value.trim(), p1 = $('#rsPw').value, p2 = $('#rsPw2').value;
    var bad = false;
    if (!resetFor || t !== resetFor.token || Date.now() > resetFor.exp) { fieldErr('rsCode', 'The code is incorrect or has expired.'); bad = true; } else fieldErr('rsCode', '');
    var weak = p1.length < 8 || !/[A-Z]/.test(p1) || !/[a-z]/.test(p1) || !/[0-9]/.test(p1);
    fieldErr('rsPw', weak ? 'Use at least 8 characters with upper-case, lower-case and a number.' : '');
    fieldErr('rsPw2', p1 !== p2 ? 'Passwords do not match.' : '');
    if (bad || weak || p1 !== p2) return;
    var u = resetFor.user; u.salt = DB.newSalt(); u.pwHash = DB.hashPassword(p1, u.salt); u.failed = 0; u.mustChange = false;
    if (u.status === 'Locked') { u.status = 'Active'; u.lockedUntil = 0; }
    A.audit('Update', 'auth', u.id, [{ field: 'password', from: '••••', to: '•••• (reset)' }], 'Password reset via code'); DB.save();
    resetFor = null; $('#resetForm').reset();
    show('loginForm'); $('#email').value = u.email; msg('Password updated. You can log in now.', 'ok');
  }
})();
