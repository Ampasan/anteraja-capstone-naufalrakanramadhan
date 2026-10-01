<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Security headers untuk production
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        // Alias auth memakai middleware App sendiri supaya request API yang belum
        // login mendapat pesan yang jelas dari envelope (bukan pesan bawaan framework).
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Log error production dengan detail lengkap
        $exceptions->report(function (Throwable $e) {
            if (app()->environment('production')) {
                \Illuminate\Support\Facades\Log::error('Production error', [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'url' => request()->url(),
                    'method' => request()->method(),
                    'ip' => request()->ip(),
                ]);
            }
        });

        // Render exception sebagai JSON untuk API dengan format envelope konsisten
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                // Tentukan status code berdasarkan tipe exception
                $statusCode = match (true) {
                    $e instanceof \Illuminate\Validation\ValidationException => 422,
                    $e instanceof \Illuminate\Auth\AuthenticationException => 401,
                    $e instanceof \Illuminate\Auth\Access\AuthorizationException => 403,
                    $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException => 404,
                    $e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException => 405,
                    default => method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500,
                };

                // Format envelope konsisten
                $message = app()->environment('production') 
                    ? 'Terjadi kesalahan pada server. Silakan coba lagi.' 
                    : $e->getMessage();

                return response()->json([
                    'ok' => false,
                    'data' => null,
                    'message' => $message,
                ], $statusCode);
            }
        });
    })->create();
