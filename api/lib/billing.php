<?php
/* D-Clix API — plans, Billplz, and what happens automatically after a payment. */
declare(strict_types=1);

function plans(): array
{
    $p = settings_get('plans');
    if ($p) return $p;
    return [
        'fee' => 1.20,
        'items' => [
            ['id' => 'basic', 'name' => 'Basic Plan', 'monthly' => 100, 'yearly' => 1000],
            ['id' => 'standard', 'name' => 'Standard Plan', 'monthly' => 150, 'yearly' => 1500],
            ['id' => 'premium', 'name' => 'Premium Plan', 'monthly' => 200, 'yearly' => 2000],
        ],
    ];
}

function plan_by_id(string $id): ?array
{
    foreach (plans()['items'] as $p) if ($p['id'] === $id) return $p;
    return null;
}

/** Price for a plan + billing cycle, including the gateway fee. */
function plan_quote(string $planId, string $billing): ?array
{
    $p = plan_by_id($planId);
    if (!$p || !in_array($billing, ['monthly', 'yearly'], true)) return null;
    $price = (float) $p[$billing];
    $fee = (float) plans()['fee'];
    return ['plan' => $p, 'billing' => $billing, 'price' => $price, 'fee' => $fee, 'total' => round($price + $fee, 2)];
}

function doc_no(string $prefix, string $id): string
{
    return $prefix . '-' . date('Y') . '-' . str_pad(preg_replace('/\D/', '', $id), 5, '0', STR_PAD_LEFT);
}

/* ---------- Billplz ---------- */
function billplz_mode(): string { return (string) cfg('billplz.mode', 'mock'); }
function billplz_base(): string { return billplz_mode() === 'live' ? 'https://www.billplz.com/api/v3/' : 'https://www.billplz-sandbox.com/api/v3/'; }

function billplz_request(string $method, string $path, array $data = []): array
{
    $ch = curl_init(billplz_base() . $path);
    $opts = [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20, CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_USERPWD => cfg('billplz.api_key') . ':', CURLOPT_HTTPHEADER => ['Accept: application/json'],
    ];
    $ca = cfg('ca_bundle');
    if ($ca && is_file($ca)) $opts[CURLOPT_CAINFO] = $ca;
    if ($method === 'POST') { $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = http_build_query($data); }
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($res === false) throw new RuntimeException('Billplz connection failed: ' . $err);
    $json = json_decode((string) $res, true);
    if ($code >= 400 || !is_array($json)) {
        $msg = is_array($json) && isset($json['error']['message']) ? (is_array($json['error']['message']) ? implode(' ', $json['error']['message']) : $json['error']['message']) : ('HTTP ' . $code);
        throw new RuntimeException('Billplz: ' . $msg);
    }
    return $json;
}

/**
 * Check Billplz's X-Signature. $fields are the received parameters (without x_signature);
 * for the redirect they arrive nested as billplz[...] so the keys are prefixed with "billplz".
 */
function billplz_signature_ok(array $fields, string $signature, string $prefix = ''): bool
{
    $key = (string) cfg('billplz.x_signature_key');
    if ($key === '' || $signature === '') return false;
    $parts = [];
    foreach ($fields as $k => $v) {
        if ($k === 'x_signature') continue;
        $parts[] = $prefix . $k . (is_bool($v) ? ($v ? 'true' : 'false') : (string) $v);
    }
    usort($parts, 'strcasecmp');
    return hash_equals(hash_hmac('sha256', implode('|', $parts), $key), $signature);
}

/** Create a payment bill. Returns ['id' => …, 'url' => …]. */
function create_bill(array $sub, array $lead): array
{
    $cents = (int) round($sub['total'] * 100);
    $id = '';
    $url = '';
    if (billplz_mode() === 'mock') {
        $id = 'mock_' . bin2hex(random_bytes(6));
        $url = rtrim((string) cfg('api_url'), '/') . '/mock-gateway.php?bill=' . $id;
    } else {
        $billing = $lead['billingInfo'] ?? [];
        $name = trim(($billing['firstName'] ?? '') . ' ' . ($billing['lastName'] ?? '')) ?: ($lead['contactName'] ?: $lead['clubName']);
        $bill = billplz_request('POST', 'bills', [
            'collection_id' => cfg('billplz.collection_id'),
            'email' => $billing['email'] ?? $lead['email'],
            'mobile' => preg_replace('/[^\d+]/', '', (string) ($billing['phone'] ?? '')) ?: null,
            'name' => mb_substr($name, 0, 255),
            'amount' => $cents,
            'description' => mb_substr('D-Clix ' . $sub['planName'] . ' (' . $sub['billing'] . ') — ' . $lead['clubName'], 0, 200),
            'callback_url' => rtrim((string) cfg('api_url'), '/') . '/billplz-callback.php',
            'redirect_url' => rtrim((string) cfg('api_url'), '/') . '/billplz-return.php',
            'reference_1_label' => 'Invoice',
            'reference_1' => $sub['invoiceNo'],
        ]);
        $id = (string) $bill['id'];
        $url = (string) $bill['url'];
    }
    q('INSERT INTO bills (bill_id, subscription_id, lead_id, club_id, amount_cents, url, state, paid, gateway, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)',
        [$id, $sub['id'], $lead['id'], $lead['clubId'], $cents, $url, 'due', billplz_mode(), now()]);
    return ['id' => $id, 'url' => $url];
}

/** Ask Billplz (or the mock) for the bill's real state. Returns ['paid' => bool, 'state' => …, 'paid_at' => …]. */
function fetch_bill_state(string $billId): ?array
{
    $b = q('SELECT * FROM bills WHERE bill_id = ?', [$billId])->fetch();
    if (!$b) return null;
    if ($b['gateway'] === 'mock') return ['paid' => (bool) $b['paid'], 'state' => $b['state'], 'paid_at' => $b['paid_at'], 'raw' => []];
    $r = billplz_request('GET', 'bills/' . rawurlencode($billId));
    return ['paid' => !empty($r['paid']), 'state' => (string) ($r['state'] ?? ''), 'paid_at' => $r['paid_at'] ?? null, 'raw' => $r];
}

/* ---------- After payment ---------- */

/** Mark a bill paid and switch everything on. Safe to call more than once (callback + redirect). */
function complete_payment(string $billId, array $raw = []): ?array
{
    $pdo = db();
    $pdo->beginTransaction();
    try {
        $b = q('SELECT * FROM bills WHERE bill_id = ? FOR UPDATE', [$billId])->fetch();
        if (!$b) { $pdo->rollBack(); return null; }
        if ($b['processed_at']) { $pdo->commit(); return $b; }
        q('UPDATE bills SET paid = 1, state = ?, paid_at = ?, processed_at = ?, raw = ? WHERE bill_id = ?', ['paid', now(), now(), json_encode($raw), $billId]);

        $sub = rec_get('subscriptions', $b['subscription_id']);
        $lead = rec_get('leads', $b['lead_id']);
        $club = rec_get('clubs', $b['club_id']);
        if (!$sub || !$lead || !$club) throw new RuntimeException('Payment ' . $billId . ' has missing records');

        // Renewals continue from the current end date; new clubs start today.
        $start = ($club['status'] ?? '') === 'Active' && !empty($club['subEnd']) && $club['subEnd'] >= today() ? date('Y-m-d', strtotime($club['subEnd'] . ' +1 day')) : today();
        $end = date('Y-m-d', strtotime($start . ($sub['billing'] === 'yearly' ? ' +1 year' : ' +1 month') . ' -1 day'));

        $sub = array_merge($sub, ['status' => 'Paid', 'paidAt' => date('c'), 'paidAmount' => $sub['total'], 'receiptNo' => doc_no('DCX-R', $sub['id']),
            'method' => $b['gateway'] === 'mock' ? 'Test payment' : 'Billplz (FPX / card)', 'txnId' => $billId, 'periodStart' => $start, 'periodEnd' => $end]);
        rec_put('subscriptions', $sub, 'system');

        $club = array_merge($club, ['status' => 'Active', 'plan' => explode(' ', $sub['planName'])[0], 'billing' => $sub['billing'], 'subEnd' => $end]);
        if (($club['subStart'] ?? '') === '' || $club['subStart'] > $start) $club['subStart'] = $start;
        rec_put('clubs', $club, 'system');

        $hasCentre = (int) q("SELECT COUNT(*) FROM records WHERE coll = 'centres' AND club_id = ?", [$club['id']])->fetchColumn();
        if (!$hasCentre) {
            rec_put('centres', ['id' => next_id('centres', 'TC'), 'name' => $club['name'] . ' — Main Centre', 'clubId' => $club['id'], 'address' => $club['address'] ?? '',
                'phone' => $club['phone'] ?? '', 'email' => $club['email'] ?? '', 'hours' => '', 'capacity' => 100, 'status' => 'Active', 'createdAt' => today()], 'system');
        }
        if (!empty($lead['userId'])) q("UPDATE users SET status = 'Active' WHERE id = ? AND status = 'Pending Payment'", [$lead['userId']]);
        $lead = array_merge($lead, ['status' => 'Paid', 'paidAt' => date('c'), 'subscriptionId' => $sub['id']]);
        rec_put('leads', $lead, 'system');
        audit(null, 'Update', 'subscriptions', $sub['id'], 'Payment received for ' . $club['name'] . ' (' . money_fmt($sub['total']) . ', bill ' . $billId . ')');
        $pdo->commit();
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }

    payment_emails($lead, $club, $sub);
    return $b;
}

function fail_payment(string $billId, string $state): void
{
    $b = q('SELECT * FROM bills WHERE bill_id = ?', [$billId])->fetch();
    if (!$b || $b['paid']) return;
    q('UPDATE bills SET state = ? WHERE bill_id = ?', [$state ?: 'due', $billId]);
    $sub = rec_get('subscriptions', $b['subscription_id']);
    if ($sub && $sub['status'] !== 'Paid') { $sub['status'] = 'Payment Failed'; rec_put('subscriptions', $sub, 'system'); }
    $lead = rec_get('leads', $b['lead_id']);
    if ($lead && $lead['status'] !== 'Paid') { $lead['status'] = 'Payment Failed'; rec_put('leads', $lead, 'system'); }
}

/** A fresh link that lets the client resume payment (valid 7 days). */
function resume_link(string $leadId): string
{
    $token = random_token();
    q('INSERT INTO signup_tokens (token_hash, lead_id, created_at, expires_at) VALUES (?, ?, ?, ?)', [hash('sha256', $token), $leadId, now(), date('Y-m-d H:i:s', time() + 7 * 86400)]);
    return rtrim((string) cfg('site_url'), '/') . '/payment.html?t=' . $token;
}

/* ---------- Emails ---------- */
function signup_emails(array $lead, string $resumeUrl): void
{
    $rows = [['Club', $lead['clubName']], ['Contact email', $lead['email']], ['Phone', $lead['phone']], ['Sport', $lead['sport']], ['Plan', $lead['planName'] . ' (' . $lead['billing'] . ')'], ['Lead ID', $lead['id']]];
    send_mail((string) cfg('mail.sales_to'), 'New signup: ' . $lead['clubName'] . ' (payment pending)',
        email_layout('New club signup', 'A club just registered on the website and is being sent to payment.', $rows, ['Open in admin', rtrim((string) cfg('site_url'), '/') . '/admin.html#/leads']), 'sales_signup', $lead['id']);
    send_mail($lead['email'], 'Complete your D-Clix registration',
        email_layout('Thanks for registering, ' . $lead['clubName'], 'We have saved your club details. Your account will be activated as soon as payment is completed.',
            [['Plan', $lead['planName'] . ' (' . $lead['billing'] . ')'], ['Login email', $lead['email']]], ['Complete payment', $resumeUrl], 'If you have already paid, you can ignore this email.'), 'client_signup', $lead['id']);
}

function payment_emails(array $lead, array $club, array $sub): void
{
    $login = rtrim((string) cfg('site_url'), '/') . '/admin-login.html';
    send_mail($lead['email'], 'Welcome to D-Clix — your club is active',
        email_layout('Welcome to D-Clix!', 'Your payment was successful and <b>' . esc($club['name']) . '</b> is now active. Log in with the email and password you chose during registration.',
            [['Login email', $lead['email']], ['Plan', $sub['planName'] . ' (' . $sub['billing'] . ')'], ['Active until', date('d/m/Y', strtotime($sub['periodEnd']))]], ['Log in to D-Clix', $login],
            'Next steps: add your training centres, instructors and students. Our team will contact you on WhatsApp to help you get started.'), 'client_welcome', $lead['id']);
    send_mail($lead['email'], 'Receipt ' . $sub['receiptNo'] . ' — D-Clix subscription',
        email_layout('Payment receipt', 'Thank you for your payment.', [
            ['Receipt no.', $sub['receiptNo']], ['Invoice no.', $sub['invoiceNo']], ['Club', $club['name']], ['Plan', $sub['planName'] . ' (' . $sub['billing'] . ')'],
            ['Subscription', money_fmt($sub['price'])], ['Gateway fee', money_fmt($sub['fee'])], ['Total paid', money_fmt($sub['total'])],
            ['Payment method', $sub['method']], ['Transaction ID', $sub['txnId']], ['Period', date('d/m/Y', strtotime($sub['periodStart'])) . ' – ' . date('d/m/Y', strtotime($sub['periodEnd']))],
        ], null, 'This is a computer-generated receipt. No signature is required.'), 'client_receipt', $sub['id']);
    send_mail((string) cfg('mail.sales_to'), 'Payment received: ' . $club['name'] . ' — ' . money_fmt($sub['total']),
        email_layout('Payment received', 'A new club has paid and been activated automatically.', [['Club', $club['name'] . ' (' . $club['id'] . ')'], ['Plan', $sub['planName'] . ' (' . $sub['billing'] . ')'], ['Amount', money_fmt($sub['total'])], ['Bill', $sub['txnId']], ['Contact', $lead['email'] . ' · ' . $lead['phone']]],
            ['Open in admin', rtrim((string) cfg('site_url'), '/') . '/admin.html#/leads']), 'sales_paid', $sub['id']);
}
