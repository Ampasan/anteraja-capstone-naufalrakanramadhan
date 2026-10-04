<?php

namespace App\Support;

use Illuminate\Support\Carbon;

final class OperationalClock
{
    /** Zona jam operasional. */
    private const TIMEZONE = 'Asia/Jakarta';

    /** @var Carbon|null hasil parse terakhir, dipakai ulang selama konfigurasi tetap. */
    private static ?Carbon $frozen = null;

    /** @var string|null kunci konfigurasi pembentuk $frozen. */
    private static ?string $frozenKey = null;

    private function __construct()
    {
    }
    public static function now(): Carbon
    {
        $at = (string) config('app.operational_now');
        $timezone = (string) config('app.timezone');
        $key = $at . '|' . $timezone;

        if (self::$frozen === null || self::$frozenKey !== $key) {
            self::$frozen = Carbon::parse($at)->setTimezone($timezone);
            self::$frozenKey = $key;
        }

        return self::$frozen->copy();
    }

    public static function sqlLiteral(): string
    {
        return self::now()->format('Y-m-d H:i:s');
    }

    /**
     * @param int $dayOffset  Selisih hari terhadap tanggal jam operasional (negatif = sebelumnya).
     */
    public static function wib(int $hour, int $minute, int $dayOffset = 0): Carbon
    {
        return self::now()
            ->setTimezone(self::TIMEZONE)
            ->startOfDay()
            ->addDays($dayOffset)
            ->setTime($hour, $minute)
            ->setTimezone(config('app.timezone'));
    }
}