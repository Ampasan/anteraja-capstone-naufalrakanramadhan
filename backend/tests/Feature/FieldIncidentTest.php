<?php

namespace Tests\Feature;

use App\Models\Courier;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Services\Cloudinary\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Website laporan insiden lapangan (/lapor-insiden): daftar kurir, daftar
 * resi, pembuatan insiden, dan unggah foto — semuanya tanpa login.
 */
class FieldIncidentTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public function test_courier_list_is_public_and_hides_contact_details(): void
    {
        $this->seedPanel();

        $response = $this->getJson(self::BASE . '/lapor/couriers')->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'couriers' => [['id', 'name', 'courier_code', 'vehicle_type', 'license_plate', 'hub_name']],
                ],
                'message',
            ]);

        $this->assertNotEmpty($response->json('data.couriers'));

        // Endpoint tanpa login tidak boleh membocorkan data kontak kurir.
        $first = $response->json('data.couriers.0');
        $this->assertArrayNotHasKey('phone_number', $first);
        $this->assertArrayNotHasKey('current_parcel_count', $first);
    }

    public function test_courier_orders_list_returns_active_parcels(): void
    {
        $this->seedPanel();
        $order = Order::query()
            ->whereNotNull('current_courier_id')
            ->where('delivery_status', '!=', 'DELIVERED')
            ->firstOrFail();

        $response = $this->getJson(self::BASE . '/lapor/couriers/' . $order->current_courier_id . '/orders')
            ->assertStatus(200)
            ->assertJsonStructure(['ok', 'data' => ['orders' => [['order_number', 'service_type']]]]);

        $numbers = collect($response->json('data.orders'))->pluck('order_number');
        $this->assertContains($order->order_number, $numbers);

        // Kiriman yang sudah sampai tidak ikut ditawarkan sebagai pilihan.
        $delivered = Order::where('delivery_status', 'DELIVERED')->pluck('order_number')->all();
        $this->assertEmpty(array_intersect($delivered, $numbers->all()));
    }

    public function test_courier_orders_rejects_a_non_uuid_courier(): void
    {
        $this->getJson(self::BASE . '/lapor/couriers/bukan-uuid/orders')
            ->assertStatus(404)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_store_creates_incident_without_login(): void
    {
        $this->seedPanel();
        $order = Order::query()
            ->whereNotNull('current_courier_id')
            ->where('delivery_status', '!=', 'DELIVERED')
            ->firstOrFail();
        $courier = Courier::findOrFail($order->current_courier_id);

        $response = $this->postJson(self::BASE . '/lapor/incidents', [
            'order_number' => $order->order_number,
            'courier_id' => $courier->id,
            'incident_category' => 'Ban Bocor',
            'title' => 'Ban belakang kempis',
            'description' => 'Ditambal sementara di pinggir jalan',
            'location_address' => 'Jl. Raya Bogor KM 20',
            'weather_condition' => 'Hujan Deras',
            'traffic_condition' => 'Padat',
            'temperature_c' => 4.5,
        ])->assertStatus(201)
            ->assertJsonStructure(['ok', 'data' => ['id', 'incident_code', 'severity', 'status']])
            ->assertJsonPath('data.status', 'REPORTED');

        $incident = IncidentReport::where('title', 'Ban belakang kempis')->firstOrFail();
        $this->assertSame($order->id, $incident->order_id);
        $this->assertSame($courier->id, $incident->courier_id);

        // Pelapor tidak punya akun panel, jadi penanggung jawabnya kosong.
        $this->assertNull($incident->handled_by_user_id);
        $this->assertStringStartsWith('INC-HLM-', $response->json('data.incident_code'));
    }

    public function test_store_rejects_missing_fields_without_login(): void
    {
        $this->postJson(self::BASE . '/lapor/incidents', [])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_evidence_upload_works_without_login(): void
    {
        $this->seedPanel();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();

        $this->mock(CloudinaryService::class, function ($mock): void {
            $mock->shouldReceive('uploadEvidence')->once()->andReturn([
                'public_id' => 'foto_bukti/uji-lapangan',
                'secure_url' => 'https://res.cloudinary.com/demo/uji-lapangan.jpg',
            ]);
        });

        $this->post(self::BASE . '/lapor/incidents/' . $incident->id . '/evidence', [
            'photo' => UploadedFile::fake()->image('bukti.jpg', 4, 4),
            'caption' => 'Ban belakang kempis',
        ])->assertStatus(201)->assertJson(['ok' => true]);

        $this->assertSame('Ban belakang kempis', $incident->evidences()->firstOrFail()->caption);
        $this->assertSame(
            'https://res.cloudinary.com/demo/uji-lapangan.jpg',
            $incident->fresh()->evidence_image_url
        );
    }

    public function test_evidence_upload_rejects_a_photo_over_five_megabytes(): void
    {
        $this->seedPanel();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $this->mock(CloudinaryService::class, function ($mock): void {
            $mock->shouldNotReceive('uploadEvidence');
        });
        $fake = UploadedFile::fake()->image('bukti.jpg', 4, 4);
        $oversized = new OversizedFieldPhoto($fake->getPathname(), 'bukti.jpg', 'image/jpeg', null, true);

        $this->post(self::BASE . '/lapor/incidents/' . $incident->id . '/evidence', [
            'photo' => $oversized,
        ])->assertStatus(422);

        $this->assertSame(0, $incident->evidences()->count());
    }

    public function test_report_endpoint_is_rate_limited_per_ip(): void
    {
        // Entry point publik: batas 6 laporan/menit per IP, jadi permintaan
        // ketujuh ditolak sebelum menyentuh validasi maupun database.
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->postJson(self::BASE . '/lapor/incidents', [])->assertStatus(422);
        }

        $this->postJson(self::BASE . '/lapor/incidents', [])
            ->assertStatus(429)
            ->assertJson(['ok' => false, 'data' => null]);
    }
}

/**
 * Ukuran berkas dipalsukan di getter supaya aturan `image` lolos (isi berkas
 * JPEG asli) sementara aturan `max:5120` tetap menolak.
 */
class OversizedFieldPhoto extends UploadedFile
{
    public function getSize(): int
    {
        return 6 * 1024 * 1024;
    }
}
