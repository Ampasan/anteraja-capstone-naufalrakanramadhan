<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\SeedsHalim;
use Tests\TestCase;

/**
 * Panel melakukan polling tiap beberapa detik, sehingga dua panggilan beruntun
 * wajib membawa isi yang sama dan angka pengukuran ada di tiap respons.
 */
class CacheAndPerformanceGuardsTest extends TestCase
{
    use RefreshDatabase, SeedsHalim;

    private const BASE = 'http://localhost/api';

    public function test_repeated_calls_serve_identical_payload(): void
    {
        $this->actingAsAdmin();

        foreach (['/couriers', '/orders/sla-risk', '/dashboard/summary', '/tugas/tabel'] as $uri) {
            $first = $this->getJson(self::BASE . $uri)->assertStatus(200)->json('data');
            $second = $this->getJson(self::BASE . $uri)->assertStatus(200)->json('data');

            $this->assertSame($first, $second, $uri);
        }
    }

    public function test_api_responses_carry_timing_and_query_headers(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/dashboard/summary')->assertStatus(200);

        $this->assertMatchesRegularExpression('/^\d+\.\d$/', (string) $response->headers->get('X-Response-Time-Ms'));
        $this->assertSame($response->headers->get('X-Response-Time-Ms'), $response->headers->get('X-Ms'));
        $this->assertIsNumeric($response->headers->get('X-Query-Count'));

        $timing = (string) $response->headers->get('Server-Timing');
        $this->assertStringStartsWith('app;dur=', $timing);
        $this->assertStringContainsString('dbcount;', $timing);
    }

    public function test_api_responses_are_never_stored_by_proxies(): void
    {
        $this->actingAsAdmin();

        $response = $this->getJson(self::BASE . '/dashboard/summary')->assertStatus(200);

        // Symfony menormalkan urutan direktif, jadi diperiksa per direktif.
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('private', $cacheControl);
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('max-age=0', $cacheControl);
    }
}
