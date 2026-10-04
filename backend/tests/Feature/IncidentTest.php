<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Courier;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Services\Cloudinary\CloudinaryService;
use App\Support\OperationalClock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Alur insiden: daftar, laporan kurir, pengalihan 1-klik (dengan seluruh
 * jalur penolakan), dan unduhan laporan harian.
 */
class IncidentTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public function test_index_lists_open_incidents_with_one_click_rate(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/incidents')->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'incidents',
                    'total',
                    'summary' => ['one_click_rate'],
                ],
                'message',
            ]);

        // Insiden kurir ONLINE (INC-HLM-083) sengaja tidak tampil di halaman.
        $this->assertSame(3, $response->json('data.total'));
        $this->assertSame(100.0, (float) $response->json('data.summary.one_click_rate'));
        $this->assertLessThanOrEqual(2, count($response->json('data.incidents.0.candidates')));
        $this->assertArrayHasKey('status_label', $response->json('data.incidents.0'));

        // Insiden banjir Rama Pratama masih berupa daftar: belum dialihkan.
        $banjir = collect($response->json('data.incidents'))->firstWhere('incident_code', 'INC-HLM-085');
        $this->assertNotNull($banjir);
        $this->assertSame('ESCALATED', $banjir['status']);
        $this->assertNull($banjir['replacement_courier']);
    }

    public function test_store_creates_incident_and_refreshes_the_list(): void
    {
        $this->actingAsAdmin();
        $order = Order::where('order_number', '100024000545')->firstOrFail();
        $courier = Courier::where('courier_code', 'HLM-007')->firstOrFail();

        $response = $this->postJson(self::BASE . '/incidents', [
            'order_number' => $order->order_number,
            'courier_id' => $courier->id,
            'incident_category' => 'Mogok Kendaraan',
            'title' => 'Mesin Mati Total',
            'description' => 'Uji laporan dari kurir',
            'location_address' => 'Jl. Pendidikan Raya',
            'latitude' => -6.265,
            'longitude' => 106.875,
            'weather_condition' => 'Cerah',
            'traffic_condition' => 'Padat',
        ])->assertStatus(201)
            ->assertJsonStructure(['ok', 'data' => ['id', 'incident_code', 'severity', 'status'], 'message'])
            ->assertJsonPath('data.severity', 'CRITICAL')
            ->assertJsonPath('data.status', 'REPORTED');

        $incident = IncidentReport::where('title', 'Mesin Mati Total')->firstOrFail();
        $this->assertSame($order->id, $incident->order_id);
        $this->assertSame($courier->id, $incident->courier_id);
        $this->assertStringStartsWith('INC-HLM-', $response->json('data.incident_code'));

        $this->getJson(self::BASE . '/incidents')->assertStatus(200)->assertJsonPath('data.total', 4);
    }

    public function test_store_rejects_missing_and_invalid_fields(): void
    {
        $this->actingAsAdmin();

        $this->postJson(self::BASE . '/incidents', [])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);

        $this->postJson(self::BASE . '/incidents', [
            'order_number' => 'RESI-TIDAK-ADA',
            'courier_id' => 'bukan-uuid',
            'incident_category' => 'Kategori Ngawur',
            'title' => '',
        ])->assertStatus(422)->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_reassign_moves_the_package_and_writes_audit_log(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $order = Order::where('order_number', '100024000543')->firstOrFail();
        $target = Courier::where('courier_code', 'HLM-007')->firstOrFail();
        $auditsBefore = AuditLog::count();

        $response = $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $target->id,
        ])->assertStatus(201)
            ->assertJsonStructure(['ok', 'data' => ['confirmation_id', 'confirmation_code', 'audit_log_id', 'new_courier', 'notification'], 'message'])
            ->assertJsonPath('data.new_courier.courier_code', 'HLM-007');

        $fresh = $incident->fresh();
        $this->assertSame('RESOLVED', $fresh->status);
        $this->assertSame($target->id, $fresh->replacement_courier_id);
        $this->assertSame($target->id, $order->fresh()->current_courier_id);
        $this->assertSame($auditsBefore + 1, AuditLog::count());

        $audit = AuditLog::where('incident_id', $incident->id)->firstOrFail();
        $this->assertSame($this->halimAdmin()->id, $audit->executor_user_id);

        // Notifikasi berjalan di antrean sync, jadi tugasnya sudah tuntas
        // segera setelah transaksi pengalihan selesai.
        $this->getJson(self::BASE . '/tasks/' . $response->json('data.notification.task_id'))
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_reassign_rejects_recently_reassigned_incident(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $incident->reassignmentConfirmations()->create([
            'confirmation_code' => 'RSC-TEST-CONFLICT',
            'order_id' => $incident->order_id,
            'confirmation_time' => now(),
            'status' => 'CONFIRMED',
        ]);
        $target = Courier::where('courier_code', 'HLM-007')->firstOrFail();

        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $target->id,
        ])->assertStatus(409)
            ->assertJson(['ok' => false, 'data' => null])
            ->assertJsonPath('message', 'Resi ini baru saja dialihkan. Silakan tunggu 1 menit sebelum mencoba lagi.');
    }

    public function test_reassign_rejects_the_current_carrier(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $carrier = Courier::where('courier_code', 'HLM-011')->firstOrFail();

        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $carrier->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Paket tersebut sedang dibawa oleh kurir tujuan. Pilih kurir lain.');
    }

    public function test_reassign_rejects_courier_already_over_parcel_limit(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $overloaded = Courier::where('courier_code', 'HLM-001')->firstOrFail();

        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $overloaded->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Kurir tujuan sudah membawa lebih dari 10 paket. Pilih kurir lain.');
    }

    public function test_reassign_rejects_delivered_package(): void
    {
        $this->actingAsAdmin();
        // Resi 100024000540 sudah kembali ke Rama Pratama dan belum tuntas,
        // jadi uji penolakan ini memakai kiriman Frozen yang benar-benar
        // sampai ke penerima.
        $order = Order::where('order_number', '100024000533')->firstOrFail();
        $incident = IncidentReport::create([
            'incident_code' => 'INC-TEST-DELIVERED',
            'order_id' => $order->id,
            'courier_id' => $order->current_courier_id,
            'handled_by_user_id' => $this->halimAdmin()->id,
            'incident_category' => 'Anomali Suhu',
            'title' => 'Kotak Es Krim Mencair',
            'status' => 'REPORTED',
            'reported_at' => OperationalClock::now(),
        ]);
        $target = Courier::where('courier_code', 'HLM-007')->firstOrFail();

        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $target->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Paket sudah berstatus DELIVERED dan tidak dapat dialihkan.');
    }

    public function test_reassign_rejects_armada_that_cannot_carry_the_service(): void
    {
        $this->actingAsAdmin();
        $order = Order::where('order_number', '100024000539')->firstOrFail();
        // Berat diturunkan supaya pemeriksaan kompatibilitas yang lebih dulu
        // tercapai, bukan pemeriksaan kapasitas muatan.
        $order->update(['weight_kg' => 5.00]);
        $incident = IncidentReport::create([
            'incident_code' => 'INC-TEST-CARGO',
            'order_id' => $order->id,
            'courier_id' => $order->current_courier_id,
            'handled_by_user_id' => $this->halimAdmin()->id,
            'incident_category' => 'Ban Bocor',
            'title' => 'Ban Kempis di Jalan Raya',
            'status' => 'REPORTED',
            'reported_at' => OperationalClock::now(),
        ]);
        $motor = Courier::where('courier_code', 'HLM-007')->firstOrFail();

        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $motor->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Armada kurir pengganti tidak kompatibel dengan layanan Cargo. Pilih kurir lain.');
    }

    public function test_reassign_rejects_courier_without_payload_capacity(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $target = Courier::where('courier_code', 'HLM-007')->firstOrFail();
        $target->update(['max_capacity_kg' => 0.50]);

        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => $target->id,
        ])->assertStatus(422)
            ->assertJsonPath('message', 'Kurir tujuan tidak memiliki kapasitas muatan yang cukup.');
    }

    public function test_reassign_rejects_unknown_incident_and_unknown_courier(): void
    {
        $this->actingAsAdmin();
        $target = Courier::where('courier_code', 'HLM-007')->firstOrFail();

        $this->postJson(self::BASE . '/incidents/' . Str::uuid() . '/reassign', [
            'replacement_courier_id' => $target->id,
        ])->assertStatus(500)->assertJson(['ok' => false, 'data' => null]);

        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => 'bukan-uuid',
        ])->assertStatus(422)->assertJson(['ok' => false, 'data' => null]);
        $this->postJson(self::BASE . "/incidents/{$incident->id}/reassign", [
            'replacement_courier_id' => (string) Str::uuid(),
        ])->assertStatus(422)->assertJsonPath('message', 'Kurir pengganti tidak ditemukan.');
    }

    public function test_export_csv_lists_incidents_of_the_requested_day(): void
    {
        $this->actingAsAdmin();
        $date = OperationalClock::now()->toDateString();

        $response = $this->get(self::BASE . "/incidents/export?format=csv&date={$date}");

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('Kode Insiden', $content);
        $this->assertStringContainsString('INC-HLM-082', $content);
        // INC-HLM-083 dilaporkan kemarin, jadi tidak boleh ikut terbawa
        // laporan hari operasional.
        $this->assertStringNotContainsString('INC-HLM-083', $content);
    }

    public function test_export_without_format_defaults_to_csv(): void
    {
        $this->actingAsAdmin();
        $date = OperationalClock::now()->toDateString();

        $response = $this->get(self::BASE . "/incidents/export?date={$date}");

        $response->assertStatus(200);
        $this->assertStringContainsString('.csv', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_export_xlsx_downloads_a_spreadsheet(): void
    {
        $this->actingAsAdmin();
        $date = OperationalClock::now()->toDateString();

        $response = $this->get(self::BASE . "/incidents/export?format=xlsx&date={$date}");

        $response->assertStatus(200);
        $disposition = (string) $response->headers->get('Content-Disposition');
        $this->assertStringContainsString('Laporan_Insiden_', $disposition);
        $this->assertStringContainsString('.xlsx', $disposition);
    }

    public function test_export_rejects_unknown_format(): void
    {
        $this->actingAsAdmin();

        $this->get(self::BASE . '/incidents/export?format=docx')
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_upload_evidence_requires_a_photo(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $this->mock(CloudinaryService::class, function ($mock): void {
            $mock->shouldNotReceive('uploadEvidence');
        });

        $this->postJson(self::BASE . "/incidents/{$incident->id}/upload-evidence", [])
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null]);
    }

    public function test_upload_evidence_rejects_photo_over_five_megabytes(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $this->mock(CloudinaryService::class, function ($mock): void {
            $mock->shouldNotReceive('uploadEvidence');
        });
        $fake = UploadedFile::fake()->image('bukti.jpg', 4, 4);
        $oversized = new OversizedJpegUpload($fake->getPathname(), 'bukti.jpg', 'image/jpeg', null, true);

        $this->post(self::BASE . "/incidents/{$incident->id}/upload-evidence", ['photo' => $oversized])
            ->assertStatus(422);
        $this->assertSame(0, $incident->evidences()->count());
    }

    public function test_upload_evidence_stores_row_when_cloudinary_accepts(): void
    {
        $this->actingAsAdmin();
        $incident = IncidentReport::where('incident_code', 'INC-HLM-082')->firstOrFail();
        $this->mock(CloudinaryService::class, function ($mock): void {
            $mock->shouldReceive('uploadEvidence')->once()->andReturn([
                'public_id' => 'foto_bukti/uji-bukti',
                'secure_url' => 'https://res.cloudinary.com/demo/uji-bukti.jpg',
            ]);
        });

        $this->post(self::BASE . "/incidents/{$incident->id}/upload-evidence", [
            'photo' => UploadedFile::fake()->image('bukti.jpg', 4, 4),
            'caption' => 'Foto dari lapangan',
        ])->assertStatus(201)->assertJson(['ok' => true]);

        $evidence = $incident->evidences()->firstOrFail();
        $this->assertSame('Foto dari lapangan', $evidence->caption);
        $this->assertSame('https://res.cloudinary.com/demo/uji-bukti.jpg', $incident->fresh()->evidence_image_url);
    }
}

/**
 * Ukuran berkas dipalsukan di getter supaya aturan `image` lolos (isi berkas
 * JPEG asli) sementara aturan `max:5120` tetap menolak.
 */
class OversizedJpegUpload extends UploadedFile
{
    public function getSize(): int
    {
        return 6 * 1024 * 1024;
    }
}
