<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Kontrak envelope dipakai seluruh klien (panel & integrasi): sukses selalu
 * ok=true dengan data terisi, gagal selalu ok=false dengan data=null.
 */
class EnvelopeContractTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public function test_success_responses_carry_ok_data_and_message(): void
    {
        $this->seed(\Database\Seeders\HubSeeder::class);

        $ping = $this->getJson(self::BASE . '/ping')->assertStatus(200);
        $ping->assertJsonStructure(['ok', 'data', 'message']);
        $this->assertTrue($ping->json('ok'));
        $this->assertIsString($ping->json('message'));

        $hubs = $this->getJson(self::BASE . '/hubs')->assertStatus(200);
        $hubs->assertJsonStructure(['ok', 'data' => ['hubs'], 'message']);
        $this->assertTrue($hubs->json('ok'));
    }

    public function test_created_response_keeps_the_success_envelope(): void
    {
        $this->actingAsAdmin();
        $order = \App\Models\Order::where('order_number', '100024000545')->firstOrFail();
        $courier = \App\Models\Courier::where('courier_code', 'HLM-007')->firstOrFail();

        $response = $this->postJson(self::BASE . '/incidents', [
            'order_number' => $order->order_number,
            'courier_id' => $courier->id,
            'incident_category' => 'Ban Bocor',
            'title' => 'Ban Belakang Pecah',
        ])->assertStatus(201);

        $response->assertJsonStructure(['ok', 'data' => ['id', 'incident_code'], 'message']);
        $this->assertTrue($response->json('ok'));
    }

    public function test_not_found_response_carries_error_envelope(): void
    {
        $response = $this->getJson(self::BASE . '/rute-tidak-ada')->assertStatus(404);

        $response->assertJsonStructure(['ok', 'data', 'message']);
        $this->assertFalse($response->json('ok'));
        $this->assertNull($response->json('data'));
        $this->assertIsString($response->json('message'));
    }

    public function test_validation_error_carries_error_envelope(): void
    {
        $response = $this->postJson(self::BASE . '/auth/login', [])->assertStatus(422);

        $response->assertJsonStructure(['ok', 'data', 'message']);
        $this->assertFalse($response->json('ok'));
        $this->assertNull($response->json('data'));
    }

    public function test_unauthenticated_response_carries_error_envelope(): void
    {
        $response = $this->getJson(self::BASE . '/incidents')->assertStatus(401);

        $response->assertJsonStructure(['ok', 'data', 'message']);
        $this->assertFalse($response->json('ok'));
        $this->assertNull($response->json('data'));
    }
}
