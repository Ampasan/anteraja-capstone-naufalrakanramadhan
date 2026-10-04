<?php

namespace App\Services\Order;

use App\Models\Hub;
use App\Models\Order;
use App\Support\OperationalClock;
use App\Support\TabelQuery;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Cache;

class SlaRiskService
{
    private const PANEL_COURIER_STATUS = 'IDLE';

    private const ORDER_COLUMNS = [
        'id', 'order_number', 'service_type', 'category', 'weight_kg',
        'recipient_name', 'recipient_phone',
        'destination_address', 'destination_district', 'destination_city',
        'drop_latitude', 'drop_longitude', 'order_time', 'pickup_time', 'sla_deadline',
        'weather_condition', 'traffic_condition', 'temperature_c',
        'delivery_status', 'current_courier_id',
        'hub_origin_id',
    ];

    /**
     * @param  bool  $excludeFinished  buang paket yang sudah terkirim/dikembalikan.
     *                                 Diturunkan ke parameter karena detail per-resi
     *                                 harus tetap bisa ditampilkan apa adanya.
     */
    private static function baseQuery(string $hubId, bool $excludeFinished = true): Builder
    {
        $query = Order::query()
            ->select(array_map(fn (string $column) => "orders.{$column}", self::ORDER_COLUMNS))
            ->addSelect([
                'couriers.name AS joined_courier_name',
                'couriers.courier_code AS joined_courier_code',
            ])
            ->leftJoin('couriers', 'couriers.id', '=', 'orders.current_courier_id')
            ->where('orders.hub_origin_id', $hubId)
            ->withRiskScore();

        if ($excludeFinished) {
            $query->whereNotIn('orders.delivery_status', ['DELIVERED', 'RETURNED']);
        }

        return $query;
    }
    private static function panelQuery(string $hubId, bool $excludeFinished = true): Builder
    {
        $query = self::baseQuery($hubId, $excludeFinished)
            ->where('couriers.status', self::PANEL_COURIER_STATUS);

        return self::restrictToMostUrgentPerCourier($query);
    }

    private static function restrictToMostUrgentPerCourier(Builder $query): Builder
    {
        return $query->whereNotExists(function ($sibling) {
            $sibling->selectRaw('1')
                ->from('orders AS sibling')
                ->whereColumn('sibling.current_courier_id', 'orders.current_courier_id')
                ->whereNotIn('sibling.delivery_status', ['DELIVERED', 'RETURNED'])
                ->where(function ($cond) {
                    $cond->whereColumn('sibling.sla_deadline', '<', 'orders.sla_deadline')
                        ->orWhere(function ($tie) {
                            $tie->whereColumn('sibling.sla_deadline', '=', 'orders.sla_deadline')
                                ->whereColumn('sibling.id', '<', 'orders.id');
                        });
                });
        });
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private static function courierIdentity(Order $order): array
    {
        $attributes = $order->getAttributes();

        if (array_key_exists('joined_courier_name', $attributes)) {
            return [
                $attributes['joined_courier_name'],
                $attributes['joined_courier_code'] ?? null,
            ];
        }

        // Jalur cadangan bila query ini tidak memakai baseQuery().
        if ($order->relationLoaded('currentCourier')) {
            return [
                $order->currentCourier?->name,
                $order->currentCourier?->courier_code,
            ];
        }

        return [null, null];
    }

    public function getSlaRiskOrders(string $hubId, bool $panelScope = false): array
    {
        $cacheKey = $panelScope
            ? "sla_risk_orders_{$hubId}_panel"
            : "sla_risk_orders_{$hubId}";

        return Cache::remember($cacheKey, 10, function () use ($hubId, $panelScope) {
            $query = $panelScope ? self::panelQuery($hubId) : self::baseQuery($hubId);
            
            $orders = $query
                ->orderByRaw('(' . Order::riskRankExpression(Order::riskScoreExpression()) . ')')
                ->orderBy('orders.sla_deadline')
                ->orderBy('orders.id')
                ->get();

            $hub = Hub::cached($hubId);
            $orders->each(fn (Order $order) => $order->setRelation('hubOrigin', $hub));

            return $orders->map(fn (Order $order) => self::formatSlaOrder($order))->toArray();
        });
    }

    /**
     * @return array<string, float> [resi => skor]
     */
    public function riskScoresForRanking(string $hubId): array
    {
        $orders = self::restrictToMostUrgentPerCourier(
            Order::query()
                ->select(['orders.order_number'])
                ->join('couriers', 'couriers.id', '=', 'orders.current_courier_id')
                ->where('couriers.status', self::PANEL_COURIER_STATUS)
                ->where('orders.hub_origin_id', $hubId)
                ->whereNotIn('orders.delivery_status', ['DELIVERED', 'RETURNED'])
                ->withRiskScore()
        )->get();

        $scores = [];
        foreach ($orders as $order) {
            $scores[$order->order_number] = (float) $order->risk_score;
        }

        return $scores;
    }

    /**
     * @param  array<int, string>  $resis
     * @return array<int, array<string, mixed>>
     */
    public static function detailsForResis(string $hubId, array $resis): array
    {
        if ($resis === []) {
            return [];
        }

        $orders = self::baseQuery($hubId, excludeFinished: false)
            ->whereIn('orders.order_number', $resis)
            ->get();

        // Urutkan sesuai urutan resis yang diminta.
        $byResi = [];
        foreach ($orders as $order) {
            $byResi[$order->order_number] = $order;
        }

        $hub = Hub::cached($hubId);

        $result = [];
        foreach ($resis as $resi) {
            if (! isset($byResi[$resi])) {
                continue;
            }

            $order = $byResi[$resi];
            $order->setRelation('hubOrigin', $hub);
            $result[] = self::formatSlaOrder($order);
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{data: array<int, array<string, mixed>>, total: int, page: int, per_page: int, last_page: int}
     */
    public function tugasTabel(string $hubId, array $params): array
    {
        $cacheKey = self::tugasTabelCacheKey($hubId, $params);

        return Cache::remember($cacheKey, 30, fn () => $this->tugasTabelQuery($hubId, $params));
    }

    /**
     * @param  array<string, mixed>  $params
     */
    public static function tugasTabelCacheKey(string $hubId, array $params): string
    {
        $normalized = [];

        foreach ($params as $key => $value) {
            if ($value === null || $value === '' || is_array($value)) {
                continue;
            }
            $normalized[$key] = in_array($key, ['page', 'per_page'], true)
                ? (int) $value
                : trim((string) $value);
        }

        ksort($normalized);

        return 'tugas_tabel_' . $hubId . '_v' . self::tugasTabelVersion($hubId)
            . '_' . md5((string) json_encode($normalized));
    }

    private static function tugasTabelVersion(string $hubId): int
    {
        $value = Cache::get("tugas_tabel_version_{$hubId}");

        return is_numeric($value) ? (int) $value : 1;
    }

    public static function bumpTugasTabelVersion(string $hubId): void
    {
        $key = "tugas_tabel_version_{$hubId}";
        $current = Cache::get($key);
        $next = (is_numeric($current) ? (int) $current : 1) + 1;

        Cache::put($key, $next, now()->addDays(30));
    }

    /**
     * @param  array<string, mixed>  $params
     * @return array{data: array<int, array<string, mixed>>, total: int, page: int, per_page: int, last_page: int}
     */
    private function tugasTabelQuery(string $hubId, array $params): array
    {
        $score = Order::riskScoreExpression();

        $query = self::panelQuery($hubId);

        $tabel = new TabelQuery([
            'search' => function (Builder $q, $value) {
                $q->where(function ($sub) use ($value) {
                    $sub->where('orders.order_number', 'like', "%{$value}%")
                        ->orWhere('orders.destination_address', 'like', "%{$value}%")
                        ->orWhere('orders.destination_district', 'like', "%{$value}%")
                        ->orWhere('orders.destination_city', 'like', "%{$value}%");
                });
            },
            'risk' => function (Builder $q, $value) use ($score) {
                $min = match ($value) {
                    'Kritis' => Order::RISK_KRITIS_MIN,
                    'Waspada' => Order::RISK_WASPADA_MIN,
                    default => null,
                };
                $max = match ($value) {
                    'Kritis' => null,
                    'Waspada' => Order::RISK_KRITIS_MIN,
                    'Aman' => Order::RISK_WASPADA_MIN,
                    default => null,
                };

                if ($min !== null) {
                    $q->whereRaw("({$score}) >= {$min}");
                }
                if ($max !== null) {
                    $q->whereRaw("({$score}) < {$max}");
                }
            },
            'service' => fn (Builder $q, $value) => $q->where('orders.service_type', $value),
        ]);

        $result = $tabel->paginate(
            $query
                ->orderByRaw('(' . Order::riskRankExpression($score) . ')')
                ->orderBy('orders.sla_deadline')
                ->orderBy('orders.id'),
            $params
        );

        $hub = Hub::cached($hubId);

        /** @var \Illuminate\Support\Collection<int, Order> $rows */
        $rows = $result['data'];
        $formatted = $rows->map(function (Order $order) use ($hub) {
            $order->setRelation('hubOrigin', $hub);

            return self::formatSlaOrder($order);
        });

        return [
            'data' => $formatted->all(),
            'total' => $result['total'],
            'page' => $result['page'],
            'per_page' => $result['per_page'],
            'last_page' => $result['last_page'],
        ];
    }

    private static function formatSlaOrder(Order $order): array
    {
        $now = OperationalClock::now();
        $slaDeadline = $order->sla_deadline;

        $remainingMinutes = $order->remaining_minutes !== null
            ? (int) round($order->remaining_minutes)
            : (int) $now->diffInMinutes($slaDeadline, false);

        $riskScore = $order->risk_score !== null
            ? (int) round($order->risk_score)
            : self::calculateRiskScore($remainingMinutes, $order);

        $riskLevel = $order->risk_level ?? Order::riskLevelFromScore($riskScore);

        $totalMinutes = (int) round($order->order_time->diffInMinutes($slaDeadline, false));
        $elapsedMinutes = (int) round($order->order_time->diffInMinutes($now, false));

        if ($totalMinutes > 0) {
            $elapsedPct = (int) max(0, min(100, round(($elapsedMinutes / $totalMinutes) * 100)));
        } else {
            $elapsedPct = $remainingMinutes < 0 ? 100 : 0;
        }

        $condition = self::formatCondition($order);

        [$courierName, $courierCode] = self::courierIdentity($order);

        return [
            'id' => $order->id,
            'waybill_number' => $order->order_number,
            'courier_id' => $order->current_courier_id,
            'courier_name' => $courierName,
            'courier_code' => $courierCode,
            'service_type' => $order->service_type,
            'weight_kg' => (float) $order->weight_kg,
            'order_time' => $order->order_time->toISOString(),
            'pickup_time' => $order->pickup_time?->toISOString(),
            'sla_deadline' => $slaDeadline->toISOString(),
            'remaining_minutes' => $remainingMinutes,
            'elapsed_pct' => $elapsedPct,
            'risk_level' => $riskLevel,
            'risk_label' => self::getRiskLabel($riskLevel),
            'risk_color' => self::getRiskColor($riskLevel),
            'status' => $order->delivery_status,
            'origin_lat' => (float) $order->hubOrigin->latitude,
            'origin_lng' => (float) $order->hubOrigin->longitude,
            'drop_lat' => (float) $order->drop_latitude,
            'drop_lng' => (float) $order->drop_longitude,
            'destination_name' => $order->destination_address,
            'destination_area' => $order->destination_district . ', ' . $order->destination_city,
            'destination_district' => $order->destination_district,
            'destination_city' => $order->destination_city,
            'recipient_name' => $order->recipient_name,
            'recipient_phone' => $order->recipient_phone,
            'category' => $order->category,
            'condition' => $condition,
            'weather_condition' => $order->weather_condition,
            'traffic_condition' => $order->traffic_condition,
            'temperature_c' => $order->temperature_c ? (float) $order->temperature_c : null,
            'sla_risk_score' => $riskScore,
            'risk_score' => $riskScore,
        ];
    }

    private static function calculateRiskScore(int $remainingMinutes, Order $order): int
    {
        $score = match (true) {
            $remainingMinutes < 0 => 10,
            $remainingMinutes <= 15 => 7,
            $remainingMinutes <= 60 => 4,
            $remainingMinutes <= 180 => 2,
            default => 1,
        };

        if ($order->service_type === 'Frozen'
            && $order->temperature_c !== null
            && (float) $order->temperature_c > 5.0) {
            $score += 2;
        }

        if (self::isCongestedTraffic($order->traffic_condition)) {
            $score += 1;
        }

        return min(Order::RISK_SCORE_MAX, $score);
    }

    /**
     * Padat/macet? Dipadankan sebagian, sama dengan ekspresi SQL.
     */
    private static function isCongestedTraffic(?string $traffic): bool
    {
        $traffic = strtolower((string) $traffic);

        return str_contains($traffic, 'macet') || str_contains($traffic, 'padat');
    }

    /**
     * Get risk label dalam bahasa Indonesia.
     */
    private static function getRiskLabel(string $riskLevel): string
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
    private static function getRiskColor(string $riskLevel): string
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
    private static function formatCondition(Order $order): array
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
     * Hitung ringkasan SLA risk pada cakupan yang sama dengan daftarnya.
     */
    public function getSlaSummary(string $hubId, bool $panelScope = false): array
    {
        $orders = $this->getSlaRiskOrders($hubId, $panelScope);

        $counts = ['Kritis' => 0, 'Waspada' => 0, 'Aman' => 0];

        foreach ($orders as $order) {
            $level = $order['risk_level'];

            if (isset($counts[$level])) {
                $counts[$level]++;
            }
        }

        return [
            'kritis' => $counts['Kritis'],
            'waspada' => $counts['Waspada'],
            'aman' => $counts['Aman'],
            'total' => count($orders),
        ];
    }
}