<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CourierController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FieldIncidentController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\IncidentController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\TaskController;
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
// Login harus publik (kredensial itulah autentikasinya), jadi dilindungi
// rate-limit ketat: 5 percobaan/menit per IP (limiter `login` di AppServiceProvider)
// untuk menutup brute-force password.
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:login');
Route::get('/hubs', [DashboardController::class, 'hubs']);

// === LAPORAN INSIDEN LAPANGAN (publik, tanpa login) ===
// Website /lapor-insiden dipakai kurir di jalan yang tidak punya akun panel.
// Endpoint tulis dibatasi rate-limit per IP agar tidak bisa dipakai membanjiri
// data insiden; seluruh endpoint panel lain tetap berada di balik Sanctum.
Route::get('/lapor/couriers', [FieldIncidentController::class, 'couriers'])->middleware('throttle:lapor-read');
Route::get('/lapor/couriers/{courierId}/orders', [FieldIncidentController::class, 'orders'])->middleware('throttle:lapor-read');
Route::post('/lapor/incidents', [FieldIncidentController::class, 'store'])->middleware('throttle:lapor-report');
Route::post('/lapor/incidents/{id}/evidence', [FieldIncidentController::class, 'evidence'])->middleware('throttle:lapor-report');

// === PROTECTED ROUTES (harus login) ===
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    // Logout dibatasi 10/menit per user supaya token bisa dipakai membanjiri
    // endpoint revoke (limiter `logout` di AppServiceProvider).
    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('throttle:logout');
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

    // Papan peringkat risiko (Redis) — 10 teratas, sangat cepat
    Route::get('/risiko/teratas', [OrderController::class, 'topRisk']);
    // Tabel tugas aktif dengan server-side processing (paginasi, filter, urutan)
    Route::get('/tugas/tabel', [OrderController::class, 'tugasTabel']);

    // Incidents (Incident & Reassign)
    Route::get('/incidents', [IncidentController::class, 'index']);
    // Unduhan laporan insiden harian (CSV/XLSX/PDF) — harus sebelum /incidents/{id}...
    Route::get('/incidents/export', [IncidentController::class, 'export']);
    Route::post('/incidents', [IncidentController::class, 'store']);
    Route::post('/incidents/{id}/reassign', [IncidentController::class, 'reassign']);
    Route::post('/incidents/{id}/upload-evidence', [IncidentController::class, 'uploadEvidence']);

    // Status pekerjaan asinkron (202 selama masih diproses worker)
    Route::get('/tasks/{id}', [TaskController::class, 'show']);

    // Audit Logs (Audit Log & Riwayat)
    Route::get('/audit-logs', [AuditLogController::class, 'index']);
    Route::get('/audit-logs/export', [AuditLogController::class, 'export']);
});