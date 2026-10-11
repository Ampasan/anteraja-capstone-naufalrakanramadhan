<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class Iso8601
{
    private function __construct()
    {
    }

    /**
     * @return string|null string ISO-8601 UTC (mis. `2026-10-03T07:00:00.000000Z`)
     */
    public static function of(CarbonInterface $date): ?string
    {
        $offsetZero = $date->utcOffset() === 0;
        $normalYear = $date->year >= 1000 && $date->year <= 9999;

        if (! $offsetZero || ! $normalYear) {
            return $date->toISOString();
        }

        return $date->rawFormat('Y-m-d\TH:i:s.u\Z');
    }
}