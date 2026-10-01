<?php

namespace App\Services\Courier;

use App\Events\CourierTelemetryUpdated;
use App\Models\Courier;
use App\Models\CourierTelemetry;
use App\Models\Hub;
use App\Models\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class CourierService
{
    /**
     * Ambil semua kurir untuk hub tertentu dengan telemetri terbaru.
     * Hanya tampilkan kurir ONLINE dan IDLE (OFFLINE tidak ditampilkan).
     * Data di-cache 10 detik (panel monitoring memang refresh tiap 10 detik).
     */
    public function getCouriersByHub(string $hubId): array
    {
        $cacheKey = "couriers_{$hubId}";

        return Cache::remember($cacheKey, 10, function () use ($hubId) {
            // NOTE: Jangan gunakan select() dengan with() - bisa menyebabkan masalah foreign key
            $couriers = Courier::with(['latestTelemetry'])
                ->where('hub_id', $hubId)
                ->whereIn('status', ['ONLINE', 'IDLE'])
                ->get();

            // Semua kurir dari hub yang sama: ambil hub dari cache (hemat 1 query)
            $hub = Hub::cached($hubId);
            $couriers->each(fn (Courier $courier) => $courier->setRelation('hub', $hub));

            return $couriers->map(fn (Courier $courier) => $this->formatCourier($courier))->toArray();
        });
    }

    /**
     * Ambil detail kurir beserta paket aktif.
     */
    public function getCourierDetail(string $courierId): ?array
    {
        $courier = Courier::with(['latestTelemetry', 'hub', 'orders' => function ($query) {
            $query->whereNotIn('delivery_status', ['DELIVERED', 'RETURNED']);
        }])->find($courierId);

        if (!$courier) {
            return null;
        }

        return $this->formatCourier($courier, true);
    }

    /**
     * Format data kurir untuk response API.
     */
    private function formatCourier(Courier $courier, bool $withOrders = false): array
    {
        $telemetry = $courier->latestTelemetry;

        // Hitung durasi idle
        $idleDuration = null;
        if ($courier->status === 'IDLE' && $telemetry) {
            // Carbon 3 mengembalikan nilai bertanda (tanggal lama = negatif),
            // jadi selisihnya dihitung dari recorded_at menuju sekarang.
            $idleMinutes = max(0, (int) round($telemetry->recorded_at->diffInMinutes(now())));
            $idleDuration = $idleMinutes < 60
                ? $idleMinutes . 'm'
                : floor($idleMinutes / 60) . 'j ' . ($idleMinutes % 60) . 'm';
        }

        // Deteksi kurir diam (tidak kirim lokasi > 15 menit)
        $isStale = false;
        if ($telemetry && $courier->status === 'ONLINE') {
            $isStale = $telemetry->recorded_at->diffInMinutes(now()) > 15;
        }

        $data = [
            'id' => $courier->id,
            'courier_code' => $courier->courier_code,
            'name' => $courier->name,
            'initials' => $this->getInitials($courier->name),
            'status' => $courier->status,
            'vehicle_type' => $courier->vehicle_type,
            'phone_number' => $courier->phone_number,
            'license_plate' => $courier->license_plate,
            'current_parcel_count' => $courier->current_parcel_count,
            'max_parcel_count' => $courier->max_parcel_count,
            'current_load_kg' => (float) $courier->current_load_kg,
            'max_capacity_kg' => (float) $courier->max_capacity_kg,
            'current_address' => $courier->current_address,
            'is_bpom_certified' => $courier->is_bpom_certified,
            'has_thermal_box' => $courier->has_thermal_box,
            'idle_duration' => $idleDuration,
            'is_stale' => $isStale,
            'position' => $telemetry ? [
                'lat' => (float) $telemetry->latitude,
                'lng' => (float) $telemetry->longitude,
            ] : null,
            'telemetry' => $telemetry ? [
                'speed_kmh' => (float) $telemetry->speed_kmh,
                'temperature_c' => $telemetry->temperature_c ? (float) $telemetry->temperature_c : null,
                'battery_level' => $telemetry->battery_level,
                'recorded_at' => $telemetry->recorded_at->toISOString(),
            ] : null,
            'hub_position' => [
                'lat' => (float) $courier->hub->latitude,
                'lng' => (float) $courier->hub->longitude,
            ],
        ];

        if ($withOrders) {
            $data['active_packages'] = $courier->orders->map(fn (Order $order) => [
                'waybill_number' => $order->order_number,
                'service_type' => $order->service_type,
                'weight_kg' => (float) $order->weight_kg,
                'recipient_name' => $order->recipient_name,
                'destination_address' => $order->destination_address,
                'drop_lat' => (float) $order->drop_latitude,
                'drop_lng' => (float) $order->drop_longitude,
                'sla_deadline' => $order->sla_deadline->toISOString(),
                'delivery_status' => $order->delivery_status,
            ])->toArray();
        }

        return $data;
    }

    /**
     * Generate inisial dari nama kurir.
     */
    private function getInitials(string $name): string
    {
        $words = explode(' ', $name);
        $initials = '';
        foreach (array_slice($words, 0, 2) as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        return $initials;
    }

    /**
     * Update posisi kurir (dipanggil dari tracking device).
     *
     * Catatan: cache list kurir TIDAK dihapus di sini. Data lokasi memang
     * direfresh tiap 10 detik sesuai kebutuhan panel monitoring, jadi cukup
     * mengandalkan TTL. Menghapus cache tiap telemetri masuk justru membuat
     * GET /couriers selalu kena query penuh (lambat).
     */
    public function updateTelemetry(Courier $courier, array $data): void
    {
        CourierTelemetry::create([
            'courier_id' => $courier->id,
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
            'speed_kmh' => $data['speed_kmh'] ?? 0,
            'temperature_c' => $data['temperature_c'] ?? null,
            'battery_level' => $data['battery_level'] ?? 100,
            'recorded_at' => now(),
        ]);

        // Siarkan posisi terbaru ke peta monitoring (PRD F-01).
        // Sengaja pakai data minim agar payload tiap update tetap kecil.
        event(new CourierTelemetryUpdated($courier->hub_id, [
            'id' => $courier->id,
            'courier_code' => $courier->courier_code,
            'name' => $courier->name,
            'status' => $courier->status,
            'latitude' => (float) $data['latitude'],
            'longitude' => (float) $data['longitude'],
            'speed_kmh' => (float) ($data['speed_kmh'] ?? 0),
            'battery_level' => (int) ($data['battery_level'] ?? 100),
            'recorded_at' => now()->toISOString(),
        ]));
    }
}
