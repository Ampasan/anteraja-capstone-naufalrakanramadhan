<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * Titik posisi kurir terbaru (PRD F-01 Live Monitoring Map).
 *
 * Dipanggil setiap kali perangkat kurir mengirim telemetri, sehingga pin di
 * peta bergerak real-time tanpa polling. Payload hanya berisi id, koordinat,
 * dan status sehingga ukurannya kecil.
 *
 * Sengaja memakai antrean: telemetri datang berkali-kali per menit dan
 * POST /couriers/{id}/telemetry wajib tetap di bawah 1 detik.
 */
class CourierTelemetryUpdated implements ShouldBroadcast
{
    public function __construct(
        public string $hubId,
        public array $telemetry,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('hub.' . $this->hubId)];
    }

    public function broadcastAs(): string
    {
        return 'courier.telemetry';
    }

    public function broadcastWith(): array
    {
        return ['courier' => $this->telemetry];
    }
}
