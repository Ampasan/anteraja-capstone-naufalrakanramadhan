<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * Insiden REPORTED tidak ditanggapi
 */
class IncidentEscalated implements ShouldBroadcast
{
    public function __construct(
        public string $hubId,
        public array $incident,
        /** Berapa menit insiden tidak ditanggapi sebelum dieskalasi */
        public int $unacknowledgedMinutes,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('hub.' . $this->hubId)];
    }

    public function broadcastAs(): string
    {
        return 'incident.escalated';
    }

    public function broadcastWith(): array
    {
        return [
            'incident' => $this->incident,
            'unacknowledged_minutes' => $this->unacknowledgedMinutes,
            'severity' => 'CRITICAL',
        ];
    }
}