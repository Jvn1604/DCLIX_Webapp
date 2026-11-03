<?php
/* email + whatsapp after Save Club, to the client and to the company.
 * all settings in config.php 'notify'. empty = that channel is off.
 * runs after the reply is sent (see json_out_then), so a slow or broken
 * mail server never blocks a registration. errors go to storage/logs/notify-*.log
 */

/** registration saved -> tell both sides. $r = club details + ref */
function notify_signup(array $r): void
{
    $n = (array) cfg('notify', []);
    $link = rtrim((string) ($n['site_url'] ?? ''), '/') . '/arena/payment-status.html?ref=' . rawurlencode($r['ref']);
    $amount = 'RM' . $r['amount'];

    $client = "Hi {$r['headInstructor']},\n\n"
        . "Thank you for registering {$r['clubName']} with D-Clix. We have saved your details.\n\n"
        . "Plan: {$r['plan']} ({$amount})\nClub code: {$r['clubCode']}\nReference: {$r['ref']}\n\n"
        . "Our admin will check and approve your club, usually within 5-10 minutes. "
        . "Once approved you can pay online and your club will be activated.\n\n"
        . "Check your status any time: {$link}\n\n"
        . "Questions? Call or WhatsApp us at +603-7804 1412.\n\nD-Clix | Raig Technologies (M) Sdn Bhd";
    $company = "New club registration waiting for approval.\n\n"
        . "Club: {$r['clubName']}\nClub code: {$r['clubCode']}\nPlan: {$r['plan']} ({$amount})\nSport: {$r['sport']}\n"
        . "Head instructor: {$r['headInstructor']}\nPhone: {$r['phone']}\nEmail: {$r['email']}\n"
        . ($r['promoCode'] !== '' ? "Promo code: {$r['promoCode']}\n" : '')
        . "Reference: {$r['ref']}\n\nPlease approve it in the MAClub portal.";

    send_mail($r['email'], 'Your D-Clix registration is saved', $client);
    foreach ((array) ($n['company_emails'] ?? []) as $to)
        send_mail((string) $to, 'New club registration: ' . $r['clubName'], $company, $r['email']);

    // whatsapp business messages must use templates approved by meta (texts in README)
    $wa = (array) ($n['whatsapp'] ?? []);
    send_whatsapp($r['phone'], (string) ($wa['template_client'] ?? ''), [$r['headInstructor'], $r['clubName'], $r['ref']]);
    foreach ((array) ($n['company_whatsapp'] ?? []) as $to)
        send_whatsapp((string) $to, (string) ($wa['template_company'] ?? ''), [$r['clubName'], $r['clubCode'], $r['plan'], $r['phone'], $r['email']]);
}

/** plain text email over smtp (ssl on 465 or starttls on 587). false = not sent */
function send_mail(string $to, string $subject, string $text, string $replyTo = ''): bool
{
    $s = (array) cfg('notify.smtp', []);
    $from = (string) cfg('notify.from_email', '');
    if (empty($s['host']) || $from === '' || !valid_email($to)) return false;
    $clean = fn($v) => str_replace(["\r", "\n"], ' ', (string) $v);   // no header injection
    $secure = ($s['secure'] ?? 'tls') === 'ssl';
    $port = (int) ($s['port'] ?? ($secure ? 465 : 587));
    $ctx = stream_context_create(['ssl' => array_filter(['cafile' => (string) cfg('ca_bundle', ''), 'verify_peer' => true, 'peer_name' => $s['host']])]);
    $fp = @stream_socket_client(($secure ? 'ssl://' : 'tcp://') . $s['host'] . ':' . $port, $no, $err, 15, STREAM_CLIENT_CONNECT, $ctx);
    if (!$fp) { log_line('notify', "mail: cannot connect ($err)"); return false; }
    stream_set_timeout($fp, 15);

    // send a line, read the reply, check its code
    $say = function (?string $line, string $want) use ($fp): bool {
        if ($line !== null) fwrite($fp, $line . "\r\n");
        $reply = '';
        while (($l = fgets($fp, 515)) !== false) { $reply .= $l; if (($l[3] ?? '') !== '-') break; }
        if (strpos($want, substr($reply, 0, 3)) === false) throw new RuntimeException(trim($reply) ?: 'no reply');
        return true;
    };
    $host = gethostname() ?: 'localhost';
    try {
        $say(null, '220');
        $say("EHLO $host", '250');
        if (!$secure) {
            $say('STARTTLS', '220');
            if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLSv1_2_CLIENT | STREAM_CRYPTO_METHOD_TLSv1_3_CLIENT)) throw new RuntimeException('starttls failed');
            $say("EHLO $host", '250');
        }
        if (!empty($s['user'])) {
            $say('AUTH LOGIN', '334');
            $say(base64_encode((string) $s['user']), '334');
            $say(base64_encode((string) ($s['pass'] ?? '')), '235');
        }
        $say("MAIL FROM:<$from>", '250');
        $say("RCPT TO:<$to>", '250 251');
        $say('DATA', '354');
        $name = $clean(cfg('notify.from_name', 'D-Clix'));
        $head = [
            'Date: ' . date('r'),
            'From: =?UTF-8?B?' . base64_encode($name) . "?= <$from>",
            "To: <$to>",
            'Subject: =?UTF-8?B?' . base64_encode($clean($subject)) . '?=',
            'Message-ID: <' . bin2hex(random_bytes(12)) . '@' . substr(strrchr($from, '@'), 1) . '>',
            'MIME-Version: 1.0',
            'Content-Type: text/plain; charset=UTF-8',
            'Content-Transfer-Encoding: base64',   // base64 body = no line can start with "."
        ];
        if (valid_email($replyTo)) $head[] = "Reply-To: <$replyTo>";
        $say(implode("\r\n", $head) . "\r\n\r\n" . rtrim(chunk_split(base64_encode($text), 76, "\r\n")) . "\r\n.", '250');
        $say('QUIT', '221');
        return true;
    } catch (RuntimeException $e) {
        log_line('notify', 'mail: ' . $e->getMessage());
        return false;
    } finally {
        fclose($fp);
    }
}

/** whatsapp cloud api (meta) template message. $to = digits with country code, e.g. 60123456789 */
function send_whatsapp(string $to, string $template, array $params): bool
{
    $w = (array) cfg('notify.whatsapp', []);
    $to = preg_replace('/\D/', '', $to);
    if (empty($w['phone_id']) || empty($w['token']) || $template === '' || strlen($to) < 8) return false;
    // meta refuses new lines, tabs and long runs of spaces in template values
    $vals = array_map(fn($p) => ['type' => 'text', 'text' => mb_substr(trim(preg_replace('/\s+/', ' ', (string) $p)), 0, 200)], $params);
    $body = json_encode([
        'messaging_product' => 'whatsapp', 'to' => $to, 'type' => 'template',
        'template' => ['name' => $template, 'language' => ['code' => (string) ($w['lang'] ?? 'en')], 'components' => [['type' => 'body', 'parameters' => $vals]]],
    ], JSON_UNESCAPED_UNICODE);
    $ch = curl_init('https://graph.facebook.com/' . ($w['version'] ?? 'v21.0') . '/' . rawurlencode((string) $w['phone_id']) . '/messages');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => $body, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $w['token'], 'Content-Type: application/json'],
    ]);
    if ((string) cfg('ca_bundle', '') !== '') curl_setopt($ch, CURLOPT_CAINFO, (string) cfg('ca_bundle'));
    $res = curl_exec($ch);
    $code = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($code >= 200 && $code < 300) return true;
    // meta's error message only, never the token or the club's details
    $msg = json_decode((string) $res, true)['error']['message'] ?? $err;
    log_line('notify', "whatsapp $template: $code $msg");
    return false;
}
