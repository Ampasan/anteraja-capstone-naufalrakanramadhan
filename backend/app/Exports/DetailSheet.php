<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

/**
 * Sheet 2: tabel rincian transaksi pengalihan kurir.
 * Kolom sengaja disamakan dengan ekspor CSV agar format laporan konsisten.
 */
class DetailSheet implements FromCollection, WithHeadings, WithTitle
{
    public function __construct(
        private array $rows,
        private array $meta = [],
    ) {}

    public function title(): string
    {
        return 'Rincian Transaksi';
    }

    /**
     * @return array<int, array<int, string|float|bool>>
     */
    public function headings(): array
    {
        $headings = [
            'Kode Log', 'Resi', 'Layanan', 'Waktu Selesai',
            'Kurir Asal', 'Kurir Tujuan', 'Kategori', 'Detail',
            'Waktu Penanganan (detik)', 'SLA Compliant', 'Executor',
        ];

        if (!empty($this->meta['with_evidence'])) {
            $headings[] = 'Foto Bukti';
        }

        return $headings;
    }

    public function collection(): iterable
    {
        $withEvidence = !empty($this->meta['with_evidence']);

        return collect($this->rows)->map(function (array $r) use ($withEvidence) {
            $row = [
                $r['log_code'],
                $r['resi'],
                $r['service_type'],
                $r['completed_at'],
                $r['from_courier'] ?? '-',
                $r['to_courier'] ?? '-',
                $r['incident_category'],
                $r['incident_detail'] ?? '-',
                $r['handling_seconds'],
                $r['sla_compliant'] ? 'Ya' : 'Tidak',
                $r['executor_name'] ?? '-',
            ];

            if ($withEvidence) {
                $row[] = $r['evidence_image_url'] ?? '-';
            }

            return $row;
        });
    }
}
