<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuditLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Semua route API untuk Courier Admin Mini Panel.
| Prefix: /api
| Envelope response: { ok: boolean, data: mixed, message: string }
*/

// === PUBLIC ROUTES (tanpa auth) ===

// Health check untuk monitoring
Route::get('/health', [HealthController::class, 'check']);

// Endpoint ringan tanpa query database (cek API hidup / latency jaringan)
Route::get('/ping', fn () => response()->json(['ok' => true, 'data' => 'pong', 'message' => 'OK']));

// Login & Hub list
Route::post('/auth/login', [AuthController::class, 'login']);
Route::get('/hubs', [DashboardController::class, 'hubs']);

// === PROTECTED ROUTES (harus login) ===
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

    // Couriers (Live Monitoring Map)
    Route::get('/couriers', [CourierController::class, 'index']);
    // Kandidat kurir pengganti — HARUS sebelum /couriers/{id} agar tidak tertangkap route param
    Route::get('/couriers/candidates', [CourierController::class, 'candidates']);
    Route::get('/couriers/{id}', [CourierController::class, 'show']);
    Route::post('/couriers/{id}/telemetry', [CourierController::class, 'updateTelemetry']);

    // Orders (SLA Risk Panel)
    Route::get('/orders/sla-risk', [OrderController::class, 'slaRisk']);

    // Incidents (Incident & Reassign)
    Route::get('/incidents', [IncidentController::class, 'index']);
    // Unduhan laporan insiden harian (CSV) — harus sebelum /incidents/{id}...
    Route::get('/incidents/export', [IncidentController::class, 'export']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::post('/incidents/{id}/reassign', [IncidentController::class, 'reassign']);
    Route::post('/incidents/{id}/upload-evidence', [IncidentController::class, 'uploadEvidence']);

    // Audit Logs (Audit Log & Riwayat)
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/export', [AuditLogController::class, 'export']);
});