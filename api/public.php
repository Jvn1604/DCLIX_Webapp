<?php
/* public: ?action=health | plans */
declare(strict_types=1);
require __DIR__ . '/lib/core.php';
require __DIR__ . '/lib/portal.php';
cors();
throttle('public:' . client_ip(), 60, 600);

$action = $_GET['action'] ?? 'health';
if ($action === 'health') {
    // only says if the portal answers, no details
    try { portal()->ping(); $up = true; } catch (DclixApiException $e) { log_line('portal', 'ping ' . $e->status . ' ' . $e->getMessage()); $up = false; }
    json_out(['ok' => $up, 'time' => date('c')], $up ? 200 : 503);
}
if ($action === 'plans') json_out(['ok' => true] + portal_packages());
fail('Unknown action.', 404);
