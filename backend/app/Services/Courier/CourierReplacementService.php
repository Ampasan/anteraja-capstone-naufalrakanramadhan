<?php

namespace App\Services\Courier;

use App\Models\Courier;
use App\Models\Order;

class CourierReplacementService
{
    /**
     * Batas beban paket aktif kurir yang boleh menerima pengalihan.
     *
     * Dipakai DUA tempat dengan angka yang sama supaya kandidat yang tampil di
     * UI dijamin bisa dikonfirmasi (dan sebaliknya, eksekusi tidak pernah
     * menolak kandidat yang baru saja ditampilkan):
     *   - penyaringan daftar kandidat  -> current_parcel_count <= 10
     *   - guard eksekusi reassign      -> > 10 paket memunculkan 422
     *
     * Catatan: FRD-03 / BR-02 menyebut < 20 paket (batas max_parcel_count),
     * nilai 10 dipilih lebih ketat sesuai spesifikasi sistem yang disepakati.
     */
    public const MAX_ACTIVE_PARCELS = 10;

    /**
     * Cek apakah armada kurir memenuhi syarat khusus layanan paket.
     *
     * FRD-03 / BR-02 — Compatibility Matching:
     *   Cargo  wajib armada berat (Van / Truk), bukan sepeda motor
     *   Frozen wajib tas/box termal  (couriers.has_thermal_box)
     *   PHARMA wajib sertifikasi BPOM (couriers.is_bpom_certified)
     *
     * Kedua kolom penanda itu memang ada di tabel couriers namun sebelumnya
     * tidak pernah dipakai; aturan inilah yang memakainya.
     */
    public function isCompatible(?Courier $courier, ?Order $order): bool
    {
        if ($courier === null || $order === null) {
            return true;
        }

        return match (strtoupper(trim((string) $order->service_type))) {
            'CARGO' => $this->isHeavyVehicle($courier->vehicle_type),
            'FROZEN' => (bool) $courier->has_thermal_box,
            'PHARMA' => (bool) $courier->is_bpom_certified,
            default => true,
        };
    }

    /**
     * Apakah termasuk armada berat (Van / Truk / Pick Up Box)?
     * Semua varian sepeda motor otomatis ditolak untuk layanan Cargo.
     */
    private function isHeavyVehicle(string $vehicleType): bool
    {
        return stripos($vehicleType, 'motorcycle') === false;
    }

    /**
     * Ambil semua kandidat kurir pengganti untuk ditampilkan di UI.
     *
     * @param  Order|null  $order  Dipakai untuk menyaring kompatibilitas armada
     *                             sesuai layanan paket (FRD-03 / BR-02).
     */
    public function getReplacementCandidates(
        string $hubId,
        string $excludeCourierId,
        float $requiredCapacityKg = 0,
        ?Order $order = null,
    ): array {
        return $this->candidatesFromCollection(
            $this->getAvailableCouriers($hubId),
            $excludeCourierId,
            $requiredCapacityKg,
            $order
        );
    }

    /**
     * Ambil seluruh kurir yang layak jadi pengganti di 1 hub (1 query).
     * Dipakai saat butuh kandidat untuk BANYAK insiden sekaligus, sehingga
     * cukup query sekali lalu difilter di memori.
     */
    public function getAvailableCouriers(string $hubId)
    {
        return Courier::where('hub_id', $hubId)
            ->whereIn('status', ['ONLINE', 'IDLE'])
            ->where('current_parcel_count', '<=', self::MAX_ACTIVE_PARCELS)
            ->orderBy('current_parcel_count', 'asc')
            ->orderBy('current_load_kg', 'asc')
            ->get();
    }

    /**
     * Susun daftar kandidat dari koleksi kurir yang sudah diambil sebelumnya.
     *
     * FRD-03 / BR-02: maksimal 5 kandidat teratas yang memenuhi SEMUA syarat —
     * bukan kurir bermasalah, kapasitas muatan mencukupi, dan armada kompatibel
     * dengan layanan paket — lalu diurutkan dari beban paling ringan.
     *
     * @param  Order|null  $order  Untuk penyaringan kompatibilitas armada.
     */
    public function candidatesFromCollection($couriers, string $excludeCourierId, float $requiredCapacityKg = 0, ?Order $order = null): array
    {
        return $couriers
            ->filter(function (Courier $courier) use ($excludeCourierId, $requiredCapacityKg, $order) {
                if ($courier->id === $excludeCourierId) {
                    return false;
                }

                if ($requiredCapacityKg > 0 && (float) $courier->max_capacity_kg < $requiredCapacityKg) {
                    return false;
                }

                return $this->isCompatible($courier, $order);
            })
            ->take(5)
            ->values()
            ->map(function (Courier $courier, int $index) {
                return [
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
                    'distance_m' => $this->estimateDistance($courier),
                    'eta_minutes' => $this->estimateEta($courier),
                    'is_recommended' => $index === 0,
                    'badge' => $index === 0 ? 'Rekomendasi Utama' : 'Alternatif ' . ($index + 1),
                ];
            })->values()->toArray();
    }

    /**
     * Generate inisial dari nama.
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
     * Estimasi jarak kurir dari hub (simulasi).
     */
    private function estimateDistance(Courier $courier): int
    {
        // Simulasi: jarak acak antara 200-2000 meter
        return rand(200, 2000);
    }

    /**
     * Estimasi waktu tempuh dalam menit (simulasi).
     */
    private function estimateEta(Courier $courier): int
    {
        // Simulasi: ETA 2-15 menit
        return rand(2, 15);
    }
}
