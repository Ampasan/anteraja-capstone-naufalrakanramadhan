<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * Titik posisi kurir terbaru
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