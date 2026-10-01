<?php

namespace App\Services\Auth;

use App\Models\Hub;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Login user dengan email dan password.
     * Mengembalikan data user + token untuk autentikasi API.
     */
    public function login(string $email, string $password, string $hubId): array
    {
        $user = User::where('email', $email)
            ->where('hub_id', $hubId)
            ->first();

        if (!$user || !Hash::check($password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau password salah.'],
            ]);
        }

        if ($user->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'email' => ['Akun Anda tidak aktif. Hubungi administrator.'],
            ]);
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Buat token Sanctum
        $token = $user->createToken('auth-token')->plainTextToken;

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'hub_id' => $user->hub_id,
                'hub_name' => $this->hubName($user->hub_id),
                'role' => 'admin',
            ],
            'token' => $token,
        ];
    }

    /**
     * Logout user dengan revoke token.
     */
    public function logout(User $user): void
    {
        // Hapus token yang sedang digunakan
        $user->tokens()->where('id', $user->currentAccessToken()->id)->delete();
    }

    /**
     * Get data user yang sedang login.
     */
    public function me(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'hub_id' => $user->hub_id,
            'hub_name' => $this->hubName($user->hub_id),
            'role' => 'admin',
        ];
    }

    /**
     * Ambil nama hub (di-cache 5 menit).
     * Data hub hampir tidak berubah, jadi tidak perlu query tiap request —
     * menghemat 1 round-trip (~200ms) di setiap /auth/me dan /auth/login.
     */
    private function hubName(string $hubId): ?string
    {
        return Cache::remember(
            "hub_name_{$hubId}",
            300,
            fn () => Hub::where('id', $hubId)->value('hub_name')
        );
    }
}
