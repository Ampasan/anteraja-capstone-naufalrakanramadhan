<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Sheet 1: rekapitulasi KPI laporan audit log.
 */
class KpiSheet implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(
        private array $summary,
        private array $meta = [],
    ) {}

    public function title(): string
    {
        return 'Rekap KPI';
    }

    public function headings(): array
    {
        return ['Indikator', 'Nilai'];
    }

    /**
     * @return \Illuminate\Support\Collection<int, array<int, string|float|int>>
     */
    public function collection(): iterable
    {
        $s = $this->summary;
        $m = $this->meta;

        return collect([
            ['Nama Hub', $m['hub_name'] ?? '-'],
            ['Kota', $m['hub_city'] ?? '-'],
            ['Periode', $m['period'] ?? 'Semua data'],
            ['Tanggal Generate', $m['generated_at'] ?? now()->format('d-m-Y H:i')],
            ['', ''],
            ['Total Incidents', $s['total_completed'] ?? 0],
            ['Reassignment Rate (%)', $s['reassignment_rate'] ?? 0],
            ['Avg Resolution Time (detik)', $s['avg_handling_seconds'] ?? 0],
            ['SLA Saved Rate (%)', $s['sla_compliance_rate'] ?? 0],
            ['Pengalihan Sesuai SLA', $s['sla_compliant_count'] ?? 0],
            ['Total Order di Hub', $s['total_orders'] ?? 0],
        ]);
    }
}