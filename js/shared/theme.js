/* in head so theme loads before paint */
(function () {
  var t = 'dark';
  try { t = localStorage.getItem('theme') || 'dark'; } catch (e) {}
  var root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(t);
})();

/* stop other sites framing this page */
(function () {
  if (window.top === window.self) return;
  var sameSite = false;
  try { sameSite = window.top.location.origin === window.location.origin; } catch (e) { sameSite = false; }
  if (sameSite) return;
  document.documentElement.style.display = 'none';
  document.addEventListener('DOMContentLoaded', function () {
    document.documentElement.style.display = '';
    document.body.innerHTML = '<p style="position:fixed;inset:0;z-index:2147483647;margin:0;background:#fff;color:#111;font:16px sans-serif;padding:24px">This page cannot be shown inside another website. <a href="' +
      location.href.replace(/"/g, '%22') + '" target="_top" rel="noopener noreferrer">Open D-Clix</a></p>';
  });
})();

/* signup waiting for approval on this device (status.js keeps dclix-reg)?
   the first page of a visit, or the register page, goes back to its status page */
(function () {
  var page = location.pathname;
  if (/payment-status\.html$/.test(page)) return;
  try {
    var s = JSON.parse(localStorage.getItem('dclix-reg') || 'null');
    if (!s || !/^[A-Za-z0-9-]{8,64}$/.test(s.ref) || !(Date.now() - s.at < 7 * 864e5)) return;
    if (!/club-register\.html$/.test(page) && sessionStorage.getItem('dclix-back')) return;
    sessionStorage.setItem('dclix-back', '1');
    var me = document.currentScript && document.currentScript.src;
    if (me) location.replace(me.replace(/js\/shared\/theme\.js(\?.*)?$/, '') + 'arena/payment-status.html?ref=' + encodeURIComponent(s.ref));
  } catch (e) {}
})();
