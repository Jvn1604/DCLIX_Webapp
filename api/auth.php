<?php
/*
 * Admin portal authentication. POST JSON {action, …}:
 *   login {email, password, remember}  → {token, user} or {need2fa, pending}
 *   verify2fa {pending, code}           → {token, user}
 *   forgot {email} / reset {pending, code, password}
 *   me / logout / change_password {current, password}   (need a session)
 */
require __DIR__ . '/lib/init.php';
require_method('POST');

$in = body();
$action = $in['action'] ?? '';
$settings = settings_get('settings') ?: [];
$debug = (bool) cfg('debug');

function session_reply(array $u, bool $remember): never
{
    $token = session_create($u, $remember);
    log_login($u['email'], true, 'Signed in');
    audit($u, 'Login', 'auth', $u['id'], $u['name'] . ' logged in');
    json_out(['token' => $token, 'user' => user_public(user_by_id($u['id']))]);
}

switch ($action) {
    case 'login': {
        $email = strtolower(str_in($in, 'email', 190));
        $pw = is_string($in['password'] ?? null) ? $in['password'] : '';
        $remember = !empty($in['remember']);
        throttle('login:' . client_ip(), 30, 900);
        if (!valid_email($email) || $pw === '') fail('Enter your email and password.', 422);
        $u = user_by_email($email);
        $max = max(3, (int) ($settings['maxFailedLogins'] ?? 5));
        $lockMins = max(1, (int) ($settings['lockMinutes'] ?? 15));
        if ($u && $u['status'] === 'Locked') {
            if ($u['locked_until'] && strtotime($u['locked_until']) <= time()) { q("UPDATE users SET status = 'Active', failed = 0, locked_until = NULL WHERE id = ?", [$u['id']]); $u['status'] = 'Active'; $u['failed'] = 0; }
            else { log_login($email, false, 'Account locked'); $left = $u['locked_until'] ? max(1, (int) ceil((strtotime($u['locked_until']) - time()) / 60)) : $lockMins;
                fail('This account is locked after too many failed attempts. Try again in ' . $left . ' minute(s), or ask an administrator to unlock it.', 423); }
        }
        if (!$u || !password_verify($pw, $u['pw_hash'])) {
            $msg = 'Email or password is incorrect.';
            if ($u) {
                $failed = (int) $u['failed'] + 1;
                if ($failed >= $max) { q("UPDATE users SET failed = ?, status = 'Locked', locked_until = ? WHERE id = ?", [$failed, date('Y-m-d H:i:s', time() + $lockMins * 60), $u['id']]); $msg .= ' The account is now locked for ' . $lockMins . ' minutes.'; }
                else { q('UPDATE users SET failed = ? WHERE id = ?', [$failed, $u['id']]); if ($max - $failed <= 2) $msg .= ' ' . ($max - $failed) . ' attempt(s) left before the account is locked.'; }
            } else {
                password_verify($pw, '$2y$10$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG'); // same timing as a real check
            }
            log_login($email, false, $u ? 'Wrong password' : 'Unknown email');
            fail($msg, 401);
        }
        if ($u['status'] === 'Pending Payment') { log_login($email, false, 'Pending payment'); fail('Your registration is waiting for payment. Please complete payment using the link we emailed you.', 403, ['reason' => 'pending']); }
        if ($u['status'] !== 'Active') { log_login($email, false, 'Account ' . $u['status']); fail('Your account is ' . strtolower($u['status']) . '. Contact your administrator.', 403); }
        if (password_needs_rehash($u['pw_hash'], PASSWORD_DEFAULT)) q('UPDATE users SET pw_hash = ? WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
        if ($u['club_id'] !== '' && $u['role'] !== 'superadmin') {
            $club = rec_get('clubs', $u['club_id']);
            if (!$club || $club['status'] !== 'Active') { log_login($email, false, 'Club not active'); fail(($club['name'] ?? 'Your club') . ' is ' . strtolower($club['status'] ?? 'inactive') . '. Contact D-Clix support.', 403); }
        }
        if ($u['two_factor'] || !empty($settings['require2fa'])) {
            [$id, $code] = auth_code_create($u, '2fa', 5, $remember);
            send_mail($u['email'], 'Your D-Clix verification code', email_layout('Verification code', 'Use this code to finish signing in. It expires in 5 minutes.<br><br><b style="font-size:26px;letter-spacing:4px">' . $code . '</b>', [], null, 'If you did not try to sign in, change your password.'), '2fa', $u['id']);
            json_out(['need2fa' => true, 'pending' => $id] + ($debug ? ['devCode' => $code] : []));
        }
        session_reply($u, $remember);
    }
    case 'verify2fa': {
        throttle('2fa:' . client_ip(), 20, 900);
        $r = auth_code_check(str_in($in, 'pending', 64), str_in($in, 'code', 6), '2fa');
        if (is_string($r)) fail($r, 401);
        $u = user_by_id($r['user_id']);
        if (!$u || $u['status'] !== 'Active') fail('Your account is not active.', 403);
        session_reply($u, (bool) $r['remember']);
    }
    case 'forgot': {
        throttle('forgot:' . client_ip(), 10, 3600);
        $email = strtolower(str_in($in, 'email', 190));
        if (!valid_email($email)) fail('Enter a valid email address.', 422);
        $u = user_by_email($email);
        log_login($email, false, 'Password reset requested');
        $extra = [];
        // Always the same reply, so this form does not reveal which emails have accounts.
        $pending = bin2hex(random_bytes(32));
        if ($u && in_array($u['status'], ['Active', 'Locked'], true)) {
            [$pending, $code] = auth_code_create($u, 'reset', 15);
            send_mail($u['email'], 'Reset your D-Clix password', email_layout('Password reset code', 'Enter this code on the reset page. It expires in 15 minutes.<br><br><b style="font-size:26px;letter-spacing:4px">' . $code . '</b>', [], null, 'If you did not ask for this, you can ignore this email.'), 'reset', $u['id']);
            if ($debug) $extra['devCode'] = $code;
        }
        json_out(['ok' => true, 'pending' => $pending] + $extra);
    }
    case 'reset': {
        throttle('reset:' . client_ip(), 20, 3600);
        $pw = is_string($in['password'] ?? null) ? $in['password'] : '';
        if ($p = password_problem($pw)) fail($p, 422, ['field' => 'password']);
        $r = auth_code_check(str_in($in, 'pending', 64), str_in($in, 'code', 6), 'reset');
        if (is_string($r)) fail('The code is incorrect or has expired.', 401, ['field' => 'code']);
        q("UPDATE users SET pw_hash = ?, failed = 0, must_change = 0, locked_until = NULL, status = IF(status = 'Locked', 'Active', status) WHERE id = ?", [password_hash($pw, PASSWORD_DEFAULT), $r['user_id']]);
        q('DELETE FROM sessions WHERE user_id = ?', [$r['user_id']]);
        $u = user_by_id($r['user_id']);
        audit($u, 'Update', 'auth', $u['id'], 'Password reset with emailed code', [['field' => 'password', 'from' => '••••', 'to' => '•••• (reset)']]);
        json_out(['ok' => true, 'email' => $u['email']]);
    }
    case 'me': {
        $u = require_user();
        json_out(['user' => user_public($u)]);
    }
    case 'logout': {
        $t = bearer_token();
        if ($t !== '') {
            $s = q('SELECT user_id FROM sessions WHERE token_hash = ?', [hash('sha256', $t)])->fetch();
            q('DELETE FROM sessions WHERE token_hash = ?', [hash('sha256', $t)]);
            if ($s && ($u = user_by_id($s['user_id']))) audit($u, 'Logout', 'auth', $u['id'], !empty($in['reason']) ? 'Logged out (' . str_in($in, 'reason', 30) . ')' : 'Logged out');
        }
        json_out(['ok' => true]);
    }
    case 'change_password': {
        $u = require_user();
        $cur = is_string($in['current'] ?? null) ? $in['current'] : '';
        $pw = is_string($in['password'] ?? null) ? $in['password'] : '';
        if (!password_verify($cur, $u['pw_hash'])) fail('Current password is incorrect.', 422, ['field' => 'current']);
        if ($p = password_problem($pw)) fail($p, 422, ['field' => 'password']);
        if (password_verify($pw, $u['pw_hash'])) fail('Choose a password you have not used here.', 422, ['field' => 'password']);
        q('UPDATE users SET pw_hash = ?, must_change = 0 WHERE id = ?', [password_hash($pw, PASSWORD_DEFAULT), $u['id']]);
        q('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?', [$u['id'], $GLOBALS['SESSION_HASH']]);
        audit($u, 'Update', 'users', $u['id'], 'Changed own password', [['field' => 'password', 'from' => '••••', 'to' => '•••• (changed)']]);
        json_out(['ok' => true]);
    }
}
fail('Unknown action.', 404);
