<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Export audit log ke format XLSX (2 sheet).
 */
class AuditLogExport implements WithMultipleSheets
{
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