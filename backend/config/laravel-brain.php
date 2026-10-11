<?php

/*
|--------------------------------------------------------------------------
| Laravel Brain — konfigurasi aplikasi
|--------------------------------------------------------------------------
| Hanya bagian yang perlu di-override; sisanya tetap dari config bawaan
| paket (di-merge otomatis oleh mergeConfigFrom).
*/

return [

    'security' => [

        // Route yang autentikasinya bukan lewat middleware Laravel, sehingga
        // analisis keamanan tidak boleh menandainya sebagai PUBLIC_WRITE.
        //
        // POST /api/auth/login memang wajib terbuka tanpa token — kredensial
        // itulah yang diverifikasi di dalam controller. Risiko nyatanya
        // (brute-force) ditutup lewat `throttle:login` di routes/api.php.
        'trusted_route_uris' => [
            'auth/login',
            'api/auth/login',
        ],
    ],
];
