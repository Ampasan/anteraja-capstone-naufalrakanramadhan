import { useRef, useEffect, useState, useCallback } from 'react';
import { FileSpreadsheet, FileText, ChevronDown, Download, Table } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { downloadFile } from '../../../lib/api';
import type { AuditLogEntry } from '../types';

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

interface ExportDropdownProps {
  /** Jumlah catatan yang sedang tampil di tabel (hanya untuk keterangan). */
  entries: AuditLogEntry[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
}

/**
 * Ekspor laporan audit dilayani backend (`GET /api/audit-logs/export`)
 */
export function ExportDropdown({ entries, open, onToggle, onClose }: ExportDropdownProps) {
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
        const stamp = new Date().toISOString().slice(0, 10);
        await downloadFile(`/audit-logs/export?format=${format}`, `laporan-audit-${stamp}.${format}`);
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

  const options: Array<{
    format: ExportFormat;
    icon: typeof FileSpreadsheet;
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
      note: 'Ringkasan KPI pada sheet pertama, tabel detail pada sheet kedua',
    },
    {
      format: 'pdf',
      icon: FileText,
      iconBox: 'bg-red-50 border-red-200',
      iconColor: 'text-red-500',
      title: 'Dokumen Cetak / PDF',
      note: 'Kop resmi Anteraja, maksimal 1.000 baris per berkas',
    },
    {
      format: 'csv',
      icon: Table,
      iconBox: 'bg-blue-50 border-blue-200',
      iconColor: 'text-blue-600',
      title: 'Data CSV (.csv)',
      note: 'Dilengkapi tautan URL Cloudinary foto bukti',
    },
  ];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={onToggle}
        disabled={busyFormat !== null}
        className="inline-flex items-center gap-2 bg-[#C91076] hover:bg-[#A80060] active:bg-[#8B004F] text-white text-[13px] font-bold px-4 py-2.5 rounded-full transition-colors duration-150 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
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
          className="absolute right-0 top-full mt-2 w-72 z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_8px_32px_-4px_rgba(15,23,42,0.18)] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#FDF2F8] border-b border-[#F3E0EC]">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#99004C]">
              Pilih Format Ekspor
            </p>
            <p className="text-[10px] text-[#64748B] mt-0.5">
              Diproses server &lt; 3 detik · mencakup seluruh riwayat hub
            </p>
          </div>

          {options.map((option, index) => {
            const Icon = option.icon;
            const isBusy = busyFormat === option.format;
            return (
              <div key={option.format}>
                {index > 0 && <div className="h-px bg-[#F1F5F9] mx-4" />}
                <button
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
                    <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                      {option.note}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[#F1F5F9] bg-[#FAFAFA]">
            <p className="text-[10px] text-[#94A3B8]">
              {entries.length} catatan di tabel · ekspor penuh (maks. 10.000 baris)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
