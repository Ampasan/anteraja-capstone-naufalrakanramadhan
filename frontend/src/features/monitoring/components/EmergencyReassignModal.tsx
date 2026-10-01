import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bike, Navigation, Star, Snowflake, Thermometer } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { EmergencyReassignPayload, ReassignmentCandidate } from '../types';

interface EmergencyReassignModalProps {
  open: boolean;
  payload: EmergencyReassignPayload;
  onClose: () => void;
  onConfirm: (selectedCandidateId: string) => void;
}

export function EmergencyReassignModal({
  open,
  payload,
  onClose,
  onConfirm,
}: EmergencyReassignModalProps) {
  const defaultId =
    payload.candidates.find((c) => c.isBest)?.id ?? payload.candidates[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState<string>(defaultId);

  if (!open) return null;

  function handleConfirm() {
    if (selectedId) onConfirm(selectedId);
  }

  // Render via portal so it always sits on top of the Leaflet map
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        // Close when clicking the backdrop itself
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* ─ Modal panel ─*/}
      <div
        className="w-full max-w-[480px] bg-white rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(15,23,42,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─ Header ─ */}
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 pt-5 pb-4 border-b border-blue-200">
          <div className="flex items-start gap-3">
            {/* Snowflake icon - cold chain theme */}
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-lg">
              <Snowflake size={22} className="text-white" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-2.5 py-0.5 uppercase tracking-wide">
                  PENGALIHAN DARURAT
                </span>
                {payload.anomaly && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
                    <Thermometer size={10} />
                    {payload.anomaly.currentTempC}°C &gt; {payload.anomaly.maxAllowedTempC}°C
                  </span>
                )}
              </div>
              {/* Title */}
              <h2 className="text-base font-bold text-[#0F172A] leading-snug">
                Alihkan Tugas Paket{' '}
                <span className="font-mono">#{payload.waybillNumber ?? '—'}</span>
              </h2>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                {payload.anomaly
                  ? 'Cold-chain terdeteksi melebihi batas aman'
                  : (payload.description ?? 'Kendala lapangan terdeteksi')}
              </p>
            </div>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-white/60 transition-colors flex-shrink-0"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─ Body ─*/}
        <div className="px-5 py-4 flex flex-col gap-4">

          {/* Kendala Kurir Asal */}
          <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#F8FAFC] px-4 py-2 border-b border-[#E2E8F0] flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                Kendala Kurir Asal
              </span>
            </div>
            <div className="px-4 py-3 bg-white">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-[#FFF0F6] flex items-center justify-center font-bold text-sm text-[#C91076] flex-shrink-0">
                  {payload.originalCourier.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-sm text-[#0F172A]">
                      {payload.originalCourier.name}
                    </span>
                    <span className="text-xs font-semibold text-[#C91076] bg-[#FFF0F6] border border-[#F9A8D4] rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                      {payload.originalCourier.obstacleLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                    <Bike size={11} className="text-[#94A3B8]" />
                    <span>{payload.originalCourier.vehicle}</span>
                    <span className="text-[#CBD5E1]">·</span>
                    <span className="truncate">{payload.originalCourier.lastKnownAddress}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Candidate selection */}
          <div>
            <p className="text-sm font-bold text-[#0F172A] mb-2.5">Rekomendasi</p>
            <div className="flex flex-col gap-2">
              {payload.candidates.map((candidate) => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedId === candidate.id}
                  onSelect={() => setSelectedId(candidate.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ─ Footer ─*/}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#E2E8F0]">
          <Button variant="secondary" size="md" onClick={onClose}>
            Batalkan
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!selectedId}
            onClick={handleConfirm}
          >
            Konfirmasi Pengalihan Satu Klik
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CandidateRow({
  candidate,
  isSelected,
  onSelect,
}: {
  candidate: ReassignmentCandidate;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const loadPct = Math.round((candidate.loadCurrent / candidate.loadTotal) * 100);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full text-left flex items-center gap-3 rounded-xl border px-4 py-3 transition-all cursor-pointer',
        isSelected
          ? 'border-[#C91076] bg-[#FFF0F6] shadow-[0_0_0_1px_#C91076]'
          : 'border-[#E2E8F0] bg-white hover:border-[#C91076]/40 hover:bg-[#FFF8FB]',
      )}
    >
      {/* Radio circle */}
      <div
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          isSelected ? 'border-[#C91076] bg-[#C91076]' : 'border-[#CBD5E1] bg-white',
        )}
      >
        {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
      </div>

      {/* Name + badge + details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-bold text-[#0F172A]">{candidate.name}</span>
          {candidate.isBest && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
              <Star size={9} className="inline" />
              TERBAIK
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
          <span className="flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Muatan: {candidate.loadCurrent}/{candidate.loadTotal} Paket ({loadPct}%)
          </span>
          <span className="text-[#CBD5E1]">·</span>
          <span className="flex items-center gap-1">
            <Navigation size={10} />
            Jarak: {candidate.distanceLabel}
          </span>
        </div>
      </div>

      {/* ETA */}
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-black text-[#C91076] leading-tight">{candidate.etaMinutes} Menit</p>
        <p className="text-[10px] text-[#94A3B8]">Estimasi</p>
      </div>
    </button>
  );
}
