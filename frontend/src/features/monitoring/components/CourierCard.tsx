import { MapPin, Snowflake, Timer, User } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { ActivePackage, Courier } from '../types';

interface CourierCardProps {
  courier: Courier;
  isSelected: boolean;
  onClick: (courier: Courier) => void;
}

/** Paket dengan sisa SLA paling sempit — jadi yang ditampilkan di kartu. */
function mostUrgent(packages: ActivePackage[]): ActivePackage | undefined {
  return packages.reduce<ActivePackage | undefined>(
    (worst, pkg) => (!worst || pkg.slaRemainingMinutes < worst.slaRemainingMinutes ? pkg : worst),
    undefined,
  );
}

/**
 * Kartu kurir di panel kiri.
 */
export function CourierCard({ courier, isSelected, onClick }: CourierCardProps) {
  const isIdle = courier.status === 'IDLE';
  const isFrozen = courier.activePackages.some((pkg) => pkg.serviceType === 'Frozen');
  const hasAnomaly = !!courier.coldChainAnomaly;
  const location = courier.lastKnownAddress;
  const urgent = isIdle ? mostUrgent(courier.activePackages) : undefined;

  const slaDanger = urgent ? urgent.slaRemainingMinutes <= 15 : false;

  return (
    <button
      onClick={() => onClick(courier)}
      className={cn(
        'w-full text-left rounded-xl border transition-all duration-150 p-3 mb-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076]',
        isSelected
          ? 'border-[#C91076] bg-[#FFF0F6] shadow-[0_0_0_1px_#C91076]'
          : 'border-[#E2E8F0] bg-white hover:border-[#C91076]/30 hover:bg-[#FFF8FB]',
        // Penanda khusus kurir muatan dingin.
        isFrozen && !isSelected && 'border-l-[3px] border-l-blue-400 bg-blue-50/40',
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <span
          className={cn(
            'w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] flex-shrink-0',
            isFrozen
              ? 'bg-blue-50 text-blue-600'
              : isIdle
                ? 'bg-amber-50 text-amber-600'
                : 'bg-[#FFF0F6] text-[#C91076]',
          )}
          aria-hidden="true"
        >
          {courier.initials || <User size={15} />}
        </span>

        <div className="flex-1 min-w-0">
          {/* Nama kurir + status */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[14px] font-bold text-[#0F172A] truncate">{courier.name}</span>

            {isIdle ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 flex-shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-amber-400" aria-hidden="true" />
                Idle
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 flex-shrink-0 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Online
              </span>
            )}
          </div>

          {/* Lokasi: jalan tempat kurir berada */}
          {location ? (
            <p className="flex items-start gap-1.5 text-[12px] font-medium text-[#64748B] leading-snug mt-1">
              <MapPin size={12} className="text-[#C91076] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span className="truncate">{location}</span>
            </p>
          ) : (
            <p className="flex items-start gap-1.5 text-[12px] font-medium text-[#94A3B8] leading-snug mt-1">
              <MapPin size={12} className="text-[#CBD5E1] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>Lokasi belum diperbarui</span>
            </p>
          )}

          {/* Ringkasan kiriman kurir idle: SLA, resi, dan layanan */}
          {isIdle && (
            <div className="mt-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-2 flex flex-col gap-1">
              <div className="flex items-center">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-extrabold',
                    !urgent
                      ? 'text-[#94A3B8]'
                      : slaDanger
                        ? 'text-red-600'
                        : 'text-emerald-600',
                  )}
                >
                  <Timer size={11} aria-hidden="true" />
                  {!urgent
                    ? 'SLA: belum ada paket'
                    : urgent.slaRemainingMinutes <= 0
                      ? `Terlambat ${Math.abs(urgent.slaRemainingMinutes)} Menit`
                      : `Sisa SLA ${urgent.slaRemainingMinutes} Menit`}
                </span>
              </div>

              {urgent && (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-bold text-[#0F172A] truncate">
                    {urgent.waybillNumber}
                  </span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-[#F9A8D4] bg-[#FFF0F6] text-[10px] font-bold text-[#C91076] whitespace-nowrap">
                    {urgent.serviceType}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Lencana khusus: muatan dingin (dan anomali suhunya bila ada) */}
          {isFrozen && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
              <Snowflake size={10} aria-hidden="true" />
              {hasAnomaly ? 'Cold-chain · Suhu naik' : 'Cold-chain'}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
