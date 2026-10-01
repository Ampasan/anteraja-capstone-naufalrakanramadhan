<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Export audit log ke format XLSX (2 sheet).
 *
 * FRD-04 / BR-03 mewajibkan setiap berkas ekspor memuat:
 *   1. Rekapitulasi KPI (Total Incidents, Reassignment Rate,
 *      Avg Resolution Time, SLA Saved Rate)
 *   2. Tabel rincian transaksi
 *
 * Oleh karena itu sheet dibagi dua: "Rekap KPI" dan "Rincian Transaksi".
 */
class AuditLogExport implements WithMultipleSheets
{
    /** Batas baris per unduhan (FRD-04 / BR-03: maksimal 10.000 baris). */
    public const MAX_ROWS = 10000;

    public function __construct(
        private array $summary,
        private array $rows,
        private array $meta = [],
    ) {}

    /**
     * Daftar sheet yang akan ditulis ke berkas XLSX.
     */
    public function sheets(): array
    {
        return [
            new KpiSheet($this->summary, $this->meta),
            new DetailSheet(
                array_slice($this->rows, 0, self::MAX_ROWS),
                $this->meta,
            ),
        ];
    }
}
