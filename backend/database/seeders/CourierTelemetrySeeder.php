<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\CourierTelemetry;
use Illuminate\Database\Seeder;

class CourierTelemetrySeeder extends Seeder
{
    /**
     * Seed data telemetri untuk kurir yang online/idle.
     * Data ini dipakai untuk live tracking map.
     */
    public function run(): void
    {
        $telemetries = [
            [
                'courier_code' => 'STR-JKT-001',
                'latitude' => -6.2678,
                'longitude' => 106.8812,
                'speed_kmh' => 22.50,
                'temperature_c' => null,
                'battery_level' => 92,
            ],
            [
                'courier_code' => 'HLM-VAN-02',
                'latitude' => -6.2172,
                'longitude' => 106.9248,
                'speed_kmh' => 0.00,
                'temperature_c' => null,
                'battery_level' => 48,
            ],
            [
                'courier_code' => 'HLM-004',
                'latitude' => -6.2622,
                'longitude' => 106.8802,
                'speed_kmh' => 31.00,
                'temperature_c' => null,
                'battery_level' => 85,
            ],
            [
                'courier_code' => 'HLM-008',
                'latitude' => -6.2712,
                'longitude' => 106.8838,
                'speed_kmh' => 18.00,
                'temperature_c' => 6.2,
                'battery_level' => 74,
            ],
            [
                'courier_code' => 'HLM-009',
                'latitude' => -6.2598,
                'longitude' => 106.8730,
                'speed_kmh' => 0.00,
                'temperature_c' => null,
                'battery_level' => 65,
            ],
        ];

        foreach ($telemetries as $telemetry) {
            $courier = Courier::where('courier_code', $telemetry['courier_code'])->first();
            if ($courier) {
                CourierTelemetry::create([
                    'courier_id' => $courier->id,
                    'latitude' => $telemetry['latitude'],
                    'longitude' => $telemetry['longitude'],
                    'speed_kmh' => $telemetry['speed_kmh'],
                    'temperature_c' => $telemetry['temperature_c'],
                    'battery_level' => $telemetry['battery_level'],
                    'recorded_at' => now(),
                ]);
            }
        }
    }
}
