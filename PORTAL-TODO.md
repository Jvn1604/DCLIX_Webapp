# Portal API: open points

Differences between our website and the MAClub portal API (checked 2026-11-03).
Tick a box when it is sorted. Docs: https://www.maclubsystem.com/api-docs/index.html

## For the API developer

- [ ] **Status, options, quote and check return a plain 404.** `GET /registration/status/{ref}`, `/registration/options`,
      `/registration/quote` and `/registration/check` all answer 404 (not the JSON error), while `ping`, `packages`,
      `content`, `enquiry` and `POST /registration` work. Without `status` the result page can't show if a club paid.
- [ ] **Which address is staging?** The docs say staging = `demo.maclubsystem.com`, but it returns 404 for everything.
      `maclubsystem.com` works and says our client is `staging`. We use `https://maclubsystem.com` for now.
- [ ] **Result page.** Please set the page Boost/portal sends people back to:
      `https://<our site>/arena/payment-status.html` (the portal adds `?ref=…&state=…`).
- [ ] **New client secret before launch.** The staging secret has been pasted in chats; we also need a production client.
- [ ] **Test order to cancel:** "Test Club" / club code `TST01` / `t@example.com` (ref `1ca46cac-29f4-4d8e-a3c6-f776e664ffdf`),
      made while testing on 2026-11-03, never paid.

### Plans: the website is the master (decided 2026-11-03)

The portal should match the website's plans, not the other way round:

| Website (keep) | Monthly | Yearly | Portal today |
|---|---|---|---|
| Basic | RM100 | RM1,000 | BASIC RM100 monthly ✓ |
| Standard | RM150 | RM1,500 | **ADVANCE** RM150 monthly (rename to Standard) |
| Premium | RM200 | RM2,000 | PREMIUM RM200 monthly ✓ |
| — | | | **STARTER** RM29 (hide from the website, or remove) |

- [ ] Rename ADVANCE → **Standard** (name). The code can stay `ADVANCE`, or become `STANDARD` (then tell us, we change `PLAN_CODES` in `api/signup.php`).
- [ ] Hide STARTER from the website client (it isn't sold on the site).
- [ ] **Yearly prices** for Basic / Standard / Premium, and a way to choose monthly or yearly in `POST /registration`
      (e.g. a `billingCycle: "Monthly" | "Yearly"` field) and in `quote`. Until then the register page only offers monthly.
- [ ] Keep the portal prices the same as the website. The customer pays the **portal's** price, so if they differ,
      the site shows one price and Boost charges another.
- [ ] Yearly offers (e.g. Deepavali "2 months free on yearly") as a portal promo, once yearly exists.

## For the company to decide
- [ ] **Fields the portal can't take yet** (API developer: please add them to `POST /registration`).
      The register form keeps them (same as the live site) and checks them, but they are **not saved anywhere** until the
      portal accepts them: registration number (SSM / ROS / PJS), **SSM certificate upload**, address 1 and 2, state,
      country, branch, username. The portal uses the login email as the user ID.
- [ ] **Yearly plans.** The form still shows yearly (same as the live site), but picking yearly gives
      "Yearly plans open soon, choose monthly" until the portal has yearly prices.
- [ ] **Sports lists differ.** Portal has Archery, Education, Swimming, Others; the website has Football and no Swimming.
      Sports the portal doesn't know are sent as "Others".
- [ ] **Password rule.** The portal stores the password readable and emails it on approval (its docs say so). OK?
- [ ] **Promo codes.** The register form has a promo code box; codes are set up in the portal.

## Our side, later

- [ ] Add the monthly / yearly choice back to the register page once the portal takes `billingCycle`.
- [ ] Load banners and offers from the portal's `content` (it's empty now), instead of `assets/banners/banners.js`.
- [ ] Use `registration/check` while typing (club code / email free?) and `quote` for promo codes, once they work.
- [ ] Put `api/` on PHP hosting and set `PRODUCTION_API`, so the live site's forms work again.

## Test checklist (staging, sample data only)

Tell the API developer after each test that creates something, so they can clean it up.

**Works now**
- [ ] `node test.js` and `php test.php` in `Desktop\portal-test` print ping, plans, content
- [ ] `api/public.php?action=health` → `{"ok":true}`
- [ ] Contact form → "Thanks!" and the enquiry shows in the portal (Website CMS > Enquiries)
- [ ] Contact form, same message twice within 10 min → still "Thanks!", only one enquiry in the portal
- [ ] Register form empty → red error under each field
- [ ] Register with a new club code → Boost staging page opens, the amount is right (Basic 100 / Standard 150 / Premium 200)
- [ ] Each plan from the pricing page (`?plan=basic|standard|premium`) arrives as the right plan in the portal
- [ ] A sport the portal doesn't have (e.g. Football) arrives as "Others"
- [ ] Same club code / email as an earlier **paid or approved** club → red error "already in use" on that field
- [ ] Same club code + email as an **unpaid** order → goes back to that order's Boost page (no second order)
- [ ] Double-click "Continue to payment" → only one order in the portal
- [ ] Wrong promo code → error on the promo field; right promo code → lower amount on Boost
- [ ] Portal "online payment" switched **off** → register goes straight to "Application received", no Boost

**Needs the portal fixes first**
- [ ] Pay on Boost staging (success) → back on `payment-status.html` → "Payment received"
- [ ] Cancel on Boost → "Payment not completed", nothing charged
- [ ] Close Boost and open `payment-status.html?ref=…` later → "Waiting for your payment" + "Continue to payment"
- [ ] Change `?state=paid` in the address on an unpaid order → page still says "Waiting" (it must ask the portal)
- [ ] Staff approve in the portal → page says "Your club is ready", customer gets the login email, login works
- [ ] Staff reject → "Registration not approved"

**Before launch**
- [ ] Same tests on the production client with one real small payment, then refund it
- [ ] Phone (Android Chrome, iPhone Safari), English and BM, dark and light
