<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * Pengalihan 1-klik berhasil dieksekusi (PRD F-03 / FRD-03 F-03.1).
 *
 * Dipakai frontend untuk memperbarui daftar insiden dan peta kurir secara
 * langsung tanpa harus memuat ulang halaman.
 *
 * Dikirim lewat antrean agar endpoint reassign tetap kembali < 1 detik.
 */
class ReassignmentCompleted implements ShouldBroadcast
{
    public function __construct(
        public string $hubId,
        public string $incidentId,
        public string $incidentCode,
        public string $waybill,
        public array $originalCourier,
        public array $replacementCourier,
        public string $confirmationCode,
    ) {}

    public function broadcastOn(): array
    {
        return [new Channel('hub.' . $this->hubId)];
    }

    public function broadcastAs(): string
    {
        return 'incident.reassigned';
    }

    public function broadcastWith(): array
    {
        return [
            'incident_id' => $this->incidentId,
            'incident_code' => $this->incidentCode,
            'waybill_number' => $this->waybill,
            'original_courier' => $this->originalCourier,
            'replacement_courier' => $this->replacementCourier,
            'confirmation_code' => $this->confirmationCode,
            'status' => 'RESOLVED',
        ];
    }
}
