/* ==========================================================
   Payment page (payment.html)
   DEMO ONLY: nothing is charged and card details are never
   stored or sent anywhere. Connect a real payment gateway at
   the TODO below before going live.
   ========================================================== */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var PLANS = {
    basic:    { name: 'Basic Plan',    monthly: 100, yearly: 1000 },
    standard: { name: 'Standard Plan', monthly: 150, yearly: 1500 },
    premium:  { name: 'Premium Plan',  monthly: 200, yearly: 2000 }
  };
  var FEE = 1.2; // gateway fee per online payment (RM)

  // Standard card-number checksum, catches most typing mistakes before submitting.
  function luhnOk(num) {
    var sum = 0, dbl = false;
    for (var i = num.length - 1; i >= 0; i--) {
      var d = +num.charAt(i);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return sum % 10 === 0;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var saved = {}, account = null;
    try { saved = JSON.parse(sessionStorage.getItem('dclixClub') || '{}'); } catch (e) {}
    try { account = JSON.parse(localStorage.getItem('dclixClubAccount') || 'null'); } catch (e) {}
    var params = new URLSearchParams(location.search);
    var club = saved.clubName ? saved : (account && account.clubName ? account : {});

    // ----- prefill: club from registration (or an existing club), plan from the pricing page -----
    $('#pClubName').value = club.clubName || '';
    $('#pClubCode').value = club.clubCode || '';
    $('#bEmail').value = club.email || '';

    // ----- plan dropdown -----
    var sel = $('#pPlan');
    Object.keys(PLANS).forEach(function (id) {
      ['monthly', 'yearly'].forEach(function (mode) {
        var o = document.createElement('option');
        o.value = id + '-' + mode;
        o.textContent = PLANS[id].name + ' \u2013 RM' + PLANS[id][mode] + (mode === 'monthly' ? ' / month' : ' / year');
        sel.appendChild(o);
      });
    });
    var wantPlan = params.get('plan') || saved.plan, wantMode = params.get('billing') || saved.billing;
    var startPlan = PLANS[wantPlan] ? wantPlan : 'basic';
    var startMode = wantMode === 'yearly' ? 'yearly' : 'monthly';
    sel.value = startPlan + '-' + startMode;

    // ----- hint: club not registered yet -----
    var regLink = null;
    if (!club.clubName) {
      var hint = document.createElement('div');
      hint.style.cssText = 'border:1px solid var(--line2);border-radius:16px;padding:16px 20px;margin-bottom:24px;color:var(--muted);line-height:1.6';
      hint.innerHTML = 'Is your club not registered yet? <a id="regLink" href="competition.html" style="color:var(--accent-light);text-decoration:underline;font-weight:600">Register it here</a>.';
      $('#payForm').parentNode.insertBefore(hint, $('#payForm'));
      regLink = hint.querySelector('#regLink');
    }

    function money(n) { return 'RM' + n.toFixed(2); }
    function updateSummary() {
      var parts = sel.value.split('-'), p = PLANS[parts[0]], mode = parts[1];
      var price = p[mode];
      $('#sumPlan').textContent = p.name;
      $('#sumPriceLbl').textContent = mode === 'monthly' ? 'Monthly subscription' : 'Yearly subscription';
      $('#sumPrice').textContent = money(price);
      $('#sumFee').textContent = money(FEE);
      $('#sumTotal').textContent = money(price + FEE);
      if (regLink) regLink.href = 'competition.html?plan=' + parts[0] + '&billing=' + mode;
      $('#payNote').textContent = 'This card will be automatically charged each ' + (mode === 'monthly' ? 'month' : 'year') + '.';
    }
    sel.addEventListener('change', updateSummary);
    updateSummary();

    // ----- card input formatting -----
    $('#pCard').addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 19);
      e.target.value = d.replace(/(.{4})/g, '$1 ').trim();
    });
    $('#pExp').addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 4);
      e.target.value = d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d;
    });
    $('#pCvc').addEventListener('input', function (e) { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); });

    // ----- submit -----
    var form = $('#payForm'), err = $('#payErr'), btn = $('#payBtn');
    function fail(msg, id) { err.textContent = msg; err.classList.add('show'); if (id) $(id).focus(); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      err.classList.remove('show');

      var required = [['#pClubName', 'Please enter your club name.'], ['#bFirst', 'Please enter your first name.'], ['#bLast', 'Please enter your last name.'],
                      ['#bAddr', 'Please enter your address.'], ['#bZip', 'Please enter your zip code.'], ['#bCity', 'Please enter your city.']];
      for (var i = 0; i < required.length; i++) {
        if (!$(required[i][0]).value.trim()) return fail(required[i][1], required[i][0]);
      }
      if (!/^\S+@\S+\.\S+$/.test($('#bEmail').value.trim())) return fail('Please enter a valid email address.', '#bEmail');

      var card = $('#pCard').value.replace(/\D/g, '');
      if (card.length < 13 || card.length > 19 || !luhnOk(card)) return fail('Please enter a valid card number.', '#pCard');
      var m = $('#pExp').value.match(/^(\d{2})\/(\d{2})$/);
      if (!m || +m[1] < 1 || +m[1] > 12) return fail('Please enter the expiry date as MM/YY.', '#pExp');
      var now = new Date(), yy = now.getFullYear() % 100, mm = now.getMonth() + 1;
      if (+m[2] < yy || (+m[2] === yy && +m[1] < mm)) return fail('This card has expired.', '#pExp');
      if ($('#pCvc').value.length < 3) return fail('Please enter the card security code (CVC).', '#pCvc');

      // TODO: send the payment to your payment gateway here. Card details must go
      // straight to the gateway (hosted fields / checkout), never to your own server or storage.
      btn.disabled = true; btn.textContent = 'Processing...';
      setTimeout(function () {
        try {
          var chosen = sel.value.split('-');
          localStorage.setItem('dclixClubAccount', JSON.stringify({
            clubName: $('#pClubName').value.trim(), clubCode: $('#pClubCode').value.trim(), email: $('#bEmail').value.trim(),
            plan: PLANS[chosen[0]].name + ' (' + chosen[1] + ')'
          }));
          sessionStorage.removeItem('dclixClub');
        } catch (e2) {}
        $('#successModal').classList.add('show');
        setTimeout(function () { location.href = 'dashboard.html?sport=' + window.currentSportId(); }, 2000);
      }, 1200);
    });
  });
})();
