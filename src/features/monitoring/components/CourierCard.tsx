import { Clock, Package, Thermometer } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Badge } from '../../../components/ui/Badge';
import type { Courier } from '../types';

interface CourierCardProps {
  courier: Courier;
  isSelected: boolean;
  onClick: (courier: Courier) => void;
}

function Avatar({ initials, status }: { initials: string; status: Courier['status'] }) {
  const style: Record<Courier['status'], string> = {
    ONLINE: 'bg-[#FFF0F6] text-[#C91076]',
    IDLE:   'bg-amber-50  text-amber-600',
    ALERT:  'bg-orange-50 text-orange-600',
  };
  return (
    <div className={cn(
      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
      style[status],
    )}>
      {initials}
    </div>
  );
}

function StatusPill({ courier }: { courier: Courier }) {
  if (courier.status === 'ONLINE') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700 flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        Online
      </span>
    );
  }
  if (courier.status === 'ALERT') {
    const temp = courier.coldChainAnomaly?.currentTempC;
    return (
      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange-600 flex-shrink-0">
        <Thermometer size={12} className="text-orange-500" />
        {temp ? `${temp}°C Alert` : 'Alert'}
      </span>
    );
  }
  return null;
}

export function CourierCard({ courier, isSelected, onClick }: CourierCardProps) {
  const firstPkg  = courier.activePackages[0];
  const hasAnomaly = !!courier.coldChainAnomaly;
  const isIdle    = courier.status === 'IDLE';
  const isAlert   = courier.status === 'ALERT';

  const slaMin    = firstPkg?.slaRemainingMinutes ?? 0;
  const slaColour = slaMin <= 15 ? 'text-red-600' : slaMin <= 30 ? 'text-amber-600' : 'text-[#475569]';

  return (
    <button
      onClick={() => onClick(courier)}
      className={cn(
        'w-full text-left rounded-xl border transition-all duration-150 p-3 mb-2',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076]',
        isSelected
          ? 'border-[#C91076] bg-[#FFF0F6] shadow-[0_0_0_1px_#C91076]'
          : 'border-[#E2E8F0] bg-white hover:border-[#C91076]/30 hover:bg-[#FFF8FB]',
      )}
    >
      {/* Row 1: avatar · name · badges · status */}
      <div className="flex items-center gap-3 mb-2.5">
        <Avatar initials={courier.initials} status={courier.status} />

        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Name — larger, darker */}
            <span className="text-[14px] font-bold text-[#0F172A] truncate">{courier.name}</span>

            {isSelected && <Badge variant="selected">AKTIF</Badge>}

            {isIdle && courier.idleDuration && (
              <Badge variant="idle">IDLE {courier.idleDuration}</Badge>
            )}

            {isAlert && hasAnomaly && (
              <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5 uppercase">
                SUHU
              </span>
            )}
          </div>

          <StatusPill courier={courier} />
        </div>
      </div>

      {/* Row 2: package box */}
      {firstPkg && (
        <div className={cn(
          'rounded-lg border px-3 py-2.5',
          isAlert ? 'border-orange-100 bg-orange-50' : 'border-[#F1F5F9] bg-[#F8FAFC]',
        )}>
          {/* Waybill + SLA */}
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 font-mono text-[13px] font-bold text-[#0F172A]">
              <Package size={12} className="text-[#C91076] flex-shrink-0" />
              {firstPkg.waybillNumber}
            </span>
            <span className={cn('text-[12px] font-bold flex items-center gap-1', slaColour)}>
              <Clock size={11} className="flex-shrink-0" />
              {slaMin <= 0 ? 'SLA Habis' : `SLA: ${slaMin}m`}
            </span>
          </div>

          {/* Service type badge + paket count */}
          <div className="flex items-center justify-between gap-1">
            <Badge
              variant={
                firstPkg.serviceType === 'Same Day' ? 'same-day' :
                firstPkg.serviceType === 'Frozen'   ? 'frozen'   :
                firstPkg.serviceType === 'PHARMA'   ? 'pharma'   : 'regular'
              }
            >
              {firstPkg.serviceType}
            </Badge>
            {(isAlert || isIdle || courier.activePackages.length > 1) && (
              <span className="text-[12px] font-semibold text-[#475569]">
                {courier.activePackages.length}/{courier.capacityTotal} Paket
              </span>
            )}
          </div>
        </div>
      )}

      {/* IDLE: last address */}
      {isIdle && courier.lastKnownAddress && (
        <p className="text-[12px] font-medium text-[#475569] mt-2 truncate">
          📍 {courier.lastKnownAddress}
        </p>
      )}
    </button>
  );
}
