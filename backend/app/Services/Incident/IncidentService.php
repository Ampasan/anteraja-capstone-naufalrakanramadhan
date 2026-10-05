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
use App\Services\Order\SlaRiskService;
use App\Services\Async\TaskTracker;
use App\Support\Iso8601;
use App\Support\OperationalClock;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class IncidentService
{
    public function __construct(
        private CourierReplacementService $replacementService
    ) {}

    public function getIncidents(string $hubId): array
    {
        $cacheKey = "incidents_{$hubId}";

        return Cache::remember($cacheKey, 30, function () use ($hubId) {
            $availableCouriers = $this->replacementService->getAvailableCouriers($hubId);
            $incidents = IncidentReport::query()
                ->select([
                    'incident_reports.*',
                    'orders.order_number AS joined_order_number',
                    'orders.service_type AS joined_service_type',
                    'orders.destination_address AS joined_destination_address',
                    'orders.category AS joined_category',
                    'orders.weight_kg AS joined_weight_kg',
                    'orders.current_courier_id AS joined_current_courier_id',
                    'orders.hub_origin_id AS joined_hub_origin_id',
                    'couriers.name AS joined_courier_name',
                    'couriers.vehicle_type AS joined_courier_vehicle_type',
                    'couriers.license_plate AS joined_courier_license_plate',
                    'couriers.phone_number AS joined_courier_phone_number',
                    'replacement_couriers.name AS joined_replacement_name',
                    'replacement_couriers.courier_code AS joined_replacement_code',
                    'replacement_couriers.vehicle_type AS joined_replacement_vehicle_type',
                    'replacement_couriers.license_plate AS joined_replacement_license_plate',
                ])
                ->join('orders', 'orders.id', '=', 'incident_reports.order_id')
                ->join('couriers', 'couriers.id', '=', 'incident_reports.courier_id')
                ->leftJoin('couriers AS replacement_couriers', 'replacement_couriers.id', '=', 'incident_reports.replacement_courier_id')
                ->where('orders.hub_origin_id', $hubId)
                ->where('couriers.status', 'IDLE')
                ->orderByDesc('incident_reports.reported_at')
                ->selectRaw('(SELECT e.caption FROM incident_evidences e WHERE e.incident_id = incident_reports.id ORDER BY e.uploaded_at ASC LIMIT 1) AS joined_evidence_caption')
                ->get();

            return $incidents
                ->map(fn (IncidentReport $incident) => $this->formatIncident($incident, $availableCouriers))
                ->toArray();
        });
    }

    private function orderField(IncidentReport $incident, string $field): mixed
    {
        $attributes = $incident->getAttributes();
        $key = 'joined_' . $field;

        return array_key_exists($key, $attributes) ? $attributes[$key] : $incident->order->{$field};
    }

    private function courierField(IncidentReport $incident, string $field): mixed
    {
        $attributes = $incident->getAttributes();
        $key = 'joined_courier_' . $field;

        return array_key_exists($key, $attributes) ? $attributes[$key] : $incident->courier->{$field};
    }

    private function evidenceCaption(IncidentReport $incident): ?string
    {
        $attributes = $incident->getAttributes();

        if (array_key_exists('joined_evidence_caption', $attributes)) {
            return $attributes['joined_evidence_caption'];
        }

        return $incident->evidences->first()?->caption;
    }

    private function orderFor(IncidentReport $incident): Order
    {
        $attributes = $incident->getAttributes();

        if (! array_key_exists('joined_service_type', $attributes)) {
            return $incident->order;
        }

        $order = new Order();
        $order->forceFill([
            'id' => $incident->order_id,
            'order_number' => $attributes['joined_order_number'],
            'service_type' => $attributes['joined_service_type'],
        ]);

        return $order;
    }

    private function replacementCourierData(IncidentReport $incident): ?array
    {
        if ($incident->replacement_courier_id === null) {
            return null;
        }

        $attributes = $incident->getAttributes();
        $replacement = null;
        $name = $attributes['joined_replacement_name'] ?? null;

        if ($name === null) {
            $replacement = $incident->replacementCourier;
            $name = $replacement?->name;
        }

        if ($name === null) {
            return null;
        }

        return [
            'id' => $incident->replacement_courier_id,
            'name' => $name,
            'courier_code' => $attributes['joined_replacement_code'] ?? $replacement?->courier_code,
            'vehicle_type' => $attributes['joined_replacement_vehicle_type'] ?? $replacement?->vehicle_type,
            'vehicle_plate' => $attributes['joined_replacement_license_plate'] ?? $replacement?->license_plate,
        ];
    }

    private function formatIncident(IncidentReport $incident, $availableCouriers = null): array
    {
        if ($availableCouriers === null) {
            $availableCouriers = $this->replacementService->getAvailableCouriers($this->orderField($incident, 'hub_origin_id'));
        }

        $badWeather = str_contains((string) $incident->weather_condition, 'Hujan')
            || in_array($incident->incident_category, ['Cuaca / Hujan', 'Banjir'], true);

        $candidates = $this->replacementService->candidatesFromCollection(
            $availableCouriers,
            array_values(array_unique(array_filter([
                $incident->courier_id,
                $incident->replacement_courier_id,
                $this->orderField($incident, 'current_courier_id'),
            ]))),
            (float) $this->orderField($incident, 'weight_kg'),
            $this->orderFor($incident),
            $incident->latitude !== null && $incident->longitude !== null
                ? ['lat' => (float) $incident->latitude, 'lng' => (float) $incident->longitude]
                : null,
            $badWeather,
            CourierReplacementService::MAX_CANDIDATES,
            $this->courierField($incident, 'vehicle_type')
        );

        $serviceType = $this->orderField($incident, 'service_type');

        return [
            'id' => $incident->id,
            'incident_code' => $incident->incident_code,
            'severity' => $this->calculateSeverity($incident),
            'status' => $incident->status,
            'status_label' => $this->getStatusLabel($incident->status),
            'waybill_number' => $this->orderField($incident, 'order_number'),
            'service_type' => $serviceType,
            'service_label' => $serviceType,
            'courier' => [
                'id' => $incident->courier_id,
                'name' => $this->courierField($incident, 'name'),
                'vehicle_type' => $this->courierField($incident, 'vehicle_type'),
                'vehicle_plate' => $this->courierField($incident, 'license_plate'),
                'phone' => $this->courierField($incident, 'phone_number'),
            ],
            'kendala' => $incident->title,
            'kendala_detail' => $incident->description,
            'incident_category' => $incident->incident_category,
            'replacement_courier' => $this->replacementCourierData($incident),
            'stopped_location' => $incident->location_address,
            'destination' => $this->orderField($incident, 'destination_address'),
            'muatan' => $this->orderField($incident, 'category'),
            'weight_kg' => (float) $this->orderField($incident, 'weight_kg'),
            'reported_at' => Iso8601::of($incident->reported_at),
            'resolved_at' => $incident->resolved_at !== null ? Iso8601::of($incident->resolved_at) : null,
            'evidence_image_url' => $incident->evidence_image_url,
            'evidence_public_id' => $incident->evidence_public_id,
            'evidence_caption' => $this->evidenceCaption($incident),
            'candidates' => $candidates,
            'latitude' => $incident->latitude ? (float) $incident->latitude : null,
            'longitude' => $incident->longitude ? (float) $incident->longitude : null,
            'weather_condition' => $incident->weather_condition,
            'traffic_condition' => $incident->traffic_condition,
            'temperature_c' => $incident->temperature_c ? (float) $incident->temperature_c : null,
        ];
    }

    private function calculateSeverity(IncidentReport $incident): string
    {
        $serviceType = $this->orderField($incident, 'service_type');

        if ($serviceType === 'Frozen' && $incident->temperature_c > 5.0) {
            return 'CRITICAL';
        }

        if ($incident->incident_category === 'Mogok Kendaraan') {
            return 'CRITICAL';
        }

        if ($serviceType === 'PHARMA') {
            return 'CRITICAL';
        }

        return 'WARNING';
    }

    private function getStatusLabel(string $status): string
    {
        return match ($status) {
            'REPORTED' => 'Klik untuk Evaluasi',
            'ACKNOWLEDGED' => 'Sedang Ditinjau',
            'REASSIGNING' => 'Sedang Dialihkan',
            'RESOLVED' => 'Telah Dialihkan',
            'ESCALATED' => 'Klik untuk Evaluasi',
            default => $status,
        };
    }

    public function reassignIncident(string $incidentId, string $replacementCourierId, User $user): array
    {
        $lockKey = "reassign_lock_{$incidentId}";

        $lock = Cache::lock($lockKey, 10);

        $broadcast = null;

        /**
         * Id hub yang cache-nya harus dibuang SETELAH transaksi commit.
         * Invalidasi di dalam transaksi membuka celah: pembaca lain (poll
         * /incidents memanggil getAuditSummary) bisa mengisi ulang cache
         * dengan data lama sebelum commit, sehingga pengalihan baru tak
         * pernah muncul di halaman Audit Log sampai TTL kedaluwarsa.
         */
        $cacheHubId = null;

        try {
            $lock->block(5);

            $result = DB::transaction(function () use ($incidentId, $replacementCourierId, $user, &$broadcast, &$cacheHubId) {
                $incident = IncidentReport::with(['order', 'courier'])->lockForUpdate()->findOrFail($incidentId);

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

                $currentCarrierId = $incident->order->current_courier_id
                    ?? $incident->replacement_courier_id
                    ?? $incident->courier_id;

                if ($replacementCourierId === $currentCarrierId) {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Paket tersebut sedang dibawa oleh kurir tujuan. Pilih kurir lain.',
                    ];
                }

                if ($replacementCourier->max_capacity_kg < $incident->order->weight_kg) {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Kurir tujuan tidak memiliki kapasitas muatan yang cukup.',
                    ];
                }

                if ($incident->order->delivery_status === 'DELIVERED') {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Paket sudah berstatus DELIVERED dan tidak dapat dialihkan.',
                    ];
                }

                if (!$this->replacementService->isCompatible($replacementCourier, $incident->order)) {
                    return [
                        'success' => false,
                        'code' => 'UNPROCESSABLE',
                        'message' => 'Armada kurir pengganti tidak kompatibel dengan layanan '
                            . $incident->order->service_type . '. Pilih kurir lain.',
                    ];
                }

                $incident->update([
                    'replacement_courier_id' => $replacementCourierId,
                    'status' => 'RESOLVED',
                    'resolved_at' => OperationalClock::now(),
                ]);

                $order = $incident->order;
                $oldCourierId = $order->current_courier_id;

                $order->update([
                    'current_courier_id' => $replacementCourierId,
                    'delivery_status' => 'IN_TRANSIT',
                ]);

                $oldCourier = $incident->courier_id === $oldCourierId
                    ? $incident->courier
                    : Courier::find($oldCourierId);
                if ($oldCourier) {
                    $oldCourier->decrement('current_parcel_count');
                }
                $replacementCourier->increment('current_parcel_count');

                $confirmation = $incident->reassignmentConfirmations()->create([
                    'confirmation_code' => 'RSC-HLM-' . strtoupper(uniqid()),
                    'order_id' => $order->id,
                    'confirmation_time' => now(),
                    'status' => 'CONFIRMED',
                ]);

                $auditLog = $incident->auditLogs()->create([
                    'log_code' => 'AUD-HLM-' . date('Y') . '-' . strtoupper(uniqid()),
                    'order_id' => $order->id,
                    'original_courier_id' => $oldCourierId,
                    'replacement_courier_id' => $replacementCourierId,
                    'executor_user_id' => $user->id,
                    'incident_category' => $incident->incident_category,
                    'incident_detail' => $incident->title,
                    'resolution_time_seconds' => 18.00,
                    'is_sla_saved' => true,
                    'audit_hash' => hash('sha256', $order->order_number . 'ONE_CLICK_REASSIGNMENT' . now()),
                    'created_at' => OperationalClock::now(),
                ]);

                $cacheHubId = $order->hub_origin_id;

                $task = TaskTracker::accepted('notifikasi_pengalihan', [
                    'confirmation_code' => $confirmation->confirmation_code,
                    'courier' => $replacementCourier->name,
                ]);

                NotifikasiPengalihan::dispatch($confirmation, [
                    'name' => $replacementCourier->name,
                    'phone' => $replacementCourier->phone_number,
                    'code' => $replacementCourier->courier_code,
                ], $task['id'])->afterCommit();

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
                        'notification' => [
                            'task_id' => $task['id'],
                            'status' => $task['status'],
                            'message' => $task['message'],
                        ],
                    ],
                ];
            });
        } catch (\Exception $e) {
            report($e);

            return [
                'success' => false,
                'code' => 'ERROR',
                'message' => 'Terjadi kesalahan: ' . $e->getMessage(),
            ];
        } finally {
            $lock->release();
        }

        // Transaksi sudah commit: pembuangan cache dilakukan di sini agar
        // pembaca berikutnya tidak pernah mengisi ulang cache dari data lama.
        if ($cacheHubId !== null) {
            self::clearPanelCache($cacheHubId);
        }

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

    public static function clearPanelCache(string $hubId): void
    {
        foreach ([
            "sla_risk_orders_{$hubId}",
            "sla_risk_orders_{$hubId}_panel",
            "audit_logs_{$hubId}",
            "incidents_{$hubId}",
            "dashboard_summary_{$hubId}",
            "couriers_{$hubId}",
            "available_couriers_{$hubId}",
        ] as $key) {
            Cache::forget($key);
        }
        SlaRiskService::bumpTugasTabelVersion($hubId);
    }

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
            'reported_at' => OperationalClock::now(),
        ]);

        $this->clearPanelCache($order->hub_origin_id);

        $incident->setRelation('order', $order);
        $incident->setRelation('courier', $courier);
        $incident->setRelation('evidences', new \Illuminate\Database\Eloquent\Collection());

        $formatted = $this->formatIncident($incident);

        event(new IncidentReported($order->hub_origin_id, $formatted));

        return $formatted;
    }
}