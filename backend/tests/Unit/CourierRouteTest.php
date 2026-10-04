<?php

namespace Tests\Unit;

use App\Services\Courier\CourierService;
use App\Support\CourierRoute;
use Tests\TestCase;

/**
 * Lintasan kurir harus deterministik (posisi = f(kode, waktu)) dan selalu
 * berada di dalam radius layan hub supaya penanda peta tidak melompat.
 */
class CourierRouteTest extends TestCase
{
    /** Hub Halim, dipakai sebagai pusat putaran. */
    private const HUB_LAT = -6.2651893;

    private const HUB_LNG = 106.8767953;

    public function test_loop_is_identical_for_same_courier_code(): void
    {
        $first = CourierRoute::loop('HLM-001', self::HUB_LAT, self::HUB_LNG);
        $again = CourierRoute::loop('HLM-001', self::HUB_LAT, self::HUB_LNG);
        $other = CourierRoute::loop('HLM-002', self::HUB_LAT, self::HUB_LNG);

        $this->assertSame($first, $again);
        $this->assertNotSame($first, $other);
    }

    public function test_loop_points_stay_between_min_and_max_radius(): void
    {
        foreach (CourierRoute::loop('HLM-001', self::HUB_LAT, self::HUB_LNG) as [$lat, $lng]) {
            $distance = CourierService::haversineMetres($lat, $lng, self::HUB_LAT, self::HUB_LNG);

            $this->assertGreaterThan(800.0, $distance);
            $this->assertLessThan(3700.0, $distance);
        }
    }

    public function test_length_is_positive_for_closed_loop(): void
    {
        $loop = CourierRoute::loop('HLM-001', self::HUB_LAT, self::HUB_LNG);

        $this->assertCount(5, $loop);
        $this->assertGreaterThan(0.0, CourierRoute::length($loop));
    }

    public function test_at_zero_and_full_round_land_on_start_point(): void
    {
        $loop = CourierRoute::loop('HLM-001', self::HUB_LAT, self::HUB_LNG);
        $start = CourierRoute::at($loop, 0.0);
        $afterRound = CourierRoute::at($loop, CourierRoute::length($loop));

        $this->assertSame($loop[0], $start);
        $this->assertEqualsWithDelta($loop[0][0], $afterRound[0], 1e-9);
        $this->assertEqualsWithDelta($loop[0][1], $afterRound[1], 1e-9);
    }

    public function test_at_wraps_distance_and_stays_inside_loop_bounds(): void
    {
        $loop = CourierRoute::loop('HLM-001', self::HUB_LAT, self::HUB_LNG);
        $oneRound = CourierRoute::length($loop);
        $half = CourierRoute::at($loop, $oneRound / 2);
        $wrapped = CourierRoute::at($loop, $oneRound / 2 + $oneRound);

        $this->assertEqualsWithDelta($half[0], $wrapped[0], 1e-9);
        $this->assertEqualsWithDelta($half[1], $wrapped[1], 1e-9);

        $lats = array_column($loop, 0);
        $lngs = array_column($loop, 1);
        $this->assertGreaterThanOrEqual(min($lats) - 1e-6, $wrapped[0]);
        $this->assertLessThanOrEqual(max($lats) + 1e-6, $wrapped[0]);
        $this->assertGreaterThanOrEqual(min($lngs) - 1e-6, $wrapped[1]);
        $this->assertLessThanOrEqual(max($lngs) + 1e-6, $wrapped[1]);
    }

    public function test_at_empty_loop_returns_origin_point(): void
    {
        $this->assertSame([0.0, 0.0], CourierRoute::at([], 100.0));
    }
}
