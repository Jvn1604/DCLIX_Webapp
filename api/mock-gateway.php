<?php
/*
 * Test payment page used while billplz.mode = 'mock' (no Billplz account needed).
 * It behaves like Billplz: the customer pays or cancels, then returns to billplz-return.php.
 * Disabled automatically in sandbox/live mode.
 */
require __DIR__ . '/lib/init.php';

$billId = is_string($_GET['bill'] ?? null) ? $_GET['bill'] : '';
$bill = $billId !== '' ? q('SELECT * FROM bills WHERE bill_id = ?', [$billId])->fetch() : false;
if (billplz_mode() !== 'mock' || !$bill || $bill['gateway'] !== 'mock') { http_response_code(404); echo 'Not available.'; exit; }
$sub = rec_get('subscriptions', $bill['subscription_id']);
$lead = rec_get('leads', $bill['lead_id']);

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && !$bill['paid']) {
    $pay = ($_POST['result'] ?? '') === 'pay';
    q('UPDATE bills SET paid = ?, state = ?, paid_at = ? WHERE bill_id = ?', [$pay ? 1 : 0, $pay ? 'paid' : 'due', $pay ? now() : null, $billId]);
    header('Location: billplz-return.php?' . http_build_query(['billplz' => ['id' => $billId, 'paid' => $pay ? 'true' : 'false']]));
    exit;
}
header('Content-Type: text/html; charset=utf-8');
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Test payment</title>
<style>body{font-family:system-ui,sans-serif;background:#f3f4f6;margin:0;padding:24px;color:#111}.box{max-width:440px;margin:40px auto;background:#fff;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
.tag{display:inline-block;background:#fef3c7;color:#92400e;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:700}h1{font-size:20px}table{width:100%;border-collapse:collapse;margin:16px 0}td{padding:8px 0;border-bottom:1px solid #eee}td:last-child{text-align:right;font-weight:600}
button{width:100%;padding:12px;border-radius:10px;border:0;font-size:15px;font-weight:700;margin-top:10px;cursor:pointer}.pay{background:#16a34a;color:#fff}.cancel{background:#e5e7eb}</style></head>
<body><div class="box"><span class="tag">TEST MODE — no real money</span>
<h1>D-Clix test payment</h1>
<?php if ($bill['paid']): ?><p>This bill is already paid.</p><?php else: ?>
<table><tr><td>Club</td><td><?= esc($lead['clubName'] ?? '') ?></td></tr><tr><td>Plan</td><td><?= esc(($sub['planName'] ?? '') . ' (' . ($sub['billing'] ?? '') . ')') ?></td></tr>
<tr><td>Invoice</td><td><?= esc($sub['invoiceNo'] ?? '') ?></td></tr><tr><td>Amount</td><td><?= esc(money_fmt($bill['amount_cents'] / 100)) ?></td></tr></table>
<form method="post"><button class="pay" name="result" value="pay">Pay (simulate success)</button><button class="cancel" name="result" value="cancel">Cancel (simulate failure)</button></form>
<?php endif; ?>
<p style="color:#6b7280;font-size:13px">Set <code>billplz.mode</code> to <code>sandbox</code> in api/config.php to use the real Billplz sandbox instead.</p></div></body></html>
