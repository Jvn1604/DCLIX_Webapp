/* ==========================================================
   D-Clix Admin — data layer (demo)
   Everything lives in localStorage under one key. Sample data is
   generated on first load. Replace DB.load/DB.save with API calls
   when a real backend exists.
   ========================================================== */
(function () {
  'use strict';
  var KEY = 'dclix_admin_db_v1';
  var DEMO_PASSWORD = 'Demo@1234'; // demo accounts only — never a real password

  /* ---------- SHA-256 (demo hashing; real hashing belongs on the server) ---------- */
  function sha256(str) {
    var ascii = unescape(encodeURIComponent(str));
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var maxWord = Math.pow(2, 32), result = '', words = [], bitLen = ascii.length * 8;
    var hash = [], k = [], primes = 0, composite = {}, i, j;
    for (var c = 2; primes < 64; c++) {
      if (!composite[c]) {
        for (i = 0; i < 313; i += c) composite[i] = c;
        hash[primes] = (Math.pow(c, 0.5) * maxWord) | 0;
        k[primes++] = (Math.pow(c, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii.length; i++) { j = ascii.charCodeAt(i); words[i >> 2] |= j << ((3 - i) % 4) * 8; }
    words[words.length] = (bitLen / maxWord) | 0;
    words[words.length] = bitLen;
    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16), old = hash;
      hash = hash.slice(0, 8);
      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2], a = hash[0], e = hash[4];
        var t1 = hash[7] + (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) + ((e & hash[5]) ^ ((~e) & hash[6])) + k[i] +
          (w[i] = (i < 16) ? w[i] : (w[i - 16] + (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var t2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(t1 + t2) | 0].concat(hash);
        hash[4] = (hash[4] + t1) | 0;
      }
      for (i = 0; i < 8; i++) hash[i] = (hash[i] + old[i]) | 0;
    }
    for (i = 0; i < 8; i++) for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += (b < 16 ? '0' : '') + b.toString(16); }
    return result;
  }
  function hashPassword(pw, salt) { return sha256(salt + ':' + pw); }
  function newSalt() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36); }

  /* ---------- Deterministic random for seeding ---------- */
  var seed = 20261016;
  function rnd() { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function weighted(pairs) { var t = 0, r = rnd(), i; for (i = 0; i < pairs.length; i++) t += pairs[i][1]; r *= t; for (i = 0; i < pairs.length; i++) { r -= pairs[i][1]; if (r <= 0) return pairs[i][0]; } return pairs[0][0]; }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1, 2) + '-' + pad(d.getDate(), 2); }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function addMonths(d, n) { var x = new Date(d); x.setMonth(x.getMonth() + n); return x; }

  var SPORTS = ['Taekwondo', 'Karate', 'Silat', 'Judo', 'Muay Thai', 'Kickboxing', 'Boxing', 'MMA', 'Wushu', 'Jiu-Jitsu'];
  var GRADES = ['White', 'Yellow', 'Orange', 'Green', 'Blue', 'Purple', 'Brown', 'Red', 'Black 1st Dan', 'Black 2nd Dan', 'Black 3rd Dan'];
  var FIRST = ['Aiman', 'Hafiz', 'Nur Aisyah', 'Siti', 'Kumar', 'Priya', 'Wei Jie', 'Mei Ling', 'Arjun', 'Farah', 'Daniel', 'Hui Min', 'Irfan', 'Kavitha', 'Jun Hao', 'Amirah', 'Ravi', 'Sofia', 'Zul', 'Li Na', 'Haziq', 'Deepa', 'Kai Xuan', 'Nabila', 'Vikram', 'Alya', 'Chee Keong', 'Balqis', 'Suresh', 'Yasmin', 'Ethan', 'Hana', 'Faiz', 'Shalini', 'Zhi Hao', 'Iman'];
  var LAST = ['Rahman', 'Ismail', 'Tan', 'Lim', 'Wong', 'Abdullah', 'Rajan', 'Lee', 'Ng', 'Hassan', 'Chong', 'Nair', 'Yusof', 'Goh', 'Krishnan', 'Ong', 'Aziz', 'Teoh', 'Pillai', 'Chin'];
  var AREAS = ['Petaling Jaya', 'Subang Jaya', 'Shah Alam', 'Cheras', 'Puchong', 'Kepong', 'Ampang', 'Bangsar', 'Klang', 'Seremban', 'Ipoh', 'Bayan Lepas', 'Johor Bahru', 'Kajang', 'Setapak', 'Cyberjaya'];

  function personName() { return pick(FIRST) + ' ' + pick(LAST); }
  function phone() { return '01' + ri(0, 9) + '-' + ri(200, 999) + ' ' + ri(1000, 9999); }
  function emailOf(name, n) { return name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '') + (n ? n : '') + '@example.com'; }
  function icFor(dob) { return dob.slice(2, 4) + dob.slice(5, 7) + dob.slice(8, 10) + '-' + pad(ri(1, 16), 2) + '-' + pad(ri(1, 9999), 4); }

  function defaultPerms() {
    var ALL = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
    var MODS = window.ADMIN_MODULE_KEYS;
    function grant(map) { var p = {}; MODS.forEach(function (m) { p[m] = map[m] ? map[m].slice() : []; }); return p; }
    var full = {}; MODS.forEach(function (m) { full[m] = ALL; });
    var VCE = ['view', 'create', 'edit', 'export'];
    var club = {}; MODS.forEach(function (m) { club[m] = ALL; });
    club.clubs = ['view', 'edit']; club.roles = ['view']; club.settings = ['view']; club.audit = ['view', 'export'];
    return {
      superadmin: { name: 'Super Admin', scope: 'all', desc: 'Everything, across every club.', perms: grant(full) },
      clubadmin: { name: 'Club Admin', scope: 'club', desc: 'Only their own club.', perms: grant(club) },
      centreadmin: { name: 'Centre Admin', scope: 'centre', desc: 'Only their assigned training centre.', perms: grant({
        dashboard: ['view'], centres: ['view'], students: VCE, instructors: ['view'], classes: VCE, registrations: ['view', 'approve'],
        attendance: VCE, gradings: VCE, activities: VCE, tournaments: ['view'], rankings: ['view'],
        payments: ['view', 'create', 'export'], collections: ['view'], invoices: ['view'], outstanding: ['view', 'export'],
        products: ['view'], stock: ['view'], notifications: ['view', 'create'], reports: ['view', 'export'], approvals: ['view', 'approve']
      }) },
      instructor: { name: 'Instructor', scope: 'centre', desc: 'Assigned classes and students.', perms: grant({
        dashboard: ['view'], students: ['view'], classes: ['view'], attendance: ['view', 'create', 'edit'],
        gradings: ['view', 'edit'], activities: ['view'], tournaments: ['view'], rankings: ['view'], reports: ['view']
      }) },
      finance: { name: 'Finance', scope: 'club', desc: 'Payments, collections and financial reports.', perms: grant({
        dashboard: ['view'], students: ['view'], payments: ALL, collections: ['view', 'export'], invoices: ALL,
        refunds: ALL, payroll: ALL, outstanding: ['view', 'export'], purchases: ['view', 'approve'],
        reports: ['view', 'export'], approvals: ['view', 'approve']
      }) }
    };
  }

  function defaultSettings() {
    return {
      systemName: 'D-CLIX Admin', currency: 'RM', dateFormat: 'DD/MM/YYYY', timeZone: 'Asia/Kuala_Lumpur', language: 'English',
      grades: GRADES.slice(), membershipTypes: ['Monthly', 'Quarterly', 'Annual', 'Family'],
      paymentTypes: ['Membership Fee', 'Monthly Fee', 'Registration Fee', 'Grading Fee', 'Tournament Fee', 'Product Payment', 'Other Fee'],
      paymentMethods: ['Cash', 'FPX', 'Online Banking', 'Card', 'Bank Transfer', 'Other'],
      attendanceTypes: ['Present', 'Absent', 'Late', 'Excused'], studentStatuses: ['Active', 'Inactive', 'Suspended'],
      classTypes: ['Kids', 'Junior', 'Adult', 'Competition', 'Private'],
      taxRate: 0, invoiceFormat: 'INV-{YYYY}-{#####}', receiptFormat: 'RCP-{YYYY}-{#####}',
      gateway: 'FPX (not connected)', gatewayMode: 'Sandbox',
      notifyEmail: true, notifyWhatsApp: true, notifyPush: true,
      sessionMinutes: 30, maxFailedLogins: 5, lockMinutes: 15, require2fa: false,
      integrations: [
        { name: 'Payment gateway (FPX / cards)', on: false }, { name: 'WhatsApp Business API', on: false },
        { name: 'Email (SMTP)', on: false }, { name: 'Push notifications (FCM)', on: false },
        { name: 'Tournament scoring system', on: false }, { name: 'Fingerprint scanners', on: false }
      ],
      regLinkSlug: 'join', regFields: { ic: true, dob: true, guardian: true, documents: false, address: false }
    };
  }

  function generate() {
    seed = 20261016;
    var now = new Date(); now.setHours(0, 0, 0, 0);
    var db = { meta: { version: 1, seededAt: new Date().toISOString() }, seq: {} };
    function nextId(coll, prefix, len) { db.seq[coll] = (db.seq[coll] || 0) + 1; return prefix + pad(db.seq[coll], len || 4); }
    db.nextId = null; // set in DB API
    db.settings = defaultSettings();
    db.roles = defaultPerms();

    /* Clubs */
    var clubDefs = [
      ['ABC Taekwondo Academy', 'Taekwondo', 'Premium', 120], ['Harimau Karate Club', 'Karate', 'Standard', 100],
      ['Wira Silat Centre', 'Silat', 'Basic', 80], ['Dragon Judo Club', 'Judo', 'Standard', 110],
      ['Seri Muay Thai Gym', 'Muay Thai', 'Premium', 150], ['Elite Kickboxing', 'Kickboxing', 'Basic', 90]
    ];
    db.clubs = clubDefs.map(function (c, i) {
      var owner = personName(); var start = addMonths(now, -ri(6, 30));
      return { id: nextId('clubs', 'CLB'), name: c[0], regNo: '2023' + pad(ri(100000, 999999), 6) + '-X', owner: owner, phone: phone(),
        email: 'admin@' + c[0].toLowerCase().replace(/[^a-z]/g, '').slice(0, 14) + '.example.com', address: ri(1, 99) + ', Jalan ' + pick(LAST) + ', ' + AREAS[i],
        type: pick(['Academy', 'Association', 'Private Club']), sport: c[1], plan: c[2], subStart: iso(start), subEnd: iso(addMonths(start, 12 * Math.ceil(30 / 12))),
        status: i === 5 ? 'Suspended' : 'Active', monthlyFee: c[3], createdAt: iso(start) };
    });

    /* Centres */
    db.centres = [];
    var ai = 0;
    db.clubs.forEach(function (club, ci) {
      var n = ci === 0 || ci === 4 ? 3 : 2;
      for (var k = 0; k < n; k++) {
        var area = AREAS[ai++ % AREAS.length];
        db.centres.push({ id: nextId('centres', 'TC'), name: club.name.split(' ')[0] + ' ' + area, clubId: club.id,
          address: ri(1, 120) + ', Jalan ' + pick(['SS2', 'USJ', 'Damai', 'Mawar', 'Kenanga', 'Bunga Raya']) + '/' + ri(1, 30) + ', ' + area,
          phone: phone(), email: area.toLowerCase().replace(/\s/g, '') + '@' + club.email.split('@')[1],
          hours: pick(['Mon–Fri 4pm–10pm, Sat 9am–6pm', 'Tue–Sun 3pm–10pm', 'Daily 9am–10pm']), capacity: pick([60, 80, 100, 120]),
          status: club.status === 'Suspended' ? 'Inactive' : 'Active', createdAt: club.createdAt });
      }
    });

    /* Instructors */
    db.instructors = [];
    db.centres.forEach(function (tc) {
      var club = db.clubs.filter(function (c) { return c.id === tc.clubId; })[0];
      var n = ri(1, 2);
      for (var k = 0; k < n; k++) {
        var name = personName(); var dob = iso(new Date(ri(1970, 1998), ri(0, 11), ri(1, 28)));
        db.instructors.push({ id: nextId('instructors', 'INS'), name: name, ic: icFor(dob), phone: phone(), email: emailOf(name, db.seq.instructors),
          address: tc.address.split(', ').slice(-1)[0], clubId: tc.clubId, centreId: tc.id, sport: club.sport,
          qualification: pick(['Certified Coach Level 1', 'Certified Coach Level 2', 'National Coach', 'Diploma in Sports Science']),
          certification: pick(['WT Poom', 'WKF Kata Judge', 'First Aid + CPR', 'MSN Coaching Cert']),
          rank: pick(['Black 2nd Dan', 'Black 3rd Dan', 'Black 4th Dan', 'Black 1st Dan']),
          joinDate: iso(addMonths(now, -ri(3, 60))), employment: pick(['Full-time', 'Part-time', 'Part-time', 'Contract']),
          status: 'Active', baseSalary: pick([1800, 2200, 2600, 3200, 1200]) });
      }
    });

    /* Students */
    db.students = [];
    db.centres.forEach(function (tc) {
      var insts = db.instructors.filter(function (x) { return x.centreId === tc.id; });
      var n = ri(9, 16);
      for (var k = 0; k < n; k++) {
        var name = personName(); var age = weighted([[ri(5, 12), 5], [ri(13, 17), 3], [ri(18, 40), 2]]);
        var dob = iso(new Date(now.getFullYear() - age, ri(0, 11), ri(1, 28)));
        var join = iso(addDays(now, -ri(10, 900)));
        db.students.push({ id: nextId('students', 'ST'), name: name, ic: icFor(dob), dob: dob, gender: pick(['Male', 'Female']),
          phone: phone(), email: emailOf(name, db.seq.students), guardian: age < 18 ? personName() : '', guardianPhone: age < 18 ? phone() : '',
          clubId: tc.clubId, centreId: tc.id, instructorId: pick(insts).id, joinDate: join,
          grade: GRADES[Math.min(GRADES.length - 1, Math.floor(rnd() * Math.min(9, 1 + age / 3)))],
          membership: weighted([['Monthly', 6], ['Quarterly', 1], ['Annual', 2], ['Family', 1]]),
          status: tc.status === 'Inactive' ? 'Inactive' : weighted([['Active', 86], ['Inactive', 14]]), documents: [] });
      }
    });

    /* Classes */
    var CLASS_NAMES = [['Kids Beginner', 'Kids', '5–12', 'White'], ['Junior Intermediate', 'Junior', '10–17', 'Green'], ['Adult Mixed', 'Adult', '18+', 'White'], ['Competition Squad', 'Competition', '12+', 'Blue']];
    var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    db.classes = [];
    db.centres.forEach(function (tc) {
      var insts = db.instructors.filter(function (x) { return x.centreId === tc.id; });
      var studs = db.students.filter(function (s) { return s.centreId === tc.id && s.status === 'Active'; });
      var n = ri(2, 3);
      for (var k = 0; k < n; k++) {
        var def = CLASS_NAMES[k]; var h = pick([16, 17, 18, 19, 20]); var d1 = ri(0, 4);
        var members = studs.filter(function (_, idx) { return idx % n === k; }).map(function (s) { return s.id; });
        db.classes.push({ id: nextId('classes', 'CL'), name: def[0], type: def[1], clubId: tc.clubId, centreId: tc.id, instructorId: pick(insts).id,
          days: [DAYS[d1], DAYS[d1 + 2], k === 3 ? 'Sat' : null].filter(Boolean), date: '', start: pad(h, 2) + ':00', end: pad(h + 1, 2) + ':30',
          capacity: pick([20, 25, 30]), level: def[3], ageGroup: def[2], recurring: 'Weekly', status: 'Active', studentIds: members });
      }
    });

    /* Attendance — last 28 days */
    db.attendance = [];
    var METHODS = [['QR Code', 6], ['Manual', 3], ['Fingerprint', 2], ['Mobile Check-In', 1]];
    for (var d = 28; d >= 0; d--) {
      var day = addDays(now, -d); var dn = DAYS[(day.getDay() + 6) % 7];
      db.classes.forEach(function (cl) {
        if (cl.days.indexOf(dn) < 0) return;
        cl.studentIds.forEach(function (sid) {
          var st = weighted([['Present', 80], ['Late', 7], ['Absent', 10], ['Excused', 3]]);
          db.attendance.push({ id: nextId('attendance', 'AT', 6), date: iso(day), classId: cl.id, studentId: sid, clubId: cl.clubId, centreId: cl.centreId,
            instructorId: cl.instructorId, status: st, method: st === 'Absent' ? '' : weighted(METHODS), time: st === 'Absent' ? '' : cl.start });
        });
      });
    }

    /* Payments */
    db.payments = [];
    var year = now.getFullYear();
    function addPayment(p) {
      p.id = nextId('payments', 'PAY', 5);
      p.invoiceNo = 'INV-' + p.date.slice(0, 4) + '-' + pad(db.seq.payments, 5);
      p.receiptNo = p.status === 'Paid' || p.status === 'Partial' || p.status === 'Refunded' ? 'RCP-' + p.date.slice(0, 4) + '-' + pad(db.seq.payments, 5) : '';
      if (p.method && p.method !== 'Cash' && p.receiptNo) { p.txnId = 'TXN' + pad(ri(10000000, 99999999), 8); p.gatewayRef = 'GW-' + pad(ri(100000, 999999), 6); }
      db.payments.push(p);
    }
    db.students.forEach(function (s) {
      var club = db.clubs.filter(function (c) { return c.id === s.clubId; })[0];
      var fee = club.monthlyFee;
      for (var m = 5; m >= 0; m--) {
        var due = addMonths(new Date(now.getFullYear(), now.getMonth(), 7), -m);
        if (iso(due) < s.joinDate.slice(0, 8) + '01') continue;
        if (s.status !== 'Active' && m < 2) continue;
        var status = m >= 2 ? weighted([['Paid', 95], ['Overdue', 5]]) : m === 1 ? weighted([['Paid', 85], ['Overdue', 12], ['Partial', 3]]) : weighted([['Paid', 60], ['Unpaid', 40]]);
        var method = weighted([['Cash', 4], ['FPX', 3], ['Online Banking', 2], ['Card', 1], ['Bank Transfer', 1]]);
        var paidDate = iso(addDays(due, ri(-6, 10) > now ? 0 : ri(-6, 10)));
        if (paidDate > iso(now)) paidDate = iso(now);
        addPayment({ studentId: s.id, clubId: s.clubId, centreId: s.centreId, type: 'Monthly Fee', desc: 'Monthly fee ' + due.toLocaleString('en', { month: 'short', year: 'numeric' }),
          amount: fee, paid: status === 'Paid' ? fee : status === 'Partial' ? Math.round(fee / 2) : 0, discount: 0, tax: 0,
          method: status === 'Paid' || status === 'Partial' ? method : '', date: status === 'Paid' || status === 'Partial' ? paidDate : iso(due), dueDate: iso(due),
          status: status, collectedBy: status === 'Paid' && method === 'Cash' ? pick(db.instructors.filter(function (x) { return x.centreId === s.centreId; })).name : '' });
      }
      if (s.joinDate >= iso(addMonths(now, -6))) {
        addPayment({ studentId: s.id, clubId: s.clubId, centreId: s.centreId, type: 'Registration Fee', desc: 'New member registration', amount: 50, paid: 50, discount: 0, tax: 0,
          method: pick(['Cash', 'FPX']), date: s.joinDate, dueDate: s.joinDate, status: 'Paid', collectedBy: '' });
      }
    });

    /* Grading events + candidates */
    db.gradings = []; db.candidates = [];
    var gradeDefs = [[-45, 'Completed'], [-12, 'Completed'], [9, 'Open'], [24, 'Open'], [40, 'Draft']];
    gradeDefs.forEach(function (g, gi) {
      var club = db.clubs[gi % 5]; var tc = db.centres.filter(function (c) { return c.clubId === club.id; })[0];
      var date = iso(addDays(now, g[0]));
      var pool = db.students.filter(function (s) { return s.clubId === club.id && s.status === 'Active' && GRADES.indexOf(s.grade) < GRADES.length - 1; });
      var cur = pool.length ? pick(pool).grade : GRADES[0];
      var ex = db.instructors.filter(function (x) { return x.clubId === club.id; })[0];
      var grading = { id: nextId('gradings', 'GR'), name: club.sport + ' Grading ' + (gi < 2 ? 'Q' + (Math.floor(now.getMonth() / 3) + 1) : 'Upcoming #' + (gi - 1)),
        clubId: club.id, centreId: tc.id, sport: club.sport, currentGrade: cur, nextGrade: GRADES[GRADES.indexOf(cur) + 1], date: date, time: '09:00',
        examiner: ex ? ex.name : '', fee: pick([60, 80, 100]), deadline: iso(addDays(now, g[0] - 7)), status: g[1] };
      db.gradings.push(grading);
      var taken = db.candidates.map(function (c) { return c.studentId; });
      pool.filter(function (s) { return s.grade === cur && taken.indexOf(s.id) < 0; }).slice(0, ri(5, 9)).forEach(function (s) {
        var done = g[1] === 'Completed'; var res = done ? weighted([['Pass', 8], ['Fail', 1], ['Absent', 1]]) : 'Pending';
        db.candidates.push({ id: nextId('candidates', 'GC', 5), gradingId: grading.id, studentId: s.id, clubId: s.clubId, centreId: s.centreId,
          fromGrade: s.grade, paid: done || rnd() > 0.4, result: res, score: done && res !== 'Absent' ? ri(55, 96) : '', gradeAwarded: res === 'Pass' ? grading.nextGrade : '',
          remarks: res === 'Pass' ? pick(['Strong technique', 'Good stances', 'Improve kicks']) : res === 'Fail' ? 'Repeat sparring section' : '' });
        if (res === 'Pass') s.grade = grading.nextGrade; // already promoted by the completed grading
      });
    });

    /* Tournaments + participants */
    db.tournaments = []; db.participants = [];
    [[-60, 'Selangor Open Championship', 'Shah Alam'], [-20, 'KL Junior Cup', 'Kuala Lumpur'], [18, 'National Youth Games', 'Bukit Jalil'], [55, 'ASEAN Club Invitational', 'Penang']].forEach(function (t, ti) {
      var date = iso(addDays(now, t[0]));
      var tour = { id: nextId('tournaments', 'TR'), name: t[1], location: t[2], date: date, organizer: pick(['Malaysia Martial Arts Federation', 'Selangor Sports Council', 'D-CLIX Arena']),
        deadline: iso(addDays(now, t[0] - 14)), sport: pick(SPORTS.slice(0, 5)), categories: 'Kyorugi, Poomsae, Kata, Kumite', ageCategory: 'Cadet, Junior, Senior',
        weightCategory: '-45kg, -55kg, -63kg, -73kg, +73kg', genderCategory: 'Male, Female', status: t[0] < 0 ? 'Completed' : 'Registration Open', clubId: '' };
      db.tournaments.push(tour);
      db.students.filter(function () { return rnd() < 0.14; }).filter(function (s) { return s.status === 'Active'; }).forEach(function (s) {
        var done = t[0] < 0; var medal = done ? weighted([['Gold', 1], ['Silver', 1.5], ['Bronze', 2.5], ['None', 5]]) : '';
        var w = ri(0, 3), l = done ? ri(0, 2) : 0;
        db.participants.push({ id: nextId('participants', 'TP', 5), tournamentId: tour.id, studentId: s.id, clubId: s.clubId, centreId: s.centreId,
          category: pick(['Kyorugi', 'Poomsae', 'Kata', 'Kumite']), ageCategory: pick(['Cadet', 'Junior', 'Senior']), weight: pick(['-45kg', '-55kg', '-63kg', '-73kg']),
          gender: s.gender, wins: done ? w : 0, losses: l, medal: medal, points: done ? (medal === 'Gold' ? 100 : medal === 'Silver' ? 60 : medal === 'Bronze' ? 35 : 10) + w * 5 : 0,
          status: done ? 'Completed' : 'Registered' });
      });
    });

    /* Registrations (applications) */
    db.registrations = [];
    for (var r = 0; r < 12; r++) {
      var tc = pick(db.centres); var nm = personName(); var dob = iso(new Date(now.getFullYear() - ri(6, 30), ri(0, 11), ri(1, 28)));
      var stt = r < 6 ? 'Pending' : r < 10 ? 'Approved' : 'Rejected';
      db.registrations.push({ id: nextId('registrations', 'REG'), type: r === 3 || r === 8 ? 'Instructor' : 'Student', name: nm, ic: icFor(dob), dob: dob,
        gender: pick(['Male', 'Female']), phone: phone(), email: emailOf(nm, 900 + r), guardian: '', clubId: tc.clubId, centreId: tc.id,
        fee: 50, feePaid: rnd() > 0.3, documents: rnd() > 0.5 ? 'IC copy.pdf' : '', submitted: iso(addDays(now, -ri(0, 20))), status: stt,
        reason: stt === 'Rejected' ? 'Incomplete documents' : '', source: pick(['Registration link', 'QR code', 'Walk-in']) });
    }

    /* Refunds / reimbursements */
    db.refunds = [];
    var paidPays = db.payments.filter(function (p) { return p.status === 'Paid'; });
    ['Requested', 'Pending Approval', 'Pending Approval', 'Approved', 'Paid', 'Completed', 'Rejected', 'Pending Approval'].forEach(function (st, i) {
      var p = pick(paidPays); var kind = i % 3 === 2 ? 'Reimbursement' : 'Refund';
      db.refunds.push({ id: nextId('refunds', 'RF'), kind: kind, studentId: kind === 'Refund' ? p.studentId : '', paymentId: kind === 'Refund' ? p.id : '',
        clubId: p.clubId, centreId: p.centreId, amount: kind === 'Refund' ? p.amount : ri(30, 250),
        reason: kind === 'Refund' ? pick(['Double payment', 'Class cancelled', 'Withdrew before start']) : pick(['Tournament transport', 'First-aid supplies', 'Venue booking']),
        document: rnd() > 0.5 ? 'receipt.jpg' : '', requested: iso(addDays(now, -ri(1, 30))), requestedBy: personName(), status: st,
        approvedBy: ['Approved', 'Paid', 'Completed'].indexOf(st) >= 0 ? 'Super Admin' : '', payStatus: ['Paid', 'Completed'].indexOf(st) >= 0 ? 'Paid' : 'Unpaid' });
    });

    /* Student transfers */
    db.transfers = [];
    db.students.slice(0, 3).forEach(function (s, i) {
      var to = db.centres.filter(function (c) { return c.clubId === s.clubId && c.id !== s.centreId; })[0];
      if (!to) return;
      db.transfers.push({ id: nextId('transfers', 'TF'), studentId: s.id, clubId: s.clubId, centreId: s.centreId, fromCentreId: s.centreId, toCentreId: to.id,
        reason: pick(['Moved house', 'Closer to school', 'Schedule clash']), requested: iso(addDays(now, -i - 1)), status: 'Pending' });
    });

    /* Inventory */
    db.products = [];
    [['Uniform (Dobok) – Kids', 'Uniform', 85, 48], ['Uniform (Dobok) – Adult', 'Uniform', 120, 70], ['Belt – Coloured', 'Belt', 15, 6], ['Belt – Black (embroidered)', 'Belt', 65, 30],
     ['Sparring Gloves', 'Gloves', 75, 40], ['Boxing Gloves 12oz', 'Gloves', 140, 80], ['Head Guard', 'Protective Gear', 95, 50], ['Shin Guard', 'Protective Gear', 60, 28],
     ['Mouth Guard', 'Protective Gear', 18, 6], ['Club T-Shirt', 'Club Merchandise', 45, 18], ['Club Hoodie', 'Club Merchandise', 110, 55], ['Kit Bag', 'Club Merchandise', 90, 42]
    ].forEach(function (p, i) {
      db.products.push({ id: nextId('products', 'PRD'), name: p[0], category: p[1], sku: p[1].slice(0, 3).toUpperCase() + '-' + pad(i + 1, 3), price: p[2], cost: p[3],
        stock: i === 2 || i === 8 ? ri(2, 6) : ri(12, 80), minStock: 10, supplier: pick(['Adidas MY Distributor', 'Mooto Malaysia', 'Local Print Shop', 'Everlast SEA']),
        status: 'Active', clubId: '' });
    });
    db.stockMoves = [];
    for (var sm = 0; sm < 20; sm++) {
      var prd = pick(db.products); var ty = weighted([['Stock In', 3], ['Stock Out', 5], ['Adjustment', 1], ['Transfer', 1]]);
      db.stockMoves.push({ id: nextId('stockMoves', 'SM', 5), productId: prd.id, type: ty, qty: ty === 'Stock In' ? ri(10, 40) : ri(1, 6), date: iso(addDays(now, -ri(0, 40))),
        fromCentreId: ty === 'Transfer' ? db.centres[0].id : '', toCentreId: ty === 'Transfer' ? db.centres[1].id : '', note: ty === 'Stock Out' ? 'Sold to student' : ty === 'Adjustment' ? 'Stock count correction' : '', by: 'Super Admin' });
    }
    db.purchases = [];
    ['Pending', 'Pending', 'Approved', 'Rejected', 'Approved'].forEach(function (st, i) {
      var prd = db.products[i * 2];
      db.purchases.push({ id: nextId('purchases', 'PR'), productId: prd.id, qty: ri(20, 60), unitCost: prd.cost, supplier: prd.supplier, requestedBy: personName(),
        requested: iso(addDays(now, -ri(1, 25))), status: st, clubId: '', note: st === 'Rejected' ? 'Over budget this month' : '' });
    });
    db.deliveries = [];
    db.purchases.filter(function (p) { return p.status === 'Approved'; }).forEach(function (p, i) {
      db.deliveries.push({ id: nextId('deliveries', 'DL'), purchaseId: p.id, productId: p.productId, qty: p.qty, courier: pick(['J&T Express', 'Pos Laju', 'Ninja Van']),
        tracking: 'MY' + pad(ri(10000000, 99999999), 8), eta: iso(addDays(now, ri(-2, 6))), status: i === 0 ? 'Delivered' : 'In Transit', toCentreId: db.centres[i].id });
    });

    /* Payroll — previous month */
    db.payroll = [];
    var pm = addMonths(new Date(now.getFullYear(), now.getMonth(), 1), -1);
    var pmKey = iso(pm).slice(0, 7);
    db.instructors.forEach(function (ins) {
      var classes = db.classes.filter(function (c) { return c.instructorId === ins.id; }).length;
      var allowance = 150, commission = classes * 120, bonus = pick([0, 0, 100, 200]), deduction = Math.round(ins.baseSalary * 0.11);
      db.payroll.push({ id: nextId('payroll', 'PY', 5), instructorId: ins.id, clubId: ins.clubId, centreId: ins.centreId, month: pmKey, salary: ins.baseSalary,
        allowance: allowance, commission: commission, bonus: bonus, deduction: deduction, sessions: classes * 8,
        net: ins.baseSalary + allowance + commission + bonus - deduction, status: 'Paid', paidOn: iso(addDays(pm, 34)) });
    });

    /* Activities */
    db.activities = [];
    [['Black Belt Seminar', 'Seminar', 12], ['Year-end Training Camp', 'Training Camp', 35], ['Referee Workshop', 'Workshop', -8], ['Mall Demonstration', 'Demonstration', 4], ['Family Day', 'Club Event', 27], ['Self-defence Workshop', 'Workshop', -30]].forEach(function (a, i) {
      var club = db.clubs[i % db.clubs.length];
      db.activities.push({ id: nextId('activities', 'ACT'), name: a[0], type: a[1], description: a[1] + ' organised by ' + club.name + '.', date: iso(addDays(now, a[2])), time: '10:00',
        location: pick(AREAS), organizer: club.name, clubId: club.id, centreId: '', capacity: pick([30, 50, 80]), registered: ri(8, 30), fee: pick([0, 30, 50, 150]),
        status: a[2] < 0 ? 'Completed' : 'Open' });
    });

    /* Notifications */
    db.notifications = [];
    [['Monthly fee reminder', 'Your monthly fee is due on the 7th.', 'WhatsApp', 'All Students'], ['Grading registration open', 'Register for the upcoming grading before the deadline.', 'Push', 'Specific Grade'],
     ['Class cancelled', 'Tonight\'s class is cancelled due to venue maintenance.', 'Push', 'Specific Class'], ['Tournament selection', 'Selected players please confirm by Friday.', 'Email', 'Selected Students'],
     ['Public holiday schedule', 'Centres closed on the public holiday.', 'Announcement', 'All Students'], ['Instructor meeting', 'Monthly instructor meeting this Saturday 9am.', 'Email', 'Instructors']
    ].forEach(function (n, i) {
      var sent = i < 5; var total = n[3] === 'Instructors' ? db.instructors.length : ri(20, 140);
      db.notifications.push({ id: nextId('notifications', 'NT'), title: n[0], message: n[1], channel: n[2], recipients: n[3], target: '', attachment: '',
        clubId: '', schedule: sent ? iso(addDays(now, -i * 3)) + 'T09:00' : iso(addDays(now, 2)) + 'T09:00', status: sent ? 'Sent' : 'Scheduled',
        total: total, delivered: sent ? total - ri(0, 4) : 0, read: sent ? Math.round(total * (0.4 + rnd() * 0.5)) : 0, by: 'Super Admin' });
    });

    /* System users */
    db.users = [];
    function addUser(name, email, role, clubId, centreId) {
      var salt = newSalt();
      db.users.push({ id: nextId('users', 'USR'), name: name, email: email, phone: phone(), role: role, clubId: clubId || '', centreId: centreId || '',
        status: 'Active', lastLogin: '', salt: salt, pwHash: hashPassword(DEMO_PASSWORD, salt), twoFactor: false, createdAt: iso(now) });
    }
    addUser('Demo Super Admin', 'superadmin@demo.dclix', 'superadmin');
    addUser('Demo Club Admin', 'clubadmin@demo.dclix', 'clubadmin', db.clubs[0].id);
    addUser('Demo Centre Admin', 'centreadmin@demo.dclix', 'centreadmin', db.clubs[0].id, db.centres[0].id);
    addUser('Demo Instructor', 'instructor@demo.dclix', 'instructor', db.clubs[0].id, db.centres[0].id);
    addUser('Demo Finance', 'finance@demo.dclix', 'finance', db.clubs[0].id);
    addUser(db.clubs[1].owner, 'owner@harimau.example.com', 'clubadmin', db.clubs[1].id);

    db.audit = []; db.logins = [];
    return db;
  }

  /* ---------- Public API ---------- */
  var DB = {
    DEMO_PASSWORD: DEMO_PASSWORD,
    data: null,
    hashPassword: hashPassword,
    newSalt: newSalt,
    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) {}
      if (raw) { try { DB.data = JSON.parse(raw); } catch (e) { DB.data = null; } }
      if (!DB.data || !DB.data.meta) { DB.data = generate(); DB.save(); }
      // fill gaps if the module list grew since data was saved
      var fresh = defaultPerms();
      Object.keys(DB.data.roles).forEach(function (r) {
        window.ADMIN_MODULE_KEYS.forEach(function (m) { if (!DB.data.roles[r].perms[m]) DB.data.roles[r].perms[m] = fresh[r] ? fresh[r].perms[m] : []; });
      });
      return DB.data;
    },
    save: function () {
      try { localStorage.setItem(KEY, JSON.stringify(DB.data)); return true; }
      catch (e) { if (window.ADMIN && ADMIN.toast) ADMIN.toast('Could not save: browser storage is full or blocked.', 'error'); return false; }
    },
    reset: function () { DB.data = generate(); DB.save(); },
    exportJSON: function () { return JSON.stringify(DB.data, null, 1); },
    importJSON: function (text) {
      var d = JSON.parse(text);
      if (!d || !d.meta || !Array.isArray(d.students) || !Array.isArray(d.users)) throw new Error('This file is not a D-Clix admin backup.');
      DB.data = d; DB.save();
    },
    nextId: function (coll, prefix, len) {
      var d = DB.data; d.seq[coll] = (d.seq[coll] || (d[coll] ? d[coll].length : 0)) + 1;
      var id = prefix + pad(d.seq[coll], len || 4);
      while ((d[coll] || []).some(function (r) { return r.id === id; })) { d.seq[coll]++; id = prefix + pad(d.seq[coll], len || 4); }
      return id;
    },
    iso: iso, addDays: addDays, addMonths: addMonths, pad: pad, SPORTS: SPORTS
  };

  /* Module keys used by roles/permissions (kept here so seeding and the UI agree). */
  window.ADMIN_MODULE_KEYS = ['dashboard', 'clubs', 'centres', 'students', 'instructors', 'classes', 'registrations', 'attendance', 'gradings', 'activities',
    'tournaments', 'rankings', 'payments', 'collections', 'invoices', 'refunds', 'payroll', 'outstanding', 'products', 'stock', 'purchases', 'deliveries',
    'notifications', 'reports', 'users', 'roles', 'approvals', 'audit', 'settings'];

  window.ADMIN_DB = DB;
})();
