<?php

namespace App\Http\Controllers;

use App\Services\Order\RiskRankingService;
use App\Services\Order\SlaRiskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private SlaRiskService $slaRiskService,
        private RiskRankingService $riskRanking,
    ) {}

    /**
     * GET /api/orders/sla-risk
     * Kiriman ber-SLA-risk untuk peta dan panel risiko.
     */
    public function slaRisk(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;
        $panelScope = $request->query('scope') === 'panel';

        $orders = $this->slaRiskService->getSlaRiskOrders($hubId, $panelScope);
        $summary = $this->slaRiskService->getSlaSummary($hubId, $panelScope);

        return $this->success([
            'orders' => $orders,
            'summary' => $summary,
        ]);
    }

    /**
     * GET /api/risiko/teratas
     * 10 resi berisiko tertinggi dari papan peringkat Redis.
     */
    public function topRisk(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;
        $limit = min(50, max(1, (int) $request->query('limit', 10)));

        $ranking = $this->riskRanking->top($hubId, $limit);
        $resis = array_column($ranking, 'resi');
        $details = $this->riskRanking->detailsFor($hubId, $resis);

        return $this->success([
            'ranking' => $ranking,
            'orders' => $details,
        ]);
    }

    /**
     * GET /api/tugas/tabel
     * Tabel tugas aktif dengan server-side processing.
     */
    public function tugasTabel(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;
        $result = $this->slaRiskService->tugasTabel($hubId, $request->all());

        return $this->success($result);
    }
}