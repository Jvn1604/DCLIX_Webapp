# Testing the website with the real portal API

For testing on your own PC. Everything you submit goes to the MAClub portal's **staging** system:
use sample details only, and note the club codes you use.

## 1. One-time setup

1. **Get the latest code.** In the project folder:
   ```
   git pull origin main
   ```
   If git says your local changes would be overwritten, **stop and ask Jeeven** — don't force it,
   don't copy old files over new ones.
2. **XAMPP:** you only need it installed. Don't start Apache or MySQL (the site doesn't use them).
3. **Config file with the keys.** Jeeven gives you `config.php` privately (never in WhatsApp groups, GitHub or an AI chat).
   Put it in `api\config.php`. It is git-ignored, so it is never committed. Check:
   ```
   git status
   ```
   `api/config.php` must **not** appear in the list.

## 2. Start the site

1. Double-click `start-local.bat` in the project folder. A black window opens; keep it open.
2. Use **http://127.0.0.1:8000/** in the browser. Not `file:///…` (opening the HTML file directly can't reach the API).
3. Open http://127.0.0.1:8000/api/public.php?action=health → you must see `{"ok":true,...}`.
   - `{"ok":false}` or an error → the keys or the internet connection; send Jeeven a screenshot.
   - "SSL certificate problem" in the black window → in `api\config.php` set
     `'ca_bundle' => 'C:/Program Files/Git/usr/ssl/certs/ca-bundle.crt'`.

## 3. Tests

Write down for each test: date/time, club code or name used, what you saw (screenshot if wrong).

**A. Contact form** — http://127.0.0.1:8000/contact.html
1. Click Send with everything empty → a red message under each field.
2. Fill it in with name `TEST - please ignore` and send → "Thanks! We have received your details…".
3. Send exactly the same again → still "Thanks!" (the portal keeps only one).

**B. Register form** — open from the pricing page (Get started on Basic, Standard, Premium) or
http://127.0.0.1:8000/arena/club-register.html?plan=basic&billing=monthly
1. Click Save Club with everything empty → red messages, including the SSM upload and the terms tick box.
2. Choose a **yearly** plan and fill everything → "Yearly plans open soon. Please choose the monthly option for now."
3. Fill everything with a **new** club code (e.g. `TEST` + your initials + a number), monthly plan, tick the terms,
   Save Club → "Club saved!" then the **Boost** payment page opens (`stage-pay.boostconnect.biz`).
   Check the amount: Basic 100 · Standard 150 · Premium 200.
4. Go back and submit the **same** club code and email again → it should take you back to the same Boost page
   (no second order).
5. Double-click Save Club quickly on a new club code → only one order.
6. Pick a club type the portal doesn't have (e.g. Football) → should still go to Boost (sent as "Others").
7. Type a wrong promo code → an error on the promo field.

**C. After Boost** (needs the API developer's fixes — skip if not ready, see PORTAL-TODO.md)
1. Pay on the Boost staging page → you come back to `payment-status.html` → "Payment received".
2. Cancel on Boost → "Payment not completed".
3. Right now the result page says "We could not reach the D-Clix system" — that is expected until the portal fixes its status call.

**D. Both languages and phone**
- Repeat A and B1 with the language switch on BM, in dark and light theme, and on a phone-width window.

## 4. When you finish

1. Close the black window to stop the site.
2. Send Jeeven your notes **and the list of club codes / names you used**, so the API developer can delete the test orders.
3. Don't commit anything from testing. If you changed files by mistake: `git checkout -- .`

Where the data goes: the portal (staff login) → Website CMS > Registrations and Enquiries. Our site saves nothing itself.
