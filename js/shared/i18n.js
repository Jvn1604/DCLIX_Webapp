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
    "Core modules": "Modul utama",
    "Fees, grading and attendance, made simple": "Yuran, pergredan dan kehadiran, dipermudahkan",
    "What is the fee module?": "Apakah modul yuran?",
    "It handles every fee your club charges, from setup to receipt. Set the fees up once, and D-Clix creates the invoices, collects payment online and records each receipt.": "Ia menguruskan setiap yuran yang dikenakan kelab anda, dari penetapan hingga resit. Tetapkan yuran sekali sahaja, dan D-Clix akan menjana invois, mengutip bayaran dalam talian dan merekod setiap resit.",
    "Set different fees in Fee Master, with fee groups for different students": "Tetapkan yuran berbeza dalam Fee Master, dengan kumpulan yuran untuk pelajar yang berbeza",
    "Parents pay online by FPX, or submit a payment slip": "Ibu bapa membayar dalam talian melalui FPX, atau menghantar slip pembayaran",
    "Advance payment, payment history and receipts for every student": "Bayaran awal, sejarah pembayaran dan resit untuk setiap pelajar",
    "Outstanding and collection reports for the whole club": "Laporan tunggakan dan kutipan untuk seluruh kelab",
    "Uniforms and equipment ordered through purchase requests": "Pakaian seragam dan peralatan dipesan melalui permohonan pembelian",
    "What is the grading module?": "Apakah modul pergredan?",
    "It manages belt and grade tests from schedule to result. The club sets the grading date and exam centre, and each student's grade updates once results are recorded.": "Ia menguruskan ujian tali pinggang dan gred dari jadual hingga keputusan. Kelab menetapkan tarikh pergredan dan pusat peperiksaan, dan gred setiap pelajar dikemas kini selepas keputusan direkodkan.",
    "Grading schedule with the date and exam centre": "Jadual pergredan dengan tarikh dan pusat peperiksaan",
    "Grading fees handled together with all other fees": "Yuran pergredan diuruskan bersama semua yuran lain",
    "Results recorded per student, with a grade completed report": "Keputusan direkodkan bagi setiap pelajar, dengan laporan gred selesai",
    "Students and parents see the current belt, last grading date and progress report": "Pelajar dan ibu bapa melihat tali pinggang semasa, tarikh pergredan terakhir dan laporan kemajuan",
    "What is the attendance module?": "Apakah modul kehadiran?",
    "It records who comes to every class. Students check in by scanning the class QR code, or the coach marks attendance manually.": "Ia merekod siapa yang hadir ke setiap kelas. Pelajar mendaftar masuk dengan mengimbas kod QR kelas, atau jurulatih menanda kehadiran secara manual.",
    "QR check-in from the app, or manual attendance by the coach": "Daftar masuk QR daripada aplikasi, atau kehadiran manual oleh jurulatih",
    "Class lists show each student's belt and payment status": "Senarai kelas menunjukkan tali pinggang dan status pembayaran setiap pelajar",
    "Attendance reports for the whole club": "Laporan kehadiran untuk seluruh kelab",
    "Parents see their child's attendance in the app": "Ibu bapa melihat kehadiran anak mereka dalam aplikasi",
    "Timetable and training times for every centre": "Jadual dan masa latihan untuk setiap pusat",
    "What types of fees can my club set up?": "Apakah jenis yuran yang boleh ditetapkan oleh kelab saya?",
    "Fee Master is where you set the fees your club charges, such as monthly training, grading, and items like uniforms or equipment. Students can be placed in fee groups so each group is charged the right amount.": "Fee Master ialah tempat anda menetapkan yuran kelab, seperti latihan bulanan, pergredan, dan barangan seperti pakaian seragam atau peralatan. Pelajar boleh diletakkan dalam kumpulan yuran supaya setiap kumpulan dikenakan jumlah yang betul.",
    "Can parents pay in advance?": "Bolehkah ibu bapa membayar lebih awal?",
    "Yes. Advance Payment lets parents pay ahead, and every payment appears in Payment History with its receipt.": "Boleh. Advance Payment membolehkan ibu bapa membayar lebih awal, dan setiap pembayaran dipaparkan dalam Payment History bersama resitnya.",
    "How do I know who has not paid?": "Bagaimana saya tahu siapa yang belum membayar?",
    "The Outstanding Report lists every unpaid invoice, and parents see their fees due on the home screen with a Pay Now button. Automatic reminders are sent too.": "Outstanding Report menyenaraikan setiap invois yang belum dibayar, dan ibu bapa melihat yuran tertunggak di skrin utama dengan butang Pay Now. Peringatan automatik turut dihantar.",
    "Can I set up grades for my sport?": "Bolehkah saya menetapkan gred untuk sukan saya?",
    "Yes. Pick your sport when you register, and its grades, belts and fee groups are set up to match.": "Boleh. Pilih sukan anda semasa mendaftar, dan gred, tali pinggang serta kumpulan yuran disediakan mengikutnya.",
    "Who can see a student's grading results?": "Siapa yang boleh melihat keputusan pergredan pelajar?",
    "The club records the results. The student and parents see the current grade, last grading date and progress report in the app.": "Kelab merekod keputusan. Pelajar dan ibu bapa melihat gred semasa, tarikh pergredan terakhir dan laporan kemajuan dalam aplikasi.",
    "What if a student forgets to scan the QR code?": "Bagaimana jika pelajar terlupa mengimbas kod QR?",
    "The coach or admin can mark attendance manually, so the class record stays complete.": "Jurulatih atau pentadbir boleh menanda kehadiran secara manual, supaya rekod kelas kekal lengkap.",
    "Student invoices": "Invois pelajar",
    "Monthly training fee": "Yuran latihan bulanan",
    "Grading fee": "Yuran pergredan",
    "Orange belt": "Tali pinggang oren",
    "Due": "Tertunggak",
    "Uniform": "Pakaian seragam",
    "Purchase request": "Permohonan pembelian",
    "Advance payment": "Bayaran awal",
    "3 months": "3 bulan",
    "What is the Fee Module?": "Apakah Modul Yuran?",
    "The fee module handles every fee your club charges, from setup to receipt. Set the fees up once, and D-Clix creates the invoices, collects payment online and records every receipt.": "Modul yuran menguruskan setiap yuran yang dikenakan kelab anda, dari penetapan hingga resit. Tetapkan yuran sekali sahaja, dan D-Clix menjana invois, mengutip bayaran dalam talian dan merekod setiap resit.",
    "Types of fees you can collect": "Jenis yuran yang boleh dikutip",
    "Uniform and equipment": "Pakaian seragam dan peralatan",
    "Other fees set up in Fee Master": "Yuran lain yang ditetapkan dalam Fee Master",
    "What it does": "Apa yang ia lakukan",
    "Fee Master": "Fee Master",
    "Set up every fee your club charges in one place, and group students so each group pays the right amount.": "Tetapkan setiap yuran kelab anda di satu tempat, dan kumpulkan pelajar supaya setiap kumpulan membayar jumlah yang betul.",
    "Invoices": "Invois",
    "D-Clix creates an invoice for each student, and parents see what is due on their home screen.": "D-Clix menjana invois untuk setiap pelajar, dan ibu bapa melihat jumlah tertunggak di skrin utama mereka.",
    "Parents pay by FPX from the app or the web, or submit a payment slip.": "Ibu bapa membayar melalui FPX daripada aplikasi atau web, atau menghantar slip pembayaran.",
    "Parents can pay ahead instead of paying every month.": "Ibu bapa boleh membayar lebih awal dan tidak perlu membayar setiap bulan.",
    "Receipts and history": "Resit dan sejarah",
    "Every payment gets a receipt and stays in the payment history.": "Setiap pembayaran mendapat resit dan kekal dalam sejarah pembayaran.",
    "Outstanding, collection and receipt reports show who has paid and who has not.": "Laporan tunggakan, kutipan dan resit menunjukkan siapa yang sudah dan belum membayar.",
    "Next grading": "Pergredan seterusnya",
    "Current grade": "Gred semasa",
    "Last grading 30 Apr": "Pergredan terakhir 30 Apr",
    "Exam centre": "Pusat peperiksaan",
    "Exam 1": "Peperiksaan 1",
    "Scheduled": "Berjadual",
    "Added to the invoice": "Ditambah ke invois",
    "Example belts. Grades follow your sport.": "Contoh tali pinggang. Gred mengikut sukan anda.",
    "What is the Grading Module?": "Apakah Modul Pergredan?",
    "The grading module manages belt and grade tests from schedule to result. The club sets the grading date and exam centre and records the results, so every student has an up to date grade on their record.": "Modul pergredan menguruskan ujian tali pinggang dan gred dari jadual hingga keputusan. Kelab menetapkan tarikh pergredan dan pusat peperiksaan serta merekod keputusan, supaya setiap pelajar mempunyai gred terkini dalam rekodnya.",
    "Grading schedule": "Jadual pergredan",
    "Set the grading date, time and exam centre, and everyone sees it.": "Tetapkan tarikh, masa dan pusat peperiksaan pergredan, dan semua orang dapat melihatnya.",
    "Exam centres": "Pusat peperiksaan",
    "Each student is linked to an exam centre on their record.": "Setiap pelajar dipautkan kepada pusat peperiksaan dalam rekodnya.",
    "Grading fees": "Yuran pergredan",
    "Grading fees are invoiced and paid together with the other fees.": "Yuran pergredan diinvois dan dibayar bersama yuran lain.",
    "Results": "Keputusan",
    "Record who completed each grade, and keep the history for every student.": "Rekod siapa yang melengkapkan setiap gred, dan simpan sejarahnya untuk setiap pelajar.",
    "Belt and rank": "Tali pinggang dan pangkat",
    "Each student keeps a current grade and last grading date on their record.": "Setiap pelajar mempunyai gred semasa dan tarikh pergredan terakhir dalam rekodnya.",
    "Progress report": "Laporan kemajuan",
    "Students and parents open the progress report in the app.": "Pelajar dan ibu bapa membuka laporan kemajuan dalam aplikasi.",
    "Scanned QR": "Imbas QR",
    "Marked by coach": "Ditanda oleh jurulatih",
    "No check-in": "Tiada daftar masuk",
    "Absent": "Tidak hadir",
    "What is the Attendance Module?": "Apakah Modul Kehadiran?",
    "The attendance module records who comes to every class. Students check in by scanning the class QR code, or the coach marks attendance by hand, and the club can see the numbers at any time.": "Modul kehadiran merekod siapa yang hadir ke setiap kelas. Pelajar mendaftar masuk dengan mengimbas kod QR kelas, atau jurulatih menanda kehadiran secara manual, dan kelab boleh melihat angkanya pada bila-bila masa.",
    "QR check-in": "Daftar masuk QR",
    "Students scan the class QR code from the app to check in.": "Pelajar mengimbas kod QR kelas daripada aplikasi untuk mendaftar masuk.",
    "Manual attendance": "Kehadiran manual",
    "The coach or admin can mark attendance by hand, for example if a student forgets to scan.": "Jurulatih atau pentadbir boleh menanda kehadiran secara manual, contohnya jika pelajar terlupa mengimbas.",
    "Today's classes": "Kelas hari ini",
    "Students see their classes for the day and tap Check In.": "Pelajar melihat kelas mereka hari ini dan menekan Check In.",
    "Each class list shows every student's belt and payment status.": "Setiap senarai kelas menunjukkan tali pinggang dan status pembayaran setiap pelajar.",
    "Timetable": "Jadual",
    "Training times and timetables for every centre, with class booking.": "Masa latihan dan jadual untuk setiap pusat, dengan tempahan kelas.",
    "Attendance reports": "Laporan kehadiran",
    "Club-wide reports for the club, and parents see their child's attendance.": "Laporan kehadiran seluruh kelab, dan ibu bapa melihat kehadiran anak mereka.",
    "Set the schedule": "Tetapkan jadual",
    "Choose the grading date, time and exam centre for the session.": "Pilih tarikh, masa dan pusat peperiksaan untuk sesi pergredan.",
    "Assign students": "Tetapkan pelajar",
    "Collect the fee": "Kutip yuran",
    "The grading fee is invoiced and paid online with the other fees.": "Yuran pergredan diinvois dan dibayar dalam talian bersama yuran lain.",
    "Record the results": "Rekod keputusan",
    "Mark who completed the grade. Each student keeps their current grade and last grading date.": "Tanda siapa yang melengkapkan gred. Setiap pelajar mempunyai gred semasa dan tarikh pergredan terakhir dalam rekodnya.",
    "What is a grading schedule?": "Apakah jadual pergredan?",
    "A grading schedule is the plan for your next belt or grade test: when it happens, where it happens and who takes part. The club sets it up once in D-Clix, and the schedule and results are visible to every parent.": "Jadual pergredan ialah pelan untuk ujian tali pinggang atau gred anda yang seterusnya: bila ia berlangsung, di mana dan siapa yang mengambil bahagian. Kelab menetapkannya sekali sahaja dalam D-Clix, dan jadual serta keputusan boleh dilihat oleh setiap ibu bapa.",
    "Who sees what": "Siapa melihat apa",
    "Club owners and instructors": "Pemilik kelab dan jurulatih",
    "Open Grading Schedule from the home screen": "Buka Grading Schedule daripada skrin utama",
    "See the number of upcoming gradings under Club at a glance": "Lihat bilangan pergredan akan datang di bawah Club at a glance",
    "Run the Grading Schedule and Grade Completed reports": "Jalankan laporan Grading Schedule dan Grade Completed",
    "Students and parents": "Pelajar dan ibu bapa",
    "See the grading schedule and results in one place": "Lihat jadual dan keputusan pergredan di satu tempat",
    "Check the exam centre, current grade and last grading date": "Semak pusat peperiksaan, gred semasa dan tarikh pergredan terakhir",
    "Open the progress report and belt or rank in the app": "Buka laporan kemajuan dan tali pinggang atau pangkat dalam aplikasi",
    "Registration fee": "Yuran pendaftaran",
    "New student": "Pelajar baharu",
    "Monthly fee": "Yuran bulanan",
    "Early payment discount": "Diskaun bayaran awal",
    "Applied": "Digunakan",
    "The fee module handles every fee your club charges, from registration to grading. Set each fee up once in Fee Master, and D-Clix creates the invoices, collects payment online and records every receipt.": "Modul yuran menguruskan setiap yuran yang dikenakan kelab anda, dari pendaftaran hingga pergredan. Tetapkan setiap yuran sekali dalam Fee Master, dan D-Clix menjana invois, mengutip bayaran dalam talian dan merekod setiap resit.",
    "Fees you can charge": "Yuran yang boleh dikenakan",
    "Training centre fee (special)": "Yuran pusat latihan (khas)",
    "Attendance fee": "Yuran kehadiran",
    "Package fee": "Yuran pakej",
    "Discounts you can give": "Diskaun yang boleh diberikan",
    "Referral discount": "Diskaun rujukan",
    "One place to set up every fee, from registration to grading.": "Satu tempat untuk menetapkan setiap yuran, dari pendaftaran hingga pergredan.",
    "Packages": "Pakej",
    "Create packages and set the fee for each package.": "Cipta pakej dan tetapkan yuran bagi setiap pakej.",
    "Discounts": "Diskaun",
    "Reward early payers and referrals with discounts.": "Ganjari pembayar awal dan rujukan dengan diskaun.",
    "Receipts and reports": "Resit dan laporan",
    "Every payment gets a receipt. Parents can also pay ahead, and outstanding and collection reports show who has not paid.": "Setiap pembayaran mendapat resit. Ibu bapa juga boleh membayar lebih awal, dan laporan tunggakan serta kutipan menunjukkan siapa yang belum membayar.",
    "Eligible students": "Pelajar yang layak",
    "Selected for this grading": "Dipilih untuk pergredan ini",
    "Invoices generated": "Invois dijana",
    "Unpaid selection shows the rest": "Pilihan belum bayar menunjukkan baki",
    "Results and certificates": "Keputusan dan sijil",
    "After the exam": "Selepas peperiksaan",
    "The grading module takes a belt or grade test from start to finish: exam centres, examiners, the schedule, eligible students, fees, assessment, results and certificates.": "Modul pergredan menguruskan ujian tali pinggang atau gred dari mula hingga akhir: pusat peperiksaan, pemeriksa, jadual, pelajar yang layak, yuran, penilaian, keputusan dan sijil.",
    "Exam centres and examiners": "Pusat peperiksaan dan pemeriksa",
    "Set up exam centres and examiners, and tag each training centre to its exam centre.": "Sediakan pusat peperiksaan dan pemeriksa, dan tag setiap pusat latihan kepada pusat peperiksaannya.",
    "Select who takes the grading, and check the unpaid and insufficient attendance lists first.": "Pilih siapa yang mengambil pergredan, dan semak dahulu senarai belum bayar dan kehadiran tidak mencukupi.",
    "A grading fee invoice is generated for each eligible student.": "Invois yuran pergredan dijana untuk setiap pelajar yang layak.",
    "Assessment form": "Borang penilaian",
    "Examiners record each student's assessment on the assessment form.": "Pemeriksa merekod penilaian setiap pelajar pada borang penilaian.",
    "Results and belts": "Keputusan dan tali pinggang",
    "Grading results, certificates and belts are tracked for every student in the session.": "Keputusan pergredan, sijil dan tali pinggang dijejak bagi setiap pelajar dalam sesi.",
    "Certificates and statistics": "Sijil dan statistik",
    "Print certificates, and view exam result summaries and statistics.": "Cetak sijil, dan lihat ringkasan keputusan peperiksaan serta statistik.",
    "Set up exam centres": "Sediakan pusat peperiksaan",
    "Add exam centres and examiners, and tag each training centre to its exam centre.": "Tambah pusat peperiksaan dan pemeriksa, dan tag setiap pusat latihan kepada pusat peperiksaannya.",
    "Create the exam schedule": "Cipta jadual peperiksaan",
    "Choose the exam centre, date and time for the session.": "Pilih pusat peperiksaan, tarikh dan masa untuk sesi.",
    "Select eligible students": "Pilih pelajar yang layak",
    "Pick who takes the grading. The unpaid and insufficient attendance lists show who may not be ready.": "Pilih siapa yang mengambil pergredan. Senarai belum bayar dan kehadiran tidak mencukupi menunjukkan siapa yang mungkin belum bersedia.",
    "Generate the invoices": "Jana invois",
    "Grading fee invoices are created for the eligible students and paid online.": "Invois yuran pergredan dicipta untuk pelajar yang layak dan dibayar dalam talian.",
    "Assess and record results": "Nilai dan rekod keputusan",
    "Examiners fill in the assessment form, then the grading results are saved.": "Pemeriksa mengisi borang penilaian, kemudian keputusan pergredan disimpan.",
    "Print certificates": "Cetak sijil",
    "Certificates are printed and each student's belt is updated.": "Sijil dicetak dan tali pinggang setiap pelajar dikemas kini.",
    "A grading schedule is one grading session: the exam centre, the date and time, the training centres taking part and the eligible students. The Grading Dashboard lists every schedule and shows how many students are eligible, invoiced, paid, graded and certified.": "Jadual pergredan ialah satu sesi pergredan: pusat peperiksaan, tarikh dan masa, pusat latihan yang mengambil bahagian dan pelajar yang layak. Grading Dashboard menyenaraikan setiap jadual dan menunjukkan berapa ramai pelajar yang layak, diinvois, membayar, digred dan diberi sijil.",
    "Open the Grading Dashboard to see upcoming, recent and historical gradings": "Buka Grading Dashboard untuk melihat pergredan akan datang, terkini dan lampau",
    "Track eligible, invoiced, paid, results, certificates and belts for each schedule": "Jejak yang layak, diinvois, dibayar, keputusan, sijil dan tali pinggang bagi setiap jadual",
    "Filter by exam centre, training centre or student, and view statistics and summaries": "Tapis mengikut pusat peperiksaan, pusat latihan atau pelajar, dan lihat statistik serta ringkasan",
    "The attendance module records who comes to every class, for both students and instructors. Mark attendance by QR code or by choosing names, save it, and report on it whenever you need.": "Modul kehadiran merekod siapa yang hadir ke setiap kelas, bagi pelajar dan jurulatih. Tanda kehadiran melalui kod QR atau dengan memilih nama, simpan, dan buat laporan bila-bila masa.",
    "Students scan the class QR code in the app, and coaches can also enter a QR code when marking attendance.": "Pelajar mengimbas kod QR kelas dalam aplikasi, dan jurulatih juga boleh memasukkan kod QR semasa menanda kehadiran.",
    "Choose the date, training centre and time, add students one by one or all at once, then save.": "Pilih tarikh, pusat latihan dan masa, tambah pelajar seorang demi seorang atau serentak, kemudian simpan.",
    "Students and instructors": "Pelajar dan jurulatih",
    "Mark attendance for students or for instructors.": "Tanda kehadiran untuk pelajar atau jurulatih.",
    "Training times": "Masa latihan",
    "Classes follow each centre's training days and times, with a training type such as normal training.": "Kelas mengikut hari dan masa latihan setiap pusat, dengan jenis latihan seperti latihan biasa.",
    "Filter by centre, time and date range, then export to Excel or PDF.": "Tapis mengikut pusat, masa dan tempoh tarikh, kemudian eksport ke Excel atau PDF.",
    "Linked to grading and fees": "Berkait dengan pergredan dan yuran",
    "Attendance feeds the insufficient attendance check for grading, and Fee Master has an attendance fee.": "Kehadiran digunakan dalam semakan kehadiran tidak mencukupi untuk pergredan, dan Fee Master mempunyai yuran kehadiran.",
    "Create the package": "Cipta pakej",
    "Give it a code and name, the number of classes and an invoice description such as 5 classes per month.": "Berikan kod dan nama, bilangan kelas dan huraian invois seperti 5 kelas sebulan.",
    "Set the monthly fee": "Tetapkan yuran bulanan",
    "Choose the fee for the package, for all grades or for one grade.": "Pilih yuran bagi pakej itu, untuk semua gred atau untuk satu gred.",
    "Set the dates and status": "Tetapkan tarikh dan status",
    "Each fee has a start date, an end date and a status, so old fees can be retired.": "Setiap yuran mempunyai tarikh mula, tarikh tamat dan status, supaya yuran lama boleh ditamatkan.",
    "Place students in a package, and see how many students each package has.": "Letakkan pelajar dalam pakej, dan lihat berapa ramai pelajar dalam setiap pakej.",
    "Packages and monthly fees": "Pakej dan yuran bulanan",
    "How do packages work?": "Bagaimanakah pakej berfungsi?",
    "A package decides how many classes a student can attend each month. You then set the monthly fee for the package, the same for every grade or different for each grade, so the monthly invoice always matches the package.": "Pakej menentukan berapa banyak kelas yang boleh dihadiri pelajar setiap bulan. Anda kemudian menetapkan yuran bulanan bagi pakej itu, sama untuk semua gred atau berbeza bagi setiap gred, supaya invois bulanan sentiasa sepadan dengan pakej.",
    "Where to find it": "Di mana untuk mencarinya",
    "Package Master": "Package Master",
    "Package code and name, with the invoice period": "Kod dan nama pakej, dengan tempoh invois",
    "Number of classes and total students": "Bilangan kelas dan jumlah pelajar",
    "An invoice description for each package": "Huraian invois bagi setiap pakej",
    "Fee Package Master": "Fee Package Master",
    "Grade type and grade name, for all grades or one grade": "Jenis gred dan nama gred, untuk semua gred atau satu gred",
    "Monthly fee amount": "Jumlah yuran bulanan",
    "Start date, end date and status": "Tarikh mula, tarikh tamat dan status",
    "Create packages by number of classes, such as 5 classes a month, and set a fee for each package.": "Cipta pakej mengikut bilangan kelas, seperti 5 kelas sebulan, dan tetapkan yuran bagi setiap pakej.",
    'Get the app': 'Dapatkan aplikasi',
    'Trusted by martial arts and sports clubs': 'Dipercayai oleh kelab seni mempertahankan diri dan sukan', 'clubs': 'kelab', 'students': 'pelajar',
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

    /* ---- home page (revamp) ---- */
    'Live': 'Langsung',

    /* ---- home page (revamp) ---- */
    'About D-Clix': 'Tentang D-Clix', 'Built for the people who': 'Dibina untuk mereka yang',
    'run clubs': 'mengurus kelab', 'D-Clix is a club management system for sports and martial arts clubs. Registration, online payments and attendance in one place, on the web and in the mobile app.': 'D-Clix ialah sistem pengurusan kelab untuk kelab sukan dan seni mempertahankan diri. Pendaftaran, bayaran dalam talian dan kehadiran di satu tempat, di web dan dalam aplikasi mudah alih.',
    'Welcome to Martial Arts': 'Selamat datang ke Aplikasi', 'Club App': 'Kelab Seni Mempertahankan Diri',
    'clubs use D-Clix': 'kelab menggunakan D-Clix', 'students managed': 'pelajar diurus',
    'Our story': 'Kisah kami', 'Made for martial arts, not adapted from something else': 'Dibina untuk seni mempertahankan diri, bukan diubah suai daripada sistem lain',
    'What sets D-Clix apart is that its features are designed for martial arts clubs: belts and grading, classes, tournaments and fees, the way clubs really run them. On the web and in the mobile app, owners, coaches and members all get a modern, simple experience.': 'Keistimewaan D-Clix ialah cirinya direka untuk kelab seni mempertahankan diri: tali pinggang dan penggredan, kelas, kejohanan dan yuran, mengikut cara sebenar kelab beroperasi. Di web dan dalam aplikasi mudah alih, pemilik, jurulatih dan ahli mendapat pengalaman yang moden dan mudah.', 'At D-Clix, we\'re committed to helping clubs thrive by providing the tools you need to focus on what truly matters: your passion and your members.': 'Di D-Clix, kami komited membantu kelab berkembang dengan menyediakan alat yang anda perlukan untuk fokus pada perkara yang benar-benar penting: minat anda dan ahli anda.',
    'The D-Clix team': 'Pasukan D-Clix', 'Built for martial arts': 'Dibina untuk seni mempertahankan diri',
    'Belts, grading, tournaments and class schedules work the way your sport does.': 'Tali pinggang, penggredan, kejohanan dan jadual kelas berfungsi mengikut cara sukan anda.', 'Web and mobile': 'Web dan mudah alih',
    'Admins work on the web dashboard; members and parents use the app.': 'Pentadbir menggunakan papan pemuka web; ahli dan ibu bapa menggunakan aplikasi.', 'Less admin': 'Kurang kerja pentadbiran',
    'Registration, online payments and attendance tracking without paperwork.': 'Pendaftaran, bayaran dalam talian dan rekod kehadiran tanpa kertas.', 'A local team': 'Pasukan tempatan',
    'A Malaysian company with a support team in Petaling Jaya.': 'Syarikat Malaysia dengan pasukan sokongan di Petaling Jaya.', 'In depth': 'Lebih mendalam',
    'Management tools to run your club to its full potential': 'Alat pengurusan untuk menggerakkan kelab anda ke tahap terbaik', 'See real-time updates on your club\'s performance, and manage registration, approval, attendance and payment from one dashboard.': 'Lihat prestasi kelab anda secara masa nyata, dan urus pendaftaran, kelulusan, kehadiran dan bayaran daripada satu papan pemuka.',
    'Registration and approval': 'Pendaftaran dan kelulusan', 'of new members and instructors': 'ahli dan jurulatih baharu',
    'by QR code scan or a manual update': 'dengan imbasan kod QR atau kemas kini manual', 'Payments': 'Bayaran',
    'online by FPX, with invoices and receipts': 'dalam talian dengan FPX, berserta invois dan resit', 'Talk to us': 'Hubungi kami',
    'D-Clix subscription plans': 'Pelan langganan D-Clix', 'Plans that grow': 'Pelan yang berkembang',
    'with your club': 'bersama kelab anda', 'Choose monthly, or pay yearly and get two months free. Every plan includes the web dashboard and the mobile app.': 'Pilih bulanan, atau bayar tahunan dan dapat dua bulan percuma. Setiap pelan termasuk papan pemuka web dan aplikasi mudah alih.',
    'In every plan': 'Dalam setiap pelan', 'The essentials, whichever plan you choose': 'Keperluan asas, apa jua pelan yang anda pilih',
    'A web dashboard for admins and an app for members and parents.': 'Papan pemuka web untuk pentadbir dan aplikasi untuk ahli dan ibu bapa.', 'New students sign up online. No paper forms.': 'Pelajar baharu mendaftar dalam talian. Tiada borang kertas.',
    'QR attendance': 'Kehadiran QR', 'Scan a QR code or mark attendance manually.': 'Imbas kod QR atau tanda kehadiran secara manual.',
    'WhatsApp support': 'Sokongan WhatsApp', 'A dedicated WhatsApp group with the D-Clix team.': 'Kumpulan WhatsApp khas bersama pasukan D-Clix.',
    'Pricing questions': 'Soalan tentang harga', 'How does yearly billing work?': 'Bagaimana bil tahunan berfungsi?',
    'A yearly plan costs ten times the monthly price, so you get 12 months for the price of 10.': 'Pelan tahunan berharga sepuluh kali ganda harga bulanan, jadi anda mendapat 12 bulan pada harga 10 bulan.', 'Are there any other charges?': 'Adakah caj lain?',
    'Each online payment has a gateway fee of RM 1.20. It is shown in the total before you pay.': 'Setiap bayaran dalam talian dikenakan yuran gerbang RM 1.20. Ia ditunjukkan dalam jumlah sebelum anda membayar.', 'How do I pay?': 'Bagaimana saya membayar?',
    'After you register your club you pay online by FPX online banking or card through Billplz. D-Clix never sees your card or bank details.': 'Selepas mendaftar kelab, anda membayar dalam talian melalui perbankan FPX atau kad menerusi Billplz. D-Clix tidak melihat butiran kad atau bank anda.', 'Can I get a refund?': 'Bolehkah saya mendapat bayaran balik?',
    '. Book a free demo first if you would like to see D-Clix before you buy.': '. Tempah demo percuma dahulu jika anda ingin melihat D-Clix sebelum membeli.', 'Which plan should I choose?': 'Pelan mana yang patut saya pilih?',
    'Basic covers registration, fees and attendance. Standard adds grading, activities and stock. Premium adds payroll, branch requests and tournament records. Our team can help you choose.': 'Asas merangkumi pendaftaran, yuran dan kehadiran. Standard menambah penggredan, aktiviti dan stok. Premium menambah gaji, permintaan cawangan dan rekod kejohanan. Pasukan kami boleh membantu anda memilih.', 'Not sure yet?': 'Belum pasti?',
    'Try D-Clix with our team first': 'Cuba D-Clix bersama pasukan kami dahulu', 'Book a free demo and we\'ll help you pick the right plan for your club.': 'Tempah demo percuma dan kami akan membantu anda memilih pelan yang sesuai untuk kelab anda.',
    'Chat on WhatsApp': 'Sembang di WhatsApp', 'Learn D-Clix': 'Belajar D-Clix',
    'at your own pace': 'mengikut rentak anda', 'Edu-Hub is our self-learning portal: try the real D-Clix screens in an interactive tour, then keep the full user guide for when you need it.': 'Edu-Hub ialah portal pembelajaran kendiri kami: cuba skrin sebenar D-Clix dalam lawatan interaktif, kemudian simpan panduan pengguna lengkap untuk rujukan.',
    'Interactive tour': 'Lawatan interaktif', 'User guide (PDF)': 'Panduan pengguna (PDF)',
    'Book a guided demo': 'Tempah demo berpandu', 'Learn how you can digitalise your registration and payment process with D-Clix.': 'Ketahui cara mendigitalkan proses pendaftaran dan bayaran anda dengan D-Clix.',
    'What you\'ll learn': 'Apa yang anda akan pelajari', 'Everything a club admin does every day': 'Semua tugas harian pentadbir kelab',
    'Registrations': 'Pendaftaran', 'Add and approve new members and instructors.': 'Tambah dan luluskan ahli serta jurulatih baharu.',
    'Track attendance for every class.': 'Rekod kehadiran bagi setiap kelas.', 'Fees, invoices and receipts, collected online.': 'Yuran, invois dan resit, dikutip dalam talian.',
    'Communication': 'Komunikasi', 'Keep members and parents updated.': 'Pastikan ahli dan ibu bapa sentiasa dimaklumkan.',
    'User manual · PDF': 'Manual pengguna · PDF', 'User guide': 'Panduan pengguna',
    'Your essential user manual for the D-Clix platform. It walks club administrators and coaches through every feature, step by step, on the web and in the mobile app.': 'Manual pengguna penting untuk platform D-Clix. Ia membimbing pentadbir kelab dan jurulatih melalui setiap ciri, langkah demi langkah, di web dan dalam aplikasi mudah alih.', 'Managing registrations': 'Mengurus pendaftaran',
    'and member records': 'dan rekod ahli', 'Tracking attendance': 'Merekod kehadiran',
    'and handling payments': 'dan mengurus bayaran', 'Communicating': 'Berkomunikasi',
    'with members and parents': 'dengan ahli dan ibu bapa', 'Prefer a person?': 'Lebih suka dibantu seseorang?',
    'Get a guided walkthrough': 'Dapatkan tunjuk cara berpandu', 'Book a free demo and a D-Clix specialist will show you around with your own club\'s setup.': 'Tempah demo percuma dan pakar D-Clix akan menunjukkan sistem dengan tetapan kelab anda sendiri.',
    'Be part of': 'Jadilah sebahagian daripada', 'something bigger': 'sesuatu yang lebih besar',
    'Connect with like-minded club owners and professionals in our exclusive D-Clix Community.': 'Berhubung dengan pemilik kelab dan profesional yang sehaluan dalam Komuniti D-Clix eksklusif kami.', 'Share ideas': 'Kongsi idea',
    'Learn from other clubs': 'Belajar daripada kelab lain', 'Exclusive offers': 'Tawaran eksklusif',
    'For community members': 'Untuk ahli komuniti', 'Why join': 'Kenapa sertai',
    'What you get in the community': 'Apa yang anda dapat dalam komuniti', 'Share ideas & insights': 'Kongsi idea & pandangan',
    'Collaborate with and learn from other club owners and coaches.': 'Bekerjasama dan belajar daripada pemilik kelab dan jurulatih lain.', 'Get pro tips': 'Dapatkan tip pakar',
    'Stay up to date with the latest trends and strategies for running a club.': 'Ikuti trend dan strategi terkini untuk mengurus kelab.', 'Special deals and early access to new D-Clix features.': 'Tawaran istimewa dan akses awal kepada ciri baharu D-Clix.',
    'Follow D-Clix': 'Ikuti D-Clix', 'See what clubs are doing with D-Clix': 'Lihat apa yang kelab lakukan dengan D-Clix',
    'News and club stories': 'Berita dan kisah kelab', 'Bring your club on board': 'Bawa kelab anda bersama kami',
    'Club members training together': 'Ahli kelab berlatih bersama',

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
