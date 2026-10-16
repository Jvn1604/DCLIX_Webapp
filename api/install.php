<?php
/*
 * D-Clix installer (command line only).
 *
 *   php api/install.php --demo
 *       Local testing: creates the database + app user, api/config.php, tables, sample data
 *       and the demo accounts (password Demo@1234 — never use --demo on a real server).
 *
 *   php api/install.php --admin-email=you@company.com --admin-name="Your Name" --admin-password="…"
 *       Creates tables and one real Super Admin (no sample data).
 *
 * Options: --root-user=root --root-pass= (MySQL account used to create the database, XAMPP default is root with no password)
 *          --db=dclix --site-url=http://127.0.0.1:8000
 */
declare(strict_types=1);
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }

$opt = getopt('', ['demo', 'admin-email:', 'admin-name:', 'admin-password:', 'root-user:', 'root-pass:', 'db:', 'site-url:']);
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
        ["'debug' => " . (isset($opt['demo']) ? 'true' : 'false'), "dbname=$dbName", "'pass' => " . var_export($appPass, true), "'site_url' => " . var_export($site, true), "'api_url'  => " . var_export($site . '/api', true)], $tpl);
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

/* 3. Settings, roles, plans */
$defaults = json_decode(file_get_contents($root . '/seed/defaults.json'), true);
if (settings_get('settings') === null) { settings_put('settings', $defaults['settings']); $say('Saved default settings.'); }
$roles = settings_get('roles');
if ($roles === null) { settings_put('roles', $defaults['roles']); $say('Saved default roles and permissions.'); }
else { // add permissions for modules added since the last install
    $changed = false;
    foreach ($defaults['roles'] as $k => $r) foreach ($r['perms'] as $m => $p) if (isset($roles[$k]) && !isset($roles[$k]['perms'][$m])) { $roles[$k]['perms'][$m] = $p; $changed = true; }
    if ($changed) { settings_put('roles', $roles); $say('Added permissions for new modules.'); }
}
if (settings_get('plans') === null) {
    settings_put('plans', ['fee' => 1.20, 'items' => [
        ['id' => 'basic', 'name' => 'Basic Plan', 'monthly' => 100, 'yearly' => 1000],
        ['id' => 'standard', 'name' => 'Standard Plan', 'monthly' => 150, 'yearly' => 1500],
        ['id' => 'premium', 'name' => 'Premium Plan', 'monthly' => 200, 'yearly' => 2000]]]);
    $say('Saved plans (Basic / Standard / Premium).');
}

/* 4. Sample data + demo accounts */
if (isset($opt['demo'])) {
    $count = (int) q('SELECT COUNT(*) FROM records')->fetchColumn();
    $demo = json_decode(file_get_contents($root . '/seed/demo.json'), true);
    if ($count === 0) {
        db()->beginTransaction();
        $n = 0;
        foreach ($demo['collections'] as $coll => $rows) foreach ($rows as $r) { rec_put($coll, $r, 'install'); $n++; }
        db()->commit();
        $say("Loaded $n sample records.");
    } else $say("Sample data skipped: the database already has $count records.");
    $hash = password_hash('Demo@1234', PASSWORD_DEFAULT);
    foreach ($demo['users'] as $u) {
        if (q('SELECT id FROM users WHERE email = ?', [$u['email']])->fetchColumn()) continue;
        q('INSERT INTO users (id, email, name, phone, role, club_id, centre_id, status, pw_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$u['id'], strtolower($u['email']), $u['name'], '', $u['role'], $u['clubId'], $u['centreId'], 'Active', $hash, now()]);
        $say('Demo account: ' . $u['email'] . ' (' . $u['role'] . ')');
    }
    $say('Demo accounts use the password shown on the login page. Do NOT use --demo on a public server.');
}

/* 5. A real Super Admin */
if (!empty($opt['admin-email'])) {
    $email = strtolower(trim($opt['admin-email']));
    $pw = $opt['admin-password'] ?? '';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $die('Invalid --admin-email.');
    if ($p = password_problem($pw)) $die('--admin-password: ' . $p);
    if (q('SELECT id FROM users WHERE email = ?', [$email])->fetchColumn()) $say("User $email already exists — not changed.");
    else {
        $id = next_id('users', 'USR');
        q("INSERT INTO users (id, email, name, phone, role, club_id, centre_id, status, pw_hash, created_at) VALUES (?, ?, ?, '', 'superadmin', '', '', 'Active', ?, ?)",
            [$id, $email, $opt['admin-name'] ?? 'Super Admin', password_hash($pw, PASSWORD_DEFAULT), now()]);
        $say("Created Super Admin $email ($id).");
    }
}
if (!(int) q("SELECT COUNT(*) FROM users WHERE role = 'superadmin'")->fetchColumn()) $say('WARNING: there is no Super Admin yet. Run again with --admin-email, --admin-name and --admin-password.');
$say('Done.');
