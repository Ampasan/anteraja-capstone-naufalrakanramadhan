<?php

namespace App\Exports;

use App\Services\Incident\DailyIncidentReportService;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Ekspor laporan insiden harian ke XLSX.
 */
class IncidentDailyExport implements FromArray, WithHeadings, WithStyles
{
    public function __construct(
        private DailyIncidentReportService $service,
        private array $rows,
    ) {}

    public function array(): array
    {
        return array_map(fn (array $row) => $this->service->flatten($row), $this->rows);
    }

    public function headings(): array
    {
        return array_values($this->service->columns());
    }

    /**
     * @return array<int, array<string, array<string, mixed>>>
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => [
                'font' => ['bold' => true, 'color' => ['rgb' => 'C91076']],
                'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'FFF0F6']],
            ],
        ];
    }
}