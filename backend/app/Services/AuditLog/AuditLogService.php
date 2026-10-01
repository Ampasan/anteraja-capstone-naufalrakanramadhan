<?php

namespace App\Services\AuditLog;

use App\Exports\AuditLogExport;
use App\Models\AuditLog;
use App\Models\IncidentReport;
use App\Models\Order;
use Illuminate\Support\Facades\Cache;

class AuditLogService
{
    /**
     * Ambil semua audit log untuk hub tertentu.
     * Data di-cache 30 detik; di-reset otomatis saat ada pengalihan baru,
     * sehingga riwayat selalu segar tanpa harus query tiap request.
     */
    public function getAuditLogs(string $hubId): array
    {
        $cacheKey = "audit_logs_{$hubId}";

        return Cache::remember($cacheKey, 30, function () use ($hubId) {
            // NOTE: Jangan gunakan select() dengan with() - bisa menyebabkan masalah foreign key
            $logs = AuditLog::with([
                'order',
                'executor',
                'incident.evidences',
            ])
                ->whereHas('order', function ($query) use ($hubId) {
                    $query->where('hub_origin_id', $hubId);
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $this->loadCouriersInOneQuery($logs);

            return $logs->map(fn (AuditLog $log) => $this->formatAuditLog($log))->toArray();
        });
    }

    /**
     * Muat relasi kurir asal & tujuan dalam SATU query.
     * Eloquent secara default menjalankan 2 query terpisah untuk dua relasi
     * ke tabel yang sama; digabung agar hemat 1 round-trip (~200ms).
     */
    private function loadCouriersInOneQuery($logs): void
    {
        $courierIds = $logs->pluck('original_courier_id')
            ->merge($logs->pluck('replacement_courier_id'))
            ->filter()
            ->unique()
            ->values();

        if ($courierIds->isEmpty()) {
            foreach ($logs as $log) {
                $log->setRelation('originalCourier', null);
                $log->setRelation('replacementCourier', null);
            }
            return;
        }

        $couriers = \App\Models\Courier::whereIn('id', $courierIds)->get()->keyBy('id');

        foreach ($logs as $log) {
            $log->setRelation('originalCourier', $couriers->get($log->original_courier_id));
            $log->setRelation('replacementCourier', $couriers->get($log->replacement_courier_id));
        }
    }

    /**
     * Format audit log untuk response API.
     */
    private function formatAuditLog(AuditLog $log): array
    {
        $evidence = $log->incident?->evidences->first();

        return [
            'id' => $log->id,
            'log_code' => $log->log_code,
            'resi' => $log->order->order_number,
            'service_type' => $log->order->service_type,
            'completed_at' => $log->created_at->toISOString(),
            'from_courier' => $log->originalCourier?->name,
            'from_courier_code' => $log->originalCourier?->courier_code,
            'to_courier' => $log->replacementCourier?->name,
            'to_courier_code' => $log->replacementCourier?->courier_code,
            'incident_category' => $log->incident_category,
            'incident_detail' => $log->incident_detail,
            'handling_seconds' => (float) $log->resolution_time_seconds,
            'sla_compliant' => $log->is_sla_saved,
            'executor_name' => $log->executor?->name,
            'evidence_image_url' => $evidence?->secure_url ?? $log->incident?->evidence_image_url,
            'evidence_public_id' => $evidence?->cloudinary_public_id ?? $log->incident?->evidence_public_id,
            'evidence_caption' => $evidence?->caption,
        ];
    }

    /**
     * Hitung ringkasan audit log.
     */
    public function getAuditSummary(string $hubId): array
    {
        $logs = $this->getAuditLogs($hubId);

        $total = count($logs);
        $avgHandling = $total > 0 ? array_sum(array_column($logs, 'handling_seconds')) / $total : 0;
        $slaCompliant = count(array_filter($logs, fn ($l) => $l['sla_compliant']));

        return [
            'total_completed' => $total,
            'avg_handling_seconds' => round($avgHandling, 1),
            'sla_compliance_rate' => $total > 0 ? round(($slaCompliant / $total) * 100, 1) : 0,
            'sla_compliant_count' => $slaCompliant,
        ];
    }

    /**
     * Ringkasan KPI khusus laporan ekspor.
     *
     * Berbeda dengan getAuditSummary() yang dipakai panel (harus ringan),
     * method ini menambahkan Reassignment Rate sesuai FRD-04 / BR-03,
     * sehingga menambah satu query COUNT — hanya dipanggil saat ekspor.
     */
    public function getReportSummary(string $hubId): array
    {
        $summary = $this->getAuditSummary($hubId);

        $totalOrders = Order::where('hub_origin_id', $hubId)->count();

        $summary['total_orders'] = $totalOrders;
        $summary['reassignment_rate'] = $totalOrders > 0
            ? round(($summary['total_completed'] / $totalOrders) * 100, 1)
            : 0.0;

        return $summary;
    }

    /**
     * Ekspor audit log ke CSV (dipakai format ?format=csv).
     *
     * @param  int  $maxRows  Batas baris per unduhan (FRD-04 / BR-03).
     */
    public function exportToCsv(string $hubId, int $maxRows = AuditLogExport::MAX_ROWS): string
    {
        $logs = array_slice($this->getAuditLogs($hubId), 0, $maxRows);

        $filename = 'audit_logs_' . date('Y-m-d_His') . '.csv';
        $filepath = storage_path('app/public/exports/' . $filename);

        // Pastikan folder exists
        if (!is_dir(dirname($filepath))) {
            mkdir(dirname($filepath), 0755, true);
        }

        $handle = fopen($filepath, 'w');

        $summary = $this->getReportSummary($hubId);

        // Rekapitulasi KPI — FRD-04 / BR-03 mewajibkan setiap berkas ekspor
        // memuat rekap KPI (Total Incidents, Reassignment Rate,
        // Avg Resolution Time, SLA Saved Rate) sebelum tabel rincian.
        fputcsv($handle, ['Rekapitulasi KPI']);
        fputcsv($handle, ['Total Incidents', $summary['total_completed']]);
        fputcsv($handle, ['Reassignment Rate', $summary['reassignment_rate'] . '%']);
        fputcsv($handle, ['Avg Resolution Time', $summary['avg_handling_seconds'] . ' detik']);
        fputcsv($handle, ['SLA Saved Rate', $summary['sla_compliance_rate'] . '%']);
        fwrite($handle, "\n");

        // Header tabel rincian
        fputcsv($handle, [
            'Kode Log', 'Resi', 'Layanan', 'Waktu Selesai',
            'Kurir Asal', 'Kurir Tujuan', 'Kategori', 'Detail',
            'Waktu Penanganan (detik)', 'SLA Compliant', 'Executor',
            'Foto Bukti (URL)',
        ]);

        // Data
        foreach ($logs as $log) {
            fputcsv($handle, [
                $log['log_code'],
                $log['resi'],
                $log['service_type'],
                $log['completed_at'],
                $log['from_courier'],
                $log['to_courier'],
                $log['incident_category'],
                $log['incident_detail'],
                $log['handling_seconds'],
                $log['sla_compliant'] ? 'Ya' : 'Tidak',
                $log['executor_name'] ?? '-',
                $log['evidence_image_url'] ?? '-',
            ]);
        }

        fclose($handle);

        return $filepath;
    }
}
