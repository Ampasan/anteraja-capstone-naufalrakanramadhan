import { useState } from 'react';
import {
  Copy,
  Check,
  CloudRain,
  Thermometer,
  Wrench,
  CircleDot,
  Waves,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AuditLogEntry, PaginationState, ServiceType, IncidentCategory } from '../types';

interface AuditTableProps {
  data: AuditLogEntry[];
  pagination: PaginationState;
  onPageChange: (page: number) => void;
}

const SVC: Record<ServiceType, { cls: string; label: string }> = {
  'NEXT DAY': { cls: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',   label: 'NEXT DAY'  },
  'FROZEN':   { cls: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',   label: 'FROZEN'    },
  'CARGO':    { cls: 'bg-[#1F2937] text-white border-[#374151]',        label: 'CARGO'     },
  'PHARMA':   { cls: 'bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]',   label: 'PHARMA'    },
  'SAME DAY': { cls: 'bg-[#FFF0F6] text-[#C91076] border-[#F9A8D4]',   label: 'SAME DAY'  },
};

type IncidentCfg = { icon: React.ReactNode; cls: string };

function incidentCfg(cat: IncidentCategory): IncidentCfg {
  switch (cat) {
    case 'Cuaca / Hujan':
      return {
        icon: <CloudRain size={14} />,
        cls: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
      };
    case 'Anomali Suhu':
      return {
        icon: <Thermometer size={14} />,
        cls: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
      };
    case 'Mogok Kendaraan':
      return {
        icon: <Wrench size={14} />,
        cls: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
      };
    case 'Ban Bocor':
      return {
        icon: <CircleDot size={14} />,
        cls: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
      };
    case 'Banjir':
      return {
        icon: <Waves size={14} />,
        cls: 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]',
      };
  }
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return (
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0') +
    ' WIB'
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  const MON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()];
  return `${String(d.getDate()).padStart(2, '0')} ${MON} ${d.getFullYear()}`;
}

function CopyBtn({ resi }: { resi: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(resi).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      title={copied ? 'Tersalin!' : 'Klik untuk menyalin nomor resi'}
      aria-label={`Salin nomor resi ${resi}`}
      className={cn(
        'ml-1.5 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center',
        'transition-all duration-150',
        copied
          ? 'bg-emerald-100 text-emerald-600 scale-110'
          : 'bg-[#F9FAFB] text-[#9CA3AF] border border-[#E5E7EB] hover:bg-[#FFF0F6] hover:text-[#C91076] hover:border-[#F9A8D4]',
      )}
    >
      {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
    </button>
  );
}

function Pagination({
  pagination,
  onPageChange,
}: {
  pagination: PaginationState;
  onPageChange: (p: number) => void;
}) {
  const { page, totalPages } = pagination;

  function buildPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const list: (number | '...')[] = [1];
    if (page > 3) list.push('...');
    for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) {
      list.push(p);
    }
    if (page < totalPages - 2) list.push('...');
    list.push(totalPages);
    return list;
  }

  const pages = buildPages();

  const baseBtn =
    'h-9 min-w-[36px] px-2 rounded-lg text-[13px] font-semibold border transition-all duration-150 flex items-center justify-center gap-1';

  return (
    <div className="flex items-center gap-1" role="navigation" aria-label="Navigasi halaman">
      {/* Sebelumnya */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Halaman sebelumnya"
        className={cn(
          baseBtn, 'px-3',
          page === 1
            ? 'text-[#D1D5DB] border-[#E5E7EB] cursor-not-allowed'
            : 'text-[#374151] border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#C91076] hover:text-[#C91076]',
        )}
      >
        <ChevronLeft size={14} />
        Sebelumnya
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e-${i}`} className="w-9 text-center text-[13px] text-[#9CA3AF]">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            aria-label={`Halaman ${p}`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              baseBtn,
              p === page
                ? 'bg-[#C91076] text-white border-[#C91076] shadow-sm scale-105'
                : 'text-[#374151] border-[#D1D5DB] hover:bg-[#FFF0F6] hover:border-[#C91076] hover:text-[#C91076]',
            )}
          >
            {p}
          </button>
        ),
      )}

      {/* Berikutnya */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Halaman berikutnya"
        className={cn(
          baseBtn, 'px-3',
          page === totalPages
            ? 'text-[#D1D5DB] border-[#E5E7EB] cursor-not-allowed'
            : 'text-[#374151] border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#C91076] hover:text-[#C91076]',
        )}
      >
        Berikutnya
        <ChevronRight size={14} />
      </button>
    </div>
  );
}


export function AuditTable({ data, pagination, onPageChange }: AuditTableProps) {
  const { totalItems, pageSize, page } = pagination;



  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">

      {/* ── Tabel ── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#FDF2F8]">
              {[
                { label: 'NO. RESI & LAYANAN', hint: 'Nomor resi paket dan jenis layanan pengiriman' },
                { label: 'WAKTU SELESAI',       hint: 'Jam dan tanggal pengalihan berhasil diselesaikan' },
                { label: 'PENGALIHAN KURIR',    hint: 'Kurir asal yang terkendala → kurir pengganti' },
                { label: 'JENIS KENDALA',       hint: 'Masalah yang menyebabkan pengalihan terjadi' },
              ].map(({ label, hint }) => (
                <th
                  key={label}
                  title={hint}
                  className="px-5 py-3.5 text-left text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody key={page}>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🔍</span>
                    <p className="text-[15px] font-semibold text-[#374151]">Tidak ada catatan ditemukan</p>
                    <p className="text-[13px] text-[#9CA3AF]">Coba ubah filter atau reset untuk melihat semua data</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((entry, idx) => {
                const inc = incidentCfg(entry.incidentCategory);
                const svc = SVC[entry.serviceType];
                const isLast = idx === data.length - 1;

                return (
                  <tr
                    key={entry.id}
                    style={{
                      animation: `auditRowIn 0.22s ease ${idx * 45}ms both`,
                    }}
                    className={cn(
                      'transition-colors duration-100',
                      !isLast && 'border-b border-[#F3F4F6]',
                      'hover:bg-[#FFF8FB]',
                    )}
                  >
                    {/* Col 1: Resi + service */}
                    <td className="px-5 py-5">
                      <div className="flex items-center">
                        <span
                          className="text-[14px] font-semibold text-[#111827] tracking-tight font-mono"
                          title={`Nomor Resi: ${entry.resi}`}
                        >
                          {entry.resi}
                        </span>
                        <CopyBtn resi={entry.resi} />
                      </div>
                      <span
                        className={cn(
                          'mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md',
                          'text-[11.5px] font-bold uppercase tracking-wide border',
                          svc.cls,
                        )}
                      >
                        {svc.label}
                      </span>
                    </td>

                    {/* Col 2: Waktu selesai */}
                    <td className="px-5 py-5">
                      <p className="text-[15px] font-bold text-[#111827] leading-tight tabular-nums">
                        {fmtTime(entry.completedAt)}
                      </p>
                      <p className="text-[12.5px] text-[#6B7280] mt-1 font-medium">
                        {fmtDate(entry.completedAt)}
                      </p>
                    </td>

                    {/* Col 3: Pengalihan kurir */}
                    <td className="px-5 py-5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Kurir asal */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13.5px] font-medium text-[#374151] leading-tight">
                            {entry.fromCourier}
                          </span>
                          <span className="text-[11px] font-semibold text-[#9CA3AF] mt-0.5 font-mono">
                            {entry.fromCourierCode}
                          </span>
                        </div>

                        {/* Arrow */}
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center">
                          <ArrowRight size={13} className="text-[#C91076]" strokeWidth={2.5} />
                        </div>

                        {/* Kurir pengganti */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-[13.5px] font-bold text-[#059669] leading-tight">
                            {entry.toCourier}
                          </span>
                          <span className="text-[11px] font-semibold text-[#34D399] mt-0.5 font-mono">
                            {entry.toCourierCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Col 4: Kendala */}
                    <td className="px-5 py-5">
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full',
                          'text-[13px] font-semibold border',
                          inc.cls,
                        )}
                        title={`Kategori: ${entry.incidentCategory}`}
                      >
                        {inc.icon}
                        {entry.incidentDetail}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-[#F3F4F6] bg-[#FAFAFA]">
        {/* Info — */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-[#6B7280]">Menampilkan</span>
          <span className="text-[14px] font-extrabold text-[#111827] bg-[#F3F4F6] px-2 py-0.5 rounded-md">
            {Math.min(pageSize, totalItems)}
          </span>
          <span className="text-[13px] text-[#6B7280]">dari</span>
          <span className="text-[14px] font-extrabold text-[#C91076]">
            {totalItems}
          </span>
          <span className="text-[13px] text-[#6B7280]">catatan audit terverifikasi</span>
        </div>

        {totalItems > 0 && (
          <Pagination pagination={pagination} onPageChange={onPageChange} />
        )}
      </div>
    </div>
  );
}
