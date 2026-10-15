/* Loaded in <head> (no defer) so the saved theme is applied before first paint. */
(function () {
  var t = 'dark';
  try { t = localStorage.getItem('theme') || 'dark'; } catch (e) {}
  var root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(t);
})();
