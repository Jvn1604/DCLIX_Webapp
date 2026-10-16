<?php
/* Public, read-only information: GET ?action=health | plans */
require __DIR__ . '/lib/init.php';

$action = $_GET['action'] ?? 'health';
if ($action === 'health') {
    q('SELECT 1');
    json_out(['ok' => true, 'payments' => billplz_mode(), 'time' => date('c')]);
}
if ($action === 'plans') json_out(plans());
fail('Unknown action.', 404);
