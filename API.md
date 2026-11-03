# D-Clix website: API contract

How the website (static HTML, CSS and JavaScript) calls our small PHP API in `api/`, and how that API talks to the MAClub portal.

```
browser ──▶ our api/*.php (on a PHP server) ──signed HMAC──▶ MAClub portal  /api/website/v1/...
```

The browser never talks to the portal directly: the portal needs the client secret, and that must stay on the server.
Portal docs: https://www.maclubsystem.com/api-docs/index.html · open questions: [PORTAL-TODO.md](PORTAL-TODO.md).

## 1. Connecting the site to our API

`js/shared/config.js`

```js
var PRODUCTION_API = '';   // e.g. 'https://api.d-clix.com'  (no trailing slash)
```

| Where the site runs | API used |
|---|---|
| `localhost` / `127.0.0.1` | `<site>/api` (the PHP folder next to the pages) |
| Anywhere else, `PRODUCTION_API` set | `PRODUCTION_API` |
| Anywhere else, `PRODUCTION_API` empty | None: forms show "not open yet, please WhatsApp or call" |

When the API is on a different domain from the website:
- **CORS:** add the website to `allowed_origins` in `api/config.php`.
- **Content-Security-Policy:** add the API origin to `API_ORIGINS` in `set-security.js`, then run `node set-security.js`.

The portal side is set in `api/config.php` → `portal.base`, `client_id`, `secret` (see `config.example.php`).

## 2. How every call is made

All calls go through `window.dclixApi(path, { body })` in `js/shared/config.js`: POST with a JSON body, or GET when there is no body.
`cache: no-store`, no cookies, no login session.

**Success:** HTTP 2xx with a JSON object. **Errors:** HTTP 4xx or 5xx with:

```json
{ "error": "Message shown to the visitor.", "fields": { "email": "Please enter a valid email address." } }
```

- `error` is shown to the visitor as-is.
- `fields` (optional) marks each listed input and shows the message under it. Keys are our field names below;
  portal field errors are renamed to ours in `api/lib/portal.php` (`portal_fail`).

| Code | Meaning |
|---|---|
| 404 | Unknown registration reference |
| 409 | Club code / name / email already registered (with `fields`) |
| 422 | Validation failed (with `fields`) |
| 429 | Too many attempts |
| 502 | Portal or payment gateway could not be reached, nothing charged |
| 503 | Server not connected to the portal yet (no keys in `config.php`) |

## 3. Endpoints

### 3.1 `POST contact.php`: contact / free demo form → portal `POST /enquiry`

```json
{ "name": "Ahmad Ali", "phone": "+60 12-345 6789", "email": "ahmad@example.com", "club": "Kelab Silat Harimau", "inquiries": "I'd like a demo." }
```

Reply `{ "ok": true }`. Sent to the portal as `fullName, email, phone, clubName, message, source: "contact-page", visitorIp`.
Staff see it under Website CMS > Enquiries.

### 3.2 `POST signup.php`: club registration → portal `POST /registration`

```json
{
  "plan": "standard", "sport": "karate",
  "clubName": "Kelab Karate Harimau", "clubCode": "KKH01", "headInstructor": "Ahmad Ali",
  "phoneCode": "+60 (Malaysia)", "whatsapp": "12-345 6789",
  "email": "ahmad@example.com", "password": "Str0ngPass", "promoCode": "",
  "acceptedTerms": true, "requestKey": "6f1d2c9ae7b14c0a..."
}
```

- `plan`: `basic` → `BASIC`, `standard` → `ADVANCE`, `premium` → `PREMIUM` (`PLAN_CODES` in `api/signup.php`).
- `sport`: our slug from `js/arena/sports.js`, matched by name to the portal's sport id (`portal_sport_id`); unknown → "Others".
- `whatsapp` becomes the portal `phone` (digits only, leading 0 removed); the `+60` part of `phoneCode` becomes `phoneCountryCode`.
- `requestKey` is the portal `Idempotency-Key`: one per form, so a double click or retry returns the same order.

Replies:
- `{ "ok": true, "url": "https://…boost…", "ref": "<uuid>" }` → the page sends the browser to `url` (Boost FPX).
  Also returned when an unpaid order already exists for this club (`"resumed": true`).
- `{ "ok": true, "ref": "<uuid>", "state": "submitted_pending_approval" }` → online payment is off; the page goes to the result page.

Field keys in `fields`: `plan, sport, clubName, clubCode, headInstructor, whatsapp, email, password, promoCode, terms`.

### 3.3 `GET status.php?ref=<uuid>`: result page → portal `GET /registration/status/{ref}`

After Boost the portal sends the browser to `arena/payment-status.html?ref=…&state=…`. The page ignores `state` and asks:

```json
{ "ok": true, "ref": "…", "state": "awaiting_payment", "message": "…", "clubName": "…", "clubCode": "…",
  "plan": "Advance", "amount": 150, "currency": "MYR", "payUrl": "https://…" }
```

`state`: `awaiting_payment` (page re-checks every 5 s for 2 min, `payUrl` set) · `paid_pending_approval` · `submitted_pending_approval`
· `approved` · `payment_failed` · `cancelled` · `expired` · `rejected`. Texts for each are in `js/arena/status.js`.

### 3.4 `GET public.php?action=plans | health`

- `plans`: the portal's `GET /packages` (plans + sports), cached 10 minutes. Not used by the pages yet.
- `health`: `{ "ok": true }` when the portal answers, 503 when not. No other details.

## 4. Changing the contract

| File | Calls |
|---|---|
| `js/shared/main.js` | `contact.php` |
| `js/arena/signup.js` | `signup.php` |
| `js/arena/status.js` | `status.php` |
