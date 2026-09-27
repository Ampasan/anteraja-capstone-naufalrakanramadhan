import { RefreshCw, ClipboardList, Radio } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface IncidentHeaderProps {
  onRefresh: () => void;
}

export function IncidentHeader({ onRefresh }: IncidentHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 bg-white border border-[#E2E8F0] rounded-2xl px-5 py-4 shadow-[0_2px_8px_0_rgba(201,16,118,0.06)]">
      {/* ── Ikon + Judul & Subtitle ── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center flex-shrink-0 shadow-sm">
          <ClipboardList size={20} className="text-[#C91076]" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-[19px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
              Incident &amp; One-Click Task Reassignment
            </h1>
            {/* Live indicator */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
              <Radio size={9} className="animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="text-[13px] text-[#64748B] font-medium">
            Pantau &amp; alihkan tugas kurir bermasalah dalam kurang dari 30 detik
          </p>
        </div>
      </div>

      {/* ── Tombol Refresh ── */}
      <Button
        variant="primary"
        size="sm"
        onClick={onRefresh}
        className="flex-shrink-0 gap-1.5 rounded-full px-4 hover:scale-105 active:scale-95 transition-transform duration-150"
      >
        <RefreshCw size={13} />
        Segarkan Data
      </Button>
    </div>
  );
}
