<?php

namespace App\Console\Commands;

use App\Models\Hub;
use App\Services\Incident\IncidentService;
use Database\Seeders\OrderSeeder;
use Illuminate\Console\Command;

/**
 * Peremajaan jendela waktu SLA.
 */
class RefreshSlaWindows extends Command
{
    protected $signature = 'sla:refresh';

    protected $description = 'Segarkan jendela waktu SLA supaya sisa SLA & skor risiko sesuai keadaan terkini';

    public function handle(OrderSeeder $seeder): int
    {
        $refreshed = $seeder->refreshWindows();

        foreach (Hub::query()->pluck('id') as $hubId) {
            IncidentService::clearPanelCache($hubId);
        }

        $this->info("Jendela SLA {$refreshed} order disegarkan.");

        return self::SUCCESS;
    }
}