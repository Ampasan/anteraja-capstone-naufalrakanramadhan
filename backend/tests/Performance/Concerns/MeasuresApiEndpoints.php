<?php

namespace Tests\Performance\Concerns;

use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Assert;

/**
 * Pengukuran waktu respons dan jumlah query per endpoint.
 *
 * Waktu dihitung dari hrtime di sekitar request test (bukan header), sedangkan
 * jumlah query dibaca dari header X-Query-Count buatan middleware ApiTiming.
 * Keduanya dicatat ke satu tabel markdown agar angka yang masuk dokumentasi
 * berasal dari run yang sama dengan pengujian.
 */
trait MeasuresApiEndpoints
{
    /** @var array<int, array{label: string, median: float, max: float, queries: int}> */
    private static array $measurements = [];

    /**
     * Ukur satu endpoint beberapa kali lalu kembalikan median dan maksimumnya.
     *
     * `flushCache` mengosongkan cache data sebelum tiap run sehingga angkanya
     * benar-benar membayar query (kondisi buka halaman setelah cache dingin).
     * Penanda hub dipasang balik setiap flush supaya Authenticate tidak
     * men-dispatch `cache:warm` secara sinkron di tengah pengukuran.
     *
     * @param  callable(): \Illuminate\Testing\TestResponse  $request
     * @return array{label: string, median: float, max: float, queries: int}
     */
    protected function measureEndpoint(
        string $label,
        callable $request,
        int $runs = 5,
        bool $flushCache = false,
        ?string $hubId = null,
    ): array {
        $request(); // warm-up: dibuang supaya autoloader dan resolusi route tidak ikut terukur.

        $times = [];
        $queryCounts = [];

        for ($i = 0; $i < $runs; $i++) {
            if ($flushCache) {
                Cache::flush();
                $this->markHubActive($hubId);
            }

            // Guard auth menyimpan user hasil verifikasi token di memori proses.
            // Tanpa pengosongan ini, request kedua dan seterusnya lolos tanpa
            // query autentikasi — padahal di produksi tiap request adalah proses
            // baru yang selalu membayar verifikasi token.
            $this->app['auth']->forgetGuards();

            $start = hrtime(true);
            $response = $request();
            $times[] = (hrtime(true) - $start) / 1e6;
            $queryCounts[] = (int) $response->headers->get('X-Query-Count');
        }

        sort($times);

        $measurement = [
            'label' => $label,
            'median' => round($times[(int) floor(count($times) / 2)], 1),
            'max' => round((float) end($times), 1),
            'queries' => max($queryCounts),
        ];

        self::$measurements[] = $measurement;

        return $measurement;
    }

    /**
     * Pasang penanda hub aktif: kunci yang sama dengan
     * Authenticate::markActiveHub, supaya `cache:warm` punya kandidat hub.
     */
    private function markHubActive(?string $hubId): void
    {
        if ($hubId === null) {
            return;
        }

        Cache::add("active_hub:{$hubId}", 1, 120);
        $active = Cache::get('active_hubs', []);

        if (! in_array($hubId, $active, true)) {
            $active[] = $hubId;
            Cache::put('active_hubs', $active, 600);
        }
    }

    /**
     * Anggaran waktu: target produk adalah di bawah 1 detik untuk semua endpoint.
     */
    protected function assertWithinBudget(array $measurement, float $budgetMs = 1000.0): void
    {
        Assert::assertLessThan(
            $budgetMs,
            $measurement['max'],
            sprintf('%s melewati anggaran %.0f ms (maks %.1f ms)', $measurement['label'], $budgetMs, $measurement['max']),
        );
    }

    /**
     * Cetak tabel markdown berisi pengukuran kelas ini (dipanggil dari tearDownAfterClass).
     */
    protected static function printMeasurements(): void
    {
        if (self::$measurements === []) {
            return;
        }

        $lines = [
            '',
            '| Endpoint | Median (ms) | Maks (ms) | Query |',
            '| --- | ---: | ---: | ---: |',
        ];

        foreach (self::$measurements as $m) {
            $lines[] = sprintf('| %s | %.1f | %.1f | %d |', $m['label'], $m['median'], $m['max'], $m['queries']);
        }

        fwrite(STDOUT, implode(PHP_EOL, $lines) . PHP_EOL);
    }
}
