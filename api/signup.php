<?php
/*
 * Step 1 of the website signup (club-register.html).
 * Saves the club, a Club Admin login and a sales lead, all "Pending Payment",
 * then returns a token that the payment page uses for step 2.
 */
require __DIR__ . '/lib/init.php';
require_method('POST');
throttle('signup:' . client_ip(), billplz_mode() === 'mock' && !empty(body()['simulated']) ? 300 : 10, 3600);

$in = body();
$f = [
    'plan' => str_in($in, 'plan', 20), 'billing' => str_in($in, 'billing', 10),
    'clubCode' => strtoupper(str_in($in, 'clubCode', 30)), 'clubName' => str_in($in, 'clubName', 120),
    'headInstructor' => str_in($in, 'headInstructor', 120), 'sport' => str_in($in, 'sport', 40), 'sportName' => str_in($in, 'sportName', 60),
    'address1' => str_in($in, 'address1', 255), 'address2' => str_in($in, 'address2', 255), 'state' => str_in($in, 'state', 60),
    'country' => str_in($in, 'country', 60), 'phoneCode' => str_in($in, 'phoneCode', 30), 'whatsapp' => str_in($in, 'whatsapp', 30),
    'email' => strtolower(str_in($in, 'email', 190)),
];
$password = is_string($in['password'] ?? null) ? $in['password'] : '';
// A request with simulated=true marks its records so they can be told apart and removed (test payment mode only)
$isTest = !empty($in['simulated']) && billplz_mode() === 'mock';

$errors = [];
if ($f['clubName'] === '') $errors['clubName'] = 'Club name is required.';
if ($f['clubCode'] === '') $errors['clubCode'] = 'Club code is required.';
elseif (!preg_match('/^[A-Z0-9][A-Z0-9_-]{1,29}$/', $f['clubCode'])) $errors['clubCode'] = 'Use 2–30 letters, numbers, - or _ (no spaces).';
if (!valid_email($f['email'])) $errors['email'] = 'Please enter a valid email address.';
if ($p = password_problem($password)) $errors['password'] = $p;
if ($f['whatsapp'] !== '' && !preg_match('/^[0-9 \-]{6,15}$/', $f['whatsapp'])) $errors['whatsapp'] = 'Enter the WhatsApp number using digits only, e.g. 123456789.';
if (!preg_match('/^[a-z0-9-]{2,40}$/', $f['sport'])) $errors['sport'] = 'Please choose your club type.';
$plan = plan_by_id($f['plan']) ?: plan_by_id('basic');
$billing = $f['billing'] === 'yearly' ? 'yearly' : 'monthly';
$quote = plan_quote($plan['id'], $billing);

$existing = valid_email($f['email']) ? user_by_email($f['email']) : null;
$resume = null;
if ($existing) {
    // Someone who registered before but never paid can continue with the same email + password.
    $lead = q("SELECT data FROM records WHERE coll = 'leads' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) = ? ORDER BY created_at DESC LIMIT 1", [$existing['id']])->fetchColumn();
    if ($existing['status'] === 'Pending Payment' && $lead && password_verify($password, $existing['pw_hash'])) $resume = json_decode($lead, true);
    else $errors['email'] = 'An account with this email already exists. Please log in, or use a different email.';
}
if (!isset($errors['clubCode'])) {
    $dup = q("SELECT id FROM records WHERE coll = 'clubs' AND UPPER(JSON_UNQUOTE(JSON_EXTRACT(data, '$.clubCode'))) = ? AND id <> ?", [$f['clubCode'], $resume['clubId'] ?? ''])->fetchColumn();
    if ($dup) $errors['clubCode'] = 'This club code is already taken. Please choose another.';
}
if ($errors) fail('Please fix the highlighted fields.', 422, ['fields' => $errors]);

$sportName = $f['sportName'] !== '' ? $f['sportName'] : ucwords(str_replace('-', ' ', $f['sport']));
// Country code + WhatsApp number; empty when no number was given (a bare "+60" is not a phone number)
$phone = $f['whatsapp'] === '' ? '' : trim(preg_replace('/\s*\(.*\)$/', '', $f['phoneCode']) . ' ' . $f['whatsapp']);
$address = trim($f['address1'] . ($f['address2'] !== '' ? ', ' . $f['address2'] : ''));

$pdo = db();
$pdo->beginTransaction();
try {
    $clubId = $resume['clubId'] ?? next_id('clubs', 'CLB');
    $club = rec_get('clubs', $clubId) ?: ['id' => $clubId, 'createdAt' => today(), 'regNo' => '', 'type' => 'Private Club', 'monthlyFee' => 100, 'subStart' => '', 'subEnd' => '', 'source' => $isTest ? 'Simulated test' : 'Website signup'];
    $club = array_merge($club, ['name' => $f['clubName'], 'clubCode' => $f['clubCode'], 'owner' => $f['headInstructor'], 'phone' => $phone, 'email' => $f['email'],
        'address' => $address, 'state' => $f['state'], 'country' => $f['country'], 'sport' => $sportName, 'plan' => explode(' ', $plan['name'])[0], 'billing' => $billing, 'status' => 'Pending Payment']);
    rec_put('clubs', $club, 'website');

    if ($existing) {
        $userId = $existing['id'];
        q('UPDATE users SET name = ?, phone = ? WHERE id = ?', [$f['headInstructor'] ?: $f['clubName'] . ' Admin', $phone, $userId]);
    } else {
        $userId = next_id('users', 'USR');
        q("INSERT INTO users (id, email, name, phone, role, club_id, centre_id, status, pw_hash, created_at) VALUES (?, ?, ?, ?, 'clubadmin', ?, '', 'Pending Payment', ?, ?)",
            [$userId, $f['email'], $f['headInstructor'] ?: $f['clubName'] . ' Admin', $phone, $clubId, password_hash($password, PASSWORD_DEFAULT), now()]);
    }

    $leadId = $resume['id'] ?? next_id('leads', 'LD');
    $lead = array_merge($resume ?? ['id' => $leadId, 'createdAt' => date('c'), 'source' => $isTest ? 'Simulated test' : 'Website', 'notes' => '', 'followUp' => '', 'assignedTo' => ''], [
        'status' => 'Payment Pending', 'clubName' => $f['clubName'], 'clubCode' => $f['clubCode'], 'contactName' => $f['headInstructor'], 'email' => $f['email'],
        'phone' => $phone, 'sport' => $sportName, 'address' => $address, 'state' => $f['state'], 'country' => $f['country'],
        'plan' => $plan['id'], 'planName' => $plan['name'], 'billing' => $billing, 'amount' => $quote['total'], 'clubId' => $clubId, 'userId' => $userId, 'ip' => client_ip(),
    ]);
    rec_put('leads', $lead, 'website');
    $token = random_token();
    q('INSERT INTO signup_tokens (token_hash, lead_id, created_at, expires_at) VALUES (?, ?, ?, ?)', [hash('sha256', $token), $leadId, now(), date('Y-m-d H:i:s', time() + 7 * 86400)]);
    audit(null, $resume ? 'Update' : 'Create', 'leads', $leadId, ($resume ? 'Signup resumed: ' : 'Website signup: ') . $f['clubName'] . ' (' . $f['email'] . ')');
    $pdo->commit();
} catch (Throwable $e) { $pdo->rollBack(); throw $e; }

if (!$resume) signup_emails($lead, resume_link($leadId));
json_out(['ok' => true, 'token' => $token, 'leadId' => $leadId, 'resumed' => (bool) $resume]);
