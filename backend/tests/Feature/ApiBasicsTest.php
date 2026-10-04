<?php

namespace Tests\Feature;

use Database\Seeders\HubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Uji API dasar yang tidak menyentuh rate limiter login.
 *
 * RefreshDatabase membangun skema di sqlite :memory: tiap test, tanpa itu
 * /api/hubs dan /api/health hanya membaca tabel yang tidak pernah ada.
 *
 * Semua URI ditulis absolut karena helper uji menempelkan path `APP_URL`
 * (subfolder XAMPP) di depan URI relatif.
 */
class ApiBasicsTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_reports_all_systems(): void
    {
        $this->get('http://localhost/api/health')
            ->assertStatus(200)
            ->assertJson(['ok' => true])
            ->assertJsonPath('data.status', 'healthy');
    }

    public function test_public_hubs_endpoint_returns_five_hubs(): void
    {
        $this->seed(HubSeeder::class);

        $this->get('http://localhost/api/hubs')
            ->assertStatus(200)
            ->assertJson(['ok' => true])
            ->assertJsonCount(5, 'data.hubs');
    }

    public function test_protected_endpoint_requires_token(): void
    {
        $this->getJson('http://localhost/api/incidents')
            ->assertStatus(401)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_unknown_route_returns_envelope_404(): void
    {
        $this->getJson('http://localhost/api/rute-tidak-ada')
            ->assertStatus(404)
            ->assertJson(['ok' => false, 'data' => null]);
    }
}
