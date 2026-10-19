<?php
/* D-Clix API — records, users and audit trail used by the website signup, payment and contact form. */
declare(strict_types=1);

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

/* ---------- Users ---------- */
function user_by_id(string $id): ?array { $r = q('SELECT * FROM users WHERE id = ?', [$id])->fetch(); return $r ?: null; }
function user_by_email(string $email): ?array { $r = q('SELECT * FROM users WHERE email = ?', [strtolower(trim($email))])->fetch(); return $r ?: null; }

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
