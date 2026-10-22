/* Adds search and social-sharing tags to every page and writes sitemap.xml + robots.txt.
   Run after changing a page title or description, or when the site moves to its own domain:

       node set-seo.js

   SITE is the public address of the website (change it when d-clix.com points here). */
const SITE = 'https://jvn1604.github.io/DCLIX_Webapp/';

const fs = require('fs');
const path = require('path');
const IMAGE = SITE + 'assets/og-image.jpg';
// pages visitors should not land on from a search engine
const NOINDEX = ['arena/payment.html', 'arena/payment-status.html', 'arena/mock-gateway.html', '404.html'];
// better descriptions where a page shares one with another
const DESC = {
  'arena/payment.html': 'Choose your D-Clix plan and pay securely by FPX online banking or card through Billplz.',
  'arena/payment-status.html': 'The result of your D-Clix subscription payment.'
};

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('arena').filter(f => f.endsWith('.html')).map(f => 'arena/' + f));
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
const listed = [];

for (const f of pages) {
  let s = fs.readFileSync(f, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  const title = unesc((s.match(/<title>([^<]*)<\/title>/) || [])[1] || 'D-Clix');
  if (DESC[f]) s = s.replace(/<meta name="description" content="[^"]*"\s*\/?>/, '<meta name="description" content="' + esc(DESC[f]) + '" />');
  const desc = unesc((s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const url = SITE + (f === 'index.html' ? '' : f);
  // remove tags this script manages, then add them back after the description
  s = s.replace(/[ \t]*<meta (?:property="og:[^"]+"|name="twitter:[^"]+"|name="robots") content="[^"]*"\s*\/?>\r?\n?/g, '')
       .replace(/[ \t]*<link rel="canonical" href="[^"]*"\s*\/?>\r?\n?/g, '');
  const noindex = NOINDEX.includes(f);
  const tags = [
    noindex ? '<meta name="robots" content="noindex" />' : '<link rel="canonical" href="' + url + '" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="D-Clix" />',
    '<meta property="og:title" content="' + esc(title) + '" />',
    '<meta property="og:description" content="' + esc(desc) + '" />',
    '<meta property="og:url" content="' + url + '" />',
    '<meta property="og:image" content="' + IMAGE + '" />',
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />'
  ].join(nl);
  const anchor = s.match(/<meta name="description" content="[^"]*"\s*\/?>/);
  if (!anchor) { console.log('skip (no description):', f); continue; }
  s = s.replace(anchor[0], anchor[0] + nl + tags);
  fs.writeFileSync(f, s);
  if (!noindex) listed.push({ url, file: f });
}

const today = new Date().toISOString().slice(0, 10);
const prio = f => f === 'index.html' ? '1.0' : /pricing|club-register/.test(f) ? '0.9' : /privacy|terms|refund/.test(f) ? '0.3' : '0.7';
fs.writeFileSync('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  listed.map(p => '  <url><loc>' + p.url + '</loc><lastmod>' + today + '</lastmod><priority>' + prio(p.file) + '</priority></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync('robots.txt', 'User-agent: *\nDisallow: /api/\nDisallow: /arena/payment.html\nDisallow: /arena/payment-status.html\nDisallow: /arena/mock-gateway.html\n\nSitemap: ' + SITE + 'sitemap.xml\n');
console.log('SEO tags on', pages.length, 'pages; sitemap lists', listed.length, 'pages');
