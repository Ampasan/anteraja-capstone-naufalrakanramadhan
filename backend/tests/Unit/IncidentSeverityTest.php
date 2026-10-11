<?php

namespace Tests\Unit;

use App\Models\IncidentReport;
use App\Models\Order;
use App\Services\Cloudinary\CloudinaryService;
use App\Services\Courier\CourierReplacementService;
use App\Services\Incident\IncidentService;
use Tests\TestCase;

/**
 * Severity dan label status hanya dipakai untuk menampilkan kartu insiden;
 * keduanya dipantulkan langsung karena tak punya padanan di endpoint API lain.
 */
class IncidentSeverityTest extends TestCase
{
    private IncidentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new IncidentService(new CourierReplacementService(), new CloudinaryService());
    }

    public function test_critical_severity_for_pharma_mogok_and_hot_frozen(): void
    {
        $this->assertSame('CRITICAL', $this->severity('PHARMA'));
        $this->assertSame('CRITICAL', $this->severity('Same Day', ['incident_category' => 'Mogok Kendaraan']));
        $this->assertSame('CRITICAL', $this->severity('Frozen', ['temperature_c' => 6.2]));
    }

    public function test_warning_severity_for_other_incidents(): void
    {
        $this->assertSame('WARNING', $this->severity('Frozen', ['temperature_c' => 3.0]));
        $this->assertSame('WARNING', $this->severity('Same Day', ['incident_category' => 'Cuaca / Hujan']));
    }

    public function test_status_label_translates_every_known_status(): void
    {
        $label = $this->private('getStatusLabel');

        $this->assertSame('Klik untuk Evaluasi', $label->invoke($this->service, 'REPORTED'));
        $this->assertSame('Sedang Ditinjau', $label->invoke($this->service, 'ACKNOWLEDGED'));
        $this->assertSame('Sedang Dialihkan', $label->invoke($this->service, 'REASSIGNING'));
        $this->assertSame('Telah Dialihkan', $label->invoke($this->service, 'RESOLVED'));
        $this->assertSame('Klik untuk Evaluasi', $label->invoke($this->service, 'ESCALATED'));
        $this->assertSame('BARU', $label->invoke($this->service, 'BARU'));
    }

    private function severity(string $serviceType, array $attributes = []): string
    {
        $incident = (new IncidentReport())->forceFill($attributes);
        // orderField membaca relasi order bila baris tidak datang dari query JOIN.
        $incident->setRelation('order', new Order(['service_type' => $serviceType]));

        return $this->private('calculateSeverity')->invoke($this->service, $incident);
    }

    private function private(string $method): \ReflectionMethod
    {
        $reflection = new \ReflectionMethod(IncidentService::class, $method);
        $reflection->setAccessible(true);

        return $reflection;
    }
}
