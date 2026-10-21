# D-Clix Club Management (static site)

## Run it
- Website only: double-click `index.html`.
- Website + database (signup, payments, emails): see **Backend** below, then double-click `start-local.bat`.

## Deploy anywhere
Upload the whole folder to any static host: your company web server / cPanel (`public_html`), Netlify, GitHub Pages,
Cloudflare Pages, Nginx/Apache, AWS S3. All links are relative, so no rewrite rules are needed.

## Site flow
- **Visitor → client:** Home / Pricing → Select Plan → Club details → Payment → Done (a 4-step progress bar on each step; the plan can also be chosen on the registration page).
- **After payment:** the client and the sales team both get an email. The client's welcome email has a "Log in to D-Clix" button.
- **Login:** every "Club Login" / "Log in" button opens the D-Clix club system at
  `https://www.maclubsystem.com/index.php?/login/proceed`. This website has no admin portal or login of its own.
  The address used in emails is `login_url` in `api/config.php`.

## Folder layout
```
index.html, about.html, pricing.html, edu-hub.html, community.html   Marketing site (root)
privacy.html, terms.html, refund.html, 404.html                     Legal pages + "page not found"
arena/      club-register, payment, payment-status, mock-gateway (signup + payment flow)
api/        PHP + MySQL backend (see "Backend" below; api/config.php is never committed)
css/        style.css (shared + theme colour)
js/shared/      theme.js, icons.js, main.js, config.js (where the API is), mock-api.js (browser test API), i18n.js (English / Bahasa Melayu), whatsapp.js (chat button)
js/arena/       sports.js (club types), signup.js (club registration), payment.js
assets/     logo, favicon, images
```
Pages inside `arena/` load shared files with `../` (for example `../css/style.css`).

## Change the theme colour
Edit the three lines at the top of `css/style.css`: `--accent`, `--accent-light` and `--accent-rgb` (the same colour as R,G,B numbers).

## Pages
| File | Page |
|---|---|
| index.html | Home |
| about.html | About D-Clix |
| pricing.html | Plans (monthly / yearly) |
| edu-hub.html | Edu-Hub + PDF guide download |
| community.html | Join Our Community (WhatsApp + Facebook) |
| arena/club-register.html?sport=karate | Club registration |
| arena/payment.html | Signup step 2: plan + billing details, then Billplz |
| arena/payment-status.html | Where clients land after paying (paid / failed / pending) |
| arena/mock-gateway.html | Test payment page used by the browser test API (no real money) |
| privacy.html · terms.html · refund.html | Privacy Policy, Terms & Conditions (company text) and No Refund Policy (draft) |
| 404.html | "Page not found" page (GitHub Pages shows it for any missing address) |

## Files
css/style.css · js/shared/theme.js (saved theme) · js/shared/icons.js · js/arena/sports.js (18 sports) · js/shared/main.js (shared behaviour)
· js/arena/signup.js (club signup) · assets/ (logo + images)

| File | Purpose |
|---|---|
| js/shared/config.js | Where the API lives (`PRODUCTION_API`) + the `dclixApi()` helper |
| js/shared/mock-api.js | Browser TEST API used when there is no server (see below) |

## Backend (PHP + MySQL) — the automated signup
```
pricing.html → Select Plan → arena/club-register.html ──POST api/signup.php──▶ club + lead (Pending Payment) · emails to client + sales
            → arena/payment.html ──POST api/checkout.php──▶ invoice + Billplz bill ──▶ Billplz payment page
            ◀── api/billplz-return.php (+ api/billplz-callback.php) re-checks the bill with Billplz, then automatically:
                club marked Paid/Active + plan dates · receipt number
                emails: welcome (with the Club Login link) + receipt to the client, "payment received" to sales
home page contact form ──POST api/contact.php──▶ lead (source "Contact form") · emails to sales + the visitor
```
Everything is saved in the MySQL database (`records`, `bills`, `email_outbox` …) so nothing is lost; the sales team
works from the emails. The club's account in the D-Clix club system (maclubsystem.com) is set up by the team.

### Browser test API (GitHub Pages without a server)
When `PRODUCTION_API` in `js/shared/config.js` is empty and the site is not on `localhost` / `127.0.0.1`,
signup, payment and the contact form use `js/shared/mock-api.js` instead of the PHP API. Payments go to
`arena/mock-gateway.html` (Pay / Cancel, no money) and everything — including the emails that would be sent — is
saved only in that browser (localStorage key `dclix_test_api`). To look at it, open the browser console and run
`DCLIX_MOCK.data()`; `DCLIX_MOCK.reset()` clears it.

### Run it on your PC (XAMPP)
1. Start **MySQL** in the XAMPP Control Panel.
2. First time only, in this folder: `C:\xampp\php\php.exe api/install.php`
   (creates database `dclix`, a MySQL user, `api/config.php`, the tables and the plan prices).
3. Double-click `start-local.bat` and open http://127.0.0.1:8000.
4. With `mail.driver = log`, emails are not sent; they are saved in `api/storage/mail/` (open the `.html` files) and in the `email_outbox` table.

### Configuration — `api/config.php` (git-ignored, never commit it)
| Setting | What it does |
|---|---|
| `billplz.mode` | `mock` = built-in test payment page · `sandbox` = Billplz sandbox · `live` = real money |
| `billplz.api_key`, `collection_id`, `x_signature_key` | From your Billplz account (Settings / Billing) |
| `mail.driver` | `log` = save emails in `api/storage/mail/` only · `smtp` = really send (fill in `mail.smtp`) |
| `mail.sales_to` | Inbox that receives new-signup, payment and enquiry alerts |
| `login_url` | Club Login address used in the welcome email (default: maclubsystem.com login) |
| `site_url`, `api_url` | Public addresses used in emails and for Billplz redirects/callbacks |
| `allowed_origins` | Websites allowed to call the API (add your GitHub Pages address) |
| `debug` | `true` only on your PC: shows error details on screen |

### Going live (GitHub Pages website + API on PHP hosting)
1. Upload the `api` folder to PHP hosting with HTTPS (e.g. company cPanel), create a MySQL database and a `config.php`
   there, then run `php api/install.php` (or import `schema.sql`).
2. In `api/config.php`: `debug => false`, real `site_url` (the GitHub Pages address), `api_url`, Billplz keys, SMTP.
3. In `js/shared/config.js` set `PRODUCTION_API` to the HTTPS address of the api folder and push to GitHub.
4. Billplz callbacks cannot reach a home PC, so locally payments are confirmed only by the redirect back to the site.
   Once hosted, the callback (`api_url` + `/billplz-callback.php`, sent with each bill) confirms them even if the client closes the browser.

### Security notes
- Card and bank details are entered only on Billplz. A signup is marked paid only after the bill is re-checked with Billplz.
- Secrets live in `api/config.php`, which is git-ignored. `api/.htaccess` blocks web access to config, lib and logs on Apache.
- Signup and the contact form are rate-limited per IP address.

### Not automated yet
- Creating the club's account in the D-Clix club system (maclubsystem.com) — the sales team does this after the "payment received" email.
- Renewal invoices when a subscription is about to end, and suspending clubs whose subscription has ended.

## Things to connect (marked `TODO` in the JS)
1. Club registration and the home page contact form
   (saved as a lead, source "Contact form", with emails to sales and the visitor) are connected to the API.
2. Boxing/MMA hero tiles, testimonial avatars, dashboard photos, news and referral slides load from the same remote
   image URLs the prototype used. Download them (or your own photos) into assets/images and update the src values.
3. Live scores, rankings, fixtures and tournaments are sample data.

## To-do task list
Tick a box (`[x]`) when a task is done. **P1** = before going live · **P2** = soon after · **P3** = nice to have.

### 🔧 Fix
- [ ] **P1** Make all database tables use the same collation (`utf8mb4_unicode_ci`). Some tables use the default `utf8mb4_general_ci`, which breaks queries that join them.
- [ ] **P3** Plans and prices are written in three places (`js/shared/main.js`, `js/arena/signup.js`, database `settings.plans`). Load them from the API everywhere.

### 🔄 Update / connect
- [ ] **P1** Home page placeholders (marked with comments in `index.html`) — replace once the company sends the material:
  the dashboard mock-up in the hero (sample data) → a real screenshot of the club system; the "Made for every kind of club" sports strip → real club logos (with permission);
  the numbers band (18 sports, 3 attendance methods…) → real usage figures; testimonial initials → real photos, club names and states.
- [ ] **P1** Confirm the home page claims with the company: parents' FPX payments in the club system, support by WhatsApp, contact "within one working day", yearly plan = two months free.
- [ ] **P1** Connect the **Billplz sandbox** (API secret key, collection ID, XSignature key in `api/config.php`, `billplz.mode = sandbox`) and test real FPX/card test payments.
- [ ] **P1** Connect **email (SMTP)** — Brevo or company mail — set `mail.driver = smtp`, `from_email`, `sales_to`, then test every email type. The SMTP code is written but untested.
- [x] **P1** Privacy Policy and Terms & Conditions replaced with the company's own published text (see "Match the live site" for open issues).
- [ ] **P1** Confirm contact details, FAQ wording and the copyright year in every footer.
- [ ] **P2** The registration form still asks the client to choose a password, but login now happens on maclubsystem.com. Decide whether to remove the password fields or pass them to the club system.
- [ ] **P2** Download the remote images (Boxing/MMA tiles, testimonials, news, referral slides) into `assets/images/` and update the `src` values.
- [ ] **P2** Replace sample data (live scores, rankings, fixtures, tournaments) with real data.

### 🆚 Match the live site (d-clix.com)
- [ ] **P1** Confirm the **office address**: live English site says Suite **3A42** Level 4, live Malay site says Suite **650** Level 6, this site says Suite **442** Level 4.
- [ ] **P1** Plan names and prices: live site uses **Basic / Advance / Premium**, monthly only, with promo prices (~~RM199.90~~ RM100, ~~RM269.90~~ RM150, ~~RM309.90~~ RM200) and different feature lists; this site uses Basic / Standard / Premium, monthly + yearly.
- [x] **P1** Privacy Policy and Terms now use the company's exact text from the live site; clients must tick "I agree" on the payment page (time + IP saved on the lead).
- [ ] **P1** Signup sells **monthly or yearly** plans, but the Terms say subscriptions **auto-renew every 12 months** with an early-termination penalty — the company must decide which is correct, then update either the plans or the Terms.
- [ ] **P1** **No Refund Policy** (`refund.html`) is a draft written from the company's Terms because the live page does not exist — the company must approve or replace it, then remove the yellow "Draft for company approval" box. It is linked from every footer, the pricing page and the payment "I agree" box.
- [ ] **P2** Ask the company to fix their legal text: the Privacy Policy contains a drafting note ("This revised section aligns with the Software Subscription Agreement…"), refers to Sections 9.1, 10, 11.4 and 12.1 that do not exist, and one Terms list item is missing "iii.". The Privacy Policy is also mostly contract terms — PDPA 2010 normally needs a notice saying what personal data is collected, why, and how to request access or correction.
- [x] **P2** Testimonials now match the live English site (Coach Ashraff, Master Uthaya Kumar, Cikgu Akmal Hamdi).
- [ ] **P2** Hero wording: live site says "Your club details at your fingertips manage it anytime anywhere".
- [x] **P2** "Club Login" opens maclubsystem.com, the same as the live site (the admin portal was removed).
- [ ] **P3** Report to the live site owner: the "No Refund Policy" link on the pricing page is broken, and the Malay home page still shows template text ("Ini adalah ruang untuk mengalu-alukan pengunjung…").
- [ ] **P3** The user manual PDF links to the live site's copy; save it into `assets/` if it should not depend on d-clix.com.
- [ ] **P3** Bahasa Melayu covers the main website pages; the signup forms and legal pages are English only.

### ✨ Improve
- [ ] **P2** Automatic **renewal invoices** before a subscription ends.
- [ ] **P2** Create the club's account in maclubsystem.com automatically after payment, if that system offers an API.
- [ ] **P3** Scheduled clean-up of old rate-limit records and logs.
- [ ] **P3** SEO: `sitemap.xml`, `robots.txt`, social preview images, page descriptions.
- [ ] **P3** Bahasa Melayu version of the emails.
- [ ] **P3** Accessibility check (keyboard use, screen readers, colour contrast) on every page.

### 🗑️ Delete / clean up
- [ ] **P1** Remove test records (e.g. Phoenix Martial Arts Academy) from the database before launch, or reinstall it.
- [ ] **P1** On the live server: `debug => false`, `billplz.mode` ≠ `mock` (this also disables `api/mock-gateway.php`).
- [ ] **P2** The database still has tables left from the removed admin portal (`users`, `sessions`, `auth_codes`, `login_log`). They are harmless; drop the unused ones when convenient.
- [ ] **P2** Delete the git backup tags `backup/my-work-before-merge` and `backup/github-before-merge` once everyone confirms nothing is missing.
- [ ] **P3** Remove CSS and images left over from the original prototype that no page uses.
- [ ] **P3** `start-local.bat` is for local testing only — do not upload it to the live server.

### ✅ UAT (user acceptance testing)
**Website**
- [ ] Every page opens from the menu and footer on desktop and phone, in dark and light theme.
- [ ] Every "Club Login" / "Log in" button opens the maclubsystem.com login page.
- [ ] Contact form: valid enquiry saved (lead with source "Contact form", emails to sales and the visitor); missing/invalid fields show messages.
- [ ] Unknown address shows the 404 page (on GitHub Pages too).

**Signup and payment**
- [ ] Pricing → Select Plan (each plan, monthly and yearly) → registration shows the right plan; plan can be changed there.
- [ ] Validation: empty fields, invalid email, weak password, passwords not matching, duplicate club code, existing email.
- [ ] Signup → client gets "Complete your registration" email, sales gets "New signup" email.
- [ ] Payment success → client gets welcome (with Club Login link) + receipt emails, sales gets "Payment received" email.
- [ ] Payment cancelled → "Try again" works with saved details.
- [ ] "Complete payment" link from the email works; registering again with the same email + password continues the same signup.
- [ ] Amounts on invoice, receipt and Billplz bill match (price + RM 1.20 fee).

**Browsers and devices**
- [ ] Chrome, Edge, Firefox on Windows; Safari on iPhone; Chrome on Android.

### 🚀 Go-live checklist
- [x] PHP hosting with HTTPS (e.g. company cPanel) and a MySQL database.
- [ ] Upload `api/`, create `api/config.php` on the server, run `php api/install.php`.
- [ ] Set `site_url` (GitHub Pages address), `api_url`, `allowed_origins`, Billplz **live** keys, SMTP, `sales_to`, `login_url`.
- [ ] Set `PRODUCTION_API` in `js/shared/config.js` and push.
- [ ] Email sender domain set up (SPF/DKIM) so emails do not go to spam.
- [ ] Daily database backups switched on and a restore tested once.
- [ ] One real end-to-end signup with a small real payment, then refund it.
