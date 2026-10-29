/* Adds search and social-sharing tags and structured data (JSON-LD) to every page,
   and writes sitemap.xml + robots.txt. Run after changing a page title, description,
   FAQ, price or company detail, or when the site moves to its own domain:

       node set-seo.js

   SITE is the public address of the website (change it when d-clix.com points here). */
const SITE = 'https://jvn1604.github.io/DCLIX_Webapp/';

const fs = require('fs');
const IMAGE = SITE + 'assets/og-image.jpg';
// pages visitors should not land on from a search engine
const NOINDEX = ['arena/payment.html', 'arena/payment-status.html', 'arena/mock-gateway.html', '404.html'];
// page titles shown in Google (about 50-60 characters: what the page is + D-Clix)
const TITLE = {
  'index.html': 'D-Clix | Martial Arts & Sports Club Management System Malaysia',
  'pricing.html': 'D-Clix Pricing | Club Management Plans from RM100 a Month',
  'about.html': 'About D-Clix | Club Management Software for Malaysian Clubs',
  'edu-hub.html': 'D-Clix Edu-Hub | Interactive Tour and User Guide',
  'community.html': 'D-Clix Community | For Martial Arts and Sports Club Owners',
  'arena/club-register.html': 'Register Your Club | D-Clix'
};
// descriptions shown under the title in Google (about 120-160 characters)
const DESC = {
  'about.html': 'D-Clix is a Malaysian club management system for martial arts and sports clubs: registration, attendance, fees, grading and a parent app in one place.',
  'edu-hub.html': 'Learn D-Clix at your own pace: try the real screens in an interactive tour and keep the full user guide for club admins and coaches.',
  'arena/club-register.html': 'Register your martial arts or sports club with D-Clix. Choose a plan, add your club details and start managing members, fees and attendance online.',
  'arena/payment.html': 'Choose your D-Clix plan and pay securely by FPX online banking or card through Billplz.',
  'arena/payment-status.html': 'The result of your D-Clix subscription payment.'
};
// short page names for the breadcrumb trail (Home › Page)
const CRUMB = {
  'about.html': 'About', 'pricing.html': 'Pricing', 'edu-hub.html': 'Edu-Hub', 'community.html': 'Community', 'contact.html': 'Contact',
  'privacy.html': 'Privacy Policy', 'terms.html': 'Terms & Conditions', 'refund.html': 'No Refund Policy', 'arena/club-register.html': 'Club Registration'
};

/* ---------- company and product facts used in the structured data ---------- */
const ORG = {
  '@type': 'Organization', '@id': SITE + '#org', name: 'D-Clix', legalName: 'Raig Technologies (M) Sdn Bhd',
  url: SITE, logo: SITE + 'assets/dclix-logo.webp', image: IMAGE, telephone: '+60378041412',
  address: { '@type': 'PostalAddress', streetAddress: 'Suite 3A42 Level 4 Block A, Kelana Centre Point, Jalan SS 7/19, SS7',
    addressLocality: 'Petaling Jaya', postalCode: '47301', addressRegion: 'Selangor', addressCountry: 'MY' },
  contactPoint: { '@type': 'ContactPoint', telephone: '+60378041412', contactType: 'sales', areaServed: 'MY', availableLanguage: ['en', 'ms'] },
  sameAs: ['https://www.facebook.com/share/15w1nqSqJe/', 'https://www.instagram.com/dclixmalaysia/', 'https://www.tiktok.com/@dclix.malaysia']
};
const PLANS = [['Basic', 100], ['Standard', 150], ['Premium', 200]];
const APP = {
  '@type': 'SoftwareApplication', '@id': SITE + '#app', name: 'D-Clix Club Management System',
  applicationCategory: 'BusinessApplication', operatingSystem: 'Web, Android, iOS', url: SITE,
  description: 'Club management system for martial arts and sports clubs: online registration, QR attendance, FPX fee payments, grading and a parent app.',
  publisher: { '@id': SITE + '#org' },
  offers: { '@type': 'AggregateOffer', priceCurrency: 'MYR', lowPrice: 100, highPrice: 200, offerCount: PLANS.length,
    offers: PLANS.map(([n, p]) => ({ '@type': 'Offer', name: n + ' plan (monthly)', price: p, priceCurrency: 'MYR', url: SITE + 'pricing.html' })) }
};

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html'))
  .concat(fs.readdirSync('arena').filter(f => f.endsWith('.html')).map(f => 'arena/' + f));
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const unesc = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&rsquo;/g, '’').replace(/&nbsp;/g, ' ');
const text = html => unesc(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const listed = [];

// questions and answers from the page's FAQ accordion
function faqs(s) {
  const out = [];
  const re = /class="faq-q"[^>]*><span[^>]*>([\s\S]*?)<\/span>[\s\S]*?class="faq-a"><div>([\s\S]*?)<\/div><\/div>/g;
  let m; while ((m = re.exec(s))) out.push({ '@type': 'Question', name: text(m[1]), acceptedAnswer: { '@type': 'Answer', text: text(m[2]) } });
  return out;
}

for (const f of pages) {
  let s = fs.readFileSync(f, 'utf8');
  const nl = s.includes('\r\n') ? '\r\n' : '\n';
  if (TITLE[f]) s = s.replace(/<title>[^<]*<\/title>/, '<title>' + esc(TITLE[f]) + '</title>');
  const title = unesc((s.match(/<title>([^<]*)<\/title>/) || [])[1] || 'D-Clix');
  if (DESC[f]) s = s.replace(/<meta name="description" content="[^"]*"\s*\/?>/, '<meta name="description" content="' + esc(DESC[f]) + '" />');
  const desc = unesc((s.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  const url = SITE + (f === 'index.html' ? '' : f);
  // remove tags this script manages, then add them back after the description
  s = s.replace(/[ \t]*<meta (?:property="og:[^"]+"|name="twitter:[^"]+"|name="robots"|name="theme-color") content="[^"]*"\s*\/?>\r?\n?/g, '')
       .replace(/[ \t]*<link rel="canonical" href="[^"]*"\s*\/?>\r?\n?/g, '')
       .replace(/[ \t]*<script type="application\/ld\+json" data-seo>[\s\S]*?<\/script>\r?\n?/g, '');
  const noindex = NOINDEX.includes(f);
  const tags = [
    noindex ? '<meta name="robots" content="noindex" />' : '<link rel="canonical" href="' + url + '" />',
    '<meta name="theme-color" content="#0e0e10" />',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="D-Clix" />',
    '<meta property="og:locale" content="en_MY" />',
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

  // structured data (JSON-LD) for search engines; browsers never run it, so the security policy is unaffected
  if (!noindex) {
    const graph = [ORG];
    if (f === 'index.html') graph.push({ '@type': 'WebSite', '@id': SITE + '#site', url: SITE, name: 'D-Clix', inLanguage: ['en-MY', 'ms-MY'], publisher: { '@id': SITE + '#org' } });
    if (f === 'index.html' || f === 'pricing.html') graph.push(APP);
    const qa = faqs(s);
    if (qa.length) graph.push({ '@type': 'FAQPage', '@id': url + '#faq', mainEntity: qa });
    if (f === 'about.html') graph.push({ '@type': 'AboutPage', url, name: title, about: { '@id': SITE + '#org' } });
    if (f === 'contact.html') {
      graph.push({ '@type': 'ContactPage', url, name: title, about: { '@id': SITE + '#org' } });
      graph.push({ '@type': 'LocalBusiness', '@id': SITE + '#office', name: 'D-Clix (Raig Technologies (M) Sdn Bhd)', image: IMAGE, url: SITE,
        telephone: ORG.telephone, address: ORG.address, geo: { '@type': 'GeoCoordinates', latitude: 3.1000138, longitude: 101.5924492 },
        hasMap: 'https://www.google.com/maps/place/Raig+Technologies+(M)+Sdn.+Bhd/@3.1000138,101.5924492,17z', parentOrganization: { '@id': SITE + '#org' } });
    }
    if (CRUMB[f]) graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: CRUMB[f], item: url }] });
    const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    s = s.replace(/<\/head>/, '<script type="application/ld+json" data-seo>' + json + '</script>' + nl + '</head>');
  }
  fs.writeFileSync(f, s);
  if (!noindex) listed.push({ url, file: f });
}

const today = new Date().toISOString().slice(0, 10);
const prio = f => f === 'index.html' ? '1.0' : /pricing|club-register/.test(f) ? '0.9' : /privacy|terms|refund/.test(f) ? '0.3' : '0.7';
fs.writeFileSync('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  listed.map(p => '  <url><loc>' + p.url + '</loc><lastmod>' + today + '</lastmod><priority>' + prio(p.file) + '</priority></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync('robots.txt', 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /arena/payment.html\nDisallow: /arena/payment-status.html\nDisallow: /arena/mock-gateway.html\n\nSitemap: ' + SITE + 'sitemap.xml\n');
console.log('SEO tags on', pages.length, 'pages; sitemap lists', listed.length, 'pages');
