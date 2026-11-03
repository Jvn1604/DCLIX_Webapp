/* club signup (club-register.html?sport=karate)
   api/signup.php sends it to the portal, then we go to boost to pay */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var page = document.body.getAttribute('data-page');
  var sportId = window.currentSportId();
  var sport = window.getSport(sportId);

  document.addEventListener('DOMContentLoaded', function () {
    if (page === 'club') initClub();
    window.hydrateIcons();
  });

  function newKey() {
    var a = new Uint8Array(16); window.crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  function initClub() {
    // only preselect when coming from a sport page
    var chosen = new URLSearchParams(location.search).get('sport') && sport ? sport.id : '';
    var typeSel = $('#clubType');
    typeSel.innerHTML = '<option value="">Select your club type</option>' + window.SPORTS.map(function (s) { return '<option value="' + s.id + '">' + s.name + '</option>'; }).join('');
    typeSel.value = chosen;
    if (!chosen) sport = null;
    typeSel.addEventListener('change', function () { sportId = typeSel.value || 'taekwondo'; sport = window.getSport(typeSel.value); });
    var form = $('#clubForm'), modal = $('#successModal'), errBox = $('#clubErr'), btn = $('#clubSubmit');
    var qs = new URLSearchParams(location.search);
    // plan from the pricing page (?plan=…&billing=…)
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
    // api field -> input id
    var FIELD_IDS = { ssmFile: 'ssmDrop', regNo: 'regNo', username: 'username', branch: 'branch', clubCode: 'clubCode', clubName: 'clubName', headInstructor: 'headInstructor', sport: 'clubType', whatsapp: 'whatsapp', email: 'clubEmail', password: 'pw', password2: 'pw2', promoCode: 'promoCode', terms: 'termsRow', plan: 'planSel' };
    // one key per form, so a double click or retry doesnt make 2 orders in the portal
    var key = newKey();
    // ssm cert: pdf/jpg/png max 5MB. checked here only, portal cant take it yet
    var MAX_FILE = 5 * 1024 * 1024;
    var drop = $('#ssmDrop'), fileIn = $('#ssmFile'), clearBtn = $('#ssmClear'), ssm = null;
    function fileProblem(f) {
      if (!f) return 'Please upload your SSM / registration certificate.';
      if (!/^(application\/pdf|image\/jpeg|image\/png)$/.test(f.type) && !/\.(pdf|jpe?g|png)$/i.test(f.name)) return 'Upload a PDF, JPG or PNG file.';
      if (f.size > MAX_FILE) return 'This file is larger than 5 MB. Please upload a smaller copy.';
      return null;
    }
    function fileSize(n) { return n < 1048576 ? Math.max(1, Math.round(n / 1024)) + ' KB' : (n / 1048576).toFixed(1) + ' MB'; }
    function setFile(f) {
      ssm = f || null;
      var bad = ssm && fileProblem(ssm);
      drop.classList.toggle('has-file', !!ssm); drop.classList.toggle('bad', !!bad);
      $('#ssmName').textContent = ssm ? ssm.name : 'Upload your SSM certificate';
      $('#ssmHint').textContent = !ssm ? 'PDF, JPG or PNG, up to 5 MB. Drag the file here or choose it.' : bad || fileSize(ssm.size);
      $('#ssmBtn').textContent = ssm ? 'Change' : 'Choose file';
      clearBtn.hidden = !ssm;
      drop.removeAttribute('aria-invalid');
      var err = drop.nextElementSibling; if (err && err.classList.contains('field-err')) err.remove();
    }
    fileIn.addEventListener('change', function () { setFile(fileIn.files[0]); });
    clearBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); fileIn.value = ''; setFile(null); });
    drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
    drop.addEventListener('drop', function (e) {
      e.preventDefault(); drop.classList.remove('drag');
      var f = e.dataTransfer && e.dataTransfer.files[0]; if (!f) return;
      try { fileIn.files = e.dataTransfer.files; } catch (err) { /* old browsers */ }
      setFile(f);
    });
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
      // focus first error
      first = $$('[aria-invalid="true"]', form)[0];
      if (first) (first.id === 'termsRow' ? $('#terms') : first).focus();
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      var v = function (id) { return $('#' + id).value.trim(); };
      var errs = {};
      if (!v('clubCode')) errs.clubCode = 'Club code is required.';
      if (!v('clubName')) errs.clubName = 'Club name is required.';
      if (!typeSel.value) errs.sport = 'Please choose your club type.';
      if (!v('regNo')) errs.regNo = 'Registration number is required (SSM / ROS (JPPM) / PJS).';
      var fp = fileProblem(ssm); if (fp) errs.ssmFile = fp;
      if (!/^[A-Za-z0-9._-]{3,30}$/.test(v('username'))) errs.username = 'Use 3–30 letters, numbers, . _ or -.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v('clubEmail'))) errs.email = 'Please enter a valid email address.';
      var pw = $('#pw').value;
      if (pw.length < 8 || !/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) errs.password = 'Use at least 8 characters with upper-case, lower-case and a number.';
      if (pw !== $('#pw2').value) errs.password2 = 'Passwords do not match.';
      // the portal needs these too
      if (v('headInstructor').length < 2) errs.headInstructor = 'Please enter the head instructor name.';
      if (!/^[0-9 -]{6,15}$/.test(v('whatsapp'))) errs.whatsapp = 'Please enter a valid phone number.';
      if (!$('#terms').checked) errs.terms = 'Please accept the terms to continue.';
      if (Object.keys(errs).length) return showErrors(errs);
      btn.disabled = true; btn.textContent = 'Saving…';
      window.dclixApi('signup.php', { body: {
        plan: plan, billing: billing, clubCode: v('clubCode'), username: v('username'), branch: v('branch'), regNo: v('regNo'), clubName: v('clubName'), headInstructor: v('headInstructor'),
        sport: typeSel.value, sportName: sport ? sport.name : '', address1: v('address1'), address2: v('address2'), state: v('state'),
        country: $('#country').value, phoneCode: $('#phoneCode').value, whatsapp: v('whatsapp'), email: v('clubEmail'), password: pw,
        promoCode: v('promoCode'), acceptedTerms: true, requestKey: key
      } }).then(function (res) {
        // step 3: wait for admin approval, payment opens after that. ref kept so they can come back later
        // + a few details so step 3 can show them even before the portal answers
        var p = PLANS.filter(function (x) { return x[0] === plan; })[0];
        try { localStorage.setItem('dclix-reg', JSON.stringify({ ref: res.ref || '', at: Date.now(), clubName: v('clubName'), plan: p[1].replace(' Plan', '') + ' (' + billing + ')',
          amount: billing === 'monthly' ? p[2] : p[3], payUrl: res.url && /^https:\/\//i.test(res.url) ? res.url : '' })); } catch (e) {}
        var next = 'payment-status.html?ref=' + encodeURIComponent(res.ref || '');
        modal.classList.add('show');
        setTimeout(function () { location.href = next; }, 1500);
      }, function (err) {
        btn.disabled = false; btn.textContent = 'Save Club';
        // they will change something, so a fresh key
        if (err.status === 409 || err.status === 422) key = newKey();
        showErrors(err.data && err.data.fields, err.message);
      });
    });
    $('#cancelBtn').addEventListener('click', function () { location.href = '../pricing.html'; });
  }
})();
