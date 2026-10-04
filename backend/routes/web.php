<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Backend ini API-only, jadi tidak ada halaman view. Root hanya memberi
| penunjuk singkat supaya buka http://.../public/ tidak berakhir 404 kosong.
*/

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'api' => '/api',
        'health' => '/api/health',
        'docs' => 'API_DOCUMENTATION.md',
    ]);
});
