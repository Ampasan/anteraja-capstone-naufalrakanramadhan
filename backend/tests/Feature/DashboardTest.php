<?php

namespace Tests\Feature;

use App\Http\Controllers\DashboardController;
use App\Models\Hub;
use App\Models\User;
use Database\Seeders\HubSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Ringkasan dasbor dihitung per hub milik user yang login, sehingga kasus
 * "hub tak ditemukan" tidak mungkin lewat HTTP (FK users.hub_id) dan diuji
 * langsung pada controller.
 */
class DashboardTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    public function test_summary_reports_seeded_hub_numbers(): void
    {
        $this->actingAsAdmin();

        $this->getJson('http://localhost/api/dashboard/summary')
            ->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'hub' => ['id', 'name', 'city', 'capacity_used', 'capacity_total'],
                    'couriers' => ['total', 'online', 'idle'],
                    'orders' => ['active', 'critical'],
                    'incidents' => ['open'],
                ],
                'message',
            ])
            ->assertJsonPath('data.hub.name', 'Hub Halim - Jakarta Timur')
            ->assertJsonPath('data.couriers.total', 11)
            ->assertJsonPath('data.couriers.online', 3)
            ->assertJsonPath('data.couriers.idle', 7)
            ->assertJsonPath('data.orders.active', 22)
            ->assertJsonPath('data.incidents.open', 3);
    }

    public function test_summary_of_hub_without_operations_is_all_zero(): void
    {
        $hub = Hub::create([
            'hub_code' => 'HUB-TEST-KOSONG',
            'hub_name' => 'Hub Uji Kosong',
            'city' => 'Depok',
            'latitude' => -6.2000000,
            'longitude' => 106.8000000,
            'service_radius_km' => 3.0,
            'max_capacity_parcels' => 100,
            'current_parcels_count' => 0,
        ]);
        $user = User::create([
            'hub_id' => $hub->id,
            'name' => 'Admin Hub Kosong',
            'email' => 'kosong@anteraja.id',
            'password_hash' => Hash::make('rahasia123'),
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);
        $this->actingAsAdmin($user);

        $this->getJson('http://localhost/api/dashboard/summary')
            ->assertStatus(200)
            ->assertJsonPath('data.hub.name', 'Hub Uji Kosong')
            ->assertJsonPath('data.couriers.total', 0)
            ->assertJsonPath('data.orders.active', 0)
            ->assertJsonPath('data.incidents.open', 0);
    }

    public function test_summary_answers_404_when_hub_row_is_gone(): void
    {
        $this->seed(HubSeeder::class);

        $request = Request::create('http://localhost/api/dashboard/summary');
        $request->setUserResolver(fn () => new User(['hub_id' => (string) Str::uuid()]));

        $response = app(DashboardController::class)->summary($request);

        $this->assertSame(404, $response->getStatusCode());
        $this->assertFalse($response->getData(true)['ok']);
    }

    public function test_hubs_returns_five_entries_with_positions(): void
    {
        $this->seed(HubSeeder::class);

        $this->getJson('http://localhost/api/hubs')
            ->assertStatus(200)
            ->assertJsonCount(5, 'data.hubs')
            ->assertJsonStructure([
                'ok',
                'data' => ['hubs' => [['id', 'name', 'short_name', 'city', 'position' => ['lat', 'lng'], 'radius_km', 'capacity_used', 'capacity_total']]],
                'message',
            ])
            ->assertJsonPath('data.hubs.0.name', 'Hub Halim - Jakarta Timur')
            ->assertJsonPath('data.hubs.0.short_name', 'HUB HALIM');
    }

    public function test_hubs_second_call_serves_identical_cached_payload(): void
    {
        $this->seed(HubSeeder::class);

        $first = $this->getJson('http://localhost/api/hubs')->assertStatus(200)->json('data');
        $second = $this->getJson('http://localhost/api/hubs')->assertStatus(200)->json('data');

        $this->assertSame($first, $second);
    }
}
