<?php
/* D-Clix API — core helpers: config, database, JSON responses, CORS, rate limits, logging. */
declare(strict_types=1);

date_default_timezone_set('Asia/Kuala_Lumpur');
define('API_ROOT', dirname(__DIR__));

if (!is_file(API_ROOT . '/config.php')) {
    http_response_code(503);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'The server is not configured yet. Run: php api/install.php']);
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

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(cfg('db.dsn'), cfg('db.user'), cfg('db.pass'), [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]);
        $pdo->exec("SET time_zone = '+08:00'");
    }
    return $pdo;
}

function q(string $sql, array $params = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute($params);
    return $st;
}

function now(): string { return date('Y-m-d H:i:s'); }
function today(): string { return date('Y-m-d'); }
function iso_time(?string $dt): string { return $dt ? date('c', strtotime($dt)) : ''; }

function json_out($data, int $code = 200): never
{
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $code = 400, array $extra = []): never
{
    json_out(['error' => $message] + $extra, $code);
}

/** Request body as an array (JSON or form-encoded). */
function body(): array
{
    static $b = null;
    if ($b === null) {
        $raw = file_get_contents('php://input') ?: '';
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
function client_agent(): string { return substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255); }

/** Allow the configured websites to call the API from the browser. */
function cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '' && in_array($origin, cfg('allowed_origins', []), true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
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
    @file_put_contents($dir . '/' . $channel . '-' . date('Y-m') . '.log', '[' . now() . '] ' . $msg . PHP_EOL, FILE_APPEND);
}

set_exception_handler(function (Throwable $e) {
    log_line('error', get_class($e) . ': ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) {
        $extra = cfg('debug') ? ['detail' => $e->getMessage()] : [];
        json_out(['error' => 'Something went wrong on the server. Please try again.'] + $extra, 500);
    }
});

function random_token(int $bytes = 32): string
{
    return rtrim(strtr(base64_encode(random_bytes($bytes)), '+/', '-_'), '=');
}

function six_digit_code(): string { return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT); }

function settings_get(string $key)
{
    $v = q('SELECT v FROM settings WHERE k = ?', [$key])->fetchColumn();
    return $v === false ? null : json_decode($v, true);
}

function settings_put(string $key, $value): void
{
    q('INSERT INTO settings (k, v, updated_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v), updated_at = VALUES(updated_at)',
        [$key, json_encode($value, JSON_UNESCAPED_UNICODE), now()]);
}

/** Allow at most $max hits per $window seconds for this key, otherwise reply 429. */
function throttle(string $key, int $max, int $window): void
{
    $k = substr($key, 0, 120);
    $row = q('SELECT hits, window_start FROM throttle WHERE k = ?', [$k])->fetch();
    if (!$row || strtotime($row['window_start']) < time() - $window) {
        q('REPLACE INTO throttle (k, hits, window_start) VALUES (?, 1, ?)', [$k, now()]);
        return;
    }
    if ((int) $row['hits'] >= $max) fail('Too many attempts. Please wait a few minutes and try again.', 429);
    q('UPDATE throttle SET hits = hits + 1 WHERE k = ?', [$k]);
}

function valid_email(string $e): bool { return (bool) filter_var($e, FILTER_VALIDATE_EMAIL) && strlen($e) <= 190; }

function password_problem(string $pw): ?string
{
    if (strlen($pw) < 8 || !preg_match('/[A-Z]/', $pw) || !preg_match('/[a-z]/', $pw) || !preg_match('/\d/', $pw))
        return 'Use at least 8 characters with upper-case, lower-case and a number.';
    if (strlen($pw) > 200) return 'Password is too long.';
    return null;
}

function money_fmt($n): string { return 'RM ' . number_format((float) $n, 2); }
