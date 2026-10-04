<?php

namespace App\Http\Controllers;

use App\Exports\AuditLogExport;
use App\Models\Hub;
use App\Services\AuditLog\AuditLogService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class AuditLogController extends Controller
{
    /** Batas baris ekspor PDF. dompdf butuh waktu render jauh lebih lama dari CSV/XLSX. */
    private const PDF_MAX_ROWS = 1000;

    public function __construct(
        private AuditLogService $auditLogService
    ) {}

    /**
     * GET /api/audit-logs
     * Ambil semua audit log untuk hub tertentu.
     */
    public function index(Request $request): JsonResponse
    {
        $hubId = $request->user()->hub_id;

        $logs = $this->auditLogService->getAuditLogs($hubId);
        $summary = $this->auditLogService->getAuditSummary($hubId);

        return $this->success([
            'logs' => $logs,
            'summary' => $summary,
        ]);
    }

    /**
     * GET /api/audit-logs/export?format=csv|xlsx|pdf
     * Ekspor laporan audit log.
     *
     * csv  -> ditulis manual, paling ringan
     * xlsx -> maatwebsite/excel, dua sheet: Rekap KPI + Rincian Transaksi
     * pdf  -> barryvdh/laravel-dompdf, Rekap KPI + tabel rincian.
     */
    public function export(Request $request): Response|JsonResponse
    {
        $hubId = $request->user()->hub_id;
        $format = strtolower(trim((string) $request->query('format', 'csv')));
        $format = $format === '' ? 'csv' : $format;

        // Tolak format yang tidak dikenal, jangan diam-diam mengunduh CSV —
        // nilai yang diizinkan tercantum di API_DOCUMENTATION.md.
        if (! in_array($format, ['csv', 'xlsx', 'excel', 'pdf'], true)) {
            return $this->error('Format ekspor tidak dikenal. Gunakan csv, xlsx, atau pdf.', 422);
        }

        try {
            return match ($format) {
                'pdf' => $this->exportPdf($hubId),
                'xlsx', 'excel' => $this->exportExcel($hubId),
                default => $this->exportCsv($hubId),
            };
        } catch (\Throwable $e) {
            report($e);

            return $this->error('Gagal membuat berkas ekspor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Ekspor CSV: ditulis langsung ke berkas agar hemat memori.
     */
    private function exportCsv(string $hubId): BinaryFileResponse
    {
        $filepath = $this->auditLogService->exportToCsv($hubId, AuditLogExport::MAX_ROWS);

        return response()->download($filepath, $this->filename($hubId, 'csv'), [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Ekspor XLSX: sheet "Rekap KPI" + sheet "Rincian Transaksi".
     */
    private function exportExcel(string $hubId): BinaryFileResponse
    {
        $export = new AuditLogExport(
            $this->auditLogService->getReportSummary($hubId),
            $this->auditLogService->getAuditLogs($hubId),
            $this->reportMeta($hubId),
        );

        return Excel::download($export, $this->filename($hubId, 'xlsx'));
    }

    /**
     * Ekspor PDF: Rekap KPI + tabel rincian transaksi.
     */
    private function exportPdf(string $hubId): Response
    {
        $summary = $this->auditLogService->getReportSummary($hubId);
        $meta = $this->reportMeta($hubId);
        $allRows = $this->auditLogService->getAuditLogs($hubId);

        $rows = array_slice($allRows, 0, self::PDF_MAX_ROWS);

        $html = view('exports.audit-report', [
            'title' => 'Laporan Audit Log ' . ($meta['hub_name'] ?? ''),
            'hubName' => $meta['hub_name'] ?? '-',
            'hubCity' => $meta['hub_city'] ?? '-',
            'period' => $meta['period'] ?? 'Semua data',
            'generatedAt' => $meta['generated_at'] ?? now()->format('d-m-Y H:i'),
            'summary' => $summary,
            'rows' => $rows,
            'maxRows' => self::PDF_MAX_ROWS,
            'truncated' => count($allRows) > self::PDF_MAX_ROWS,
        ])->render();

        return Pdf::loadHtml($html)
            ->setPaper('a4', 'landscape')
            ->download($this->filename($hubId, 'pdf'));
    }

    /**
     * Metadata umum laporan: identitas hub, periode, dan waktu generate.
     */
    private function reportMeta(string $hubId): array
    {
        $hub = Hub::cached($hubId);

        return [
            'hub_name' => $hub?->hub_name ?? '-',
            'hub_city' => $hub?->city ?? '-',
            'period' => 'Semua data',
            'generated_at' => now()->format('d-m-Y H:i'),
            'with_evidence' => false,
        ];
    }

    /**
     * Audit_Report_{KODE-HUB}_{YYYYMMDD}.{ext}
     */
    private function filename(string $hubId, string $extension): string
    {
        $hub = Hub::cached($hubId);
        $code = preg_replace('/\s+/', '-', (string) ($hub?->hub_code ?? 'HUB'));

        return sprintf('Audit_Report_%s_%s.%s', $code, now()->format('Ymd'), $extension);
    }
}