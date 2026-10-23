/* Stamps a version on every page's own CSS and JS links (style.css?v=…),
   so visitors' browsers load the new files right after a push instead of
   an old saved copy. Run it before committing a release:

       node set-version.js

   It uses today's date and time, e.g. ?v=20261021-1430. */
const fs = require('fs');
const path = require('path');
const d = new Date();
const p = n => String(n).padStart(2, '0');
const v = '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('arena').filter(f => f.endsWith('.html')).map(f => path.join('arena', f)));
let changed = 0;
for (const f of pages) {
  const s = fs.readFileSync(f, 'utf8');
  // only local files under css/, js/, assets/banners and assets/clubs (not Google Fonts or other sites)
  const t = s.replace(/((?:href|src)="(?:\.\.\/)?(?:css|js|assets\/banners|assets\/clubs)\/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?"/g, '$1?v=' + v + '"');
  if (t !== s) { fs.writeFileSync(f, t); changed++; }
}
console.log('Version ' + v + ' set on ' + changed + ' page(s).');
