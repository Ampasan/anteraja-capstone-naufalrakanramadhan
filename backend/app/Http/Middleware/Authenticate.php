<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;

/**
 * Middleware autentikasi khusus aplikasi ini (Sanctum token, murni API).
 */
class Authenticate extends Middleware
{
    public function handle($request, Closure $next, ...$guards)
    {
        try {
            return parent::handle($request, $next, ...$guards);
        } finally {
            $this->markActiveHub($request);
        }
    }

    private function markActiveHub(Request $request): void
    {
        $hubId = $request->user()?->hub_id;

        if (! $hubId) {
            return;
        }

        try {
            // Satu round-trip Redis per request: add sekaligus berperan sebagai
            // gerbang 120 detik. Sebelumnya `Cache::get('active_hubs')` ikut
            // jalan di tiap request, sehingga dua round-trip untuk pekerjaan
            // yang cuma perlu sekali per gerbang. Daftar `active_hubs` (TTL
            // 600 detik) tetap terisi selama hub aktif, karena gerbang terbuka
            // tiap 120 detik selama request masih masuk.
            if (! Cache::add("active_hub:{$hubId}", 1, 120)) {
                return;
            }

            $active = Cache::get('active_hubs', []);
            if (! in_array($hubId, $active, true)) {
                $active[] = $hubId;
                Cache::put('active_hubs', $active, 600);
            }

            Artisan::queue('cache:warm');
        } catch (\Throwable) {
        }
    }

    protected function redirectTo(Request $request): ?string
    {
        return null;
    }

    protected function unauthenticated($request, array $guards)
    {
        if ($request->expectsJson() || $request->is('api/*')) {
            throw new AuthenticationException(
                'Unauthenticated. Silakan login terlebih dahulu.',
                $guards
            );
        }

        parent::unauthenticated($request, $guards);
    }
}