# D-Clix Club Management + Competition Portal (static site)

## Run it
- Website only: double-click `index.html`.
- Website + database + admin (signup, payments, emails): see **Backend** below, then double-click `start-local.bat`.

## Deploy anywhere
Upload the whole folder to any static host: your company web server / cPanel (`public_html`), Netlify, GitHub Pages,
Cloudflare Pages, Nginx/Apache, AWS S3. All links are relative, so no rewrite rules are needed.

## Site flow
- **Visitor → client:** Home / Pricing → Select Plan → Club details → Payment → Done (a 4-step progress bar on each step; the plan can also be chosen on the registration page).
- **Login:** every "Club Login" / "Login" opens `admin-login.html`. If a logged-out person opens an admin link (e.g. from an alert email), they return to that page after logging in.
- **Competition portal:** Register Now → Pricing; Competition Setting → Admin → Tournaments (login required).

## Pages
| File | Page |
|---|---|
| index.html | Home |
| about.html | About D-Clix |
| pricing.html | Plans (monthly / yearly) |
| edu-hub.html | Edu-Hub + PDF guide download |
| referral.html | Referral program slideshow |
| competition.html | D-CLIX Arena: sport selector, news, rankings, fixtures |
| live.html?sport=karate | Watch Live (live / brackets / schedule / winners) |
| club-register.html?sport=karate | Club registration |
| player-register.html?sport=karate | Player registration |
| dashboard.html?sport=karate | Club login destination / dashboard |
| admin-login.html | Admin portal login |
| admin.html | Admin portal (all modules, see below) |
| payment.html | Signup step 2: plan + billing details, then Billplz |
| payment-status.html | Where clients land after paying (paid / failed / pending) |
| privacy.html · terms.html | Privacy Policy and Terms & Conditions (have them reviewed before launch) |
| 404.html | "Page not found" page (GitHub Pages shows it for any missing address) |

## Files
css/style.css · js/theme.js (saved theme) · js/icons.js · js/sports.js (18 sports) · js/main.js (shared behaviour)
· js/competition.js (portal pages) · js/referral-data.js (slides) · assets/ (logo + images)

## Admin portal
Open `admin-login.html` (also linked from the home page footer). When the API is reachable the portal reads and saves
the MySQL database. Otherwise (e.g. on GitHub Pages before the API is hosted) it runs as an offline demo: expand
**Demo accounts** on the login page and click one to fill the form. All demo accounts share the password shown there. Five roles are included: Super Admin, Club
Admin, Centre Admin, Instructor and Finance. Each one sees different menus and data.

Double-clicking the file usually works. Some browsers restrict storage on `file://` pages, so if the login does not
stay, serve the folder over HTTP instead (for example `python -m http.server 8000`, then open
`http://localhost:8000/admin-login.html`).

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
| js/admin-data.js | Sample data generator and storage (`localStorage` key `dclix_admin_db_v1`) |
| js/admin.js | Core: session, permissions, data scope, router, table, forms, validation, charts, export, audit |
| js/admin-modules.js | Dashboard + Management modules |
| js/admin-operations.js | Attendance, Grading, Activities, Tournaments, Rankings |
| js/admin-finance.js | Finance + Inventory modules |
| js/admin-sales.js | Leads (website signups), Subscriptions (plan invoices / Billplz), Email Log |
| js/admin-automation.js | Signup Automation dashboard, full lead record (timeline, raw data), Simulate signup |
| js/admin-system.js | Notifications, Reports, Users, Roles, Approvals, Audit, Settings, Profile, menu order |
| js/config.js | Where the API lives (`PRODUCTION_API`) + the `dclixApi()` helper |
| js/admin-login.js | Login, lockout, 2FA code, forgot / reset password |

Demo mode keeps everything in the browser and is **not secure** (roles can be bypassed). Use server mode for real data.

## Backend (PHP + MySQL) — the automated signup
```
pricing.html → Select Plan → club-register.html ──POST api/signup.php──▶ club + Club Admin login + lead (Pending Payment)
            → payment.html ──POST api/checkout.php──▶ invoice + Billplz bill ──▶ Billplz payment page
            ◀── api/billplz-return.php (+ api/billplz-callback.php) re-checks the bill with Billplz, then automatically:
                club Active + plan dates · Main Centre created · login activated · receipt number
                emails: welcome + receipt to the client, alerts to sales · shown in Admin → Leads, Subscriptions, Email Log
```

### Watching the automation (Admin → Sales → Automation)
- Health (server, payment mode, email mode, last signup/payment, signups stuck > 24 h), KPIs, a conversion funnel
  (Registered → Reached payment → Paid → Logged in → Set up club), signups per day, plan/billing/sport mix,
  a live activity feed (auto-refresh every 20 s) and a table of every signup with its progress.
- Each lead (Sales → Leads → open one) shows a step tracker and tabs: Overview (all form + billing data and what the
  automation created), Timeline (every step with times), Payments (invoices + each payment attempt), Emails, Logins, Raw data.
- **Simulate signup** (only while `billplz.mode` is `mock`): runs the real website flow with made-up clubs and a chosen
  outcome (pays / cancels / leaves / registers only / random mix). Results are tagged "Simulated test" and
  **Remove simulated tests** deletes them with their clubs, logins, invoices, payment attempts and emails.

### Run it on your PC (XAMPP)
1. Start **MySQL** in the XAMPP Control Panel.
2. First time only, in this folder: `C:\xampp\php\php.exe api/install.php --demo`
   (creates database `dclix`, a MySQL user, `api/config.php`, the tables, sample data and the demo accounts).
   For a clean install without sample data use `--admin-email=… --admin-name="…" --admin-password="…"` instead of `--demo`.
3. Double-click `start-local.bat` and open http://127.0.0.1:8000.

### Configuration — `api/config.php` (git-ignored, never commit it)
| Setting | What it does |
|---|---|
| `billplz.mode` | `mock` = built-in test payment page · `sandbox` = Billplz sandbox · `live` = real money |
| `billplz.api_key`, `collection_id`, `x_signature_key` | From your Billplz account (Settings / Billing) |
| `mail.driver` | `log` = save emails in Admin → Email Log only · `smtp` = really send (fill in `mail.smtp`) |
| `mail.sales_to` | Inbox that receives new-signup and payment alerts |
| `site_url`, `api_url` | Public addresses used in emails and for Billplz redirects/callbacks |
| `allowed_origins` | Websites allowed to call the API (add your GitHub Pages address) |
| `debug` | `true` only on your PC: shows error details and one-time codes on screen |

### Going live (GitHub Pages website + API on PHP hosting)
1. Upload the `api` folder to PHP hosting with HTTPS (e.g. company cPanel), create a MySQL database and a `config.php`
   there, then run `php api/install.php --admin-email=… --admin-password=…` (or import `schema.sql`).
2. In `api/config.php`: `debug => false`, real `site_url` (the GitHub Pages address), `api_url`, Billplz keys, SMTP.
3. In `js/config.js` set `PRODUCTION_API` to the HTTPS address of the api folder and push to GitHub.
4. Billplz callbacks cannot reach a home PC, so locally payments are confirmed only by the redirect back to the site.
   Once hosted, the callback (`api_url` + `/billplz-callback.php`, sent with each bill) confirms them even if the client closes the browser.

### Security notes
- Passwords are hashed with bcrypt on the server; sessions use random tokens (only their hash is stored) with the idle timeout from Settings.
- Every save is re-checked on the server against the user's role permissions and club/centre scope.
- Card and bank details are entered only on Billplz. A club is activated only after the bill is re-checked with Billplz.
- Secrets live in `api/config.php`, which is git-ignored. `api/.htaccess` blocks web access to config, lib, seed and logs on Apache.

### Not automated yet
- Renewal invoices when a subscription is about to end (Subscriptions shows "Renewals due" so sales can follow up).
- Clubs whose subscription has ended are not suspended automatically.

## Things to connect (marked `TODO` in the JS)
1. Player registration (competition.js) only validates in the browser. Club registration and the home page contact form
   (saved as a lead, source "Contact form", with emails to sales and the visitor) are connected to the API.
2. Social media icons were removed from the footers until real Facebook / Instagram / LinkedIn addresses are available.
3. Boxing/MMA hero tiles, testimonial avatars, dashboard photos, news and referral slides load from the same remote
   image URLs the prototype used. Download them (or your own photos) into assets/images and update the src values.
4. Live scores, rankings, fixtures and tournaments are sample data.
