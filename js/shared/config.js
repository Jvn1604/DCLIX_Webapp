/* ==========================================================
   Where the D-Clix API (the PHP folder /api) is running.
   - Local XAMPP / `php -S 127.0.0.1:8000`: the api folder next to these pages.
   - GitHub Pages: set PRODUCTION_API to the HTTPS address of the api folder on your
     PHP hosting (e.g. 'https://dclix.yourcompany.com/api') and add the GitHub Pages
     address to allowed_origins in api/config.php. Left empty, the admin portal runs in
     browser-only demo mode and online signup shows a "not available" message.
   ========================================================== */
(function () {
  'use strict';
  var PRODUCTION_API = '';
  var h = location.hostname;
  var local = h === 'localhost' || h === '127.0.0.1' || /\.test$|\.localhost$/.test(h);
  // The site root is two folders above this file (js/shared/config.js), so pages in admin/ and arena/ find the same api/ folder.
  var me = document.currentScript && document.currentScript.src;
  var siteRoot = me ? me.replace(/js\/shared\/config\.js(\?.*)?$/, '') : location.href.replace(/[^\/]*$/, '');
  var base = local ? siteRoot + 'api' : PRODUCTION_API;
  window.DCLIX_CONFIG = { apiBase: base.replace(/\/$/, '') };

  /* Call the API. Resolves with the JSON reply; rejects with an Error that has
     .status, .data (the JSON error body) and .network (true if the server could not be reached). */
  window.dclixApi = function (path, opts) {
    opts = opts || {};
    if (!window.DCLIX_CONFIG.apiBase) {
      var off = new Error('Online services are not connected yet.'); off.network = true; off.offline = true;
      return Promise.reject(off);
    }
    var headers = { 'Accept': 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
    if (opts.token) headers['Authorization'] = 'Bearer ' + opts.token;
    return fetch(window.DCLIX_CONFIG.apiBase + '/' + path, {
      method: opts.method || (opts.body !== undefined ? 'POST' : 'GET'),
      headers: headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      cache: 'no-store'
    }).then(function (res) {
      return res.text().then(function (text) {
        var data = null;
        try { data = text ? JSON.parse(text) : {}; } catch (e) { data = null; }
        if (res.ok && data) return data;
        var err = new Error((data && data.error) || 'The server returned an unexpected reply (' + res.status + ').');
        err.status = res.status; err.data = data || {};
        throw err;
      });
    }, function () {
      var err = new Error('Cannot reach the D-Clix server. Check your internet connection and try again.');
      err.network = true;
      throw err;
    });
  };
})();
