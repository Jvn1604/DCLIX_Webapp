/* signup result (payment-status.html?ref=…&state=…)
   boost -> portal -> here. ?state= is ignored, we ask api/status.php */
(function () {
  'use strict';
  var LOGIN = 'https://www.maclubsystem.com/index.php?/login/proceed';
  var ref = (new URLSearchParams(location.search).get('ref') || '').replace(/[^A-Za-z0-9-]/g, '');
  var box, tries = 0;
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // state -> [icon, css, title, text, buttons]
  function view(r) {
    var again = '<a class="btn-primary" href="club-register.html">Register again</a><a class="btn-ghost" href="tel:+60378041412">Call D-Clix</a>';
    switch (r.state) {
      case 'awaiting_payment': return ['clock', 'pending', 'Waiting for your payment', 'We have not received your payment yet. If you closed the payment page, you can open it again.',
        (r.payUrl && /^https:\/\//i.test(r.payUrl) ? '<a class="btn-primary" href="' + esc(r.payUrl) + '">Continue to payment</a>' : '') + '<button class="btn-ghost" type="button" data-reload>Check again</button>'];
      case 'paid_pending_approval': return ['checkcircle', 'paid', 'Payment received', 'Thank you! Your payment went through. Our team will check and approve your club, then email you the club code, user ID and password.', ''];
      case 'submitted_pending_approval': return ['checkcircle', 'paid', 'Application received', 'Thank you! We have your registration. Our team will contact you about payment and then activate your club.', ''];
      case 'approved': return ['checkcircle', 'paid', 'Your club is ready', 'Your club is active. Check your email for the club code, user ID and password.', '<a class="btn-primary" href="' + LOGIN + '">Log in to D-Clix</a>'];
      case 'payment_failed': case 'cancelled': case 'expired': return ['info', 'error', 'Payment not completed', 'Your payment was cancelled or did not go through, so you have not been charged.', again];
      case 'rejected': return ['info', 'error', 'Registration not approved', 'Please contact D-Clix at +603-7804 1412 and we will help you.', '<a class="btn-primary" href="tel:+60378041412">Call D-Clix</a>'];
      default: return ['info', 'error', 'Something went wrong', 'We could not find this registration. If money was taken from your account, please contact D-Clix at +603-7804 1412 and we will sort it out.', '<a class="btn-primary" href="../pricing.html">Back to plans</a>'];
    }
  }

  function show(r) {
    var s = view(r);
    var info = r.clubName ? '<p class="ps-ref"><b data-no-i18n>' + esc(r.clubName) + '</b>' + (r.plan ? ' · ' + esc(r.plan) : '') +
      (r.amount != null ? ' · ' + esc(r.currency || 'MYR') + ' ' + Number(r.amount).toFixed(2) : '') + '</p>' : '';
    var refLine = ref ? '<small class="ps-ref">Reference: <b data-no-i18n>' + esc(ref) + '</b></small>' : '';
    box.innerHTML = '<div class="ps-icon ' + s[1] + '">' + window.icon(s[0], 'w-8') + '</div><h1>' + s[2] + '</h1><p>' + s[3] + '</p>' + info + refLine +
      '<div class="form-actions">' + s[4] + '</div>';
    var btn = box.querySelector('[data-reload]'); if (btn) btn.addEventListener('click', load);
    // bank can take a moment, check again every 5s for ~2 min
    if (r.state === 'awaiting_payment' && tries < 24) setTimeout(load, 5000);
  }

  function load() {
    tries++;
    if (!ref) return show({});
    window.dclixApi('status.php?ref=' + encodeURIComponent(ref)).then(show, function (err) {
      if (err.status === 404) return show({});
      box.innerHTML = '<div class="ps-icon pending">' + window.icon('clock', 'w-8') + '</div><h1>Checking your registration</h1><p>' + esc(err.message) + '</p><div class="form-actions"><button class="btn-primary" type="button" data-reload>Try again</button></div>';
      box.querySelector('[data-reload]').addEventListener('click', load);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    box = document.getElementById('statusBox');
    box.innerHTML = '<div class="ps-icon pending">' + window.icon('clock', 'w-8') + '</div><h1>Checking your registration…</h1>';
    load();
  });
})();
