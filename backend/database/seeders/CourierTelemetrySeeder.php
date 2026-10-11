<?php

namespace Database\Seeders;

use App\Models\Courier;
use App\Models\CourierTelemetry;
use App\Support\CourierRoute;
use Illuminate\Database\Seeder;

class CourierTelemetrySeeder extends Seeder
{
    public function run(): void
    {
        $hub = \App\Models\Hub::where('hub_code', 'HUB-JAKTIM-HALIM')->firstOrFail();
        $hubLat = (float) $hub->latitude;
        $hubLng = (float) $hub->longitude;

        $online = [
            'HLM-001'     => ['speed' => 45.0, 'battery' => 92, 'temperature' => 3.1],
            'HLM-004'     => ['speed' => 40.0, 'battery' => 85, 'temperature' => 2.4],
            'HLM-008'     => ['speed' => 36.0, 'battery' => 74, 'temperature' => 6.2],
        ];

        $idle = [
            'HLM-010'     => ['speed' => 30.0, 'battery' => 48, 'idle' => now()->subMinutes(8)],
            'HLM-005'     => ['speed' => 30.0, 'battery' => 61, 'idle' => now()->subMinutes(23)],
            'HLM-009'     => ['speed' => 44.0, 'battery' => 65, 'idle' => now()->subMinutes(47)],
            'HLM-011'     => ['speed' => 42.0, 'battery' => 77, 'idle' => now()->subHour()->subMinutes(4)],
            'HLM-002'     => ['speed' => 34.0, 'battery' => 55, 'idle' => now()->subHours(2)->subMinutes(12)],
            'HLM-003'     => ['speed' => 36.0, 'battery' => 39, 'idle' => now()->subHours(5)->subMinutes(36)],
            'HLM-007'     => ['speed' => 38.0, 'battery' => 58, 'idle' => now()->subMinutes(38)],
        ];

        foreach ($online as $code => $data) {
            $courier = Courier::where('courier_code', $code)->first();
            if (! $courier) {
                continue;
            }

            [$lat, $lng] = CourierRoute::loop($code, $hubLat, $hubLng)[0];

            $this->put($courier, [
                'latitude' => round($lat, 7),
                'longitude' => round($lng, 7),
                'speed_kmh' => $data['speed'],
                'temperature_c' => $data['temperature'],
                'battery_level' => $data['battery'],
                'recorded_at' => now(),
            ]);
        }

        foreach ($idle as $code => $data) {
            $courier = Courier::where('courier_code', $code)->first();
            if (! $courier) {
                continue;
            }

            [$lat, $lng] = CourierRoute::loop($code, $hubLat, $hubLng)[0];

            $this->put($courier, [
                'latitude' => round($lat, 7),
                'longitude' => round($lng, 7),
                'speed_kmh' => $data['speed'],
                'temperature_c' => null,
                'battery_level' => $data['battery'],
                'recorded_at' => $data['idle'],
            ]);
        }
    }

    private function put(Courier $courier, array $data): void
    {
        CourierTelemetry::where('courier_id', $courier->id)->delete();

        CourierTelemetry::create(array_merge($data, [
            'courier_id' => $courier->id,
        ]));
    }
}