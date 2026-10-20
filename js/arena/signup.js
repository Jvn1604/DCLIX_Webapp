/* ==========================================================
   Club signup (club-register.html)
   The club type is passed in the URL:  club-register.html?sport=karate
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = document.body.getAttribute('data-page');
  var sportId = window.currentSportId();
  var sport = window.getSport(sportId);
  var q = function (p) { return p + '.html?sport=' + sportId; };

  document.addEventListener('DOMContentLoaded', function () {
    if (page === 'club') initClub();
    window.hydrateIcons();
  });

  function initClub() {
    // Pre-selected only when the visitor came from a sport page (?sport=…); from the pricing page they must choose one.
    var chosen = new URLSearchParams(location.search).get('sport') && sport ? sport.id : '';
    var typeSel = $('#clubType');
    typeSel.innerHTML = '<option value="">Select your club type</option>' + window.SPORTS.map(function (s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('');
    typeSel.value = chosen;
    if (!chosen) sport = null;
    typeSel.addEventListener('change', function () { sportId = typeSel.value || 'taekwondo'; sport = window.getSport(typeSel.value); });
    var form = $('#clubForm'), modal = $('#successModal'), errBox = $('#clubErr'), btn = $('#clubSubmit');
    var qs = new URLSearchParams(location.search);
    // Plan chosen on the pricing page (?plan=…&billing=…); visitors from the competition portal pick one here.
    var PLANS = [['basic', 'Basic Plan', 100, 1000], ['standard', 'Standard Plan', 150, 1500], ['premium', 'Premium Plan', 200, 2000]];
    var plan = qs.get('plan'), billing = qs.get('billing') === 'yearly' ? 'yearly' : 'monthly';
    if (!PLANS.some(function (p) { return p[0] === plan; })) plan = 'basic';
    var pick = $('#planPick');
    pick.innerHTML = '<div class="pp-l"><label class="lbl" for="planSel">Your plan</label><select class="select" id="planSel">' +
      PLANS.map(function (p) { return ['monthly', 'yearly'].map(function (m) { return '<option value="' + p[0] + '-' + m + '">' + p[1].replace(' Plan', '') + ' — RM' + (m === 'monthly' ? p[2] + ' / month' : p[3] + ' / year') + '</option>'; }).join(''); }).join('') +
      '</select></div><a class="accent" href="../pricing.html">Compare plans</a>';
    pick.hidden = false;
    var planSel = $('#planSel');
    planSel.value = plan + '-' + billing;
    planSel.addEventListener('change', function () {
      var v = planSel.value.split('-'); plan = v[0]; billing = v[1];
      try { history.replaceState(null, '', '?sport=' + sportId + '&plan=' + plan + '&billing=' + billing); } catch (e) {}
    });
    // Field name in the API → input id on this page
    var FIELD_IDS = { username: 'username', branch: 'branch', clubCode: 'clubCode', clubName: 'clubName', headInstructor: 'headInstructor', sport: 'clubType', whatsapp: 'whatsapp', email: 'clubEmail', password: 'pw', password2: 'pw2' };
    function clearErrors() {
      errBox.classList.remove('show'); errBox.textContent = '';
      $$('.field-err', form).forEach(function (el) { el.remove(); });
      $$('[aria-invalid]', form).forEach(function (el) { el.removeAttribute('aria-invalid'); });
    }
    function showErrors(fields, summary) {
      var first = null;
      Object.keys(fields || {}).forEach(function (k) {
        var input = $('#' + (FIELD_IDS[k] || k)); if (!input) return;
        input.setAttribute('aria-invalid', 'true');
        var p = document.createElement('small'); p.className = 'field-err'; p.textContent = fields[k];
        input.insertAdjacentElement('afterend', p);
      });
      errBox.textContent = summary || 'Please fix the highlighted fields.'; errBox.classList.add('show');
      // Focus the first problem in page order, so the visitor starts at the top of the form
      first = $$('[aria-invalid="true"]', form)[0];
      if (first) first.focus();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      var v = function (id) { return $('#' + id).value.trim(); };
      var errs = {};
      if (!v('clubCode')) errs.clubCode = 'Club code is required.';
      if (!v('clubName')) errs.clubName = 'Club name is required.';
      if (!typeSel.value) errs.sport = 'Please choose your club type.';
      if (!/^[A-Za-z0-9._-]{3,30}$/.test(v('username'))) errs.username = 'Use 3–30 letters, numbers, . _ or -.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('clubEmail'))) errs.email = 'Please enter a valid email address.';
      var pw = $('#pw').value;
      if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) errs.password = 'Use at least 8 characters with upper-case, lower-case and a number.';
      if (pw !== $('#pw2').value) errs.password2 = 'Passwords do not match.';
      if (Object.keys(errs).length) return showErrors(errs);
      btn.disabled = true; btn.textContent = 'Saving…';
      window.dclixApi('signup.php', { body: {
        plan: plan, billing: billing, clubCode: v('clubCode'), username: v('username'), branch: v('branch'), clubName: v('clubName'), headInstructor: v('headInstructor'),
        sport: typeSel.value, sportName: sport ? sport.name : '', address1: v('address1'), address2: v('address2'), state: v('state'),
        country: $('#country').value, phoneCode: $('#phoneCode').value, whatsapp: v('whatsapp'), email: v('clubEmail'), password: pw
      } }).then(function (res) {
        // Only the one-time signup token is kept in the browser — never the password.
        try { sessionStorage.setItem('dclixSignup', JSON.stringify({ token: res.token, clubName: v('clubName'), clubCode: v('clubCode'), email: v('clubEmail'), plan: plan, billing: billing })); } catch (err) {}
        modal.classList.add('show');
        setTimeout(function () { location.href = q('payment'); }, 1500);
      }, function (err) {
        btn.disabled = false; btn.textContent = 'Save Club';
        if (err.offline) return showErrors({}, 'Online registration is not available yet. Please contact D-Clix at +603-7804 1412 to register your club.');
        showErrors(err.data && err.data.fields, err.message);
      });
    });
    $('#cancelBtn').addEventListener('click', function () { location.href = '../pricing.html'; });
  }
})();
