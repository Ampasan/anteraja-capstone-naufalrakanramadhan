<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;

class HealthController extends Controller
{
    /**
     * Health check endpoint untuk monitoring.
     * Dipakai oleh load balancer / uptime monitor.
     */
    public function check(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'cache' => $this->checkCache(),
            'queue' => $this->checkQueue(),
        ];

        $allHealthy = !in_array('error', array_column($checks, 'status'), true);

        return response()->json([
            'ok' => $allHealthy,
            'data' => [
                'status' => $allHealthy ? 'healthy' : 'unhealthy',
                'timestamp' => now()->toISOString(),
                'checks' => $checks,
            ],
            'message' => $allHealthy ? 'Service healthy' : 'Service unhealthy',
        ], $allHealthy ? 200 : 503);
    }

    /**
     * Cek koneksi database.
     */
    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return ['status' => 'ok', 'response_time_ms' => $this->measureTime(fn () => DB::connection()->getPdo())];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Cek koneksi Redis
     */
    private function checkRedis(): array
    {
        try {
            $responseTime = $this->measureTime(fn () => Redis::connection()->ping());

            return [
                'status' => 'ok',
                'client' => config('database.redis.client'),
                'host' => config('database.redis.default.host') . ':' . config('database.redis.default.port'),
                'used_by' => array_values(array_filter([
                    config('cache.default') === 'redis' ? 'cache' : null,
                    config('queue.default') === 'redis' ? 'queue' : null,
                    config('session.driver') === 'redis' ? 'session' : null,
                ])),
                'response_time_ms' => $responseTime,
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Cek koneksi cache.
     */
    private function checkCache(): array
    {
        try {
            $key = 'health_check_' . time();
            Cache::put($key, true, 10);
            $value = Cache::get($key);
            Cache::forget($key);
            
            return ['status' => $value ? 'ok' : 'error', 'driver' => config('cache.default')];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Cek queue worker.
     */
    private function checkQueue(): array
    {
        try {
            $pendingJobs = Queue::size();
            $failedJobs = DB::table('failed_jobs')->count();
            
            return [
                'status' => 'ok',
                'connection' => config('queue.default'),
                'pending_jobs' => $pendingJobs,
                'failed_jobs' => $failedJobs,
            ];
        } catch (\Exception $e) {
            return ['status' => 'error', 'message' => $e->getMessage()];
        }
    }

    /**
     * Ukur waktu eksekusi.
     */
    private function measureTime(callable $callback): int
    {
        $start = microtime(true);
        $callback();
        return round((microtime(true) - $start) * 1000);
    }
}