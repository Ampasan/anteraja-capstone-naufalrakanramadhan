<?php

namespace App\Jobs;

use App\Models\ReassignmentConfirmation;
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
        public array $courierData
    ) {}

    /**
     * Kirim notifikasi ke kurir pengganti.
     * Job ini dijalankan async oleh queue worker.
     */
    public function handle(): void
    {
        try {
            // Simulasi kirim notifikasi (push notification / SMS / WhatsApp)
            // Di produksi, ini bisa diganti dengan integrasi FCM, Twilio, dll.

            Log::info('NotifikasiPengalihan dikirim', [
                'confirmation_code' => $this->confirmation->confirmation_code,
                'courier_name' => $this->courierData['name'],
                'courier_phone' => $this->courierData['phone'] ?? null,
                'order_number' => $this->confirmation->order->order_number,
            ]);

            // TODO: Integrasi dengan push notification service
            // Contoh: FCM, OneSignal, atau WhatsApp Business API

        } catch (\Exception $e) {
            Log::error('Gagal kirim notifikasi pengalihan', [
                'confirmation_code' => $this->confirmation->confirmation_code,
                'error' => $e->getMessage(),
            ]);

            // Retry job jika gagal
            throw $e;
        }
    }

    /**
     * Handle job yang gagal setelah retry habis.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Job NotifikasiPengalihan gagal permanen', [
            'confirmation_code' => $this->confirmation->confirmation_code,
            'error' => $exception->getMessage(),
        ]);
    }
}
