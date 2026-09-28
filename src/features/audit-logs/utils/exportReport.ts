/**
 * exportReport.ts — Utilitas ekspor laporan audit.
 *
 * Dua strategi tanpa library eksternal:
 *   1. exportToCSV  → membuat file .csv lalu memicu download via <a> tag.
 *   2. exportToPDF  → membuka jendela print browser dengan layout HTML berkop
 *                     Anteraja, siap Save-as-PDF.
 */

import type { AuditLogEntry } from '../types';

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

export function exportToCSV(entries: AuditLogEntry[]): void {
  const headers = [
    'No. Resi',
    'Jenis Layanan',
    'Waktu Selesai',
    'Tanggal',
    'Kurir Asal',
    'Kode Satria Asal',
    'Kurir Pengganti',
    'Kode Satria Pengganti',
    'Kategori Kendala',
    'Detail Kendala',
    'Waktu Penanganan (dtk)',
    'Kepatuhan SLA',
  ];

  const rows = entries.map((e) => [
    e.resi,
    e.serviceType,
    formatTime(e.completedAt),
    formatDate(e.completedAt),
    e.fromCourier,
    e.fromCourierCode,
    e.toCourier,
    e.toCourierCode,
    e.incidentCategory,
    e.incidentDetail,
    String(e.handlingSeconds),
    e.slaCompliant ? 'Ya' : 'Tidak',
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM agar Excel baca encoding dengan benar
    [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `audit-log-anteraja-hub-tebet-${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF Print Export ─────────────────────────────────────────────────────────

export function exportToPDF(entries: AuditLogEntry[]): void {
  const now = new Date();
  const printDate = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const printTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const tableRows = entries
    .map(
      (e, i) => `
      <tr class="${i % 2 === 0 ? 'even' : ''}">
        <td>${i + 1}</td>
        <td><strong>${e.resi}</strong><br/><span class="badge svc-${e.serviceType.toLowerCase().replace(' ', '-')}">${e.serviceType}</span></td>
        <td><strong>${formatTime(e.completedAt)}</strong><br/>${formatDate(e.completedAt)}</td>
        <td>${e.fromCourier}<br/><small>${e.fromCourierCode}</small></td>
        <td class="highlight">${e.toCourier}<br/><small>${e.toCourierCode}</small></td>
        <td>${e.incidentDetail}</td>
        <td class="center">${e.handlingSeconds} dtk</td>
        <td class="center ${e.slaCompliant ? 'sla-ok' : 'sla-fail'}">${e.slaCompliant ? '✓' : '✗'}</td>
      </tr>`,
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Audit Log & Riwayat Operasional — Anteraja Hub Tebet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; padding: 20px; }

    /* Kop surat */
    .letterhead { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #C91076; padding-bottom: 12px; margin-bottom: 16px; }
    .letterhead-left { display: flex; flex-direction: column; }
    .letterhead-left .brand { font-size: 22px; font-weight: 900; color: #C91076; letter-spacing: -0.5px; }
    .letterhead-left .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .letterhead-right { text-align: right; font-size: 10px; color: #475569; }

    /* Judul */
    .report-title { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
    .report-subtitle { font-size: 10px; color: #64748b; margin-bottom: 12px; }

    /* KPI strip */
    .kpi-strip { display: flex; gap: 12px; margin-bottom: 16px; }
    .kpi-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; }
    .kpi-box .kpi-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
    .kpi-box .kpi-value { font-size: 18px; font-weight: 800; margin-top: 2px; }
    .kpi-box.red .kpi-value { color: #EF4444; }
    .kpi-box.amber .kpi-value { color: #F59E0B; }
    .kpi-box.green .kpi-value { color: #10B981; }

    /* Tabel */
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #FDF2F8; }
    thead th { padding: 7px 8px; text-align: left; font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #99004C; border-bottom: 2px solid #f9a8d4; white-space: nowrap; }
    tbody tr.even { background: #fafafa; }
    tbody td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; vertical-align: top; font-size: 10px; line-height: 1.4; }
    tbody td.center { text-align: center; }
    tbody td.highlight { color: #10B981; font-weight: 700; }
    tbody td.sla-ok { color: #10B981; font-weight: 700; }
    tbody td.sla-fail { color: #EF4444; font-weight: 700; }
    small { font-size: 9px; color: #64748b; }

    /* Badge layanan */
    .badge { display: inline-block; padding: 1px 5px; border-radius: 4px; font-size: 8px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; }
    .badge.svc-next-day  { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge.svc-frozen    { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge.svc-cargo     { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
    .badge.svc-pharma    { background: #faf5ff; color: #7c3aed; border: 1px solid #e9d5ff; }
    .badge.svc-same-day  { background: #fff0f6; color: #C91076; border: 1px solid #f9a8d4; }

    /* Footer */
    .report-footer { margin-top: 16px; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }

    @media print { body { padding: 10px; } }
  </style>
</head>
<body>

  <!-- Kop Surat -->
  <div class="letterhead">
    <div class="letterhead-left">
      <span class="brand">Anteraja</span>
      <span class="sub">Dispatch Operations Control Tower · Hub Tebet</span>
    </div>
    <div class="letterhead-right">
      <div><strong>Dicetak oleh:</strong> Admin Dispatch</div>
      <div>${printDate}</div>
      <div>Pukul ${printTime} WIB</div>
    </div>
  </div>

  <!-- Judul Laporan -->
  <div class="report-title">Audit Log & Riwayat Operasional</div>
  <div class="report-subtitle">Rekapitulasi jejak digital pengalihan paket dan penanganan kendala Hub Tebet</div>

  <!-- KPI Strip -->
  <div class="kpi-strip">
    <div class="kpi-box red">
      <div class="kpi-label">Total Pengalihan Selesai</div>
      <div class="kpi-value">142 Paket</div>
    </div>
    <div class="kpi-box amber">
      <div class="kpi-label">Rata-rata Waktu Penanganan</div>
      <div class="kpi-value">18.4 dtk</div>
    </div>
    <div class="kpi-box green">
      <div class="kpi-label">Kepatuhan SLA Terselamatkan</div>
      <div class="kpi-value">98.2% <small style="font-size:12px">(139/142)</small></div>
    </div>
  </div>

  <!-- Tabel Data -->
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>No. Resi & Layanan</th>
        <th>Waktu Selesai</th>
        <th>Kurir Asal</th>
        <th>Kurir Pengganti</th>
        <th>Jenis Kendala</th>
        <th>Penanganan</th>
        <th>SLA</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="report-footer">
    <span>Dokumen ini digenerate otomatis oleh sistem Anteraja Dispatch Ops Control Tower.</span>
    <span>Total: ${entries.length} catatan terverifikasi</span>
  </div>

  <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=1100,height=800');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
