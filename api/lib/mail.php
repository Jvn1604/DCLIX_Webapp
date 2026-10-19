<?php
/* D-Clix API — email. Driver "log" stores emails only; driver "smtp" sends them. */
declare(strict_types=1);

function esc(string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); }

/** Wrap content in the D-Clix email layout. $rows = [[label, value], …] shown as a table. */
function email_layout(string $title, string $intro, array $rows = [], ?array $button = null, string $outro = ''): string
{
    $table = '';
    if ($rows) {
        $table = '<table style="width:100%;border-collapse:collapse;margin:16px 0">';
        foreach ($rows as $r) $table .= '<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f9fafb;width:40%;font-weight:600">' . esc((string) $r[0]) . '</td><td style="padding:8px 10px;border:1px solid #e5e7eb">' . esc((string) $r[1]) . '</td></tr>';
        $table .= '</table>';
    }
    $btn = $button ? '<p style="margin:22px 0"><a href="' . esc($button[1]) . '" style="background:#de9836;color:#1a1208;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;display:inline-block">' . esc($button[0]) . '</a></p>' : '';
    return '<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111">'
        . '<div style="max-width:600px;margin:0 auto;padding:24px"><div style="background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb">'
        . '<div style="background:#0e0e10;color:#fff;padding:18px 24px;font-size:20px;font-weight:700">D-<span style="color:#de9836">CLIX</span></div>'
        . '<div style="padding:24px"><h1 style="font-size:20px;margin:0 0 12px">' . esc($title) . '</h1><p style="line-height:1.6;margin:0">' . $intro . '</p>' . $table . $btn
        . ($outro ? '<p style="line-height:1.6;color:#4b5563">' . $outro . '</p>' : '') . '</div></div>'
        . '<p style="text-align:center;color:#6b7280;font-size:12px;margin-top:14px">Raig Technologies (M) Sdn Bhd · D-Clix Club Management System</p></div></body></html>';
}

/** Queue/send an email. Never throws: failures are recorded in email_outbox. */
function send_mail(string $to, string $subject, string $html, string $kind, string $relatedId = ''): void
{
    $driver = cfg('mail.driver', 'log');
    q('INSERT INTO email_outbox (kind, to_email, subject, body_html, status, related_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [$kind, $to, mb_substr($subject, 0, 255), $html, 'queued', $relatedId, now()]);
    $id = (int) db()->lastInsertId();
    if ($driver !== 'smtp') {
        $dir = API_ROOT . '/storage/mail';
        if (!is_dir($dir)) @mkdir($dir, 0775, true);
        @file_put_contents($dir . '/' . date('Ymd-His') . '-' . $id . '-' . preg_replace('/\W+/', '_', $kind) . '.html', $html);
        q('UPDATE email_outbox SET status = ? WHERE id = ?', ['logged', $id]);
        return;
    }
    try {
        smtp_send($to, $subject, $html);
        q('UPDATE email_outbox SET status = ?, sent_at = ? WHERE id = ?', ['sent', now(), $id]);
    } catch (Throwable $e) {
        log_line('mail', 'Email ' . $id . ' to ' . $to . ' failed: ' . $e->getMessage());
        q('UPDATE email_outbox SET status = ?, error = ? WHERE id = ?', ['failed', mb_substr($e->getMessage(), 0, 500), $id]);
    }
}

/** Minimal SMTP client (STARTTLS or SSL, AUTH LOGIN). */
function smtp_send(string $to, string $subject, string $html): void
{
    $c = cfg('mail.smtp');
    $host = (string) $c['host']; $port = (int) $c['port']; $secure = $c['secure'] ?? 'tls';
    if ($host === '') throw new RuntimeException('SMTP host is not set in api/config.php');
    $remote = ($secure === 'ssl' ? 'ssl://' : 'tcp://') . $host . ':' . $port;
    $fp = @stream_socket_client($remote, $errno, $errstr, 15);
    if (!$fp) throw new RuntimeException("Cannot connect to $host:$port ($errstr)");
    stream_set_timeout($fp, 15);
    $read = function () use ($fp) { $data = ''; while (($line = fgets($fp, 515)) !== false) { $data .= $line; if (isset($line[3]) && $line[3] === ' ') break; } return $data; };
    $cmd = function (string $c, array $ok) use ($fp, $read) { if ($c !== '') fwrite($fp, $c . "\r\n"); $r = $read(); if (!in_array((int) substr($r, 0, 3), $ok, true)) throw new RuntimeException('SMTP error after "' . explode(' ', $c)[0] . '": ' . trim($r)); return $r; };
    $cmd('', [220]);
    $me = parse_url((string) cfg('site_url'), PHP_URL_HOST) ?: 'localhost';
    $cmd('EHLO ' . $me, [250]);
    if ($secure === 'tls') {
        $cmd('STARTTLS', [220]);
        if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) throw new RuntimeException('Could not start TLS');
        $cmd('EHLO ' . $me, [250]);
    }
    if (($c['user'] ?? '') !== '') { $cmd('AUTH LOGIN', [334]); $cmd(base64_encode($c['user']), [334]); $cmd(base64_encode((string) $c['pass']), [235]); }
    $from = (string) cfg('mail.from_email');
    $cmd('MAIL FROM:<' . $from . '>', [250]);
    $cmd('RCPT TO:<' . $to . '>', [250, 251]);
    $cmd('DATA', [354]);
    $headers = 'From: ' . mb_encode_mimeheader((string) cfg('mail.from_name')) . ' <' . $from . ">\r\n" . 'To: <' . $to . ">\r\n"
        . 'Subject: ' . mb_encode_mimeheader($subject) . "\r\n" . 'Date: ' . date('r') . "\r\n" . 'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . $me . ">\r\n"
        . "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n";
    $msg = $headers . "\r\n" . chunk_split(base64_encode($html)) . "\r\n.";
    $cmd($msg, [250]);
    $cmd('QUIT', [221]);
    fclose($fp);
}
