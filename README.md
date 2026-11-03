# D-Clix Website

The public website for **D-Clix**, a club management system for martial arts and sports clubs in Malaysia
(by Raig Technologies (M) Sdn Bhd). Clubs learn about D-Clix here, choose a plan, register, pay online and then
log in to the D-Clix club system at [maclubsystem.com](https://www.maclubsystem.com/index.php?/login/proceed).

- **Live (test) site:** https://jvn1604.github.io/DCLIX_Webapp/
- **Built with:** plain HTML, CSS and JavaScript (no build step) + a small PHP API that passes signup and enquiries to the MAClub portal API
- **Languages:** English and Bahasa Melayu (switch at the top of every page) · dark and light theme
- **Team:** @Jvn1604 · @thurghathaarani0103

---

## Site flow

```
Visitor                     Website                                   Behind the scenes (MAClub portal)
───────                     ───────                                   ─────────────────────────────────
Home / Pricing  ──▶  Choose a plan
                ──▶  1. Club details + login + "I agree"   ──▶  order saved in the portal
                ──▶  2. Payment on Boost (FPX)              ──▶  portal checks the payment with Boost
                ──▶  3. Result page (asks the portal)       ──▶  staff approve · customer gets the login email
                ──▶  4. Club Login    ──▶  maclubsystem.com

Contact / "Book a free demo" form  ──▶  portal enquiry (Website CMS > Enquiries)
```

- Every **Club Login** button opens maclubsystem.com. This website has no login of its own.
- Without our PHP API (for example on GitHub Pages), the forms say "not open yet, please WhatsApp or call".
- Open questions with the portal: [PORTAL-TODO.md](PORTAL-TODO.md) · how to test: [TESTING.md](TESTING.md).

## Pages

| Page | What it is |
|---|---|
| `index.html` | Home: hero, event banner, sports, Malaysia club map, problems we solve, product tour, features, testimonials, pricing preview, FAQ, demo form |
| `about.html` · `pricing.html` · `edu-hub.html` · `community.html` | About D-Clix · plans (monthly / yearly) · guides and videos · community |
| `arena/club-register.html` → Boost → `payment-status.html` | The signup flow |
| `privacy.html` · `terms.html` · `refund.html` · `404.html` | Legal pages and "page not found" |

## Folder layout

```
DCLIX_Webapp/
├── index.html, about.html, pricing.html, edu-hub.html, community.html     website pages
├── privacy.html, terms.html, refund.html, 404.html                        legal pages, page not found
├── arena/          club-register, payment-status                           signup flow
├── css/style.css   all styles (theme colours are the first lines)
├── js/shared/      main.js (shared behaviour and animations) · i18n.js (language switch) · i18n-bm.js (Bahasa Melayu words) · banner.js (event banners)
│                   map.js (club globe) · config.js (where the API is) · icons.js
│                   theme.js · whatsapp.js (chat button)
├── js/arena/       signup.js (registration) · status.js (result page) · sports.js (the sports list)
├── assets/         logo, favicon, images
│   ├── banners/    event banner pictures + banners.js (what to show, where and when)
│   └── clubs/      club logos + clubs.js (the clubs on the home page map) + malaysia-geo.js (state outlines) + world.js (other countries, dim)
├── api/            PHP: signup, status, contact form, plans. Talks to the MAClub portal API (lib/dclix-client.php)
│                   (api/config.php and api/storage/ are never committed)
├── set-version.js  run before pushing CSS/JS changes (see below)
└── start-local.bat starts the site on your PC
```

## Run it on your PC

1. Install XAMPP (only PHP is used, no MySQL needed).
2. First time only: copy `api/config.example.php` to `api/config.php` and fill in the portal client id and secret
   (ask Jeeven, never commit it). If PHP says "SSL certificate problem", set `ca_bundle` to a fresh CA file,
   e.g. `C:/Program Files/Git/usr/ssl/certs/ca-bundle.crt`.
3. Double-click `start-local.bat` and open http://127.0.0.1:8000.

Everything you submit on your PC goes to the portal's **staging** system, so use sample details.

## Everyday changes

| I want to… | Do this |
|---|---|
| Show an event or promo banner | Put the picture in `assets/banners/`, add a line in `assets/banners/banners.js` (`pages`, `start`, `end`; instructions at the top of the file). Desktop 1600 × 500, phone 800 × 600 |
| Change the clubs on the map | Put logos in `assets/clubs/` and edit `assets/clubs/clubs.js`: name, logo and state (only clubs that agreed to be shown) |
| Change a text | Edit the page, then change the same English line in `js/shared/i18n-bm.js` so the Bahasa Melayu still matches |
| Change the theme colour | The first lines of `css/style.css`: `--accent`, `--accent-light`, `--accent-rgb` |
| Push CSS or JS changes | Run `node set-version.js` first, so visitors' browsers load the new files at once |
| Change a page title or description, or move to d-clix.com | Edit the page (or `SITE` at the top of `set-seo.js`), then run `node set-seo.js`: it updates sharing tags, `sitemap.xml` and `robots.txt` |

## Security
The repo is public. Read **[SECURITY.md](SECURITY.md)**: what protects the site, rules for both of us, and the checklist before real data goes live.
Run `node set-security.js` after adding a `<script>` to a page or a new outside service.

## Working together (please read)

1. **Pull before you start:** `git pull origin main`. Most of our merge problems came from editing an old copy.
2. Commit small, clear changes and push soon.
3. If `git pull` shows a **conflict**, stop and ask before committing. Never fix it by keeping your old copy of a whole file.
4. Write what you are working on in the **Team board** below, so we don't edit the same thing at the same time.

---

## Future plan

Tick a box (`[x]`) when it is done. 

### 1. Before launch (must do)
- [ ] Get from the company: real dashboard screenshots, club logos (with permission), testimonials with photos, real figures
- [ ] Company confirms: office address, plan names and prices, monthly/yearly vs. the 12-month auto-renewal in the Terms, the No Refund Policy text
- [ ] Replace the home page samples (dashboard mock-up, testimonial initials) with the real material
- [x] Connect the MAClub portal API (staging): enquiries, plans, signup + Boost payment
- [ ] Sort out the open points in [PORTAL-TODO.md](PORTAL-TODO.md), then switch to the **production** client
- [ ] Put the `api/` folder on the company's PHP hosting (HTTPS) and set `PRODUCTION_API` in `js/shared/config.js`
- [ ] Point **d-clix.com** to the new site
- [ ] Full test on Chrome, Edge, Safari (iPhone) and Chrome (Android), in English and BM, dark and light
- [ ] One real signup with a small real payment, then refund it

### 2. Website revamp (keep improving)
- [x] New home page: product hero, problems we solve, product tour, trust section, pricing preview, FAQ, demo form
- [x] Event banners on home and pricing (Deepavali offer, free demo)
- [x] SSM certificate upload on registration
- [x] Clubs globe with real numbers · App Store / Google Play links
- [x] Give About, Pricing, Edu-Hub, Community, legal pages and 404 the same new look as the home page
- [ ] New **Customers** page with club stories (before / after, with photos)
- [ ] New **Features** page with a real screen for each module
- [ ] Edu-Hub: video tutorials
- [x] Faster pages: images converted to WebP (798 KB → 218 KB), unused CSS removed

### 3. After launch
- [ ] Visitor analytics with a cookie notice: visits, demo bookings, signups, payments
- [ ] Automatic renewal invoices before a subscription ends
- [ ] Create the club's account on maclubsystem.com automatically after payment (if that system has an API)
- [x] SEO: sitemap, robots.txt, page descriptions, social preview image (`assets/og-image.jpg`)
- [ ] Google Business Profile
- [ ] Bahasa Melayu emails

---

## Team board

Add a row when you start something and update it when you finish. Newest at the top.

### Working on now

| Task | Who | Started | Status / notes |
|---|---|---|---|
| _(example)_ New look for the About page | @Jvn1604 | 2026-10-22 | In progress |
|  | @thurghathaarani0103 |  |  |

### Done log

| Date | Who | What changed |
|---|---|---|
| 2026-10-22 | @Jvn1604 | README rewritten: summary, site flow, folder layout, future plan, team board |
| 2026-10-22 | @thurghathaarani0103 | Removed the "How it works" (RAP) section from the home page |
| 2026-10-21 | @Jvn1604 | More space between form fields on registration and payment |
| 2026-10-21 | @thurghathaarani0103 | App Store / Google Play links in every footer |
| 2026-10-21 | @thurghathaarani0103 | Clubs globe with 200+ clubs and 29,000+ students |
| 2026-10-21 | @Jvn1604 | Event banners (home + pricing), SSM upload, home page animations, background figures on all pages |
| 2026-10-21 | @Jvn1604 | New home page design |

---

## Technical reference

<details>
<summary>Backend, settings and going live (click to open)</summary>

**How signup works**

```
club-register.html   ──POST api/signup.php──▶ portal POST /registration ──▶ {payment.url}
                     ──▶ browser goes to Boost (FPX) ──▶ portal ──▶ arena/payment-status.html?ref=…
payment-status.html  ──GET api/status.php?ref=…──▶ portal GET /registration/status/{ref}  (never trust ?state=)
contact form         ──POST api/contact.php──▶ portal POST /enquiry
```

- Every portal call is signed with the client secret (HMAC). The secret is only in `api/config.php`.
- Full API details: https://www.maclubsystem.com/api-docs/index.html · our own endpoints: [API.md](API.md).

**Settings in `api/config.php`** (never commit this file)

| Setting | What it does |
|---|---|
| `portal.base`, `client_id`, `secret` | MAClub portal API (Website CMS > API Clients). A staging client only works on staging |
| `ca_bundle` | CA file for https calls, only needed when PHP has none (old XAMPP) |
| `allowed_origins` | The websites allowed to call our API from the browser |
| `debug` | `true` only on your PC |

**Going live**

1. Upload `api/` to PHP 8.1+ hosting with HTTPS (needs the curl extension) and create `config.php` with the **production** client.
2. In `config.php`: `debug => false`, the real website address in `allowed_origins`.
3. Ask the portal team to set the result page to `https://<site>/arena/payment-status.html`.
4. Set `PRODUCTION_API` in `js/shared/config.js`, add it to `API_ORIGINS` in `set-security.js`, run both scripts, push.

**Security**

- Payment details are entered only on Boost; the result page always asks the portal, never trusts the address bar.
- The portal secret stays in `api/config.php` (git-ignored). `api/.htaccess` blocks web access to config, code and storage on Apache.
- Signup, status and the contact form are rate-limited per IP address.

</details>
