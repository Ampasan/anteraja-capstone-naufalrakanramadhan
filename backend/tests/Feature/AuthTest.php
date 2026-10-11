<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\HubSeeder;
use Database\Seeders\UserSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Autentikasi memakai token Sanctum; login asli dipakai di sini supaya alur
 * token -> /auth/me -> logout -> token mati teruji ujung ke ujung.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const LOGIN_URL = 'http://localhost/api/auth/login';
    private const LOGOUT_URL = 'http://localhost/api/auth/logout';

    public function test_login_returns_token_and_profile(): void
    {
        $hub = $this->halimHub();
        $this->seed(UserSeeder::class);

        $response = $this->postJson(self::LOGIN_URL, [
            'email' => 'siti.admin@anteraja.id',
            'password' => 'Anteraja2026!',
            'hub_id' => $hub->id,
        ]);

        $response->assertStatus(200)
            ->assertJson(['ok' => true])
            ->assertJsonStructure(['ok', 'data' => ['token', 'user' => ['id', 'name', 'email', 'hub_id', 'hub_name', 'role']], 'message'])
            ->assertJsonPath('data.user.email', 'siti.admin@anteraja.id')
            ->assertJsonPath('data.user.hub_name', 'Hub Halim - Jakarta Timur');
        $this->assertNotEmpty($response->json('data.token'));
    }

    public function test_login_with_wrong_password_is_rejected(): void
    {
        $hub = $this->halimHub();
        $this->seed(UserSeeder::class);

        $response = $this->postJson(self::LOGIN_URL, [
            'email' => 'siti.admin@anteraja.id',
            'password' => 'salah-bukan-password',
            'hub_id' => $hub->id,
        ]);

        $response->assertStatus(401)
            ->assertJson(['ok' => false, 'data' => null])
            ->assertJsonPath('message', 'Email atau password salah.');
    }

    public function test_login_with_unknown_email_is_rejected(): void
    {
        $hub = $this->halimHub();
        $this->seed(UserSeeder::class);

        $response = $this->postJson(self::LOGIN_URL, [
            'email' => 'tidak.ada@anteraja.id',
            'password' => 'Anteraja2026!',
            'hub_id' => $hub->id,
        ]);

        $response->assertStatus(401)
            ->assertJson(['ok' => false, 'data' => null])
            ->assertJsonPath('message', 'Email atau password salah.');
    }

    public function test_login_with_missing_fields_returns_validation_error(): void
    {
        $this->seed(HubSeeder::class);

        $this->postJson(self::LOGIN_URL, [])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_login_rejects_inactive_account(): void
    {
        $hub = $this->halimHub();
        $this->seed(UserSeeder::class);
        User::create([
            'hub_id' => $hub->id,
            'name' => 'Admin Nonaktif',
            'email' => 'nonaktif@anteraja.id',
            'password_hash' => Hash::make('Anteraja2026!'),
            'role' => 'ADMIN',
            'status' => 'SUSPENDED',
        ]);

        $response = $this->postJson(self::LOGIN_URL, [
            'email' => 'nonaktif@anteraja.id',
            'password' => 'Anteraja2026!',
            'hub_id' => $hub->id,
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('message', 'Akun Anda tidak aktif. Hubungi administrator.');
    }

    /**
     * Login publik wajib punya rate-limit: limiter `login` (5/menit per IP,
     * lihat AppServiceProvider) menutup brute-force password.
     */
    public function test_login_is_rate_limited_after_five_attempts_per_minute(): void
    {
        $hub = $this->halimHub();

        $payload = [
            'email' => 'siti.admin@anteraja.id',
            'password' => 'password-salah',
            'hub_id' => $hub->id,
        ];

        foreach (range(1, 5) as $attempt) {
            $this->postJson(self::LOGIN_URL, $payload)->assertStatus(401);
        }

        $this->postJson(self::LOGIN_URL, $payload)
            ->assertStatus(429)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_me_returns_profile_with_token_and_401_without(): void
    {
        $this->actingAsAdmin();

        $this->getJson('http://localhost/api/auth/me')
            ->assertStatus(200)
            ->assertJsonPath('data.email', 'siti.admin@anteraja.id')
            ->assertJsonPath('data.role', 'admin');

        $this->withToken('token-palsu')->getJson('http://localhost/api/auth/me')
            ->assertStatus(401)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_logout_revokes_the_token_itself(): void
    {
        $hub = $this->halimHub();
        $this->seed(UserSeeder::class);

        $token = $this->postJson(self::LOGIN_URL, [
            'email' => 'siti.admin@anteraja.id',
            'password' => 'Anteraja2026!',
            'hub_id' => $hub->id,
        ])->json('data.token');

        $this->withToken($token)->getJson('http://localhost/api/auth/me')->assertStatus(200);
        $this->withToken($token)->postJson(self::LOGOUT_URL)
            ->assertStatus(200)
            ->assertJson(['ok' => true]);
        $this->withToken($token)->getJson('http://localhost/api/auth/me')->assertStatus(401);
    }

    /**
     * Logout dibatasi 10/menit per user (limiter `logout` di AppServiceProvider).
     * Tiap panggilan memakai token baru karena logout sendiri mencabut tokennya.
     */
    public function test_logout_is_rate_limited_after_ten_calls_per_minute(): void
    {
        $user = $this->halimAdmin();

        foreach (range(1, 10) as $call) {
            $token = $user->createToken('phpunit')->plainTextToken;

            $this->withToken($token)->postJson(self::LOGOUT_URL)->assertStatus(200);
        }

        $token = $user->createToken('phpunit')->plainTextToken;

        $this->withToken($token)->postJson(self::LOGOUT_URL)
            ->assertStatus(429)
            ->assertJson(['ok' => false, 'data' => null]);
    }
}
