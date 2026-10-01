<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

/**
 * Insiden baru masuk dari kurir SATRIA (PRD F-03 / FRD-03 F-03.2).
 *
 * Frontend berlangganan channel `hub.{hubId}` lewat Laravel Echo dan
 * memutar alarm audio + menampilkan pop-up saat event ini diterima.
 *
 * Dipakai ShouldBroadcast (antrean) — bukan ShouldBroadcastNow — supaya
 * request API tidak pernah menunggu HTTP POST ke server Reverb. Dengan
 * `php artisan queue:listen` berjalan, event terkirim dalam hitungan detik
 * (masih jauh di bawah batas 5 detik FRD) dan API tetap di bawah 1 detik
 * bahkan ketika Reverb sedang mati.
 */
class IncidentReported implements ShouldBroadcast
{
    public function __construct(
        public string $hubId,
        /** Array hasil format insiden, bentuknya sama dengan GET /api/incidents */
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
