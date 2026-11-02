/* home event banner - edit this file only
   1. put the pic/video in assets/banners/
   2. add one { } line per slide (2+ slides = slider)
   3. save, commit, push. empty list = no banner

   src        pic or .mp4 in this folder (required)
   mobileSrc  taller pic for phones (all slides need one or none)
   alt        what the banner says (required)
   pages      ['home'], ['pricing'] or both (default home)
   link       page or https:// link when clicked
   start/end  'YYYY-MM-DD', turns on/off by itself
   preview    true = only shows on localhost

   size: desktop 1600x500, phone 800x600. pics < 500KB, videos < 5MB (mp4, muted) */
window.DCLIX_BANNERS = {
  seconds: 6, // seconds per slide

  slides: [
    // deepavali offer, add end date once confirmed
    { src: 'deepavali-offer.svg', mobileSrc: 'deepavali-offer-phone.svg', alt: 'Deepavali offer: 2 months free on every yearly plan. Happy Deepavali!', link: 'pricing.html?billing=yearly', pages: ['home', 'pricing'] },
    { src: 'free-demo.svg', mobileSrc: 'free-demo-phone.svg', alt: 'Free demo: see D-Clix in action with a guided demo for your club', link: 'contact.html', pages: ['home', 'pricing'] },

    // examples:
    // { src: 'merdeka-promo.png', mobileSrc: 'merdeka-promo-phone.png', alt: 'Merdeka promo: 20% off yearly plans', link: 'pricing.html', pages: ['home', 'pricing'], start: '2026-08-20', end: '2026-09-16' },
    // { src: 'tournament-2026.mp4', alt: 'D-Clix Open Karate Championship 2026, 6 December', link: 'https://www.instagram.com/dclixmalaysia/' },
  ]
};
