<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Services\Order\SlaRiskService;
use Tests\TestCase;

/**
 * Kunci cache tabel tugas menormalkan seluruh parameter sehingga urutan query
 * string pun tak menghasilkan kunci baru; tanpa itu invalidasi versi sia-sia.
 *
 * Pemetaan label/warna/skor dipantulkan langsung karena pedomannya satu-satunya
 * ada di kode (tak ada sumber lain di response API untuk rumus skornya).
 */
class SlaRiskServiceTest extends TestCase
{
    public function test_cache_key_ignores_parameter_order_and_whitespace(): void
    {
        $first = SlaRiskService::tugasTabelCacheKey('hub-1', ['page' => '2', 'per_page' => '10', 'search' => 'Tebet']);
        $second = SlaRiskService::tugasTabelCacheKey('hub-1', ['search' => '  Tebet ', 'per_page' => 10, 'page' => 2]);

        $this->assertSame($first, $second);
    }

    public function test_cache_key_ignores_absent_empty_and_array_values(): void
    {
        $base = SlaRiskService::tugasTabelCacheKey('hub-1', []);

        $this->assertSame($base, SlaRiskService::tugasTabelCacheKey('hub-1', ['search' => null]));
        $this->assertSame($base, SlaRiskService::tugasTabelCacheKey('hub-1', ['risk' => '']));
        $this->assertSame($base, SlaRiskService::tugasTabelCacheKey('hub-1', ['sort' => ['asc']]));
    }

    public function test_cache_key_differs_per_search_term(): void
    {
        $this->assertNotSame(
            SlaRiskService::tugasTabelCacheKey('hub-1', ['search' => 'a']),
            SlaRiskService::tugasTabelCacheKey('hub-1', ['search' => 'b']),
        );
    }

    public function test_bumping_version_invalidates_every_existing_key(): void
    {
        $before = SlaRiskService::tugasTabelCacheKey('hub-1', ['page' => 1]);

        SlaRiskService::bumpTugasTabelVersion('hub-1');

        $after = SlaRiskService::tugasTabelCacheKey('hub-1', ['page' => 1]);

        $this->assertNotSame($before, $after);
        $this->assertSame($after, SlaRiskService::tugasTabelCacheKey('hub-1', ['page' => 1]));
    }

    public function test_risk_label_and_color_follow_risk_level(): void
    {
        $label = $this->private('getRiskLabel');
        $color = $this->private('getRiskColor');

        $this->assertSame('Sangat Tinggi', $label->invoke(null, 'Kritis'));
        $this->assertSame('Sedang', $label->invoke(null, 'Waspada'));
        $this->assertSame('Rendah', $label->invoke(null, 'Aman'));
        $this->assertSame('red', $color->invoke(null, 'Kritis'));
        $this->assertSame('amber', $color->invoke(null, 'Waspada'));
        $this->assertSame('green', $color->invoke(null, 'Aman'));
    }

    public function test_calculate_risk_score_follows_sla_bands_and_penalties(): void
    {
        $score = function (int $minutes, array $attributes = []): int {
            $order = new Order(array_merge(['service_type' => 'Same Day'], $attributes));

            return (int) $this->private('calculateRiskScore')->invoke(null, $minutes, $order);
        };

        $this->assertSame(10, $score(-5));
        $this->assertSame(7, $score(15));
        $this->assertSame(4, $score(60));
        $this->assertSame(2, $score(180));
        $this->assertSame(1, $score(181));
        $this->assertSame(5, $score(60, ['traffic_condition' => 'Macet Total']));
        $this->assertSame(6, $score(60, ['service_type' => 'Frozen', 'temperature_c' => 6.2]));
        $this->assertSame(10, $score(-5, ['service_type' => 'Frozen', 'temperature_c' => 6.2, 'traffic_condition' => 'Padat']));
    }

    public function test_format_condition_reports_weather_traffic_and_temperature(): void
    {
        $condition = fn (array $attributes) => $this->private('formatCondition')
            ->invoke(null, new Order($attributes));

        $this->assertSame('normal-sunny', $condition(['service_type' => 'Same Day'])['key']);
        $this->assertSame(
            'temp-box',
            $condition(['service_type' => 'Frozen', 'temperature_c' => 6.2])['key'],
        );
        $this->assertSame(
            'heavy-rain-traffic',
            $condition(['weather_condition' => 'Hujan lebat', 'traffic_condition' => 'Macet'])['key'],
        );
        $this->assertSame(
            'light-rain',
            $condition(['weather_condition' => 'Hujan Ringan', 'traffic_condition' => 'Lancar'])['key'],
        );
        $this->assertSame(
            'crowded',
            $condition(['weather_condition' => 'Cerah', 'traffic_condition' => 'Padat'])['key'],
        );
    }

    private function private(string $method): \ReflectionMethod
    {
        $reflection = new \ReflectionMethod(SlaRiskService::class, $method);
        $reflection->setAccessible(true);

        return $reflection;
    }
}
