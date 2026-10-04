<?php

namespace App\Jobs;

use App\Models\ReassignmentConfirmation;
use App\Services\Async\TaskTracker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class NotifikasiPengalihan implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public ReassignmentConfirmation $confirmation,
        public array $courierData,
        public ?string $taskId = null
    ) {}

    /**
     * Kirim notifikasi ke kurir pengganti.
     * Job ini dijalankan async oleh queue worker.
     */
    public function handle(): void
    {
        try {
            if ($this->taskId) {
                TaskTracker::update($this->taskId, 'processing', 'Notifikasi sedang dikirim ke kurir pengganti.');
            }

            Log::info('NotifikasiPengalihan dikirim', [
                'confirmation_code' => $this->confirmation->confirmation_code,
                'courier_name' => $this->courierData['name'],
                'courier_phone' => $this->courierData['phone'] ?? null,
                'order_number' => $this->confirmation->order->order_number,
            ]);

            if ($this->taskId) {
                TaskTracker::update(
                    $this->taskId,
                    'completed',
                    'Notifikasi berhasil dikirim ke kurir pengganti.',
                    ['courier' => $this->courierData['name'] ?? null]
                );
            }

        } catch (\Exception $e) {
            if ($this->taskId) {
                TaskTracker::update($this->taskId, 'failed', 'Notifikasi gagal dikirim: ' . $e->getMessage());
            }

            Log::error('Gagal kirim notifikasi pengalihan', [
                'confirmation_code' => $this->confirmation->confirmation_code,
                'error' => $e->getMessage(),
            ]);

            // Retry job jika gagal
            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        if ($this->taskId) {
            TaskTracker::update($this->taskId, 'failed', 'Notifikasi gagal permanen setelah percobaan berulang.');
        }

        Log::error('Job NotifikasiPengalihan gagal permanen', [
            'confirmation_code' => $this->confirmation->confirmation_code,
            'error' => $exception->getMessage(),
        ]);
    }
}