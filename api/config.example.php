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
];
