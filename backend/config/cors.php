<?php

/*
|--------------------------------------------------------------------------
| Cross-Origin Resource Sharing (CORS) Configuration
|--------------------------------------------------------------------------
|
| Salinan konfigurasi bawaan Laravel dengan satu penyesuaian performa:
| `max_age` dinaikkan dari 0 menjadi 24 jam.
|
| Nilai 0 membuat browser mengirim preflight OPTIONS untuk SETIAP request
| lintas origin (frontend di :5173 memanggil API di :80), sehingga tiap
| panggilan API jadi dua round-trip. Dengan max_age positif hasil preflight
| disimpan browser dan dipakai ulang, tanpa mengubah aturan izin sama sekali.
|
*/

return [

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    'supports_credentials' => false,

];
