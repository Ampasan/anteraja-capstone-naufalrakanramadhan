<?php

namespace App\Providers;

use App\Models\PersonalAccessToken;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }
    public function boot(): void
    {
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('logout', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
        
        RateLimiter::for('reassign', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Website laporan lapangan (/lapor-insiden) tanpa login: membaca daftar
        // kurir & paket cukup longgar karena hanya menyiapkan pilihan dropdown.
        RateLimiter::for('lapor-read', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Endpoint tulis publik: 6 laporan/menit per IP masih wajar untuk kurir
        // sungguhan, dan cukup ketat untuk menutup pengulangan otomatis.
        RateLimiter::for('lapor-report', function (Request $request) {
            return Limit::perMinute(6)->by($request->ip());
        });
    }
}