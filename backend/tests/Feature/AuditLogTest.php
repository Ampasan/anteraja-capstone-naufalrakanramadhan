<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Courier;
use App\Models\Hub;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Riwayat pengalihan dibaca per hub milik user login, jadi uji scoping
 * menambahkan satu baris audit di hub lain dan memastikan ia tak bocor.
 */
class AuditLogTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public function test_index_returns_logs_with_kpi_summary(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/audit-logs')->assertStatus(200)
            ->assertJsonStructure([
                'ok',
                'data' => [
                    'logs',
                    'summary' => [
                        'total_completed', 'avg_handling_seconds', 'sla_compliance_rate',
                        'sla_compliant_count', 'one_click_rate', 'one_click_count',
                    ],
                ],
                'message',
            ]);

        $summary = $response->json('data.summary');
        $this->assertCount(5, $response->json('data.logs'));
        $this->assertSame(5, $summary['total_completed']);
        $this->assertSame(16.0, (float) $summary['avg_handling_seconds']);
        $this->assertSame(80.0, (float) $summary['sla_compliance_rate']);
        $this->assertSame(100.0, (float) $summary['one_click_rate']);
    }

    public function test_logs_are_sorted_newest_first_with_shared_report_vocabulary(): void
    {
        $this->actingAsAdmin();
        $logs = collect($this->getJson(self::BASE . '/audit-logs')->json('data.logs'));

        $this->assertCount(5, $logs);
        $this->assertSame('AUD-HLM-2026-0105', $logs->first()['log_code']);

        $byCode = $logs->keyBy('log_code');
        foreach (['AUD-HLM-2026-0101', 'AUD-HLM-2026-0102', 'AUD-HLM-2026-0103', 'AUD-HLM-2026-0104'] as $code) {
            $this->assertSame('Selesai', $byCode[$code]['report_status'], $code);
        }
        $this->assertContains($byCode['AUD-HLM-2026-0105']['report_status'], ['Selesai', 'Dialihkan']);
        // Pengalihan Rama Pratama (resi 100024000540) tidak ikut tercatat.
        $this->assertTrue($logs->where('resi', '100024000540')->isEmpty());
    }

    public function test_frozen_row_gets_no_evidence_photo_but_others_do(): void
    {
        $this->actingAsAdmin();
        $logs = collect($this->getJson(self::BASE . '/audit-logs')->json('data.logs'))->keyBy('log_code');

        // Layanan Frozen dilarang didokumentasikan (FRD-05).
        $this->assertNull($logs['AUD-HLM-2026-0101']['evidence_image_url']);
        $this->assertStringContainsString('motor_mogok', (string) $logs['AUD-HLM-2026-0103']['evidence_image_url']);
        $this->assertNotEmpty($logs['AUD-HLM-2026-0105']['evidence_image_url']);
    }

    public function test_export_csv_downloads_kpi_recap_and_rows(): void
    {
        $this->actingAsAdmin();

        $response = $this->get(self::BASE . '/audit-logs/export?format=csv');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));

        $content = file_get_contents($response->baseResponse->getFile()->getPathname());
        $this->assertStringContainsString('Rekapitulasi KPI', $content);
        $this->assertStringContainsString('AUD-HLM-2026-0105', $content);
    }

    public function test_export_pdf_renders_the_report_template(): void
    {
        $this->actingAsAdmin();

        $response = $this->get(self::BASE . '/audit-logs/export?format=pdf');

        $response->assertStatus(200);
        $this->assertStringContainsString('pdf', strtolower((string) $response->headers->get('Content-Type')));
        $this->assertStringContainsString('.pdf', (string) $response->headers->get('Content-Disposition'));
    }

    public function test_export_rejects_unknown_format(): void
    {
        $this->actingAsAdmin();

        $this->get(self::BASE . '/audit-logs/export?format=docx')
            ->assertStatus(422)
            ->assertJson(['ok' => false, 'data' => null])
            ->assertJsonPath('message', 'Format ekspor tidak dikenal. Gunakan csv, xlsx, atau pdf.');
    }

    public function test_logs_and_csv_are_scoped_to_the_caller_hub(): void
    {
        $this->actingAsAdmin();
        $foreign = $this->createForeignHubRow();
        $foreignUser = User::create([
            'hub_id' => $foreign['hub']->id,
            'name' => 'Admin Hub Luar',
            'email' => 'luar@anteraja.id',
            'password_hash' => Hash::make('rahasia123'),
            'role' => 'ADMIN',
            'status' => 'ACTIVE',
        ]);

        $this->getJson(self::BASE . '/audit-logs')->assertStatus(200)
            ->assertJsonPath('data.summary.total_completed', 5);
        $csv = $this->get(self::BASE . '/audit-logs/export?format=csv');
        $content = file_get_contents($csv->baseResponse->getFile()->getPathname());
        $this->assertStringNotContainsString($foreign['resi'], $content);

        $this->actingAsAdmin($foreignUser);
        $this->getJson(self::BASE . '/audit-logs')
            ->assertStatus(200)
            ->assertJsonPath('data.summary.total_completed', 1);
    }

    /** Satu hub + order + baris audit miliknya, dipakai mendeteksi kebocoran scoping. */
    private function createForeignHubRow(): array
    {
        $hub = Hub::create([
            'hub_code' => 'HUB-TEST-LUAR',
            'hub_name' => 'Hub Uji Luar',
            'city' => 'Bogor',
            'latitude' => -6.5000000,
            'longitude' => 106.8000000,
            'service_radius_km' => 4.0,
            'max_capacity_parcels' => 500,
            'current_parcels_count' => 10,
        ]);
        $resi = '999988887777';
        $order = Order::create([
            'order_number' => $resi,
            'hub_origin_id' => $hub->id,
            'service_type' => 'Same Day',
            'category' => 'Dokumen',
            'weight_kg' => 1.00,
            'destination_address' => 'Jl. Luar Kota No. 1',
            'destination_city' => 'Bogor',
            'drop_latitude' => -6.5000000,
            'drop_longitude' => 106.8000000,
            'order_time' => now()->subHour(),
            'sla_deadline' => now()->addHour(),
            'delivery_status' => 'IN_TRANSIT',
        ]);
        $couriers = Courier::orderBy('courier_code')->take(2)->get();
        AuditLog::create([
            'log_code' => 'AUD-TEST-LUAR-0001',
            'order_id' => $order->id,
            'original_courier_id' => $couriers[0]->id,
            'replacement_courier_id' => $couriers[1]->id,
            'executor_user_id' => $this->halimAdmin()->id,
            'incident_category' => 'Banjir',
            'incident_detail' => 'Uji scoping',
            'resolution_time_seconds' => 10.00,
            'is_sla_saved' => true,
            'audit_hash' => 'hash-uji',
            'created_at' => now(),
        ]);

        return ['hub' => $hub, 'resi' => $resi];
    }
}
