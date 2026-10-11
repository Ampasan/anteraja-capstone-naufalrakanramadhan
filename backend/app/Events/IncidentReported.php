<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * Insiden baru masuk dari kurir SATRIA
 */
class IncidentReported implements ShouldBroadcast
{
    public function __construct(
        public string $hubId,
        public array $incident,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('hub.' . $this->hubId)];
    }

    public function broadcastAs(): string
    {
        return 'incident.reported';
    }

    public function broadcastWith(): array
    {
        return ['incident' => $this->incident];
    }
}