# D-Clix Website

The public website for **D-Clix**, a club management system for martial arts and sports clubs in Malaysia,
by Raig Technologies (M) Sdn Bhd. Clubs learn about D-Clix here, pick a plan, register and pay online, then
log in to the club system at [maclubsystem.com](https://www.maclubsystem.com/index.php?/login/proceed).

- **Preview:** https://jvn1604.github.io/DCLIX_Webapp/
- **Built with:** plain HTML, CSS and JavaScript, plus a small PHP API that talks to the MAClub portal
- **Languages:** English and Bahasa Melayu, dark and light theme

## How it works

```
Pricing ──▶ Register (club details) ──▶ Boost payment (FPX) ──▶ Result page ──▶ Club Login
                 │                                                 │
                 └──── api/signup.php ──▶ MAClub portal ◀── api/status.php

Contact form ──▶ api/contact.php ──▶ MAClub portal (Website CMS > Enquiries)
```

The website itself stores nothing. Registrations and enquiries go to the MAClub portal, and staff approve
new clubs there. The portal API is signed with a secret that lives only on the server.

## Folder layout

```
├── *.html          website pages (home, about, pricing, edu-hub, community, contact, legal, 404)
├── arena/          club-register and payment-status (the signup flow)
├── css/style.css   all styles (theme colours are the first lines)
├── js/shared/      shared scripts: main, language switch, banners, club globe, API address (config.js)
├── js/arena/       signup.js, status.js, sports.js
├── assets/         images, videos, banners/banners.js, clubs/clubs.js
├── api/            PHP API (needs api/config.php, which is never committed)
└── set-*.js        small helper scripts, see below
```

## Run it on your PC

1. Install [XAMPP](https://www.apachefriends.org/). Only its PHP is used; you don't need to start Apache or MySQL.
2. Copy `api/config.example.php` to `api/config.php` and add the portal client id and secret (ask Jeeven).
3. Double-click `start-local.bat` and open http://127.0.0.1:8000.

Anything you submit locally goes to the portal's staging system, so use sample details.
See [TESTING.md](TESTING.md) for what to try.

## Everyday changes

| I want to… | Do this |
|---|---|
| Show a banner | Add the picture to `assets/banners/` and a line in `banners.js` (how-to at the top of the file) |
| Change the clubs on the globe | Edit `assets/clubs/clubs.js` and add logos to `assets/clubs/` |
| Change some text | Edit the page, then update the same line in `js/shared/i18n-bm.js` for Bahasa Melayu |
| Change the theme colour | `--accent` at the top of `css/style.css` |
| Push CSS or JS changes | Run `node set-version.js` first so browsers pick up the new files |
| Change titles, descriptions or the domain | Edit the page or `SITE` in `set-seo.js`, then run `node set-seo.js` |
| Add a `<script>` or outside service | Run `node set-security.js` |

## Going live

1. Put the `api/` folder on PHP 8.1+ hosting with HTTPS and create `config.php` with the production client.
2. In `config.php`, set `debug` to `false` and list only the real website in `allowed_origins`.
3. Ask the portal team to send customers back to `https://<site>/arena/payment-status.html` after payment.
4. Set `PRODUCTION_API` in `js/shared/config.js`, add it to `API_ORIGINS` in `set-security.js`, run both scripts and push.

## Working together

- Always `git pull origin main` before you start.
- If git warns that your changes would be overwritten, stop and ask. Never fix it by copying an old file over a new one.
- Keep commits small and push soon.
- The repo is public: never commit keys, passwords or real client data. More in [SECURITY.md](SECURITY.md).
