<?php

namespace App\Http\Controllers;

use App\Services\Order\SlaRiskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(
        private SlaRiskService $slaRiskService
    ) {}

    /**
     * GET /api/orders/sla-risk
     * Ambil semua order dengan SLA risk untuk panel risiko.
     */
    public function slaRisk(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;

        $orders = $this->slaRiskService->getSlaRiskOrders($hubId);
        $summary = $this->slaRiskService->getSlaSummary($hubId);

        return $this->success([
            'orders' => $orders,
            'summary' => $summary,
        ]);
    }
}
