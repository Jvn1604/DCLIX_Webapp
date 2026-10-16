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
| pricing.html | Plans (monthly / yearly) |
| edu-hub.html | Edu-Hub + PDF guide download |
| referral.html | Referral program slideshow |
| competition.html | D-CLIX Arena: sport selector, news, rankings, fixtures |
| live.html?sport=karate | Watch Live (live / brackets / schedule / winners) |
| club-register.html?sport=karate | Club registration |
| player-register.html?sport=karate | Player registration |
| payment.html?plan=basic&billing=monthly | Payment: plan, card and billing details (demo, no real charge) |
| dashboard.html?sport=karate | Club login destination / dashboard |
| admin-login.html | Admin portal login |
| admin.html | Admin portal (all modules, see below) |

## Main user flow
1. **pricing.html** → click **Select Plan** (the plan and monthly/yearly choice are carried along).
2. **payment.html** → if the club is not registered yet, click **Register it here**.
3. **competition.html** → pick a sport, then **New Club Registration**.
4. **club-register.html** → **Save Club** returns to the payment page with the club details filled in.
5. **payment.html** → pay (demo) → **dashboard.html** shows the club name, code and plan.

## Site map
- **Marketing site:** index · about · pricing · edu-hub · referral
- **Arena (portal):** competition → live · club-register · player-register · dashboard · payment
- **Admin:** admin-login → admin

## Change the theme colour
Edit the three lines at the top of `css/style.css`: `--accent`, `--accent-light` and `--accent-rgb` (the same colour as R,G,B numbers).
Nothing else needs changing. The logo is an image and keeps its own colours.

## Files
css/style.css · js/theme.js (saved theme) · js/icons.js · js/sports.js (18 sports) · js/main.js (shared behaviour)
· js/competition.js (portal pages) · js/payment.js (payment page) · js/referral-data.js (slides) · assets/ (logo + images)

## Admin portal (front-end demo)
Open `admin-login.html` (also linked from the home page footer). Expand **Demo accounts** on the login page and click
one to fill the form. All demo accounts share the password shown there. Five roles are included: Super Admin, Club
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
| js/admin-system.js | Notifications, Reports, Users, Roles, Approvals, Audit, Settings, Profile, menu order |
| js/admin-login.js | Login, lockout, 2FA code, forgot / reset password |

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
   The payment page (payment.js) is a demo too: connect a real payment gateway there. Card details must go straight to the gateway, never to your own server.
2. "Club Login" opens the demo dashboard. Add real authentication.
3. Boxing/MMA hero tiles, testimonial avatars, dashboard photos, news and referral slides load from the same remote
   image URLs the prototype used. Download them (or your own photos) into assets/images and update the src values.
4. Live scores, rankings, fixtures and tournaments are sample data.