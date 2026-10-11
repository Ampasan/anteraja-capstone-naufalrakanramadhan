
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title><?php echo e($title); ?></title>
    <style>
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 11px;
        color: #111827;
    }

    h1 {
        font-size: 16px;
        margin: 0 0 2px 0;
    }

    h2 {
        font-size: 12px;
        margin: 18px 0 6px 0;
    }

    .muted {
        color: #6b7280;
        font-size: 10px;
    }

    table {
        width: 100%;
        border-collapse: collapse;
    }

    th,
    td {
        border: 1px solid #d1d5db;
        padding: 4px 5px;
        text-align: left;
        vertical-align: top;
    }

    th {
        background-color: #f3f4f6;
        font-weight: bold;
    }

    .meta td {
        border: none;
        padding: 1px 0;
    }

    .kpi td:first-child {
        width: 60%;
        background-color: #f9fafb;
    }

    .rincian {
        font-size: 9px;
    }

    .badge-ya {
        color: #15803d;
        font-weight: bold;
    }

    .badge-tidak {
        color: #b91c1c;
        font-weight: bold;
    }

    .foot {
        margin-top: 14px;
        font-size: 9px;
        color: #6b7280;
    }
    </style>
</head>

<body>
    <h1>Laporan Audit Log &amp; Riwayat Operasional</h1>
    <div class="muted"><?php echo e($hubName); ?> &mdash; <?php echo e($hubCity); ?></div>

    <table class="meta">
        <tr>
            <td>Periode</td>
            <td>: <?php echo e($period); ?></td>
        </tr>
        <tr>
            <td>Digenerate pada</td>
            <td>: <?php echo e($generatedAt); ?></td>
        </tr>
        <tr>
            <td>Jumlah baris</td>
            <td>: <?php echo e(count($rows)); ?><?php echo e($truncated ? ' (dipotong, batas ' . $maxRows . ' baris)' : ''); ?></td>
        </tr>
    </table>

    <h2>Rekapitulasi KPI</h2>
    <table class="kpi">
        <thead>
            <tr>
                <th>Indikator</th>
                <th>Nilai</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Total Incidents</td>
                <td><?php echo e($summary['total_completed'] ?? 0); ?></td>
            </tr>
            <tr>
                <td>Reassignment Rate</td>
                <td><?php echo e($summary['reassignment_rate'] ?? 0); ?>%</td>
            </tr>
            <tr>
                <td>Avg Resolution Time</td>
                <td><?php echo e($summary['avg_handling_seconds'] ?? 0); ?> detik</td>
            </tr>
            <tr>
                <td>SLA Saved Rate</td>
                <td><?php echo e($summary['sla_compliance_rate'] ?? 0); ?>%</td>
            </tr>
            <tr>
                <td>Pengalihan Sesuai SLA</td>
                <td><?php echo e($summary['sla_compliant_count'] ?? 0); ?></td>
            </tr>
            <tr>
                <td>Total Order di Hub</td>
                <td><?php echo e($summary['total_orders'] ?? 0); ?></td>
            </tr>
        </tbody>
    </table>

    <h2>Rincian Transaksi</h2>
    <table class="rincian">
        <thead>
            <tr>
                <th>Kode Log</th>
                <th>Resi</th>
                <th>Layanan</th>
                <th>Kurir Asal</th>
                <th>Kurir Tujuan</th>
                <th>Kategori</th>
                <th>Waktu Penanganan (dtk)</th>
                <th>SLA</th>
                <th>Executor</th>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
            <tr>
                <td><?php echo e($row['log_code']); ?></td>
                <td><?php echo e($row['resi']); ?></td>
                <td><?php echo e($row['service_type']); ?></td>
                <td><?php echo e($row['from_courier'] ?? '-'); ?></td>
                <td><?php echo e($row['to_courier'] ?? '-'); ?></td>
                <td><?php echo e($row['incident_category']); ?></td>
                <td><?php echo e($row['handling_seconds']); ?></td>
                <td class="<?php echo e($row['sla_compliant'] ? 'badge-ya' : 'badge-tidak'); ?>">
                    <?php echo e($row['sla_compliant'] ? 'Ya' : 'Tidak'); ?>

                </td>
                <td><?php echo e($row['executor_name'] ?? '-'); ?></td>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
            <tr>
                <td colspan="9">Belum ada data pengalihan untuk hub ini.</td>
            </tr>
            <?php endif; ?>
        </tbody>
    </table>

    <div class="foot">
        Dokumen dibuat otomatis oleh Sistem Monitoring &amp; Eskalasi SLA Anteraja.
        Untuk data lengkap melebihi <?php echo e(number_format($maxRows)); ?> baris, gunakan ekspor CSV atau XLSX.
    </div>
</body>

</html><?php /**PATH C:\xampp\htdocs\anteraja-capstone\backend\resources\views/exports/audit-report.blade.php ENDPATH**/ ?>