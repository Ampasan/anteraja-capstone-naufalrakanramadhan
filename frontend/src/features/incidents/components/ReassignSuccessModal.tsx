import { CheckCircle2, ArrowRight, Loader2, Send, XCircle } from 'lucide-react';
import { Modal, ModalBody } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { AsyncTask } from '../../../lib/api';
import type { ReassignmentPayload } from '../types';

const SERVICE_BADGE: Record<string, string> = {
  Cargo:      'bg-blue-50 text-blue-700 border-blue-200',
  Frozen:     'bg-cyan-50 text-cyan-700 border-cyan-200',
  PHARMA:     'bg-purple-50 text-purple-700 border-purple-200',
  'Same Day': 'bg-[#FFF0F6] text-[#C91076] border-[#F9A8D4]',
};

interface ReassignSuccessModalProps {
  open: boolean;
  payload: ReassignmentPayload | null;
  notification?: AsyncTask | null;
  serviceLabel?: string;
  onClose: () => void;
  onGoToAuditLog: () => void;
}

/**
 * Baris status pengiriman notifikasi.
 */
function NotificationStatus({ notification }: { notification?: AsyncTask | null }) {
  if (!notification) {
    return (
      <p className="text-[11px] text-center text-[#94A3B8]">
        Notifikasi rute dikirim ke ponsel kurir
      </p>
    );
  }

  const pending = notification.status === 'accepted' || notification.status === 'processing';
  const failed = notification.status === 'failed';

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2',
        failed
          ? 'border-red-200 bg-red-50'
          : pending
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex-shrink-0',
          failed ? 'text-red-600' : pending ? 'text-amber-600' : 'text-emerald-600',
        )}
      >
        {failed ? (
          <XCircle size={14} />
        ) : pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <Send size={14} />
        )}
      </span>
      <div className="min-w-0">
        <p
          className={cn(
            'text-[11px] font-extrabold uppercase tracking-wide',
            failed ? 'text-red-700' : pending ? 'text-amber-700' : 'text-emerald-700',
          )}
        >
          Notifikasi kurir: {notification.status}
        </p>
        <p className="text-[11px] text-[#475569] leading-snug">{notification.message}</p>
      </div>
    </div>
  );
}

export function ReassignSuccessModal({
  open,
  payload,
  notification,
  serviceLabel = 'Cargo',
  onClose,
  onGoToAuditLog,
}: ReassignSuccessModalProps) {
  if (!payload) return null;

  const serviceBadgeClass =
    SERVICE_BADGE[serviceLabel] ?? 'bg-slate-50 text-slate-600 border-slate-200';

  const handleGoToAuditLog = () => {
    onClose();
    setTimeout(() => onGoToAuditLog(), 150);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-md">
      <ModalBody className="p-0">
        <div className="flex flex-col items-center gap-5 px-6 py-8">

          {/* ── Success Icon ── */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-emerald-500" strokeWidth={2} />
          </div>

          {/* ── Title & Subtitle ── */}
          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="text-[18px] font-extrabold text-[#0F172A] leading-tight">
              Pengalihan Tugas Berhasil!
            </h2>
            <p className="text-[13px] text-[#64748B] leading-relaxed max-w-[300px]">
              Paket telah sukses dialihkan ke kurir pengganti dan rute navigasi baru telah
              dicatat pada Audit Log &amp; Riwayat.
            </p>
          </div>

          {/* ── Summary Box ── */}
          <div className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex flex-col gap-3">

            {/* Waybill + service badge */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-extrabold text-[#0F172A] font-mono">
                {payload.waybillNumber}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border leading-none ${serviceBadgeClass}`}
              >
                {serviceLabel}
              </span>
            </div>

            {/* Kurir asal → kurir pengganti */}
            <div className="flex items-center gap-3">
              {/* Original courier */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  Kurir Asal
                </span>
                <span className="text-[13px] font-bold text-red-600 leading-tight truncate">
                  {payload.originalCourier.name}
                </span>
                <span className="text-[11px] text-[#94A3B8]">Mogok</span>
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <ArrowRight size={16} className="text-emerald-600" />
              </div>

              {/* Replacement courier */}
              <div className="flex flex-col gap-0.5 flex-1 min-w-0 text-right">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  Kurir Pengganti
                </span>
                <span className="text-[13px] font-bold text-emerald-600 leading-tight truncate">
                  {payload.selectedCandidate.name}
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  {payload.selectedCandidate.vehicleType}{' '}
                  {payload.selectedCandidate.distanceM >= 1000
                    ? `${(payload.selectedCandidate.distanceM / 1000).toFixed(1)} km`
                    : `${payload.selectedCandidate.distanceM} m`}
                </span>
              </div>
            </div>

            {/* Penyimpanan + status notifikasi asinkron */}
            <div className="pt-1 border-t border-[#E2E8F0] flex flex-col gap-2">
              <p className="text-[11px] text-center text-[#94A3B8]">
                Tercatat di Audit Log &amp; Riwayat
              </p>
              <NotificationStatus notification={notification} />
            </div>
          </div>

          {/* ── Action Buttons ── */}
          <div className="flex flex-col gap-2 w-full">
            <Button variant="primary" size="lg" fullWidth onClick={onClose}>
              Selesai &amp; Tutup
            </Button>
            <button
              onClick={handleGoToAuditLog}
              className="text-[12px] font-semibold text-[#C91076] hover:text-[#A00060] underline underline-offset-2 transition-colors py-1"
            >
              Lihat di Riwayat Audit Log
            </button>
          </div>

        </div>
      </ModalBody>
    </Modal>
  );
}
