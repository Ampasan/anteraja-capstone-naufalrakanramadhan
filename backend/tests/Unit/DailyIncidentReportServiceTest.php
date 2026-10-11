<?php

namespace Tests\Unit;

use App\Services\Incident\DailyIncidentReportService;
use Tests\TestCase;

/**
 * Laporan harian dipakai tiga kanal (CSV/XLSX/PDF), jadi kolom dan
 * rekapitulasi diuji sebagai fungsi murni: array masuk, array keluar.
 */
class DailyIncidentReportServiceTest extends TestCase
{
    private DailyIncidentReportService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DailyIncidentReportService();
    }

    public function test_columns_cover_every_field_of_a_report_row(): void
    {
        $columns = $this->service->columns();

        $this->assertCount(14, $columns);
        $this->assertSame('Kode Insiden', $columns['incident_code']);
        $this->assertArrayHasKey('duration_minutes', $columns);
    }

    public function test_flatten_follows_column_order_and_fills_missing_keys(): void
    {
        $flat = $this->service->flatten(['incident_code' => 'INC-HLM-082', 'status' => 'REPORTED']);
        $keys = array_keys($this->service->columns());

        $this->assertCount(count($keys), $flat);
        $this->assertSame('INC-HLM-082', $flat[0]);
        $this->assertSame('-', $flat[1]);
        $this->assertSame('REPORTED', $flat[array_search('status', $keys, true)]);
    }

    public function test_summarize_counts_status_and_groups_category(): void
    {
        $rows = [
            ['status' => 'RESOLVED', 'category' => 'Banjir'],
            ['status' => 'ESCALATED', 'category' => 'Banjir'],
            ['status' => 'REPORTED', 'category' => 'Mogok Kendaraan'],
            ['status' => 'ACKNOWLEDGED', 'category' => 'Mogok Kendaraan'],
            ['status' => 'REASSIGNING', 'category' => 'Banjir'],
        ];

        $summary = $this->service->summarize($rows);

        $this->assertSame(5, $summary['total']);
        $this->assertSame(1, $summary['resolved']);
        $this->assertSame(1, $summary['escalated']);
        $this->assertSame(3, $summary['pending']);
        $this->assertSame(['Banjir' => 3, 'Mogok Kendaraan' => 2], $summary['by_category']);
    }

    public function test_summarize_of_empty_rows_is_all_zero(): void
    {
        $summary = $this->service->summarize([]);

        $this->assertSame(0, $summary['total']);
        $this->assertSame([], $summary['by_category']);
    }

    public function test_to_csv_writes_header_then_one_line_per_row(): void
    {
        $csv = $this->service->toCsv([
            ['incident_code' => 'INC-HLM-082', 'status' => 'REPORTED', 'category' => 'Mogok Kendaraan'],
        ]);
        $lines = explode("\n", trim($csv));

        $this->assertCount(2, $lines);
        $this->assertSame(array_values($this->service->columns()), str_getcsv($lines[0]));

        $row = str_getcsv($lines[1]);
        $this->assertCount(count($this->service->columns()), $row);
        $this->assertSame('INC-HLM-082', $row[0]);
    }

    public function test_to_csv_without_rows_contains_only_the_header(): void
    {
        $lines = explode("\n", trim($this->service->toCsv([])));

        $this->assertCount(1, $lines);
        $this->assertSame('Kode Insiden', str_getcsv($lines[0])[0]);
    }
}
