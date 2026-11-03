<?php
/* maclub portal api (signed calls, see dclix-client.php) */
require_once __DIR__ . '/dclix-client.php';

function portal(): DclixApi
{
    static $api = null;
    if ($api === null) {
        // keys set + https only, so the signed calls never go out in plain text
        if (!cfg('portal.client_id') || !cfg('portal.secret') || !str_starts_with((string) cfg('portal.base'), 'https://'))
            fail('The server is not connected to the D-Clix portal yet.', 503);
        $api = new DclixApi((string) cfg('portal.base'), (string) cfg('portal.client_id'), (string) cfg('portal.secret'), (string) cfg('ca_bundle', ''));
    }
    return $api;
}

/** portal error -> our {error, fields} reply. $map renames portal field names to ours */
function portal_fail(DclixApiException $e, array $map = []): never
{
    log_line('portal', $e->status . ' ' . $e->errorCode . ' ' . $e->getMessage() . ' ' . $e->requestId);
    if (in_array($e->status, [409, 422], true) && is_array($e->details) && $e->details) {
        $fields = [];
        foreach ($e->details as $k => $msg) $fields[$map[$k] ?? $k] = (string) $msg;
        fail($e->status === 409 ? 'Some of these details are already registered.' : 'Please fix the highlighted fields.', $e->status, ['fields' => $fields]);
    }
    if ($e->status === 429) fail('Too many attempts. Please wait a few minutes and try again.', 429);
    if ($e->errorCode === 'payment_unavailable') fail('The payment page could not be opened. Nothing was charged, please try again.', 502);
    fail('We could not reach the D-Clix system. Please try again in a moment.', 502);
}

/** plans + sports, cached 10 min so every page view isnt a portal call */
function portal_packages(): array
{
    $file = API_ROOT . '/storage/cache/packages.json';
    if (is_file($file) && filemtime($file) > time() - 600) {
        $c = json_decode((string) file_get_contents($file), true);
        if (is_array($c)) return $c;
    }
    try { $data = portal()->packages(); } catch (DclixApiException $e) { portal_fail($e); }
    if (!is_dir(dirname($file))) @mkdir(dirname($file), 0775, true);
    @file_put_contents($file, json_encode($data));
    return $data;
}

/** our sport slug (karate, jujitsu ...) -> portal sport id. unknown = Others */
function portal_sport_id(string $slug): ?int
{
    $norm = fn($s) => preg_replace('/[^a-z0-9]/', '', strtolower($s));
    $others = null;
    foreach (portal_packages()['sports'] ?? [] as $s) {
        if ($norm($s['name']) === $norm($slug)) return (int) $s['id'];
        if ($norm($s['name']) === 'others') $others = (int) $s['id'];
    }
    return $others;
}
