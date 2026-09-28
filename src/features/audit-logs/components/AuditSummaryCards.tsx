import { BadgeCheck, Hourglass, ShieldCheck } from 'lucide-react';
import type { AuditKpi } from '../types';

interface AuditSummaryCardsProps {
  kpi: AuditKpi;
}

export function AuditSummaryCards({ kpi }: AuditSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* Card 1 — Total Pengalihan */}
      <KpiCard
        delay={0}
        bg="bg-[#FFF1F6]"
        border="border-[#FBCFE8]"
        dotColor="bg-[#EF4444]"
        labelColor="text-[#BE123C]"
        label="Total Pengalihan Selesai"
        icon={<BadgeCheck size={26} className="text-[#EF4444]" />}
        iconRingColor="bg-[#FEE2E2] border-[#FECACA]"
        value={String(kpi.totalCompleted)}
        unit="Paket"
        hint="Paket berhasil dialihkan ke kurir pengganti dan selesai dikirim"
        valueColor="text-[#111827]"
      />

      {/* Card 2 — Waktu Penanganan */}
      <KpiCard
        delay={80}
        bg="bg-[#FFFBEB]"
        border="border-[#FDE68A]"
        dotColor="bg-[#F59E0B]"
        labelColor="text-[#B45309]"
        label="Rata-rata Waktu Penanganan"
        icon={<Hourglass size={26} className="text-[#F59E0B]" />}
        iconRingColor="bg-[#FEF3C7] border-[#FDE68A]"
        value={String(kpi.avgHandlingSeconds)}
        unit="detik"
        hint="Rata-rata durasi sejak insiden terdeteksi hingga kurir pengganti ditetapkan"
        valueColor="text-[#111827]"
      />

      {/* Card 3 — Kepatuhan SLA */}
      <KpiCard
        delay={160}
        bg="bg-[#F0FDF4]"
        border="border-[#A7F3D0]"
        dotColor="bg-[#10B981]"
        labelColor="text-[#065F46]"
        label="Kepatuhan SLA Terselamatkan"
        icon={<ShieldCheck size={26} className="text-[#10B981]" />}
        iconRingColor="bg-[#D1FAE5] border-[#A7F3D0]"
        value={`${kpi.slaComplianceRate}%`}
        unit={`${kpi.slaCompliantCount}/${kpi.totalCompleted} Paket`}
        hint="Persentase paket yang tetap terkirim tepat waktu setelah pengalihan"
        valueColor="text-[#111827]"
      />

    </div>
  );
}

interface KpiCardProps {
  delay: number;
  bg: string;
  border: string;
  dotColor: string;
  labelColor: string;
  label: string;
  icon: React.ReactNode;
  iconRingColor: string;
  value: string;
  unit: string;
  hint: string;
  valueColor: string;
}

function KpiCard({
  delay,
  bg,
  border,
  dotColor,
  labelColor,
  label,
  icon,
  iconRingColor,
  value,
  unit,
  hint,
  valueColor,
}: KpiCardProps) {
  return (
    <div
      style={{
        animation: `auditKpiPop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms both`,
      }}
      className={`${bg} border ${border} rounded-2xl px-5 py-4 flex flex-col gap-3
        shadow-sm hover:shadow-md hover:-translate-y-0.5
        transition-all duration-200 cursor-default`}
    >
      {/* Baris atas: dot + label + icon */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${dotColor}`} />
          <span className={`text-[12px] font-bold uppercase tracking-wider ${labelColor} leading-snug`}>
            {label}
          </span>
        </div>
        {/* Icon dalam lingkaran kecil */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl border ${iconRingColor} flex items-center justify-center`}>
          {icon}
        </div>
      </div>

      {/* Angka utama + unit */}
      <div className="flex items-baseline gap-2">
        <span className={`text-[38px] font-extrabold leading-none tracking-tight ${valueColor}`}>
          {value}
        </span>
        <span className="text-[14px] font-semibold text-[#6B7280]">{unit}</span>
      </div>

      {/* Hint/deskripsi */}
      <p className="text-[12px] text-[#6B7280] leading-snug border-t border-black/5 pt-2">
        {hint}
      </p>
    </div>
  );
}
