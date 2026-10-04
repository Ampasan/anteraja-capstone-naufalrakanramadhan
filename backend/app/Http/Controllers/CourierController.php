<?php

namespace App\Http\Controllers;

use App\Models\Courier;
use App\Models\CourierTelemetry;
use App\Models\Order;
use App\Services\Courier\CourierReplacementService;
use App\Services\Courier\CourierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourierController extends Controller
{
    public function __construct(
        private CourierService $courierService,
        private CourierReplacementService $replacementService
    ) {}

    /**
     * GET /api/couriers
     * Ambil semua kurir untuk hub tertentu (untuk live monitoring map).
     */
    public function index(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;

        $couriers = $this->courierService->getCouriersByHub($hubId);

        $online = 0;
        $idle = 0;

        foreach ($couriers as $courier) {
            if ($courier['status'] === 'ONLINE') {
                $online++;
            } elseif ($courier['status'] === 'IDLE') {
                $idle++;
            }
        }

        return $this->success([
            'couriers' => $couriers,
            'total' => count($couriers),
            'online' => $online,
            'idle' => $idle,
        ]);
    }

    /**
     * GET /api/couriers/{id}
     * Detail kurir beserta paket aktif.
     */
    public function show(string $id): JsonResponse
    {
        $courier = $this->courierService->getCourierDetail($id);

        if (!$courier) {
            return $this->error('Kurir tidak ditemukan', 404);
        }

        return $this->success($courier);
    }

    /**
     * GET /api/couriers/candidates?exclude_id=&order_id=
     * Kandidat kurir pengganti untuk satu insiden.
     */
    public function candidates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'exclude_id' => 'required|string',
            'order_id' => 'nullable|string',
            'weight_kg' => 'nullable|numeric|min:0',
        ]);

        $hubId = $request->user()->hub_id;

        $order = null;
        if (!empty($validated['order_id'])) {
            $order = Order::find($validated['order_id']);

            if ($order === null) {
                return $this->error('Order tidak ditemukan.', 422);
            }
        }

        $weightKg = (float) ($validated['weight_kg'] ?? $order?->weight_kg ?? 0);

        $excludeIds = [$validated['exclude_id']];
        if ($order?->current_courier_id) {
            $excludeIds[] = $order->current_courier_id;
        }
        
        $from = null;
        if ($order?->current_courier_id) {
            $telemetry = CourierTelemetry::query()
                ->where('courier_id', $order->current_courier_id)
                ->orderByDesc('recorded_at')
                ->first();

            if ($telemetry) {
                $from = [
                    'lat' => (float) $telemetry->latitude,
                    'lng' => (float) $telemetry->longitude,
                ];
            }
        }

        $candidates = $this->replacementService->getReplacementCandidates(
            $hubId,
            $excludeIds,
            $weightKg,
            $order,
            $from
        );

        return $this->success([
            'candidates' => $candidates,
            'total' => count($candidates),
            'is_recommended' => count($candidates) > 0,
            'note' => count($candidates) === 0
                ? 'Tidak ada kurir ideal. Pilih manual atau tunggu beban kurir berkurang.'
                : null,
        ]);
    }

    /**
     * POST /api/couriers/{id}/telemetry
     * Update posisi kurir (dipanggil dari tracking device).
     */
    public function updateTelemetry(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric|between:-90,90',
            'longitude' => 'required|numeric|between:-180,180',
            'speed_kmh' => 'nullable|numeric|min:0',
            'temperature_c' => 'nullable|numeric',
            'battery_level' => 'nullable|integer|between:0,100',
        ]);

        // Courir diload dulu agar id palsu menghasilkan 404 (bukan pelanggaran FK)
        $courier = Courier::findOrFail($id);

        $this->courierService->updateTelemetry($courier, $validated);

        return $this->success(null, 'Telemetri berhasil diupdate');
    }
}