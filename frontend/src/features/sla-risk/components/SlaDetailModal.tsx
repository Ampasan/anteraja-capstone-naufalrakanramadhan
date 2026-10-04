import {
  Truck, Package, TrendingUp, CheckCircle2, Clock,
  Sun, Printer, ExternalLink, X, Gauge, ShieldCheck, AlertTriangle,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../../lib/utils';
import { printSuratJalan } from '../../../lib/printSuratJalan';
import type { SlaOrder, TimelineStep } from '../types';

// ─── Service badge ───
const SVC: Record<string, { bg: string; text: string; border: string }> = {
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

// ─── Section wrapper ───
function Section({
  icon: Icon, title, children, accent = false,
}: {
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section className={cn(
      'rounded-xl overflow-hidden border flex-shrink-0',
      accent ? 'border-[#F9A8D4]/60' : 'border-[#E2E8F0]',
    )}>
      <div className={cn(
        'flex items-center gap-2 px-4 py-3 border-b',
        accent
          ? 'bg-gradient-to-r from-[#FFF0F6] to-[#FFF5F9] border-[#F9A8D4]/50'
          : 'bg-[#FAFBFC] border-[#E2E8F0]',
      )}>
        {accent ? (
          <span className="w-2 h-2 rounded-full bg-[#C91076] flex-shrink-0" />
        ) : Icon ? (
          <Icon size={15} className="text-[#C91076] flex-shrink-0" />
        ) : null}
        <span className={cn('text-sm font-bold', accent ? 'text-[#C91076]' : 'text-[#0F172A]')}>
          {title}
        </span>
      </div>
      {children}
    </section>
  );
}

// ─── Timeline Item ───
function TimelineItem({ step, isLast }: { step: TimelineStep; isLast: boolean }) {
  const isDone = step.status === 'done';
  const isLate = step.status === 'late';
  const badgeClr: Record<string, string> = {
    green: 'text-emerald-600',
    amber: 'text-amber-600',
    red:   'text-red-600',
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
          {step.status === 'done' ? (
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
              <CheckCircle2 size={13} className="text-white" />
            </div>
          ) : step.status === 'late' ? (
            /* Tenggat terlewati — lingkaran merah, bukan centang hijau,
               supaya kepatuhan SLA terbaca benar sejak sekilas pandang. */
            <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
              <AlertTriangle size={12} className="text-white" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full border-2 border-[#C91076] bg-[#FFF0F6] flex items-center justify-center">
              <Clock size={11} className="text-[#C91076]" />
            </div>
          )}
        {!isLast && <div className="w-px bg-[#E2E8F0] mt-1.5 flex-1 min-h-[28px]" />}
      </div>

      <div className={cn('flex-1 min-w-0 flex items-start justify-between gap-3', isLast ? 'pb-0' : 'pb-5')}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-sm font-bold leading-snug',
              isLate ? 'text-red-600' : isDone ? 'text-[#0F172A]' : 'text-[#C91076]',
            )}>
              {step.title}
            </span>
            {step.badge && step.badgeColor && (
              <span className={cn('text-[11px] font-semibold', badgeClr[step.badgeColor] ?? 'text-slate-600')}>
                {step.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#64748B] mt-0.5 leading-relaxed font-medium">{step.subtitle}</p>
        </div>
        <div className="flex-shrink-0 text-right mt-0.5">
          {step.time ? (
            <span className="text-sm font-bold text-[#475569] whitespace-nowrap">{step.time}</span>
          ) : step.etaBadge ? (
            <span
              className={cn(
                'inline-flex items-center text-xs font-bold border px-2.5 py-1 rounded-lg whitespace-nowrap',
                isLate
                  ? 'text-red-700 bg-red-50 border-red-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200',
              )}
            >
              {step.etaBadge}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── Main ───
interface SlaDetailModalProps {
  order: SlaOrder | null;
  onClose: () => void;
  onOpenMap: (order: SlaOrder) => void;
}

export function SlaDetailModal({ order, onClose, onOpenMap }: SlaDetailModalProps) {
  if (!order) return null;

  const detail  = order.detail;
  const svc     = SVC[order.serviceType] ?? SVC.Regular;
  // Kapasitas dijaga tetap menurut jenis kendaraan; nol berarti baris armada
  // belum dimuat sehingga persentase tidak boleh ikut ditampilkan.
  const capacityKnown = detail.loadCapacityKg > 0 && detail.loadKnown !== false;
  const loadPct = capacityKnown
    ? Math.min(100, Math.round((detail.loadUsedKg / detail.loadCapacityKg) * 100))
    : 0;

  const trafficClr: Record<string, string> = { green: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' };
  const riskClr:    Record<string, string> = { green: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600' };
  const riskBg:     Record<string, string> = { green: 'bg-emerald-50 border-emerald-200', amber: 'bg-amber-50 border-amber-200', red: 'bg-red-50 border-red-200' };

  return (
    <Dialog.Root open={!!order} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>

        {/* ── Backdrop ── */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          aria-describedby="sla-modal-body"
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-[720px] max-h-[calc(100vh-1.5rem)] sm:max-h-[calc(100vh-2.5rem)] flex flex-col bg-white rounded-2xl shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28)] overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        >
          {/* ══ HEADER ══ */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#FFF0F6] via-white to-white border-b border-[#F9A8D4]/60 rounded-t-2xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-1 h-9 rounded-full bg-[#C91076] flex-shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <Dialog.Title asChild>
                    <h2 className="text-sm sm:text-lg font-black leading-none text-[#0F172A]">
                      Paket <span className="text-[#C91076]">#{order.waybillNumber}</span>
                    </h2>
                  </Dialog.Title>
                  <span className={cn('inline-flex items-center h-6 px-2.5 rounded-full text-[11px] font-bold border flex-shrink-0', svc.bg, svc.text, svc.border)}>
                    {order.serviceType}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup detail pengiriman"
              title="Tutup"
              className="ml-4 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:text-[#C91076] hover:bg-[#FFF0F6] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* ══ BODY — konten scrollable di dalam modul pop-up ══ */}
          <div
            id="sla-modal-body"
            tabIndex={0}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 sm:px-6 py-4 sm:py-5 flex flex-col gap-4 focus:outline-none"
          >

                {/* 1 — Identitas Kurir */}
                <Section icon={Truck} title="Identitas Kurir & Armada Satria">
                  <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-[#F1F5F9] bg-white">
                    <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">ID Kurir Satria</span>
                      <span className="text-lg sm:text-xl font-black text-[#0F172A] font-mono tracking-tight">{detail.courierId}</span>
                    </div>
                    <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Tipe Kendaraan</span>
                      <span className="text-lg sm:text-xl font-black text-[#0F172A]">{detail.vehicleType}</span>
                    </div>
                    <div className="px-4 sm:px-5 py-3 sm:py-4 flex flex-col gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">Kapasitas Muatan</span>
                      <span className="text-sm sm:text-base font-black text-[#0F172A]">
                        {capacityKnown
                          ? `${detail.loadUsedKg} / ${detail.loadCapacityKg} Kg`
                          : '— Kg'}
                      </span>
                      {capacityKnown ? (
                        <>
                          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#C91076] rounded-full transition-all duration-500" style={{ width: `${loadPct}%` }} />
                          </div>
                          <span className="text-[10px] text-[#94A3B8]">
                            {loadPct}% kapasitas {detail.vehicleType} terisi
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-[#94A3B8]">Data armada belum tersedia</span>
                      )}
                    </div>
                  </div>
                </Section>

                {/* 2 — Rincian Penerima */}
                <Section icon={Package} title="Rincian Penerima & Spesifikasi">
                  <div className="px-3 sm:px-4 py-3 sm:py-4 grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-4 bg-white">
                    <div className="sm:col-span-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4 flex flex-col gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8] block mb-1.5">Nama Penerima</span>
                        <p className="text-sm font-bold text-[#0F172A] leading-snug">
                          {detail.recipientName || '—'}
                        </p>
                        {detail.recipientPhone && (
                          <a
                            href={`tel:${detail.recipientPhone.replace(/\s+/g, '')}`}
                            className="text-xs font-semibold text-[#C91076] hover:underline"
                          >
                            {detail.recipientPhone}
                          </a>
                        )}
                      </div>
                      <div className="border-t border-[#E2E8F0] pt-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8] block mb-1.5">Alamat Tujuan Pengiriman</span>
                        <p className="text-sm font-bold text-[#0F172A] leading-snug mb-1.5">{detail.destinationName}</p>
                        <p className="text-xs text-[#64748B] leading-relaxed font-medium">{detail.destinationAddress}</p>
                      </div>
                    </div>
                    <div className="sm:col-span-2 flex flex-col justify-between gap-3 sm:gap-4 py-0.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8] block mb-1.5">Total Berat &amp; Dimensi</span>
                        <p className="text-xl sm:text-2xl font-black text-[#0F172A] leading-none">{detail.weightKg} Kg</p>
                        {detail.dimensionCm && (
                          <p className="text-xs text-[#94A3B8] mt-1 font-medium">
                            {detail.dimensionCm}
                            {detail.volumeCbm ? ` (${detail.volumeCbm})` : ''}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8] block mb-1">Klasifikasi Kargo</span>
                        <p className="text-sm font-bold text-[#C91076]">{detail.cargoClassification}</p>
                      </div>
                    </div>
                  </div>
                </Section>

                {/* 3 — Timeline */}
                <Section icon={TrendingUp} title="Timeline Audit Kepatuhan SLA">
                  <div className="px-5 py-5 flex flex-col bg-white">
                    {detail.timeline.map((step, idx) => (
                      <TimelineItem key={idx} step={step} isLast={idx === detail.timeline.length - 1} />
                    ))}
                  </div>
                </Section>

                {/* 4 — Analisis Hambatan */}
                <Section title="Analisis Faktor Hambatan & Prediksi Keterlambatan" accent>
                  <div className="p-3 sm:p-4 bg-[#FFF8FB] grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                    {/* Cuaca */}
                    <div className="bg-white rounded-xl border border-[#F9A8D4]/30 px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Sun size={14} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] leading-tight">Cuaca Jalur</span>
                      </div>
                      <span className="text-sm font-bold text-[#0F172A]">{detail.hazard.weather}</span>
                    </div>
                    {/* Lalu Lintas */}
                    <div className="bg-white rounded-xl border border-[#F9A8D4]/30 px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Gauge size={14} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] leading-tight">Lalu Lintas Koridor</span>
                      </div>
                      <span className={cn('text-sm font-bold', trafficClr[detail.hazard.trafficColor])}>{detail.hazard.traffic}</span>
                    </div>
                    {/* Risiko */}
                    <div className="bg-white rounded-xl border border-[#F9A8D4]/30 px-4 py-3 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck size={14} className="text-emerald-500" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#94A3B8] leading-tight">Tingkat Risiko SLA</span>
                      </div>
                      <span className={cn('text-sm font-bold', riskClr[detail.hazard.slaRiskColor])}>
                        {detail.hazard.slaRiskLabel}{' '}
                        <span
                          className={cn(
                            'ml-1 inline-block rounded-md border px-1.5 py-0.5 text-[12px] font-extrabold tabular-nums',
                            riskBg[detail.hazard.slaRiskColor],
                            riskClr[detail.hazard.slaRiskColor],
                          )}
                        >
                          {detail.hazard.slaRiskScore}/10
                        </span>
                      </span>
                    </div>
                  </div>
                </Section>

              </div>

              {/* ══ FOOTER ══ */}
              <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-[#E2E8F0] bg-white rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="h-9 px-5 rounded-lg text-sm font-semibold text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
                >
                  Tutup
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { onOpenMap(order); onClose(); }}
                    title="Lihat posisi kurir ini di Live Monitoring Map"
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white bg-[#C91076] hover:bg-[#E51A8A] active:bg-[#A00060] border border-[#C91076] transition-all duration-150 shadow-sm"
                  >
                    <ExternalLink size={14} />
                    Buka Posisi di Live Map
                  </button>
                  <button
                    onClick={() => printSuratJalan(order)}
                    title="Cetak surat jalan pengiriman ini"
                    className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-[#C91076] border border-[#C91076] bg-white hover:bg-[#FFF0F6] transition-all duration-150"
                  >
                    <Printer size={14} />
                    Cetak Surat Jalan
                  </button>
                </div>
              </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
