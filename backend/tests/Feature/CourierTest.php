<?php

namespace Tests\Feature;

use App\Models\Courier;
use App\Models\CourierTelemetry;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Live monitoring dan pemilihan kurir pengganti membaca daftar kurir yang
 * sama; uji memakai data seeder (11 kurir: 3 ONLINE, 7 IDLE, 1 OFFLINE).
 */
class CourierTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    public function test_index_lists_active_couriers_with_counters(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson('http://localhost/api/couriers')->assertStatus(200)
            ->assertJsonStructure(['ok', 'data' => ['couriers', 'total', 'online', 'idle'], 'message'])
            ->assertJsonPath('data.total', 10)
            ->assertJsonPath('data.online', 3)
            ->assertJsonPath('data.idle', 7);

        $couriers = $response->json('data.couriers');
        $this->assertCount(10, $couriers);
        $this->assertNotContains('OFFLINE', array_column($couriers, 'status'));
        $this->assertArrayHasKey('position', $couriers[0]);
        $this->assertArrayHasKey('active_packages', $couriers[0]);
    }

    public function test_candidates_require_exclude_id(): void
    {
        $this->actingAsAdmin();

        $this->getJson('http://localhost/api/couriers/candidates')
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_candidates_reject_unknown_order(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson('http://localhost/api/couriers/candidates?exclude_id=' . Str::uuid()
            . '&order_id=' . Str::uuid());

        $response->assertStatus(422)->assertJsonPath('message', 'Order tidak ditemukan.');
    }

    public function test_candidates_exclude_the_given_courier_and_the_carrier(): void
    {
        $this->actingAsAdmin();
        $order = Order::where('order_number', '100024000543')->firstOrFail();
        $excluded = Courier::where('courier_code', 'HLM-007')->firstOrFail();
        $carrier = Courier::where('courier_code', 'HLM-011')->firstOrFail();

        $response = $this->getJson(
            'http://localhost/api/couriers/candidates?exclude_id=' . $excluded->id . '&order_id=' . $order->id
        )->assertStatus(200)
            ->assertJsonStructure(['ok', 'data' => ['candidates', 'total', 'is_recommended', 'note'], 'message'])
            ->assertJsonPath('data.total', 2)
            ->assertJsonPath('data.is_recommended', true);

        $ids = array_column($response->json('data.candidates'), 'id');
        $this->assertNotContains($excluded->id, $ids);
        $this->assertNotContains($carrier->id, $ids);
        $this->assertTrue($response->json('data.candidates.0.is_recommended'));
        $this->assertArrayHasKey('eta_minutes', $response->json('data.candidates.0'));
    }

    public function test_show_returns_courier_detail_or_404(): void
    {
        $this->actingAsAdmin();
        $courier = Courier::where('courier_code', 'HLM-001')->firstOrFail();

        $this->getJson('http://localhost/api/couriers/' . $courier->id)
            ->assertStatus(200)
            ->assertJsonPath('data.courier_code', 'HLM-001')
            ->assertJsonStructure(['ok', 'data' => ['id', 'name', 'initials', 'active_packages', 'telemetry'], 'message']);

        $this->getJson('http://localhost/api/couriers/' . Str::uuid())
            ->assertStatus(404)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_telemetry_validation_rejects_missing_coordinates(): void
    {
        $this->actingAsAdmin();
        $courier = Courier::where('courier_code', 'HLM-006')->firstOrFail();

        $this->postJson('http://localhost/api/couriers/' . $courier->id . '/telemetry', ['speed_kmh' => 40])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_telemetry_persists_a_new_position_row(): void
    {
        $this->actingAsAdmin();
        // Kurir OFFLINE tidak punya baris telemetri hasil seeder, jadi jumlah
        // barisnya bisa dipakai untuk membuktikan insert benar-benar terjadi.
        $courier = Courier::where('courier_code', 'HLM-006')->firstOrFail();
        $this->assertSame(0, CourierTelemetry::where('courier_id', $courier->id)->count());

        $this->postJson('http://localhost/api/couriers/' . $courier->id . '/telemetry', [
            'latitude' => -6.2600,
            'longitude' => 106.8700,
            'speed_kmh' => 42.5,
            'battery_level' => 80,
        ])->assertStatus(200)->assertJson(['ok' => true, 'data' => null]);

        $row = CourierTelemetry::where('courier_id', $courier->id)->firstOrFail();
        $this->assertSame(-6.26, (float) $row->latitude);
        $this->assertSame(42.5, (float) $row->speed_kmh);
        $this->assertSame(80, $row->battery_level);
    }

    public function test_telemetry_for_unknown_courier_returns_404(): void
    {
        $this->actingAsAdmin();

        $this->postJson('http://localhost/api/couriers/' . Str::uuid() . '/telemetry', [
            'latitude' => -6.26,
            'longitude' => 106.87,
        ])->assertStatus(404)->assertJson(['ok' => false, 'data' => null]);
    }
}
