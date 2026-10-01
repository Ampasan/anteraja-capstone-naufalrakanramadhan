<?php

namespace App\Services\Incident;

use App\Models\IncidentReport;

/**
 * Generator laporan insiden harian (format CSV).
 *
 * Dipakai dua tempat supaya format kolom tidak pernah beda:
 *  - command `report:daily-incidents` (dijadwalkan tiap hari 08:00 WIB)
 *  - endpoint GET /api/incidents/export (unduhan manual oleh Admin Hub)
 */
class DailyIncidentReportService
{
    /** Batas baris per unduhan laporan harian (mengikuti batas ekspor FRD-04). */
    public const MAX_ROWS = 10000;

    /**
     * Susun baris laporan untuk tanggal tertentu.
     *
     * @param  string|null  $date    Format Y-m-d, default hari ini.
     * @param  string|null  $hubId   Batasi ke satu hub (opsional).
     * @return array<int, array<string, mixed>>
     */
    public function rows(?string $date = null, ?string $hubId = null): array
    {
        $day = $date ? \Illuminate\Support\Carbon::parse($date)->startOfDay() : now()->startOfDay();

        $query = IncidentReport::query()
            ->with(['order', 'courier', 'replacementCourier'])
            ->whereDate('reported_at', $day)
            ->orderBy('reported_at', 'asc');

        if ($hubId) {
            $query->whereHas('order', fn ($q) => $q->where('hub_origin_id', $hubId));
        }

        return $query->limit(self::MAX_ROWS)->get()
            ->map(function (IncidentReport $incident) {
                $duration = null;
                if ($incident->reported_at && $incident->resolved_at) {
                    $duration = round($incident->reported_at->diffInMinutes($incident->resolved_at), 1);
                }

                return [
                    'incident_code' => $incident->incident_code,
                    'reported_at' => $incident->reported_at?->format('Y-m-d H:i:s'),
                    'order_number' => $incident->order?->order_number ?? '-',
                    'service_type' => $incident->order?->service_type ?? '-',
                    'courier_name' => $incident->courier?->name ?? '-',
                    'replacement_courier' => $incident->replacementCourier?->name ?? '-',
                    'category' => $incident->incident_category,
                    'title' => $incident->title,
                    'location' => $incident->location_address ?? '-',
                    'weather' => $incident->weather_condition ?? '-',
                    'temperature_c' => $incident->temperature_c ?? '-',
                    'status' => $incident->status,
                    'resolved_at' => $incident->resolved_at?->format('Y-m-d H:i:s') ?? '-',
                    'duration_minutes' => $duration ?? '-',
                ];
            })
            ->toArray();
    }

    /**
     * Rekapitulasi KPI laporan harian.
     *
     * @return array<string, int|array<string, int>>
     */
    public function summary(?string $date = null, ?string $hubId = null): array
    {
        $rows = $this->rows($date, $hubId);

        $byCategory = [];
        foreach ($rows as $row) {
            $byCategory[$row['category']] = ($byCategory[$row['category']] ?? 0) + 1;
        }

        return [
            'total' => count($rows),
            'resolved' => count(array_filter($rows, fn ($r) => $r['status'] === 'RESOLVED')),
            'escalated' => count(array_filter($rows, fn ($r) => $r['status'] === 'ESCALATED')),
            'pending' => count(array_filter($rows, fn ($r) => in_array($r['status'], ['REPORTED', 'ACKNOWLEDGED', 'REASSIGNING'], true))),
            'by_category' => $byCategory,
        ];
    }

    /**
     * Ubah baris laporan menjadi isi berkas CSV.
     *
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function toCsv(array $rows): string
    {
        $handle = fopen('php://temp', 'r+');

        fputcsv($handle, [
            'Kode Insiden', 'Waktu Lapor', 'Resi', 'Layanan',
            'Kurir', 'Kurir Pengganti', 'Kategori', 'Judul',
            'Lokasi', 'Cuaca', 'Suhu (C)', 'Status',
            'Waktu Selesai', 'Lama Penanganan (menit)',
        ]);

        foreach ($rows as $row) {
            fputcsv($handle, [
                $row['incident_code'],
                $row['reported_at'],
                $row['order_number'],
                $row['service_type'],
                $row['courier_name'],
                $row['replacement_courier'],
                $row['category'],
                $row['title'],
                $row['location'],
                $row['weather'],
                $row['temperature_c'],
                $row['status'],
                $row['resolved_at'],
                $row['duration_minutes'],
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }
}
