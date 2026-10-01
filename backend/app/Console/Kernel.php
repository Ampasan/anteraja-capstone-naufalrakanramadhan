<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Definisi jadwal command (dijalankan oleh `php artisan schedule:work`
     * atau cron `php artisan schedule:run`).
     */
    protected function schedule(Schedule $schedule): void
    {
        // Laporan insiden harian (CSV) - jam 08:00 WIB setiap hari (FRD-04)
        $schedule->command('report:daily-incidents')
            ->dailyAt('08:00')
            ->timezone('Asia/Jakarta');

        // Eskalasi insiden REPORTED yang tidak ditanggapi > 10 menit
        // menjadi ESCALATED + alarm di dasbor (FRD-03 / BR-04).
        $schedule->command('incident:escalate')
            ->everyMinute()
            ->timezone('Asia/Jakarta');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
