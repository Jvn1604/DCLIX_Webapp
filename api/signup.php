<?php
/* signup (club-register.html) -> portal registration
 * returns {ref, state, url?}. the site shows step 3 (approval) and keeps url for the pay button
 * then emails + whatsapps the client and the company (lib/notify.php)
 */
declare(strict_types=1);
require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/portal.php';
require __DIR__ . '/lib/notify.php';
cors();
require_method('POST');
throttle('signup:' . client_ip(), 10, 3600);

// our plan keys -> portal plan codes
const PLAN_CODES = ['basic' => 'BASIC', 'standard' => 'ADVANCE', 'premium' => 'PREMIUM'];
// monthly prices on the site, for the emails
const PLAN_NAMES = ['basic' => ['Basic', 100], 'standard' => ['Standard', 150], 'premium' => ['Premium', 200]];

$in = body();
$f = [
    'plan' => str_in($in, 'plan', 20), 'sport' => str_in($in, 'sport', 40),
    'clubName' => str_in($in, 'clubName', 150), 'clubCode' => strtoupper(str_in($in, 'clubCode', 30)),
    'headInstructor' => str_in($in, 'headInstructor', 100), 'email' => strtolower(str_in($in, 'email', 60)),
    'phoneCode' => str_in($in, 'phoneCode', 30), 'whatsapp' => str_in($in, 'whatsapp', 30), 'promoCode' => strtoupper(str_in($in, 'promoCode', 40)),
];
$password = is_string($in['password'] ?? null) ? $in['password'] : '';
$terms = ($in['acceptedTerms'] ?? false) === true;
// same key on a retry = same order
$key = str_in($in, 'requestKey', 80);
if (!preg_match('/^[A-Za-z0-9_-]{8,80}$/', $key)) $key = bin2hex(random_bytes(16));

$code = preg_match('/\+\d{1,4}/', $f['phoneCode'], $m) ? $m[0] : '+60';
$phone = ltrim(preg_replace('/\D/', '', $f['whatsapp']), '0');

$errors = [];
if (!isset(PLAN_CODES[$f['plan']])) $errors['plan'] = 'Please choose a plan.';
if ($f['sport'] === '') $errors['sport'] = 'Please choose your club type.';
// portal has no yearly prices yet, so dont charge a yearly pick as monthly
if (str_in($in, 'billing', 10) === 'yearly') $errors['plan'] = 'Yearly plans open soon. Please choose the monthly option for now.';
if (mb_strlen($f['clubName']) < 3) $errors['clubName'] = 'Club name needs at least 3 characters.';
if (!preg_match('/^[A-Za-z0-9._-]{3,30}$/', $f['clubCode'])) $errors['clubCode'] = 'Use 3–30 letters, numbers, . _ or - (no spaces).';
if (mb_strlen($f['headInstructor']) < 2) $errors['headInstructor'] = 'Please enter the head instructor\'s name.';
if (!valid_email($f['email']) || strlen($f['email']) > 50) $errors['email'] = 'Please enter a valid email address (up to 50 characters).';
if (strlen($phone) < 6 || strlen($phone) > 15) $errors['whatsapp'] = 'Please enter a valid phone number.';
if (strlen($password) < 8 || strlen($password) > 50 || !preg_match('/[A-Z]/', $password) || !preg_match('/[a-z]/', $password) || !preg_match('/\d/', $password))
    $errors['password'] = 'Use 8–50 characters with upper-case, lower-case and a number.';
if (!$terms) $errors['terms'] = 'Please accept the terms to continue.';
if ($errors) fail('Please fix the highlighted fields.', 422, ['fields' => $errors]);

$sportId = portal_sport_id($f['sport']);
if (!$sportId) fail('Please choose your club type.', 422, ['fields' => ['sport' => 'This club type is not available yet.']]);

// portal field -> our field, for error messages
$map = ['planCode' => 'plan', 'sportId' => 'sport', 'phone' => 'whatsapp', 'phoneCountryCode' => 'whatsapp', 'acceptedTerms' => 'terms'];
try {
    $res = portal()->register([
        'planCode' => PLAN_CODES[$f['plan']], 'sportId' => $sportId, 'clubName' => $f['clubName'], 'clubCode' => $f['clubCode'],
        'headInstructor' => $f['headInstructor'], 'email' => $f['email'], 'phoneCountryCode' => $code, 'phone' => $phone,
        'password' => $password, 'promoCode' => $f['promoCode'], 'acceptedTerms' => true, 'visitorIp' => client_ip(),
    ], $key);
} catch (DclixApiException $e) {
    // unpaid order already open for this club -> send them back to its payment page
    if ($e->errorCode === 'registration_in_progress' && !empty($e->data['payment']['url']))
        json_out(['ok' => true, 'url' => $e->data['payment']['url'], 'ref' => $e->data['reference'] ?? '', 'resumed' => true]);
    portal_fail($e, $map);
}

$out = ['ok' => true, 'ref' => $res['reference'] ?? '', 'state' => $res['state'] ?? ''];
if (!empty($res['payment']['url'])) $out['url'] = $res['payment']['url'];
// new registration: email + whatsapp the client and the company, after the reply
json_out_then($out, fn() => notify_signup([
    'ref' => $out['ref'], 'clubName' => $f['clubName'], 'clubCode' => $f['clubCode'], 'headInstructor' => $f['headInstructor'],
    'email' => $f['email'], 'phone' => ltrim($code, '+') . $phone, 'sport' => str_in($in, 'sportName', 60) ?: $f['sport'],
    'plan' => PLAN_NAMES[$f['plan']][0] . ' (monthly)', 'amount' => PLAN_NAMES[$f['plan']][1], 'promoCode' => $f['promoCode'],
]));
