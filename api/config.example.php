<?php
/*
 * D-Clix API configuration — TEMPLATE.
 * Copy this file to api/config.php and fill in real values.
 * api/config.php is git-ignored: never commit passwords or API keys (the repo is public).
 * `php api/install.php` creates config.php for you on a local XAMPP machine.
 */
return [
    // true shows error details and returns one-time codes in API responses (local testing only!)
    'debug' => false,

    'db' => [
        'dsn'  => 'mysql:host=127.0.0.1;port=3306;dbname=dclix;charset=utf8mb4',
        'user' => 'dclix_app',
        'pass' => 'CHANGE_ME',
    ],

    // Public address of the website (used in emails and to send people back after paying)
    'site_url' => 'http://127.0.0.1:8000',
    // Public address of this API folder (Billplz must be able to reach the callback here)
    'api_url'  => 'http://127.0.0.1:8000/api',

    // Websites allowed to call this API from the browser (e.g. the GitHub Pages site)
    'allowed_origins' => [
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'https://jvn1604.github.io',
    ],

    'billplz' => [
        // 'mock'    = built-in test payment page, no Billplz account needed
        // 'sandbox' = https://www.billplz-sandbox.com (test money)
        // 'live'    = https://www.billplz.com (real money)
        'mode'            => 'mock',
        'api_key'         => '',   // Billplz → Settings → API Secret Key
        'collection_id'   => '',   // Billplz → Billing → Collection ID
        'x_signature_key' => '',   // Billplz → Settings → XSignature Key
    ],

    'mail' => [
        // 'log'  = save emails in the database + api/storage/mail (shown in Admin → Email Log), nothing is sent
        // 'smtp' = send through the SMTP server below
        'driver'     => 'log',
        'from_email' => 'no-reply@example.com',
        'from_name'  => 'D-Clix',
        'sales_to'   => 'sales@example.com',   // new-signup and payment alerts go here
        'smtp' => [
            'host' => '', 'port' => 587, 'secure' => 'tls', // tls (STARTTLS on 587) or ssl (465)
            'user' => '', 'pass' => '',
        ],
    ],
];
