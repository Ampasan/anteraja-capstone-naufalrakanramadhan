<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\Hub;
use Illuminate\Database\Seeder;

class CourierSeeder extends Seeder
{
    /**
     * Seed 10 kurir untuk Hub Halim.
     * Status: 3 ONLINE, 5 IDLE, 2 OFFLINE (tidak ditampilkan di frontend).
     */
    public function run(): void
    {
        $hub = Hub::where('hub_code', 'HUB-JAKTIM-HALIM')->firstOrFail();

        $couriers = [
            [
                'courier_code' => 'STR-JKT-001',
                'name' => 'Budi Santoso',
                'phone_number' => '081234567801',
                'license_plate' => 'B 3481 HLM',
                'vehicle_type' => 'Motorcycle',
                'status' => 'ONLINE',
                'current_parcel_count' => 12,
                'max_parcel_count' => 20,
                'current_load_kg' => 24.50,
                'max_capacity_kg' => 50.00,
                'current_address' => 'Jl. Cililitan Besar No. 5, Kramat Jati, Jakarta Timur',
                'is_bpom_certified' => true,
                'has_thermal_box' => true,
            ],
            [
                'courier_code' => 'HLM-VAN-02',
                'name' => 'Teguh Wibowo',
                'phone_number' => '081234567802',
                'license_plate' => 'B 9281 HLM',
                'vehicle_type' => 'Truk',
                'status' => 'IDLE',
                'current_parcel_count' => 5,
                'max_parcel_count' => 20,
                'current_load_kg' => 186.80,
                'max_capacity_kg' => 2000.00,
                'current_address' => 'Jl. Pondok Kopi Raya No. 12, Pondok Kopi, Jakarta Timur',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'HLM-004',
                'name' => 'Fajar Ramadhan',
                'phone_number' => '081234567803',
                'license_plate' => 'B 9282 HLM',
                'vehicle_type' => 'Van',
                'status' => 'ONLINE',
                'current_parcel_count' => 8,
                'max_parcel_count' => 20,
                'current_load_kg' => 400.00,
                'max_capacity_kg' => 1200.00,
                'current_address' => 'Jl. Halim Perdanakusuma No. 8, Makasar, Jakarta Timur',
                'is_bpom_certified' => true,
                'has_thermal_box' => true,
            ],
            [
                'courier_code' => 'HLM-005',
                'name' => 'Ahmad Fauzi',
                'phone_number' => '081234567804',
                'license_plate' => 'B 9112 HLM',
                'vehicle_type' => 'Truk Box',
                'status' => 'IDLE',
                'current_parcel_count' => 4,
                'max_parcel_count' => 20,
                'current_load_kg' => 500.00,
                'max_capacity_kg' => 2000.00,
                'current_address' => 'Jl. Condet Raya No. 30, Kramat Jati, Jakarta Timur',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'HLM-008',
                'name' => 'Rizky Pratama',
                'phone_number' => '081234567805',
                'license_plate' => 'B 6214 HLM',
                'vehicle_type' => 'Motorcycle thermal box',
                'status' => 'ONLINE',
                'current_parcel_count' => 9,
                'max_parcel_count' => 20,
                'current_load_kg' => 18.20,
                'max_capacity_kg' => 40.00,
                'current_address' => 'Jl. Condet Raya No. 18, Kramat Jati, Jakarta Timur',
                'is_bpom_certified' => true,
                'has_thermal_box' => true,
            ],
            [
                'courier_code' => 'HLM-009',
                'name' => 'Rama Pratama',
                'phone_number' => '081234567806',
                'license_plate' => 'B 4118 HLM',
                'vehicle_type' => 'Motorcycle',
                'status' => 'IDLE',
                'current_parcel_count' => 9,
                'max_parcel_count' => 20,
                'current_load_kg' => 15.00,
                'max_capacity_kg' => 40.00,
                'current_address' => 'Jl. Jatinegara Kaum No. 88, Jatinegara, Jakarta Timur',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'HLM-002',
                'name' => 'Indra Gunawan',
                'phone_number' => '081234567807',
                'license_plate' => 'B 5512 HLM',
                'vehicle_type' => 'Blind Van',
                'status' => 'IDLE',
                'current_parcel_count' => 11,
                'max_parcel_count' => 20,
                'current_load_kg' => 35.00,
                'max_capacity_kg' => 800.00,
                'current_address' => 'Jl. Buaran Raya No. 14, Duren Sawit, Jakarta Timur',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'HLM-003',
                'name' => 'Eko Prasetyo',
                'phone_number' => '081234567808',
                'license_plate' => 'B 6719 HLM',
                'vehicle_type' => 'Pick Up Box',
                'status' => 'IDLE',
                'current_parcel_count' => 10,
                'max_parcel_count' => 20,
                'current_load_kg' => 45.00,
                'max_capacity_kg' => 1000.00,
                'current_address' => 'Jl. Kampung Melayu Besar No. 9, Tebet, Jakarta Selatan',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'STR-JKT-008',
                'name' => 'Andi Wijaya',
                'phone_number' => '081234567809',
                'license_plate' => 'B 1234 STR',
                'vehicle_type' => 'Motorcycle',
                'status' => 'IDLE',
                'current_parcel_count' => 3,
                'max_parcel_count' => 20,
                'current_load_kg' => 3.00,
                'max_capacity_kg' => 15.00,
                'current_address' => 'Jl. Ir. H. Djuanda, Cawang, Jakarta Timur',
                'is_bpom_certified' => true,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'HLM-006',
                'name' => 'Dedi Kurniawan',
                'phone_number' => '081234567810',
                'license_plate' => 'B 7788 HLM',
                'vehicle_type' => 'Motorcycle',
                'status' => 'OFFLINE',
                'current_parcel_count' => 0,
                'max_parcel_count' => 20,
                'current_load_kg' => 0.00,
                'max_capacity_kg' => 50.00,
                'current_address' => 'Jl. Raya Bekasi No. 100, Jakarta Timur',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
            [
                'courier_code' => 'HLM-007',
                'name' => 'Bayu Nugroho',
                'phone_number' => '081234567811',
                'license_plate' => 'B 9900 HLM',
                'vehicle_type' => 'Motorcycle',
                'status' => 'OFFLINE',
                'current_parcel_count' => 0,
                'max_parcel_count' => 20,
                'current_load_kg' => 0.00,
                'max_capacity_kg' => 50.00,
                'current_address' => 'Jl. Pendidikan No. 20, Jakarta Timur',
                'is_bpom_certified' => false,
                'has_thermal_box' => false,
            ],
        ];

        foreach ($couriers as $courier) {
            Courier::updateOrCreate(
                ['courier_code' => $courier['courier_code']],
                array_merge($courier, ['hub_id' => $hub->id])
            );
        }
    }
}
