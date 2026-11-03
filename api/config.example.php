<?php
/* config template. copy to api/config.php and fill in
 * config.php is gitignored, never commit keys (repo is public)
 */
return [
    // true = show error details (local only!)
    'debug' => false,

    // sites allowed to call the api. on the live server keep only the real https site
    'allowed_origins' => [
        'http://127.0.0.1:8000',
        'http://localhost:8000',
        'https://jvn1604.github.io',
    ],

    // ca bundle for https calls, only if php has none (old xampp)
    'ca_bundle' => '',

    // maclub portal api (Website CMS > API Clients). keys only here, never in git
    'portal' => [
        'base'      => 'https://maclubsystem.com',   // no /api/... at the end
        'client_id' => '',
        'secret'    => '',
    ],

    // email + whatsapp after Save Club (to the client and the company). empty = off
    'notify' => [
        'site_url'         => 'https://jvn1604.github.io/DCLIX_Webapp',   // for the status link in messages
        'company_emails'   => [],            // e.g. ['admin@yourcompany.com']
        'company_whatsapp' => [],            // digits with country code, e.g. ['60123456789']
        'from_email'       => '',            // must be a mailbox on the smtp account below
        'from_name'        => 'D-Clix',
        'smtp' => [
            'host'   => '',                  // from the email host, e.g. mail.yourdomain.com
            'port'   => 587,
            'secure' => 'tls',               // 'tls' (587) or 'ssl' (465)
            'user'   => '',
            'pass'   => '',
        ],
        // whatsapp cloud api (meta business manager > whatsapp > api setup). template texts in README
        'whatsapp' => [
            'phone_id'         => '',
            'token'            => '',        // permanent system-user token, never the temporary one
            'template_client'  => 'dclix_registration_saved',
            'template_company' => 'dclix_new_registration',
            'lang'             => 'en',
        ],
    ],
];
