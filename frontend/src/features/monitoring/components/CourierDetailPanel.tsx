import { X, Bike, Package, MapPin, Clock, Phone, Navigation, AlertTriangle, Snowflake } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import type { Courier } from '../types';

interface CourierDetailPanelProps {
  courier: Courier;
  isFocusingRoute: boolean;
  onClose: () => void;
  onFocusRoute: () => void;
  onContact: () => void;
}

function SlaBar({ remainingMinutes, elapsedPct }: { remainingMinutes: number; elapsedPct: number }) {
  const danger = elapsedPct >= 80 || remainingMinutes <= 15;
  const fill   = danger ? '#EF4444' : '#F59E0B';

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-bold text-amber-700 flex items-center gap-1.5">
          <Clock size={13} />
          Sisa SLA: {remainingMinutes} Menit
        </span>
        <span className="text-[12px] font-bold text-[#0F172A]">
          {elapsedPct}% Menuju Batas
        </span>
      </div>
      <div className="h-2.5 bg-amber-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(elapsedPct, 100)}%`, background: fill }}
        />
      </div>
    </div>
  );
}

export function CourierDetailPanel({
  courier,
  isFocusingRoute,
  onClose,
  onFocusRoute,
  onContact,
}: CourierDetailPanelProps) {
  const firstPkg = courier.activePackages[0];
  const hasAnomaly = !!courier.coldChainAnomaly;
  const isFrozen = firstPkg?.serviceType === 'Frozen';

  return (
    <div className="flex flex-col w-[calc(100vw-24px)] max-w-[310px] bg-white rounded-xl overflow-hidden border-2 border-[#C91076] shadow-[0_4px_24px_rgba(201,16,118,0.18)]">

      {/* ── Header ── */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]',
        isFocusingRoute ? 'bg-[#FFF0F6]' : 'bg-white',
      )}>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {isFocusingRoute ? (
            <>
              <AlertTriangle size={14} className="text-[#C91076] flex-shrink-0" />
              <span className="text-[13px] font-bold text-[#C91076]">Fokus Rute Aktif</span>
              <Badge variant="live-tracking">LIVE TRACKING</Badge>
            </>
          ) : (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0',
                courier.status === 'ONLINE' ? 'bg-[#FFF0F6] text-[#C91076]' :
                courier.status === 'IDLE'   ? 'bg-amber-50  text-amber-600' :
                                              'bg-orange-50 text-orange-600',
              )}>
                {courier.initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-[14px] text-[#0F172A] truncate">{courier.name}</span>
                  <Badge
                    variant={courier.status === 'ONLINE' ? 'online' : courier.status === 'IDLE' ? 'idle' : 'alert'}
                    dot
                  >
                    {courier.status}
                  </Badge>
                </div>
                <span className="flex items-center gap-1 text-[12px] text-[#475569] mt-0.5">
                  <Bike size={12} />
                  {courier.vehicle}
                </span>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="ml-2 p-1.5 flex-shrink-0 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Package section ── */}
      {firstPkg && (
        <div className="px-4 py-3 flex flex-col gap-3">
          {/* Label + service badge */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Paket Dalam Rute
            </span>
            <Badge
              variant={
                firstPkg.serviceType === 'Same Day' ? 'same-day' :
                firstPkg.serviceType === 'Frozen'   ? 'frozen'   :
                firstPkg.serviceType === 'PHARMA'   ? 'pharma'   : 'regular'
              }
            >
              {firstPkg.serviceType}
            </Badge>
          </div>

          {/* Waybill + weight */}
          <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] px-3 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[14px] font-bold text-[#0F172A]">
              <Package size={14} className="text-[#C91076]" />
              {firstPkg.waybillNumber}
            </span>
            <span className="text-[13px] font-semibold text-[#475569]">{firstPkg.weightKg} Kg</span>
          </div>

          {/* Recipient */}
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-[#C91076] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-[#0F172A]">{firstPkg.recipientName}</p>
              <p className="text-[12px] text-[#475569] leading-snug mt-0.5">{firstPkg.recipientAddress}</p>
            </div>
          </div>

          {/* SLA bar */}
          <SlaBar remainingMinutes={firstPkg.slaRemainingMinutes} elapsedPct={firstPkg.slaElapsedPct} />

          {/* Cold-chain info for Frozen packages */}
          {(isFrozen || hasAnomaly) && (
            <div className={cn(
              'rounded-lg border px-3 py-2.5',
              hasAnomaly ? 'border-blue-200 bg-blue-50' : 'border-blue-100 bg-blue-50/50',
            )}>
              <div className="flex items-center gap-2 mb-1.5">
                <Snowflake size={13} className="text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Cold-Chain Status
                </span>
              </div>
              {hasAnomaly ? (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#475569]">Suhu Saat Ini</span>
                  <span className="text-[14px] font-black text-red-600">
                    {courier.coldChainAnomaly!.currentTempC}°C
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#475569]">Status</span>
                  <span className="text-[12px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Normal
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between mt-1">
                <span className="text-[12px] text-[#475569]">Batas Maksimal</span>
                <span className="text-[12px] font-bold text-[#0F172A]">
                  {courier.coldChainAnomaly?.maxAllowedTempC ?? 5}°C
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={onFocusRoute}
          className="bg-[#C91076] border-[#C91076] hover:bg-[#E51A8A] font-bold text-[13px]"
        >
          <Navigation size={14} />
          {isFocusingRoute ? 'Sedang Fokus' : 'Fokus Rute'}
        </Button>

        <Button variant="secondary" size="md" fullWidth onClick={onContact} className="font-semibold text-[13px]">
          <Phone size={14} />
          Hubungi
        </Button>
      </div>
    </div>
  );
}
