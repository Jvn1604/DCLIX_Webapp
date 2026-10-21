/* ==========================================================
   EVENT BANNER on the home page — edit this file to change it.

   1. Put the picture or video in this folder (assets/banners/).
   2. Add one { … } line per slide below. Several slides = a slider.
   3. Save, then commit and push. The banner hides itself when
      no slide is active, so an empty list shows nothing.

   Each slide:
     src        file in this folder: .png .jpg .webp .svg or .mp4   (required)
     mobileSrc  optional taller picture for phones (same types, not .mp4).
                Give one for every slide, or for none: phones show the 4 : 3
                phone pictures only when every active slide has one.
     alt        what the banner says, for screen readers and Google    (required)
     link       optional page to open when clicked, e.g. 'pricing.html'
                or a full https:// address (opens in a new tab)
     start/end  optional dates 'YYYY-MM-DD'; the slide shows only from
                start to end (inclusive), so it switches off by itself
     preview    true = show only on your own PC (127.0.0.1 / localhost),
                never on the live site. Remove it to publish the slide.

   Sizes: desktop 1600 × 500 px (3.2 : 1); phone picture 800 × 600 px.
   Keep pictures under 500 KB and videos under 5 MB (MP4, H.264, no
   sound needed — videos play muted and loop).
   ========================================================== */
window.DCLIX_BANNERS = {
  seconds: 6, // how long each picture stays before the next slide

  slides: [
    { src: 'yearly-plans.svg', mobileSrc: 'yearly-plans-phone.svg', alt: 'Yearly plans: 2 months free when you pay for D-Clix yearly', link: 'pricing.html' },
    { src: 'free-demo.svg', mobileSrc: 'free-demo-phone.svg', alt: 'Free demo: see D-Clix in action with a guided demo for your club', link: '#contact' },

    // Examples:
    // { src: 'merdeka-promo.png', mobileSrc: 'merdeka-promo-phone.png', alt: 'Merdeka promo: 20% off yearly plans', link: 'pricing.html', start: '2026-08-20', end: '2026-09-16' },
    // { src: 'tournament-2026.mp4', alt: 'D-Clix Open Karate Championship 2026, 6 December', link: 'https://www.instagram.com/dclixmalaysia/' },
  ]
};
