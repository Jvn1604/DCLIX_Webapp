<?php
/*
 * Step 2 of the website signup (payment.html).
 *   POST {action: "load", token}                         → club + plan details to pre-fill the page
 *   POST {action: "pay", token, plan, billing, billing…} → creates the invoice + Billplz bill, returns {url}
 */
require __DIR__ . '/lib/init.php';
require_method('POST');
throttle('checkout:' . client_ip(), billplz_mode() === 'mock' ? 600 : 30, 3600);

$in = body();
$token = str_in($in, 'token', 200);
$row = $token !== '' ? q('SELECT * FROM signup_tokens WHERE token_hash = ?', [hash('sha256', $token)])->fetch() : false;
if (!$row || strtotime($row['expires_at']) < time()) fail('This payment link has expired. Please register again or contact D-Clix.', 410, ['reason' => 'token']);
$lead = rec_get('leads', $row['lead_id']);
if (!$lead) fail('Registration not found. Please register again.', 404, ['reason' => 'token']);
if ($lead['status'] === 'Paid') fail('This registration is already paid. You can log in now.', 409, ['reason' => 'paid']);

$action = $in['action'] ?? 'load';

if ($action === 'load') {
    json_out(['lead' => [
        'clubName' => $lead['clubName'], 'clubCode' => $lead['clubCode'], 'email' => $lead['email'], 'phone' => $lead['phone'],
        'contactName' => $lead['contactName'] ?? '', 'address' => $lead['address'] ?? '', 'country' => $lead['country'] ?? '',
        'plan' => $lead['plan'], 'billing' => $lead['billing'], 'billingInfo' => $lead['billingInfo'] ?? null, 'status' => $lead['status'],
    ], 'plans' => plans()]);
}

if ($action !== 'pay') fail('Unknown action.', 404);

$quote = plan_quote(str_in($in, 'plan', 20), str_in($in, 'billing', 10));
if (!$quote) fail('Please choose a plan.', 422, ['fields' => ['plan' => 'Please choose a plan.']]);
$b = is_array($in['billingInfo'] ?? null) ? $in['billingInfo'] : [];
$info = [
    'company' => str_in($b, 'company', 120), 'firstName' => str_in($b, 'firstName', 60), 'lastName' => str_in($b, 'lastName', 60),
    'address' => str_in($b, 'address', 255), 'zip' => str_in($b, 'zip', 20), 'city' => str_in($b, 'city', 80),
    'country' => str_in($b, 'country', 60), 'email' => strtolower(str_in($b, 'email', 190)), 'phone' => str_in($b, 'phone', 30),
];
$errors = [];
foreach (['firstName' => 'First name', 'lastName' => 'Last name', 'address' => 'Address', 'zip' => 'Zip', 'city' => 'City'] as $k => $label) if ($info[$k] === '') $errors[$k] = $label . ' is required.';
if (!valid_email($info['email'])) $errors['email'] = 'Please enter a valid email address.';
if ($info['phone'] !== '' && !preg_match('/^\+?[0-9 \-]{7,20}$/', $info['phone'])) $errors['phone'] = 'Please enter a valid phone number.';
if (empty($in['agreeTerms'])) $errors['agreeTerms'] = 'Please read and agree to the Terms & Conditions, No Refund Policy and Privacy Policy to continue.';
if ($errors) fail('Please fix the highlighted fields.', 422, ['fields' => $errors]);

$pdo = db();
$pdo->beginTransaction();
try {
    $lead = array_merge($lead, ['plan' => $quote['plan']['id'], 'planName' => $quote['plan']['name'], 'billing' => $quote['billing'], 'amount' => $quote['total'], 'billingInfo' => $info, 'status' => 'Payment Pending', 'termsAcceptedAt' => date('c'), 'termsAcceptedIp' => client_ip()]);
    rec_put('leads', $lead, 'website');
    $club = rec_get('clubs', $lead['clubId']);
    if ($club && $club['status'] !== 'Active') { $club['plan'] = explode(' ', $quote['plan']['name'])[0]; $club['billing'] = $quote['billing']; rec_put('clubs', $club, 'website'); }

    // Re-use the open invoice for this signup if there is one, so retries do not pile up invoices.
    $open = q("SELECT data FROM records WHERE coll = 'subscriptions' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.leadId')) = ? ORDER BY created_at DESC LIMIT 1", [$lead['id']])->fetchColumn();
    $sub = $open ? json_decode($open, true) : null;
    if (!$sub || $sub['status'] === 'Paid') {
        $id = next_id('subscriptions', 'SUB');
        $sub = ['id' => $id, 'invoiceNo' => doc_no('DCX', $id), 'createdAt' => date('c'), 'leadId' => $lead['id'], 'clubId' => $lead['clubId'], 'receiptNo' => '', 'kind' => 'New signup'];
    }
    $sub = array_merge($sub, ['plan' => $quote['plan']['id'], 'planName' => $quote['plan']['name'], 'billing' => $quote['billing'], 'price' => $quote['price'], 'fee' => $quote['fee'], 'total' => $quote['total'], 'status' => 'Pending', 'billTo' => $info]);
    rec_put('subscriptions', $sub, 'website');
    $pdo->commit();
} catch (Throwable $e) { $pdo->rollBack(); throw $e; }

try {
    $bill = create_bill($sub, $lead);
} catch (Throwable $e) {
    log_line('billplz', 'Create bill failed for ' . $sub['id'] . ': ' . $e->getMessage());
    fail('We could not reach the payment gateway. Please try again in a moment.', 502, cfg('debug') ? ['detail' => $e->getMessage()] : []);
}
$sub['billId'] = $bill['id'];
$sub['billUrl'] = $bill['url'];
rec_put('subscriptions', $sub, 'website');
json_out(['ok' => true, 'url' => $bill['url'], 'invoiceNo' => $sub['invoiceNo']]);
