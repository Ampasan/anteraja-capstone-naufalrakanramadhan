import { useRef, useEffect } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, Download } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { exportToCSV, exportToPDF } from '../utils/exportReport';
import type { AuditLogEntry } from '../types';

interface ExportDropdownProps {
  entries: AuditLogEntry[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export function ExportDropdown({ entries, open, onToggle, onClose }: ExportDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open, onClose]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={onToggle}
        className="inline-flex items-center gap-2 bg-[#C91076] hover:bg-[#A80060] active:bg-[#8B004F] text-white text-[13px] font-bold px-4 py-2.5 rounded-full transition-colors duration-150 shadow-sm"
      >
        <Download size={15} strokeWidth={2.5} />
        Export Laporan
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-64 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_8px_32px_-4px_rgba(15,23,42,0.15)] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#FDF2F8] border-b border-[#F3E0EC]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#99004C]">
              Pilih Format Ekspor
            </p>
          </div>

          {/* Excel */}
          <button
            onClick={() => { exportToCSV(entries); onClose(); }}
            role="menuitem"
            className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors text-left group"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Export ke Format Excel</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">.xlsx / .csv — siap di Microsoft Excel</p>
            </div>
          </button>

          <div className="h-px bg-[#F1F5F9] mx-4" />

          {/* PDF */}
          <button
            onClick={() => { exportToPDF(entries); onClose(); }}
            role="menuitem"
            className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors text-left group"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center">
              <FileText size={16} className="text-red-500" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#111827]">Export ke Format PDF</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">Dokumen cetak ber-kop Anteraja resmi</p>
            </div>
          </button>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#F1F5F9] bg-[#FAFAFA]">
            <p className="text-[10px] text-[#94A3B8]">{entries.length} catatan akan diekspor</p>
          </div>
        </div>
      )}
    </div>
  );
}
