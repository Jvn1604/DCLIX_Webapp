/* signup status (payment-status.html?ref=…)
   step 3 waits for admin approval, step 4 pays (boost), step 5 done.
   ?state= from boost is ignored, we always ask api/status.php.
   the ref is kept on this device (dclix-reg) so theme.js can bring people back here */
(function () {
  'use strict';
  var LOGIN = 'https://www.maclubsystem.com/index.php?/login/proceed';
  var KEY = 'dclix-reg';
  var STEPS = ['Choose plan', 'Club details', 'Approval', 'Payment', 'Done'];
  var box, list, timer, last, tries = 0;
  var ref = (new URLSearchParams(location.search).get('ref') || '').replace(/[^A-Za-z0-9-]/g, '');

  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { return null; } }
  function mine() { var s = saved(); return s && s.ref === ref ? s : null; }
  function keep() { var s = mine() || { ref: ref, at: Date.now() }; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function forget() { try { localStorage.removeItem(KEY); } catch (e) {} }
  if (!ref) ref = ((saved() || {}).ref || '').replace(/[^A-Za-z0-9-]/g, '');

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function payLink(r, label) { return r.payUrl && /^https:\/\//i.test(r.payUrl) ? '<a class="btn-primary" href="' + esc(r.payUrl) + '">' + label + '</a>' : ''; }

  // top stepper, n = current step (1-5)
  function steps(n) {
    list.innerHTML = STEPS.map(function (t, i) {
      var s = i + 1, cls = s < n || (s === 5 && n === 5) ? 'done' : s === n ? 'now' : '';
      var dot = cls === 'done' ? window.icon('check', 'w-4') : s;
      var inner = '<span class="n">' + dot + '</span><span class="t">' + t + '</span>';
      return '<li class="' + cls + '"' + (s === n ? ' aria-current="step"' : '') + '>' + (s === 1 ? '<a href="../pricing.html">' + inner + '</a>' : inner) + '</li>';
    }).join('');
  }

  // little timeline inside the card: details saved -> approval -> payment
  function track(n) {
    var rows = [['Details saved', 'We have your club details.'], ['Admin approval', n === 3 ? 'Usually 5–10 minutes.' : 'Your club is approved.'], ['Payment', n > 4 ? 'Payment received.' : n === 4 ? 'Ready when you are.' : 'Opens after approval.']];
    return '<ol class="ps-track">' + rows.map(function (r, i) {
      var s = i + 2, cls = s < n || n === 5 ? 'done' : s === n ? 'now' : '';
      return '<li class="' + cls + '"><span class="d">' + (cls === 'done' ? window.icon('check', 'w-4') : '') + '</span><span><b>' + r[0] + '</b><small>' + r[1] + '</small></span></li>';
    }).join('') + '</ol>';
  }

  // state -> {step, icon, css, title, text, buttons, extra}
  function view(r) {
    var again = '<a class="btn-primary" href="club-register.html" data-new>Register again</a><a class="btn-ghost" href="tel:+60378041412">Call D-Clix</a>';
    switch (r.state) {
      case 'submitted_pending_approval': case 'pending_approval':
        return { step: 3, icon: 'clock', css: 'pending wait', title: 'Registration saved', text: 'Our admin is checking your club details. This usually takes about <b>5–10 minutes</b>.',
          extra: track(3) + '<div class="ps-note">' + window.icon('bell', 'w-5') + '<span>You can close this page. When you come back to the D-Clix website on this device, we will bring you straight back here. Payment opens once your club is approved.</span></div>' +
            '<p class="ps-live" id="psLive">Checking automatically</p>',
          buttons: '<button class="btn-ghost" type="button" data-reload>Check now</button>' };
      case 'approved_awaiting_payment': case 'awaiting_payment':
        return { step: 4, icon: 'checkcircle', css: 'paid', title: 'Your club is approved', text: 'Good news! Our admin has approved your club. Pay now to activate your D-Clix account.',
          extra: track(4), buttons: payLink(r, 'Continue to payment') + '<button class="btn-ghost" type="button" data-reload>Check again</button>' };
      case 'paid': case 'paid_pending_approval': case 'approved': case 'active':
        return { step: 5, icon: 'checkcircle', css: 'paid', title: 'Your club is ready', text: 'Thank you, your payment went through. Check your email for the club code, user ID and password.',
          extra: track(5), buttons: '<a class="btn-primary" href="' + LOGIN + '">Log in to D-Clix</a>', final: true };
      case 'payment_failed': case 'cancelled':
        return { step: 4, icon: 'info', css: 'error', title: 'Payment not completed', text: 'Your payment was cancelled or did not go through, so you have not been charged. Your club is still approved, you can try again.',
          buttons: payLink(r, 'Try payment again') + '<a class="btn-ghost" href="tel:+60378041412">Call D-Clix</a>' };
      case 'expired':
        return { step: 4, icon: 'info', css: 'error', title: 'Payment link expired', text: 'The payment time ran out, so you have not been charged. Please register again or call us.', buttons: again, final: true };
      case 'rejected':
        return { step: 3, icon: 'info', css: 'error', title: 'Registration not approved', text: 'Please contact D-Clix at +603-7804 1412 and we will help you.', buttons: '<a class="btn-primary" href="tel:+60378041412">Call D-Clix</a>', final: true };
      default:
        return { step: 3, icon: 'info', css: 'error', title: 'Something went wrong', text: 'We could not find this registration. If money was taken from your account, please contact D-Clix at +603-7804 1412 and we will sort it out.',
          buttons: '<a class="btn-primary" href="../pricing.html">Back to plans</a>', final: true };
    }
  }

  function show(r) {
    // fill gaps (club, plan, pay link) from what we saved at Save Club
    var s = mine();
    if (s && r.state) ['clubName', 'plan', 'amount', 'payUrl'].forEach(function (k) { if (r[k] == null || r[k] === '') r[k] = s[k]; });
    var v = view(r);
    steps(v.step);
    if (v.final) forget(); else if (ref) keep();
    var info = r.clubName ? '<p class="ps-ref"><b data-no-i18n>' + esc(r.clubName) + '</b>' + (r.plan ? ' · ' + esc(r.plan) : '') +
      (r.amount != null ? ' · ' + esc(r.currency || 'MYR') + ' ' + Number(r.amount).toFixed(2) : '') + '</p>' : '';
    var refLine = ref ? '<small class="ps-ref">Reference: <b data-no-i18n>' + esc(ref) + '</b></small>' : '';
    var other = v.step < 5 && !v.final ? '<p class="ps-alt"><a href="club-register.html" data-new>Start a new registration instead</a></p>' : '';
    box.innerHTML = '<div class="ps-icon ' + v.css + '">' + window.icon(v.icon, 'w-8') + '</div><h1>' + v.title + '</h1><p>' + v.text + '</p>' + info + refLine +
      (v.extra || '') + '<div class="form-actions">' + v.buttons + '</div>' + other;
    box.querySelectorAll('[data-reload]').forEach(function (b) { b.addEventListener('click', load); });
    box.querySelectorAll('[data-new]').forEach(function (a) { a.addEventListener('click', forget); });
    // tell a background tab the club got approved
    if (last === 3 && v.step === 4) document.title = 'Approved! | D-Clix';
    last = v.step;

    clearTimeout(timer);
    // approval: check every 15s while the page is open. back from boost: every 5s for ~2 min
    if (v.step === 3 && !v.final) timer = setTimeout(load, 15000);
    else if (r.state === 'awaiting_payment' && /[?&]state=/.test(location.search) && tries < 24) timer = setTimeout(load, 5000);
  }

  function load() {
    tries++;
    if (!ref) return show({});
    var live = document.getElementById('psLive');
    if (live) live.textContent = 'Checking…';
    window.dclixApi('status.php?ref=' + encodeURIComponent(ref)).then(show, function (err) {
      if (err.status === 404) return show({});
      // portal not answering: keep what is on screen (or step 3 if this signup was saved here) and check again
      if (last || mine()) {
        if (!last) show({ state: 'submitted_pending_approval' });
        var l = document.getElementById('psLive');
        if (l) l.textContent = 'Checking automatically';
        clearTimeout(timer);
        if (last === 3) timer = setTimeout(load, 15000);
        return;
      }
      box.innerHTML = '<div class="ps-icon pending">' + window.icon('clock', 'w-8') + '</div><h1>Checking your registration</h1><p>' + esc(err.message) + '</p><div class="form-actions"><button class="btn-primary" type="button" data-reload>Try again</button></div>';
      box.querySelector('[data-reload]').addEventListener('click', load);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    box = document.getElementById('statusBox');
    list = document.getElementById('flowSteps');
    if (ref && !/[?&]ref=/.test(location.search)) history.replaceState(null, '', '?ref=' + encodeURIComponent(ref));
    steps(3);
    box.innerHTML = '<div class="ps-icon pending">' + window.icon('clock', 'w-8') + '</div><h1>Checking your registration…</h1>';
    load();
    // phone users switch apps a lot, check as soon as they are back
    document.addEventListener('visibilitychange', function () { if (!document.hidden && last === 3) load(); });
  });
})();
