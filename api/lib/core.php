<?php
/* core: config, json, cors, throttle, logs */
declare(strict_types=1);

date_default_timezone_set('Asia/Kuala_Lumpur');
define('API_ROOT', dirname(__DIR__));

if (!is_file(API_ROOT . '/config.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'The server is not configured yet. Copy api/config.example.php to api/config.php and fill it in.']);
    exit;
}
$GLOBALS['CONFIG'] = require API_ROOT . '/config.php';

function cfg(string $path, $default = null)
{
    $v = $GLOBALS['CONFIG'];
    foreach (explode('.', $path) as $k) {
        if (!is_array($v) || !array_key_exists($k, $v)) return $default;
        $v = $v[$k];
    }
    return $v;
}

function json_out($data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    // same as api/.htaccess, for hosts without apache
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('Referrer-Policy: no-referrer');
    header_remove('X-Powered-By');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** reply now, then run $after (emails etc.) so the browser isnt kept waiting */
function json_out_then($data, callable $after): never
{
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('Referrer-Policy: no-referrer');
    header_remove('X-Powered-By');
    header('Content-Length: ' . strlen($json));
    header('Connection: close');
    ignore_user_abort(true);
    echo $json;
    if (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
    else { while (ob_get_level()) ob_end_flush(); flush(); }
    try { $after(); } catch (Throwable $e) { log_line('error', 'after reply: ' . $e->getMessage()); }
    exit;
}

function fail(string $message, int $code = 400, array $extra = []): never
{
    json_out(['error' => $message] + $extra, $code);
}

/** request body (json or form) */
function body(): array
{
    static $b = null;
    if ($b === null) {
        // forms are small, the portal takes max 64 KB anyway
        $raw = (string) file_get_contents('php://input', false, null, 0, 65537);
        if (strlen($raw) > 65536) fail('This form is too large.', 413);
        $b = json_decode($raw, true);
        if (!is_array($b)) $b = $_POST ?: [];
    }
    return $b;
}

function str_in(array $src, string $key, int $max = 255): string
{
    $v = $src[$key] ?? '';
    if (!is_scalar($v)) return '';
    $v = trim((string) $v);
    return mb_substr($v, 0, $max);
}

function client_ip(): string { return substr((string) ($_SERVER['REMOTE_ADDR'] ?? ''), 0, 64); }

function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, cfg('allowed_origins', []), true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Max-Age: 600');
    }
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) fail('Method not allowed.', 405);
}

function log_line(string $channel, string $msg): void
{
    $dir = API_ROOT . '/storage/logs';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    @file_put_contents($dir . '/' . $channel . '-' . date('Y-m') . '.log', '[' . date('Y-m-d H:i:s') . '] ' . $msg . PHP_EOL, FILE_APPEND);
}

set_exception_handler(function (Throwable $e) {
    log_line('error', get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        $extra = cfg('debug') ? ['detail' => $e->getMessage()] : [];
        json_out(['error' => 'Something went wrong on the server. Please try again.'] + $extra, 500);
    }
});

/** max $max hits per $window sec, else 429 */
function throttle(string $key, int $max, int $window): void
{
    // file based, no db needed
    $dir = API_ROOT . '/storage/throttle';
    if (!is_dir($dir)) @mkdir($dir, 0775, true);
    $fh = @fopen($dir . '/' . hash('sha256', $key) . '.json', 'c+');
    if (!$fh) return;
    flock($fh, LOCK_EX);
    $row = json_decode((string) stream_get_contents($fh), true);
    if (!is_array($row) || ($row['start'] ?? 0) < time() - $window) $row = ['start' => time(), 'hits' => 0];
    $over = $row['hits'] >= $max;
    if (!$over) {
        $row['hits']++;
        ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($row));
    }
    flock($fh, LOCK_UN); fclose($fh);
    if ($over) fail('Too many attempts. Please wait a few minutes and try again.', 429);
}

function valid_email(string $e): bool { return (bool) filter_var($e, FILTER_VALIDATE_EMAIL) && strlen($e) <= 190; }
