<?php

namespace App\Console\Commands;

use App\Services\AuditLog\AuditLogService;
use App\Services\Courier\CourierService;
use App\Services\Incident\IncidentService;
use App\Services\Order\SlaRiskService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class WarmReadCaches extends Command
{
    protected $signature = 'cache:warm';

    protected $description = 'Hangatkan cache daftar audit log, insiden, posisi kurir, ringkasan SLA, dan tabel tugas agar request user tidak menunggu query remote';

    public function handle(
        AuditLogService $auditLogs,
        IncidentService $incidents,
        CourierService $couriers,
        SlaRiskService $slaRisk,
    ): int {
        foreach ($this->activeHubIds() as $hubId) {
            try {
                Cache::forget("audit_logs_{$hubId}");
                $auditLogs->getAuditLogs($hubId);
                $auditLogs->getAuditSummary($hubId);

                Cache::forget("incidents_{$hubId}");
                $incidents->getIncidents($hubId);

                Cache::forget("couriers_{$hubId}");
                $couriers->getCouriersByHub($hubId);

                Cache::forget("sla_risk_orders_{$hubId}");
                $slaRisk->getSlaRiskOrders($hubId);
                Cache::forget("sla_risk_orders_{$hubId}_panel");
                $slaRisk->getSlaRiskOrders($hubId, panelScope: true);

                $tabelParams = ['page' => 1, 'per_page' => 8];
                Cache::forget(SlaRiskService::tugasTabelCacheKey($hubId, $tabelParams));
                $slaRisk->tugasTabel($hubId, $tabelParams);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return self::SUCCESS;
    }

    /**
     * @return array<int, string>
     */
    private function activeHubIds(): array
    {
        $candidates = Cache::get('active_hubs', []);

        if (! is_array($candidates) || $candidates === []) {
            return [];
        }

        $hubIds = array_values(array_filter($candidates, 'is_string'));

        if ($hubIds === []) {
            return [];
        }

        $flags = Cache::getMultiple(
            array_map(fn (string $hubId) => "active_hub:{$hubId}", $hubIds)
        );

        return array_values(array_filter(
            $hubIds,
            fn (string $hubId) => ! is_null($flags["active_hub:{$hubId}"] ?? null),
        ));
    }
}