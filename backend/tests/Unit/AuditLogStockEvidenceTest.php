<?php

namespace Tests\Unit;

use App\Models\AuditLog;
use App\Services\AuditLog\AuditLogService;
use Tests\TestCase;

/**
 * Foto bukti cadangan dipilih dari kategori kendala; kategori Frozen sengaja
 * tidak pernah menerima foto (larangan dokumentasi layanan beku, FRD-05).
 */
class AuditLogStockEvidenceTest extends TestCase
{
    public function test_stock_photo_matches_incident_category(): void
    {
        [$banjirUrl, , $banjirCaption] = $this->stockEvidence('Banjir', 'Same Day');
        [$mogokUrl, $mogokId, $mogokCaption] = $this->stockEvidence('Mogok Kendaraan', 'Same Day');

        $this->assertStringContainsString('hujan_s6xvrc', $banjirUrl);
        $this->assertNotEmpty($banjirCaption);
        $this->assertStringContainsString('motor_mogok', $mogokUrl);
        $this->assertSame('foto_bukti/motor-mogok', $mogokId);
        $this->assertNotEmpty($mogokCaption);
    }

    public function test_unknown_category_falls_back_to_default_photo(): void
    {
        [$url] = $this->stockEvidence('Kategori Baru', 'Same Day');

        $this->assertStringContainsString('motor_mogok', $url);
    }

    public function test_frozen_service_and_temperature_anomaly_get_no_photo(): void
    {
        $this->assertSame([null, null, null], $this->stockEvidence('Banjir', 'Frozen'));
        $this->assertSame([null, null, null], $this->stockEvidence('Anomali Suhu', 'Same Day'));
        $this->assertSame([null, null, null], $this->stockEvidence('', 'Same Day'));
    }

    private function stockEvidence(string $category, string $serviceType): array
    {
        $log = (new AuditLog())->forceFill([
            'incident_category' => $category,
            'joined_service_type' => $serviceType,
        ]);
        $reflection = new \ReflectionMethod(AuditLogService::class, 'stockEvidence');
        $reflection->setAccessible(true);

        return $reflection->invoke(new AuditLogService(), $log);
    }
}
