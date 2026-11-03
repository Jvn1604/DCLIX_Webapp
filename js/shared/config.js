/* api address
   local: uses the api/ folder
   live: put our php api url in PRODUCTION_API + add the site to allowed_origins in api/config.php
   empty = forms say "not open yet". the php api talks to the maclub portal, secret stays on the server */
(function () {
  'use strict';
  var PRODUCTION_API = '';
  var h = location.hostname;
  var local = h === 'localhost' || h === '127.0.0.1' || /\.test$|\.localhost$/.test(h);
  // site root, so arena/ pages find api/ too
  var me = document.currentScript && document.currentScript.src;
  var siteRoot = me ? me.replace(/js\/shared\/config\.js(\?.*)?$/, '') : location.href.replace(/[^\/]*$/, '');
  // live api must be https (passwords go through it)
  var base = local ? siteRoot + 'api' : (/^https:\/\//.test(PRODUCTION_API) ? PRODUCTION_API : '');
  window.DCLIX_CONFIG = { apiBase: base.replace(/\/$/, ''), siteRoot: siteRoot };

  /* call the api. error has .status, .data and .network */
  window.dclixApi = function (path, opts) {
    opts = opts || {};
    // no api set yet (github pages)
    if (!window.DCLIX_CONFIG.apiBase) return Promise.reject(Object.assign(new Error('Online forms are not open yet. Please WhatsApp or call us at +603-7804 1412.'), { network: true }));
    var headers = { 'Accept': 'application/json' };
    if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
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
