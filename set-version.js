/* adds ?v= to css/js links so browsers get the new files
   run before pushing: node set-version.js */
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
  // only our own files
  const t = s.replace(/((?:href|src)="(?:\.\.\/)?(?:css|js|assets\/banners|assets\/clubs)\/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?"/g, '$1?v=' + v + '"');
  if (t !== s) { fs.writeFileSync(f, t); changed++; }
}
console.log('Version ' + v + ' set on ' + changed + ' page(s).');
