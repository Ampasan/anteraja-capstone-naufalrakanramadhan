<?php

namespace App\Console\Commands;

use App\Models\Hub;
use App\Services\Order\RiskRankingService;
use App\Services\Order\SlaRiskService;
use Illuminate\Console\Command;

class RebuildRiskRanking extends Command
{
    protected $signature = 'risk:rebuild {--hub= : Satu hub tertentu, default semua hub}';

    protected $description = 'Hitung ulang papan peringkat risiko SLA dari SQL ke sorted set Redis';

    public function __construct(
        private RiskRankingService $ranking,
        private SlaRiskService $slaRiskService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $hubIds = $this->option('hub')
            ? [$this->option('hub')]
            : Hub::query()->pluck('id')->all();

        $total = 0;
        foreach ($hubIds as $hubId) {
            $scores = $this->slaRiskService->riskScoresForRanking($hubId);
            $count = $this->ranking->rebuild($hubId, $scores);
            $total += $count;
            $this->info("Hub {$hubId}: {$count} resi masuk papan peringkat.");
        }

        $this->info("Total: {$total} resi.");

        return self::SUCCESS;
    }
}