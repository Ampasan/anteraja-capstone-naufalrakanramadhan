<?php

namespace App\Services\Courier;

use App\Models\Courier;
use App\Models\Hub;
use App\Models\Order;
use Illuminate\Support\Facades\Cache;

class CourierReplacementService
{

    /** @var array<string, bool>  */
    private static array $twoWheelerMemo = [];

    /** @var \WeakMap<Courier, array<string, mixed>> */
    private \WeakMap $snapshots;

    public const MAX_ACTIVE_PARCELS = 10;

    public const MAX_CANDIDATES = 2;

    public function __construct()
    {
        $this->snapshots = new \WeakMap();
    }

    /**
     * @return array{id: string, vehicle_type: mixed, max_capacity_kg: float, has_thermal_box: bool, is_bpom_certified: bool, hub: array{lat: float, lng: float}|null, telemetry: array{lat: float, lng: float}|null}
     */
    private function snapshot(Courier $courier): array
    {
        if (isset($this->snapshots[$courier])) {
            return $this->snapshots[$courier];
        }

        $hub = $courier->hub;
        $telemetry = $courier->latestTelemetry;

        return $this->snapshots[$courier] = [
            'id' => (string) $courier->id,
            'vehicle_type' => $courier->vehicle_type,
            'max_capacity_kg' => (float) $courier->max_capacity_kg,
            'has_thermal_box' => (bool) $courier->has_thermal_box,
            'is_bpom_certified' => (bool) $courier->is_bpom_certified,
            'hub' => $hub !== null
                ? ['lat' => (float) $hub->latitude, 'lng' => (float) $hub->longitude]
                : null,
            'telemetry' => $telemetry !== null
                ? ['lat' => (float) $telemetry->latitude, 'lng' => (float) $telemetry->longitude]
                : null,
        ];
    }

    public function isCompatible(?Courier $courier, ?Order $order): bool
    {
        if ($courier === null || $order === null) {
            return true;
        }

        return $this->isCompatibleService($courier, self::serviceKey($order));
    }

    private static function serviceKey(Order $order): string
    {
        return strtoupper(trim((string) $order->service_type));
    }

    private function isCompatibleService(Courier $courier, string $serviceKey): bool
    {
        $snapshot = $this->snapshot($courier);

        return match ($serviceKey) {
            'CARGO' => ! self::isTwoWheeler((string) $snapshot['vehicle_type']),
            'FROZEN' => $snapshot['has_thermal_box'],
            'PHARMA' => $snapshot['is_bpom_certified'],
            default => true,
        };
    }
    
    public static function isTwoWheeler(string $vehicleType): bool
    {
        if (isset(self::$twoWheelerMemo[$vehicleType])) {
            return self::$twoWheelerMemo[$vehicleType];
        }

        $result = (bool) preg_match('/motor|sepeda|bike|ojek/i', $vehicleType);
        
        if (strlen($vehicleType) <= 64) {
            self::$twoWheelerMemo[$vehicleType] = $result;
        }

        return $result;
    }

    private function isHeavyVehicle(string $vehicleType): bool
    {
        return ! self::isTwoWheeler($vehicleType);
    }

    /**
     * Ambil semua kandidat kurir pengganti untuk ditampilkan di UI.
     *
     * @param  Order|null
     * 
     */
    public function getReplacementCandidates(
        string $hubId,
        string|array $excludeCourierIds,
        float $requiredCapacityKg = 0,
        ?Order $order = null,
        ?array $from = null,
    ): array {
        return $this->candidatesFromCollection(
            $this->getAvailableCouriers($hubId),
            $excludeCourierIds,
            $requiredCapacityKg,
            $order,
            $from
        );
    }

    public function getAvailableCouriers(string $hubId)
    {
        $cacheKey = "available_couriers_{$hubId}";

        return Cache::remember($cacheKey, 30, function () use ($hubId) {
            $couriers = Courier::query()
                ->select(CourierService::selectWithLatestTelemetry())
                ->where('hub_id', $hubId)
                ->where('status', 'IDLE')
                ->where('current_parcel_count', '<=', self::MAX_ACTIVE_PARCELS)
                ->orderBy('current_parcel_count', 'asc')
                ->orderBy('current_load_kg', 'asc')
                ->get();
                
            $hub = Hub::cached($hubId);

            foreach ($couriers as $courier) {
                $courier->setRelation('hub', $hub);
                CourierService::attachTelemetryFromSelect($courier);
            }

            return $couriers;
        });
    }

    /**
     * @param  Order|null  $order  Untuk penyaringan kompatibilitas armada.
     * @param  string|array<int, string>  $excludeCourierIds  Kurir yang tidak boleh
     *        ditawarkan sebagai tujuan — minimal kurir yang sedang memegang paket,
     *        karena constraint chk_reassign_different_couriers melarang
     *        original_courier_id dan replacement_courier_id bernilai sama.
     * @param  array{lat: float, lng: float}|null  $from  Titik awal pengukuran
     *        jarak (lokasi kendala). Kalau kosong diukur dari hub.
     * @param  bool  $enclosedOnly  Hanya armada beratap (Van, blind van, pick up,
     *        truk). Dipakai untuk kendala cuaca: pengendara roda dua tidak
     *        layak ditugaskan saat hujan deras. Aturan ini didahulukan di atas
     *        kecocokan keluarga kendaraan, karena saat hujan justru roda dua
     *        yang harus digugurkan.
     * @param  int  $limit  Jumlah kandidat yang ditawarkan; selalu
     *        `MAX_CANDIDATES` (dua kandidat terdekat).
     * @param  string|null  $likeVehicleType  Tipe kendaraan kurir yang terkendala.
     *        Bila roda dua, kandidat dibatasi pada roda dua pula
     *        (Motorcycle / Motor Listrik) supaya penggantinya punya tipe
     *        kendaraan yang hampir mirip.
     */
    public function candidatesFromCollection($couriers, string|array $excludeCourierIds, float $requiredCapacityKg = 0, ?Order $order = null, ?array $from = null, bool $enclosedOnly = false, int $limit = self::MAX_CANDIDATES, ?string $likeVehicleType = null): array
    {
        $excluded = array_fill_keys(
            array_map('strval', is_array($excludeCourierIds) ? $excludeCourierIds : [$excludeCourierIds]),
            true,
        );

        $sameFamilyOnly = $likeVehicleType !== null
            && ! $enclosedOnly
            && self::isTwoWheeler($likeVehicleType);

        $serviceKey = $order !== null ? self::serviceKey($order) : '';

        $shortlisted = [];

        foreach ($couriers as $courier) {
            $snapshot = $this->snapshot($courier);

            if (isset($excluded[$snapshot['id']])) {
                continue;
            }

            $vehicleType = (string) $snapshot['vehicle_type'];

            if ($requiredCapacityKg > 0 && $snapshot['max_capacity_kg'] < $requiredCapacityKg) {
                continue;
            }

            if ($enclosedOnly && ! $this->isHeavyVehicle($vehicleType)) {
                continue;
            }

            if ($sameFamilyOnly && ! self::isTwoWheeler($vehicleType)) {
                continue;
            }

            if ($serviceKey !== '' && ! $this->isCompatibleService($courier, $serviceKey)) {
                continue;
            }

            $shortlisted[] = [$courier, $this->distanceFrom($snapshot, $from)];
        }

        usort($shortlisted, fn (array $a, array $b) => $a[1] <=> $b[1]);

        $rows = [];

        foreach (array_slice($shortlisted, 0, $limit) as $index => [$courier, $distanceM]) {
            $rows[] = [
                'id' => $courier->id,
                'courier_code' => $courier->courier_code,
                'name' => $courier->name,
                'initials' => $this->getInitials($courier->name),
                'vehicle_type' => $courier->vehicle_type,
                'license_plate' => $courier->license_plate,
                'status' => $courier->status,
                'current_parcel_count' => $courier->current_parcel_count,
                'max_parcel_count' => $courier->max_parcel_count,
                'current_load_kg' => (float) $courier->current_load_kg,
                'max_capacity_kg' => (float) $courier->max_capacity_kg,
                'distance_m' => $distanceM,
                'eta_minutes' => $this->estimateEta($distanceM),
                'is_recommended' => $index === 0,
                'badge' => $index === 0 ? 'Rekomendasi Utama' : 'Alternatif ' . ($index + 1),
            ];
        }

        return $rows;
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

    /**
     * @param  array{hub: array{lat: float, lng: float}|null, telemetry: array{lat: float, lng: float}|null}  $snapshot
     * @param  array{lat: float, lng: float}|null  $from  Titik awal; kosong = dari hub.
     */
    private function distanceFrom(array $snapshot, ?array $from): int
    {
        $hub = $snapshot['hub'];

        $origin = $from ?? $hub;

        if ($origin === null) {
            return 0;
        }

        $point = $snapshot['telemetry'] ?? $hub;

        if ($point === null) {
            return 0;
        }

        return (int) round(CourierService::haversineMetres(
            $point['lat'],
            $point['lng'],
            $origin['lat'],
            $origin['lng'],
        ));
    }

    private function estimateEta(int $distanceMetres): int
    {
        if ($distanceMetres <= 0) {
            return 1;
        }

        return (int) min(60, max(1, (int) ceil($distanceMetres / 417)));
    }
}