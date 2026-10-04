<?php

namespace App\Console\Commands;

use App\Models\Courier;
use App\Support\CourierRoute;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SimulateCourierPositions extends Command
{
    /**
     * @var string
     */
    protected $signature = 'courier:simulate';

    /**
     * @var string
     */
    protected $description = 'Majukan posisi kurir ONLINE dan IDLE di sepanjang lintasannya (live monitoring)';

    public function handle(): int
    {
        $couriers = Courier::query()
            ->with(['latestTelemetry', 'hub'])
            ->whereIn('status', ['ONLINE', 'IDLE'])
            ->get()
            ->filter(fn (Courier $courier) => $courier->latestTelemetry !== null && $courier->hub !== null);

        $moved = 0;
        $updates = [];
        $stamp = now();

        foreach ($couriers as $courier) {
            $telemetry = $courier->latestTelemetry;
            $hub = $courier->hub;

            $loop = CourierRoute::loop(
                $courier->courier_code,
                (float) $hub->latitude,
                (float) $hub->longitude,
            );

            $elapsedSeconds = max(0, now()->timestamp - $telemetry->created_at->timestamp);
            $speedKmh = max(0.0, (float) $telemetry->speed_kmh);
            $travelled = $elapsedSeconds * ($speedKmh / 3.6);

            [$latitude, $longitude] = CourierRoute::at($loop, $travelled);

            $updates[] = [
                'id' => $telemetry->id,
                'latitude' => round($latitude, 7),
                'longitude' => round($longitude, 7),
                'speed_kmh' => $speedKmh,
            ];

            $moved++;
        }

        if ($updates !== []) {
            $this->writePositions($updates, $stamp);
        }

        $this->info("Posisi {$moved} kurir diperbarui.");

        return self::SUCCESS;
    }

    /**
     * @param  array<int, array{id: string, latitude: float, longitude: float, speed_kmh: float}>  $updates
     * @param  \DateTimeInterface  $stamp  Waktu catat yang sama untuk semua baris.
     */
    private function writePositions(array $updates, $stamp): void
    {
        $sets = [];
        $bindings = [];

        foreach (['latitude', 'longitude', 'speed_kmh'] as $column) {
            $whens = '';

            foreach ($updates as $update) {
                $whens .= ' WHEN ? THEN ?';
                $bindings[] = $update['id'];
                $bindings[] = $update[$column];
            }

            $sets[] = "{$column} = CASE id{$whens} END";
        }

        $sets[] = 'recorded_at = ?';
        $bindings[] = $stamp;

        $ids = array_column($updates, 'id');
        $inList = implode(', ', array_fill(0, count($ids), '?'));

        DB::update(
            'UPDATE courier_telemetry SET ' . implode(', ', $sets) . " WHERE id IN ({$inList})",
            array_merge($bindings, $ids),
        );
    }
}