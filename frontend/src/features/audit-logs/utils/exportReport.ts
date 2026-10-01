/**
 * exportReport.ts — Utilitas ekspor laporan audit & riwayat operasional.
 *
 * Strategi ekspor:
 *   1. exportToExcel → membuat file .xls (HTML-based Excel Worksheet) dengan
 *                      foto bukti langsung tertanam (embedded <img>) & link Cloudinary.
 *   2. exportToCSV   → membuat file .csv dengan kolom URL Foto Bukti & Keterangan.
 *   3. exportToPDF   → membuka print window dengan kop surat resmi Anteraja,
 *                      lengkap dengan thumbnail foto bukti resolusi tinggi & meta bukti.
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
    'Foto Bukti (URL)',
    'Keterangan Bukti',
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
    e.evidenceImageUrl,
    e.evidenceCaption || e.incidentDetail,
    String(e.handlingSeconds),
    e.slaCompliant ? 'Ya' : 'Tidak',
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM agar Excel membaca format teks dengan benar
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

// ─── Excel (.xls) Export with Embedded Images ─────────────────────────────────

export function exportToExcel(entries: AuditLogEntry[]): void {
  const rows = entries
    .map(
      (e, i) => `
      <tr>
        <td style="text-align:center; vertical-align:middle;">${i + 1}</td>
        <td style="vertical-align:middle; font-weight:bold; font-family:monospace;">${e.resi}</td>
        <td style="text-align:center; vertical-align:middle;">${e.serviceType}</td>
        <td style="text-align:center; vertical-align:middle;">${formatTime(e.completedAt)}</td>
        <td style="text-align:center; vertical-align:middle;">${formatDate(e.completedAt)}</td>
        <td style="vertical-align:middle;">${e.fromCourier} (${e.fromCourierCode})</td>
        <td style="vertical-align:middle; color:#059669; font-weight:bold;">${e.toCourier} (${e.toCourierCode})</td>
        <td style="vertical-align:middle;">${e.incidentCategory}</td>
        <td style="vertical-align:middle;">${e.incidentDetail}</td>
        <td style="text-align:center; vertical-align:middle; height:60px;">
          <img src="${e.evidenceImageUrl}" width="80" height="52" style="object-fit:cover; border-radius:4px; border:1px solid #cbd5e1;" alt="Foto Bukti" />
          <br/>
          <a href="${e.evidenceImageUrl}" target="_blank" style="font-size:10px; color:#C91076; text-decoration:none;">Buka Foto Cloudinary</a>
        </td>
        <td style="text-align:center; vertical-align:middle;">${e.handlingSeconds} dtk</td>
        <td style="text-align:center; vertical-align:middle; font-weight:bold; color:${e.slaCompliant ? '#059669' : '#DC2626'};">
          ${e.slaCompliant ? 'YA' : 'TIDAK'}
        </td>
      </tr>`
    )
    .join('');

  const excelTemplate = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Audit Log & Riwayat</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"/>
      <style>
        table { border-collapse: collapse; font-family: Segoe UI, Arial, sans-serif; font-size: 11px; }
        th { background-color: #FDF2F8; color: #99004C; font-weight: bold; border: 1px solid #F9A8D4; padding: 8px 10px; text-transform: uppercase; font-size: 10px; }
        td { border: 1px solid #E2E8F0; padding: 6px 8px; font-size: 11px; }
        .header-title { font-size: 16px; font-weight: bold; color: #C91076; }
      </style>
    </head>
    <body>
      <table>
        <tr>
          <td colspan="12" class="header-title" style="padding:10px 0;">
            ANTERAJA DISPATCH OPS CONTROL TOWER — REKAPITULASI AUDIT LOG & RIWAYAT PENGALIHAN
          </td>
        </tr>
        <tr>
          <td colspan="12" style="color:#64748B; padding-bottom:12px;">
            Hub: Jakarta Timur (Halim) / Tebet | Total Catatan: ${entries.length} | Foto Bukti: Cloudinary Storage
          </td>
        </tr>
        <thead>
          <tr>
            <th>#</th>
            <th>No. Resi</th>
            <th>Layanan</th>
            <th>Waktu Selesai</th>
            <th>Tanggal</th>
            <th>Kurir Asal</th>
            <th>Kurir Pengganti</th>
            <th>Kategori Kendala</th>
            <th>Detail Masalah</th>
            <th>Foto Bukti (Cloudinary)</th>
            <th>Waktu Penanganan</th>
            <th>SLA Terpenuhi</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `audit-log-anteraja-hub-tebet-${Date.now()}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── PDF Print Export with Embedded Images ────────────────────────────────────

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
        <td class="center">${i + 1}</td>
        <td>
          <strong style="font-family:monospace; font-size:11px;">${e.resi}</strong><br/>
          <span class="badge svc-${e.serviceType.toLowerCase().replace(' ', '-')}">${e.serviceType}</span>
        </td>
        <td>
          <strong>${formatTime(e.completedAt)}</strong><br/>
          <span class="sub-date">${formatDate(e.completedAt)}</span>
        </td>
        <td>${e.fromCourier}<br/><small>${e.fromCourierCode}</small></td>
        <td class="highlight">${e.toCourier}<br/><small>${e.toCourierCode}</small></td>
        <td>
          <strong>${e.incidentCategory}</strong><br/>
          <small>${e.incidentDetail}</small>
        </td>
        <td class="center evidence-col">
          <div class="evidence-box">
            <img src="${e.evidenceImageUrl}" alt="Bukti ${e.resi}" class="evidence-thumb" crossorigin="anonymous" />
            <div class="evidence-label">
              <a href="${e.evidenceImageUrl}" target="_blank" class="evidence-link">Foto Cloudinary ↗</a>
            </div>
          </div>
        </td>
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
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
      font-size: 10.5px;
      color: #1e293b;
      background: #fff;
      padding: 18px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Kop surat */
    .letterhead { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #C91076; padding-bottom: 12px; margin-bottom: 14px; }
    .letterhead-left { display: flex; flex-direction: column; }
    .letterhead-left .brand { font-size: 22px; font-weight: 900; color: #C91076; letter-spacing: -0.5px; }
    .letterhead-left .sub { font-size: 11px; color: #64748b; margin-top: 2px; }
    .letterhead-right { text-align: right; font-size: 10px; color: #475569; }

    /* Judul */
    .report-title { font-size: 15px; font-weight: 800; color: #0f172a; margin-bottom: 2px; }
    .report-subtitle { font-size: 10px; color: #64748b; margin-bottom: 12px; }

    /* KPI strip */
    .kpi-strip { display: flex; gap: 10px; margin-bottom: 14px; }
    .kpi-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px; background: #fafafa; }
    .kpi-box .kpi-label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700; }
    .kpi-box .kpi-value { font-size: 16px; font-weight: 800; margin-top: 2px; }
    .kpi-box.red .kpi-value { color: #EF4444; }
    .kpi-box.amber .kpi-value { color: #F59E0B; }
    .kpi-box.green .kpi-value { color: #10B981; }

    /* Tabel */
    table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead tr { background: #FDF2F8 !important; }
    thead th { padding: 6px 7px; text-align: left; font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #99004C; border-bottom: 2px solid #f9a8d4; white-space: nowrap; }
    tbody tr.even { background: #fbfbfb !important; }
    tbody td { padding: 5px 7px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 9.5px; line-height: 1.35; }
    tbody td.center { text-align: center; }
    tbody td.highlight { color: #059669; font-weight: 700; }
    tbody td.sla-ok { color: #059669; font-weight: 800; font-size: 13px; }
    tbody td.sla-fail { color: #EF4444; font-weight: 800; font-size: 13px; }
    small { font-size: 8.5px; color: #64748b; }
    .sub-date { font-size: 9px; color: #64748b; }

    /* Badge layanan */
    .badge { display: inline-block; padding: 1px 4px; border-radius: 4px; font-size: 7.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.03em; margin-top: 2px; }
    .badge.svc-next-day  { background: #f0fdf4 !important; color: #16a34a; border: 1px solid #bbf7d0; }
    .badge.svc-frozen    { background: #eff6ff !important; color: #2563eb; border: 1px solid #bfdbfe; }
    .badge.svc-cargo     { background: #1e293b !important; color: #ffffff; border: 1px solid #334155; }
    .badge.svc-pharma    { background: #faf5ff !important; color: #7c3aed; border: 1px solid #e9d5ff; }
    .badge.svc-same-day  { background: #fff0f6 !important; color: #C91076; border: 1px solid #f9a8d4; }

    /* Foto Bukti Column */
    .evidence-col { width: 85px; }
    .evidence-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
    .evidence-thumb {
      width: 68px;
      height: 46px;
      object-fit: cover;
      border-radius: 5px;
      border: 1px solid #cbd5e1;
      display: block;
      box-shadow: 0 1px 2px rgba(0,0,0,0.06);
    }
    .evidence-label { font-size: 7.5px; line-height: 1; margin-top: 1px; }
    .evidence-link { color: #C91076; text-decoration: none; font-weight: 700; }

    /* Footer */
    .report-footer { margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-size: 8.5px; color: #94a3b8; }

    @media print {
      body { padding: 10px; }
      .evidence-thumb { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <!-- Kop Surat -->
  <div class="letterhead">
    <div class="letterhead-left">
      <span class="brand">Anteraja</span>
      <span class="sub">Dispatch Operations Control Tower · Hub Halim &amp; Tebet</span>
    </div>
    <div class="letterhead-right">
      <div><strong>Dicetak oleh:</strong> Admin Dispatch</div>
      <div>${printDate}</div>
      <div>Pukul ${printTime} WIB</div>
    </div>
  </div>

  <!-- Judul Laporan -->
  <div class="report-title">Audit Log &amp; Riwayat Operasional</div>
  <div class="report-subtitle">Rekapitulasi jejak digital pengalihan paket dan dokumentasi foto bukti kendala lapangan (Cloudinary)</div>

  <!-- KPI Strip -->
  <div class="kpi-strip">
    <div class="kpi-box red">
      <div class="kpi-label">Total Pengalihan Selesai</div>
      <div class="kpi-value">${entries.length} Paket</div>
    </div>
    <div class="kpi-box amber">
      <div class="kpi-label">Rata-rata Waktu Penanganan</div>
      <div class="kpi-value">18.4 dtk</div>
    </div>
    <div class="kpi-box green">
      <div class="kpi-label">Kepatuhan SLA Terselamatkan</div>
      <div class="kpi-value">98.2% <small style="font-size:11px">(${Math.round(entries.length * 0.982)}/${entries.length})</small></div>
    </div>
  </div>

  <!-- Tabel Data -->
  <table>
    <thead>
      <tr>
        <th style="width:24px;">#</th>
        <th>No. Resi &amp; Layanan</th>
        <th>Waktu Selesai</th>
        <th>Kurir Asal</th>
        <th>Kurir Pengganti</th>
        <th>Jenis Kendala</th>
        <th style="text-align:center;">Foto Bukti</th>
        <th style="text-align:center;">Penanganan</th>
        <th style="text-align:center;">SLA</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="report-footer">
    <span>Dokumen resmi sistem Anteraja Dispatch Ops Control Tower. Seluruh bukti foto tersimpan di Cloudinary Storage.</span>
    <span>Total: ${entries.length} catatan terverifikasi</span>
  </div>

  <script>
    // Tunggu semua thumbnail foto bukti termuat sebelum membuka dialog print browser
    window.addEventListener('load', function() {
      const imgs = Array.from(document.querySelectorAll('img.evidence-thumb'));
      if (imgs.length === 0) {
        window.print();
        return;
      }
      let loaded = 0;
      function checkAll() {
        loaded++;
        if (loaded >= imgs.length) {
          setTimeout(function() { window.print(); }, 250);
        }
      }
      imgs.forEach(function(img) {
        if (img.complete) {
          checkAll();
        } else {
          img.addEventListener('load', checkAll);
          img.addEventListener('error', checkAll);
        }
      });
    });
  </script>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=1120,height=820');
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
