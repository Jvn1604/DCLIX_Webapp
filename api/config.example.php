<?php
/* config template. copy to api/config.php and fill in
 * config.php is gitignored, never commit keys (repo is public)
 * php api/install.php makes it for you locally
 */
return [
    // true = show error details (local only!)
    'debug' => false,

    'db' => [
        'dsn'  => 'mysql:host=127.0.0.1;port=3306;dbname=dclix;charset=utf8mb4',
        'user' => 'dclix_app',
        'pass' => 'CHANGE_ME',
    ],

    // website url (emails + after payment)
    'site_url' => 'http://127.0.0.1:8000',
    // api url (billplz callback needs to reach this)
    'api_url'  => 'http://127.0.0.1:8000/api',

    // club login
    'login_url' => 'https://www.maclubsystem.com/index.php?/login/proceed',

    // sites allowed to call the api
    'allowed_origins' => [
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'https://jvn1604.github.io',
    ],

    'billplz' => [
        // 'mock'    = test page, no billplz
        // 'sandbox' = billplz test
        // 'live'    = real money
        'mode'            => 'mock',
        'api_key'         => '',   // Settings > API Secret Key
        'collection_id'   => '',   // Billing > Collection ID
        'x_signature_key' => '',   // Settings > XSignature Key
    ],

    'mail' => [
        // 'log'  = save only, not sent
        // 'smtp' = send
        'driver'     => 'log',
        'from_email' => 'no-reply@example.com',
        'from_name'  => 'D-Clix',
        'sales_to'   => 'sales@example.com',   // sales alerts
        'smtp' => [
            'host' => '', 'port' => 587, 'secure' => 'tls', // tls (587) or ssl (465)
            'user' => '', 'pass' => '',
        ],
    ],
];
