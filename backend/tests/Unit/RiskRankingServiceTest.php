<?php

namespace Tests\Unit;

use App\Services\Order\RiskRankingService;
use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

/**
 * Papan peringkat membaca sorted set Redis; operasi Redis dimock supaya uji
 * tetap deterministik dan tidak bergantung pada server Redis yang hidup.
 */
class RiskRankingServiceTest extends TestCase
{
    public function test_key_is_scoped_per_hub(): void
    {
        $this->assertSame('risiko:aktif:hub-abc', RiskRankingService::key('hub-abc'));
        $this->assertNotSame(RiskRankingService::key('hub-abc'), RiskRankingService::key('hub-xyz'));
    }

    public function test_top_reads_reverse_order_within_requested_window(): void
    {
        $captured = [];
        Redis::shouldReceive('zrevrange')->andReturnUsing(
            function ($key, $start, $stop) use (&$captured) {
                $captured[] = [$key, $start, $stop];

                return ['RESI-1' => 9.5, 'RESI-2' => 4.0];
            }
        );

        $top = (new RiskRankingService())->top('hub-abc', 10);

        $this->assertSame([
            ['resi' => 'RESI-1', 'score' => 9.5],
            ['resi' => 'RESI-2', 'score' => 4.0],
        ], $top);
        $this->assertSame([['risiko:aktif:hub-abc', 0, 9]], $captured);
    }

    public function test_score_converts_redis_reply_to_float_or_null(): void
    {
        Redis::shouldReceive('zscore')->andReturn('8.5', null);

        $service = new RiskRankingService();

        $this->assertSame(8.5, $service->score('hub-abc', 'RESI-1'));
        $this->assertNull($service->score('hub-abc', 'RESI-2'));
    }
}
