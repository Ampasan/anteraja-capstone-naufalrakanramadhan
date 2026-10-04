<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Sekelompok route dilindungi `auth:sanctum`; daftarnya ditulis eksplisit di
 * provider supaya route terproteksi yang baru gagal bila lupa di sini, dan
 * route yang tidak sengaja jadi publik ketahuan lewat uji 401.
 */
class HealthAndSecurityTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public static function protectedRoutes(): array
    {
        $uuid = '11111111-1111-4111-8111-111111111111';

        return [
            'GET /auth/me' => ['GET', 'http://localhost/api/auth/me'],
            'GET /dashboard/summary' => ['GET', 'http://localhost/api/dashboard/summary'],
            'GET /couriers' => ['GET', 'http://localhost/api/couriers'],
            'GET /couriers/candidates' => ['GET', 'http://localhost/api/couriers/candidates'],
            'GET /couriers/{id}' => ['GET', "http://localhost/api/couriers/{$uuid}"],
            'GET /orders/sla-risk' => ['GET', 'http://localhost/api/orders/sla-risk'],
            'GET /risiko/teratas' => ['GET', 'http://localhost/api/risiko/teratas'],
            'GET /tugas/tabel' => ['GET', 'http://localhost/api/tugas/tabel'],
            'GET /incidents' => ['GET', 'http://localhost/api/incidents'],
            'GET /incidents/export' => ['GET', 'http://localhost/api/incidents/export'],
            'GET /tasks/{id}' => ['GET', "http://localhost/api/tasks/{$uuid}"],
            'GET /audit-logs' => ['GET', 'http://localhost/api/audit-logs'],
            'GET /audit-logs/export' => ['GET', 'http://localhost/api/audit-logs/export'],
            'POST /auth/logout' => ['POST', 'http://localhost/api/auth/logout'],
            'POST /couriers/{id}/telemetry' => ['POST', "http://localhost/api/couriers/{$uuid}/telemetry"],
            'POST /incidents' => ['POST', 'http://localhost/api/incidents'],
            'POST /incidents/{id}/reassign' => ['POST', "http://localhost/api/incidents/{$uuid}/reassign"],
            'POST /incidents/{id}/upload-evidence' => ['POST', "http://localhost/api/incidents/{$uuid}/upload-evidence"],
        ];
    }

    public function test_ping_answers_the_success_envelope(): void
    {
        $this->getJson(self::BASE . '/ping')
            ->assertStatus(200)
            ->assertJson(['ok' => true, 'data' => 'pong', 'message' => 'OK']);
    }

    public function test_health_reports_status_and_every_check(): void
    {
        $response = $this->getJson(self::BASE . '/health');

        $response->assertJsonStructure(['ok', 'data' => ['status', 'timestamp', 'checks' => [
            'database' => ['status'],
            'redis' => ['status'],
            'cache' => ['status'],
            'queue' => ['status'],
        ]]]);

        $ok = $response->json('ok');
        $this->assertSame($ok, $response->json('data.status') === 'healthy');
        $this->assertContains($response->json('data.status'), ['healthy', 'unhealthy']);
        $this->assertSame($ok ? 200 : 503, $response->status());
    }

    #[DataProvider('protectedRoutes')]
    public function test_protected_route_rejects_request_without_token(string $method, string $url): void
    {
        $response = $method === 'GET'
            ? $this->getJson($url)
            : $this->postJson($url, []);

        $response->assertStatus(401)->assertJson(['ok' => false, 'data' => null]);
    }

    #[DataProvider('protectedRoutes')]
    public function test_protected_route_never_fails_with_valid_token(string $method, string $url): void
    {
        $this->actingAsAdmin();
        // Papan peringkat membaca Redis; dimock supaya uji tidak butuh server.
        Redis::shouldReceive('zrevrange')->andReturn([]);

        $response = $method === 'GET'
            ? $this->getJson($url)
            : $this->postJson($url, []);

        $this->assertLessThan(500, $response->getStatusCode(), $method . ' ' . $url . ' -> ' . $response->getContent());
    }

    public function test_wrong_token_is_rejected(): void
    {
        $this->withToken('bukan-token-asli')->getJson(self::BASE . '/auth/me')
            ->assertStatus(401)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_method_not_allowed_answers_405_envelope(): void
    {
        $this->deleteJson(self::BASE . '/ping')
            ->assertStatus(405)
            ->assertJson(['ok' => false, 'data' => null]);

        $this->putJson(self::BASE . '/hubs')
            ->assertStatus(405)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_public_routes_stay_reachable_without_token(): void
    {
        $this->getJson(self::BASE . '/ping')->assertStatus(200);
        $this->getJson(self::BASE . '/health')->assertStatus(200);
        $this->seed(\Database\Seeders\HubSeeder::class);
        $this->getJson(self::BASE . '/hubs')->assertStatus(200);
        $this->postJson(self::BASE . '/auth/login', [])->assertStatus(422);
    }
}
