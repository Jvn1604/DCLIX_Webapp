/* Loaded in <head> (no defer) so the saved theme is applied before first paint. */
(function () {
  var t = 'dark';
  try { t = localStorage.getItem('theme') || 'dark'; } catch (e) {}
  var root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(t);
})();

/* Clickjacking protection: if another website shows this page inside a frame, hide it and
   offer a link to open it properly. (GitHub Pages cannot send the X-Frame-Options header.) */
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
