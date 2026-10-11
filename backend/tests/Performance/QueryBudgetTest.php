<?php

namespace Tests\Performance;

use App\Models\Courier;
use App\Models\Order;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Performance\Concerns\MeasuresApiEndpoints;
use Tests\Performance\Fixtures\ScaleSeeder;
use Tests\TestCase;

/**
 * Anggaran jumlah query tiap endpoint (penjaga regresi N+1).
 *
 * Database berada di Supabase (remote): tiap round-trip ±170 ms, jadi jumlah
 * query menentukan langsung apakah sebuah endpoint muat di anggaran 1 detik.
 * Angka di bawah ini dipakai sebagai pagar — bila satu query baru ditambahkan
 * ke jalur suatu endpoint, suite ini merah sebelum waktunya lambat terukur.
 *
 * Pengukuran diambil pada kondisi cache dingin (flush tiap run), yaitu jumlah
 * query terburuk yang bisa dibayar satu request.
 */
class QueryBudgetTest extends TestCase
{
    use RefreshDatabase;
    use MeasuresApiEndpoints;

    private const BASE = 'http://localhost/api';

    /**
     * Angka = hasil pengukuran pada cache dingin (2 query bawaan verifikasi
     * token di sqlite + isi endpoint). Sengaja dibuat ketat: penambahan satu
     * query pun pada jalur endpoint langsung membuat suite merah.
     *
     * @var array<string, int>
     */
    private const BUDGETS = [
        'GET /api/ping' => 0,
        'GET /api/hubs' => 1,
        'GET /api/auth/me' => 3,
        'GET /api/dashboard/summary' => 3,
        'GET /api/couriers' => 5,
        'GET /api/couriers/candidates' => 6,
        'GET /api/orders/sla-risk' => 4,
        'GET /api/tugas/tabel' => 4,
        'GET /api/incidents' => 7,
        'GET /api/audit-logs' => 4,
        'GET /api/risiko/teratas' => 2,
    ];

    private string $hubId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        $this->seed(ScaleSeeder::class);

        // Login sungguhan: App\Models\User bukan Authenticatable, jadi
        // Sanctum::actingAs ditolak guard (lihat EndpointLatencyTest).
        $this->hubId = (string) DB::table('hubs')->where('hub_code', 'HUB-JAKTIM-HALIM')->value('id');

        $token = $this->postJson(self::BASE . '/auth/login', [
            'email' => 'siti.admin@anteraja.id',
            'password' => 'Anteraja2026!',
            'hub_id' => $this->hubId,
        ])
            ->assertStatus(200)
            ->json('data.token');

        $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    public static function tearDownAfterClass(): void
    {
        static::printMeasurements();
        parent::tearDownAfterClass();
    }

    public function test_query_count_per_endpoint_stays_within_budget(): void
    {
        $courier = Courier::where('hub_id', $this->hubId)->firstOrFail();
        $order = Order::where('hub_origin_id', $this->hubId)->firstOrFail();

        $uris = [
            'GET /api/ping' => self::BASE . '/ping',
            'GET /api/hubs' => self::BASE . '/hubs',
            'GET /api/auth/me' => self::BASE . '/auth/me',
            'GET /api/dashboard/summary' => self::BASE . '/dashboard/summary',
            'GET /api/couriers' => self::BASE . '/couriers',
            'GET /api/couriers/candidates' => self::BASE . '/couriers/candidates?exclude_id=' . $courier->id . '&order_id=' . $order->id,
            'GET /api/orders/sla-risk' => self::BASE . '/orders/sla-risk',
            'GET /api/tugas/tabel' => self::BASE . '/tugas/tabel?page=1&per_page=8',
            'GET /api/incidents' => self::BASE . '/incidents',
            'GET /api/audit-logs' => self::BASE . '/audit-logs',
            'GET /api/risiko/teratas' => self::BASE . '/risiko/teratas',
        ];

        foreach ($uris as $label => $uri) {
            $measurement = $this->measureEndpoint(
                $label,
                fn () => $this->getJson($uri)->assertSuccessful(),
                runs: 1,
                flushCache: true,
                hubId: $this->hubId,
            );

            $this->assertLessThanOrEqual(
                self::BUDGETS[$label],
                $measurement['queries'],
                sprintf('%s memakai %d query, anggaran %d', $label, $measurement['queries'], self::BUDGETS[$label]),
            );
        }
    }
}
