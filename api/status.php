<?php
/* signup status for payment-status.html: ?ref=<reference>
 * always ask the portal, never trust ?state= in the url
 */
declare(strict_types=1);
require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/portal.php';
cors();
require_method('GET');
throttle('status:' . client_ip(), 120, 600);

$ref = (string) ($_GET['ref'] ?? '');
if (!preg_match('/^[0-9a-fA-F-]{36}$/', $ref)) fail('Unknown registration.', 404);

try {
    $r = portal()->registrationStatus($ref);
} catch (DclixApiException $e) {
    // json not_found = bad ref. a plain 404 means the portal route is down
    if ($e->status === 404 && $e->errorCode === 'not_found') fail('Unknown registration.', 404);
    portal_fail($e);
}
json_out([
    'ok' => true, 'ref' => $r['reference'] ?? $ref, 'state' => $r['state'] ?? '', 'message' => $r['message'] ?? '',
    'clubName' => $r['clubName'] ?? '', 'clubCode' => $r['clubCode'] ?? '', 'plan' => $r['plan']['name'] ?? '',
    'amount' => $r['pricing']['amount'] ?? null, 'currency' => $r['pricing']['currency'] ?? 'MYR',
    'payUrl' => ($r['state'] ?? '') === 'awaiting_payment' ? ($r['payment']['url'] ?? '') : '',
]);
