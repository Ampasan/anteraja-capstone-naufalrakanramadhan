<?php

namespace App\Http\Controllers;

use App\Exports\IncidentDailyExport;
use App\Http\Requests\ReassignIncidentRequest;
use App\Http\Requests\StoreIncidentRequest;
use App\Models\Hub;
use App\Services\AuditLog\AuditLogService;
use App\Services\Incident\DailyIncidentReportService;
use App\Services\Incident\IncidentService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\Response;

class IncidentController extends Controller
{
    public function __construct(
        private IncidentService $incidentService,
        private AuditLogService $auditLogService,
        private DailyIncidentReportService $dailyReportService
    ) {}

    /**
     * GET /api/incidents
     * Ambil semua insiden untuk hub tertentu.
     */
    public function index(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;

        $incidents = $this->incidentService->getIncidents($hubId);

        return $this->success([
            'incidents' => $incidents,
            'total' => count($incidents),
            'summary' => [
                'one_click_rate' => $this->auditLogService->getAuditSummary($hubId)['one_click_rate'],
            ],
        ]);
    }

    /**
     * GET /api/incidents/export?date=YYYY-MM-DD&format=csv|xlsx|pdf
     * Unduh laporan insiden harian — default CSV untuk hari ini.
     */
    public function export(Request $request): Response
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
            'format' => 'nullable|in:csv,xlsx,excel,pdf',
        ]);

        $date = $validated['date'] ?? now()->toDateString();
        $format = strtolower($validated['format'] ?? 'csv');
        $hubId = $request->user()->hub_id;

        $rows = $this->dailyReportService->rows($date, $hubId);
        $basename = 'Laporan_Insiden_' . str_replace('-', '', $date);

        try {
            return match ($format) {
                'pdf' => Pdf::loadHtml($this->dailyReportService->toHtml($rows, [
                    'date' => $date,
                    'hub_id' => $hubId,
                    'hub_name' => Hub::cached($hubId)?->hub_name ?? '-',
                    'generated_at' => now()->format('d-m-Y H:i'),
                ]))
                    ->setPaper('a4', 'landscape')
                    ->download($basename . '.pdf'),

                'xlsx', 'excel' => Excel::download(
                    new IncidentDailyExport($this->dailyReportService, $rows),
                    $basename . '.xlsx'
                ),

                default => response()->streamDownload(function () use ($rows) {
                    echo $this->dailyReportService->toCsv($rows);
                }, $basename . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']),
            };
        } catch (\Throwable $e) {
            report($e);

            return $this->error('Gagal membuat berkas ekspor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/incidents
     * Buat insiden baru dari laporan kurir.
     */
    public function store(StoreIncidentRequest $request): JsonResponse
    {
        try {
            $incident = $this->incidentService->createIncident(
                $request->validated(),
                $request->user()
            );

            return $this->success($incident, 'Insiden berhasil dibuat', 201);
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 500);
        }
    }

    /**
     * POST /api/incidents/{id}/reassign
     * Proses pengalihan 1-klik dengan cache lock.
     */
    public function reassign(ReassignIncidentRequest $request, string $id): JsonResponse
    {
        $result = $this->incidentService->reassignIncident(
            $id,
            $request->input('replacement_courier_id'),
            $request->user()
        );

        if (!$result['success']) {
            $code = match ($result['code']) {
                'CONFLICT' => 409,
                'UNPROCESSABLE' => 422,
                default => 500,
            };

            return $this->error($result['message'], $code);
        }

        return $this->success($result['data'], $result['message'], 201);
    }

    /**
     * POST /api/incidents/{id}/upload-evidence
     * Upload foto bukti insiden ke Cloudinary.
     */
    public function uploadEvidence(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'photo' => 'required|image|mimes:jpeg,png,jpg|max:5120', // Max 5MB
            'caption' => 'nullable|string|max:255',
        ]);

        try {
            $uploadResult = $this->incidentService->attachEvidence(
                $id,
                $request->file('photo'),
                $request->input('caption')
            );

            return $this->success([
                'evidence' => $uploadResult,
            ], 'Foto bukti berhasil diupload', 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException) {
            return $this->error('Insiden tidak ditemukan.', 404);
        } catch (\Exception $e) {
            return $this->error('Gagal upload foto: ' . $e->getMessage(), 500);
        }
    }
}