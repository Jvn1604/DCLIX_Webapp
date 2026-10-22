/* Writes the browser security policy (Content-Security-Policy) and referrer policy into every page.
   GitHub Pages cannot send security headers, so they go in <meta> tags. Run before pushing when you:
     - add or edit a <script> block inside a page (its fingerprint must be recalculated),
     - start using a new outside service (fonts, video, payment, analytics...),
     - connect the real API (add its address to API_ORIGINS).

       node set-security.js

   What the policy allows:
     scripts  only files from this site, plus the exact inline scripts that are on each page now
     styles   this site + Google Fonts        fonts   Google Fonts
     images   this site (and data: icons)     frames  the Supademo tour on Edu-Hub
     data     this site's API + API_ORIGINS   forms   this site only
   Everything else (injected scripts, unknown trackers, other sites receiving data) is blocked. */
const API_ORIGINS = [];            // e.g. ['https://api.d-clix.com'] once PRODUCTION_API is set in js/shared/config.js
const FRAMES = ['https://app.supademo.com'];

const fs = require('fs');
const crypto = require('crypto');
const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('arena').filter(f => f.endsWith('.html')).map(f => 'arena/' + f));

for (const f of pages) {
  let s = fs.readFileSync(f, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  s = s.replace(/[ \t]*<meta http-equiv="Content-Security-Policy" content="[^"]*"\s*\/?>\r?\n?/g, '')
       .replace(/[ \t]*<meta name="referrer" content="[^"]*"\s*\/?>\r?\n?/g, '');
  // fingerprints of inline <script> blocks (browsers hash the exact text between the tags)
  const hashes = [...s.matchAll(/<script>([\s\S]*?)<\/script>/g)]
    .map(m => "'sha256-" + crypto.createHash('sha256').update(m[1], 'utf8').digest('base64') + "'");
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
  // as early as possible in <head>: right after the charset/viewport tags
  const anchor = s.match(/<meta name="viewport"[^>]*>\r?\n/);
  if (!anchor) { console.log('skip (no viewport tag):', f); continue; }
  s = s.replace(anchor[0], anchor[0] + tags);
  fs.writeFileSync(f, s);
  console.log(f.padEnd(28), hashes.length ? hashes.length + ' inline script(s) allowed by hash' : '');
}
