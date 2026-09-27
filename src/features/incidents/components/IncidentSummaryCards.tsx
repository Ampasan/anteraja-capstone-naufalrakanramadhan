import { AlertTriangle, Bike, CheckCircle2 } from 'lucide-react';
import type { IncidentKpiSummary } from '../types';

interface IncidentSummaryCardsProps {
  kpi: IncidentKpiSummary;
}

interface KpiCardProps {
  dotColor: string;
  dotAnimate?: boolean;
  label: string;
  sublabel: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  valueColor?: string;
  borderAccent?: string;
}

function KpiCard({
  dotColor,
  dotAnimate = false,
  label,
  sublabel,
  value,
  icon,
  iconBg,
  valueColor = 'text-[#0F172A]',
  borderAccent = 'border-[#E2E8F0]',
}: KpiCardProps) {
  return (
    <div
      className={`flex-1 min-w-0 bg-white border-2 ${borderAccent} rounded-2xl px-5 py-4
        shadow-[0_2px_8px_0_rgba(15,23,42,0.05)]
        hover:shadow-[0_4px_16px_0_rgba(15,23,42,0.10)]
        hover:-translate-y-0.5
        transition-all duration-200 ease-out
        flex items-center justify-between gap-3`}
    >
      {/* Left: label + value */}
      <div className="flex flex-col gap-1.5">
        {/* Dot + Label */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotColor} ${dotAnimate ? 'animate-pulse' : ''}`}
          />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#475569]">
            {label}
          </span>
        </div>
        {/* Big value */}
        <span className={`text-[40px] font-extrabold leading-none tabular-nums ${valueColor}`}>
          {value}
        </span>
        {/* Sublabel */}
        <span className="text-[11px] text-[#94A3B8] leading-tight">{sublabel}</span>
      </div>

      {/* Right: icon box */}
      <div className={`w-13 h-13 w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}

export function IncidentSummaryCards({ kpi }: IncidentSummaryCardsProps) {
  return (
    <div className="flex gap-3">
      {/* Kritis */}
      <KpiCard
        dotColor="bg-red-500"
        dotAnimate
        label="Kritis / Kendala Aktif"
        sublabel="Butuh penanganan segera"
        value={kpi.critical}
        iconBg="bg-red-50"
        borderAccent="border-red-100"
        icon={<AlertTriangle size={26} className="text-red-400" />}
      />

      {/* Waspada */}
      <KpiCard
        dotColor="bg-amber-400"
        label="Waspada / Kurir Pengganti"
        sublabel="Siap proses pengalihan"
        value={kpi.warning}
        iconBg="bg-[#FFF0F6]"
        borderAccent="border-[#F9A8D4]"
        icon={<Bike size={26} className="text-[#C91076]" />}
      />

      {/* Aman */}
      <KpiCard
        dotColor="bg-emerald-500"
        label="Aman / Kepatuhan 1-Klik"
        sublabel="Pengalihan tepat waktu"
        value={`${kpi.safePercent}%`}
        iconBg="bg-emerald-50"
        borderAccent="border-emerald-100"
        valueColor="text-emerald-600"
        icon={<CheckCircle2 size={26} className="text-emerald-500" />}
      />
    </div>
  );
}
