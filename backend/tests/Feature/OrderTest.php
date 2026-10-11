<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Services\Order\SlaRiskService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Redis;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Panel SLA memakai cache per kunci turunan; papan peringkat membaca sorted
 * set Redis (dimock di sini supaya hasilnya deterministik).
 */
class OrderTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public function test_sla_risk_returns_orders_with_consistent_summary(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/orders/sla-risk')->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'orders',
                    'summary' => ['kritis', 'waspada', 'aman', 'total'],
                ],
                'message',
            ]);

        $orders = $response->json('data.orders');
        $summary = $response->json('data.summary');

        $this->assertNotEmpty($orders);
        $this->assertSame(count($orders), $summary['total']);
        $this->assertSame($summary['kritis'] + $summary['waspada'] + $summary['aman'], $summary['total']);

        foreach ($orders as $order) {
            $this->assertContains($order['risk_level'], ['Kritis', 'Waspada', 'Aman']);
            $this->assertArrayHasKey('risk_label', $order);
            $this->assertArrayHasKey('risk_color', $order);
            $this->assertArrayHasKey('remaining_minutes', $order);
        }
    }

    public function test_sla_risk_panel_scope_keeps_one_row_per_idle_courier(): void
    {
        $this->actingAsAdmin();

        $all = $this->getJson(self::BASE . '/orders/sla-risk')->json('data.orders');
        $panel = $this->getJson(self::BASE . '/orders/sla-risk?scope=panel')->assertStatus(200)->json('data.orders');

        $this->assertNotEmpty($panel);
        $this->assertLessThan(count($all), count($panel));

        $courierIds = array_column($panel, 'courier_id');
        $this->assertSame($courierIds, array_unique($courierIds));
    }

    public function test_top_risk_clamps_limit_parameter(): void
    {
        $this->actingAsAdmin();
        $stops = [];
        Redis::shouldReceive('zrevrange')->andReturnUsing(
            function ($key, $start, $stop) use (&$stops) {
                $stops[] = $stop;

                return [];
            }
        );

        $this->getJson(self::BASE . '/risiko/teratas?limit=999')
            ->assertStatus(200)
            ->assertJson(['ok' => true, 'data' => ['ranking' => [], 'orders' => []]]);
        $this->getJson(self::BASE . '/risiko/teratas?limit=0')->assertStatus(200);
        $this->getJson(self::BASE . '/risiko/teratas')->assertStatus(200);

        // ZREVRANGE memakai rentang tertutup 0..stop, jadi 50 baris = stop 49.
        $this->assertSame([49, 0, 9], $stops);
    }

    public function test_top_risk_returns_details_for_ranked_resi(): void
    {
        $this->actingAsAdmin();
        Redis::shouldReceive('zrevrange')->andReturn(['100024000545' => 8.0]);

        $response = $this->getJson(self::BASE . '/risiko/teratas')->assertStatus(200);

        $this->assertEquals([['resi' => '100024000545', 'score' => 8.0]], $response->json('data.ranking'));
        $this->assertCount(1, $response->json('data.orders'));
        $this->assertSame('100024000545', $response->json('data.orders.0.waybill_number'));
    }

    public function test_tugas_tabel_reports_consistent_pagination(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/tugas/tabel?per_page=3')->assertStatus(200)
            ->assertJsonStructure(['ok', 'data' => ['data', 'total', 'page', 'per_page', 'last_page'], 'message']);

        $data = $response->json('data');

        $this->assertSame(1, $data['page']);
        $this->assertSame(3, $data['per_page']);
        $this->assertGreaterThan(0, $data['total']);
        $this->assertCount(3, $data['data']);
        $this->assertSame((int) ceil($data['total'] / 3), $data['last_page']);
        $this->assertArrayHasKey('waybill_number', $data['data'][0]);
        $this->assertArrayHasKey('risk_level', $data['data'][0]);
    }

    public function test_tugas_tabel_search_filters_rows(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/tugas/tabel?search=Matraman')->assertStatus(200);

        $this->assertSame(1, $response->json('data.total'));
        $this->assertSame('100024000537', $response->json('data.data.0.waybill_number'));
    }

    public function test_tugas_tabel_risk_filter_keeps_only_that_level(): void
    {
        $this->actingAsAdmin();
        $all = $this->getJson(self::BASE . '/tugas/tabel?per_page=100')->json('data.data');
        $kritis = count(array_filter($all, fn (array $row) => $row['risk_level'] === 'Kritis'));
        $this->assertGreaterThan(0, $kritis);

        $filtered = $this->getJson(self::BASE . '/tugas/tabel?risk=Kritis')->assertStatus(200);

        $this->assertSame($kritis, $filtered->json('data.total'));
        foreach ($filtered->json('data.data') as $row) {
            $this->assertSame('Kritis', $row['risk_level']);
        }
    }

    public function test_tugas_tabel_service_filter_keeps_only_that_service(): void
    {
        $this->actingAsAdmin();
        $all = $this->getJson(self::BASE . '/tugas/tabel?per_page=100')->json('data.data');
        $cargo = count(array_filter($all, fn (array $row) => $row['service_type'] === 'Cargo'));
        $this->assertGreaterThan(0, $cargo);

        $filtered = $this->getJson(self::BASE . '/tugas/tabel?service=Cargo')->assertStatus(200);

        $this->assertSame($cargo, $filtered->json('data.total'));
        foreach ($filtered->json('data.data') as $row) {
            $this->assertSame('Cargo', $row['service_type']);
        }
    }

    public function test_tugas_tabel_version_bump_replaces_stale_cached_rows(): void
    {
        $this->actingAsAdmin();
        $rows = $this->getJson(self::BASE . '/tugas/tabel?per_page=100')->assertStatus(200)->json('data.data');
        $resi = $rows[0]['waybill_number'];
        $weightBefore = $rows[0]['weight_kg'];
        $this->assertGreaterThan(0, count($rows));

        Order::where('order_number', $resi)->update(['weight_kg' => 99.00]);

        $stale = collect($this->getJson(self::BASE . '/tugas/tabel?per_page=100')->json('data.data'))
            ->firstWhere('waybill_number', $resi);
        $this->assertSame($weightBefore, $stale['weight_kg'], 'kunci lama belum kadaluwarsa sebelum versi dinaikkan');

        SlaRiskService::bumpTugasTabelVersion($this->halimAdmin()->hub_id);

        $fresh = collect($this->getJson(self::BASE . '/tugas/tabel?per_page=100')->json('data.data'))
            ->firstWhere('waybill_number', $resi);
        $this->assertEquals(99.0, $fresh['weight_kg']);
    }
}
