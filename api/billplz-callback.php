<?php
/*
 * Billplz calls this server-to-server when a bill changes (callback_url).
 * This is the reliable confirmation: it arrives even if the customer closes the browser.
 * It cannot reach a PC on a home network, so it only works once the API is on public hosting.
 */
require __DIR__ . '/lib/init.php';
require_method('POST');

$f = $_POST;
$billId = is_string($f['id'] ?? null) ? $f['id'] : '';
$bill = $billId !== '' ? q('SELECT * FROM bills WHERE bill_id = ?', [$billId])->fetch() : false;
if (!$bill || $bill['gateway'] === 'mock') { http_response_code(404); echo 'Unknown bill'; exit; }

if (cfg('billplz.x_signature_key')) {
    $sig = (string) ($f['x_signature'] ?? '');
    unset($f['x_signature']);
    if (!billplz_signature_ok($f, $sig)) { log_line('billplz', 'Bad X-Signature on callback for bill ' . $billId); http_response_code(403); echo 'Invalid signature'; exit; }
    $paid = ($f['paid'] ?? '') === 'true';
    $state = ['paid' => $paid, 'state' => (string) ($f['state'] ?? ''), 'raw' => $f];
} else {
    // No signature key configured: ask Billplz directly instead of trusting the POST.
    $state = fetch_bill_state($billId);
}

if ($state['paid']) complete_payment($billId, $state['raw']);
else fail_payment($billId, $state['state']);
echo 'OK';
