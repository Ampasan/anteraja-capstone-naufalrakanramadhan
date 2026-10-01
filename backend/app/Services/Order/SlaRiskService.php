<?php

namespace App\Services\Order;

use App\Models\Hub;
use App\Models\Order;
use Illuminate\Support\Facades\Cache;

class SlaRiskService
{
    /**
     * Ambil semua order dengan SLA risk untuk panel risiko.
     * Data di-cache selama 10 detik untuk optimasi.
     * Cache di-clear saat ada reassignment.
     */
    public function getSlaRiskOrders(string $hubId): array
    {
        // Cache selama 10 detik untuk mengurangi beban database
        $cacheKey = "sla_risk_orders_{$hubId}";

        return Cache::remember($cacheKey, 10, function () use ($hubId) {
            // Optimasi: eager load hanya yang diperlukan, select kolom spesifik
            $orders = Order::query()
                ->select([
                    'id', 'order_number', 'service_type', 'weight_kg',
                    'destination_address', 'destination_district', 'destination_city',
                    'drop_latitude', 'drop_longitude', 'order_time', 'sla_deadline',
                    'weather_condition', 'traffic_condition', 'temperature_c',
                    'sla_risk_score', 'delivery_status', 'current_courier_id',
                    'hub_origin_id',
                ])
                ->with(['currentCourier:id,name,courier_code'])
                ->where('hub_origin_id', $hubId)
                ->whereNotIn('delivery_status', ['DELIVERED', 'RETURNED'])
                ->orderBy('sla_deadline', 'asc')
                ->get();

            // Semua order berasal dari hub yang sama, jadi ambil hub dari cache
            // (hemat 1 query) lalu tempel ke tiap order.
            $hub = Hub::cached($hubId);
            $orders->each(fn (Order $order) => $order->setRelation('hubOrigin', $hub));

            return $orders->map(fn (Order $order) => $this->formatSlaOrder($order))->toArray();
        });
    }

    /**
     * Format order untuk SLA risk panel.
     */
    private function formatSlaOrder(Order $order): array
    {
        $now = now();
        $slaDeadline = $order->sla_deadline;

        // Hitung sisa menit SLA (diffInMinutes() mengembalikan float di Laravel 11+)
        $remainingMinutes = (int) $now->diffInMinutes($slaDeadline, false);

        // Hitung persentase elapsed
        $totalMinutes = (int) $order->order_time->diffInMinutes($slaDeadline);
        $elapsedMinutes = $order->order_time->diffInMinutes($now);
        $elapsedPct = $totalMinutes > 0
            ? (int) min(100, round(($elapsedMinutes / $totalMinutes) * 100))
            : 0;

        // Tentukan risk level
        $riskLevel = $this->calculateRiskLevel($remainingMinutes, $order);

        // Format kondisi
        $condition = $this->formatCondition($order);

        return [
            'id' => $order->id,
            'waybill_number' => $order->order_number,
            'courier_id' => $order->current_courier_id,
            'courier_name' => $order->currentCourier?->name,
            'courier_code' => $order->currentCourier?->courier_code,
            'service_type' => $order->service_type,
            'weight_kg' => (float) $order->weight_kg,
            'sla_deadline' => $slaDeadline->toISOString(),
            'remaining_minutes' => $remainingMinutes,
            'elapsed_pct' => $elapsedPct,
            'risk_level' => $riskLevel,
            'risk_label' => $this->getRiskLabel($riskLevel),
            'risk_color' => $this->getRiskColor($riskLevel),
            'status' => $order->delivery_status,
            'origin_lat' => (float) $order->hubOrigin->latitude,
            'origin_lng' => (float) $order->hubOrigin->longitude,
            'drop_lat' => (float) $order->drop_latitude,
            'drop_lng' => (float) $order->drop_longitude,
            'destination_name' => $order->destination_address,
            'destination_area' => $order->destination_district . ', ' . $order->destination_city,
            'condition' => $condition,
            'weather_condition' => $order->weather_condition,
            'traffic_condition' => $order->traffic_condition,
            'temperature_c' => $order->temperature_c ? (float) $order->temperature_c : null,
            'sla_risk_score' => $order->sla_risk_score ? (float) $order->sla_risk_score : null,
        ];
    }

    /**
     * Hitung risk level berdasarkan sisa waktu SLA.
     */
    private function calculateRiskLevel(int $remainingMinutes, Order $order): string
    {
        if ($remainingMinutes < 0) {
            return 'Kritis';
        }

        // Factor tambahan: suhu, traffic, weather
        $riskScore = 0;

        if ($remainingMinutes < 15) {
            $riskScore += 3;
        } elseif ($remainingMinutes < 30) {
            $riskScore += 2;
        } elseif ($remainingMinutes < 60) {
            $riskScore += 1;
        }

        // Cold chain risk
        if ($order->service_type === 'Frozen' && $order->temperature_c > 5.0) {
            $riskScore += 2;
        }

        // Traffic risk
        if (in_array($order->traffic_condition, ['Macet Total', 'macet', 'Padat'])) {
            $riskScore += 1;
        }

        if ($riskScore >= 4) {
            return 'Kritis';
        } elseif ($riskScore >= 2) {
            return 'Waspada';
        }

        return 'Aman';
    }

    /**
     * Get risk label dalam bahasa Indonesia.
     */
    private function getRiskLabel(string $riskLevel): string
    {
        return match ($riskLevel) {
            'Kritis' => 'Sangat Tinggi',
            'Waspada' => 'Sedang',
            'Aman' => 'Rendah',
            default => 'Rendah',
        };
    }

    /**
     * Get risk color untuk UI.
     */
    private function getRiskColor(string $riskLevel): string
    {
        return match ($riskLevel) {
            'Kritis' => 'red',
            'Waspada' => 'amber',
            'Aman' => 'green',
            default => 'green',
        };
    }

    /**
     * Format kondisi order.
     */
    private function formatCondition(Order $order): array
    {
        $key = 'normal-sunny';
        $label = 'Normal Lancar';

        if ($order->service_type === 'Frozen' && $order->temperature_c !== null) {
            $key = 'temp-box';
            $label = 'Suhu Box: ' . $order->temperature_c . '°C';
        } elseif ($order->weather_condition && $order->traffic_condition) {
            if (str_contains($order->weather_condition, 'Hujan') && str_contains($order->traffic_condition, 'Macet')) {
                $key = 'heavy-rain-traffic';
                $label = $order->weather_condition . ' & ' . $order->traffic_condition;
            } elseif (str_contains($order->weather_condition, 'Hujan')) {
                $key = 'light-rain';
                $label = $order->weather_condition;
            } elseif (str_contains($order->traffic_condition, 'Padat') || str_contains($order->traffic_condition, 'macet')) {
                $key = 'crowded';
                $label = $order->traffic_condition;
            }
        }

        return [
            'key' => $key,
            'label' => $label,
        ];
    }

    /**
     * Hitung ringkasan SLA risk.
     */
    public function getSlaSummary(string $hubId): array
    {
        $orders = $this->getSlaRiskOrders($hubId);

        $kritis = count(array_filter($orders, fn ($o) => $o['risk_level'] === 'Kritis'));
        $waspada = count(array_filter($orders, fn ($o) => $o['risk_level'] === 'Waspada'));
        $aman = count(array_filter($orders, fn ($o) => $o['risk_level'] === 'Aman'));

        return [
            'kritis' => $kritis,
            'waspada' => $waspada,
            'aman' => $aman,
            'total' => count($orders),
        ];
    }
}
