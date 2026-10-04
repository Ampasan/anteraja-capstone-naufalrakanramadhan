import { useState, type ReactNode } from 'react';
import {
  Copy,
  Check,
  CloudRain,
  Thermometer,
  Wrench,
  CircleDot,
  MapPin,
  Waves,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AuditLogEntry, PaginationState, IncidentCategory, ReportStatus } from '../types';
import { EvidencePhotoModal, type EvidenceModalData } from '../../../components/evidence/EvidencePhotoModal';

interface AuditTableProps {
  data: AuditLogEntry[];
  pagination: PaginationState;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

const SVC: Partial<Record<string, { cls: string; label: string }>> = {
  'NEXT DAY':  { cls: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',   label: 'NEXT DAY'  },
  'FROZEN':    { cls: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]',   label: 'FROZEN'    },
  'CARGO':     { cls: 'bg-[#1F2937] text-white border-[#374151]',        label: 'CARGO'     },
  'PHARMA':    { cls: 'bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]',   label: 'PHARMA'    },
  'SAME DAY':  { cls: 'bg-[#FFF0F6] text-[#C91076] border-[#F9A8D4]',   label: 'SAME DAY'  },
  'INSTANT':   { cls: 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]',   label: 'INSTANT'   },
  'REGULAR':   { cls: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',   label: 'REGULAR'   },
  'DOKUMEN':   { cls: 'bg-[#FEFCE8] text-[#A16207] border-[#FDE68A]',   label: 'DOKUMEN'   },
  'MINI CARGO': { cls: 'bg-[#374151] text-white border-[#4B5563]',      label: 'MINI CARGO' },
};

/** Badge cadangan bila layanan tidak dikenal — mencegah render crash. */
const SVC_FALLBACK = {
  cls: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  label: 'LAYANAN',
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
    case 'Alamat tidak ditemukan':
      return {
        icon: <MapPin size={14} />,
        cls: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
      };
    case 'Banjir':
      return {
        icon: <Waves size={14} />,
        cls: 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]',
      };
    case 'Macet Total':
      return {
        icon: <AlertTriangle size={14} />,
        cls: 'bg-[#FFF7ED] text-[#C2410C] border-[#FED7AA]',
      };
    default:
      // Kategori tak dikenal tetap harus dirender — jangan sampai crash.
      return {
        icon: <CircleDot size={14} />,
        cls: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]',
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

/**
 * Status laporan tiap baris riwayat.
 */
const STATUS_CFG: Record<ReportStatus, { cls: string; icon: ReactNode }> = {
  Eskalasi: {
    cls: 'bg-[#FFF7ED] text-[#C2410C] border-[#FDBA74]',
    icon: <AlertTriangle size={13} strokeWidth={2.5} />,
  },
  Selesai: {
    cls: 'bg-[#DCFCE7] text-[#15803D] border-[#86EFAC]',
    icon: <CheckCircle2 size={13} strokeWidth={2.5} />,
  },
};

function StatusBadge({ status }: { status: ReportStatus }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.Selesai;
  return (
    <span
      title={`Status Laporan: ${status}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap px-2.5 sm:px-3 py-1.5 text-[12px] sm:text-[13px]',
        cfg.cls,
      )}
    >
      {cfg.icon}
      {status}
    </span>
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


export function AuditTable({ data, pagination, isLoading = false, onPageChange }: AuditTableProps) {
  const { totalItems, pageSize, page } = pagination;
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceModalData | null>(null);

  const openEvidenceModal = (entry: AuditLogEntry) => {
    setSelectedEvidence({
      resi: entry.resi,
      serviceType: entry.serviceType,
      category: entry.incidentCategory,
      detail: entry.incidentDetail,
      caption: entry.evidenceCaption,
      imageUrl: entry.evidenceImageUrl,
      publicId: entry.evidencePublicId,
      timestamp: `${fmtTime(entry.completedAt)} · ${fmtDate(entry.completedAt)}`,
      fromCourier: entry.fromCourier,
      fromCourierCode: entry.fromCourierCode,
      toCourier: entry.toCourier,
      toCourierCode: entry.toCourierCode,
    });
  };

  return (
    <>
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">

        {/* ── Tabel ── */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#FDF2F8]">
                <th title="Nomor resi paket dan jenis layanan pengiriman" className="px-3 sm:px-5 py-3.5 text-left text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help">
                  NO. RESI &amp; LAYANAN
                </th>
                <th title="Posisi laporan saat ini: Dialihkan, Eskalasi, atau Selesai" className="px-3 sm:px-5 py-3.5 text-left text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help">
                  STATUS LAPORAN
                </th>
                <th title="Jam dan tanggal pengalihan berhasil diselesaikan" className="hidden sm:table-cell px-5 py-3.5 text-left text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help">
                  WAKTU SELESAI
                </th>
                <th title="Kurir asal yang terkendala → kurir pengganti" className="px-3 sm:px-5 py-3.5 text-left text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help">
                  PENGALIHAN KURIR
                </th>
                <th title="Masalah yang menyebabkan pengalihan terjadi" className="hidden md:table-cell px-5 py-3.5 text-left text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help">
                  JENIS KENDALA
                </th>
                <th title="Foto dokumentasi bukti kendala & verifikasi lapangan" className="px-3 sm:px-5 py-3.5 text-center text-[11.5px] font-extrabold uppercase tracking-widest text-[#99004C] whitespace-nowrap border-b-2 border-[#F0D0E0] cursor-help">
                  FOTO BUKTI
                </th>
              </tr>
            </thead>

            <tbody key={page}>
              {data.length === 0 && isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span
                        className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#F9A8D4] border-t-[#C91076]"
                        aria-hidden="true"
                      />
                      <p className="text-[15px] font-semibold text-[#64748B]">Memuat riwayat…</p>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
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
                  const svc = SVC[(entry.serviceType ?? '').toUpperCase()] ?? SVC_FALLBACK;
                  const isLast = idx === data.length - 1;
                  const isColdChain = entry.incidentCategory === 'Anomali Suhu';

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
                      <td className="px-3 sm:px-5 py-4 sm:py-5">
                        <div className="flex items-center">
                          <span
                            className="text-[12px] sm:text-[14px] font-semibold text-[#111827] tracking-tight font-mono"
                            title={`Nomor Resi: ${entry.resi}`}
                          >
                            {entry.resi}
                          </span>
                          <CopyBtn resi={entry.resi} />
                        </div>
                        <span
                          className={cn(
                            'mt-2 inline-flex items-center px-2.5 py-0.5 rounded-md',
                            'text-[11px] sm:text-[11.5px] font-bold uppercase tracking-wide border',
                            svc.cls,
                          )}
                        >
                          {svc.label}
                        </span>
                        {/* Waktu selesai — mobile only (hidden sm column) */}
                        <p className="sm:hidden text-[11px] text-[#6B7280] mt-1.5 font-medium tabular-nums">
                          {fmtTime(entry.completedAt)} · {fmtDate(entry.completedAt)}
                        </p>
                        {/* Tombol Bukti — mobile only */}
                        <div className="sm:hidden mt-2">
                          <button
                            type="button"
                            onClick={() => openEvidenceModal(entry)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FFF0F6] border border-[#F9A8D4] text-[#C91076] text-[11px] font-bold"
                          >
                            <Camera size={12} />
                            Lihat Foto Bukti
                          </button>
                        </div>
                      </td>

                      {/* Col 2: Status laporan — selalu tampil, apa pun lebar layar */}
                      <td className="px-3 sm:px-5 py-4 sm:py-5">
                        <StatusBadge status={entry.reportStatus} />
                      </td>

                      {/* Col 3: Waktu selesai — hidden on mobile */}
                      <td className="hidden sm:table-cell px-5 py-4 sm:py-5">
                        <p className="text-[15px] font-bold text-[#111827] leading-tight tabular-nums">
                          {fmtTime(entry.completedAt)}
                        </p>
                        <p className="text-[12.5px] text-[#6B7280] mt-1 font-medium">
                          {fmtDate(entry.completedAt)}
                        </p>
                      </td>

                      {/* Col 4: Pengalihan kurir */}
                      <td className="px-3 sm:px-5 py-4 sm:py-5">
                        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-wrap">
                          {/* Kurir asal */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] sm:text-[13.5px] font-medium text-[#374151] leading-tight">
                              {entry.fromCourier}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-semibold text-[#9CA3AF] mt-0.5 font-mono">
                              {entry.fromCourierCode}
                            </span>
                          </div>

                          {/* Arrow */}
                          <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center">
                            <ArrowRight size={11} className="text-[#C91076]" strokeWidth={2.5} />
                          </div>

                          {/* Kurir pengganti */}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] sm:text-[13.5px] font-bold text-[#059669] leading-tight">
                              {entry.toCourier}
                            </span>
                            <span className="text-[10px] sm:text-[11px] font-semibold text-[#34D399] mt-0.5 font-mono">
                              {entry.toCourierCode}
                            </span>
                          </div>
                        </div>
                        {/* Kendala — mobile only (hidden md column) */}
                        <div className="md:hidden mt-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
                              'text-[11px] font-semibold border',
                              inc.cls,
                            )}
                          >
                            {inc.icon}
                            {entry.incidentCategory}
                          </span>
                        </div>
                      </td>

                      {/* Col 5: Kendala — hidden on mobile */}
                      <td className="hidden md:table-cell px-5 py-4 sm:py-5">
                        <span
                          className={cn(
                            'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full',
                            'text-[13px] font-semibold border',
                            inc.cls,
                          )}
                          title={`Kategori: ${entry.incidentCategory}`}
                        >
                          {inc.icon}
                          {entry.incidentCategory}
                        </span>
                      </td>

                      {/* Col 6: Foto Bukti */}
                      <td className="px-3 sm:px-5 py-4 sm:py-5 text-center">
                        {isColdChain ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-[11px] font-bold">
                            <Thermometer size={12} />
                            Tidak Diperlukan
                          </span>
                        ) : entry.evidenceImageUrl ? (
                          <button
                            type="button"
                            onClick={() => openEvidenceModal(entry)}
                            className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#CBD5E1] bg-white hover:border-[#F9A8D4] hover:bg-[#FFF0F6] text-[#334155] hover:text-[#C91076] transition-all shadow-sm hover:shadow hover:scale-[1.02] active:scale-[0.98]"
                            title="Klik untuk melihat foto bukti pop-up"
                          >
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-900 border border-[#E2E8F0] flex-shrink-0">
                              <img
                                src={entry.evidenceImageUrl}
                                alt={`Bukti ${entry.resi}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={12} className="text-white" />
                              </div>
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-[12px] font-bold leading-tight text-[#1E293B] group-hover:text-[#C91076] flex items-center gap-1">
                                Lihat Foto
                                <ExternalLink size={10} className="opacity-60" />
                              </span>
                              <span className="text-[10px] text-[#64748B] font-medium leading-none mt-0.5">
                                Bukti Foto
                              </span>
                            </div>
                          </button>
                        ) : (
                          /* Tanpa URL bukti: jangan render <img src=""> (React warning) */
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#94A3B8] text-[11px] font-bold"
                            title="Log ini tidak memiliki foto bukti"
                          >
                            <Camera size={12} />
                            Tidak Ada Foto
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3.5 sm:py-4 border-t border-[#F3F4F6] bg-[#FAFAFA]">
          {/* Info */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] sm:text-[13px] text-[#6B7280]">Menampilkan</span>
            <span className="text-[13px] sm:text-[14px] font-extrabold text-[#111827] bg-[#F3F4F6] px-2 py-0.5 rounded-md">
              {Math.min(pageSize, totalItems)}
            </span>
            <span className="text-[12px] sm:text-[13px] text-[#6B7280]">dari</span>
            <span className="text-[13px] sm:text-[14px] font-extrabold text-[#C91076]">
              {totalItems}
            </span>
            <span className="text-[12px] sm:text-[13px] text-[#6B7280]">catatan audit terverifikasi</span>
          </div>

          {totalItems > 0 && (
            <Pagination pagination={pagination} onPageChange={onPageChange} />
          )}
        </div>
      </div>

      {/* Pop-up Modal Foto Bukti */}
      <EvidencePhotoModal
        open={!!selectedEvidence}
        data={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </>
  );
}
