<?php

namespace Database\Seeders;

use App\Models\Hub;
use Illuminate\Database\Seeder;

class HubSeeder extends Seeder
{
    /**
     * Seed 5 hub Anteraja.
     * Hub utama proyek: Hub Halim - Jakarta Timur.
     *
     * Nama mengikuti pola "Hub <Wilayah> - <Kota>" yang dipakai seluruh
     * dropdown hub dan bar atas panel — sebelumnya hub utama memakai nama
     * berbeda ("ANTERAJA HUB HALIM") sehingga tampilannya tidak konsisten.
     */
    public function run(): void
    {
        $hubs = [
            [
                'hub_code' => 'HUB-JAKTIM-HALIM',
                'hub_name' => 'Hub Halim - Jakarta Timur',
                'city' => 'Jakarta Timur',
                'latitude' => -6.2651893,
                'longitude' => 106.8767953,
                'service_radius_km' => 5.0,
                'max_capacity_parcels' => 2850,
                'current_parcels_count' => 2410,
            ],
            [
                'hub_code' => 'HUB-BDG-BATUNUNGGAL',
                'hub_name' => 'Hub Batununggal - Bandung',
                'city' => 'Bandung',
                'latitude' => -6.9538120,
                'longitude' => 107.6274190,
                'service_radius_km' => 4.0,
                'max_capacity_parcels' => 2500,
                'current_parcels_count' => 1820,
            ],
            [
                'hub_code' => 'HUB-BKS-HARAPANINDAH',
                'hub_name' => 'Hub Harapan Indah - Bekasi',
                'city' => 'Bekasi',
                'latitude' => -6.1802150,
                'longitude' => 106.9842110,
                'service_radius_km' => 7.0,
                'max_capacity_parcels' => 2200,
                'current_parcels_count' => 1450,
            ],
            [
                'hub_code' => 'HUB-JAKBAR-KEBONJERUK',
                'hub_name' => 'Hub Kebon Jeruk - Jakarta Barat',
                'city' => 'Jakarta Barat',
                'latitude' => -6.1895120,
                'longitude' => 106.7699410,
                'service_radius_km' => 5.0,
                'max_capacity_parcels' => 3000,
                'current_parcels_count' => 2600,
            ],
            [
                'hub_code' => 'HUB-JAKUT-SUNTER',
                'hub_name' => 'Hub Sunter - Jakarta Utara',
                'city' => 'Jakarta Utara',
                'latitude' => -6.1384720,
                'longitude' => 106.8654190,
                'service_radius_km' => 6.0,
                'max_capacity_parcels' => 2400,
                'current_parcels_count' => 1900,
            ],
        ];

        foreach ($hubs as $hub) {
            Hub::updateOrCreate(
                ['hub_code' => $hub['hub_code']],
                $hub
            );
        }
    }
}
