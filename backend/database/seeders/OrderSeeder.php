<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\Hub;
use App\Models\Order;
use App\Support\OperationalClock;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $hub = Hub::where('hub_code', 'HUB-JAKTIM-HALIM')->firstOrFail();

        foreach ($this->rows() as $data) {
            $this->upsert($hub, $data);
        }
    }

    /**
     * @return int jumlah baris yang diperbarui
     */
    public function refreshWindows(): int
    {
        $refreshed = 0;

        foreach ($this->rows() as $data) {
            $refreshed += Order::where('order_number', $data['order_number'])
                ->update($this->timing($data));
        }

        return $refreshed;
    }

    private function timing(array $data): array
    {
        $elapsed = $data['elapsed'];
        $sla = $data['sla'];
        $now = OperationalClock::now();

        return [
            'order_time' => $now->copy()->subMinutes($elapsed),
            'pickup_time' => $now->copy()->subMinutes($elapsed)->addMinutes((int) ($elapsed * 0.15)),
            'sla_deadline' => $now->copy()->addMinutes($sla),
        ];
    }

    /** Insert atau perbarui satu order lengkap dengan data kurir & statusnya. */
    private function upsert(Hub $hub, array $data): void
    {
        $courier = Courier::where('courier_code', $data['courier'])->first();

        $timing = $this->timing($data);

        // Nama kunci di tabel sedikit berbeda dari kunci daftar seed.
        $data['weather_condition'] = $data['weather'];
        $data['traffic_condition'] = $data['traffic'];
        $data['temperature_c'] = $data['temp'];
        unset($data['courier'], $data['elapsed'], $data['sla'], $data['weather'], $data['traffic'], $data['temp']);

        Order::updateOrCreate(
            ['order_number' => $data['order_number']],
            array_merge($data, $timing, [
                'hub_origin_id' => $hub->id,
                'current_courier_id' => $courier?->id,
                'delivery_status' => $data['delivery_status'] ?? 'IN_TRANSIT',
            ])
        );
    }

    /** Susunan 25 order Hub Halim — 22 IN_TRANSIT, 3 DELIVERED. */
    private function rows(): array
    {
        return [
            // ── Budi Santoso (HLM-001, ONLINE) ─────────────────────────────
            [
                'order_number' => '100024000000', 'courier' => 'HLM-001',
                'service_type' => 'Same Day', 'category' => 'Snack & Makanan',
                'weight_kg' => 1.40, 'recipient_name' => 'Ibu Ratna', 'recipient_phone' => '081298765403',
                'destination_address' => 'Jl. Gatot Subroto Kav. 22', 'destination_district' => 'Kramat Jati',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2610, 'drop_longitude' => 106.8695,
                'elapsed' => 180, 'sla' => 9, 'weather' => 'Cerah', 'traffic' => 'Sedang', 'temp' => null,
            ],
            [
                'order_number' => '100024000008', 'courier' => 'HLM-001',
                'service_type' => 'Instant', 'category' => 'Dokumen Mendesak',
                'weight_kg' => 0.80, 'recipient_name' => 'Bpk. Hendra', 'recipient_phone' => '081298765404',
                'destination_address' => 'Jl. Ir. H. Djuanda No. 120', 'destination_district' => 'Cawang',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2432, 'drop_longitude' => 106.8640,
                'elapsed' => 120, 'sla' => -14, 'weather' => 'Hujan lebat', 'traffic' => 'macet', 'temp' => null,
            ],
            [
                'order_number' => '100024000411', 'courier' => 'HLM-001',
                'service_type' => 'PHARMA', 'category' => 'Vaksin & Obat Resep',
                'weight_kg' => 2.10, 'recipient_name' => 'RS Islam Jakarta Timur', 'recipient_phone' => '081298765407',
                'destination_address' => 'Jl. Jatinegara Barat No. 126', 'destination_district' => 'Jatinegara',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2488, 'drop_longitude' => 106.9012,
                'elapsed' => 300, 'sla' => 48, 'weather' => 'Berawan', 'traffic' => 'Cawang Padat', 'temp' => 18.5,
            ],
            [
                'order_number' => '100024000501', 'courier' => 'HLM-001',
                'service_type' => 'Same Day', 'category' => 'Pakaian & Mode',
                'weight_kg' => 2.30, 'recipient_name' => 'Sdri. Anisa', 'recipient_phone' => '081298765411',
                'destination_address' => 'Jl. Pahlawan Revolusi No. 55', 'destination_district' => 'Pondok Bambu',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2405, 'drop_longitude' => 106.9130,
                'elapsed' => 120, 'sla' => 132, 'weather' => 'Cerah', 'traffic' => 'Lancar', 'temp' => null,
            ],
            [
                'order_number' => '100024000502', 'courier' => 'HLM-001',
                'service_type' => 'Instant', 'category' => 'Elektronik Kecil',
                'weight_kg' => 1.10, 'recipient_name' => 'Bpk. Yudi', 'recipient_phone' => '081298765412',
                'destination_address' => 'Jl. Dewi Sartika No. 88', 'destination_district' => 'Cawang',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2470, 'drop_longitude' => 106.8620,
                'elapsed' => 90, 'sla' => 26, 'weather' => 'Hujan Ringan', 'traffic' => 'Padat', 'temp' => null,
            ],

            // ── Fajar Ramadhan (HLM-004, ONLINE) ──────────────────────────
            [
                'order_number' => '100024000529', 'courier' => 'HLM-004',
                'service_type' => 'Cargo', 'category' => 'Elektronik Rumah Tangga',
                'weight_kg' => 75.00, 'recipient_name' => 'Toko Jaya Makmur', 'recipient_phone' => '081298765408',
                'destination_address' => 'Jl. Pondok Kopi Raya No. 12', 'destination_district' => 'Pondok Kopi',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2172, 'drop_longitude' => 106.9248,
                'elapsed' => 300, 'sla' => 210, 'weather' => 'Normal Cerah', 'traffic' => 'Lancar', 'temp' => null,
            ],
            [
                'order_number' => '100024000530', 'courier' => 'HLM-004',
                'service_type' => 'Cargo', 'category' => 'Bahan Bangunan',
                'weight_kg' => 120.00, 'recipient_name' => 'PT Bangun Jaya', 'recipient_phone' => '081298765413',
                'destination_address' => 'Jl. Raya Bekasi KM 18', 'destination_district' => 'Pulogadung',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.1880, 'drop_longitude' => 106.9060,
                'elapsed' => 240, 'sla' => 74, 'weather' => 'Cerah', 'traffic' => 'Sedang', 'temp' => null,
            ],
            [
                'order_number' => '100024000531', 'courier' => 'HLM-004',
                'service_type' => 'Same Day', 'category' => 'Berkas Notaris',
                'weight_kg' => 3.40, 'recipient_name' => 'Kantor Notaris Dian', 'recipient_phone' => '081298765414',
                'destination_address' => 'Jl. Pramuka Raya No. 40', 'destination_district' => 'Pulo Gadung',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.1905, 'drop_longitude' => 106.8780,
                'elapsed' => 200, 'sla' => 13, 'weather' => 'Hujan Ringan', 'traffic' => 'Padat', 'temp' => null,
            ],
            [
                'order_number' => '100024000544', 'courier' => 'HLM-004',
                'service_type' => 'Cargo', 'category' => 'Semen & Cat',
                'weight_kg' => 150.00, 'recipient_name' => 'UD Bangun Rumah', 'recipient_phone' => '081298765424',
                'destination_address' => 'Jl. Pulo Mas Raya No. 3', 'destination_district' => 'Pulo Mas',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.1870, 'drop_longitude' => 106.9150,
                'elapsed' => 260, 'sla' => -6, 'weather' => 'Hujan lebat', 'traffic' => 'Macet Total', 'temp' => null,
            ],

            // ── Rizky Pratama (HLM-008, ONLINE) — rantai dingin ───────────
            [
                'order_number' => '100024000009', 'courier' => 'HLM-008',
                'service_type' => 'Frozen', 'category' => 'Frozen Food & Daging',
                'weight_kg' => 4.50, 'recipient_name' => 'Resto Daging Sedap', 'recipient_phone' => '081298765402',
                'destination_address' => 'Jl. Condet Raya No. 18', 'destination_district' => 'Kramat Jati',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2748, 'drop_longitude' => 106.8870,
                'elapsed' => 170, 'sla' => 11, 'weather' => 'Berawan', 'traffic' => 'Padat', 'temp' => 6.2,
            ],
            [
                'order_number' => '100024000108', 'courier' => 'HLM-008',
                'service_type' => 'Frozen', 'category' => 'Ikan Salmon Segar',
                'weight_kg' => 3.20, 'recipient_name' => 'Ibu Maya', 'recipient_phone' => '081298765405',
                'destination_address' => 'Jl. Cipinang Muara No. 42', 'destination_district' => 'Cipinang Muara',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2318, 'drop_longitude' => 106.9015,
                'elapsed' => 240, 'sla' => 126, 'weather' => 'Cerah', 'traffic' => 'Lancar', 'temp' => 3.8,
            ],
            [
                'order_number' => '100024000533', 'courier' => 'HLM-008',
                'service_type' => 'Frozen', 'category' => 'Es Krim Premium',
                'weight_kg' => 6.00, 'recipient_name' => 'Kafe Ceria', 'recipient_phone' => '081298765415',
                'destination_address' => 'Jl. Kalimalang Raya No. 7', 'destination_district' => 'Pondok Kelapa',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2300, 'drop_longitude' => 106.9210,
                'elapsed' => 150, 'sla' => 37, 'weather' => 'Berawan', 'traffic' => 'Padat', 'temp' => 2.6,
                'delivery_status' => 'DELIVERED',
            ],

            // ── Teguh Wibowo (HLM-010, IDLE) ────────────────────────────────
            [
                'order_number' => '100024000012', 'courier' => 'HLM-010',
                'service_type' => 'Cargo', 'category' => 'Peralatan Pabrik',
                'weight_kg' => 186.80, 'recipient_name' => 'PT Sentosa Abadi', 'recipient_phone' => '081298765401',
                'destination_address' => 'Jl. Bekasi Timur Raya No. 9', 'destination_district' => 'Pulogadung',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.1900, 'drop_longitude' => 106.9210,
                'elapsed' => 350, 'sla' => 245, 'weather' => 'Cerah', 'traffic' => 'Macet Total', 'temp' => null,
                'delivery_status' => 'DELIVERED',
            ],
            [
                'order_number' => '100024000534', 'courier' => 'HLM-010',
                'service_type' => 'Cargo', 'category' => 'Meubelair',
                'weight_kg' => 240.00, 'recipient_name' => 'Toko Furnitur Indah', 'recipient_phone' => '081298765416',
                'destination_address' => 'Jl. Majapahit No. 22', 'destination_district' => 'Jatinegara',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2350, 'drop_longitude' => 106.8930,
                'elapsed' => 360, 'sla' => 96, 'weather' => 'Cerah', 'traffic' => 'Sedang', 'temp' => null,
            ],

            // ── Ahmad Fauzi (HLM-005, IDLE) ───────────────────────────────
            [
                'order_number' => '100024000535', 'courier' => 'HLM-005',
                'service_type' => 'Cargo', 'category' => 'Drum Kimia',
                'weight_kg' => 300.00, 'recipient_name' => 'PT Kimia Nusantara', 'recipient_phone' => '081298765417',
                'destination_address' => 'Jl. Pulo Gadung Raya No. 5', 'destination_district' => 'Pulo Gadung',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.1750, 'drop_longitude' => 106.9000,
                'elapsed' => 300, 'sla' => 168, 'weather' => 'Hujan Lebat', 'traffic' => 'Macet Parah', 'temp' => null,
                'delivery_status' => 'DELIVERED',
            ],
            [
                'order_number' => '100024000536', 'courier' => 'HLM-005',
                'service_type' => 'Same Day', 'category' => 'Dokumen Perusahaan',
                'weight_kg' => 2.00, 'recipient_name' => 'PT Cipta Media', 'recipient_phone' => '081298765418',
                'destination_address' => 'Jl. Casablanca Raya No. 100', 'destination_district' => 'Tebet',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2400, 'drop_longitude' => 106.8450,
                'elapsed' => 180, 'sla' => 54, 'weather' => 'Hujan Ringan', 'traffic' => 'Padat', 'temp' => null,
            ],

            // ── Rama Pratama (HLM-009, IDLE) ──────────────────────────────
            [
                'order_number' => '100024000254', 'courier' => 'HLM-009',
                'service_type' => 'Same Day', 'category' => 'Pakaian & Mode',
                'weight_kg' => 1.90, 'recipient_name' => 'Sdri. Cindy', 'recipient_phone' => '081298765406',
                'destination_address' => 'Jl. Buaran Raya No. 88', 'destination_district' => 'Duren Sawit',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2215, 'drop_longitude' => 106.9088,
                'elapsed' => 340, 'sla' => 188, 'weather' => 'Hujan Ringan', 'traffic' => 'Sedang', 'temp' => null,
            ],
            [
                'order_number' => '100024000540', 'courier' => 'HLM-009',
                'service_type' => 'Same Day', 'category' => 'Buku & Alat Tulis',
                'weight_kg' => 5.50, 'recipient_name' => 'Toko Warga', 'recipient_phone' => '081298765422',
                'destination_address' => 'Jl. Tebet Barat Dalam Raya', 'destination_district' => 'Tebet',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2430, 'drop_longitude' => 106.8470,
                'elapsed' => 270, 'sla' => 155, 'weather' => 'Cerah', 'traffic' => 'Lancar', 'temp' => null,
            ],

            // ── Indra Gunawan (HLM-002, IDLE) ─────────────────────────────
            [
                'order_number' => '100024000537', 'courier' => 'HLM-002',
                'service_type' => 'Instant', 'category' => 'Makanan Siap Saji',
                'weight_kg' => 1.60, 'recipient_name' => 'Warung Sederhana', 'recipient_phone' => '081298765419',
                'destination_address' => 'Jl. Matraman Raya No. 30', 'destination_district' => 'Matraman',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2030, 'drop_longitude' => 106.8450,
                'elapsed' => 150, 'sla' => 72, 'weather' => 'Cerah', 'traffic' => 'Sedang', 'temp' => null,
            ],
            [
                'order_number' => '100024000538', 'courier' => 'HLM-002',
                'service_type' => 'Same Day', 'category' => 'Kosmetik',
                'weight_kg' => 4.10, 'recipient_name' => 'Sdri. Fitri', 'recipient_phone' => '081298765420',
                'destination_address' => 'Jl. Raya Ciracas No. 15', 'destination_district' => 'Ciracas',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.3100, 'drop_longitude' => 106.8850,
                'elapsed' => 355, 'sla' => 260, 'weather' => 'Cerah', 'traffic' => 'Lancar', 'temp' => null,
            ],
            [
                'order_number' => '100024000539', 'courier' => 'HLM-002',
                'service_type' => 'Cargo', 'category' => 'Sparepart Motor',
                'weight_kg' => 95.00, 'recipient_name' => 'Bengkel Maju Motor', 'recipient_phone' => '081298765421',
                'destination_address' => 'Jl. Raya Bogor KM 22', 'destination_district' => 'Kramat Jati',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2900, 'drop_longitude' => 106.8720,
                'elapsed' => 300, 'sla' => 145, 'weather' => 'Berawan', 'traffic' => 'Sedang', 'temp' => null,
            ],

            // ── Eko Prasetyo (HLM-003, IDLE) ──────────────────────────────
            [
                'order_number' => '100024000541', 'courier' => 'HLM-003',
                'service_type' => 'Instant', 'category' => 'Kue Ulang Tahun',
                'weight_kg' => 2.80, 'recipient_name' => 'Ibu Lestari', 'recipient_phone' => '081298765423',
                'destination_address' => 'Jl. Manggarai Selatan No. 3', 'destination_district' => 'Tebet',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2180, 'drop_longitude' => 106.8460,
                'elapsed' => 160, 'sla' => 41, 'weather' => 'Hujan Ringan', 'traffic' => 'Sedang', 'temp' => null,
            ],

            // ── Andi Wijaya (HLM-011, IDLE) ─────────────────────────────────
            [
                'order_number' => '100024000542', 'courier' => 'HLM-011',
                'service_type' => 'PHARMA', 'category' => 'Obat Rutin',
                'weight_kg' => 1.20, 'recipient_name' => 'Bpk. Sulistyo', 'recipient_phone' => '081298765425',
                'destination_address' => 'Jl. Cawang Baru No. 7', 'destination_district' => 'Cawang',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2410, 'drop_longitude' => 106.8720,
                'elapsed' => 345, 'sla' => 300, 'weather' => 'Cerah', 'traffic' => 'Lancar', 'temp' => 21.0,
            ],
            [
                'order_number' => '100024000543', 'courier' => 'HLM-011',
                'service_type' => 'Same Day', 'category' => 'Hadiah & Aksesoris',
                'weight_kg' => 1.00, 'recipient_name' => 'Sdri. Nadia', 'recipient_phone' => '081298765426',
                'destination_address' => 'Jl. Bekasi Timur Raya No. 45', 'destination_district' => 'Pulogadung',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.1950, 'drop_longitude' => 106.9120,
                'elapsed' => 190, 'sla' => 64, 'weather' => 'Berawan', 'traffic' => 'Sedang', 'temp' => null,
            ],

            // ── Bayu Nugroho (HLM-007, IDLE) ────────────────────────────
            [
                'order_number' => '100024000545', 'courier' => 'HLM-007',
                'service_type' => 'Instant', 'category' => 'Makanan Siap Saji',
                'weight_kg' => 1.60, 'recipient_name' => 'Ibu Wulandari', 'recipient_phone' => '081298765427',
                'destination_address' => 'Jl. Pendidikan Raya No. 20', 'destination_district' => 'Kramat Jati',
                'destination_city' => 'Jakarta Timur', 'drop_latitude' => -6.2650, 'drop_longitude' => 106.8750,
                'elapsed' => 250, 'sla' => 10, 'weather' => 'Hujan Lebat', 'traffic' => 'Macet Parah', 'temp' => null,
            ],
        ];
    }
}