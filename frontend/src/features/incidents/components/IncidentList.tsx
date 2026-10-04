import { MapPin, Truck, Bike, Car, Package, Thermometer, ClipboardList, MousePointerClick, Camera, Snowflake } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { IncidentReport, SeverityLevel } from '../types';

const SEVERITY_DOT: Record<SeverityLevel, string> = {
  CRITICAL: 'bg-red-500',
  WARNING:  'bg-amber-400',
  SAFE:     'bg-emerald-500',
};

const SEVERITY_LABEL: Record<SeverityLevel, { text: string; chip: string }> = {
  CRITICAL: { text: 'text-red-600',    chip: 'bg-red-50 border-red-200 text-red-700' },
  WARNING:  { text: 'text-amber-600',  chip: 'bg-amber-50 border-amber-200 text-amber-700' },
  SAFE:     { text: 'text-emerald-600', chip: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
};

const SERVICE_BADGE: Record<string, string> = {
  Cargo:        'bg-blue-50 text-blue-700 border-blue-200',
  Frozen:       'bg-blue-50 text-blue-700 border-blue-200',
  PHARMA:       'bg-purple-50 text-purple-700 border-purple-200',
  'Same Day':   'bg-[#FFF0F6] text-[#C91076] border-[#F9A8D4]',
  Instant:      'bg-orange-50 text-orange-700 border-orange-200',
  'Next Day':   'bg-slate-50 text-slate-600 border-slate-200',
  Regular:      'bg-slate-50 text-slate-600 border-slate-200',
  Dokumen:      'bg-slate-50 text-slate-600 border-slate-200',
  'Mini Cargo': 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

/** Warna badge kategori kendala. */
const CATEGORY_BADGE: Record<string, string> = {
  'Cuaca / Hujan':        'bg-amber-50 text-amber-700 border-amber-200',
  'Anomali Suhu':         'bg-blue-50 text-blue-700 border-blue-200',
  'Mogok Kendaraan':      'bg-red-50 text-red-700 border-red-200',
  'Ban Bocor':            'bg-red-50 text-red-700 border-red-200',
  'Alamat tidak ditemukan': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Banjir':               'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Macet Total':          'bg-orange-50 text-orange-700 border-orange-200',
};

function VehicleIcon({ type }: { type: string }) {
  const t = type.toLowerCase();

  const base = 'w-9 h-9 rounded-xl bg-[#FFF0F6] flex items-center justify-center flex-shrink-0';
  const iconClass = 'text-[#C91076]';

  if (t.includes('motor') || t.includes('sepeda') || t.includes('chiller') || t.includes('roda dua') || t.includes('ojek')) {
    return <div className={base}><Bike size={17} className={iconClass} /></div>;
  }
  if (t.includes('van') || t.includes('minibus') || t.includes('mpv')) {
    return <div className={base}><Car size={17} className={iconClass} /></div>;
  }
  if (t.includes('truk') || t.includes('truck') || t.includes('box') || t.includes('pikap') || t.includes('pickup')) {
    return <div className={base}><Truck size={17} className={iconClass} /></div>;
  }
  if (t.includes('frozen') || t.includes('cold') || t.includes('pharma')) {
    return <div className={base}><Thermometer size={17} className={iconClass} /></div>;
  }
  if (t.includes('cargo') || t.includes('kargo') || t.includes('paket')) {
    return <div className={base}><Package size={17} className={iconClass} /></div>;
  }
  return <div className={base}><Bike size={17} className={iconClass} /></div>;
}

interface IncidentCardProps {
  incident: IncidentReport;
  isSelected: boolean;
  onClick: () => void;
  onViewEvidence?: (incident: IncidentReport) => void;
}

function IncidentCard({ incident, isSelected, onClick, onViewEvidence }: IncidentCardProps) {
  const svcBadge = SERVICE_BADGE[incident.serviceType] ?? SERVICE_BADGE['Regular'];
  const catBadge = CATEGORY_BADGE[incident.incidentCategory ?? ''] ?? SERVICE_BADGE['Regular'];
  const isCritical = incident.severity === 'CRITICAL';
  const kendalaColor = isCritical ? 'text-red-600' : 'text-amber-600';
  const severityChip = SEVERITY_LABEL[incident.severity].chip;
  const isColdChain = incident.serviceType === 'Frozen' || incident.kendalaDetail?.includes('Suhu') || incident.kendalaDetail?.includes('suhu');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'w-full text-left rounded-2xl border-2 transition-all duration-250 bg-white cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076] focus-visible:ring-offset-1',
        isSelected
          ? 'border-[#C91076] shadow-[0_0_0_4px_rgba(201,16,118,0.12)] scale-[1.005]'
          : 'border-[#E2E8F0] hover:border-[#F9A8D4] hover:shadow-md hover:-translate-y-0.5',
      )}
    >
      <div className="px-4 pt-3.5 pb-3.5 flex flex-col gap-3">

        {/* ── Row 1: Resi + badges ── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13px] font-extrabold text-[#0F172A] font-mono tracking-tight">
            Resi #{incident.waybillNumber}
          </span>

          <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-bold border leading-none', svcBadge)}>
            {incident.serviceLabel}
          </span>

          {incident.kendalaDetail && (
            <span className={cn(
              'px-2.5 py-0.5 rounded-full text-[11px] font-bold border leading-none',
              catBadge,
            )}>
              {incident.kendalaDetail}
            </span>
          )}

          {incident.evidenceImageUrl && onViewEvidence && !isColdChain && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onViewEvidence(incident);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-[#F9A8D4] bg-[#FFF0F6] text-[#C91076] hover:bg-[#C91076] hover:text-white transition-all shadow-xs"
              title="Lihat foto bukti kendala lapangan"
            >
              <Camera size={11} />
              Foto Bukti
            </button>
          )}

          {incident.incidentCategory && (
            <span className={cn(
              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border leading-none',
              catBadge,
            )}>
              {incident.incidentCategory}
            </span>
          )}

          {isSelected ? (
            <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-[#C91076] text-white leading-none animate-pulse">
              ● Sedang Dipilih
            </span>
          ) : (
            /* Hint tap */
            <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[#C9A0B0]">
              <MousePointerClick size={10} />
              Klik untuk pilih
            </span>
          )}
        </div>

        {/* ── Row 2: Icon + Nama kurir + Kendala ── */}
        <div className="flex items-start gap-3">
          <VehicleIcon type={incident.courier.vehicleType} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              {/* Nama + kendaraan */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-extrabold text-[#0F172A] leading-tight">
                  {incident.courier.name}
                </span>
                <span className="text-[12px] text-[#64748B] font-medium">
                  {incident.courier.vehicleType}
                </span>
              </div>

              {/* Kendala + lokasi */}
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0 text-right">
                <span className={cn('text-[13px] font-extrabold flex items-center gap-1', kendalaColor)}>
                  <span className={cn('w-2 h-2 rounded-full flex-shrink-0 animate-pulse', SEVERITY_DOT[incident.severity])} />
                  {incident.incidentCategory ?? incident.kendala}
                </span>
                <span className="text-[11px] text-[#94A3B8]">
                  📍 {incident.stoppedLocation}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chip severity ── */}
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border', severityChip)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', SEVERITY_DOT[incident.severity])} />
            {incident.severity === 'CRITICAL' ? 'Prioritas Tinggi' : incident.severity === 'WARNING' ? 'Perlu Perhatian' : 'Normal'}
          </span>
          {isColdChain && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
              <Snowflake size={11} />
              Cold-Chain
            </span>
          )}
          {incident.incidentCategory && (
            <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border', catBadge)}>
              {incident.incidentCategory}
            </span>
          )}
        </div>

        {/* ── Row 3: Tujuan + Status link ── */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-[#94A3B8] flex-shrink-0" />
            <span className="text-[12px] text-[#64748B]">
              Tujuan:{' '}
              <span className="font-bold text-[#334155]">{incident.destination}</span>
            </span>
          </div>
          <span className={cn(
            'text-[12px] font-bold flex items-center gap-1 flex-shrink-0 transition-colors duration-200',
            incident.status === 'RESOLVED' && incident.replacementCourier
              ? 'text-emerald-600'
              : isSelected
                ? 'text-[#C91076]'
                : 'text-[#64748B] group-hover:text-[#C91076]',
          )}>
            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#C91076] animate-pulse" />}
            {incident.statusLabel} ›
          </span>
        </div>

      </div>
    </div>
  );
}

interface IncidentListProps {
  incidents: IncidentReport[];
  totalCount: number;
  selectedIncidentId: string | null;
  isLoading?: boolean;
  onSelectIncident: (id: string) => void;
  onViewEvidence?: (incident: IncidentReport) => void;
}

export function IncidentList({
  incidents,
  totalCount,
  selectedIncidentId,
  isLoading = false,
  onSelectIncident,
  onViewEvidence,
}: IncidentListProps) {
  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="mb-4">
        <h2 className="text-[16px] font-extrabold text-[#0F172A] flex items-center gap-2 leading-tight">
          <ClipboardList size={17} className="text-[#C91076] flex-shrink-0" />
          Daftar Insiden Lapangan
        </h2>
        <p className="text-[12px] text-[#64748B] mt-1 leading-relaxed">
          Pilih salah satu insiden di bawah untuk melihat rekomendasi kurir pengganti
        </p>
      </div>

      {/* ── Cards ── */}
      <div className="flex flex-col gap-3">
        {incidents.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#E2E8F0]">
            <span
              className="h-7 w-7 animate-spin rounded-full border-[3px] border-[#F9A8D4] border-t-[#C91076]"
              aria-hidden="true"
            />
            <p className="text-[14px] font-bold text-[#64748B]">Memuat daftar insiden…</p>
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-[#F8FAFC] rounded-2xl border-2 border-dashed border-[#E2E8F0]">
            <span className="text-3xl">🔍</span>
            <p className="text-[14px] font-bold text-[#64748B]">Tidak ada insiden yang cocok</p>
            <p className="text-[12px] text-[#94A3B8]">Coba ubah filter atau kata kunci pencarian</p>
          </div>
        ) : (
          incidents.map((inc) => (
            <IncidentCard
              key={inc.id}
              incident={inc}
              isSelected={selectedIncidentId === inc.id}
              onClick={() => onSelectIncident(inc.id)}
              onViewEvidence={onViewEvidence}
            />
          ))
        )}
      </div>

      {/* ── Footer / Pagination ── */}
      <div className="pt-4 mt-3 border-t border-[#E2E8F0] flex items-center justify-between">
        <span className="text-[12px] text-[#64748B]">
          Menampilkan{' '}
          <span className="font-extrabold text-[#0F172A]">{incidents.length}</span>
          {' '}dari{' '}
          <span className="font-extrabold text-[#0F172A]">{totalCount}</span>
          {/* Daftar ini memuat insiden yang sudah RESOLVED juga — label
              "aktif" akan menyesatkan karena angkanya ikut menghitungnya. */}
          {' '}insiden
        </span>
        <div className="flex items-center gap-1">
          <button disabled className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#94A3B8] disabled:opacity-40 cursor-not-allowed bg-white">
            ← Sebelumnya
          </button>
          <button className="w-8 h-8 rounded-lg bg-[#C91076] text-white text-[12px] font-extrabold shadow-sm">
            1
          </button>
          <button disabled className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[12px] font-semibold text-[#94A3B8] disabled:opacity-40 cursor-not-allowed bg-white">
            Berikutnya →
          </button>
        </div>
      </div>
    </div>
  );
}
