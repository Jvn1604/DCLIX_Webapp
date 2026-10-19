/* ==========================================================
   Where the D-Clix API (the PHP folder /api) is running.
   - Local XAMPP / `php -S 127.0.0.1:8000`: the api folder next to these pages.
   - GitHub Pages: set PRODUCTION_API to the HTTPS address of the api folder on your
     PHP hosting (e.g. 'https://dclix.yourcompany.com/api') and add the GitHub Pages
     address to allowed_origins in api/config.php. Left empty, signup, payment and the
     contact form use the built-in browser TEST API (js/shared/mock-api.js) for UAT.
   ========================================================== */
(function () {
  'use strict';
  var PRODUCTION_API = '';
  var h = location.hostname;
  var local = h === 'localhost' || h === '127.0.0.1' || /\.test$|\.localhost$/.test(h);
  // The site root is two folders above this file (js/shared/config.js), so pages in arena/ find the same api/ folder.
  var me = document.currentScript && document.currentScript.src;
  var siteRoot = me ? me.replace(/js\/shared\/config\.js(\?.*)?$/, '') : location.href.replace(/[^\/]*$/, '');
  var base = local ? siteRoot + 'api' : PRODUCTION_API;
  // No real API (e.g. GitHub Pages with PRODUCTION_API empty) → use the built-in browser TEST API for UAT.
  window.DCLIX_CONFIG = { apiBase: base.replace(/\/$/, ''), siteRoot: siteRoot, testMode: !base };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script'); s.src = siteRoot + src; s.setAttribute('data-src', src);
      s.onload = resolve; s.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  // Tell testers on the signup pages that this is the browser test mode
  if (!base) document.addEventListener('DOMContentLoaded', function () {
    var steps = document.querySelector('.flow-steps');
    if (!steps) return;
    var n = document.createElement('p'); n.className = 'test-mode-note';
    n.innerHTML = '<b>UAT test mode:</b> no real payment is taken and your registration is saved only in this browser.';
    steps.insertAdjacentElement('afterend', n);
  });
  var mockReady = null;
  function testApi(path, opts) {
    mockReady = mockReady || (window.DCLIX_MOCK ? Promise.resolve() : loadScript('js/shared/mock-api.js'));
    return mockReady.then(function () { return window.DCLIX_MOCK.handle(path, opts); });
  }

  /* Call the API. Resolves with the JSON reply; rejects with an Error that has
     .status, .data (the JSON error body) and .network (true if the server could not be reached). */
  window.dclixApi = function (path, opts) {
    opts = opts || {};
    if (!window.DCLIX_CONFIG.apiBase) return testApi(path, opts);
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
