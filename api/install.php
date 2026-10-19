<?php
/*
 * D-Clix installer (command line only).
 *
 *   php api/install.php
 *       Creates the database + app user, api/config.php, the tables and the plan prices.
 *       Safe to run again: existing data is kept.
 *
 * Options: --root-user=root --root-pass= (MySQL account used to create the database, XAMPP default is root with no password)
 *          --db=dclix --site-url=http://127.0.0.1:8000
 */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$opt = getopt('', ['root-user:', 'root-pass:', 'db:', 'site-url:']);
$root = __DIR__;
$cfgFile = $root . '/config.php';
$say = function (string $m) { fwrite(STDOUT, $m . PHP_EOL); };
$die = function (string $m) { fwrite(STDERR, 'ERROR: ' . $m . PHP_EOL); exit(1); };

/* 1. Database, app user and config.php */
if (!is_file($cfgFile)) {
    $dbName = $opt['db'] ?? 'dclix';
    if (!preg_match('/^\w+$/', $dbName)) $die('Invalid database name.');
    $appPass = rtrim(strtr(base64_encode(random_bytes(18)), '+/', 'Ab'), '=');
    try {
        $pdo = new PDO('mysql:host=127.0.0.1;port=3306;charset=utf8mb4', $opt['root-user'] ?? 'root', $opt['root-pass'] ?? '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    } catch (Throwable $e) { $die('Cannot connect to MySQL as root. Is MySQL running in XAMPP? (' . $e->getMessage() . ')'); }
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    foreach (['localhost', '127.0.0.1'] as $h) {
        $pdo->exec("CREATE USER IF NOT EXISTS 'dclix_app'@'$h' IDENTIFIED BY " . $pdo->quote($appPass));
        $pdo->exec("ALTER USER 'dclix_app'@'$h' IDENTIFIED BY " . $pdo->quote($appPass));
        $pdo->exec("GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX ON `$dbName`.* TO 'dclix_app'@'$h'");
    }
    $pdo->exec('FLUSH PRIVILEGES');
    $site = rtrim($opt['site-url'] ?? 'http://127.0.0.1:8000', '/');
    $tpl = file_get_contents($root . '/config.example.php');
    $tpl = str_replace(["'debug' => false", "dbname=dclix", "'pass' => 'CHANGE_ME'", "'site_url' => 'http://127.0.0.1:8000'", "'api_url'  => 'http://127.0.0.1:8000/api'"],
        ["'debug' => false", "dbname=$dbName", "'pass' => " . var_export($appPass, true), "'site_url' => " . var_export($site, true), "'api_url'  => " . var_export($site . '/api', true)], $tpl);
    $ca = 'C:/xampp/apache/bin/curl-ca-bundle.crt';
    if (is_file($ca)) $tpl = str_replace("    'billplz' => [", "    // Certificate bundle for HTTPS calls to Billplz (XAMPP's PHP does not set one)\n    'ca_bundle' => " . var_export($ca, true) . ",\n\n    'billplz' => [", $tpl);
    $tpl = str_replace(' * Copy this file to api/config.php and fill in real values.', ' * Created by api/install.php on ' . date('Y-m-d H:i') . '. Edit the values below as needed.', $tpl);
    file_put_contents($cfgFile, $tpl);
    $say("Created database `$dbName`, MySQL user dclix_app and api/config.php");
} else {
    $say('api/config.php already exists — using it.');
}

/* 2. Tables */
$_SERVER['REQUEST_METHOD'] = 'CLI';
require $root . '/lib/core.php';
require $root . '/lib/data.php';
restore_exception_handler();
$sql = file_get_contents($root . '/schema.sql');
foreach (array_filter(array_map('trim', explode(';', preg_replace('/^--.*$/m', '', $sql)))) as $stmt) db()->exec($stmt);
$say('Tables are ready.');

/* 3. Plans */
if (settings_get('plans') === null) {
    settings_put('plans', ['fee' => 1.20, 'items' => [
        ['id' => 'basic', 'name' => 'Basic Plan', 'monthly' => 100, 'yearly' => 1000],
        ['id' => 'standard', 'name' => 'Standard Plan', 'monthly' => 150, 'yearly' => 1500],
        ['id' => 'premium', 'name' => 'Premium Plan', 'monthly' => 200, 'yearly' => 2000]]]);
    $say('Saved plans (Basic / Standard / Premium).');
}

$say('Done.');
