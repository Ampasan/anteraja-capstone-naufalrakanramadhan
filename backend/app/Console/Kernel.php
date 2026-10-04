<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule->command('report:daily-incidents')
            ->dailyAt('08:00')
            ->timezone('Asia/Jakarta');

        $schedule->command('incident:escalate')
            ->everyMinute()
            ->timezone('Asia/Jakarta');

        $schedule->command('risk:rebuild')
            ->everyMinute()
            ->timezone('Asia/Jakarta');

        $schedule->command('sla:refresh')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->timezone('Asia/Jakarta');

        $schedule->command('courier:simulate')
            ->everyFiveSeconds()
            ->timezone('Asia/Jakarta');

        $schedule->command('cache:warm')
            ->everyTenSeconds()
            ->withoutOverlapping()
            ->timezone('Asia/Jakarta');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}