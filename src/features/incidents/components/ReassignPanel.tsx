import { Package, Zap, MapPin, Navigation, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { IncidentReport, CandidateCourier } from '../types';

interface CandidateOptionProps {
  candidate: CandidateCourier;
  isSelected: boolean;
  onSelect: () => void;
}

function CandidateOption({ candidate, isSelected, onSelect }: CandidateOptionProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border-2 p-3.5 bg-white transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076]',
        isSelected
          ? 'border-[#C91076] shadow-[0_0_0_3px_rgba(201,16,118,0.10)] scale-[1.01]'
          : 'border-[#E2E8F0] hover:border-[#F9A8D4] hover:shadow-sm hover:scale-[1.005]',
      )}
    >
      <div className="flex items-start gap-3">
        {/* Radio + Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-extrabold transition-all duration-200',
              isSelected ? 'bg-[#C91076] text-white shadow-md' : 'bg-[#F1F5F9] text-[#475569]',
            )}
          >
            {candidate.initials}
          </div>
          {isSelected && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 size={9} className="text-white" />
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[14px] font-extrabold text-[#0F172A]">
              {candidate.name}
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-slate-50 text-slate-600 border-slate-200 leading-none">
              {candidate.vehicleType}
            </span>
            {candidate.isRecommended ? (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-[#C91076] text-white leading-none">
                ⭐ {candidate.badge}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border bg-amber-50 text-amber-700 border-amber-200 leading-none">
                {candidate.badge}
              </span>
            )}
          </div>

          {/* Plate */}
          <span className="text-[11px] text-[#94A3B8] font-mono tracking-wide">{candidate.vehiclePlate}</span>

          {/* Distance + Capacity */}
          <div className="flex items-center gap-3 flex-wrap mt-0.5">
            <span className="text-[12px] text-[#475569] flex items-center gap-1">
              <Navigation size={11} className="text-[#C91076]" />
              <span className="font-bold text-[#0F172A]">
                {candidate.distanceM >= 1000
                  ? `${(candidate.distanceM / 1000).toFixed(1)} km`
                  : `${candidate.distanceM} m`}
              </span>
              <span className="text-[#94A3B8]">({candidate.etaMinutes} mnt)</span>
            </span>
            <span className="text-[12px] text-[#475569] flex items-center gap-1">
              <Package size={11} className="text-[#C91076]" />
              Sisa{' '}
              <span className="font-bold text-[#0F172A]">
                {candidate.remainingCapacityKg >= 1000
                  ? `${(candidate.remainingCapacityKg / 1000).toLocaleString('id-ID')} ton`
                  : `${candidate.remainingCapacityKg.toLocaleString('id-ID')} kg`}
              </span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

interface ReassignPanelProps {
  incident: IncidentReport | null;
  selectedCandidateId: string | null;
  onSelectCandidate: (id: string) => void;
  onConfirm: () => void;
}

export function ReassignPanel({
  incident,
  selectedCandidateId,
  onSelectCandidate,
  onConfirm,
}: ReassignPanelProps) {

  if (!incident) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[360px] text-center gap-5 px-8 bg-[#FFF5FA] rounded-2xl border-2 border-dashed border-[#F9A8D4]">
        {/* Animated arrow */}
        <div className="flex flex-col items-center gap-1 text-[#F9A8D4]">
          <span className="text-2xl animate-bounce">←</span>
        </div>
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#F9A8D4] flex items-center justify-center shadow-sm">
          <Zap size={28} className="text-[#C91076] opacity-50" />
        </div>
        <div className="flex flex-col gap-2">
          <h3 className="text-[15px] font-extrabold text-[#0F172A]">
            Pilih Insiden Terlebih Dahulu
          </h3>
          <p className="text-[13px] text-[#64748B] max-w-[230px] leading-relaxed">
            Klik salah satu kartu insiden di sebelah kiri untuk melihat rekomendasi kurir pengganti
          </p>
        </div>
        <div className="flex flex-col gap-1 text-[11px] text-[#94A3B8]">
          <span>💡 Proses pengalihan selesai dalam &lt; 30 detik</span>
          <span>🔔 Notifikasi otomatis dikirim ke kurir</span>
        </div>
      </div>
    );
  }

  const selectedCandidate = incident.candidates.find((c) => c.id === selectedCandidateId);

  return (
    <div className="flex flex-col bg-[#FFF5FA] rounded-2xl border-2 border-[#F9A8D4] overflow-visible">

      {/* ── Panel Header ── */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#F9A8D4] flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#C91076]">
            Formulir Pengalihan Cepat
          </span>
          <span className="text-[10px] text-[#94A3B8]">Tinjau &amp; konfirmasi di bawah</span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Siap Dialihkan
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4">

        {/* ── Resi & Muatan ── */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] px-3.5 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">
              Nomor Resi Paket
            </p>
            <p className="text-[16px] font-extrabold text-[#0F172A] font-mono">
              #{incident.waybillNumber}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] mb-0.5">
              Berat Muatan
            </p>
            <p className="text-[14px] font-extrabold text-[#0F172A]">
              {incident.weightKg.toLocaleString('id-ID')} kg
            </p>
          </div>
        </div>

        {/* ── Detail Kasus Terpilih ── */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-3.5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
            <span className="text-[13px] font-extrabold text-[#0F172A]">
              Detail Kendala
            </span>
            <span className="ml-auto text-[11px] font-bold text-[#94A3B8] font-mono bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#E2E8F0]">
              {incident.id}
            </span>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#64748B] font-medium">Kurir Terkendala</span>
              <span className="text-[12px] font-extrabold text-[#0F172A] font-mono bg-slate-50 px-2 py-0.5 rounded-md">
                {incident.courier.vehiclePlate}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#64748B] font-medium">Lokasi Terhenti</span>
              <div className="flex items-center gap-1">
                <MapPin size={11} className="text-red-400" />
                <span className="text-[12px] font-extrabold text-[#0F172A]">
                  {incident.stoppedLocation}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-[#64748B] font-medium">Status Kendala</span>
              <span className="text-[12px] font-extrabold text-red-600 flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Kendaraan Mogok
              </span>
            </div>
          </div>
        </div>

        {/* ── Pilih Kurir Pengganti ── */}
        <div>
          <div className="flex items-baseline justify-between mb-2.5">
            <span className="text-[13px] font-extrabold text-[#0F172A]">
              Pilih Kurir Pengganti
            </span>
            <span className="text-[11px] text-[#94A3B8] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full">
              📍 Radius Terdekat
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {incident.candidates.map((candidate) => (
              <CandidateOption
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidateId === candidate.id}
                onSelect={() => onSelectCandidate(candidate.id)}
              />
            ))}
          </div>
        </div>

        {/* ── Tombol Konfirmasi ── */}
        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onConfirm}
            disabled={!selectedCandidate}
            className={cn(
              'font-extrabold text-[13px] rounded-full transition-all duration-200',
              selectedCandidate
                ? 'hover:scale-105 hover:shadow-lg active:scale-95 shadow-[0_4px_14px_0_rgba(201,16,118,0.4)]'
                : '',
            )}
          >
            <Zap size={15} />
            Konfirmasi Pengalihan 1-Klik (&lt; 30 dtk)
          </Button>

          {selectedCandidate ? (
            <p className="text-[12px] text-center text-emerald-700 font-semibold flex items-center justify-center gap-1.5 bg-emerald-50 rounded-full py-1.5 border border-emerald-200">
              <CheckCircle2 size={13} className="text-emerald-600" />
              Notifikasi otomatis ke {selectedCandidate.name.split(' ')[0]}
            </p>
          ) : (
            <p className="text-[12px] text-center text-[#94A3B8] flex items-center justify-center gap-1">
              ↑ Pilih kurir pengganti di atas untuk melanjutkan
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
