/* writes the CSP meta into every page. run it when you:
   - change an inline <script>
   - add an outside service (fonts, video, analytics)
   - connect the real api (add it to API_ORIGINS)

   node set-security.js */
const API_ORIGINS = [];            // e.g. ['https://api.d-clix.com']
const FRAMES = ['https://app.supademo.com', 'https://www.google.com'];

const fs = require('fs');
const crypto = require('crypto');
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('arena').filter(f => f.endsWith('.html')).map(f => 'arena/' + f));

for (const f of pages) {
  let s = fs.readFileSync(f, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace(/[ \t]*<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/?>\r?\n?/g, '')
       .replace(/[ \t]*<meta name="referrer" content="[^"]*"\s*\/?>\r?\n?/g, '');
  // hashes of inline scripts (browser turns \r\n into \n first)
  const hashes = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(m => "'sha256-" + crypto.createHash('sha256').update(m[1].replace(/\r\n?/g, '\n'), 'utf8').digest('base64') + "'");
  const csp = [
    "default-src 'self'",
    "script-src 'self'" + (hashes.length ? ' ' + hashes.join(' ') : ''),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "media-src 'self'",
    "connect-src 'self'" + (API_ORIGINS.length ? ' ' + API_ORIGINS.join(' ') : ''),
    "frame-src " + (FRAMES.length ? FRAMES.join(' ') : "'none'"),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  const tags = '<meta http-equiv="Content-Security-Policy" content="' + csp + '" />' + nl +
               '<meta name="referrer" content="strict-origin-when-cross-origin" />' + nl;
  // right after charset/viewport
  const anchor = s.match(/<meta name="viewport"[^>]*>\r?\n/);
  if (!anchor) { console.log('skip (no viewport tag):', f); continue; }
  s = s.replace(anchor[0], anchor[0] + tags);
  fs.writeFileSync(f, s);
  console.log(f.padEnd(28), hashes.length ? hashes.length + ' inline script(s) allowed by hash' : '');
}
