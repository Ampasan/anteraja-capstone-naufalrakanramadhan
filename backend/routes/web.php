<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
| Backend ini hampir API-only. Satu-satunya halaman HTML adalah
| /lapor-insiden, laporan insiden lapangan untuk kurir yang tidak punya
| akun panel. Root hanya memberi penunjuk singkat supaya buka
| http://.../public/ tidak berakhir 404 kosong.
*/

// Website laporan insiden lapangan (tanpa login) kini menjadi halaman React
// di frontend. Route ini hanya mengalihkan ke SPA supaya ada satu sumber
// tampilan; seluruh laporan tetap lewat endpoint publik /api/lapor/*.
Route::get('/lapor-insiden', function () {
    return redirect(rtrim(config('app.frontend_url'), '/') . '/lapor-insiden');
})->name('lapor.insiden');

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'api' => '/api',
        'health' => '/api/health',
        'docs' => 'API_DOCUMENTATION.md',
    ]);
});

// Serve Laravel Brain assets from vendor (only in local environment)
if (app()->isLocal()) {
    Route::get('_laravel-brain/assets/{file}', function (string $file) {
        $path = base_path('vendor/laramint/laravel-brain/resources/assets/assets/' . $file);
        
        if (! file_exists($path)) {
            abort(404);
        }
        
        $mime = match (pathinfo($file, PATHINFO_EXTENSION)) {
            'js' => 'application/javascript',
            'css' => 'text/css',
            'png' => 'image/png',
            'svg' => 'image/svg+xml',
            'json' => 'application/json',
            default => 'application/octet-stream',
        };
        
        return response()->file($path, ['Content-Type' => $mime]);
    })->where('file', '.*');
    
    Route::get('_laravel-brain/favicon.png', function () {
        $path = base_path('vendor/laramint/laravel-brain/resources/assets/favicon.png');
        
        if (! file_exists($path)) {
            abort(404);
        }
        
        return response()->file($path, ['Content-Type' => 'image/png']);
    });
}
