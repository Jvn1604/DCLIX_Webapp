# D-Clix Club Management + Competition Portal (static site)

Plain HTML / CSS / JavaScript rebuild of the React prototype. No build step, no framework, no Vercel needed.

## Run it
- Quickest: double-click `index.html`.
- Local server: `python3 -m http.server 8000` then open http://localhost:8000

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
| dashboard.html?sport=karate | Club login destination / dashboard |

## Files
css/style.css · js/theme.js (saved theme) · js/icons.js · js/sports.js (18 sports) · js/main.js (shared behaviour)
· js/competition.js (portal pages) · js/referral-data.js (slides) · assets/ (logo + images)

## Things to connect (marked `TODO` in the JS)
1. Contact form (main.js) and club/player registration (competition.js) only validate in the browser. Post them to your backend.
2. "Club Login" opens the demo dashboard. Add real authentication.
3. Boxing/MMA hero tiles, testimonial avatars, dashboard photos, news and referral slides load from the same remote
   image URLs the prototype used. Download them (or your own photos) into assets/images and update the src values.
4. Live scores, rankings, fixtures and tournaments are sample data.
