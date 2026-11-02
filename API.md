# D-Clix website: API contract

How the website (static HTML, CSS and JavaScript) calls the backend. A backend that answers these requests in this shape works with the site as-is.
The PHP in `api/` is a working reference implementation of this contract; a different backend (any language) can replace it.

## 1. Connecting the site to an API

`js/shared/config.js`

```js
var PRODUCTION_API = '';   // e.g. 'https://api.dclix.com.my'  (no trailing slash)
```

| Where the site runs | API used |
|---|---|
| `localhost` / `127.0.0.1` | `<site>/api` (the PHP folder next to the pages) |
| Anywhere else, `PRODUCTION_API` set | `PRODUCTION_API` |
| Anywhere else, `PRODUCTION_API` empty | Built-in browser test API (`js/shared/mock-api.js`), no server needed |

When the API is on a different domain from the website:
- **CORS:** the API must answer `OPTIONS` preflight and send `Access-Control-Allow-Origin: <website origin>`, allowing headers `Content-Type, Authorization` and methods `GET, POST, OPTIONS`.
- **Content-Security-Policy:** add the API origin to `API_ORIGINS` in `set-security.js`, then run `node set-security.js`. Otherwise the browser blocks the calls.

## 2. How every call is made

All calls go through `window.dclixApi(path, { body })` in `js/shared/config.js`:

```
POST {API}/{path}
Accept: application/json
Content-Type: application/json
Body: JSON
```

- Requests are sent with `cache: no-store`. No cookies are sent; there is no login session.

**Success:** HTTP 2xx with a JSON object.

**Errors:** HTTP 4xx or 5xx with this JSON:

```json
{
  "error": "Message shown to the visitor.",
  "fields": { "email": "Please enter a valid email address." },
  "reason": "token"
}
```

- `error` is required. It is shown to the visitor as-is, so write it for a club owner.
- `fields` is optional. The site marks each listed input and shows the message under it. Keys must match the request field names below.
- `reason` is optional. It is a machine code the page reacts to (see checkout).

Status codes the site expects:

| Code | Meaning |
|---|---|
| 405 | Wrong method |
| 409 | Already done |
| 410 | Link expired |
| 422 | Validation failed: send `fields` |
| 429 | Too many attempts |
| 5xx | Server or gateway problem |

A non-JSON reply is shown as "The server returned an unexpected reply".

## 3. Endpoints

### 3.1 `POST contact.php`: contact / free demo form

Used by the home page and contact page.

```json
{
  "name": "Ahmad Ali",
  "phone": "+60 12-345 6789",
  "email": "ahmad@example.com",
  "club": "Kelab Silat Harimau",
  "inquiries": "I'd like a demo for 2 branches."
}
```

- `phone` is country code + space + number, with the leading 0 removed.
- Limits (reference API): name 120, phone 30, email 190, club 120, inquiries 2000 characters.

Reply: `{ "ok": true }`.

Validation `fields` keys: `name`, `phone`, `email`, `club`, `inquiries`.

What the reference API does: saves a sales lead, emails the sales team and sends the visitor a confirmation email.

### 3.2 `POST signup.php`: club registration, step 1

Used by `arena/club-register.html`.

```json
{
  "plan": "standard",
  "billing": "monthly",
  "clubCode": "KSH01",
  "username": "ksh.admin",
  "branch": "Shah Alam",
  "regNo": "PPM-012-10-12345678",
  "clubName": "Kelab Silat Harimau",
  "headInstructor": "Ahmad Ali",
  "sport": "silat",
  "sportName": "Silat",
  "address1": "12 Jalan Mawar",
  "address2": "",
  "state": "Selangor",
  "country": "Malaysia",
  "phoneCode": "+60",
  "whatsapp": "123456789",
  "email": "admin@ksh.my",
  "password": "Secret123",
  "ssmFile": {
    "name": "ssm.pdf",
    "type": "application/pdf",
    "size": 183422,
    "data": "<base64, no data: prefix>"
  }
}
```

| Field | Rules (the site checks these too) |
|---|---|
| `plan` | `basic` / `standard` / `premium` |
| `billing` | `monthly` / `yearly` |
| `clubCode` | 2–30 characters: A–Z, 0–9, `-`, `_`; must be unique |
| `username` | 3–30 characters: letters, digits, `.`, `_`, `-` |
| `password` | At least 8 characters, with upper-case, lower-case and a digit. **Hash it; never store or log it.** |
| `sport` | Id from `js/arena/sports.js`; `sportName` is its display name |
| `ssmFile` | Registration certificate: PDF, JPG or PNG, max 5 MB. Check the real type from the file bytes, not the name. Required, except when resuming. |
| `whatsapp` | Optional; digits, spaces, `-` |

Reply:

```json
{ "ok": true, "token": "<one-time signup token>", "leadId": "LD0012", "resumed": false }
```

- The site stores `token` in sessionStorage and opens `arena/payment.html`. The reference token is random, stored only as a SHA-256 hash and valid for 7 days.

Validation `fields` keys: `clubName`, `regNo`, `username`, `clubCode`, `email`, `password`, `whatsapp`, `sport`, `ssmFile`.

Resume rule (reference API): if the email exists, belongs to an unpaid signup and the password matches, the same registration is updated and `resumed: true` is returned. Otherwise the API returns the field error "An account with this email already exists".

### 3.3 `POST checkout.php`: payment page, step 2

Used by `arena/payment.html`. The token comes from sessionStorage or from the `?t=<token>` link in the signup email.

#### `action: "load"` (fills the page)

```json
{ "action": "load", "token": "<token>" }
```

Reply:

```json
{
  "lead": {
    "clubName": "...", "clubCode": "...", "email": "...", "phone": "...",
    "contactName": "...", "address": "...", "country": "...",
    "plan": "standard", "billing": "monthly",
    "billingInfo": null,
    "status": "Payment Pending"
  },
  "plans": {
    "fee": 1.20,
    "items": [
      { "id": "basic",    "name": "Basic Plan",    "monthly": 100, "yearly": 1000 },
      { "id": "standard", "name": "Standard Plan", "monthly": 150, "yearly": 1500 },
      { "id": "premium",  "name": "Premium Plan",  "monthly": 200, "yearly": 2000 }
    ]
  }
}
```

- `fee` is the gateway fee in RM, added to the plan price.
- `billingInfo` has the same object shape as in `pay` below once saved; it is `null` before that.

Errors the page handles specially:

| Code | `reason` | Page shows |
|---|---|---|
| 410 or 404 | `token` | Expired or unknown link |
| 409 | `paid` | "Already paid", plus a Log in button |

#### `action: "pay"` (creates the invoice and the payment-gateway bill)

```json
{
  "action": "pay",
  "token": "<token>",
  "agreeTerms": true,
  "plan": "standard",
  "billing": "monthly",
  "billingInfo": {
    "company": "", "firstName": "Ahmad", "lastName": "Ali",
    "address": "12 Jalan Mawar", "zip": "40000", "city": "Shah Alam",
    "country": "Malaysia", "email": "admin@ksh.my", "phone": "+60123456789"
  }
}
```

Reply:

```json
{ "ok": true, "url": "<payment gateway page>", "invoiceNo": "DCX-2026-00012" }
```

- The site redirects the browser to `url`.
- **The amount must be worked out on the server** from `plan` + `billing` + fee. Never trust a price sent by the browser.
- Validation `fields` keys: `firstName`, `lastName`, `address`, `zip`, `city`, `email`, `phone`, `agreeTerms`, `plan`.
- Gateway unreachable: 502 with `error`.

### 3.4 After payment: back to the website

After paying, the gateway returns the customer to the backend's own return URL. The backend confirms the payment with the gateway itself (never trust the query string), then redirects the browser to:

```
{website}/arena/payment-status.html?status=<status>&ref=<reference>
```

| `status` | Page shows |
|---|---|
| `paid` | Success, plus a Log in button |
| `failed` | Not charged, plus Try again |
| `pending` | Waiting for the bank, plus Check again |
| `error` (or anything else) | Contact D-Clix |

- `ref` is shown on the success page. It may contain only `A-Z a-z 0-9 -`; other characters are stripped.

Server-to-server payment notifications (the gateway's webhook or callback) never touch the website. They are between the gateway and the backend.

**Reference implementation (Billplz):**
- `api/billplz-return.php` is the redirect handler.
- `api/billplz-callback.php` handles the server-to-server callback and verifies the X-Signature.
- Activation runs once, even if both arrive (`complete_payment` in `api/lib/billing.php`).

### 3.5 `GET public.php?action=plans | health` (optional)

- `plans` returns the same `plans` object as above.
- `health` returns `{ "ok": true }`.

The current pages do not call this endpoint; prices on the website pages are in the HTML.

## 4. Changing the contract

The paths and field names live in these files:

| File | Calls |
|---|---|
| `js/shared/main.js` | `contact.php` |
| `js/arena/signup.js` | `signup.php` |
| `js/arena/payment.js` | `checkout.php` |
| `arena/payment-status.html` | status page |

If the backend uses different URLs (e.g. `/v1/signup`), change the path strings there.

Also update `js/shared/mock-api.js` so the browser test mode keeps matching.
