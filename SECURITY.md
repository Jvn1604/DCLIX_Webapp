# D-Clix website security

The repository is **public**: anyone can read every file and every old version of it.
This page lists what protects the site today, what both of us must always do, and what has to be
in place before the real API and club data go live.

---

## 1. Already in place

| Protection | What it stops | Where |
|---|---|---|
| Content Security Policy on every page | Injected scripts, unknown trackers, sending data to other websites | `<meta>` in each page, written by `node set-security.js` |
| Referrer policy | Full page addresses leaking to other websites | same |
| Clickjacking guard | Another website showing D-Clix in a hidden frame to trick clicks | `js/shared/theme.js` |
| Safe links | `javascript:` or `data:` links sneaking into banners; new tabs controlling our page (`noopener noreferrer`) | `js/shared/banner.js`, all pages |
| Safe page building | Data from the server or the address bar being run as code | `js/arena/payment.js`, `arena/payment-status.html` |
| No passwords in the browser | Test mode keeps no form of the password | `js/shared/mock-api.js` |
| Secrets never committed | Keys and database passwords in a public repo | `api/config.php` and `api/storage/` are git-ignored (checked: never committed) |
| Server headers, ready for company hosting | HTTPS only (HSTS), framing, file-type guessing, hidden project files | `.htaccess`, `api/.htaccess` |
| API (already built) | Wrong websites calling the API, fake payments, floods, bad uploads | CORS allow-list, Billplz signature + bill re-check, rate limits, file checks in `api/` |

**Re-run before pushing** when you add a `<script>` block to a page, use a new outside service, or connect the API:
`node set-security.js` (then `node set-version.js`).

---

## 2. GitHub settings to switch on now (repository owner)

- [ ] **Two-factor authentication** on both GitHub accounts (Settings → Password and authentication).
- [ ] **Protect the `main` branch** (Settings → Branches → Add rule for `main`): require a pull request with 1 approval and block force pushes.
      This also stops the "old copy overwrote new work" problem we keep having.
- [ ] **Secret scanning + push protection** (Settings → Code security): GitHub blocks pushes that contain keys or passwords.
- [ ] **Dependabot alerts** (same page).
- [ ] **GitHub Pages → Enforce HTTPS** (Settings → Pages).
- [ ] Collaborators get the **Write** role, never Admin.

## 3. Rules for both of us

- Never commit `api/config.php`, `.env` files, API keys, Billplz keys, database passwords or SMTP passwords.
  If one is ever pushed, **change the key immediately**; deleting the file is not enough, because the old version stays in git history.
- Never commit real client data: registrations, SSM certificates, exported emails, screenshots showing names, phone numbers or ICs.
  Test with sample data only (the test mode banner says this too).
- Don't paste keys or passwords into WhatsApp, GitHub issues, commit messages or AI chats.
- Pull before you start (`git pull origin main`), so security fixes are not overwritten by an old copy.
- Only add outside scripts (analytics, chat widgets, pixels) after agreeing on it; each one can read everything on the page.
  When added, list its address in `set-security.js` and run it.

---

## 4. Before the real API and club data go live

**Server**
- [ ] HTTPS only, with a valid certificate; keep the HSTS line in `.htaccess` only after HTTPS works.
- [ ] `api/config.php`: `debug => false` (error details must never reach visitors), real `allowed_origins` only, `billplz.mode` = `live`.
- [ ] Set the Billplz **X-Signature key**: without it, signature checks are skipped (the bill is still re-checked with Billplz).
- [ ] Database: strong unique password, the app user has only the rights it needs (created that way by `install.php`), no remote root login.
- [ ] Put `api/config.php` and `api/storage/` outside `public_html` if the host allows; otherwise keep the `.htaccess` blocks.
- [ ] Do not upload `start-local.bat`, `README.md`, `set-*.js` or `api/install.php` (or delete `install.php` after running it).
- [ ] Keep PHP and MySQL updated; use the host's firewall / ModSecurity if offered.
- [ ] Add the API address to `API_ORIGINS` in `set-security.js`, set `PRODUCTION_API` in `js/shared/config.js`, run both scripts.

**Data (PDPA 2010)**
- [ ] Collect only what is needed. Uploaded certificates are personal/company documents: only sales staff should open them.
- [ ] Decide how long to keep data: e.g. delete unpaid registrations and their certificates after 6 months.
- [ ] Daily encrypted backups stored off the server; test a restore.
- [ ] A Privacy Policy that says what is collected, why, for how long, and how to ask for a copy or correction.
- [ ] Name a person responsible for data protection at the company.

**Testing**
- [ ] Check the live site on https://securityheaders.com and https://observatory.mozilla.org (aim for A).
- [ ] Run OWASP ZAP (free) against a staging copy, or get a professional penetration test before launch.

---

## 5. If you suspect a data breach

1. **Contain:** change the affected passwords and keys (database, Billplz, SMTP, hosting, GitHub), take the API offline if needed.
2. **Keep evidence:** don't delete logs; note the time, what was seen and who noticed it.
3. **Tell the company's management immediately**, and let them decide with their legal adviser on notifying the
   Personal Data Protection Commissioner and the affected clubs. Malaysia's amended PDPA requires breach notification
   within strict time limits, so do this the same day.
4. **Fix the cause**, then restore from a clean backup if anything was changed.
5. Write down what happened and what was changed, and add it to this file.
