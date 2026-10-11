{{-- Templat laporan insiden harian untuk ekspor PDF (dompdf). --}}
<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
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
    <div class="muted">{{ $hubName }}</div>

    <table class="meta">
        <tr>
            <td>Tanggal</td>
            <td>: {{ $date }}</td>
        </tr>
        <tr>
            <td>Digenerate pada</td>
            <td>: {{ $generatedAt }}</td>
        </tr>
        <tr>
            <td>Jumlah baris</td>
            <td>: {{ count($rows) }}{{ $truncated ? ' (dipotong, batas ' . number_format($maxRows) . ' baris)' : '' }}
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
                <td>{{ $summary['total'] ?? 0 }}</td>
            </tr>
            <tr>
                <td>Selesai (Resolved)</td>
                <td>{{ $summary['resolved'] ?? 0 }}</td>
            </tr>
            <tr>
                <td>Eskalasi</td>
                <td>{{ $summary['escalated'] ?? 0 }}</td>
            </tr>
            <tr>
                <td>Belum Tuntas</td>
                <td>{{ $summary['pending'] ?? 0 }}</td>
            </tr>
        </tbody>
    </table>

    <h2>Rincian Insiden</h2>
    <table class="rincian">
        <thead>
            <tr>
                @foreach($columns as $column)
                <th>{{ $column }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $row)
            <tr>
                @foreach($row as $cell)
                <td>{{ $cell }}</td>
                @endforeach
            </tr>
            @empty
            <tr>
                <td colspan="{{ count($columns) }}">Belum ada insiden tercatat pada tanggal ini.</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div class="foot">
        Dokumen dibuat otomatis oleh Sistem Monitoring &amp; Eskalasi SLA Anteraja.
        Data lebih dari {{ number_format($maxRows) }} baris tersedia lewat ekspor CSV atau XLSX.
    </div>
</body>

</html>