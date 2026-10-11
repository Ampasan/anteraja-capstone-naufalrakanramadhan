<?php

namespace Tests\Unit;

use App\Support\OperationalClock;
use Tests\TestCase;

/**
 * Jam operasional dikunci lewat config, bukan jam dinding, sehingga angka
 * panel stabil; karenanya uji ini mengunci nilai bawaan `app.operational_now`
 * (2026-10-03 14.00 WIB = 07.00 UTC).
 */
class OperationalClockTest extends TestCase
{
    public function test_now_reads_the_frozen_clock_in_application_timezone(): void
    {
        $now = OperationalClock::now();

        $this->assertSame('UTC', $now->timezoneName);
        $this->assertSame('2026-10-03 07:00:00', $now->format('Y-m-d H:i:s'));
    }

    public function test_now_follows_config_override(): void
    {
        config()->set('app.operational_now', '2025-06-01T09:30:00+07:00');

        $this->assertSame('2025-06-01 02:30:00', OperationalClock::now()->format('Y-m-d H:i:s'));
    }

    public function test_sql_literal_is_utc_without_zone_suffix(): void
    {
        // Literal ini masuk ke perbandingan SQL, jadi tidak boleh membawa
        // zona Asia/Jakarta nilai konfigurasi.
        $this->assertSame('2026-10-03 07:00:00', OperationalClock::sqlLiteral());
    }

    public function test_wib_converts_wall_time_back_to_application_timezone(): void
    {
        $this->assertSame('2026-10-03 01:20:00', OperationalClock::wib(8, 20)->format('Y-m-d H:i:s'));
    }

    public function test_wib_day_offset_moves_calendar_day_in_wib(): void
    {
        $this->assertSame('2026-10-02 01:20:00', OperationalClock::wib(8, 20, -1)->format('Y-m-d H:i:s'));
        $this->assertSame('2026-10-04 01:20:00', OperationalClock::wib(8, 20, 1)->format('Y-m-d H:i:s'));
    }

    public function test_default_clock_stays_inside_operational_window(): void
    {
        $hour = OperationalClock::now()->setTimezone('Asia/Jakarta')->hour;

        $this->assertGreaterThanOrEqual(8, $hour);
        $this->assertLessThan(20, $hour);
    }
}
