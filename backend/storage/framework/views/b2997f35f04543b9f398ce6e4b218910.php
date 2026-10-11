
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

    .foot {
        margin-top: 14px;
        font-size: 9px;
        color: #6b7280;
    }
    </style>
</head>

<body>
    <h1>Laporan Insiden Harian</h1>
    <div class="muted"><?php echo e($hubName); ?></div>

    <table class="meta">
        <tr>
            <td>Tanggal</td>
            <td>: <?php echo e($date); ?></td>
        </tr>
        <tr>
            <td>Digenerate pada</td>
            <td>: <?php echo e($generatedAt); ?></td>
        </tr>
        <tr>
            <td>Jumlah baris</td>
            <td>: <?php echo e(count($rows)); ?><?php echo e($truncated ? ' (dipotong, batas ' . number_format($maxRows) . ' baris)' : ''); ?>

            </td>
        </tr>
    </table>

    <h2>Rekapitulasi</h2>
    <table class="kpi">
        <thead>
            <tr>
                <th>Indikator</th>
                <th>Nilai</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Total Insiden</td>
                <td><?php echo e($summary['total'] ?? 0); ?></td>
            </tr>
            <tr>
                <td>Selesai (Resolved)</td>
                <td><?php echo e($summary['resolved'] ?? 0); ?></td>
            </tr>
            <tr>
                <td>Eskalasi</td>
                <td><?php echo e($summary['escalated'] ?? 0); ?></td>
            </tr>
            <tr>
                <td>Belum Tuntas</td>
                <td><?php echo e($summary['pending'] ?? 0); ?></td>
            </tr>
        </tbody>
    </table>

    <h2>Rincian Insiden</h2>
    <table class="rincian">
        <thead>
            <tr>
                <?php $__currentLoopData = $columns; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $column): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <th><?php echo e($column); ?></th>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </tr>
        </thead>
        <tbody>
            <?php $__empty_1 = true; $__currentLoopData = $rows; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $row): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); $__empty_1 = false; ?>
            <tr>
                <?php $__currentLoopData = $row; $__env->addLoop($__currentLoopData); foreach($__currentLoopData as $cell): $__env->incrementLoopIndices(); $loop = $__env->getLastLoop(); ?>
                <td><?php echo e($cell); ?></td>
                <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); ?>
            </tr>
            <?php endforeach; $__env->popLoop(); $loop = $__env->getLastLoop(); if ($__empty_1): ?>
            <tr>
                <td colspan="<?php echo e(count($columns)); ?>">Belum ada insiden tercatat pada tanggal ini.</td>
            </tr>
            <?php endif; ?>
        </tbody>
    </table>

    <div class="foot">
        Dokumen dibuat otomatis oleh Sistem Monitoring &amp; Eskalasi SLA Anteraja.
        Data lebih dari <?php echo e(number_format($maxRows)); ?> baris tersedia lewat ekspor CSV atau XLSX.
    </div>
</body>

</html><?php /**PATH C:\xampp\htdocs\anteraja-capstone\backend\resources\views\exports\incident-report.blade.php ENDPATH**/ ?>