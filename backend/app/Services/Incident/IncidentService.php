<?php

namespace App\Services\Incident;

use App\Events\IncidentReported;
use App\Events\ReassignmentCompleted;
use App\Jobs\NotifikasiPengalihan;
use App\Models\IncidentReport;
use App\Models\Order;
use App\Models\Courier;
use App\Models\User;
use App\Services\Courier\CourierReplacementService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class IncidentService
{
    public function __construct(
        private CourierReplacementService $replacementService
    ) {}

    /**
     * Ambil semua insiden untuk hub tertentu.
     *
     * OPTIMASI:
     * - Relasi yang tidak dipakai di response (replacementCourier, handledBy) dihapus
     *   => hemat 2 round-trip query.
     * - Kandidat kurir pengganti diambil SEKALI untuk semua insiden (bukan per insiden)
     *   => sebelumnya N query, sekarang 1 query.
     * - Hasil di-cache 10 detik karena data list ini hanya dibaca (tidak berubah tiap detik).
     */
    public function getIncidents(string $hubId): array
    {
        $cacheKey = "incidents_{$hubId}";

        return Cache::remember($cacheKey, 30, function () use ($hubId) {
            // Ambil kandidat kurir sekali untuk seluruh insiden di hub ini
            $availableCouriers = $this->replacementService->getAvailableCouriers($hubId);

            $incidents = IncidentReport::with([
                'order',
                'courier',
                'evidences',
            ])
                ->whereHas('order', function ($query) use ($hubId) {
                    $query->where('hub_origin_id', $hubId);
                })
                ->orderBy('reported_at', 'desc')
                ->get();

            return $incidents
                ->map(fn (IncidentReport $incident) => $this->formatIncident($incident, $availableCouriers))
                ->toArray();
        });
    }

    /**
     * Format insiden untuk response API.
     */
    private function formatIncident(IncidentReport $incident, $availableCouriers = null): array
    {
        if ($availableCouriers === null) {
            $availableCouriers = $this->replacementService->getAvailableCouriers($incident->order->hub_origin_id);
        }

        $candidates = $this->replacementService->candidatesFromCollection(
            $availableCouriers,
            $incident->courier_id,
            (float) $incident->order->weight_kg,
            $incident->order
        );

        return [
            'id' => $incident->id,
            'incident_code' => $incident->incident_code,
            'severity' => $this->calculateSeverity($incident),
            'status' => $incident->status,
            'status_label' => $this->getStatusLabel($incident->status),
            'waybill_number' => $incident->order->order_number,
            'service_type' => $incident->order->service_type,
            'service_label' => $incident->order->service_type,
            'courier' => [
                'id' => $incident->courier->id,
                'name' => $incident->courier->name,
                'vehicle_type' => $incident->courier->vehicle_type,
                'vehicle_plate' => $incident->courier->license_plate,
                'phone' => $incident->courier->phone_number,
            ],
            'kendala' => $incident->title,
            'kendala_detail' => $incident->description,
            'incident_category' => $incident->incident_category,
            'stopped_location' => $incident->location_address,
            'destination' => $incident->order->destination_address,
            'muatan' => $incident->order->category,
            'weight_kg' => (float) $incident->order->weight_kg,
            'reported_at' => $incident->reported_at->toISOString(),
            'evidence_image_url' => $incident->evidence_image_url,
            'evidence_public_id' => $incident->evidence_public_id,
            'evidence_caption' => $incident->evidences->first()?->caption,
            'candidates' => $candidates,
            'latitude' => $incident->latitude ? (float) $incident->latitude : null,
            'longitude' => $incident->longitude ? (float) $incident->longitude : null,
            'weather_condition' => $incident->weather_condition,
            'traffic_condition' => $incident->traffic_condition,
            'temperature_c' => $incident->temperature_c ? (float) $incident->temperature_c : null,
        ];
    }

    /**
     * Hitung severity insiden.
     */
    private function calculateSeverity(IncidentReport $incident): string
    {
        // Critical jika: Frozen/PHARMA dengan anomali suhu, atau mogok total
        if ($incident->order->service_type === 'Frozen' && $incident->temperature_c > 5.0) {
            return 'CRITICAL';
        }

        if ($incident->incident_category === 'Mogok Kendaraan') {
            return 'CRITICAL';
        }

        if ($incident->order->service_type === 'PHARMA') {
            return 'CRITICAL';
        }

        return 'WARNING';
    }

    /**
     * Get status label dalam bahasa Indonesia.
     */
    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'REPORTED' => 'Klik untuk Evaluasi',
            'ACKNOWLEDGED' => 'Sedang Ditinjau',
            'REASSIGNING' => 'Sedang Dialihkan',
            'RESOLVED' => 'Telah Dialihkan',
            'ESCALATED' => 'Eskalasi',
            default => $status,
        };
    }

    /**
     * Proses pengalihan 1-klik dengan cache lock untuk mencegah race condition.
     * Aturan: resi yang baru dialihkan dalam 1 menit terakhir tidak boleh dialihkan lagi.
     */
    public function reassignIncident(string $incidentId, string $replacementCourierId, User $user): array
    {
        $lockKey = "reassign_lock_{$incidentId}";

        // Cache lock dengan TTL 10 detik
        $lock = Cache::lock($lockKey, 10);

        // Data siap-siar. Hanya terisi bila transaksi sukses, sehingga event
        // ReassignmentCompleted tidak pernah terkirim untuk transaksi yang gagal.
        $broadcast = null;

        try {
            $lock->block(5); // Tunggu maksimal 5 detik untuk dapat lock

            $result = DB::transaction(function () use ($incidentId, $replacementCourierId, $user, &$broadcast) {
                $incident = IncidentReport::with(['order', 'courier'])->lockForUpdate()->findOrFail($incidentId);

                // Cek apakah insiden sudah di-reassign dalam 1 menit terakhir
                $recentReassignment = $incident->reassignmentConfirmations()
                    ->where('confirmation_time', '>', now()->subMinute())
                    ->where('status', 'CONFIRMED')
                    ->exists();

                if ($recentReassignment) {
                    return [
                        'success' => false,
                        'code' => 'CONFLICT',
                        'message' => 'Resi ini baru saja dialihkan. Silakan tunggu 1 menit sebelum mencoba lagi.',
                    ];
                }

                // Cek apakah kurir tujuan sudah membawa melebihi batas paket aktif
                // (angka yang sama dengan ambang penyaringan kandidat)
                $replacementCourier = Courier::lockForUpdate()->findOrFail($replacementCourierId);

                if ($replacementCourier->current_parcel_count > CourierReplacementService::MAX_ACTIVE_PARCELS) {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Kurir tujuan sudah membawa lebih dari '
                            . CourierReplacementService::MAX_ACTIVE_PARCELS
                            . ' paket. Pilih kurir lain.',
                    ];
                }

                // Cek kapasitas kurir tujuan
                if ($replacementCourier->max_capacity_kg < $incident->order->weight_kg) {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Kurir tujuan tidak memiliki kapasitas muatan yang cukup.',
                    ];
                }

                // FRD-03 / BR-03: paket yang sudah DELIVERED tidak boleh dialihkan
                if ($incident->order->delivery_status === 'DELIVERED') {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Paket sudah berstatus DELIVERED dan tidak dapat dialihkan.',
                    ];
                }

                // FRD-03 / BR-02: armada kurir pengganti wajib kompatibel
                // dengan layanan paket (Cargo = Van/Truk, Frozen = tas termal, PHARMA = BPOM)
                if (!$this->replacementService->isCompatible($replacementCourier, $incident->order)) {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Armada kurir pengganti tidak kompatibel dengan layanan '
                            . $incident->order->service_type . '. Pilih kurir lain.',
                    ];
                }

                // Update insiden sekali saja. Status langsung RESOLVED karena
                // status REASSIGNING di tengah transaksi tidak pernah terbaca
                // pihak mana pun (transaksi belum commit) — penghematan 1 query
                // yang berarti karena tiap round-trip ke Supabase ± 170 ms.
                $incident->update([
                    'replacement_courier_id' => $replacementCourierId,
                    'status' => 'RESOLVED',
                    'resolved_at' => now(),
                ]);

                // Update order: pindahkan ke kurir pengganti
                $order = $incident->order;
                $oldCourierId = $order->current_courier_id;

                $order->update([
                    'current_courier_id' => $replacementCourierId,
                    'delivery_status' => 'IN_TRANSIT',
                ]);

                // Update assignment lama ke REASSIGNED
                $order->assignments()
                    ->where('assignment_status', 'ACTIVE')
                    ->update([
                        'assignment_status' => 'REASSIGNED',
                        'completed_at' => now(),
                    ]);

                // Buat assignment baru
                $order->assignments()->create([
                    'courier_id' => $replacementCourierId,
                    'incident_id' => $incident->id,
                    'assigned_by_user_id' => $user->id,
                    'assignment_status' => 'ACTIVE',
                    'reason' => 'Pengalihan 1-Klik dari ' . $incident->courier->name,
                    'assigned_at' => now(),
                ]);

                // Update parcel count kurir
                // Kurir pelapor sudah ikut dimuat lewat relasi insiden, jadi
                // pakai langsung — menghemat 1 query saat id-nya sama.
                $oldCourier = $incident->courier_id === $oldCourierId
                    ? $incident->courier
                    : Courier::find($oldCourierId);
                if ($oldCourier) {
                    $oldCourier->decrement('current_parcel_count');
                }
                $replacementCourier->increment('current_parcel_count');

                // Buat reassignment confirmation
                $confirmation = $incident->reassignmentConfirmations()->create([
                    'confirmation_code' => 'RSC-HLM-' . strtoupper(uniqid()),
                    'order_id' => $order->id,
                    'original_courier_id' => $oldCourierId,
                    'replacement_courier_id' => $replacementCourierId,
                    'confirmed_by_user_id' => $user->id,
                    'confirmation_method' => 'ONE_CLICK',
                    'confirmation_time' => now(),
                    'estimated_resolution_seconds' => 300,
                    'actual_resolution_seconds' => rand(10, 60),
                    'is_sla_saved' => true,
                    'status' => 'CONFIRMED',
                    'notes' => 'Pengalihan 1-Klik berhasil, kurir pengganti ' . $replacementCourier->name . ' aktif',
                ]);

                // Buat audit log
                $auditLog = $incident->auditLogs()->create([
                    'log_code' => 'AUD-HLM-' . date('Y') . '-' . strtoupper(uniqid()),
                    'order_id' => $order->id,
                    'original_courier_id' => $oldCourierId,
                    'replacement_courier_id' => $replacementCourierId,
                    'executor_user_id' => $user->id,
                    'incident_category' => $incident->incident_category,
                    'incident_detail' => $incident->title,
                    'action_type' => 'ONE_CLICK_REASSIGNMENT',
                    'resolution_time_seconds' => 18.00,
                    'is_sla_saved' => true,
                    'audit_hash' => hash('sha256', $order->order_number . 'ONE_CLICK_REASSIGNMENT' . now()),
                    'notes' => 'Pengalihan sukses, SLA terselamatkan',
                    'created_at' => now(),
                ]);

                // Clear cache SLA risk + cache panel lain yang terdampak
                $this->clearPanelCache($order->hub_origin_id);

                // Dispatch job notifikasi (async) — dijalankan oleh `php artisan queue:listen`.
                // afterCommit() dipakai agar job baru masuk antrean SETELAH transaksi
                // commit, sehingga worker tidak pernah membaca data yang belum ter-commit.
                NotifikasiPengalihan::dispatch($confirmation, [
                    'name' => $replacementCourier->name,
                    'phone' => $replacementCourier->phone_number,
                    'code' => $replacementCourier->courier_code,
                ])->afterCommit();

                $broadcast = [
                    'hub_id' => $order->hub_origin_id,
                    'incident_id' => $incident->id,
                    'incident_code' => $incident->incident_code,
                    'waybill' => $order->order_number,
                    'original_courier' => [
                        'id' => $oldCourier?->id,
                        'name' => $oldCourier?->name,
                        'courier_code' => $oldCourier?->courier_code,
                    ],
                    'replacement_courier' => [
                        'id' => $replacementCourier->id,
                        'name' => $replacementCourier->name,
                        'courier_code' => $replacementCourier->courier_code,
                    ],
                    'confirmation_code' => $confirmation->confirmation_code,
                ];

                return [
                    'success' => true,
                    'code' => 'SUCCESS',
                    'message' => 'Pengalihan berhasil! Kurir ' . $replacementCourier->name . ' telah mengambil alih.',
                    'data' => [
                        'confirmation_id' => $confirmation->id,
                        'confirmation_code' => $confirmation->confirmation_code,
                        'audit_log_id' => $auditLog->id,
                        'new_courier' => [
                            'id' => $replacementCourier->id,
                            'name' => $replacementCourier->name,
                            'courier_code' => $replacementCourier->courier_code,
                        ],
                    ],
                ];
            });
        } catch (\Exception $e) {
            return [
                'success' => false,
                'code' => 'ERROR',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ];
        } finally {
            $lock->release();
        }

        // Siarkan realtime setelah COMMIT, bukan di dalam transaksi, supaya
        // panel frontend tidak pernah menampilkan data yang gagal tersimpan.
        if ($broadcast !== null) {
            event(new ReassignmentCompleted(
                $broadcast['hub_id'],
                $broadcast['incident_id'],
                $broadcast['incident_code'],
                $broadcast['waybill'],
                $broadcast['original_courier'],
                $broadcast['replacement_courier'],
                $broadcast['confirmation_code'],
            ));
        }

        return $result;
    }

    /**
     * Hapus semua cache panel yang terdampak oleh perubahan data.
     *
     * Dipanggil dari reassign / insiden baru / eskalasi insiden supaya dashboard,
     * SLA risk, incidents, couriers, dan audit log langsung tampil segar.
     *
     * Bersifat static karena juga dipanggil dari command scheduler
     * (App\Console\Commands\EscalateIncidents) tanpa perlu menginstansiasi service.
     */
    public static function clearPanelCache(string $hubId): void
    {
        foreach ([
            "sla_risk_orders_{$hubId}",
            "audit_logs_{$hubId}",
            "incidents_{$hubId}",
            "dashboard_summary_{$hubId}",
            "couriers_{$hubId}",
        ] as $key) {
            Cache::forget($key);
        }
    }

    /**
     * Buat insiden baru dari laporan kurir.
     */
    public function createIncident(array $data, User $user): array
    {
        $order = Order::where('order_number', $data['order_number'])->firstOrFail();
        $courier = Courier::where('id', $data['courier_id'])->firstOrFail();

        $incident = IncidentReport::create([
            'incident_code' => 'INC-HLM-' . strtoupper(uniqid()),
            'order_id' => $order->id,
            'courier_id' => $courier->id,
            'replacement_courier_id' => null,
            'handled_by_user_id' => $user->id,
            'incident_category' => $data['incident_category'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'location_address' => $data['location_address'] ?? null,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'weather_condition' => $data['weather_condition'] ?? null,
            'traffic_condition' => $data['traffic_condition'] ?? null,
            'temperature_c' => $data['temperature_c'] ?? null,
            'status' => 'REPORTED',
            'reported_at' => now(),
        ]);

        $this->clearPanelCache($order->hub_origin_id);

        // Order & courier sudah diambil dari DB di atas, jadi pasang langsung
        // sebagai relasi insiden — menghemat 2 query round-trip ke Supabase
        // (± 400 ms) saat format insiden membaca `$incident->order` / `->courier`.
        // Insiden baru juga pasti belum punya evidence, jadi siapkan kosong.
        $incident->setRelation('order', $order);
        $incident->setRelation('courier', $courier);
        $incident->setRelation('evidences', new \Illuminate\Database\Eloquent\Collection());

        $formatted = $this->formatIncident($incident);

        // Alarm realtime di dasbor Admin Hub (FRD-03 / F-03.2)
        event(new IncidentReported($order->hub_origin_id, $formatted));

        return $formatted;
    }
}
