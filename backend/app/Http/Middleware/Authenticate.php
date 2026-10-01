<?php

namespace App\Http\Middleware;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

/**
 * Middleware autentikasi khusus aplikasi ini (Sanctum token, murni API).
 *
 * Terdaftar sebagai alias `auth` di bootstrap/app.php sehingga dipakai oleh
 * semua route `auth:sanctum`, bukan bawaan framework.
 */
class Authenticate extends Middleware
{
    /**
     * Aplikasi tidak punya route web `login`, jadi tidak ada tujuan redirect.
     * Mengembalikan null mencegah RouteNotFoundException pada request non-JSON.
     */
    protected function redirectTo(Request $request): ?string
    {
        return null;
    }

    /**
     * Tolak request yang belum login.
     *
     * PENTING: method ini harus MELEMPAR exception. Nilai kembaliannya diabaikan
     * oleh authenticate(); jika hanya mengembalikan response, request akan
     * diteruskan ke controller dalam keadaan user null.
     *
     * Pesannya dibungkus envelope oleh renderer exception di bootstrap/app.php.
     */
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
