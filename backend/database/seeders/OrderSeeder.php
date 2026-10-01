<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\Hub;
use App\Models\Order;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    /**
     * Seed 8 order untuk SLA Risk Panel.
     * Order memiliki SLA deadline yang bervariasi untuk simulasi risiko.
     */
    public function run(): void
    {
        $hub = Hub::where('hub_code', 'HUB-JAKTIM-HALIM')->firstOrFail();

        $orders = [
            [
                'order_number' => '100024000012',
                'current_courier_code' => 'HLM-VAN-02',
                'service_type' => 'Cargo',
                'category' => 'Peralatan Pabrik',
                'weight_kg' => 186.80,
                'recipient_name' => 'PT Sentosa Abadi',
                'recipient_phone' => '081298765401',
                'destination_address' => 'Jl. Pondok Kopi Raya No. 12',
                'destination_district' => 'Pondok Kopi',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2172,
                'drop_longitude' => 106.9248,
                'order_time' => now()->subHours(2),
                'pickup_time' => now()->subHours(1.5),
                'delivery_time_minutes' => 360,
                'sla_deadline' => now()->addMinutes(25),
                'weather_condition' => 'Cerah',
                'traffic_condition' => 'Macet Total',
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000009',
                'current_courier_code' => 'HLM-008',
                'service_type' => 'Frozen',
                'category' => 'Frozen Food & Daging',
                'weight_kg' => 4.50,
                'recipient_name' => 'Resto Daging Sedap',
                'recipient_phone' => '081298765402',
                'destination_address' => 'Jl. Condet Raya No. 18',
                'destination_district' => 'Kramat Jati',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2748,
                'drop_longitude' => 106.8870,
                'order_time' => now()->subHours(1),
                'pickup_time' => now()->subMinutes(30),
                'delivery_time_minutes' => 180,
                'sla_deadline' => now()->addMinutes(12),
                'weather_condition' => 'Berawan',
                'traffic_condition' => 'Padat',
                'temperature_c' => 6.2,
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000000',
                'current_courier_code' => 'STR-JKT-001',
                'service_type' => 'Same Day',
                'category' => 'Snack & Makanan',
                'weight_kg' => 1.40,
                'recipient_name' => 'Ibu Ratna',
                'recipient_phone' => '081298765403',
                'destination_address' => 'Jl. Gatot Subroto Kav. 22, Kramat Jati',
                'destination_district' => 'Kramat Jati',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2610,
                'drop_longitude' => 106.8695,
                'order_time' => now()->subHours(3),
                'pickup_time' => now()->subHours(2.5),
                'delivery_time_minutes' => 240,
                'sla_deadline' => now()->addMinutes(18),
                'weather_condition' => 'Cerah',
                'traffic_condition' => 'Sedang',
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000008',
                'current_courier_code' => 'STR-JKT-001',
                'service_type' => 'Instant',
                'category' => 'Dokumen Mendesak',
                'weight_kg' => 0.80,
                'recipient_name' => 'Bpk. Hendra',
                'recipient_phone' => '081298765404',
                'destination_address' => 'Jl. Ir. H. Djuanda No. 120, Cawang',
                'destination_district' => 'Cawang',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2432,
                'drop_longitude' => 106.8640,
                'order_time' => now()->subHours(1),
                'pickup_time' => now()->subMinutes(45),
                'delivery_time_minutes' => 120,
                'sla_deadline' => now()->addMinutes(12),
                'weather_condition' => 'Hujan lebat',
                'traffic_condition' => 'macet',
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000108',
                'current_courier_code' => 'HLM-008',
                'service_type' => 'Frozen',
                'category' => 'Ikan Salmon Segar',
                'weight_kg' => 3.20,
                'recipient_name' => 'Ibu Maya',
                'recipient_phone' => '081298765405',
                'destination_address' => 'Jl. Cipinang Muara No. 42',
                'destination_district' => 'Cipinang Muara',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2318,
                'drop_longitude' => 106.9015,
                'order_time' => now()->subHours(2),
                'pickup_time' => now()->subHours(1.5),
                'delivery_time_minutes' => 240,
                'sla_deadline' => now()->addMinutes(14),
                'weather_condition' => 'Cerah',
                'traffic_condition' => 'Lancar',
                'temperature_c' => 3.8,
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000254',
                'current_courier_code' => 'HLM-009',
                'service_type' => 'Same Day',
                'category' => 'Pakaian & Mode',
                'weight_kg' => 1.90,
                'recipient_name' => 'Sdri. Cindy',
                'recipient_phone' => '081298765406',
                'destination_address' => 'Jl. Buaran Raya No. 88',
                'destination_district' => 'Duren Sawit',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2215,
                'drop_longitude' => 106.9088,
                'order_time' => now()->subHours(4),
                'pickup_time' => now()->subHours(3.5),
                'delivery_time_minutes' => 360,
                'sla_deadline' => now()->addMinutes(18),
                'weather_condition' => 'Hujan Ringan',
                'traffic_condition' => 'Sedang',
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000411',
                'current_courier_code' => 'STR-JKT-001',
                'service_type' => 'PHARMA',
                'category' => 'Vaksin & Obat Resep',
                'weight_kg' => 2.10,
                'recipient_name' => 'RS Islam Jakarta Timur',
                'recipient_phone' => '081298765407',
                'destination_address' => 'Jl. Jatinegara Barat No. 126',
                'destination_district' => 'Jatinegara',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2488,
                'drop_longitude' => 106.9012,
                'order_time' => now()->subHours(3),
                'pickup_time' => now()->subHours(2.5),
                'delivery_time_minutes' => 360,
                'sla_deadline' => now()->addMinutes(24),
                'weather_condition' => 'Berawan',
                'traffic_condition' => 'Cawang Padat',
                'temperature_c' => 18.5,
                'delivery_status' => 'IN_TRANSIT',
            ],
            [
                'order_number' => '100024000529',
                'current_courier_code' => 'HLM-004',
                'service_type' => 'Cargo',
                'category' => 'Elektronik Rumah Tangga',
                'weight_kg' => 75.00,
                'recipient_name' => 'Toko Jaya Makmur',
                'recipient_phone' => '081298765408',
                'destination_address' => 'Jl. Pondok Kopi Raya No. 12',
                'destination_district' => 'Pondok Kopi',
                'destination_city' => 'Jakarta Timur',
                'drop_latitude' => -6.2172,
                'drop_longitude' => 106.9248,
                'order_time' => now()->subHours(5),
                'pickup_time' => now()->subHours(4.5),
                'delivery_time_minutes' => 480,
                'sla_deadline' => now()->addMinutes(45),
                'weather_condition' => 'Normal Cerah',
                'traffic_condition' => 'Lancar',
                'delivery_status' => 'IN_TRANSIT',
            ],
        ];

        foreach ($orders as $orderData) {
            $courierCode = $orderData['current_courier_code'];
            unset($orderData['current_courier_code']);

            $courier = Courier::where('courier_code', $courierCode)->first();

            Order::updateOrCreate(
                ['order_number' => $orderData['order_number']],
                array_merge($orderData, [
                    'hub_origin_id' => $hub->id,
                    'current_courier_id' => $courier?->id,
                ])
            );
        }
    }
}
