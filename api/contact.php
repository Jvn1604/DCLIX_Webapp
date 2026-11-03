<?php
/* contact form -> portal enquiry (Website CMS > Enquiries) */
declare(strict_types=1);
require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/portal.php';
cors();
require_method('POST');
throttle('contact:' . client_ip(), 10, 3600);

$in = body();
$f = ['name' => str_in($in, 'name', 150), 'phone' => str_in($in, 'phone', 40), 'email' => strtolower(str_in($in, 'email', 150)),
      'club' => str_in($in, 'club', 200), 'inquiries' => str_in($in, 'inquiries', 2000)];
if (str_in($in, 'website', 100) !== '') json_out(['ok' => true]); // honeypot

$errors = [];
if ($f['name'] === '') $errors['name'] = 'Please enter your name.';
if (!preg_match('/^\+?[0-9 \-]{7,20}$/', $f['phone'])) $errors['phone'] = 'Please enter a valid phone number.';
if (!valid_email($f['email'])) $errors['email'] = 'Please enter a valid email address.';
if ($f['club'] === '') $errors['club'] = 'Please enter your club name.';
if ($f['inquiries'] === '') $errors['inquiries'] = 'Please tell us how we can help.';
if ($errors) fail('Please fix the highlighted fields.', 422, ['fields' => $errors]);

try {
    portal()->sendEnquiry([
        'fullName' => $f['name'], 'email' => $f['email'], 'phone' => preg_replace('/[ \-]/', '', $f['phone']),
        'clubName' => $f['club'], 'message' => $f['inquiries'], 'source' => 'contact-page', 'visitorIp' => client_ip(),
    ]);
} catch (DclixApiException $e) {
    portal_fail($e, ['fullName' => 'name', 'clubName' => 'club', 'message' => 'inquiries']);
}
json_out(['ok' => true]);
