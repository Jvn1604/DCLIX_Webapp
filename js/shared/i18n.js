/* ==========================================================
   Language switcher: English / Bahasa Melayu
   Adds an "EN / BM" menu to the top bar and translates the
   public pages in place. Translations are matched on the exact
   English text, so if you change English wording on a page,
   update the same line here too. Text without a translation
   simply stays in English (the competition portal and the
   admin portal are English only).
   Wording follows d-clix.com/ms where that page has it.
   ========================================================== */
(function () {
  'use strict';
  var KEY = 'dclix_lang';
  var BM = {
    /* ---- menu, footer, shared ---- */
    'Club Management': 'Pengurusan Kelab', 'Home': 'Utama', 'About': 'Tentang', 'Pricing': 'Harga', 'D-Clix Edu-Hub': 'D-Clix Edu-Hub',
    'D-Clix Referral Program': 'Program Rujukan D-Clix', 'Club Login': 'Log Masuk Kelab', 'Follow': 'Ikut', 'Follow us': 'Ikuti Kami', 'Call us': 'Hubungi Kami', 'Visit us': 'Lawati Kami', 'Contact': 'Hubungi', 'Links': 'Pautan',
    'Edu-Hub': 'Edu-Hub', 'Referral': 'Rujukan', 'Community': 'Komuniti', 'Privacy Policy': 'Dasar Privasi',
    'Terms & Conditions': 'Terma & Syarat', 'No Refund Policy': 'Dasar Tiada Bayaran Balik', 'All purchases are subject to our': 'Semua pembelian tertakluk kepada', 'Admin Portal': 'Portal Admin', 'D-Clix Club Management System ·': 'Sistem Pengurusan Kelab D-Clix ·',
    'D-Clix Club Management System': 'Sistem Pengurusan Kelab D-Clix', '© 2026 by Raig Technologies (M) Sdn Bhd': '© 2026 oleh Raig Technologies (M) Sdn Bhd',
    'Grow revenue and streamline your club with a modern, reliable club management system.': 'Tingkatkan pendapatan dan lancarkan kelab anda dengan sistem pengurusan kelab yang moden dan boleh dipercayai.',
    'Toggle theme': 'Tukar tema', 'Open menu': 'Buka menu', 'D-Clix on Facebook': 'D-Clix di Facebook',

    /* ---- home: hero + benefits ---- */
    'Martial Arts Club Platform': 'Platform Kelab Seni Mempertahankan Diri', 'Grow revenue and streamline your club with': 'Tingkatkan pendapatan dan lancarkan kelab anda dengan',
    'club management system': 'sistem pengurusan kelab', 'Built for dojos and combat sports academies.': 'Dibina untuk dojo dan akademi sukan tempur.',
    'Anytime. Anywhere.': 'Bila-bila masa. Di mana sahaja.', 'Start Your Journey': 'Mulakan Perjalanan Anda', 'Watch Demo': 'Tonton Demo', 'Sports supported': 'Sukan yang disokong',
    'Why D-Clix': 'Kenapa D-Clix', 'Key Benefits That Help Manage Your Club': 'Faedah Utama yang Membantu Mengurus Kelab Anda',
    'Streamlined Operations and Cost Efficiency': 'Operasi Diperkemas dan Kecekapan Kos',
    'Automate registration, fees and attendance so your team spends less time on admin.': 'Automasikan pendaftaran, yuran dan kehadiran supaya pasukan anda kurang masa untuk kerja pentadbiran.',
    'Enhanced Member Experience': 'Pengalaman Ahli yang Dipertingkatkan',
    'Members and parents register, pay and get updates from their phone.': 'Ahli dan ibu bapa boleh mendaftar, membayar dan menerima makluman daripada telefon mereka.',
    'Data Management and Insights': 'Pengurusan Data dan Cerapan',
    'All club, student and payment records in one place, with clear reports.': 'Semua rekod kelab, pelajar dan pembayaran di satu tempat, dengan laporan yang jelas.',
    'Scalability, Security, and Customization': 'Kebolehskalaan, Keselamatan dan Penyesuaian',
    'Grow from one centre to many branches, securely, set up the way your club works.': 'Berkembang daripada satu pusat kepada banyak cawangan dengan selamat, mengikut cara kelab anda beroperasi.',

    /* ---- home: features ---- */
    "It's more. Everything you need to elevate your club": 'Ianya Lengkap. Semua yang anda perlukan untuk memartabatkan kelab anda',
    'Discover powerful features in D-Clix. Streamline club management with online registration, automated payments, attendance tracking, member management, participate in the community and more. Accessible via web and mobile for a seamless experience.':
      'Terokai ciri-ciri hebat D-Clix. Permudahkan pengurusan kelab dengan pendaftaran dalam talian, pembayaran automatik, penjejakan kehadiran, pengurusan ahli, penyertaan komuniti dan banyak lagi. Boleh diakses melalui web dan mudah alih.',
    'Digital Attendance': 'Kehadiran Digital', 'Digital attendance marking by scan QR code / manual update': 'Penandaan kehadiran digital dengan mengimbas kod QR / kemas kini manual',
    'Continuous Updates': 'Kemas Kini Berterusan', 'WhatsApp and push notifications for parents / guardians / instructors; D-Clix Community': 'WhatsApp dan pemberitahuan tolak untuk ibu bapa / penjaga / pengajar; Komuniti D-Clix',
    'Tournament': 'Kejohanan', 'Tournament participating, player selection, and scoring details; past and upcoming tournament details': 'Penyertaan kejohanan, pemilihan pemain dan butiran pemarkahan; butiran kejohanan yang lalu dan akan datang',
    'Online Registration': 'Pendaftaran Dalam Talian', 'Smooth and seamless registration process for new club members and instructors/trainers': 'Proses pendaftaran yang lancar untuk ahli kelab dan pengajar/jurulatih baharu',
    'Grading': 'Penggredan', 'Current grading, upcoming grading schedule, payment for grading and results': 'Penggredan semasa, jadual penggredan akan datang, pembayaran untuk penggredan dan keputusan',
    'Data Management': 'Pengurusan Data', 'Club / Student / Instructors personal data management': 'Pengurusan data peribadi Kelab / Pelajar / Pengajar',
    'Advance Features': 'Ciri Lanjutan', '3rd party integration, Online payment (FPX), purchase request, invoicing, communication platform': 'Penyepaduan pihak ketiga, pembayaran dalam talian (FPX), permintaan pembelian, invois, platform komunikasi',
    'Online Payment': 'Pembayaran Dalam Talian', 'Simplify the process of payment via online in the mobile app': 'Memudahkan proses pembayaran melalui dalam talian dalam aplikasi mudah alih',
    'Improve the way your club is managed': 'Perbaiki cara pengurusan kelab anda',
    "Simple and Effective digital solutions for club management for accurate, up to date tracking of student/member's attendance, payments, and registration.":
      'Penyelesaian digital yang mudah dan berkesan untuk pengurusan kelab bagi penjejakan kehadiran, pembayaran dan pendaftaran pelajar atau ahli yang tepat dan terkini.',
    'Start Today': 'Cuba Sekarang', 'Smarter Decisions, Better Results': 'Keputusan Lebih Bijak, Keputusan Lebih Baik',
    'Track performance, retain members, and boost profits with simple, reliable reporting. Our user-friendly dashboard gives you a 360° view of schedules, transactions, and performance—all in one place.':
      'Jejaki prestasi, kekalkan ahli dan tingkatkan keuntungan dengan pelaporan yang mudah dan boleh dipercayai. Papan pemuka mesra pengguna kami memberi anda paparan 360° jadual, urus niaga dan prestasi—semuanya di satu tempat.',
    'Get A Trial': 'Cuba Sekarang', "Get a system that's": 'Dapatkan sistem yang', 'easy to use': 'mudah digunakan',
    'Say goodbye to messy spreadsheets. Manage memberships, class schedules, check-ins and payments from one intuitive system. Get a fully customizable calendar and booking system to make sure members can easily find, view and book classes through your website and app.':
      'Ucapkan selamat tinggal kepada hamparan yang tidak kemas. Urus keahlian, jadual kelas, daftar masuk dan pembayaran daripada satu sistem intuitif. Dapatkan kalendar dan sistem tempahan yang boleh disesuaikan sepenuhnya supaya ahli boleh mencari, melihat dan menempah kelas dengan mudah melalui laman web dan aplikasi anda.',
    'Learn About D-Clix': 'Ketahui Tentang D-Clix',

    /* ---- home: testimonials, FAQ, call to action, contact ---- */
    'Trusted by Clubs': 'Dipercayai oleh Kelab', 'What club leaders say about D-Clix': 'Apa kata pemimpin kelab tentang D-Clix', 'Join Our Community': 'Sertai Komuniti Kami', 'Club Leader': 'Pemimpin Kelab',
    '“The grading process is seamless. Tracking, payment, and results are clear and consistent for every session.”': '“Proses penggredan sangat lancar. Penjejakan, pembayaran dan keputusan jelas dan konsisten untuk setiap sesi.”',
    '“Online payment helped improve fee collection revenue. It is simple for parents and easy for admins to track.”': '“Pembayaran dalam talian membantu meningkatkan kutipan yuran. Mudah untuk ibu bapa dan senang untuk admin menjejak.”',
    '“New student registration increased due to easier registration and communication flows.”': '“Pendaftaran pelajar baharu meningkat kerana urusan pendaftaran dan komunikasi menjadi lebih mudah.”',
    '“D-CLIX helps transforming my academy from doing manual work to a proper online system, That i can use at any time”': '“D-CLIX membantu mengubah akademi saya daripada kerja manual kepada sistem dalam talian yang teratur, yang boleh saya gunakan pada bila-bila masa”',
    '“D-CLIX contributes to an INCREASE in student fee collection revenue with the availability of ONLINE PAYMENT FACILITIES. All at your fingertips!”': '“D-CLIX menyumbang kepada PENINGKATAN hasil kutipan yuran pelajar dengan adanya KEMUDAHAN PEMBAYARAN DALAM TALIAN. Semua di hujung jari anda!”',
    'FAQ': 'Soalan Lazim', 'Common questions about D-Clix': 'Soalan lazim tentang D-Clix',
    'What is D-Clix Club Management System?': 'Apakah itu Sistem Pengurusan Kelab D-Clix?',
    'D-Clix is a web + mobile club management system designed to streamline registration, attendance, payments, and communications for sports and martial arts clubs.':
      'D-Clix ialah sistem pengurusan kelab web + mudah alih yang direka untuk memudahkan pendaftaran, kehadiran, pembayaran dan komunikasi bagi kelab sukan dan seni mempertahankan diri.',
    'What features are available?': 'Apakah ciri-ciri yang tersedia?',
    'Online registration, QR code attendance, FPX payments, grading, reporting, invoicing, notifications, and tournament workflows are supported as part of the platform.':
      'Pendaftaran dalam talian, kehadiran kod QR, pembayaran FPX, penggredan, laporan, invois, pemberitahuan dan aliran kerja kejohanan disokong dalam platform ini.',
    'How does it benefit martial arts clubs?': 'Bagaimanakah ia memanfaatkan kelab seni mempertahankan diri?',
    'It reduces admin workload, improves fee collection, tracks attendance reliably, and gives instructors a clear view of members, schedules, and performance.':
      'Ia mengurangkan beban kerja pentadbiran, meningkatkan kutipan yuran, menjejak kehadiran dengan tepat dan memberi pengajar gambaran jelas tentang ahli, jadual dan prestasi.',
    'Is it customizable for different martial arts styles?': 'Bolehkah ia disesuaikan untuk gaya seni mempertahankan diri yang berbeza?',
    'Yes. Structures like grades, sessions, fee groups, and roles can be adapted to suit how your club operates across different styles.': 'Ya. Struktur seperti gred, sesi, kumpulan yuran dan peranan boleh disesuaikan mengikut cara kelab anda beroperasi.',
    'Can I access it on mobile devices?': 'Bolehkah saya mengaksesnya pada peranti mudah alih?',
    'Yes. D-Clix supports web dashboard usage and mobile access for students, parents/guardians, instructors, and admins.': 'Ya. D-Clix menyokong papan pemuka web dan akses mudah alih untuk pelajar, ibu bapa/penjaga, pengajar dan admin.',
    'Is it secure for student data and payments?': 'Adakah ia selamat untuk data pelajar dan pembayaran?',
    'The system is designed with secure access and role-based permissions, with payment workflows built to keep transactions reliable and traceable.': 'Sistem ini direka dengan akses selamat dan kebenaran mengikut peranan, serta aliran pembayaran yang memastikan transaksi boleh dipercayai dan dijejak.',
    'How user-friendly is it?': 'Sejauh manakah ia mesra pengguna?',
    'The interface focuses on clear flows: registration approvals, attendance, and payments are designed to be straightforward for day-to-day operations.': 'Antara mukanya mengutamakan aliran yang jelas: kelulusan pendaftaran, kehadiran dan pembayaran direka supaya mudah untuk operasi harian.',
    'Can it integrate with 3rd party systems?': 'Bolehkah ia berintegrasi dengan sistem pihak ketiga?',
    'Yes. D-Clix supports third-party integrations where required, including payment and communication tooling depending on plan and setup.': 'Ya. D-Clix menyokong integrasi pihak ketiga apabila perlu, termasuk alatan pembayaran dan komunikasi bergantung pada pelan dan tetapan.',
    'Is D-Clix affiliated with any Martial Arts Association?': 'Adakah D-Clix bergabung dengan mana-mana Persatuan Seni Mempertahankan Diri?',
    'D-Clix is a management platform that can be used by clubs and organizers; affiliation depends on the tournament or club arrangement.': 'D-Clix ialah platform pengurusan yang boleh digunakan oleh kelab dan penganjur; gabungan bergantung pada aturan kejohanan atau kelab.',
    'What kind of support does D-Clix offer?': 'Apakah jenis sokongan yang ditawarkan oleh D-Clix?',
    'You can receive onboarding guidance, documentation support, and assistance for troubleshooting access or configuration issues.': 'Anda akan menerima bimbingan permulaan, sokongan dokumentasi dan bantuan untuk menyelesaikan masalah akses atau konfigurasi.',
    'How can I get started?': 'Bagaimanakah saya boleh bermula?',
    'Choose a plan, request a trial, and your club can begin onboarding with guided setup for registrations, payments, attendance, and member management.': 'Pilih pelan, minta percubaan, dan kelab anda boleh mula menggunakan D-Clix dengan bimbingan persediaan untuk pendaftaran, pembayaran, kehadiran dan pengurusan ahli.',
    'Ready to switch to the market leading club management system?': 'Bersedia untuk beralih kepada sistem pengurusan kelab terkemuka pasaran?',
    'Your Club, Elevated with D-Clix': 'Kelab Anda, Ditingkatkan dengan D-Clix',
    'Take your club to the next level with technology designed to simplify operations and drive growth. Whether you manage a martial arts club, fitness center, or sports club, D-Clix empowers you to focus on what matters most—delivering exceptional value to your members and growing your business.':
      'Bawa kelab anda ke peringkat seterusnya dengan teknologi yang direka untuk memudahkan operasi dan memacu pertumbuhan. Sama ada anda mengurus kelab seni mempertahankan diri, pusat kecergasan atau kelab sukan, D-Clix memperkasakan anda untuk memfokus pada perkara yang paling penting—menyampaikan nilai yang luar biasa kepada ahli anda dan mengembangkan perniagaan anda.',
    'Ready to Elevate Your Business?': 'Bersedia untuk Meningkatkan Perniagaan Anda?',
    'Contact us today to schedule a demo and discover how D-Clix can revolutionize your club management!': 'Hubungi kami hari ini untuk menjadualkan demo dan ketahui cara D-Clix boleh merevolusikan pengurusan kelab anda!',
    'Schedule a demo': 'Jadualkan demo', 'See plans': 'Lihat pelan',
    'Fill in your details and let our expert reach you.': 'Isikan butiran anda dan biarkan pakar kami menghubungi anda.',
    "Tell us about your club and your inquiries. We'll respond with the best setup path.": 'Beritahu kami tentang kelab dan pertanyaan anda. Kami akan membalas dengan cadangan persediaan terbaik.',
    'Submit': 'Hantar', 'Name*': 'Nama*', 'Name': 'Nama', 'Phone Number*': 'Nombor Telefon*', 'Phone number': 'Nombor telefon', 'Email*': 'E-mel*', 'Email': 'E-mel',
    'Club Name*': 'Nama Kelab*', 'Club name': 'Nama kelab', 'Inquiries*': 'Pertanyaan*', 'Inquiries': 'Pertanyaan', 'Sending…': 'Menghantar…',
    'Thanks! Your details are captured. A D-Clix expert will reach you soon.': 'Terima kasih! Butiran anda telah diterima. Pakar D-Clix akan menghubungi anda tidak lama lagi.',
    'Thanks! We have received your details. A D-Clix expert will contact you soon.': 'Terima kasih! Kami telah menerima butiran anda. Pakar D-Clix akan menghubungi anda tidak lama lagi.',
    'Sorry, the form is not available right now. Please call us at +603-7804 1412.': 'Maaf, borang tidak tersedia buat masa ini. Sila hubungi kami di +603-7804 1412.',

    /* ---- about ---- */
    'About Us': 'Tentang Kami',
    'Welcome to D-Clix, your ultimate club management solution. Designed for sports and martial arts clubs, we streamline operations with a focus on efficiency, convenience, and innovation. Our platform simplifies key processes, including seamless member registration, secure online payments, and real-time attendance tracking.':
      'Selamat datang ke D-Clix, penyelesaian pengurusan kelab muktamad anda. Direka untuk kelab sukan dan seni mempertahankan diri, kami menyelaraskan operasi dengan fokus pada kecekapan, kemudahan dan inovasi. Platform kami memudahkan proses utama, termasuk pendaftaran ahli yang lancar, pembayaran dalam talian yang selamat dan penjejakan kehadiran masa nyata.',
    'What sets D-Clix apart is our tailored features specifically designed for martial arts clubs, addressing unique requirements to support your growth and success. Accessible via both web and mobile applications, D-Clix empowers administrators and members with a modern, user-friendly experience that adapts to your needs.':
      'Apa yang membezakan D-Clix ialah ciri khas kami yang direka khusus untuk kelab seni mempertahankan diri, menangani keperluan unik untuk menyokong pertumbuhan dan kejayaan anda. Boleh diakses melalui aplikasi web dan mudah alih, D-Clix memperkasakan pentadbir dan ahli dengan pengalaman moden yang mesra pengguna yang menyesuaikan diri dengan keperluan anda.',
    "At D-Clix, we're committed to helping clubs thrive by providing the tools you need to focus on what truly matters—your passion and your members.":
      'Di D-Clix, kami komited untuk membantu kelab berkembang maju dengan menyediakan alatan yang anda perlukan untuk memberi tumpuan kepada perkara yang benar-benar penting—keghairahan anda dan ahli anda.',
    'Get Started': 'Mulakan', 'In Depth': 'Alat Pengurusan', 'Management': 'Mendalam', 'Tools To Manage': 'Untuk Mengurus', 'Your Club To Full': 'Kelab Anda Dengan', 'Potential': 'Potensi Penuh',
    'Monitor real time update of your club performance and and manage registration, approval, attendance and payment (RAP)': 'Pantau kemas kini masa nyata prestasi kelab anda dan urus pendaftaran, kelulusan, kehadiran dan pembayaran (RAP)',
    "Let's join our community": 'Jom sertai komuniti kami', 'to track your training and grading!': 'untuk menjejak latihan dan penggredan anda!', 'Web portal :': 'Portal web :',

    /* ---- pricing (text built by js/shared/main.js) ---- */
    'D-CLIX Subscription Plan': 'Pelan Langganan D-CLIX', 'Tailored for Your Needs: Optimal Value with Every Plan': 'Disesuaikan Mengikut Keperluan Anda: Nilai Terbaik untuk Setiap Pelan',
    'Monthly': 'Bulanan', 'Yearly': 'Tahunan', 'Billing period': 'Tempoh bil', '* Gateway payment fee per online payment:': '* Caj gerbang pembayaran bagi setiap pembayaran dalam talian:',
    'Basic Plan': 'Pelan Asas', 'Standard Plan': 'Pelan Standard', 'Premium Plan': 'Pelan Premium', '/month': '/bulan', '/year': '/tahun', 'Select Plan': 'Pilih Pelan',
    '(Save RM200)': '(Jimat RM200)', '(Save RM300)': '(Jimat RM300)', '(Save RM400)': '(Jimat RM400)',
    'Essential Features': 'Ciri-ciri Asas', 'Essential Features +': 'Ciri-ciri Asas +', 'BASIC + STANDARD +': 'ASAS + STANDARD +',
    'User management tools': 'Alat pengurusan pengguna', 'Online student registrations': 'Pendaftaran pelajar dalam talian', 'Fee management': 'Pengurusan yuran',
    'Manual attendance (Portal)': 'Kehadiran manual (Portal)', 'QR Code+ Scan attendance': 'Kehadiran imbas Kod QR+', 'Discount module': 'Modul diskaun', 'Shared workspace': 'Ruang kerja dikongsi',
    'Push notification': 'Pemberitahuan tolak', 'Reimbursement': 'Tuntutan bayaran balik', 'Web and mobile app': 'Aplikasi web dan mudah alih',
    '3 Basic classes, 1 advanced class a week': '3 kelas asas, 1 kelas lanjutan seminggu', 'Dedicated WhatsApp group support': 'Sokongan kumpulan WhatsApp khas',
    'Grading management': 'Pengurusan penggredan', 'Activities management': 'Pengurusan aktiviti', 'Inventory stock management': 'Pengurusan stok inventori',
    '5 Basic classes, 2 advanced classes a week': '5 kelas asas, 2 kelas lanjutan seminggu', 'Prepaid account management': 'Pengurusan akaun prabayar', 'Contribution': 'Sumbangan',
    'Purchase request by branch to HQ': 'Permintaan pembelian oleh cawangan kepada HQ', 'Purchase request by students to branch': 'Permintaan pembelian oleh pelajar kepada cawangan',
    'Tournament participations, scores, results & history': 'Penyertaan kejohanan, markah, keputusan & sejarah', 'Financial reports customizations': 'Laporan kewangan yang boleh disesuaikan',
    'Payroll module': 'Modul gaji', 'HQ approval on manual payment': 'Kelulusan HQ untuk pembayaran manual', 'Student class booking via app': 'Tempahan kelas pelajar melalui aplikasi',

    /* ---- edu-hub ---- */
    'Learn and More': 'Belajar Lebih Lagi',
    "D-Clix Edu-Hub is a self-learning portal designed to empower users with flexible, on-demand access to educational resources. Whether it's mastering D-Clix or deepening subject knowledge, the platform offers engaging content tailored for independent learning. Complementing this is the User Experience Center, a dynamic space where users can explore features, and enjoy hands-on interaction with the D-Clix system as part of the journey.":
      'D-Clix Edu-Hub ialah portal pembelajaran kendiri yang memberi pengguna akses fleksibel kepada sumber pendidikan pada bila-bila masa. Sama ada untuk menguasai D-Clix atau mendalami pengetahuan, platform ini menawarkan kandungan menarik untuk pembelajaran sendiri. Ia dilengkapi dengan Pusat Pengalaman Pengguna, ruang di mana pengguna boleh meneroka ciri-ciri dan mencuba sistem D-Clix secara langsung.',
    'Introduction to D-Clix (Basic)': 'Pengenalan kepada D-Clix (Asas)', 'Learn how you can digitalise your registration and payment process with D-Clix': 'Ketahui cara mendigitalkan proses pendaftaran dan pembayaran anda dengan D-Clix',
    'Interactive tour — click through the real D-Clix screens.': 'Lawatan interaktif — klik melalui skrin sebenar D-Clix.', 'Open full screen': 'Buka skrin penuh',
    'Elevate Your Club': 'Tingkatkan Kelab Anda', 'A Comprehensive Guide to D-Clix': 'Panduan Lengkap D-Clix', 'Download PDF': 'Muat Turun PDF',
    "Elevate Your Club: A Comprehensive Guide to D-Clix is your essential user manual for mastering the D-Clix platform. Whether you're managing registrations, tracking attendance, handling payments, or communicating with members, this guide walks you through every feature step by step. Designed to help club administrators and coaches make the most of D-Clix's web and mobile tools, it ensures a smooth, efficient, and professional experience for running your club.":
      'Elevate Your Club: A Comprehensive Guide to D-Clix ialah manual pengguna penting untuk menguasai platform D-Clix. Sama ada anda mengurus pendaftaran, menjejak kehadiran, mengendalikan pembayaran atau berkomunikasi dengan ahli, panduan ini membimbing anda melalui setiap ciri langkah demi langkah. Ia membantu pentadbir kelab dan jurulatih menggunakan sepenuhnya alatan web dan mudah alih D-Clix untuk mengurus kelab dengan lancar, cekap dan profesional. (Panduan dalam Bahasa Inggeris.)',

    /* ---- referral (slides from js/marketing/referral-data.js) ---- */
    'Referral Program': 'Program Rujukan', 'Designed to onboard referral partners/agents with clear visuals that explain how rewards work.': 'Direka untuk rakan rujukan/ejen dengan visual jelas yang menerangkan cara ganjaran berfungsi.',
    'Previous slide': 'Slaid sebelumnya', 'Next slide': 'Slaid seterusnya',
    'Become a D-Clix Partner': 'Jadi Rakan D-Clix', 'Help clubs go digital and earn rewards as you grow.': 'Bantu kelab menjadi digital dan raih ganjaran sambil anda berkembang.',
    'How It Works': 'Cara Ia Berfungsi', 'Share your referral link to clubs and instructors.': 'Kongsi pautan rujukan anda kepada kelab dan pengajar.',
    'Track Referrals': 'Jejak Rujukan', 'Monitor signups and conversions from your dashboard.': 'Pantau pendaftaran dan penukaran daripada papan pemuka anda.',
    'Commission Structure': 'Struktur Komisen', 'Transparent rewards for every qualified subscription.': 'Ganjaran telus untuk setiap langganan yang layak.',
    'Get Paid Faster': 'Terima Bayaran Lebih Cepat', 'Fast payouts with clear monthly summaries and receipts.': 'Bayaran pantas dengan ringkasan bulanan dan resit yang jelas.',
    'Marketing Materials': 'Bahan Pemasaran', 'Use ready-made banners, posts, and presentation decks.': 'Gunakan sepanduk, hantaran dan slaid pembentangan yang sedia ada.',
    'Start Referring Today': 'Mula Merujuk Hari Ini', 'Join the referral program and grow with D-Clix.': 'Sertai program rujukan dan berkembang bersama D-Clix.',

    /* ---- community (wording from d-clix.com/ms/community) ---- */
    'D-Clix Community': 'Komuniti D-Clix', 'Join Our Community – Be Part of Something Bigger!': 'Sertai Komuniti Kami – Jadilah Sebahagian daripada Sesuatu yang Lebih Besar!',
    'Connect with like-minded business owners and professionals in our exclusive D-Clix Community.': 'Berhubung dengan pemilik perniagaan dan profesional yang berfikiran sama dalam Komuniti D-Clix eksklusif kami.',
    'Join via WhatsApp': 'Sertai melalui WhatsApp', 'Follow on Facebook': 'Ikuti di Facebook',
    'Share Ideas & Insights': 'Kongsi Idea & Cerapan', 'Collaborate and learn from others.': 'Bekerjasama dan belajar daripada orang lain.',
    'Get Pro Tips': 'Dapatkan Petua Pro', 'Stay updated with the latest trends and strategies.': 'Kekal dikemas kini dengan trend dan strategi terkini.',
    'Exclusive Offers': 'Tawaran Eksklusif', 'Enjoy special deals and early access to new features.': 'Nikmati tawaran istimewa dan akses awal kepada ciri baharu.',
    'Not using D-Clix yet?': 'Belum menggunakan D-Clix?', 'Tell us about your club and our team will help you get started.': 'Beritahu kami tentang kelab anda dan pasukan kami akan membantu anda bermula.', 'Talk to our team': 'Bercakap dengan pasukan kami',

    /* ---- 404 ---- */
    'Error 404': 'Ralat 404', "We can't find that page": 'Kami tidak dapat mencari halaman itu', 'The link may be old or mistyped. Here are some places to go instead:': 'Pautan mungkin lama atau salah taip. Berikut adalah beberapa halaman lain:',
    'Plans & signup': 'Pelan & pendaftaran',

    /* ---- home page (revamp) ---- */
    'New': 'Baharu', 'Collect club fees online with FPX': 'Kutip yuran kelab dalam talian dengan FPX',
    'Club management for martial arts & sports': 'Pengurusan kelab untuk seni mempertahankan diri & sukan', 'Run your club,': 'Uruskan kelab anda,',
    'not the paperwork': 'bukan kertas kerja', 'Registration, attendance, fees, grading and parent updates in one system, built for dojos and sports academies in Malaysia.': 'Pendaftaran, kehadiran, yuran, gred dan makluman kepada ibu bapa dalam satu sistem, dibina untuk dojo dan akademi sukan di Malaysia.',
    'Book a free demo': 'Tempah demo percuma', 'See pricing': 'Lihat harga',
    'Online FPX payments': 'Bayaran FPX dalam talian', 'Support in English & BM': 'Sokongan dalam Bahasa Inggeris & BM',
    'Dashboard': 'Papan Pemuka', 'Students': 'Pelajar',
    'Attendance': 'Kehadiran', 'Fees': 'Yuran',
    'Tournaments': 'Kejohanan', 'Active students': 'Pelajar aktif',
    '+12 this month': '+12 bulan ini', 'Fees collected': 'Yuran dikutip',
    '94% paid': '94% dibayar', 'this week': 'minggu ini',
    'Fee collection · last 6 months': 'Kutipan yuran · 6 bulan lepas', 'Paid': 'Dibayar',
    'Due 25 Oct': 'Tamat 25 Okt', 'RM 120 received': 'RM 120 diterima',
    'Nur Aina checked in': 'Nur Aina telah daftar masuk', 'Karate · 6:00 pm class': 'Karate · kelas 6:00 ptg',
    'Sample data': 'Data contoh', 'Made for every kind of club': 'Dibina untuk semua jenis kelab',
    'Sound familiar?': 'Biasa dengar?', 'Still running your club on paper and WhatsApp?': 'Masih urus kelab dengan kertas dan WhatsApp?',
    'These are the jobs that eat a club owner\'s evenings. D-Clix takes each one off your hands.': 'Inilah kerja yang menghabiskan masa petang pemilik kelab. D-Clix mengambil alih setiap satunya.', 'Cash fees in envelopes, receipts written by hand': 'Yuran tunai dalam sampul, resit ditulis tangan',
    'Parents pay online by FPX. Receipts are sent automatically.': 'Ibu bapa bayar dalam talian dengan FPX. Resit dihantar secara automatik.', 'Attendance marked on paper and lost by month end': 'Kehadiran ditanda atas kertas dan hilang pada hujung bulan',
    'Students check in by scanning a QR code, or the coach marks them with one tap.': 'Pelajar daftar masuk dengan mengimbas kod QR, atau jurulatih menanda mereka dengan satu ketikan.', 'Grading lists in Excel, results sent one by one': 'Senarai gred dalam Excel, keputusan dihantar satu demi satu',
    'Grading schedule, fees and results in one place, visible to every parent.': 'Jadual gred, yuran dan keputusan di satu tempat, boleh dilihat oleh setiap ibu bapa.', 'Parents asking on WhatsApp how much they still owe': 'Ibu bapa bertanya di WhatsApp berapa yuran yang tertunggak',
    'The parent app shows what is due and sends reminders for you.': 'Aplikasi ibu bapa menunjukkan bayaran tertunggak dan menghantar peringatan untuk anda.', 'One system, three views': 'Satu sistem, tiga paparan',
    'Everyone in your club gets the screen they need': 'Setiap orang dalam kelab anda mendapat paparan yang mereka perlukan', 'Club owner': 'Pemilik kelab',
    'Coach': 'Jurulatih', 'Parents': 'Ibu bapa',
    'See the whole club at a glance': 'Lihat keseluruhan kelab sepintas lalu', 'Fees and outstanding': 'Yuran dan tunggakan',
    'for every student, branch and month': 'bagi setiap pelajar, cawangan dan bulan', 'Reports': 'Laporan',
    'on attendance, revenue and growth, ready to export': 'tentang kehadiran, hasil dan pertumbuhan, sedia untuk dieksport', 'Branches and instructors': 'Cawangan dan jurulatih',
    'managed from one login': 'diurus daripada satu log masuk', 'Revenue by branch': 'Hasil mengikut cawangan',
    'October': 'Oktober', 'Outstanding': 'Tunggakan',
    'RM 1,120 · 9 students': 'RM 1,120 · 9 pelajar', 'Take attendance in seconds': 'Ambil kehadiran dalam beberapa saat',
    'Class lists': 'Senarai kelas', 'with each student\'s belt and payment status': 'dengan tali pinggang dan status bayaran setiap pelajar',
    'Mark attendance': 'Tanda kehadiran', 'by QR scan or one tap per student': 'dengan imbasan QR atau satu ketikan bagi setiap pelajar',
    'Grading and tournaments': 'Gred dan kejohanan', ': choose candidates and record results': ': pilih calon dan rekod keputusan',
    'Karate · Beginners': 'Karate · Pemula', 'Today 6:00 pm': 'Hari ini 6:00 ptg',
    'Present': 'Hadir', '3 of 4': '3 daripada 4',
    'Pay and follow progress from the phone': 'Bayar dan ikuti kemajuan dari telefon', 'Pay fees online': 'Bayar yuran dalam talian',
    'by FPX and get the receipt instantly': 'dengan FPX dan terima resit serta-merta', 'Class schedule, attendance and grading results': 'Jadual kelas, kehadiran dan keputusan gred',
    'for each child': 'bagi setiap anak', 'Notices from the club': 'Notis daripada kelab',
    'by push notification and WhatsApp': 'melalui pemberitahuan aplikasi dan WhatsApp', 'Hi, Puan Siti Aminah': 'Hai, Puan Siti Aminah',
    'October fee · Nur Aina': 'Yuran Oktober · Nur Aina', 'Pay with FPX': 'Bayar dengan FPX',
    'Next class': 'Kelas seterusnya', 'Thu, 6:00 pm': 'Kha, 6:00 ptg',
    'Orange belt · 9 Nov': 'Tali pinggang oren · 9 Nov', 'martial arts and sports supported': 'seni mempertahankan diri dan sukan disokong',
    'ways to take attendance: QR and manual': 'cara mengambil kehadiran: QR dan manual', 'online fee payment for parents': 'bayaran yuran dalam talian untuk ibu bapa',
    'languages: English and Bahasa Melayu': 'bahasa: Inggeris dan Bahasa Melayu', 'Everything included': 'Semua disertakan',
    'All the tools a club runs on': 'Semua alat yang diperlukan oleh kelab', 'Online registration': 'Pendaftaran dalam talian',
    'New students and instructors sign up from a link. You approve with one click.': 'Pelajar dan jurulatih baharu mendaftar melalui pautan. Anda luluskan dengan satu klik.', 'Digital attendance': 'Kehadiran digital',
    'QR code scan or manual, recorded against every class.': 'Imbasan kod QR atau manual, direkodkan bagi setiap kelas.', 'Online payment': 'Bayaran dalam talian',
    'FPX fees, invoices and receipts, with automatic reminders.': 'Yuran FPX, invois dan resit, dengan peringatan automatik.', 'Schedules, grading fees and results for each belt or level.': 'Jadual, yuran gred dan keputusan bagi setiap tali pinggang atau tahap.',
    'Player selection, scoring and the history of past events.': 'Pemilihan pemain, pemarkahan dan sejarah acara lepas.', 'Notifications': 'Pemberitahuan',
    'WhatsApp and push messages to parents, students and instructors.': 'Mesej WhatsApp dan pemberitahuan aplikasi kepada ibu bapa, pelajar dan jurulatih.', 'Records and reports': 'Rekod dan laporan',
    'Club, student and instructor data in one place, ready to export.': 'Data kelab, pelajar dan jurulatih di satu tempat, sedia untuk dieksport.', 'Integrations': 'Integrasi',
    'Purchase requests, invoicing and third-party systems when you need them.': 'Permintaan pembelian, invois dan sistem pihak ketiga apabila anda memerlukannya.', 'Built for your sport': 'Dibina untuk sukan anda',
    'Belts, grades and classes the way your sport runs them': 'Tali pinggang, gred dan kelas mengikut cara sukan anda', 'Pick your sport when you register. Grades, sessions and fee groups are set up to match.': 'Pilih sukan anda semasa mendaftar. Gred, sesi dan kumpulan yuran disediakan mengikutnya.',
    'And 14 more, including Silat, Boxing, Muaythai, MMA and Wushu.': 'Dan 14 lagi, termasuk Silat, Tinju, Muaythai, MMA dan Wushu.', 'Choose a plan to start': 'Pilih pelan untuk bermula',
    'From club leaders': 'Daripada pemimpin kelab', 'What clubs say after switching': 'Kata kelab selepas beralih',
    'D-Clix helped move my academy from manual work to a proper online system that I can use at any time.': 'D-Clix membantu akademi saya beralih daripada kerja manual kepada sistem dalam talian yang boleh saya guna pada bila-bila masa.', 'Student fee collection went up once parents could pay online. Everything is at your fingertips.': 'Kutipan yuran pelajar meningkat apabila ibu bapa boleh membayar dalam talian. Semuanya di hujung jari.',
    'Club leader': 'Pemimpin kelab', 'Join our community': 'Sertai komuniti kami',
    'Peace of mind': 'Ketenangan fikiran', 'Safe for your students\' data and your club\'s money': 'Selamat untuk data pelajar dan wang kelab anda',
    'You\'re trusting us with parents\' details and every ringgit of fees. This is how we look after both.': 'Anda mempercayakan butiran ibu bapa dan setiap ringgit yuran kepada kami. Begini cara kami menjaga kedua-duanya.', 'Secure online payments': 'Bayaran dalam talian yang selamat',
    'Parents pay by FPX online banking through a payment gateway. D-Clix never stores card or bank details.': 'Ibu bapa membayar melalui perbankan dalam talian FPX menerusi gerbang pembayaran. D-Clix tidak menyimpan butiran kad atau bank.', 'Personal data is handled under Malaysia\'s Personal Data Protection Act.': 'Data peribadi dikendalikan di bawah Akta Perlindungan Data Peribadi Malaysia.',
    'The right access for each role': 'Akses yang sesuai untuk setiap peranan', 'Owners, coaches and parents each see only what they need.': 'Pemilik, jurulatih dan ibu bapa hanya melihat apa yang mereka perlukan.',
    'A Malaysian company': 'Syarikat Malaysia', 'Raig Technologies (M) Sdn Bhd, with a support team in Petaling Jaya you can call or WhatsApp.': 'Raig Technologies (M) Sdn Bhd, dengan pasukan sokongan di Petaling Jaya yang boleh anda hubungi melalui telefon atau WhatsApp.',
    'Simple pricing': 'Harga yang mudah', 'Plans from RM100 a month': 'Pelan dari RM100 sebulan',
    'Pay monthly, or pay yearly and get two months free.': 'Bayar bulanan, atau bayar tahunan dan dapat dua bulan percuma.', 'Basic': 'Asas',
    'Attendance, fees, registration and the parent app': 'Kehadiran, yuran, pendaftaran dan aplikasi ibu bapa', 'Choose Basic': 'Pilih Asas',
    'Most popular': 'Paling popular', 'Everything in Basic, plus grading, activities and stock': 'Semua dalam Asas, serta gred, aktiviti dan stok',
    'Choose Standard': 'Pilih Standard', 'Everything in Standard, plus payroll, branch requests and tournament records': 'Semua dalam Standard, serta gaji, permintaan cawangan dan rekod kejohanan',
    'Choose Premium': 'Pilih Premium', 'Compare all features': 'Bandingkan semua ciri',
    'Questions': 'Soalan', 'Frequently asked questions': 'Soalan lazim',
    'Free demo': 'Demo percuma', 'See D-Clix with your own club\'s setup': 'Lihat D-Clix dengan tetapan kelab anda sendiri',
    'Leave your details and a D-Clix specialist will contact you within one working day to arrange a demo.': 'Tinggalkan butiran anda dan pakar D-Clix akan menghubungi anda dalam satu hari bekerja untuk mengatur demo.', 'A walk-through': 'Tunjuk cara',
    'of registration, attendance and fees': 'pendaftaran, kehadiran dan yuran', 'Setup advice': 'Nasihat tetapan',
    'for your sport, branches and fee structure': 'untuk sukan, cawangan dan struktur yuran anda', 'No obligation': 'Tiada komitmen',
    ': choose a plan only when you\'re ready': ': pilih pelan hanya apabila anda bersedia', 'Book your free demo': 'Tempah demo percuma anda',
    'Book my free demo': 'Tempah demo percuma saya', 'We use your details only to contact you about D-Clix. See our': 'Kami hanya menggunakan butiran anda untuk menghubungi anda tentang D-Clix. Lihat',
    'Example of the D-Clix dashboard': 'Contoh papan pemuka D-Clix', 'Choose a role': 'Pilih peranan',
    'D-Clix in numbers': 'D-Clix dalam angka',

    'Before': 'Sebelum', 'With D-Clix': 'Dengan D-Clix', 'Events and announcements': 'Acara dan pengumuman',
    'Previous banner': 'Banner sebelumnya', 'Next banner': 'Banner seterusnya', 'Choose banner': 'Pilih banner',

    /* ---- home page (revamp) ---- */
    'How it works': 'Cara ia berfungsi', 'From sign-up to first class': 'Dari pendaftaran hingga kelas pertama',
    'Three steps run every club: Register, Attendance and Payment (RAP).': 'Tiga langkah menggerakkan setiap kelab: Pendaftaran, Kehadiran dan Bayaran (RAP).', 'Register': 'Daftar',
    'New students and instructors sign up online. No paper forms.': 'Pelajar dan jurulatih baharu mendaftar dalam talian. Tiada borang kertas.', 'Mark attendance by QR code scan or a manual update by the coach.': 'Tanda kehadiran dengan imbasan kod QR atau kemas kini manual oleh jurulatih.',
    'Payment': 'Bayaran', 'Pay fees online by FPX from the app, and see every invoice and receipt.': 'Bayar yuran dalam talian dengan FPX melalui aplikasi, dan lihat setiap invois dan resit.',

    /* ---- home page (revamp) ---- */
    'Registration certificate (SSM / ROS / PJS)': 'Sijil pendaftaran (SSM / ROS / PJS)', 'Upload your SSM certificate': 'Muat naik sijil SSM anda',
    'PDF, JPG or PNG, up to 5 MB. Drag the file here or choose it.': 'PDF, JPG atau PNG, sehingga 5 MB. Seret fail ke sini atau pilih fail.', 'Choose file': 'Pilih fail',
    'Change': 'Tukar', 'Remove file': 'Buang fail',
    'Please upload your SSM / registration certificate.': 'Sila muat naik sijil SSM / pendaftaran anda.', 'Upload a PDF, JPG or PNG file.': 'Muat naik fail PDF, JPG atau PNG.',
    'This file is larger than 5 MB. Please upload a smaller copy.': 'Fail ini melebihi 5 MB. Sila muat naik salinan yang lebih kecil.',

    /* ---- WhatsApp chat button (js/shared/whatsapp.js) ---- */
    'Hey 👋': 'Hai 👋', 'Welcome to WhatsApp Chat and Share. Feel free to ask us anything 💫': 'Selamat datang ke Sembang WhatsApp. Tanya kami apa sahaja 💫',
    'We typically reply within a few minutes': 'Kami biasanya membalas dalam beberapa minit', 'Sales Team': 'Pasukan Jualan', 'Chat with us on WhatsApp': 'Sembang dengan kami di WhatsApp',
    'Close chat': 'Tutup sembang', 'Start chat': 'Mula sembang', 'Leave your details': 'Tinggalkan butiran anda', 'Call us': 'Hubungi kami'
  };

  var lang = 'en';
  try { lang = localStorage.getItem(KEY) || ((navigator.language || '').toLowerCase().indexOf('ms') === 0 ? 'ms' : 'en'); } catch (e) {}
  var original = new WeakMap(); // text node → its English text
  var ATTRS = ['placeholder', 'aria-label', 'title'];
  var SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1, PRE: 1 };
  function norm(t) { return t.replace(/\s+/g, ' ').trim(); }

  function doText(node) {
    if (!original.has(node)) original.set(node, node.nodeValue);
    var en = original.get(node), key = norm(en);
    if (!key) return;
    var bm = lang === 'ms' ? BM[key] : null;
    // keep the surrounding spaces so words next to links/icons stay separated
    var want = bm ? en.match(/^\s*/)[0] + bm + en.match(/\s*$/)[0] : en;
    if (node.nodeValue !== want) node.nodeValue = want;
  }
  function doAttrs(el) {
    ATTRS.forEach(function (a) {
      if (!el.hasAttribute(a)) return;
      var store = 'data-en-' + a;
      if (!el.hasAttribute(store)) el.setAttribute(store, el.getAttribute(a));
      var en = el.getAttribute(store), bm = BM[norm(en)];
      el.setAttribute(a, lang === 'ms' && bm ? bm : en);
    });
  }
  function walk(root) {
    if (!root || (root.nodeType === 1 && (SKIP[root.tagName] || root.closest('[data-no-i18n]')))) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType === 1) doAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode: function (n) { return n.nodeType === 1 && (SKIP[n.tagName] || n.hasAttribute('data-no-i18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var n; while ((n = tw.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
  }
  function apply() {
    document.documentElement.lang = lang === 'ms' ? 'ms' : 'en';
    walk(document.body);
    $$('[data-lang-label]').forEach(function (b) { b.textContent = lang === 'ms' ? 'BM' : 'EN'; });
    $$('[data-lang-pick]').forEach(function (b) { b.setAttribute('aria-checked', String(b.getAttribute('data-lang-pick') === lang)); });
  }
  function $$(s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }

  function switcher() {
    var w = document.createElement('div'); w.className = 'lang-switch';
    w.innerHTML = '<button type="button" class="lang-btn" aria-haspopup="true" aria-expanded="false" aria-label="Language"><i data-icon="globe" class="w-4"></i><span data-lang-label>EN</span></button>' +
      '<div class="lang-menu" role="menu" hidden><button type="button" role="menuitemradio" data-lang-pick="en">English</button><button type="button" role="menuitemradio" data-lang-pick="ms">Bahasa Melayu</button></div>';
    w.setAttribute('data-no-i18n', '');
    return w;
  }
  function setLang(l) { lang = l; try { localStorage.setItem(KEY, l); } catch (e) {} apply(); }
  window.dclixSetLang = setLang;

  document.addEventListener('DOMContentLoaded', function () {
    // one switcher in the desktop menu and one next to the mobile menu button
    $$('.nav-links, .nav-mobile-actions').forEach(function (bar) {
      var theme = bar.querySelector('[data-theme-toggle]');
      var sw = switcher();
      if (theme) bar.insertBefore(sw, theme); else bar.appendChild(sw);
    });
    if (window.hydrateIcons) window.hydrateIcons();
    document.addEventListener('click', function (e) {
      var pick = e.target.closest('[data-lang-pick]');
      if (pick) { setLang(pick.getAttribute('data-lang-pick')); }
      var btn = e.target.closest('.lang-btn');
      $$('.lang-switch').forEach(function (s) {
        var open = btn && s.contains(btn) && s.querySelector('.lang-menu').hidden;
        s.querySelector('.lang-menu').hidden = !open; s.querySelector('.lang-btn').setAttribute('aria-expanded', String(!!open));
      });
    });
    apply();
    // text added later (pricing cards, slides, FAQ answers, chat popup…) is translated as it appears
    new MutationObserver(function (list) {
      if (lang !== 'ms') return;
      list.forEach(function (m) { m.addedNodes.forEach(walk); });
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
