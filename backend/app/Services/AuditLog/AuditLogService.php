<?php

namespace App\Services\AuditLog;

use App\Exports\AuditLogExport;
use App\Models\AuditLog;
use App\Models\IncidentEvidence;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Support\Iso8601;
use App\Support\OperationalClock;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AuditLogService
{
    /**
     * Target pengalihan 1-klik dalam detik, dipakai label tombol konfirmasi
     * di halaman Incident & Reassign: "Konfirmasi Pengalihan 1-Klik".
     */
    public const ONE_CLICK_TARGET_SECONDS = 30;

    /**
     * Foto bukti cadangan per kategori kendala.
     */
    private const STOCK_PHOTOS = [
        'Mogok Kendaraan' => [
            'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
            'foto_bukti/motor-mogok',
            'Kendaraan mogok di jalur pengantaran',
        ],
        'Ban Bocor' => [
            'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
            'foto_bukti/ban-bocor',
            'Kendaraan berhenti di jalur karena ban bocor',
        ],
        'Banjir' => [
            'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
            'foto_bukti/banjir-jalur',
            'Jalur pengantaran tergenang air',
        ],
        'Cuaca / Hujan' => [
            'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741302/hujan_s6xvrc.jpg',
            'foto_bukti/hujan-jalur',
            'Hujan deras di jalur pengantaran',
        ],
        'Macet Total' => [
            'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
            'foto_bukti/macet-jalur',
            'Kendaraan terhenti di jalur macet total',
        ],
        'Alamat tidak ditemukan' => [
            'https://res.cloudinary.com/drrmbeiyk/image/upload/v1790741303/motor_mogok_yustvo.jpg',
            'foto_bukti/alamat-tidak-ditemukan',
            'Kurir menunggu di titik alamat tujuan',
        ],
    ];

    /**
     * Ambil semua audit log untuk hub tertentu.
     */
    public function getAuditLogs(string $hubId): array
    {
        $cacheKey = "audit_logs_{$hubId}";

        return Cache::remember($cacheKey, 30, function () use ($hubId) {
            $logs = $this->loadLogs($hubId);
            $incidents = $this->loadIncidents($logs);
            $incidentsByOrder = $incidents->groupBy('order_id');
            $todayKey = OperationalClock::now()->rawFormat('Y-m-d');

            return $logs
                ->map(fn (AuditLog $log) => $this->formatAuditLog($log, $incidents, $incidentsByOrder, $todayKey))
                ->toArray();
        });
    }

    /**
     * @return \Illuminate\Support\Collection<int, AuditLog>
     */
    private function loadLogs(string $hubId)
    {
        $rows = DB::table('audit_logs')
            ->select([
                'audit_logs.*',
                'orders.order_number AS joined_order_number',
                'orders.service_type AS joined_service_type',
                'orders.delivery_status AS joined_delivery_status',
                'users.name AS joined_executor_name',
                'original_couriers.name AS joined_original_courier_name',
                'original_couriers.courier_code AS joined_original_courier_code',
                'replacement_couriers.name AS joined_replacement_courier_name',
                'replacement_couriers.courier_code AS joined_replacement_courier_code',
            ])
            ->join('orders', 'orders.id', '=', 'audit_logs.order_id')
            ->leftJoin('users', 'users.id', '=', 'audit_logs.executor_user_id')
            ->leftJoin('couriers AS original_couriers', 'original_couriers.id', '=', 'audit_logs.original_courier_id')
            ->leftJoin('couriers AS replacement_couriers', 'replacement_couriers.id', '=', 'audit_logs.replacement_courier_id')
            ->where('orders.hub_origin_id', $hubId)
            ->orderByDesc('audit_logs.created_at')
            ->get();

        return $rows->map(fn (object $row) => (new AuditLog)->newFromBuilder((array) $row));
    }

    /**
     * @param  \Illuminate\Support\Collection<int, AuditLog>  $logs
     * @return \Illuminate\Support\Collection<string, IncidentReport>
     */
    private function loadIncidents($logs)
    {
        $incidentIds = $logs->pluck('incident_id')->filter()->unique()->values();
        $orderIds = $logs->pluck('order_id')->filter()->unique()->values();

        if ($incidentIds->isEmpty() && $orderIds->isEmpty()) {
            return collect();
        }

        $rows = IncidentReport::query()
            ->leftJoin('incident_evidences', 'incident_evidences.incident_id', '=', 'incident_reports.id')
            ->select([
                'incident_reports.*',
                'incident_evidences.secure_url AS joined_evidence_secure_url',
                'incident_evidences.cloudinary_public_id AS joined_evidence_public_id',
                'incident_evidences.caption AS joined_evidence_caption',
            ])
            ->where(function ($query) use ($incidentIds, $orderIds) {
                $query->whereIn('incident_reports.order_id', $orderIds);

                if ($incidentIds->isNotEmpty()) {
                    $query->orWhereIn('incident_reports.id', $incidentIds);
                }
            })
            ->orderBy('incident_reports.id')
            ->orderBy('incident_evidences.id')
            ->get();

        if ($rows->isEmpty()) {
            return collect();
        }

        return $rows->groupBy('id')->map(function ($duplicated) {
            $incident = $duplicated->first();
            $evidences = collect();

            foreach ($duplicated as $row) {
                $attributes = $row->getAttributes();

                if ($attributes['joined_evidence_secure_url'] !== null) {
                    $evidences->push(
                        (new IncidentEvidence())
                            ->setAttribute('secure_url', $attributes['joined_evidence_secure_url'])
                            ->setAttribute('cloudinary_public_id', $attributes['joined_evidence_public_id'])
                            ->setAttribute('caption', $attributes['joined_evidence_caption'])
                    );
                }

            }

            return $incident->setRelation('evidences', $evidences);
        });
    }

    /**
     * Format audit log untuk response API.
     *
     * @param  \Illuminate\Support\Collection<string, IncidentReport>  $incidents
     * @param  \Illuminate\Support\Collection<string, \Illuminate\Support\Collection<int, IncidentReport>>  $incidentsByOrder
     * @param  string  $todayKey  Tanggal operasional (`Y-m-d`) untuk status laporan, dihitung sekali per muat.
     */
    private function formatAuditLog(AuditLog $log, $incidents, $incidentsByOrder, string $todayKey): array
    {
        [$photoUrl, $photoPublicId, $photoCaption] = $this->resolveEvidence($log, $incidents, $incidentsByOrder);

        return [
            'id' => $log->id,
            'log_code' => $log->log_code,
            'resi' => $log->joined_order_number,
            'service_type' => $log->joined_service_type,
            'completed_at' => Iso8601::of($log->created_at),
            'from_courier' => $log->joined_original_courier_name,
            'from_courier_code' => $log->joined_original_courier_code,
            'to_courier' => $log->joined_replacement_courier_name,
            'to_courier_code' => $log->joined_replacement_courier_code,
            'incident_category' => $log->incident_category,
            'incident_detail' => $log->incident_detail,
            'report_status' => $this->reportStatus($log, $incidents, $todayKey),
            'handling_seconds' => (float) $log->resolution_time_seconds,
            'sla_compliant' => $log->is_sla_saved,
            'executor_name' => $log->joined_executor_name,
            'evidence_image_url' => $photoUrl,
            'evidence_public_id' => $photoPublicId,
            'evidence_caption' => $photoCaption,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<string, IncidentReport>  $incidents
     * @param  string  $todayKey  Tanggal operasional berformat `Y-m-d`.
     */
    private function reportStatus(AuditLog $log, $incidents, string $todayKey): string
    {
        if (in_array($log->joined_delivery_status, ['DELIVERED', 'RETURNED'], true)) {
            return 'Selesai';
        }

        $incident = $log->incident_id ? $incidents->get($log->incident_id) : null;

        if ($incident !== null && $incident->status === 'ESCALATED') {
            return 'Eskalasi';
        }

        return $log->created_at->rawFormat('Y-m-d') === $todayKey ? 'Dialihkan' : 'Selesai';
    }

    /**
     * @param  \Illuminate\Support\Collection<string, IncidentReport>  $incidents
     * @param  \Illuminate\Support\Collection<string, \Illuminate\Support\Collection<int, IncidentReport>>  $incidentsByOrder  insiden dikelompokkan per order_id
     * @return array{0: string|null, 1: string|null, 2: string|null}
     */
    private function resolveEvidence(AuditLog $log, $incidents, $incidentsByOrder): array
    {
        $candidates = [];

        $recorded = $log->incident_id ? $incidents->get($log->incident_id) : null;
        if ($recorded !== null) {
            $candidates[] = $recorded;
        }

        foreach ($incidentsByOrder->get($log->order_id, collect()) as $siblingIncident) {
            $candidates[] = $siblingIncident;
        }

        foreach ($candidates as $incident) {
            if ($incident === null) {
                continue;
            }

            foreach ($incident->evidences as $evidence) {
                if ($evidence->secure_url) {
                    return [$evidence->secure_url, $evidence->cloudinary_public_id, $evidence->caption];
                }
            }

            if ($incident->evidence_image_url) {
                return [$incident->evidence_image_url, $incident->evidence_public_id, null];
            }
        }

        return $this->stockEvidence($log);
    }

    /**
     * @return array{0: string|null, 1: string|null, 2: string|null}
     */
    private function stockEvidence(AuditLog $log): array
    {
        $category = (string) $log->incident_category;
        $service  = (string) $log->joined_service_type;

        if ($service === 'Frozen' || $category === 'Anomali Suhu' || $category === '') {
            return [null, null, null];
        }

        [$url, $publicId, $caption] = self::STOCK_PHOTOS[$category] ?? self::STOCK_PHOTOS['Mogok Kendaraan'];

        return [$url, $publicId, $caption];
    }

    /**
     * Hitung ringkasan audit log.
     */
    public function getAuditSummary(string $hubId): array
    {
        $logs = $this->getAuditLogs($hubId);

        $total = count($logs);
        $sumHandling = 0.0;
        $slaCompliant = 0;
        $oneClick = 0;
        foreach ($logs as $log) {
            $handling = (float) $log['handling_seconds'];
            $sumHandling += $handling;

            if ($log['sla_compliant']) {
                $slaCompliant++;
            }

            if ($handling <= self::ONE_CLICK_TARGET_SECONDS) {
                $oneClick++;
            }
        }

        $avgHandling = $total > 0 ? $sumHandling / $total : 0;

        return [
            'total_completed' => $total,
            'avg_handling_seconds' => round($avgHandling, 1),
            'sla_compliance_rate' => $total > 0 ? round(($slaCompliant / $total) * 100, 1) : 0,
            'sla_compliant_count' => $slaCompliant,
            'one_click_rate' => $total > 0 ? round(($oneClick / $total) * 100, 1) : 0,
            'one_click_count' => $oneClick,
        ];
    }

    /**
     * Ringkasan KPI khusus laporan ekspor.
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
            'Status Laporan',
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
                $log['report_status'],
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