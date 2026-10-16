<?php
/*
 * Billplz sends the customer's browser here after paying (redirect_url).
 * We never trust the query string alone: the bill is re-checked with Billplz before anything is activated.
 */
require __DIR__ . '/lib/init.php';

$site = rtrim((string) cfg('site_url'), '/') . '/payment-status.html';
$p = is_array($_GET['billplz'] ?? null) ? $_GET['billplz'] : [];
$billId = is_string($p['id'] ?? null) ? $p['id'] : '';
$bill = $billId !== '' ? q('SELECT * FROM bills WHERE bill_id = ?', [$billId])->fetch() : false;
if (!$bill) { header('Location: ' . $site . '?status=error'); exit; }

if ($bill['gateway'] !== 'mock' && cfg('billplz.x_signature_key')) {
    $fields = $p; unset($fields['x_signature']);
    if (!billplz_signature_ok($fields, (string) ($p['x_signature'] ?? ''), 'billplz')) {
        log_line('billplz', 'Bad X-Signature on redirect for bill ' . $billId);
        header('Location: ' . $site . '?status=error'); exit;
    }
}

try {
    $state = fetch_bill_state($billId);
} catch (Throwable $e) {
    log_line('billplz', 'Could not confirm bill ' . $billId . ': ' . $e->getMessage());
    header('Location: ' . $site . '?status=pending&ref=' . rawurlencode($bill['subscription_id'])); exit;
}

if ($state && $state['paid']) {
    complete_payment($billId, $state['raw'] ?? []);
    header('Location: ' . $site . '?status=paid&ref=' . rawurlencode($bill['subscription_id']));
} else {
    fail_payment($billId, $state['state'] ?? 'due');
    header('Location: ' . $site . '?status=failed&ref=' . rawurlencode($bill['subscription_id']));
}
exit;
