/* ==========================================================
   Payment page (payment.html) — step 2 of the website signup.
   Loads the saved registration from the server, lets the client
   confirm the plan and billing details, then sends them to the
   Billplz payment page. Card/bank details are entered only on
   Billplz, never on this site.
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  document.addEventListener('DOMContentLoaded', function () {
    var saved = {};
    try { saved = JSON.parse(sessionStorage.getItem('dclixSignup') || '{}'); } catch (e) {}
    // A link from the "complete your payment" email carries the token as ?t=…
    var urlToken = new URLSearchParams(location.search).get('t');
    var token = urlToken || saved.token || '';
    if (urlToken) { try { history.replaceState(null, '', location.pathname + '?sport=' + window.currentSportId()); } catch (e) {} }

    var form = $('#payForm'), err = $('#payErr'), btn = $('#payBtn'), sel = $('#pPlan');
    var PLANS = null, FEE = 0;
    function fail(msg, id) { err.textContent = msg; err.classList.add('show'); if (id) $(id).focus(); }
    function lock(msg) { fail(msg); btn.disabled = true; }
    function money(n) { return 'RM' + Number(n).toFixed(2); }

    if (!token) {
      lock('We could not find your registration. Please choose a plan and register your club first.');
      btn.insertAdjacentHTML('afterend', ' <a class="btn-primary" href="pricing.html">Choose a plan</a>');
      btn.hidden = true; return;
    }

    window.dclixApi('checkout.php', { body: { action: 'load', token: token } }).then(function (res) {
      PLANS = res.plans.items; FEE = +res.plans.fee;
      var lead = res.lead, b = lead.billingInfo || {};
      $('#pClubName').value = lead.clubName; $('#pClubCode').value = lead.clubCode;
      $('#bEmail').value = b.email || lead.email; $('#bPhone').value = b.phone || lead.phone || '';
      ['company', 'firstName', 'lastName', 'address', 'zip', 'city'].forEach(function (k) { var id = { company: '#bCompany', firstName: '#bFirst', lastName: '#bLast', address: '#bAddr', zip: '#bZip', city: '#bCity' }[k]; if (b[k]) $(id).value = b[k]; });
      if (b.country) $('#bCountry').value = b.country;
      sel.innerHTML = PLANS.map(function (p) {
        return ['monthly', 'yearly'].map(function (m) { return '<option value="' + p.id + '-' + m + '">' + p.name + ' – RM' + p[m] + (m === 'monthly' ? ' / month' : ' / year') + '</option>'; }).join('');
      }).join('');
      sel.value = lead.plan + '-' + lead.billing;
      if (!sel.value) sel.selectedIndex = 0;
      // Going back re-opens the form with the same plan; re-saving with the same email + password updates this registration.
      $('#payBack').href = 'club-register.html?plan=' + encodeURIComponent(lead.plan) + '&billing=' + encodeURIComponent(lead.billing);
      try { sessionStorage.setItem('dclixSignup', JSON.stringify({ token: token, clubName: lead.clubName })); } catch (e) {}
      updateSummary();
    }, function (e) {
      if (e.data && e.data.reason === 'paid') { lock(e.message); btn.insertAdjacentHTML('afterend', ' <a class="btn-ghost" href="admin-login.html">Log in</a>'); return; }
      lock(e.offline ? 'Online payment is not available yet. Please contact D-Clix at +603-7804 1412.' : e.message);
    });

    function current() { var p = sel.value.split('-'); var plan = PLANS.filter(function (x) { return x.id === p[0]; })[0]; return { plan: plan, billing: p[1] }; }
    function updateSummary() {
      var c = current(); if (!c.plan) return;
      var price = +c.plan[c.billing];
      $('#sumPlan').textContent = c.plan.name;
      $('#sumPriceLbl').textContent = c.billing === 'monthly' ? 'Monthly subscription' : 'Yearly subscription';
      $('#sumPrice').textContent = money(price);
      $('#sumFee').textContent = money(FEE);
      $('#sumTotal').textContent = money(price + FEE);
      $('#payNote').textContent = 'This payment covers your first ' + (c.billing === 'monthly' ? 'month' : 'year') + '. Your account is activated as soon as the payment is confirmed.';
    }
    sel.addEventListener('change', updateSummary);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('show');
      if (!PLANS) return;
      var required = [['#bFirst', 'Please enter your first name.'], ['#bLast', 'Please enter your last name.'], ['#bAddr', 'Please enter your address.'], ['#bZip', 'Please enter your zip code.'], ['#bCity', 'Please enter your city.']];
      for (var i = 0; i < required.length; i++) if (!$(required[i][0]).value.trim()) return fail(required[i][1], required[i][0]);
      if (!/^\S+@\S+\.\S+$/.test($('#bEmail').value.trim())) return fail('Please enter a valid email address.', '#bEmail');
      var c = current();
      btn.disabled = true; btn.textContent = 'Preparing payment…';
      window.dclixApi('checkout.php', { body: { action: 'pay', token: token, plan: c.plan.id, billing: c.billing, billingInfo: {
        company: $('#bCompany').value, firstName: $('#bFirst').value, lastName: $('#bLast').value, address: $('#bAddr').value,
        zip: $('#bZip').value, city: $('#bCity').value, country: $('#bCountry').value, email: $('#bEmail').value, phone: $('#bPhone').value } } })
        .then(function (res) {
          $('#successModal').classList.add('show');
          setTimeout(function () { location.href = res.url; }, 900);
        }, function (e2) {
          btn.disabled = false; btn.textContent = 'Continue to payment';
          var f = e2.data && e2.data.fields;
          var map = { firstName: '#bFirst', lastName: '#bLast', address: '#bAddr', zip: '#bZip', city: '#bCity', email: '#bEmail', phone: '#bPhone', plan: '#pPlan' };
          var k = f && Object.keys(f)[0];
          fail(k ? f[k] : e2.message, k ? map[k] : null);
        });
    });
  });
})();
