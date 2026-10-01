<?php

namespace App\Http\Controllers;

use App\Models\Hub;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/dashboard/summary
     * Ringkasan data untuk dashboard.
     *
     * OPTIMASI: seluruh ringkasan (hub + 6 angka) diambil dalam 1 query saja.
     * Sebelumnya 7 query terpisah; karena tiap query butuh ~200ms round-trip
     * ke Supabase, 1 query menghemat ~1.2 detik.
     * Hasil di-cache 10 detik dan dihapus saat ada perubahan data.
     */
    public function summary(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;

        $summary = Cache::remember("dashboard_summary_{$hubId}", 30, function () use ($hubId) {
            $sql = 'select h.id, h.hub_name, h.city, h.current_parcels_count, h.max_capacity_parcels, '
                . '(select count(*) from couriers c where c.hub_id = h.id) as courier_total, '
                . "(select count(*) from couriers c where c.hub_id = h.id and c.status = 'ONLINE') as courier_online, "
                . "(select count(*) from couriers c where c.hub_id = h.id and c.status = 'IDLE') as courier_idle, "
                . "(select count(*) from orders o where o.hub_origin_id = h.id and o.delivery_status not in ('DELIVERED', 'RETURNED')) as order_active, "
                . "(select count(*) from orders o where o.hub_origin_id = h.id and o.delivery_status not in ('DELIVERED', 'RETURNED') and o.sla_deadline < ?) as order_critical, "
                . "(select count(*) from incident_reports ir join orders o on o.id = ir.order_id "
                . "  where o.hub_origin_id = h.id and ir.status in ('REPORTED', 'ACKNOWLEDGED', 'REASSIGNING')) as incident_open "
                . 'from hubs h where h.id = ?';

            $row = DB::selectOne($sql, [now()->addMinutes(30)->toDateTimeString(), $hubId]);

            if (!$row) {
                return null;
            }

            return [
                'hub' => [
                    'id' => $row->id,
                    'name' => $row->hub_name,
                    'city' => $row->city,
                    'capacity_used' => $row->current_parcels_count,
                    'capacity_total' => $row->max_capacity_parcels,
                ],
                'couriers' => [
                    'total' => (int) $row->courier_total,
                    'online' => (int) $row->courier_online,
                    'idle' => (int) $row->courier_idle,
                ],
                'orders' => [
                    'active' => (int) $row->order_active,
                    'critical' => (int) $row->order_critical,
                ],
                'incidents' => [
                    'open' => (int) $row->incident_open,
                ],
            ];
        });

        if (!$summary) {
            return $this->error('Hub tidak ditemukan', 404);
        }

        return $this->success($summary);
    }

    /**
     * GET /api/hubs
     * Ambil semua hub untuk dropdown di login.
     */
    public function hubs(): JsonResponse
    {
        $hubs = Hub::all()->map(fn (Hub $hub) => [
            'id' => $hub->id,
            'name' => $hub->hub_name,
            'short_name' => $this->getShortName($hub->hub_name),
            'city' => $hub->city,
            'position' => [
                'lat' => (float) $hub->latitude,
                'lng' => (float) $hub->longitude,
            ],
            'radius_km' => (float) $hub->service_radius_km,
            'capacity_used' => $hub->current_parcels_count,
            'capacity_total' => $hub->max_capacity_parcels,
        ]);

        return $this->success(['hubs' => $hubs]);
    }

    /**
     * Generate short name dari nama hub.
     */
    private function getShortName(string $name): string
    {
        // "ANTERAJA HUB HALIM" -> "HUB HALIM"
        if (str_contains($name, 'HUB')) {
            $parts = explode(' ', $name);
            $hubIndex = array_search('HUB', $parts);
            if ($hubIndex !== false) {
                return implode(' ', array_slice($parts, $hubIndex));
            }
        }
        return $name;
    }
}
