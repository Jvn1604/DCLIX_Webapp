# D-Clix Club Management + Competition Portal (static site)

## Run it
- Quickest: double-click `index.html`.


## Deploy anywhere
Upload the whole folder to any static host: your company web server / cPanel (`public_html`), Netlify, GitHub Pages,
Cloudflare Pages, Nginx/Apache, AWS S3. All links are relative, so no rewrite rules are needed.

## Pages
| File | Page |
|---|---|
| index.html | Home |
| about.html | About D-Clix |
| pricing.html | Pricing: contact us for pricing |
| edu-hub.html | Edu-Hub + PDF guide download |
| referral.html | Referral program slideshow |
| arena/competition.html | D-CLIX Arena: sport selector, news, rankings, fixtures |
| arena/live.html?sport=karate | Watch Live (live / brackets / schedule / winners) |
| arena/club-register.html?sport=karate | Club registration |
| arena/player-register.html?sport=karate | Player registration |
| arena/dashboard.html?sport=karate | Club login destination / dashboard |
| admin/login.html | Admin portal login |
| admin/index.html | Admin portal (all modules, see below) |

## Main user flow
1. **arena/competition.html** → pick a sport, then **New Club Registration**.
2. **arena/club-register.html** → **Save Club** → **arena/dashboard.html** shows the club name and code.
3. Anyone who asks about pricing is sent to the contact form (`index.html#contact`) or the phone number on **pricing.html**.

## Site map
- **Marketing site:** index · about · pricing · edu-hub · referral
- **Arena (portal, `arena/`):** competition → live · club-register · player-register · dashboard
- **Admin (`admin/`):** login → index (the admin portal)

## Change the theme colour
Edit the three lines at the top of `css/style.css`: `--accent`, `--accent-light` and `--accent-rgb` (the same colour as R,G,B numbers).
Nothing else needs changing. The logo is an image and keeps its own colours.

## Folder layout
```
index.html, about.html, pricing.html, edu-hub.html, referral.html   Marketing site (root)
arena/      competition, live, club-register, player-register, dashboard
admin/      login.html, index.html (admin portal)
css/        style.css (shared + theme colour), admin.css
js/shared/      theme.js, icons.js, main.js (used by every page)
js/arena/       sports.js (18 sports), competition.js (portal pages)
js/marketing/   referral-data.js (slides)
js/admin/       admin-*.js (see table below)
assets/     logo, favicon, images
```
Pages inside `arena/` and `admin/` load shared files with `../` (for example `../css/style.css`).

## Admin portal (front-end demo)
Open `admin/login.html` (also linked from the home page footer). Expand **Demo accounts** on the login page and click
one to fill the form. All demo accounts share the password shown there. Five roles are included: Super Admin, Club
Admin, Centre Admin, Instructor and Finance. Each one sees different menus and data.

Double-clicking the file usually works. Some browsers restrict storage on `file://` pages, so if the login does not
stay, serve the folder over HTTP instead (for example `python -m http.server 8000`, then open
`http://localhost:8000/admin/login.html`).

**Modules:** Dashboard (summary cards, 8 charts, quick actions) · Clubs · Training Centres · Students (profile tabs,
QR code, membership card, transfer, documents, history) · Instructors · Classes · Online Registration (link, QR,
form builder, approve → student) · Attendance (take with QR scan, records, summary %) · Grading (candidates, fees,
results, automatic promotion, certificates) · Activities · Tournaments (player selection, results, medals,
certificates) · Player Ranking · Payments · Collections (cash, online, reconciliation) · Invoices & Receipts (print /
PDF / email) · Refunds & Reimbursements (approval workflow) · Payroll (generate from sessions taught, payslips) ·
Outstanding (ageing, reminders) · Products · Stock · Purchase Requests · Deliveries · Notifications · Reports (25
reports) · Users · Roles & Permissions · Approval Centre · Audit Log + login history · Settings · My Profile.

Every list has search, filters, date range, sorting, pagination, rows per page, select all, bulk actions, export to
Excel (CSV) / PDF / print, plus loading, empty and error states.

| File | Purpose |
|---|---|
| css/admin.css | Admin styles (uses the colour tokens from style.css; light + dark) |
| js/admin/admin-data.js | Sample data generator and storage (`localStorage` key `dclix_admin_db_v1`) |
| js/admin/admin.js | Core: session, permissions, data scope, router, table, forms, validation, charts, export, audit |
| js/admin/admin-modules.js | Dashboard + Management modules |
| js/admin/admin-operations.js | Attendance, Grading, Activities, Tournaments, Rankings |
| js/admin/admin-finance.js | Finance + Inventory modules |
| js/admin/admin-system.js | Notifications, Reports, Users, Roles, Approvals, Audit, Settings, Profile, menu order |
| js/admin/admin-login.js | Login, lockout, 2FA code, forgot / reset password |

### Before using real data
The admin portal runs entirely in the browser. That is fine for a demo, but it is **not secure**:
- Anyone can read or change `localStorage` and the JavaScript, so roles and scoping can be bypassed.
- Passwords are hashed with SHA-256 in the browser only to show the flow. Use bcrypt/argon2 on a server.
- Nothing is sent by email, WhatsApp or push, and no payment gateway is connected.

To go live, add a backend (for example Supabase or a Node/PHP API with a database). Replace `ADMIN_DB.load/save` and
`ADMIN.put/remove` with API calls, and check every permission on the server. Keep API keys and gateway secrets in
server environment variables, **never in this repository** (it is public).

## Things to connect (marked `TODO` in the JS)
1. Contact form (main.js) and club/player registration (competition.js) only validate in the browser. Post them to your backend.
2. "Club Login" opens the demo dashboard. Add real authentication.
3. Boxing/MMA hero tiles, testimonial avatars, dashboard photos, news and referral slides load from the same remote
   image URLs the prototype used. Download them (or your own photos) into assets/images and update the src values.
4. Live scores, rankings, fixtures and tournaments are sample data.

## To-do task list
Tick a box (`[x]`) when a task is done. **P1** = before going live · **P2** = soon after · **P3** = nice to have.

### 🔧 Fix
- [ ] **P1** Player registration (`arena/player-register.html`) is not saved — connect it to the API and show players in the admin (`TODO` in `js/arena/competition.js`).
- [ ] **P1** Arena dashboard (`arena/dashboard.html`) is still a demo: anyone can open it, it shows "User", and "Logout" only goes back to the portal. Rebuild it on the real login or remove it.
- [ ] **P1** Make all database tables use the same collation (`utf8mb4_unicode_ci`). Some tables use the default `utf8mb4_general_ci`, which breaks queries that join them.
- [ ] **P2** "Mark overdue" runs in the browser when someone opens the dashboard — move it to a scheduled server job (cron).
- [ ] **P2** Record IDs are created in the browser; two admins adding at the same moment can clash ("please reload"). Let the server assign IDs.
- [ ] **P2** The admin reloads data only when you come back to the tab after 60 seconds — add live refresh for pages other than Automation.
- [ ] **P2** The QR-code library loads from a CDN; if it is blocked, QR codes fall back to text. Bundle it locally.
- [ ] **P3** Plans and prices are written in three places (`js/shared/main.js`, `js/arena/competition.js`, database `settings.plans`). Load them from the API everywhere.

### 🔄 Update / connect
- [ ] **P1** Connect the **Billplz sandbox** (API secret key, collection ID, XSignature key in `api/config.php`, `billplz.mode = sandbox`) and test real FPX/card test payments.
- [ ] **P1** Connect **email (SMTP)** — Brevo or company mail — set `mail.driver = smtp`, `from_email`, `sales_to`, then test every email type. The SMTP code is written but untested.
- [ ] **P1** Have **Privacy Policy** and **Terms & Conditions** reviewed by the company before launch.
- [ ] **P1** Confirm contact details, FAQ wording and the copyright year in every footer.
- [ ] **P2** Add the real Facebook / Instagram / LinkedIn links (icons were removed until then).
- [ ] **P2** Download the remote images (Boxing/MMA tiles, testimonials, news, referral slides) into `assets/images/` and update the `src` values.
- [ ] **P2** Replace sample data (live scores, rankings, fixtures, tournaments, admin demo data) with real data.
- [ ] **P2** The "Online Registration" link in the admin points to the player form, which is not connected yet — connect it so applications appear under Registration.
- [ ] **P3** WhatsApp and push notifications are recorded but not sent — connect a WhatsApp Business API / push provider.

### ✨ Improve
- [ ] **P2** Automatic **renewal invoices** before a subscription ends, and automatic **suspension** of clubs whose subscription expired.
- [ ] **P2** A **Plans** screen in Settings so prices can be changed without editing code or the database.
- [ ] **P2** Real **two-factor codes** by email/SMS once SMTP works (today the test setup shows the code on screen).
- [ ] **P2** Password reset by **email link** in addition to the 6-digit code.
- [ ] **P2** Notify admins (bell / email) instantly when a new signup or payment arrives.
- [ ] **P3** Load admin data page by page from the server when the database grows (today everything loads at login).
- [ ] **P3** Scheduled clean-up of old sessions, rate-limit records and logs; audit-log retention rule.
- [ ] **P3** SEO: `sitemap.xml`, `robots.txt`, social preview images, page descriptions.
- [ ] **P3** Bahasa Melayu version of the site and emails.
- [ ] **P3** Accessibility check (keyboard use, screen readers, colour contrast) on every page.

### 🗑️ Delete / clean up
- [ ] **P1** Do **not** run `install.php --demo` on the live server (demo accounts share a public password). Remove demo accounts and sample data from any shared database.
- [ ] **P1** Remove test records (e.g. Phoenix Martial Arts Academy) before launch — or reinstall the database without `--demo`.
- [ ] **P1** On the live server: `debug => false`, `billplz.mode` ≠ `mock` (this also disables `api/mock-gateway.php`).
- [ ] **P2** Delete the git backup tags `backup/my-work-before-merge` and `backup/github-before-merge` once everyone confirms nothing is missing.
- [ ] **P2** Decide whether to keep the browser-only **demo mode** of the admin (useful for GitHub Pages demos) or remove it once the API is hosted.
- [ ] **P3** Remove CSS and images left over from the original prototype that no page uses.
- [ ] **P3** `start-local.bat` and `api/seed/demo.json` are for local testing only — do not upload them to the live server.

### ✅ UAT (user acceptance testing)
**Website**
- [ ] Every page opens from the menu and footer on desktop and phone, in dark and light theme.
- [ ] Contact form: valid enquiry saved (Admin → Leads, source "Contact form"); missing/invalid fields show messages.
- [ ] Unknown address shows the 404 page (on GitHub Pages too).

**Signup and payment**
- [ ] Pricing → Select Plan (each plan, monthly and yearly) → registration shows the right plan; plan can be changed there.
- [ ] Validation: empty fields, invalid email, weak password, passwords not matching, duplicate club code, existing email.
- [ ] Payment success → club Active, Main Centre created, login works, receipt and welcome emails sent, sales alerted.
- [ ] Payment cancelled → "Try again" works with saved details; payment page left open → lead shows "Payment Pending".
- [ ] "Complete payment" link from the email works; registering again with the same email + password continues the same signup.
- [ ] Amounts on invoice, receipt, Billplz bill and Subscriptions page match (price + RM 1.20 fee).

**Login and security**
- [ ] Correct login; wrong password; lockout after 5 tries; unlock after the lock time.
- [ ] Forgot password → code → new password → login. Remember me. Session timeout after inactivity.
- [ ] Opening an admin link while logged out returns to that page after login.
- [ ] Each role (Super Admin, Club Admin, Centre Admin, Instructor, Finance) sees only its menus and only its club/centre data.
- [ ] A club admin cannot change its own plan, expiry date or another club's records.

**Admin portal**
- [ ] Create, edit, delete and search in every module; filters, date range, sorting, pagination, bulk actions.
- [ ] Export to Excel (CSV), PDF and Print from several lists; invoices, receipts, payslips, certificates and member cards print correctly.
- [ ] Attendance (manual + QR), grading result → student promoted, refund approval → payment marked Refunded, delivery → stock increased.
- [ ] Collections reconciliation shows "All three records agree" for a normal month.
- [ ] Automation: simulate signups (each outcome), numbers and funnel update, lead timeline is correct, "Remove simulated tests" cleans up.
- [ ] Email Log shows every email with the right content and links.

**Browsers and devices**
- [ ] Chrome, Edge, Firefox on Windows; Safari on iPhone; Chrome on Android.

### 🚀 Go-live checklist
- [x] PHP hosting with HTTPS (e.g. company cPanel) and a MySQL database.
- [ ] Upload `api/`, create `api/config.php` on the server, run `php api/install.php --admin-email=… --admin-password=…` (no `--demo`).
- [ ] Set `site_url` (GitHub Pages address), `api_url`, `allowed_origins`, Billplz **live** keys, SMTP, `sales_to`.
- [ ] Set `PRODUCTION_API` in `js/shared/config.js` and push.
- [ ] Email sender domain set up (SPF/DKIM) so emails do not go to spam.
- [ ] Daily database backups switched on and a restore tested once.
- [ ] One real end-to-end signup with a small real payment, then refund it.
