<?php
/* D-Clix API — records, permissions, data scope, audit trail. */
declare(strict_types=1);

/*
 * Which permission modules guard each collection.
 *  read  : the user needs "view" on at least one of these to receive the collection (null = always, filtered by scope)
 *  write : "create", "edit" or "approve" on any of these allows saving; "delete" on any allows deleting
 *  shared: records with no club (platform-wide) that non-super users may still update (shared inventory)
 */
const COLLECTIONS = [
    'clubs'         => ['read' => null, 'write' => ['clubs']],
    'centres'       => ['read' => null, 'write' => ['centres']],
    'students'      => ['read' => null, 'write' => ['students', 'registrations', 'approvals', 'gradings']],
    'instructors'   => ['read' => null, 'write' => ['instructors', 'registrations']],
    'classes'       => ['read' => null, 'write' => ['classes', 'students', 'approvals']],
    'registrations' => ['read' => ['registrations', 'approvals'], 'write' => ['registrations', 'approvals']],
    'attendance'    => ['read' => ['attendance', 'students', 'classes', 'instructors', 'reports'], 'write' => ['attendance']],
    'gradings'      => ['read' => null, 'write' => ['gradings']],
    'candidates'    => ['read' => null, 'write' => ['gradings']],
    'activities'    => ['read' => null, 'write' => ['activities']],
    'tournaments'   => ['read' => null, 'write' => ['tournaments']],
    'participants'  => ['read' => null, 'write' => ['tournaments']],
    'payments'      => ['read' => ['payments', 'collections', 'invoices', 'outstanding', 'refunds', 'reports', 'students'], 'write' => ['payments', 'invoices', 'gradings', 'registrations', 'approvals', 'refunds']],
    'refunds'       => ['read' => ['refunds', 'approvals', 'reports'], 'write' => ['refunds', 'approvals', 'payments']],
    'transfers'     => ['read' => ['approvals', 'students'], 'write' => ['students', 'approvals']],
    'payroll'       => ['read' => ['payroll', 'instructors'], 'write' => ['payroll']],
    'products'      => ['read' => null, 'write' => ['products', 'stock', 'deliveries'], 'shared' => true],
    'stockMoves'    => ['read' => ['stock', 'products'], 'write' => ['stock', 'products', 'deliveries'], 'shared' => true],
    'purchases'     => ['read' => ['purchases', 'approvals'], 'write' => ['purchases', 'approvals'], 'shared' => true],
    'deliveries'    => ['read' => ['deliveries', 'purchases'], 'write' => ['deliveries', 'purchases', 'approvals'], 'shared' => true],
    'notifications' => ['read' => ['notifications'], 'write' => ['notifications', 'outstanding']],
    'leads'         => ['read' => ['leads'], 'write' => ['leads']],
    'subscriptions' => ['read' => ['subscriptions', 'clubs'], 'write' => ['subscriptions']],
];

/* ---------- Records ---------- */
function rec_get(string $coll, string $id): ?array
{
    $v = q('SELECT data FROM records WHERE coll = ? AND id = ?', [$coll, $id])->fetchColumn();
    return $v === false ? null : json_decode($v, true);
}

function rec_scope_cols(string $coll, array $d): array
{
    $club = $coll === 'clubs' ? ($d['id'] ?? '') : ($d['clubId'] ?? '');
    $centre = $coll === 'centres' ? ($d['id'] ?? '') : ($d['centreId'] ?? '');
    return [(string) $club, (string) $centre];
}

function rec_put(string $coll, array $d, string $by = ''): void
{
    [$club, $centre] = rec_scope_cols($coll, $d);
    q('INSERT INTO records (coll, id, club_id, centre_id, data, created_at, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE club_id = VALUES(club_id), centre_id = VALUES(centre_id), data = VALUES(data), updated_at = VALUES(updated_at), updated_by = VALUES(updated_by)',
        [$coll, (string) $d['id'], $club, $centre, json_encode($d, JSON_UNESCAPED_UNICODE), now(), now(), $by]);
}

function rec_del(string $coll, string $id): void { q('DELETE FROM records WHERE coll = ? AND id = ?', [$coll, $id]); }

/** Next ID such as CLB0007. Uses a locked counter so two requests never get the same number. */
function next_id(string $coll, string $prefix, int $len = 4): string
{
    $pdo = db();
    $own = !$pdo->inTransaction();
    if ($own) $pdo->beginTransaction();
    try {
        q('INSERT IGNORE INTO seq (coll, n) VALUES (?, 0)', [$coll]);
        $n = (int) q('SELECT n FROM seq WHERE coll = ? FOR UPDATE', [$coll])->fetchColumn();
        $ids = $coll === 'users' ? q('SELECT id FROM users')->fetchAll(PDO::FETCH_COLUMN) : q('SELECT id FROM records WHERE coll = ?', [$coll])->fetchAll(PDO::FETCH_COLUMN);
        foreach ($ids as $id) { $num = (int) preg_replace('/\D/', '', $id); if ($num > $n) $n = $num; }
        $n++;
        q('UPDATE seq SET n = ? WHERE coll = ?', [$n, $coll]);
        if ($own) $pdo->commit();
    } catch (Throwable $e) { if ($own) $pdo->rollBack(); throw $e; }
    return $prefix . str_pad((string) $n, $len, '0', STR_PAD_LEFT);
}

/** Highest number used per collection, so the browser can continue the sequence. */
function seq_snapshot(): array
{
    $out = [];
    foreach (q('SELECT coll, id FROM records')->fetchAll() as $r) {
        $n = (int) preg_replace('/\D/', '', $r['id']);
        if ($n > ($out[$r['coll']] ?? 0)) $out[$r['coll']] = $n;
    }
    foreach (q('SELECT n, coll FROM seq')->fetchAll() as $r) if ((int) $r['n'] > ($out[$r['coll']] ?? 0)) $out[$r['coll']] = (int) $r['n'];
    $u = 0; foreach (q('SELECT id FROM users')->fetchAll(PDO::FETCH_COLUMN) as $id) $u = max($u, (int) preg_replace('/\D/', '', $id));
    $out['users'] = $u;
    return $out;
}

/* ---------- Users ---------- */
function user_by_id(string $id): ?array { $r = q('SELECT * FROM users WHERE id = ?', [$id])->fetch(); return $r ?: null; }
function user_by_email(string $email): ?array { $r = q('SELECT * FROM users WHERE email = ?', [strtolower(trim($email))])->fetch(); return $r ?: null; }

/** User row in the shape the admin portal expects (never includes the password hash). */
function user_public(array $u): array
{
    return [
        'id' => $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'phone' => $u['phone'], 'role' => $u['role'],
        'clubId' => $u['club_id'], 'centreId' => $u['centre_id'], 'status' => $u['status'],
        'twoFactor' => (bool) $u['two_factor'], 'mustChange' => (bool) $u['must_change'],
        'lastLogin' => iso_time($u['last_login']), 'photo' => $u['photo'] ?? '', 'createdAt' => substr((string) $u['created_at'], 0, 10),
    ];
}

/* ---------- Permissions ---------- */
function roles(): array { static $r = null; if ($r === null) $r = settings_get('roles') ?: []; return $r; }
function role_of(array $u): array { return roles()[$u['role']] ?? ['scope' => 'none', 'perms' => []]; }
function scope_of(array $u): string { return role_of($u)['scope'] ?? 'none'; }
function is_super(array $u): bool { return scope_of($u) === 'all'; }

function can(array $u, string $module, string $action = 'view'): bool
{
    if (is_super($u)) return true;
    $p = role_of($u)['perms'][$module] ?? [];
    return in_array($action, $p, true);
}

function can_any(array $u, array $modules, array $actions): bool
{
    foreach ($modules as $m) foreach ($actions as $a) if (can($u, $m, $a)) return true;
    return false;
}

/** Is a record (by its club/centre columns) inside the user's data scope? */
function in_scope(array $u, string $coll, string $clubId, string $centreId): bool
{
    $s = scope_of($u);
    if ($s === 'all') return true;
    if ($coll === 'clubs') return $clubId === $u['club_id'];
    if ($coll === 'centres' && $s === 'centre') return $centreId === $u['centre_id'];
    if ($clubId === '') return true; // platform-wide records (tournaments, shared inventory)
    if ($clubId !== $u['club_id']) return false;
    if ($s === 'centre' && $centreId !== '' && $centreId !== $u['centre_id']) return false;
    return $s === 'club' || $s === 'centre';
}

/** SQL filter that matches in_scope() for reading many records. */
function scope_sql(array $u, string $coll): array
{
    $s = scope_of($u);
    if ($s === 'all') return ['1 = 1', []];
    if ($coll === 'clubs') return ['id = ?', [$u['club_id']]];
    if ($coll === 'centres' && $s === 'centre') return ['id = ?', [$u['centre_id']]];
    if ($s === 'club') return ["(club_id = '' OR club_id = ?)", [$u['club_id']]];
    if ($s === 'centre') return ["(club_id = '' OR (club_id = ? AND (centre_id = '' OR centre_id = ?)))", [$u['club_id'], $u['centre_id']]];
    return ['1 = 0', []];
}

/* ---------- Audit ---------- */
function audit(?array $u, string $action, string $module, string $recordId, string $summary = '', array $changes = []): void
{
    q('INSERT INTO audit_log (at, user_id, user_name, action, module, record_id, summary, changes, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [now(), $u['id'] ?? '', $u['name'] ?? 'System', $action, $module, $recordId, mb_substr($summary, 0, 500), $changes ? json_encode($changes, JSON_UNESCAPED_UNICODE) : null, client_ip()]);
}

function diff_fields(?array $before, array $after): array
{
    $out = [];
    foreach ($after as $k => $v) {
        $a = $before[$k] ?? null;
        if (json_encode($a) === json_encode($v)) continue;
        $fmt = function ($x) { return $x === null ? '' : mb_substr(is_scalar($x) ? (is_bool($x) ? ($x ? 'true' : 'false') : (string) $x) : json_encode($x, JSON_UNESCAPED_UNICODE), 0, 120); };
        $out[] = ['field' => $k, 'from' => $fmt($a), 'to' => $fmt($v)];
    }
    return $out;
}
