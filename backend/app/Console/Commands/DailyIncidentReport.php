<?php

namespace App\Console\Commands;

use App\Services\Incident\DailyIncidentReportService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Laporan insiden harian (CSV) — FRD-04 & kebutuhan "incident daily report
 * downloadable as CSV".
 *
 * Berkas ditulis ke storage/app/public/exports sehingga bisa diunduh lewat
 * aplikasi, sekaligus tetap tersimpan sebagai arsip harian.
 */
class DailyIncidentReport extends Command
{
    protected $signature = 'report:daily-incidents
        {--date= : Tanggal laporan dalam format Y-m-d, default hari ini}';

    protected $description = 'Generate laporan insiden harian dalam format CSV';

    public function __construct(
        private DailyIncidentReportService $reportService
    ) {
        parent::__construct();
    }

    /**
     * Generate rekap kendala hari ini + tulis berkas CSV.
     */
    public function handle(): int
    {
        $date = $this->option('date') ?: now()->toDateString();
        $rows = $this->reportService->rows($date);
        $summary = $this->reportService->summary($date);

        $filename = 'Laporan_Insiden_' . str_replace('-', '', $date) . '.csv';
        $directory = storage_path('app/public/exports');

        if (!is_dir($directory)) {
            mkdir($directory, 0755, true);
        }

        $filepath = $directory . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($filepath, $this->reportService->toCsv($rows));

        $this->info('=== Laporan Insiden Harian ===');
        $this->info('Tanggal          : ' . \Illuminate\Support\Carbon::parse($date)->format('d-m-Y'));
        $this->info('Total Insiden    : ' . $summary['total']);
        $this->info('Resolved         : ' . $summary['resolved']);
        $this->info('Escalated        : ' . $summary['escalated']);
        $this->info('Pending          : ' . $summary['pending']);
        $this->info('');
        $this->info('Per Kategori:');
        foreach ($summary['by_category'] as $category => $count) {
            $this->info("  - {$category}: {$count}");
        }
        $this->info('');
        $this->info('Berkas CSV       : ' . $filepath);

        Log::info('Daily incident report generated', [
            'date' => $date,
            'total' => $summary['total'],
            'resolved' => $summary['resolved'],
            'escalated' => $summary['escalated'],
            'pending' => $summary['pending'],
            'file' => $filepath,
        ]);

        return self::SUCCESS;
    }
}
