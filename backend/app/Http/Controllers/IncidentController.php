<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReassignIncidentRequest;
use App\Http\Requests\StoreIncidentRequest;
use App\Services\Cloudinary\CloudinaryService;
use App\Services\Incident\DailyIncidentReportService;
use App\Services\Incident\IncidentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class IncidentController extends Controller
{
    public function __construct(
        private IncidentService $incidentService,
        private CloudinaryService $cloudinaryService,
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
        ]);
    }

    /**
     * GET /api/incidents/export?date=YYYY-MM-DD
     * Unduh laporan insiden harian (CSV) — default hari ini.
     * Format kolom identik dengan file yang dihasilkan `report:daily-incidents`.
     */
    public function export(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'date' => 'nullable|date_format:Y-m-d',
        ]);

        $date = $validated['date'] ?? now()->toDateString();
        $rows = $this->dailyReportService->rows($date, $request->user()->hub_id);
        $csv = $this->dailyReportService->toCsv($rows);

        $filename = 'Laporan_Insiden_' . str_replace('-', '', $date) . '.csv';

        return response()->streamDownload(function () use ($csv) {
            echo $csv;
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
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
            $file = $request->file('photo');

            $uploadResult = $this->cloudinaryService->uploadEvidence($file);

            // Simpan ke database
            $incident = \App\Models\IncidentReport::findOrFail($id);
            $incident->evidences()->create([
                'cloudinary_public_id' => $uploadResult['public_id'],
                'secure_url' => $uploadResult['secure_url'],
                'folder' => 'foto_bukti',
                'file_format' => $uploadResult['format'],
                'file_size_bytes' => $uploadResult['bytes'],
                'caption' => $request->input('caption'),
                'uploaded_at' => now(),
            ]);

            // Update incident dengan evidence utama
            $incident->update([
                'evidence_image_url' => $uploadResult['secure_url'],
                'evidence_public_id' => $uploadResult['public_id'],
            ]);

            return $this->success([
                'evidence' => $uploadResult,
            ], 'Foto bukti berhasil diupload', 201);
        } catch (\Exception $e) {
            return $this->error('Gagal upload foto: ' . $e->getMessage(), 500);
        }
    }
}
