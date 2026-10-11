<?php

namespace Tests\Unit;

use App\Models\Hub;
use App\Support\TabelQuery;
use Database\Seeders\HubSeeder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * TabelQuery memakai window function COUNT(*) OVER (), jadi uji paginate
 * tetap membutuhkan database (sqlite :memory: lewat RefreshDatabase).
 */
class TabelQueryTest extends TestCase
{
    use RefreshDatabase;

    private function hubQuery(): Builder
    {
        // select eksplisit meniru pemakaian asli: TabelQuery menambahkan
        // kolom window ke select yang sudah dipasang pemanggil.
        return Hub::query()->select(['hubs.*'])->orderBy('hub_name');
    }

    private function searchTabel(): TabelQuery
    {
        $tabel = new TabelQuery();
        $tabel->filter('search', fn (Builder $query, $value) => $query->where('hub_name', 'like', "%{$value}%"));

        return $tabel;
    }

    public function test_filter_registers_constraint_and_returns_same_instance(): void
    {
        $tabel = new TabelQuery();

        $this->assertSame($tabel, $tabel->filter('search', fn (Builder $query) => $query->where('city', 'Depok')));
    }

    public function test_paginate_applies_registered_filter(): void
    {
        $this->seed(HubSeeder::class);

        $result = $this->searchTabel()->paginate($this->hubQuery(), ['search' => 'Halim']);

        $this->assertSame(1, $result['total']);
        $this->assertCount(1, $result['data']);
        $this->assertSame('HUB-JAKTIM-HALIM', $result['data']->first()->hub_code);
        $this->assertArrayNotHasKey('__total_count', $result['data']->first()->getAttributes());
    }

    public function test_paginate_skips_empty_filter_values(): void
    {
        $this->seed(HubSeeder::class);

        $result = $this->searchTabel()->paginate($this->hubQuery(), ['search' => '']);
        $resultNull = $this->searchTabel()->paginate($this->hubQuery(), ['search' => null]);

        $this->assertSame(5, $result['total']);
        $this->assertSame(5, $resultNull['total']);
    }

    public function test_paginate_reports_consistent_page_metadata(): void
    {
        $this->seed(HubSeeder::class);

        $result = (new TabelQuery())->paginate($this->hubQuery(), ['page' => 2, 'per_page' => 2]);

        $this->assertSame(2, $result['page']);
        $this->assertSame(2, $result['per_page']);
        $this->assertSame(5, $result['total']);
        $this->assertSame(3, $result['last_page']);
        $this->assertCount(2, $result['data']);
    }

    public function test_paginate_clamps_per_page_and_page(): void
    {
        $this->seed(HubSeeder::class);
        $tabel = new TabelQuery();

        $tooWide = $tabel->paginate($this->hubQuery(), ['per_page' => 999]);
        $zeroed = $tabel->paginate($this->hubQuery(), ['per_page' => 0, 'page' => 0]);

        $this->assertSame(100, $tooWide['per_page']);
        $this->assertSame(1, $zeroed['per_page']);
        $this->assertSame(1, $zeroed['page']);
    }

    public function test_paginate_on_empty_page_reports_zero_total_from_count_fallback(): void
    {
        $this->seed(HubSeeder::class);

        $result = (new TabelQuery())->paginate($this->hubQuery(), ['page' => 99]);

        $this->assertCount(0, $result['data']);
        // Cadangan count(*) ikut membawa LIMIT/OFFSET halaman, jadi halaman di
        // luar jangkauan melaporkan total 0 (bukan total sebenarnya 5).
        $this->assertSame(0, $result['total']);
        $this->assertSame(0, $result['last_page']);
    }

    public function test_window_total_counts_rows_before_pagination(): void
    {
        $this->seed(HubSeeder::class);

        $result = $this->searchTabel()->paginate($this->hubQuery(), ['search' => 'Hub', 'per_page' => 2]);

        $this->assertSame(5, $result['total']);
        $this->assertCount(2, $result['data']);
    }
}
