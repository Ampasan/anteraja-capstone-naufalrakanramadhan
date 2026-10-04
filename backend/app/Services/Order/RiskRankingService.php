<?php

namespace App\Services\Order;

use Illuminate\Support\Facades\Redis;

class RiskRankingService
{
    public static function key(string $hubId): string
    {
        return "risiko:aktif:{$hubId}";
    }

    /**
     * @param  array<string, float>  $scores  [resi => skor]
     */
    public function rebuild(string $hubId, array $scores): int
    {
        $key = self::key($hubId);

        Redis::del($key);

        if ($scores === []) {
            return 0;
        }

        Redis::zadd($key, $scores);

        return count($scores);
    }

    /**
     * @return array<int, array{resi: string, score: float}>
     */
    public function top(string $hubId, int $limit = 10): array
    {
        $entries = Redis::zrevrange(self::key($hubId), 0, max(0, $limit - 1), ['withscores' => true]);

        $result = [];
        foreach ($entries as $resi => $score) {
            $result[] = ['resi' => (string) $resi, 'score' => (float) $score];
        }

        return $result;
    }

    /**
     * @param  array<int, string>  $resis
     * @return array<int, array<string, mixed>>
     */
    public function detailsFor(string $hubId, array $resis): array
    {
        if ($resis === []) {
            return [];
        }

        return SlaRiskService::detailsForResis($hubId, $resis);
    }

    public function remove(string $hubId, string $resi): void
    {
        Redis::zrem(self::key($hubId), $resi);
    }

    public function score(string $hubId, string $resi): ?float
    {
        $score = Redis::zscore(self::key($hubId), $resi);

        return $score === null ? null : (float) $score;
    }
}