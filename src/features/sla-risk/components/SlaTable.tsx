import { useState } from 'react';
import {
  Copy, Map, Info, CloudRain, Thermometer,
  CloudDrizzle, Users, Sun, Navigation, Check,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { SlaOrder, SlaRisk, ServiceType, ConditionKey } from '../types';

// ─── Service badge ──
const SERVICE_BADGE: Record<ServiceType, { bg: string; text: string; border: string }> = {
  Instant:      { bg: 'bg-[#FFF0F6]',  text: 'text-[#C91076]', border: 'border-[#F9A8D4]'  },
  'Same Day':   { bg: 'bg-pink-50',    text: 'text-pink-700',  border: 'border-pink-200'    },
  'Next Day':   { bg: 'bg-violet-50',  text: 'text-violet-700',border: 'border-violet-200'  },
  Regular:      { bg: 'bg-orange-50',  text: 'text-orange-700',border: 'border-orange-200'  },
  Dokumen:      { bg: 'bg-teal-50',    text: 'text-teal-700',  border: 'border-teal-200'    },
  Cargo:        { bg: 'bg-sky-50',     text: 'text-sky-700',   border: 'border-sky-200'     },
  'Mini Cargo': { bg: 'bg-indigo-50',  text: 'text-indigo-700',border: 'border-indigo-200'  },
  PHARMA:       { bg: 'bg-purple-50',  text: 'text-purple-700',border: 'border-purple-200'  },
  Frozen:       { bg: 'bg-blue-50',    text: 'text-blue-700',  border: 'border-blue-200'    },
};

// ─── Condition ───
const CONDITION_CONFIG: Record<ConditionKey, {
  bg: string; text: string; border: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = {
  'heavy-rain-traffic': { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-200',     icon: CloudRain    },
  'temp-box':           { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    icon: Thermometer  },
  'light-rain':         { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200',     icon: CloudDrizzle },
  'crowded':            { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   icon: Users        },
  'normal-sunny':       { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: Sun          },
  'road-clear':         { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', icon: Navigation   },
};

// ─── SLA Risk ───
const SLA_RISK_CONFIG: Record<SlaRisk, { dot: string; bg: string; text: string; border: string; rowAccent: string }> = {
  Kritis:  { dot: 'bg-red-500',     bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     rowAccent: 'border-l-red-400'     },
  Waspada: { dot: 'bg-amber-400',   bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   rowAccent: 'border-l-amber-400'   },
  Aman:    { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', rowAccent: 'border-l-emerald-400' },
};

// ─── Stagger map for rows ──
const STAGGER = ['stagger-1','stagger-2','stagger-3','stagger-4','stagger-5','stagger-6','stagger-7','stagger-8'];

// ─── Pagination ────
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [];
  if (current > 2) pages.push(1);
  if (current > 3) pages.push('…');
  for (let i = Math.max(1, current - 1); i <= Math.min(total, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('…');
  if (current < total - 1) pages.push(total);
  return pages;
}

// ─── Component ───
interface SlaTableProps {
  orders: SlaOrder[];
  displayTotal: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenDetail: (order: SlaOrder) => void;
  onOpenMap: (order: SlaOrder) => void;
}

export function SlaTable({
  orders, displayTotal, currentPage, totalPages,
  onPageChange, onOpenDetail, onOpenMap,
}: SlaTableProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (waybill: string) => {
    void navigator.clipboard.writeText(waybill);
    setCopiedId(waybill);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="animate-fade-up stagger-5 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] overflow-hidden">

      {/* ── Table header label ── */}
      <div className="px-5 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
        <span className="text-xs font-bold text-[#475569]">Daftar Pengiriman Aktif</span>
        <span className="text-[11px] text-[#94A3B8]">
          Klik <span className="font-semibold text-[#C91076]">Detail</span> untuk info lengkap · Klik <span className="font-semibold text-[#C91076]">Peta</span> untuk lacak posisi
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E2E8F0] bg-[#FAFBFC]">
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] whitespace-nowrap">No. Resi &amp; Layanan</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] whitespace-nowrap">Tujuan Pengantaran</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] whitespace-nowrap">Keadaan</th>
              <th className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] whitespace-nowrap">Sisa SLA &amp; Status</th>
              <th className="text-right px-5 py-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] whitespace-nowrap">Aksi Cepat</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F5F9]">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl">🔍</span>
                    <p className="text-sm font-semibold text-[#475569]">Tidak ada pengiriman ditemukan</p>
                    <p className="text-xs text-[#94A3B8]">Coba ubah kata kunci atau reset filter di atas</p>
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order, idx) => {
                const svc  = SERVICE_BADGE[order.serviceType] ?? SERVICE_BADGE.Regular;
                const cond = CONDITION_CONFIG[order.condition.key];
                const risk = SLA_RISK_CONFIG[order.slaRisk];
                const CondIcon = cond.icon;
                const isCopied = copiedId === order.waybillNumber;

                return (
                  <tr
                    key={order.waybillNumber}
                    className={cn(
                      'animate-fade-in border-l-[3px] transition-all duration-150',
                      'hover:bg-[#FAFBFC] hover:shadow-[inset_0_0_0_1px_#E2E8F0]',
                      risk.rowAccent,
                      STAGGER[idx] ?? '',
                    )}
                  >
                    {/* ── Resi & Layanan ── */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#C91076] text-sm font-mono tracking-tight">
                            {order.waybillNumber}
                          </span>
                          <button
                            onClick={() => handleCopy(order.waybillNumber)}
                            title={isCopied ? 'Tersalin!' : 'Salin nomor resi'}
                            className={cn(
                              'transition-all duration-200 rounded p-0.5',
                              isCopied
                                ? 'text-emerald-500 bg-emerald-50'
                                : 'text-[#CBD5E1] hover:text-[#C91076] hover:bg-[#FFF0F6]',
                            )}
                            aria-label="Salin nomor resi"
                          >
                            {isCopied ? <Check size={11} /> : <Copy size={11} />}
                          </button>
                        </div>
                        <span className={cn(
                          'self-start inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wide',
                          svc.bg, svc.text, svc.border,
                        )}>
                          {order.serviceType}
                        </span>
                      </div>
                    </td>

                    {/* ── Tujuan ── */}
                    <td className="px-5 py-4 align-middle">
                      <p className="font-bold text-[#0F172A] text-sm leading-snug">{order.destinationName}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5 font-medium">{order.destinationArea}</p>
                    </td>

                    {/* ── Keadaan ── */}
                    <td className="px-5 py-4 align-middle">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border whitespace-nowrap',
                        cond.bg, cond.text, cond.border,
                      )}>
                        <CondIcon size={12} />
                        {order.condition.label}
                      </span>
                    </td>

                    {/* ── Sisa SLA ── */}
                    <td className="px-5 py-4 align-middle">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border whitespace-nowrap',
                        risk.bg, risk.text, risk.border,
                      )}>
                        <span className={cn('w-2 h-2 rounded-full flex-shrink-0', risk.dot,
                          order.slaRisk === 'Kritis' && 'animate-pulse',
                        )} />
                        {order.slaRemainingMin} Mnt · {order.slaRisk}
                      </span>
                    </td>

                    {/* ── Aksi Cepat ── */}
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onOpenMap(order)}
                          title={`Lacak posisi kurir ${order.courierId} di peta`}
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold text-[#C91076] bg-[#FFF0F6] border border-[#F9A8D4] hover:bg-[#FFE0F0] hover:border-[#C91076] hover:scale-[1.04] active:scale-[0.97] transition-all duration-150"
                        >
                          <Map size={12} className="text-[#C91076]" />
                          Peta
                        </button>
                        <button
                          onClick={() => onOpenDetail(order)}
                          title="Lihat detail lengkap pengiriman ini"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold text-[#475569] bg-white border border-[#E2E8F0] hover:border-[#C91076] hover:text-[#C91076] hover:bg-[#FFF0F6] hover:scale-[1.04] active:scale-[0.97] transition-all duration-150"
                        >
                          <Info size={12} />
                          Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E2E8F0] bg-[#FAFBFC]">
        <span className="text-xs text-[#64748B]">
          Menampilkan{' '}
          <span className="font-bold text-[#0F172A]">{orders.length}</span>{' '}
          dari{' '}
          <span className="font-bold text-[#0F172A]">{displayTotal}</span>{' '}
          pengiriman aktif
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            title="Halaman sebelumnya"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>

          {buildPages(currentPage, totalPages).map((p, idx) =>
            p === '…' ? (
              <span key={`e-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-[#94A3B8]">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p as number)}
                className={cn(
                  'w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150',
                  currentPage === p
                    ? 'bg-[#C91076] text-white shadow-sm scale-[1.05]'
                    : 'bg-white text-[#475569] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:scale-[1.04]',
                )}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            title="Halaman berikutnya"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

    </div>
  );
}
