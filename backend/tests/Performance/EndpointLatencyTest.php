<?php

namespace Tests\Performance;

use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Performance\Concerns\MeasuresApiEndpoints;
use Tests\Performance\Fixtures\ScaleSeeder;
use Tests\TestCase;

/**
 * Anggaran waktu tiap endpoint halaman-1: wajib di bawah 1 detik.
 *
 * Dua kondisi diukur terpisah karena keduanya berbeda nyata di lapangan:
 *  - dingin  : cache kosong, request menembus query (ini yang dibayar saat
 *              admin membuka halaman pertama setelah 2 menit tidak ada yang login)
 *  - hangat  : cache terisi, request hanya membaca Redis/array (kondisi
 *              selama polling berjalan tiap 5-10 detik)
 *
 * Angka median dan maksimum dicetak sebagai tabel markdown di akhir kelas,
 * dan angka itulah yang dipakai di docs/TESTING.md — bukan angka tulisan tangan.
 */
class EndpointLatencyTest extends TestCase
{
    use RefreshDatabase;
    use MeasuresApiEndpoints;

    private const BASE = 'http://localhost/api';

    /** Anggaran produk: respon endpoint di bawah 1 detik. */
    private const BUDGET_MS = 1000.0;

    private const RUNS = 5;

    private string $hubId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(DatabaseSeeder::class);
        $this->seed(ScaleSeeder::class);
        $this->authenticateAsAdmin();
    }

    /**
     * Login sungguhan lewat endpoint, lalu pakai tokennya untuk request berikutnya.
     *
     * Sanctum::actingAs tidak bisa dipakai: App\Models\User tidak meng-extend
     * Authenticatable (lihat laporan test), sehingga guard menolak setUser().
     * Login asli justru lebih representatif — biaya verifikasi token ikut terukur.
     */
    private function authenticateAsAdmin(): void
    {
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

    /** Endpoint yang dimuat saat halaman pertama dibuka (login page + panel). */
    private function pageOneEndpoints(): array
    {
        return [
            'GET /api/ping' => self::BASE . '/ping',
            'GET /api/hubs' => self::BASE . '/hubs',
            'GET /api/auth/me' => self::BASE . '/auth/me',
            'GET /api/dashboard/summary' => self::BASE . '/dashboard/summary',
            'GET /api/couriers' => self::BASE . '/couriers',
            'GET /api/orders/sla-risk' => self::BASE . '/orders/sla-risk',
            'GET /api/tugas/tabel (halaman 1)' => self::BASE . '/tugas/tabel?page=1&per_page=8',
            'GET /api/incidents' => self::BASE . '/incidents',
            'GET /api/audit-logs' => self::BASE . '/audit-logs',
            'GET /api/risiko/teratas' => self::BASE . '/risiko/teratas',
        ];
    }

    public function test_page_one_answers_under_one_second_with_cold_cache(): void
    {
        foreach ($this->pageOneEndpoints() as $label => $uri) {
            $measurement = $this->measureEndpoint(
                $label . ' [dingin]',
                fn () => $this->getJson($uri)->assertSuccessful(),
                self::RUNS,
                flushCache: true,
                hubId: $this->hubId,
            );

            $this->assertWithinBudget($measurement, self::BUDGET_MS);
        }
    }

    public function test_page_one_answers_under_one_second_with_warm_cache(): void
    {
        foreach ($this->pageOneEndpoints() as $label => $uri) {
            $measurement = $this->measureEndpoint(
                $label . ' [hangat]',
                fn () => $this->getJson($uri)->assertSuccessful(),
                self::RUNS,
            );

            $this->assertWithinBudget($measurement, self::BUDGET_MS);
        }
    }

    public function test_login_answers_under_one_second_even_with_a_cold_cache(): void
    {
        $measurement = $this->measureEndpoint(
            'POST /api/auth/login [dingin]',
            fn () => $this->postJson(self::BASE . '/auth/login', [
                'email' => 'siti.admin@anteraja.id',
                'password' => 'Anteraja2026!',
                'hub_id' => $this->hubId,
            ])->assertStatus(200),
            self::RUNS,
            flushCache: true,
            hubId: $this->hubId,
        );

        $this->assertWithinBudget($measurement, self::BUDGET_MS);
    }

    public function test_csv_exports_answer_under_one_second_at_scale(): void
    {
        $exports = [
            'GET /api/audit-logs/export?format=csv' => self::BASE . '/audit-logs/export?format=csv',
            'GET /api/incidents/export?format=csv' => self::BASE . '/incidents/export?format=csv',
        ];

        foreach ($exports as $label => $uri) {
            $measurement = $this->measureEndpoint(
                $label,
                fn () => $this->get($uri)->assertSuccessful(),
                self::RUNS,
            );

            $this->assertWithinBudget($measurement, self::BUDGET_MS);
        }
    }
}
