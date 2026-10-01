<?php

namespace App\Console\Commands;

use App\Events\IncidentEscalated;
use App\Models\IncidentReport;
use App\Services\Incident\IncidentService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Eskalasi insiden otomatis (FRD-03 / BR-04).
 *
 * Insiden berstatus REPORTED yang tidak ditindaklanjuti Admin Hub selama
 * lebih dari 10 menit wajib berubah menjadi ESCALATED dan memicu alarm
 * pada dasbor. Command ini dijadwalkan tiap menit oleh Console\Kernel.
 */
class EscalateIncidents extends Command
{
    /** Batas waktu tanggapan (menit) sebelum insiden di-eskalasi. */
    private const THRESHOLD_MINUTES = 10;

    protected $signature = 'incident:escalate {--minutes=10 : Ambang waktu tanggapan (menit) sebelum insiden di-eskalasi}';

    protected $description = 'Eskalasi insiden REPORTED yang tidak ditanggapi > 10 menit menjadi ESCALATED (FRD-03 BR-04)';

    public function handle(): int
    {
        $threshold = max(1, (int) $this->option('minutes'));
        $cutoff = now()->subMinutes($threshold);

        $incidents = IncidentReport::query()
            ->with('order')
            ->where('status', 'REPORTED')
            ->whereNotNull('reported_at')
            ->where('reported_at', '<=', $cutoff)
            ->get();

        if ($incidents->isEmpty()) {
            $this->info('Tidak ada insiden yang perlu dieskalasi.');

            return self::SUCCESS;
        }

        $affectedHubs = [];

        foreach ($incidents as $incident) {
            $incident->status = 'ESCALATED';
            $incident->save();

            $hubId = $incident->order?->hub_origin_id;
            if ($hubId) {
                $affectedHubs[] = $hubId;

                // Alarm realtime ke dasbor Admin Hub (FRD-03 / BR-04)
                event(new IncidentEscalated($hubId, [
                    'id' => $incident->id,
                    'incident_code' => $incident->incident_code,
                    'severity' => 'CRITICAL',
                    'status' => 'ESCALATED',
                    'status_label' => 'Eskalasi',
                    'incident_category' => $incident->incident_category,
                    'title' => $incident->title,
                    'waybill_number' => $incident->order?->order_number,
                    'service_type' => $incident->order?->service_type,
                    'location_address' => $incident->location_address,
                    'reported_at' => $incident->reported_at?->toISOString(),
                ], $threshold));
            }

            $this->warn(sprintf(
                'ESCALATED %s (%s) — dilaporkan %s, tidak ditanggapi > %d menit.',
                $incident->incident_code,
                $incident->incident_category,
                $incident->reported_at?->format('d-m-Y H:i:s'),
                $threshold,
            ));
        }

        // Bersihkan cache panel per hub agar status terbaru langsung tampil
        foreach (array_unique($affectedHubs) as $hubId) {
            IncidentService::clearPanelCache($hubId);
        }

        Log::warning('Eskalasi insiden otomatis', [
            'jumlah' => $incidents->count(),
            'threshold_minutes' => $threshold,
            'incident_codes' => $incidents->pluck('incident_code')->all(),
        ]);

        return self::SUCCESS;
    }
}
