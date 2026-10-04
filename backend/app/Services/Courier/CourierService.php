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
    public function getCouriersByHub(string $hubId): array
    {
        $cacheKey = "couriers_{$hubId}";

        return Cache::remember($cacheKey, 5, function () use ($hubId) {
            $couriers = Courier::query()
                ->select(self::selectWithLatestTelemetry())
                ->with(['orders' => fn ($query) => $query->whereNotIn('delivery_status', ['DELIVERED', 'RETURNED'])])
                ->where('hub_id', $hubId)
                ->whereIn('status', ['ONLINE', 'IDLE'])
                ->get();

            $hub = Hub::cached($hubId);

            foreach ($couriers as $courier) {
                $courier->setRelation('hub', $hub);
                self::attachTelemetryFromSelect($courier);
            }

            return $couriers->map(fn (Courier $courier) => $this->formatCourier($courier, true))->toArray();
        });
    }

    /**
     * @return array<int, string|\Illuminate\Contracts\Database\Query\Expression>
     */
    public static function selectWithLatestTelemetry(): array
    {
        $selects = ['couriers.*'];

        foreach (['latitude', 'longitude', 'speed_kmh', 'temperature_c', 'battery_level', 'recorded_at'] as $column) {
            $selects[] = DB::raw(sprintf(
                '(SELECT t.%s FROM courier_telemetries t WHERE t.courier_id = couriers.id ORDER BY t.recorded_at DESC LIMIT 1) AS joined_telemetry_%s',
                $column,
                $column,
            ));
        }

        return $selects;
    }

    public static function attachTelemetryFromSelect(Courier $courier): void
    {
        $attributes = $courier->getAttributes();
        $telemetry = [];

        foreach (array_keys($attributes) as $key) {
            if (! str_starts_with($key, 'joined_telemetry_')) {
                continue;
            }

            $telemetry[substr($key, strlen('joined_telemetry_'))] = $attributes[$key];
            unset($attributes[$key]);
        }

        $courier->setRawAttributes($attributes, true);
        
        if (($telemetry['recorded_at'] ?? null) === null) {
            $courier->setRelation('latestTelemetry', null);

            return;
        }

        $courier->setRelation('latestTelemetry', (new CourierTelemetry())->forceFill($telemetry));
    }

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

    private function formatCourier(Courier $courier, bool $withOrders = false): array
    {
        $telemetry = $courier->latestTelemetry;

        // Hitung durasi idle
        $idleDuration = null;
        if ($courier->status === 'IDLE' && $telemetry) {
            $idleMinutes = max(0, (int) round($telemetry->recorded_at->diffInMinutes(now())));
            $idleDuration = $idleMinutes < 60
                ? $idleMinutes . 'm'
                : floor($idleMinutes / 60) . 'j ' . ($idleMinutes % 60) . 'm';
        }

        $isStale = false;
        if ($telemetry && $courier->status === 'ONLINE') {
            $isStale = $telemetry->recorded_at->diffInMinutes(now()) > 15;
        }

        $distanceFromHubM = null;
        $insideRadius = null;
        if ($telemetry && $courier->hub) {
            $distanceFromHubM = (int) round(self::haversineMetres(
                (float) $telemetry->latitude,
                (float) $telemetry->longitude,
                (float) $courier->hub->latitude,
                (float) $courier->hub->longitude,
            ));
            $insideRadius = $distanceFromHubM <= (float) $courier->hub->service_radius_km * 1000;
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
            'distance_from_hub_m' => $distanceFromHubM,
            'inside_radius' => $insideRadius,
            'radius_km' => $courier->hub->service_radius_km !== null
                ? (float) $courier->hub->service_radius_km
                : null,
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
                'order_time' => $order->order_time?->toISOString(),
                'sla_deadline' => $order->sla_deadline->toISOString(),
                'delivery_status' => $order->delivery_status,
            ])->toArray();
        }

        return $data;
    }

    private function getInitials(string $name): string
    {
        $words = explode(' ', $name);
        $initials = '';
        foreach (array_slice($words, 0, 2) as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }
        return $initials;
    }

    public static function haversineMetres(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $earthRadiusM = 6371000;
        $toRad = fn (float $deg): float => $deg * M_PI / 180;

        $dLat = $toRad($lat2 - $lat1);
        $dLng = $toRad($lng2 - $lng1);

        $a = sin($dLat / 2) ** 2
            + cos($toRad($lat1)) * cos($toRad($lat2)) * sin($dLng / 2) ** 2;

        return $earthRadiusM * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

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