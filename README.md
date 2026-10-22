# D-Clix Website

The public website for **D-Clix**, a club management system for martial arts and sports clubs in Malaysia
(by Raig Technologies (M) Sdn Bhd). Clubs learn about D-Clix here, choose a plan, register, pay online and then
log in to the D-Clix club system at [maclubsystem.com](https://www.maclubsystem.com/index.php?/login/proceed).

- **Live (test) site:** https://jvn1604.github.io/DCLIX_Webapp/
- **Built with:** plain HTML, CSS and JavaScript (no build step) + a small PHP / MySQL API for signup, payment and emails
- **Languages:** English and Bahasa Melayu (switch at the top of every page) · dark and light theme
- **Team:** @Jvn1604 · @thurghathaarani0103

---

## Site flow

```
Visitor                     Website                                   Behind the scenes
───────                     ───────                                   ─────────────────
Home / Pricing  ──▶  Choose a plan (monthly or yearly)
                ──▶  1. Club details  (+ SSM certificate upload)  ──▶  club + lead saved · emails to client and sales
                ──▶  2. Payment       (billing details, "I agree")  ──▶  invoice + bill · Billplz (FPX / card)
                ──▶  3. Payment result (paid / failed / pending)   ──▶  welcome + receipt to client · "payment received" to sales
                ──▶  4. Club Login    ──▶  maclubsystem.com (the sales team sets up the club's account there)

Home page "Book a free demo" form  ──▶  lead saved · emails to sales and the visitor
```

- Every **Club Login** button opens maclubsystem.com. This website has no login of its own.
- Without a server (for example on GitHub Pages), signup and payment run in **test mode** in the browser: no real money, nothing sent.

## Pages

| Page | What it is |
|---|---|
| `index.html` | Home: hero, event banner, sports, clubs globe, problems we solve, product tour, features, testimonials, pricing preview, FAQ, demo form |
| `about.html` · `pricing.html` · `edu-hub.html` · `community.html` | About D-Clix · plans (monthly / yearly) · guides and videos · community |
| `arena/club-register.html` → `payment.html` → `payment-status.html` | The signup flow (steps 1 to 3) |
| `privacy.html` · `terms.html` · `refund.html` · `404.html` | Legal pages and "page not found" |

## Folder layout

```
DCLIX_Webapp/
├── index.html, about.html, pricing.html, edu-hub.html, community.html     website pages
├── privacy.html, terms.html, refund.html, 404.html                        legal pages, page not found
├── arena/          club-register, payment, payment-status, mock-gateway    signup and payment flow
├── css/style.css   all styles (theme colours are the first lines)
├── js/shared/      main.js (shared behaviour and animations) · i18n.js (Bahasa Melayu) · banner.js (event banners)
│                   globe.js (clubs globe) · config.js (where the API is) · mock-api.js (test mode) · icons.js
│                   theme.js · whatsapp.js (chat button)
├── js/arena/       signup.js (registration) · payment.js · sports.js (the 18 sports)
├── assets/         logo, favicon, images
│   ├── banners/    event banner pictures + banners.js (what to show, where and when)
│   └── clubs/      club logos + clubs.js (the clubs on the home page globe)
├── api/            PHP + MySQL: signup, checkout, contact form, Billplz, emails, file uploads
│                   (api/config.php and api/storage/ are never committed)
├── set-version.js  run before pushing CSS/JS changes (see below)
└── start-local.bat starts the site on your PC
```

## Run it on your PC

1. Install XAMPP and start **MySQL** in the XAMPP Control Panel.
2. First time only, in this folder: `C:\xampp\php\php.exe api/install.php` (creates the database, tables and `api/config.php`).
3. Double-click `start-local.bat` and open http://127.0.0.1:8000.

Emails are not really sent on your PC: they are saved as `.html` files in `api/storage/mail/` (with any attachments).

## Everyday changes

| I want to… | Do this |
|---|---|
| Show an event or promo banner | Put the picture in `assets/banners/`, add a line in `assets/banners/banners.js` (`pages`, `start`, `end`; instructions at the top of the file). Desktop 1600 × 500, phone 800 × 600 |
| Change the clubs on the globe | Put logos in `assets/clubs/` and edit `assets/clubs/clubs.js` (only clubs that agreed to be shown) |
| Change a text | Edit the page, then change the same English line in `js/shared/i18n.js` so the Bahasa Melayu still matches |
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
- [ ] Connect Billplz **sandbox**, test real FPX/card test payments, then switch to **live** keys
- [ ] Connect email (SMTP) and test every email, including the certificate attachment
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
club-register.html ──POST api/signup.php──▶ club + lead (Pending Payment) + certificate file · emails to client + sales
payment.html       ──POST api/checkout.php──▶ invoice + Billplz bill ──▶ Billplz payment page
                   ◀── api/billplz-return.php (+ billplz-callback.php) re-checks the bill, then marks it paid and sends the emails
index.html form    ──POST api/contact.php──▶ lead (source "Contact form") · emails to sales + visitor
```

- The registration certificate (PDF / JPG / PNG, up to 5 MB) is checked on the server, stored in
  `api/storage/uploads/ssm/` (never committed, blocked from the web) and attached to the sales emails.
- **Test mode:** when `PRODUCTION_API` in `js/shared/config.js` is empty and the site is not on your PC, everything runs
  in the browser (`js/shared/mock-api.js`); payments go to `arena/mock-gateway.html`. In the browser console,
  `DCLIX_MOCK.data()` shows what was saved and `DCLIX_MOCK.reset()` clears it.

**Settings in `api/config.php`** (never commit this file)

| Setting | What it does |
|---|---|
| `billplz.mode` | `mock` = test page · `sandbox` = Billplz sandbox · `live` = real money |
| `billplz.api_key`, `collection_id`, `x_signature_key` | From the Billplz account |
| `mail.driver` | `log` = save emails to `api/storage/mail/` · `smtp` = really send (fill in `mail.smtp`) |
| `mail.sales_to` | Inbox for new-signup, payment and enquiry emails |
| `login_url` | Club Login address in the welcome email |
| `site_url`, `api_url`, `allowed_origins` | Public addresses and the websites allowed to call the API |
| `debug` | `true` only on your PC |

**Going live**

1. Upload `api/` to PHP hosting with HTTPS, create the MySQL database and `config.php`, run `php api/install.php`.
2. In `config.php`: `debug => false`, real addresses, Billplz keys, SMTP, `sales_to`.
3. Set `PRODUCTION_API` in `js/shared/config.js`, run `node set-version.js`, push.
4. Back up the database **and** `api/storage/uploads/` (club certificates) every day.

**Security**

- Card and bank details are entered only on Billplz; a signup is marked paid only after the bill is re-checked.
- Secrets stay in `api/config.php` (git-ignored). `api/.htaccess` blocks web access to config, code and storage on Apache.
- Signup and the contact form are rate-limited per IP address.

</details>
