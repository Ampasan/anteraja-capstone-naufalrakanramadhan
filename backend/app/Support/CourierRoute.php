<?php

namespace App\Support;

class CourierRoute
{
    /** Jumlah titik putaran tiap kurir. */
    private const POINTS = 5;

    /** Jari-jari terdekat & terjauh titik putaran, dalam meter. */
    private const MIN_RADIUS_M = 900.0;

    private const MAX_RADIUS_M = 3600.0;

    /**
     * @return array<int, array{0: float, 1: float}>
     */
    public static function loop(string $courierCode, float $hubLat, float $hubLng): array
    {
        $seed = crc32($courierCode);
        $base = 2 * M_PI * self::rnd($seed, 999);
        $points = [];

        for ($i = 0; $i < self::POINTS; $i++) {
            $angle = $base
                + 2 * M_PI * ($i / self::POINTS)
                + (self::rnd($seed, $i) - 0.5) * 0.9;
            $radius = self::MIN_RADIUS_M
                + self::rnd($seed, 100 + $i) * (self::MAX_RADIUS_M - self::MIN_RADIUS_M);

            $points[] = self::offset($hubLat, $hubLng, $radius, $angle);
        }

        return $points;
    }

    /**
     * @param  array<int, array{0: float, 1: float}>  $loop
     */
    public static function length(array $loop): float
    {
        $total = 0.0;
        $count = count($loop);

        for ($i = 0; $i < $count; $i++) {
            $next = $loop[($i + 1) % $count];
            $total += self::haversine($loop[$i][0], $loop[$i][1], $next[0], $next[1]);
        }

        return $total;
    }

    /**
     * @param  array<int, array{0: float, 1: float}>  $loop
     * @return array{0: float, 1: float}
     */
    public static function at(array $loop, float $metres): array
    {
        $count = count($loop);
        if ($count === 0) {
            return [0.0, 0.0];
        }

        $total = self::length($loop);
        if ($total <= 0.0) {
            return $loop[0];
        }

        $travel = fmod($metres, $total);
        if ($travel < 0) {
            $travel += $total;
        }

        for ($i = 0; $i < $count; $i++) {
            $from = $loop[$i];
            $to = $loop[($i + 1) % $count];
            $segment = self::haversine($from[0], $from[1], $to[0], $to[1]);

            if ($travel <= $segment || $i === $count - 1) {
                $ratio = $segment > 0 ? $travel / $segment : 0.0;

                return [
                    $from[0] + ($to[0] - $from[0]) * $ratio,
                    $from[1] + ($to[1] - $from[1]) * $ratio,
                ];
            }

            $travel -= $segment;
        }

        return $loop[0];
    }

    private static function rnd(int $seed, int $index): float
    {
        $x = ($seed ^ ($index * 2654435761)) & 0x7fffffff;
        $x ^= ($x << 13) & 0x7fffffff;
        $x ^= $x >> 17;
        $x ^= ($x << 5) & 0x7fffffff;
        $x &= 0x7fffffff;

        return $x / 0x7fffffff;
    }

    /**
     * @return array{0: float, 1: float}
     */
    private static function offset(float $lat, float $lng, float $metres, float $angle): array
    {
        $metresPerLatDeg = 110574.0;
        $metresPerLngDeg = 111320.0 * cos(deg2rad($lat));

        if (abs($metresPerLngDeg) < 1.0) {
            $metresPerLngDeg = 1.0;
        }

        return [
            $lat + ($metres * cos($angle)) / $metresPerLatDeg,
            $lng + ($metres * sin($angle)) / $metresPerLngDeg,
        ];
    }

    private static function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $toRad = fn (float $deg): float => $deg * M_PI / 180;

        $dLat = $toRad($lat2 - $lat1);
        $dLng = $toRad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos($toRad($lat1)) * cos($toRad($lat2)) * sin($dLng / 2) ** 2;

        return 6371000.0 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}