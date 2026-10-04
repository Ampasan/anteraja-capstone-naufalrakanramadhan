<?php

namespace Tests\Unit;

use App\Services\Courier\CourierService;
use Tests\TestCase;

/**
 * haversineMetres menentukan penanda "di luar radius" di peta dan urutan
 * kandidat pengganti, jadi hasilnya dikunci pada kasus jarak yang diketahui.
 */
class CourierServiceTest extends TestCase
{
    public function test_distance_is_zero_for_identical_points(): void
    {
        $this->assertSame(0.0, CourierService::haversineMetres(-6.2651893, 106.8767953, -6.2651893, 106.8767953));
    }

    public function test_one_degree_latitude_at_equator_is_about_111km(): void
    {
        $distance = CourierService::haversineMetres(0.0, 0.0, 1.0, 0.0);

        $this->assertEqualsWithDelta(111194.93, $distance, 1.0);
    }

    public function test_one_thousandth_degree_is_about_111metres(): void
    {
        $distance = CourierService::haversineMetres(0.0, 0.0, 0.001, 0.0);

        $this->assertEqualsWithDelta(111.19, $distance, 0.5);
    }

    public function test_distance_is_symmetric(): void
    {
        $forward = CourierService::haversineMetres(-6.2651893, 106.8767953, -6.9538120, 107.6274190);
        $backward = CourierService::haversineMetres(-6.9538120, 107.6274190, -6.2651893, 106.8767953);

        $this->assertEqualsWithDelta($forward, $backward, 1e-6);
        $this->assertGreaterThan(50000.0, $forward);
    }
}
