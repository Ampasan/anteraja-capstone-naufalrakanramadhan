<?php

namespace Tests\Performance\Fixtures;

use App\Support\OperationalClock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Volume data skala besar untuk suite performa.
 *
 * Seeder bawaan hanya menyiapkan 25 order, 4 insiden, dan 6 baris riwayat —
 * terlalu kecil untuk membuat perilaku O(n^2) atau query berlebih (N+1)
 * terbaca. Fixture ini menambah satu hari operasional penuh di hub Halim:
 * 40 kurir, 300 order, 90 insiden, dan 400 baris audit, sehingga endpoint
 * panel benar-benar memproses ratusan baris tiap request.
 *
 * Semua nilai deterministik (dihitung dari indeks, bukan random) supaya
 * pengukuran antar run dan antar mesin tetap bisa dibandingkan.
 */
class ScaleSeeder extends Seeder
{
    public const COURIERS = 40;
    public const ORDERS = 300;
    public const INCIDENTS = 90;
    public const AUDIT_LOGS = 400;

    private const SERVICE_TYPES = ['Instant', 'Same Day', 'Next Day', 'Regular', 'Cargo', 'Mini Cargo', 'Dokumen', 'PHARMA', 'Frozen'];
    private const CATEGORIES = ['Cuaca / Hujan', 'Anomali Suhu', 'Mogok Kendaraan', 'Ban Bocor', 'Alamat tidak ditemukan', 'Banjir', 'Macet Total'];
    private const INCIDENT_STATUSES = ['REPORTED', 'ACKNOWLEDGED', 'ESCALATED', 'RESOLVED'];
    private const VEHICLE_TYPES = ['Motorcycle', 'Van', 'Truk', 'Motor Listrik', 'Blind Van'];
    private const DELIVERY_STATUSES = ['IN_TRANSIT', 'IN_TRANSIT', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];

    public function run(): void
    {
        $hub = DB::table('hubs')->where('hub_code', 'HUB-JAKTIM-HALIM')->first();

        if ($hub === null) {
            return;
        }

        $couriers = $this->seedCouriers($hub->id);
        $orders = $this->seedOrders($hub->id, $couriers);
        $incidents = $this->seedIncidents($orders);
        $this->seedAuditLogs($orders, $couriers, $incidents);
    }

    /**
     * @return array<int, string> id kurir, indeks 0 = kurir pertama
     */
    private function seedCouriers(string $hubId): array
    {
        $now = OperationalClock::now();
        $ids = [];

        for ($i = 0; $i < self::COURIERS; $i++) {
            $ids[] = (string) Str::uuid();
        }

        $rows = [];

        foreach ($ids as $i => $id) {
            $rows[] = [
                'id' => $id,
                'courier_code' => sprintf('SCAL-%03d', $i + 1),
                'hub_id' => $hubId,
                'name' => sprintf('Kurir Skala %03d', $i + 1),
                'phone_number' => '0811' . sprintf('%08d', $i + 1),
                'license_plate' => 'B ' . sprintf('%04d', $i + 1) . ' SCALE',
                'vehicle_type' => self::VEHICLE_TYPES[$i % count(self::VEHICLE_TYPES)],
                // 80% IDLE: status yang membuat kurir tampil di peta, tabel tugas, dan daftar insiden.
                'status' => $i % 5 === 0 ? 'ONLINE' : 'IDLE',
                'current_parcel_count' => $i % 12,
                'max_parcel_count' => 20,
                'current_load_kg' => $i % 40,
                'max_capacity_kg' => 100,
                'current_address' => 'Jl. Skala No. ' . ($i + 1),
                'is_bpom_certified' => $i % 3 === 0,
                'has_thermal_box' => $i % 4 === 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('couriers')->insert($chunk);
        }

        return $ids;
    }

    /**
     * @param  array<int, string>  $couriers
     * @return array<int, string> id order
     */
    private function seedOrders(string $hubId, array $couriers): array
    {
        $now = OperationalClock::now();
        $ids = [];

        for ($i = 0; $i < self::ORDERS; $i++) {
            $ids[] = (string) Str::uuid();
        }

        $rows = [];

        foreach ($ids as $i => $id) {
            $orderedAt = $now->copy()->subMinutes($i % 240);

            $rows[] = [
                'id' => $id,
                'order_number' => sprintf('SCAL%06d', $i + 1),
                'hub_origin_id' => $hubId,
                'current_courier_id' => $couriers[$i % count($couriers)],
                'service_type' => self::SERVICE_TYPES[$i % count(self::SERVICE_TYPES)],
                'category' => 'Paket Reguler',
                'weight_kg' => 1 + ($i % 20),
                'recipient_name' => 'Penerima ' . ($i + 1),
                'destination_address' => 'Jl. Tujuan No. ' . ($i + 1),
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2 + (($i % 100) / 1000),
                'drop_longitude' => 106.8 + (($i % 100) / 1000),
                'order_time' => $orderedAt,
                'sla_deadline' => $orderedAt->copy()->addMinutes(60 + ($i % 300)),
                'weather_condition' => $i % 4 === 0 ? 'Hujan Sedang' : 'Cerah',
                'traffic_condition' => $i % 3 === 0 ? 'Macet' : 'Lancar',
                'temperature_c' => $i % 7 === 0 ? 6.5 : null,
                'delivery_status' => self::DELIVERY_STATUSES[$i % count(self::DELIVERY_STATUSES)],
                'created_at' => $orderedAt,
                'updated_at' => $orderedAt,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('orders')->insert($chunk);
        }

        return $ids;
    }

    /**
     * @param  array<int, string>  $orders
     * @return array<int, string> id insiden
     */
    private function seedIncidents(array $orders): array
    {
        $now = OperationalClock::now();
        $couriers = DB::table('couriers')->where('courier_code', 'like', 'SCAL-%')
            ->pluck('id', 'id')->values()->all();
        $orderRows = DB::table('orders')->whereIn('id', array_slice($orders, 0, self::INCIDENTS))
            ->get(['id', 'current_courier_id']);

        $ids = [];
        $rows = [];

        foreach ($orderRows as $i => $order) {
            $id = (string) Str::uuid();
            $ids[] = $id;
            $status = self::INCIDENT_STATUSES[$i % count(self::INCIDENT_STATUSES)];
            $replacement = $status === 'RESOLVED' ? $couriers[($i + 7) % count($couriers)] : null;

            // chk_incidents_replacement melarang kurir pengganti sama dengan pelapor.
            if ($replacement !== null && $replacement === $order->current_courier_id) {
                $replacement = $couriers[($i + 8) % count($couriers)];
            }

            $rows[] = [
                'id' => $id,
                'incident_code' => sprintf('SCAL-INC-%03d', $i + 1),
                'order_id' => $order->id,
                'courier_id' => $order->current_courier_id ?? $couriers[$i % count($couriers)],
                'replacement_courier_id' => $replacement,
                'handled_by_user_id' => null,
                'incident_category' => self::CATEGORIES[$i % count(self::CATEGORIES)],
                'title' => 'Kendala skala ' . ($i + 1),
                'description' => 'Dibuat fixture performa.',
                'location_address' => 'Jl. Kendala No. ' . ($i + 1),
                'latitude' => null,
                'longitude' => null,
                'status' => $status,
                'reported_at' => $now->copy()->subMinutes($i),
                'resolved_at' => $status === 'RESOLVED' ? $now->copy()->subMinutes($i - 5) : null,
                'created_at' => $now->copy()->subMinutes($i),
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('incident_reports')->insert($chunk);
        }

        return $ids;
    }

    /**
     * @param  array<int, string>  $orders
     * @param  array<int, string>  $couriers
     * @param  array<int, string>  $incidents
     */
    private function seedAuditLogs(array $orders, array $couriers, array $incidents): void
    {
        $now = OperationalClock::now();
        $rows = [];

        for ($i = 0; $i < self::AUDIT_LOGS; $i++) {
            $original = $couriers[$i % count($couriers)];
            $replacement = $couriers[($i + 5) % count($couriers)];

            if ($replacement === $original) {
                $replacement = $couriers[($i + 6) % count($couriers)];
            }

            $rows[] = [
                'id' => (string) Str::uuid(),
                'log_code' => sprintf('SCAL-LOG-%05d', $i + 1),
                'order_id' => $orders[$i % count($orders)],
                'incident_id' => $incidents[$i % count($incidents)] ?? null,
                'original_courier_id' => $original,
                'replacement_courier_id' => $replacement,
                'executor_user_id' => null,
                'incident_category' => self::CATEGORIES[$i % count(self::CATEGORIES)],
                'incident_detail' => 'Pengalihan skala ' . ($i + 1),
                'resolution_time_seconds' => 5 + ($i % 90),
                'is_sla_saved' => $i % 3 !== 0,
                'created_at' => $now->copy()->subMinutes($i),
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('audit_logs')->insert($chunk);
        }
    }
}
