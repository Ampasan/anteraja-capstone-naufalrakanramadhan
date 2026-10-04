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
            $justBecameActive = Cache::add("active_hub:{$hubId}", 1, 120);

            $active = Cache::get('active_hubs', []);
            if (! in_array($hubId, $active, true)) {
                $active[] = $hubId;
                Cache::put('active_hubs', $active, 600);
            }
            if ($justBecameActive) {
                Artisan::queue('cache:warm');
            }
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