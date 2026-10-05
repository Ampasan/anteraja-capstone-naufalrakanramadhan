import type { SlaOrder } from '../features/sla-risk/types';
import { operationalNow } from './operationalClock';

const TRAFFIC_COLOR: Record<string, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red:   '#dc2626',
};

const RISK_COLOR: Record<string, string> = {
  green: '#16a34a',
  amber: '#d97706',
  red:   '#dc2626',
};

function timelineItemHtml(step: SlaOrder['detail']['timeline'][0], isLast: boolean): string {
  const isDone = step.status === 'done';

  const badgeColorMap: Record<string, string> = {
    green: '#16a34a',
    amber: '#d97706',
    red:   '#dc2626',
  };

  const dotHtml = isDone
    ? `<div style="width:22px;height:22px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
         <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
       </div>`
    : `<div style="width:22px;height:22px;border-radius:50%;border:2px solid #C91076;background:#FFF0F6;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
         <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#C91076" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
       </div>`;

  const lineHtml = isLast ? '' : `<div style="width:1px;background:#e2e8f0;flex:1;min-height:28px;margin-top:4px;"></div>`;

  const badgeHtml = step.badge && step.badgeColor
    ? `<span style="font-size:11px;font-weight:700;color:${badgeColorMap[step.badgeColor] ?? '#64748b'};">&nbsp;&bull;&nbsp;${step.badge}</span>`
    : '';

  const timeHtml = step.time
    ? `<span style="font-size:11px;font-weight:600;color:#64748b;white-space:nowrap;">${step.time}</span>`
    : step.etaBadge
    ? `<span style="font-size:11px;font-weight:700;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;padding:3px 8px;border-radius:6px;white-space:nowrap;">${step.etaBadge}</span>`
    : '';

  return `
    <div style="display:flex;gap:12px;">
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;padding-top:2px;">
        ${dotHtml}
        ${lineHtml}
      </div>
      <div style="flex:1;min-width:0;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;${isLast ? '' : 'padding-bottom:18px;'}">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;">
            <span style="font-size:13px;font-weight:800;color:${isDone ? '#0f172a' : '#C91076'};">${step.title}</span>
            ${badgeHtml}
          </div>
          <p style="font-size:11px;color:#94a3b8;margin:3px 0 0;line-height:1.5;">${step.subtitle}</p>
        </div>
        <div style="flex-shrink:0;text-align:right;padding-top:2px;">${timeHtml}</div>
      </div>
    </div>`;
}

function buildHtml(order: SlaOrder): string {
  const d = order.detail;
  const loadPct = Math.min(100, Math.round((d.loadUsedKg / d.loadCapacityKg) * 100));
  const printDate = operationalNow().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta',
  });

  const timelineHtml = d.timeline
    .map((step, idx) => timelineItemHtml(step, idx === d.timeline.length - 1))
    .join('');

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Surat Jalan — ${order.waybillNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #fff;
      color: #0f172a;
      padding: 28px 32px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { padding: 16px 20px; }
    }
    .section {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      margin-bottom: 14px;
    }
    .section-head {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      background: #fafbfc;
    }
    .section-head span {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
    }
    .label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #F9A8D4;">
    <div style="display:flex;align-items:center;gap:10px;">
      <div style="width:4px;height:32px;background:#C91076;border-radius:4px;flex-shrink:0;"></div>
      <div>
        <p style="font-size:11px;color:#94a3b8;font-weight:600;margin-bottom:2px;">SURAT JALAN PENGIRIMAN</p>
        <h1 style="font-size:18px;font-weight:900;color:#0f172a;line-height:1;">
          Paket <span style="color:#C91076;">#${order.waybillNumber}</span>
        </h1>
      </div>
      <span style="display:inline-flex;align-items:center;height:22px;padding:0 10px;border-radius:99px;font-size:10px;font-weight:700;background:#FFF0F6;color:#C91076;border:1px solid #F9A8D4;">${order.serviceType}</span>
    </div>
    <div style="text-align:right;">
      <p style="font-size:10px;color:#94a3b8;">Dicetak pada</p>
      <p style="font-size:11px;font-weight:700;color:#475569;">${printDate}</p>
    </div>
  </div>

  <!-- 1 Identitas Kurir -->
  <div class="section">
    <div class="section-head">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C91076" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
      <span>Identitas Kurir &amp; Armada Satria</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;background:#fff;">
      <div style="padding:14px 16px;border-right:1px solid #f1f5f9;">
        <p class="label">ID Kurir Satria</p>
        <p style="font-size:16px;font-weight:900;font-family:monospace;letter-spacing:-0.02em;">${d.courierId}</p>
      </div>
      <div style="padding:14px 16px;border-right:1px solid #f1f5f9;">
        <p class="label">Tipe Kendaraan</p>
        <p style="font-size:16px;font-weight:900;">${d.vehicleType}</p>
      </div>
      <div style="padding:14px 16px;">
        <p class="label">Kapasitas Muatan</p>
        <p style="font-size:14px;font-weight:900;margin-bottom:5px;">${d.loadUsedKg} / ${d.loadCapacityKg} Kg</p>
        <div style="height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
          <div style="height:100%;width:${loadPct}%;background:#C91076;border-radius:99px;"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- 2 Rincian Penerima -->
  <div class="section">
    <div class="section-head">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C91076" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      <span>Rincian Penerima &amp; Spesifikasi</span>
    </div>
    <div style="padding:14px;display:grid;grid-template-columns:3fr 2fr;gap:12px;background:#fff;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
        <p class="label">Alamat Tujuan Pengiriman</p>
        <p style="font-size:13px;font-weight:700;margin-bottom:5px;">${d.destinationName}</p>
        <p style="font-size:11px;color:#64748b;line-height:1.5;">${d.destinationAddress}</p>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;justify-content:space-between;padding:4px 0;">
        <div>
          <p class="label">Total Berat &amp; Dimensi</p>
          <p style="font-size:22px;font-weight:900;line-height:1;">${d.weightKg} Kg</p>
          <p style="font-size:10px;color:#94a3b8;margin-top:3px;">${d.dimensionCm ? `${d.dimensionCm}${d.volumeCbm ? ` (${d.volumeCbm})` : ''}` : ''}</p>
        </div>
        <div>
          <p class="label">Klasifikasi Kargo</p>
          <p style="font-size:13px;font-weight:700;color:#C91076;">${d.cargoClassification}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 3 Timeline -->
  <div class="section">
    <div class="section-head">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C91076" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      <span>Timeline Audit Kepatuhan SLA</span>
    </div>
    <div style="padding:16px 18px;background:#fff;">
      ${timelineHtml}
    </div>
  </div>

  <!-- 4 Analisis -->
  <div style="border:1px solid #F9A8D4;border-radius:12px;overflow:hidden;margin-bottom:14px;">
    <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:linear-gradient(to right,#FFF0F6,#FFF5F9);border-bottom:1px solid #F9A8D4;">
      <div style="width:6px;height:6px;border-radius:50%;background:#C91076;flex-shrink:0;"></div>
      <span style="font-size:13px;font-weight:800;color:#C91076;">Analisis Faktor Hambatan &amp; Prediksi Keterlambatan</span>
    </div>
    <div style="padding:12px;background:#FFF8FB;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
      <!-- Cuaca -->
      <div style="background:#fff;border:1px solid rgba(249,168,212,0.3);border-radius:10px;padding:10px 14px;">
        <p class="label" style="margin-bottom:6px;">Cuaca Jalur</p>
        <p style="font-size:13px;font-weight:700;color:#0f172a;">${d.hazard.weather}</p>
      </div>
      <!-- Lalu Lintas -->
      <div style="background:#fff;border:1px solid rgba(249,168,212,0.3);border-radius:10px;padding:10px 14px;">
        <p class="label" style="margin-bottom:6px;">Lalu Lintas Koridor</p>
        <p style="font-size:13px;font-weight:700;color:${TRAFFIC_COLOR[d.hazard.trafficColor]};">${d.hazard.traffic}</p>
      </div>
      <!-- Risiko SLA -->
      <div style="background:#fff;border:1px solid rgba(249,168,212,0.3);border-radius:10px;padding:10px 14px;">
        <p class="label" style="margin-bottom:6px;">Tingkat Risiko SLA</p>
        <p style="font-size:13px;font-weight:700;color:${RISK_COLOR[d.hazard.slaRiskColor]};">${d.hazard.slaRiskLabel} (${d.hazard.slaRiskScore})</p>
      </div>
    </div>
  </div>

</body>
</html>`;
}

export function printSuratJalan(order: SlaOrder): void {
  const html = buildHtml(order);
  const win = window.open('', '_blank', 'width=700,height=900,scrollbars=yes');
  if (!win) {
    alert('Popup diblokir. Izinkan popup untuk halaman ini agar bisa mencetak surat jalan.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
    win.onafterprint = () => win.close();
  };
}
