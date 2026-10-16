<?php
/*
 * Admin portal data.
 *   GET  ?action=bootstrap      → everything the signed-in user may see (filtered by role + club/centre)
 *   GET  ?action=email&id=N     → one email's HTML (Email Log)
 *   POST {action: "sync", ops}  → save changes; every op is checked against permissions and scope
 */
require __DIR__ . '/lib/init.php';

$u = require_user();
$action = $_GET['action'] ?? (body()['action'] ?? '');

if ($action === 'bootstrap') {
    $out = ['user' => user_public($u), 'settings' => settings_get('settings'), 'roles' => roles(), 'plans' => plans(), 'seq' => seq_snapshot(), 'collections' => [],
        'server' => ['payments' => billplz_mode(), 'mail' => cfg('mail.driver', 'log')]];
    foreach (COLLECTIONS as $coll => $c) {
        if ($c['read'] !== null && !can_any($u, $c['read'], ['view'])) { $out['collections'][$coll] = []; continue; }
        [$where, $params] = scope_sql($u, $coll);
        $rows = q("SELECT data FROM records WHERE coll = ? AND $where ORDER BY created_at DESC, id DESC", array_merge([$coll], $params))->fetchAll(PDO::FETCH_COLUMN);
        $out['collections'][$coll] = array_map(fn($r) => json_decode($r, true), $rows);
    }

    // Users: everyone at your club (for names), all users for Super Admin. Never password hashes.
    $users = is_super($u) ? q('SELECT * FROM users ORDER BY id')->fetchAll()
        : q("SELECT * FROM users WHERE id = ? OR (? <> '' AND club_id = ? AND role <> 'superadmin') ORDER BY id", [$u['id'], $u['club_id'], $u['club_id']])->fetchAll();
    $out['collections']['users'] = array_map('user_public', $users);
    $clubEmails = array_map(fn($x) => $x['email'], $users);
    $clubIds = array_map(fn($x) => $x['id'], $users);

    $out['collections']['audit'] = [];
    $out['collections']['logins'] = [];
    if (can($u, 'audit', 'view')) {
        $rows = is_super($u) ? q('SELECT * FROM audit_log ORDER BY id DESC LIMIT 2000')->fetchAll()
            : ($clubIds ? q('SELECT * FROM audit_log WHERE user_id IN (' . implode(',', array_fill(0, count($clubIds), '?')) . ') ORDER BY id DESC LIMIT 2000', $clubIds)->fetchAll() : []);
        $out['collections']['audit'] = array_map(fn($a) => ['id' => 'AU' . $a['id'], 'at' => iso_time($a['at']), 'user' => $a['user_name'], 'userId' => $a['user_id'], 'action' => $a['action'],
            'module' => $a['module'], 'recordId' => $a['record_id'], 'summary' => $a['summary'], 'changes' => $a['changes'] ? json_decode($a['changes'], true) : [], 'ip' => $a['ip']], $rows);
        $rows = is_super($u) ? q('SELECT * FROM login_log ORDER BY id DESC LIMIT 1000')->fetchAll()
            : ($clubEmails ? q('SELECT * FROM login_log WHERE email IN (' . implode(',', array_fill(0, count($clubEmails), '?')) . ') ORDER BY id DESC LIMIT 1000', $clubEmails)->fetchAll() : []);
        $out['collections']['logins'] = array_map(fn($l) => ['email' => $l['email'], 'ok' => (bool) $l['ok'], 'reason' => $l['reason'], 'at' => iso_time($l['at']), 'agent' => $l['agent'], 'ip' => $l['ip']], $rows);
    }
    // Payment attempts (one Billplz bill per attempt) — platform sales data
    $out['collections']['bills'] = [];
    if (is_super($u) && can($u, 'leads', 'view')) {
        $rows = q('SELECT bill_id, subscription_id, lead_id, club_id, amount_cents, state, paid, gateway, created_at, paid_at, processed_at FROM bills ORDER BY created_at DESC LIMIT 2000')->fetchAll();
        $out['collections']['bills'] = array_map(fn($b) => ['id' => $b['bill_id'], 'subscriptionId' => $b['subscription_id'], 'leadId' => $b['lead_id'], 'clubId' => $b['club_id'],
            'amount' => $b['amount_cents'] / 100, 'state' => $b['state'], 'paid' => (bool) $b['paid'], 'gateway' => $b['gateway'], 'createdAt' => iso_time($b['created_at']),
            'paidAt' => iso_time($b['paid_at']), 'processedAt' => iso_time($b['processed_at'])], $rows);
    }
    $out['collections']['emails'] = [];
    if (can($u, 'emails', 'view')) {
        $rows = q('SELECT id, kind, to_email, subject, status, error, related_id, created_at, sent_at FROM email_outbox ORDER BY id DESC LIMIT 500')->fetchAll();
        $out['collections']['emails'] = array_map(fn($e) => ['id' => 'EM' . $e['id'], 'kind' => $e['kind'], 'to' => $e['to_email'], 'subject' => $e['subject'], 'status' => $e['status'],
            'error' => $e['error'], 'relatedId' => $e['related_id'], 'createdAt' => iso_time($e['created_at']), 'sentAt' => iso_time($e['sent_at'])], $rows);
    }
    json_out($out);
}

if ($action === 'email') {
    if (!can($u, 'emails', 'view')) fail('Not allowed.', 403);
    $id = (int) preg_replace('/\D/', '', (string) ($_GET['id'] ?? ''));
    $html = q('SELECT body_html FROM email_outbox WHERE id = ?', [$id])->fetchColumn();
    if ($html === false) fail('Email not found.', 404);
    json_out(['html' => $html]);
}

/* Remove every simulated signup (test payment mode only): leads, clubs, centres, logins, invoices, bills, emails. */
if ($action === 'purge_tests') {
    require_method('POST');
    if (!is_super($u)) fail('Only a Super Admin can remove test signups.', 403);
    if (billplz_mode() !== 'mock') fail('Test signups can only be removed while payments are in test mode.', 409);
    $leads = array_map(fn($r) => json_decode($r, true), q("SELECT data FROM records WHERE coll = 'leads' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.source')) = 'Simulated test'")->fetchAll(PDO::FETCH_COLUMN));
    $pdo = db(); $pdo->beginTransaction();
    try {
        foreach ($leads as $l) {
            $subs = q("SELECT id FROM records WHERE coll = 'subscriptions' AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.leadId')) = ?", [$l['id']])->fetchAll(PDO::FETCH_COLUMN);
            if (!empty($l['clubId'])) {
                $club = rec_get('clubs', $l['clubId']);
                if ($club && ($club['source'] ?? '') === 'Simulated test') {
                    q('DELETE FROM records WHERE club_id = ? AND coll <> ?', [$l['clubId'], 'leads']);
                    rec_del('clubs', $l['clubId']);
                }
            }
            if (!empty($l['userId'])) { q('DELETE FROM sessions WHERE user_id = ?', [$l['userId']]); q("DELETE FROM users WHERE id = ? AND role = 'clubadmin'", [$l['userId']]); }
            foreach ($subs as $s) { rec_del('subscriptions', $s); q('DELETE FROM email_outbox WHERE related_id = ?', [$s]); }
            q('DELETE FROM bills WHERE lead_id = ?', [$l['id']]);
            q('DELETE FROM signup_tokens WHERE lead_id = ?', [$l['id']]);
            q('DELETE FROM email_outbox WHERE related_id = ?', [$l['id']]);
            rec_del('leads', $l['id']);
        }
        audit($u, 'Delete', 'leads', '', 'Removed ' . count($leads) . ' simulated test signup(s)');
        $pdo->commit();
    } catch (Throwable $e) { $pdo->rollBack(); throw $e; }
    json_out(['ok' => true, 'removed' => count($leads)]);
}

if ($action !== 'sync') fail('Unknown action.', 404);
require_method('POST');

class OpError extends RuntimeException {}
function deny(string $msg): never { throw new OpError($msg); }

$ops = body()['ops'] ?? [];
if (!is_array($ops) || count($ops) > 2000) fail('Invalid request.', 400);
$results = [];
foreach ($ops as $i => $o) {
    try {
        if (!is_array($o)) deny('Invalid change.');
        $pdo = db();
        $pdo->beginTransaction();
        try { $res = apply_op($u, $o); $pdo->commit(); }
        catch (Throwable $e) { $pdo->rollBack(); throw $e; }
        $results[] = ['i' => $i, 'ok' => true] + $res;
    } catch (OpError $e) {
        $results[] = ['i' => $i, 'ok' => false, 'error' => $e->getMessage()];
    } catch (Throwable $e) {
        log_line('error', 'sync op ' . json_encode(['op' => $o['op'] ?? '', 'coll' => $o['coll'] ?? '']) . ': ' . $e->getMessage());
        $results[] = ['i' => $i, 'ok' => false, 'error' => 'The server could not save this change.' . (cfg('debug') ? ' ' . $e->getMessage() : '')];
    }
}
json_out(['results' => $results]);

/* ---------------------------------------------------------------- */

function valid_id($id): string
{
    if (!is_string($id) || !preg_match('/^[A-Za-z0-9_\-]{1,40}$/', $id)) deny('Invalid record ID.');
    return $id;
}

function apply_op(array $u, array $o): array
{
    switch ($o['op'] ?? '') {
        case 'put': return op_put($u, $o);
        case 'del': return op_del($u, $o);
        case 'user': return op_user($u, $o);
        case 'userDel': return op_user_del($u, $o);
        case 'settings': return op_settings($u, $o);
        case 'roles': return op_roles($u, $o);
        case 'audit': return op_audit($u, $o);
    }
    deny('Unknown change type.');
}

function op_put(array $u, array $o): array
{
    $coll = (string) ($o['coll'] ?? '');
    if (!isset(COLLECTIONS[$coll])) deny('Unknown data type "' . $coll . '".');
    $cfg = COLLECTIONS[$coll];
    $rec = $o['rec'] ?? null;
    if (!is_array($rec)) deny('Invalid record.');
    $id = valid_id($rec['id'] ?? null);
    if (strlen(json_encode($rec)) > 400000) deny('This record is too large (photos must be under 300 KB).');
    if (!can_any($u, $cfg['write'], ['create', 'edit', 'approve'])) deny('Your role cannot change ' . $coll . '.');

    $old = rec_get($coll, $id);
    if (!empty($o['isNew']) && $old) deny('Another user already created ' . $id . '. Please reload the page and try again.');
    if ($old) {
        [$oc, $oce] = rec_scope_cols($coll, $old);
        if (!in_scope($u, $coll, $oc, $oce)) deny('You cannot change records outside your club or centre.');
        $rec = array_merge($old, $rec); // fields the browser did not send are kept
    }

    if (!is_super($u)) {
        if ($coll === 'clubs') {
            if (!$old) deny('Only D-Clix administrators can create clubs.');
            foreach (['plan', 'billing', 'subStart', 'subEnd', 'status', 'clubCode'] as $k) if (array_key_exists($k, $old)) $rec[$k] = $old[$k]; else unset($rec[$k]);
        }
        [$c, $ce] = rec_scope_cols($coll, $rec);
        if ($c === '' && $coll !== 'clubs') {
            if (empty($cfg['shared'])) {
                if ($old) deny('Only D-Clix administrators can change platform-wide ' . $coll . '.');
                if (array_key_exists('clubId', $rec)) $rec['clubId'] = $u['club_id'];
            }
        } elseif (!in_scope($u, $coll, $c, $ce)) {
            deny('You cannot save records for another club or centre.');
        }
    }
    if ($coll === 'clubs' && !$old && is_super($u)) $rec['createdAt'] = $rec['createdAt'] ?? today();

    rec_put($coll, $rec, $u['id']);
    $summary = mb_substr((string) ($o['summary'] ?? ''), 0, 300);
    if ($old) { $ch = diff_fields($old, $rec); if ($ch) audit($u, 'Update', $coll, $id, $summary, $ch); }
    else audit($u, 'Create', $coll, $id, $summary !== '' ? $summary : 'Created ' . ($rec['name'] ?? $rec['title'] ?? $id));
    return ['rec' => $rec];
}

function op_del(array $u, array $o): array
{
    $coll = (string) ($o['coll'] ?? '');
    if (!isset(COLLECTIONS[$coll])) deny('Unknown data type.');
    $id = valid_id($o['id'] ?? null);
    if (!can_any($u, COLLECTIONS[$coll]['write'], ['delete'])) deny('Your role cannot delete ' . $coll . '.');
    $old = rec_get($coll, $id);
    if (!$old) return [];
    [$oc, $oce] = rec_scope_cols($coll, $old);
    if (!in_scope($u, $coll, $oc, $oce) || ($coll === 'clubs' && !is_super($u))) deny('You cannot delete this record.');
    if (!is_super($u) && $oc === '' && empty(COLLECTIONS[$coll]['shared'])) deny('Only D-Clix administrators can delete platform-wide records.');
    rec_del($coll, $id);
    audit($u, 'Delete', $coll, $id, 'Deleted ' . ($old['name'] ?? $old['title'] ?? $id), array_map(fn($c) => ['field' => $c['field'], 'from' => $c['to'], 'to' => ''], diff_fields([], $old)));
    return [];
}

function op_user(array $u, array $o): array
{
    $r = $o['rec'] ?? null;
    if (!is_array($r)) deny('Invalid user.');
    $id = valid_id($r['id'] ?? null);
    $old = user_by_id($id);
    if (!empty($o['isNew']) && $old) deny('Another user already has ID ' . $id . '. Please reload and try again.');
    $self = $old && $old['id'] === $u['id'];

    $name = trim((string) ($r['name'] ?? ''));
    $email = strtolower(trim((string) ($r['email'] ?? '')));
    $role = (string) ($r['role'] ?? '');
    $status = (string) ($r['status'] ?? 'Active');
    $phone = mb_substr(trim((string) ($r['phone'] ?? '')), 0, 40);
    $photo = (string) ($r['photo'] ?? '');
    if ($photo !== '' && (strlen($photo) > 420000 || !str_starts_with($photo, 'data:image/'))) deny('Profile photo must be an image under 300 KB.');

    $selfOnly = $self && $email === $old['email'] && $role === $old['role'] && $status === $old['status']
        && (string) ($r['clubId'] ?? '') === $old['club_id'] && (string) ($r['centreId'] ?? '') === $old['centre_id'] && empty($o['password']);
    if (!$selfOnly && !can($u, 'users', $old ? 'edit' : 'create')) deny('Your role cannot manage users.');
    if ($self && ($role !== $old['role'] || $status !== $old['status'])) deny('You cannot change your own role or status.');
    if ($name === '') deny('Name is required.');
    if (!valid_email($email)) deny('Please enter a valid email address.');
    if (!isset(roles()[$role])) deny('Unknown role.');
    if (!in_array($status, ['Active', 'Inactive', 'Locked', 'Pending Payment'], true)) deny('Unknown status.');
    $dup = q('SELECT id FROM users WHERE email = ? AND id <> ?', [$email, $id])->fetchColumn();
    if ($dup) deny('Email ' . $email . ' is already used by another user.');

    $club = (string) ($r['clubId'] ?? ''); $centre = (string) ($r['centreId'] ?? '');
    if ($centre !== '') { $cr = rec_get('centres', $centre); if (!$cr) deny('Training centre not found.'); $club = $cr['clubId']; }
    $scope = roles()[$role]['scope'] ?? 'none';
    if ($scope === 'all') { $club = ''; $centre = ''; }
    if ($scope === 'club') $centre = '';
    if ($scope === 'centre' && $centre === '') deny('Choose a training centre for this role.');
    if ($scope !== 'all' && $club === '') deny('Choose the club this user belongs to.');
    if (!is_super($u)) {
        if ($scope === 'all') deny('Only a Super Admin can create Super Admins.');
        if ($old && ($old['club_id'] !== $u['club_id'] || $old['role'] === 'superadmin')) deny('You can only manage users in your own club.');
        $club = $u['club_id'];
        if ($centre !== '' && (rec_get('centres', $centre)['clubId'] ?? '') !== $u['club_id']) deny('That centre belongs to another club.');
    }
    if ($old && $old['role'] === 'superadmin' && ($role !== 'superadmin' || $status !== 'Active')) {
        $n = (int) q("SELECT COUNT(*) FROM users WHERE role = 'superadmin' AND status = 'Active' AND id <> ?", [$id])->fetchColumn();
        if ($n < 1) deny('There must always be at least one active Super Admin.');
    }
    $pw = is_string($o['password'] ?? null) ? $o['password'] : '';
    if (!$old && $pw === '') deny('A temporary password is required for new users.');
    if ($pw !== '' && ($p = password_problem($pw))) deny($p);

    $fields = ['email' => $email, 'name' => mb_substr($name, 0, 120), 'phone' => $phone, 'role' => $role, 'club_id' => $club, 'centre_id' => $centre, 'status' => $status,
        'two_factor' => !empty($r['twoFactor']) ? 1 : 0, 'must_change' => $selfOnly ? (int) $old['must_change'] : (!empty($r['mustChange']) ? 1 : 0), 'photo' => $photo];
    if ($status === 'Active' && $old && $old['status'] === 'Locked') { $fields['failed'] = 0; $fields['locked_until'] = null; }
    if ($pw !== '') { $fields['pw_hash'] = password_hash($pw, PASSWORD_DEFAULT); $fields['must_change'] = 1; }
    if ($old) {
        $sets = implode(', ', array_map(fn($k) => "$k = ?", array_keys($fields)));
        q("UPDATE users SET $sets WHERE id = ?", array_merge(array_values($fields), [$id]));
        if ($pw !== '' || $status !== 'Active') q('DELETE FROM sessions WHERE user_id = ?' . ($self ? ' AND token_hash <> ?' : ''), $self ? [$id, $GLOBALS['SESSION_HASH']] : [$id]);
        $before = user_public($old); $after = user_public(user_by_id($id));
        $ch = diff_fields($before, $after);
        if ($pw !== '') $ch[] = ['field' => 'password', 'from' => '••••', 'to' => '•••• (reset)'];
        if ($ch) audit($u, 'Update', 'users', $id, (string) ($o['summary'] ?? ''), $ch);
    } else {
        $fields['id'] = $id; $fields['created_at'] = now();
        q('INSERT INTO users (' . implode(', ', array_keys($fields)) . ') VALUES (' . implode(', ', array_fill(0, count($fields), '?')) . ')', array_values($fields));
        audit($u, 'Create', 'users', $id, 'Created user ' . $name . ' (' . $role . ')');
    }
    return ['rec' => user_public(user_by_id($id))];
}

function op_user_del(array $u, array $o): array
{
    $id = valid_id($o['id'] ?? null);
    if (!can($u, 'users', 'delete')) deny('Your role cannot delete users.');
    if ($id === $u['id']) deny('You cannot delete your own account.');
    $old = user_by_id($id);
    if (!$old) return [];
    if (!is_super($u) && ($old['club_id'] !== $u['club_id'] || $old['role'] === 'superadmin')) deny('You can only delete users in your own club.');
    if ($old['role'] === 'superadmin' && (int) q("SELECT COUNT(*) FROM users WHERE role = 'superadmin' AND id <> ?", [$id])->fetchColumn() < 1) deny('There must always be at least one Super Admin.');
    q('DELETE FROM sessions WHERE user_id = ?', [$id]);
    q('DELETE FROM users WHERE id = ?', [$id]);
    audit($u, 'Delete', 'users', $id, 'Deleted user ' . $old['name'] . ' (' . $old['email'] . ')');
    return [];
}

function op_settings(array $u, array $o): array
{
    if (!can($u, 'settings', 'edit')) deny('Your role cannot change settings.');
    $v = $o['value'] ?? null;
    if (!is_array($v) || strlen(json_encode($v)) > 200000) deny('Invalid settings.');
    foreach (['sessionMinutes' => [5, 480], 'maxFailedLogins' => [3, 20], 'lockMinutes' => [1, 1440]] as $k => [$lo, $hi]) $v[$k] = min($hi, max($lo, (int) ($v[$k] ?? $lo)));
    $old = settings_get('settings') ?: [];
    settings_put('settings', $v);
    $ch = array_map(fn($c) => ['field' => $c['field'], 'from' => mb_substr($c['from'], 0, 100), 'to' => mb_substr($c['to'], 0, 100)], diff_fields($old, $v));
    if ($ch) audit($u, 'Update', 'settings', 'settings', (string) ($o['summary'] ?? 'Updated settings'), $ch);
    return ['value' => $v];
}

function op_roles(array $u, array $o): array
{
    if (!can($u, 'roles', 'edit')) deny('Your role cannot change permissions.');
    $v = $o['value'] ?? null;
    $cur = roles();
    if (!is_array($v)) deny('Invalid roles.');
    $actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
    foreach ($cur as $key => $role) {
        if ($key === 'superadmin' || !isset($v[$key]['perms']) || !is_array($v[$key]['perms'])) continue;
        $perms = [];
        foreach ($v[$key]['perms'] as $mod => $acts) {
            if (!is_string($mod) || !is_array($acts)) continue;
            $perms[$mod] = array_values(array_intersect($actions, $acts));
        }
        $ch = [];
        foreach ($perms as $mod => $acts) { $was = $role['perms'][$mod] ?? []; if ($was !== $acts) $ch[] = ['field' => $mod, 'from' => implode(', ', $was), 'to' => implode(', ', $acts)]; }
        $cur[$key]['perms'] = $perms;
        if ($ch) audit($u, 'Update', 'roles', $key, 'Changed permissions for ' . $role['name'], $ch);
    }
    settings_put('roles', $cur);
    return ['value' => $cur];
}

function op_audit(array $u, array $o): array
{
    $action = (string) ($o['action'] ?? '');
    if (!in_array($action, ['Export', 'View', 'Email', 'Print'], true)) deny('Invalid audit entry.');
    audit($u, $action, mb_substr((string) ($o['module'] ?? ''), 0, 40), mb_substr((string) ($o['recordId'] ?? ''), 0, 60), (string) ($o['summary'] ?? ''));
    return [];
}
