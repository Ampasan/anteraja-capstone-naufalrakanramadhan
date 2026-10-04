import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileSpreadsheet, FileText, Table } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { downloadFile } from '../../../lib/api';

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

interface IncidentExportDropdownProps {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  incidentCount: number;
}

const OPTIONS: Array<{
  format: ExportFormat;
  icon: typeof Table;
  iconBox: string;
  iconColor: string;
  title: string;
  note: string;
}> = [
  {
    format: 'xlsx',
    icon: FileSpreadsheet,
    iconBox: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
    title: 'Excel Spreadsheet (.xlsx)',
    note: 'Judul kolom identik dengan versi CSV',
  },
  {
    format: 'pdf',
    icon: FileText,
    iconBox: 'bg-red-50 border-red-200',
    iconColor: 'text-red-500',
    title: 'Dokumen Cetak / PDF',
    note: 'Memuat rekapitulasi dan tabel rincian insiden',
  },
  {
    format: 'csv',
    icon: Table,
    iconBox: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
    title: 'Data CSV (.csv)',
    note: 'Paling ringan, cocok untuk diproses ulang',
  },
];

/**
 * Unduh laporan insiden harian lewat `GET /api/incidents/export`.
 */
export function IncidentExportDropdown({
  open,
  onToggle,
  onClose,
  incidentCount,
}: IncidentExportDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [busyFormat, setBusyFormat] = useState<ExportFormat | null>(null);

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

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      if (busyFormat) return;
      setBusyFormat(format);
      try {
        const date = new Date().toISOString().slice(0, 10);
        await downloadFile(
          `/incidents/export?date=${date}&format=${format}`,
          `laporan-insiden-${date}.${format}`,
        );
        onClose();
      } catch (error) {
        window.alert(
          error instanceof Error ? error.message : 'Gagal mengunduh laporan. Coba lagi.',
        );
      } finally {
        setBusyFormat(null);
      }
    },
    [busyFormat, onClose],
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={onToggle}
        disabled={busyFormat !== null}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#F9A8D4] bg-white px-3 sm:px-4 py-2 text-[13px] font-bold text-[#C91076] transition-all duration-150 hover:scale-105 hover:bg-[#FFF0F6] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed sm:px-4"
      >
        <Download size={13} />
        <span className="hidden sm:inline">Laporan Harian</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-72 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_8px_32px_-4px_rgba(15,23,42,0.18)] overflow-hidden animate-fade-in"
        >
          <div className="px-4 py-3 bg-[#FDF2F8] border-b border-[#F3E0EC]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#99004C]">
              Pilih Format Laporan Harian
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5">Insiden pada tanggal berjalan</p>
          </div>

          {OPTIONS.map((option, index) => {
            const Icon = option.icon;
            const isBusy = busyFormat === option.format;
            return (
              <div key={option.format}>
                {index > 0 && <div className="h-px bg-[#F1F5F9] mx-4" />}
                <button
                  type="button"
                  onClick={() => void handleExport(option.format)}
                  role="menuitem"
                  disabled={busyFormat !== null}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition-colors text-left group disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center mt-0.5',
                      option.iconBox,
                    )}
                  >
                    <Icon size={16} className={option.iconColor} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827] group-hover:text-[#C91076] transition-colors">
                      {isBusy ? 'Menyiapkan berkas…' : option.title}
                    </p>
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">{option.note}</p>
                  </div>
                </button>
              </div>
            );
          })}

          <div className="px-4 py-2 border-t border-[#F1F5F9] bg-[#FAFAFA]">
            <p className="text-[10px] text-[#94A3B8]">
              {incidentCount} insiden di tabel · maks. 10.000 baris per berkas
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
