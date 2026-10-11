<?php

namespace App\Services\Incident;

use App\Models\IncidentReport;

class DailyIncidentReportService
{
    public const MAX_ROWS = 10000;

    /**
     * @param  string|null  $date    Format Y-m-d, default hari ini.
     * @param  string|null  $hubId   Batasi ke satu hub (opsional).
     * @return array<int, array<string, mixed>>
     */
    public function rows(?string $date = null, ?string $hubId = null): array
    {
        $day = $date ? \Illuminate\Support\Carbon::parse($date)->startOfDay() : now()->startOfDay();
        
        $query = IncidentReport::query()
            ->select([
                'incident_reports.*',
                'orders.order_number AS joined_order_number',
                'orders.service_type AS joined_service_type',
                'couriers.name AS joined_courier_name',
                'replacement_couriers.name AS joined_replacement_courier_name',
            ])
            ->join('orders', 'orders.id', '=', 'incident_reports.order_id')
            ->leftJoin('couriers', 'couriers.id', '=', 'incident_reports.courier_id')
            ->leftJoin('couriers as replacement_couriers', 'replacement_couriers.id', '=', 'incident_reports.replacement_courier_id')
            ->whereDate('incident_reports.reported_at', $day)
            ->orderBy('incident_reports.reported_at', 'asc');

        if ($hubId) {
            $query->where('orders.hub_origin_id', $hubId);
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
                    'order_number' => $incident->joined_order_number ?? '-',
                    'service_type' => $incident->joined_service_type ?? '-',
                    'courier_name' => $incident->joined_courier_name ?? '-',
                    'replacement_courier' => $incident->joined_replacement_courier_name ?? '-',
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
     * @return array<string, int|array<string, int>>
     */
    public function summary(?string $date = null, ?string $hubId = null): array
    {
        return $this->summarize($this->rows($date, $hubId));
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<string, int|array<string, int>>
     */
    public function summarize(array $rows): array
    {
        $byCategory = [];
        $resolved = 0;
        $escalated = 0;
        $pending = 0;

        foreach ($rows as $row) {
            $byCategory[$row['category']] = ($byCategory[$row['category']] ?? 0) + 1;

            $status = $row['status'];

            if ($status === 'RESOLVED') {
                $resolved++;
            } elseif ($status === 'ESCALATED') {
                $escalated++;
            } elseif (in_array($status, ['REPORTED', 'ACKNOWLEDGED', 'REASSIGNING'], true)) {
                $pending++;
            }
        }

        return [
            'total' => count($rows),
            'resolved' => $resolved,
            'escalated' => $escalated,
            'pending' => $pending,
            'by_category' => $byCategory,
        ];
    }

    /**
     * @return array<string, string>
     */
    public function columns(): array
    {
        return [
            'incident_code' => 'Kode Insiden',
            'reported_at' => 'Waktu Lapor',
            'order_number' => 'Resi',
            'service_type' => 'Layanan',
            'courier_name' => 'Kurir',
            'replacement_courier' => 'Kurir Pengganti',
            'category' => 'Kategori',
            'title' => 'Judul',
            'location' => 'Lokasi',
            'weather' => 'Cuaca',
            'temperature_c' => 'Suhu (C)',
            'status' => 'Status',
            'resolved_at' => 'Waktu Selesai',
            'duration_minutes' => 'Lama Penanganan (menit)',
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<int, mixed>
     */
    public function flatten(array $row): array
    {
        $flat = [];
        foreach (array_keys($this->columns()) as $key) {
            $flat[] = $row[$key] ?? '-';
        }

        return $flat;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     */
    public function toCsv(array $rows): string
    {
        $handle = fopen('php://temp', 'r+');

        fputcsv($handle, array_values($this->columns()));

        foreach ($rows as $row) {
            fputcsv($handle, $this->flatten($row));
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @param  array<string, mixed>  $meta
     */
    public function toHtml(array $rows, array $meta): string
    {
        return view('exports.incident-report', [
            'title' => 'Laporan Insiden Harian ' . ($meta['date'] ?? ''),
            'date' => $meta['date'] ?? now()->toDateString(),
            'hubName' => $meta['hub_name'] ?? '-',
            'generatedAt' => $meta['generated_at'] ?? now()->format('d-m-Y H:i'),
            'summary' => $this->summarize($rows),
            'columns' => array_values($this->columns()),
            'rows' => array_map(fn (array $row) => $this->flatten($row), $rows),
            'maxRows' => self::MAX_ROWS,
            'truncated' => count($rows) >= self::MAX_ROWS,
        ])->render();
    }
}