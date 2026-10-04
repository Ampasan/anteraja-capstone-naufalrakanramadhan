<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiTiming
{
    /** Batas waktu yang dianggap lambat (ms) — dicatat ke log peringatan. */
    private const SLOW_MS = 1000;

    public function handle(Request $request, Closure $next): Response
    {
        $start = hrtime(true);

        DB::flushQueryLog();
        DB::enableQueryLog();

        try {
            $response = $next($request);
        } finally {
            $queries = DB::getQueryLog();
            DB::disableQueryLog();
        }

        $ms = (hrtime(true) - $start) / 1e6;
        $queryMs = array_sum(array_column($queries, 'time'));

        $response->headers->set('Server-Timing', sprintf(
            'app;dur=%.1f, db;dur=%.1f, dbcount;%d',
            $ms,
            $queryMs,
            count($queries),
        ));
        $response->headers->set('X-Response-Time-Ms', number_format($ms, 1, '.', ''));
        $response->headers->set('X-Ms', number_format($ms, 1, '.', ''));
        $response->headers->set('X-Query-Count', (string) count($queries));
        $response->headers->set('X-Query-Ms', number_format($queryMs, 1, '.', ''));

        if ($request->is('api/*')) {
            $response->headers->set('Cache-Control', (string) config('cache.headers.response'));

            if ($ms > self::SLOW_MS) {
                Log::warning('API melebihi 1 detik', [
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'ms' => round($ms, 1),
                    'query_count' => count($queries),
                    'query_ms' => round($queryMs, 1),
                    'sql' => array_map(
                        fn (array $q) => round($q['time'], 1) . ' ms  ' . preg_replace('/\s+/', ' ', $q['query']),
                        $queries,
                    ),
                ]);
            }
        }

        return $response;
    }
}