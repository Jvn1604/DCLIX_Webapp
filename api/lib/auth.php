<?php
/* D-Clix API — sessions and the signed-in user. */
declare(strict_types=1);

function bearer_token(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) if (strcasecmp($k, 'Authorization') === 0) $h = $v;
    }
    return preg_match('/^Bearer\s+([A-Za-z0-9_\-]{20,200})$/', trim($h), $m) ? $m[1] : '';
}

function idle_minutes(bool $remember): int
{
    $s = settings_get('settings') ?: [];
    $mins = max(5, (int) ($s['sessionMinutes'] ?? 30));
    return $remember ? max($mins, 7 * 24 * 60) : $mins; // "Remember me" keeps you signed in for up to 7 idle days
}

function session_create(array $u, bool $remember): string
{
    $token = random_token();
    q('INSERT INTO sessions (token_hash, user_id, remember, created_at, last_seen, ip, agent) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [hash('sha256', $token), $u['id'], $remember ? 1 : 0, now(), now(), client_ip(), client_agent()]);
    q('UPDATE users SET last_login = ?, failed = 0, locked_until = NULL WHERE id = ?', [now(), $u['id']]);
    q('DELETE FROM sessions WHERE last_seen < ?', [date('Y-m-d H:i:s', time() - 8 * 86400)]);
    return $token;
}

/** The signed-in user, or a 401 reply. Also enforces the idle timeout and account/club status. */
function require_user(): array
{
    $token = bearer_token();
    if ($token === '') fail('Please log in.', 401, ['reason' => 'nologin']);
    $hash = hash('sha256', $token);
    $s = q('SELECT * FROM sessions WHERE token_hash = ?', [$hash])->fetch();
    if (!$s) fail('Your session has ended. Please log in again.', 401, ['reason' => 'expired']);
    if (strtotime($s['last_seen']) < time() - idle_minutes((bool) $s['remember']) * 60) {
        q('DELETE FROM sessions WHERE token_hash = ?', [$hash]);
        fail('You were logged out after a period of inactivity.', 401, ['reason' => 'timeout']);
    }
    $u = user_by_id($s['user_id']);
    if (!$u || $u['status'] !== 'Active') {
        q('DELETE FROM sessions WHERE token_hash = ?', [$hash]);
        fail('Your account is not active. Contact your administrator.', 401, ['reason' => 'disabled']);
    }
    if ($u['club_id'] !== '' && !is_super($u)) {
        $club = rec_get('clubs', $u['club_id']);
        if (!$club || ($club['status'] ?? '') !== 'Active') fail('Your club account is not active. Contact D-Clix support.', 401, ['reason' => 'club']);
    }
    if (time() - strtotime($s['last_seen']) > 30) q('UPDATE sessions SET last_seen = ? WHERE token_hash = ?', [now(), $hash]);
    $GLOBALS['SESSION_HASH'] = $hash;
    return $u;
}

function log_login(string $email, bool $ok, string $reason): void
{
    q('INSERT INTO login_log (email, ok, reason, ip, agent, at) VALUES (?, ?, ?, ?, ?, ?)', [mb_substr($email, 0, 190), $ok ? 1 : 0, $reason, client_ip(), client_agent(), now()]);
}

/** Create a one-time code (2FA or password reset). Returns [id, code]. */
function auth_code_create(array $u, string $purpose, int $minutes, bool $remember = false): array
{
    q('UPDATE auth_codes SET used = 1 WHERE user_id = ? AND purpose = ? AND used = 0', [$u['id'], $purpose]);
    $id = bin2hex(random_bytes(32));
    $code = six_digit_code();
    q('INSERT INTO auth_codes (id, user_id, purpose, code_hash, remember, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [$id, $u['id'], $purpose, hash('sha256', $id . $code), $remember ? 1 : 0, date('Y-m-d H:i:s', time() + $minutes * 60)]);
    return [$id, $code];
}

/** Check a one-time code. Returns the code row or an error message string. */
function auth_code_check(string $id, string $code, string $purpose)
{
    $row = q('SELECT * FROM auth_codes WHERE id = ? AND purpose = ?', [$id, $purpose])->fetch();
    if (!$row || $row['used']) return 'This code is no longer valid. Please start again.';
    if (strtotime($row['expires_at']) < time()) return 'This code has expired. Please start again.';
    if ((int) $row['attempts'] >= 5) { q('UPDATE auth_codes SET used = 1 WHERE id = ?', [$id]); return 'Too many wrong codes. Please start again.'; }
    if (!hash_equals($row['code_hash'], hash('sha256', $id . $code))) { q('UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?', [$id]); return 'That code is not correct.'; }
    q('UPDATE auth_codes SET used = 1 WHERE id = ?', [$id]);
    return $row;
}
