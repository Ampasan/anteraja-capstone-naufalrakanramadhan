import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { ExportDropdown } from './ExportDropdown';
import type { AuditLogEntry } from '../types';

interface AuditHeaderProps {
  filteredEntries: AuditLogEntry[];
}

export function AuditHeader({ filteredEntries }: AuditHeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl px-6 py-5 flex items-center justify-between gap-4 shadow-sm">

      {/* Kiri: icon + judul + subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center">
          <ClipboardList size={22} className="text-[#C91076]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-[20px] font-extrabold text-[#111827] leading-tight tracking-tight">
            Audit Log &amp; Riwayat Operasional
          </h1>
          <p className="text-[13.5px] text-[#4B5563] mt-0.5 leading-snug">
            Rekapitulasi jejak digital pengalihan paket dan penanganan kendala{' '}
            <span className="font-semibold text-[#C91076]">Hub Tebet</span>
          </p>
        </div>
      </div>

      {/* Kanan: hint + tombol export */}
      <div className="flex-shrink-0 flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-[11px] font-semibold text-[#9CA3AF] leading-none">Unduh laporan</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">Excel atau PDF</p>
        </div>
        <ExportDropdown
          entries={filteredEntries}
          open={exportOpen}
          onToggle={() => setExportOpen((v) => !v)}
          onClose={() => setExportOpen(false)}
        />
      </div>
    </div>
  );
}
