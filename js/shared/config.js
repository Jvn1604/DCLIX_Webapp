/* api address
   local: uses the api/ folder
   live: put the api url in PRODUCTION_API + add the site to allowed_origins in api/config.php
   empty = browser test api (mock-api.js) */
(function () {
  'use strict';
  var PRODUCTION_API = '';
  var h = location.hostname;
  var local = h === 'localhost' || h === '127.0.0.1' || /\.test$|\.localhost$/.test(h);
  // site root, so arena/ pages find api/ too
  var me = document.currentScript && document.currentScript.src;
  var siteRoot = me ? me.replace(/js\/shared\/config\.js(\?.*)?$/, '') : location.href.replace(/[^\/]*$/, '');
  var base = local ? siteRoot + 'api' : PRODUCTION_API;
  // no api -> test mode
  window.DCLIX_CONFIG = { apiBase: base.replace(/\/$/, ''), siteRoot: siteRoot, testMode: !base };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[data-src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script'); s.src = siteRoot + src; s.setAttribute('data-src', src);
      s.onload = resolve; s.onerror = function () { reject(new Error('Could not load ' + src)); };
      document.head.appendChild(s);
    });
  }
  // test mode note on signup pages
  if (!base) document.addEventListener('DOMContentLoaded', function () {
    var steps = document.querySelector('.flow-steps');
    if (!steps) return;
    var n = document.createElement('p'); n.className = 'test-mode-note';
    n.innerHTML = '<b>UAT test mode:</b> no real payment is taken and your registration is saved only in this browser. Please use sample details, not real personal or payment information.';
    steps.insertAdjacentElement('afterend', n);
  });
  var mockReady = null;
  function testApi(path, opts) {
    mockReady = mockReady || (window.DCLIX_MOCK ? Promise.resolve() : loadScript('js/shared/mock-api.js'));
    return mockReady.then(function () { return window.DCLIX_MOCK.handle(path, opts); });
  }

  /* call the api. error has .status, .data and .network */
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
