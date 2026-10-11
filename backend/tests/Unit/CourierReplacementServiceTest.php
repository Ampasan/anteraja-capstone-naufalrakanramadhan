<?php

namespace Tests\Unit;

use App\Models\Courier;
use App\Models\Hub;
use App\Models\Order;
use App\Services\Courier\CourierReplacementService;
use Tests\TestCase;

/**
 * Kandidat pengganti dan aturan kompatibilitas armada tidak membutuhkan
 * database: daftar kurir disiapkan sebagai koleksi model tanpa baris tersimpan.
 */
class CourierReplacementServiceTest extends TestCase
{
    private CourierReplacementService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new CourierReplacementService();
    }

    public function test_two_wheeler_covers_motorcycle_family_only(): void
    {
        $expected = [
            'Motorcycle' => true,
            'Motor Listrik' => true,
            'Motorcycle thermal box' => true,
            'SEPEDA MOTOR' => true,
            'Van' => false,
            'Blind Van' => false,
            'Truk Box' => false,
            'Pick Up Box' => false,
        ];

        foreach ($expected as $vehicleType => $isTwoWheeler) {
            $this->assertSame($isTwoWheeler, CourierReplacementService::isTwoWheeler($vehicleType), $vehicleType);
        }
    }

    public function test_compatibility_follows_service_requirements(): void
    {
        $van = $this->courier('v', 'Van');
        $motor = $this->courier('m', 'Motorcycle');
        $thermal = $this->courier('t', 'Van', ['has_thermal_box' => true]);
        $bpom = $this->courier('b', 'Van', ['is_bpom_certified' => true]);

        $this->assertTrue($this->service->isCompatible($van, $this->order('Cargo')));
        $this->assertFalse($this->service->isCompatible($motor, $this->order('Cargo')));
        // Case & spasi di sekitar nama layanan diabaikan pemilihan armada.
        $this->assertTrue($this->service->isCompatible($van, $this->order(' cargo ')));
        $this->assertFalse($this->service->isCompatible($motor, $this->order(' cargo ')));
        $this->assertTrue($this->service->isCompatible($thermal, $this->order('Frozen')));
        $this->assertFalse($this->service->isCompatible($van, $this->order('Frozen')));
        $this->assertTrue($this->service->isCompatible($bpom, $this->order('PHARMA')));
        $this->assertFalse($this->service->isCompatible($van, $this->order('PHARMA')));
        $this->assertTrue($this->service->isCompatible($van, $this->order('Same Day')));
        $this->assertTrue($this->service->isCompatible(null, $this->order('Cargo')));
    }

    public function test_candidates_drop_excluded_ids_and_incompatible_armada(): void
    {
        $couriers = collect([
            $this->courier('id-1', 'Van'),
            $this->courier('id-2', 'Motorcycle'),
            $this->courier('id-3', 'Van'),
        ]);

        $candidates = $this->service->candidatesFromCollection($couriers, ['id-1'], 0, $this->order('Cargo'));

        $this->assertCount(1, $candidates);
        $this->assertSame('id-3', $candidates[0]['id']);
    }

    public function test_candidates_respect_required_capacity(): void
    {
        $couriers = collect([
            $this->courier('kecil', 'Van', ['max_capacity_kg' => 10.0]),
            $this->courier('besar', 'Van', ['max_capacity_kg' => 500.0]),
        ]);

        $candidates = $this->service->candidatesFromCollection($couriers, [], 120.0);

        $this->assertCount(1, $candidates);
        $this->assertSame('besar', $candidates[0]['id']);
    }

    public function test_bad_weather_drops_two_wheelers_but_keeps_enclosed_armada(): void
    {
        $couriers = collect([
            $this->courier('m', 'Motorcycle'),
            $this->courier('v', 'Van'),
        ]);

        $enclosedOnly = $this->service->candidatesFromCollection($couriers, [], 0, null, null, true);
        $sameFamily = $this->service->candidatesFromCollection($couriers, [], 0, null, null, false, 2, 'Motorcycle');

        $this->assertSame(['v'], array_column($enclosedOnly, 'id'));
        $this->assertSame(['m'], array_column($sameFamily, 'id'));
    }

    public function test_candidate_badges_mark_recommendation_and_follow_eta_formula(): void
    {
        $hub = (new Hub())->forceFill(['latitude' => -6.2651893, 'longitude' => 106.8767953]);
        $couriers = collect([
            $this->courier('id-1', 'Van', ['name' => 'Budi Santoso'], $hub),
            $this->courier('id-2', 'Van', ['name' => 'Ahmad Fauzi'], $hub),
        ]);
        $from = ['lat' => -6.2751893, 'lng' => 106.8767953];

        $candidates = $this->service->candidatesFromCollection($couriers, [], 0, null, $from, false, 5);

        $this->assertCount(2, $candidates);
        $this->assertSame('Rekomendasi Utama', $candidates[0]['badge']);
        $this->assertTrue($candidates[0]['is_recommended']);
        $this->assertSame('Alternatif 2', $candidates[1]['badge']);
        $this->assertFalse($candidates[1]['is_recommended']);
        $this->assertSame('BS', $candidates[0]['initials']);
        $this->assertGreaterThan(0, $candidates[0]['distance_m']);
        // Rumus ETA: kecepatan rata-rata 417 m/menit, dibatasi 1-60 menit.
        $expectedEta = (int) min(60, max(1, (int) ceil($candidates[0]['distance_m'] / 417)));
        $this->assertSame($expectedEta, $candidates[0]['eta_minutes']);
    }

    private function courier(string $id, string $vehicleType, array $attributes = [], ?Hub $hub = null): Courier
    {
        $courier = (new Courier())->forceFill(array_merge([
            'id' => $id,
            'courier_code' => strtoupper($id),
            'name' => 'Budi Santoso',
            'vehicle_type' => $vehicleType,
            'status' => 'IDLE',
            'current_parcel_count' => 0,
            'max_capacity_kg' => 100.0,
            'has_thermal_box' => false,
            'is_bpom_certified' => false,
        ], $attributes));

        // Relasi dipasang manual supaya pemanggilan tak memicu query lazy-load.
        $courier->setRelation('latestTelemetry', null);
        $courier->setRelation('hub', $hub);

        return $courier;
    }

    private function order(string $serviceType): Order
    {
        return new Order(['service_type' => $serviceType]);
    }
}
