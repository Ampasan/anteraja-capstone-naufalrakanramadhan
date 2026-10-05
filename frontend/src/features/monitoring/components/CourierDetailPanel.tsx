import { X, Bike, Car, Truck, Package, MapPin, Clock, Phone, Navigation, AlertTriangle, Snowflake, Route } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import { formatDistance } from '../../../lib/mappers';
import type { ActivePackage, Courier } from '../types';

/** Icon kendaraan sesuai tipe armada. */
function VehicleIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  if (t.includes('motor') || t.includes('motorcycle') || t.includes('motor listrik')) return <Bike size={12} />;
  if (t.includes('van') || t.includes('blind van')) return <Car size={12} />;
  if (t.includes('truk') || t.includes('truck') || t.includes('pick up') || t.includes('pickup')) return <Truck size={12} />;
  return <Bike size={12} />;
}

interface CourierDetailPanelProps {
  courier: Courier;
  isFocusingRoute: boolean;
  onClose: () => void;
  onFocusRoute: () => void;
}

/**
 * Baris sisa SLA pada kartu paket.
 */
function SlaBar({ remainingMinutes, elapsedPct }: { remainingMinutes: number; elapsedPct: number }) {
  const isLate = remainingMinutes < 0;
  const pct = Math.max(0, Math.min(100, Math.round(elapsedPct)));
  const danger = isLate || elapsedPct >= 80 || remainingMinutes <= 15;
  const fill = danger ? '#EF4444' : '#F59E0B';

  return (
    <div className={cn(
      'rounded-lg border px-3 py-3',
      isLate ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50',
    )}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <span className={cn(
          'text-[13px] font-bold flex items-center gap-1.5',
          isLate ? 'text-red-600' : 'text-amber-700',
        )}>
          <Clock size={13} />
          {isLate
            ? `Terlambat ${Math.abs(remainingMinutes)} Menit`
            : `Sisa SLA: ${remainingMinutes} Menit`}
        </span>
        <span className="text-[12px] font-bold text-[#0F172A] whitespace-nowrap">
          {pct}% Menuju Batas
        </span>
      </div>
      <div className="h-2.5 bg-white/70 border border-black/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: fill }}
        />
      </div>
    </div>
  );
}

/**
 * Panel detail pengiriman di atas peta.
 *
 * Dua tata letak, sesuai status kurir:
 *
 *  - IDLE  : kurir sedang menahan paket, jadi panelnya lengkap — label
 *            "Paket Dalam Rute", no resi, jenis layanan, penerima, dan
 *            baris sisa SLA.
 *  - ONLINE: cukup identitas armada (foto inisial, nama, kendaraan, status),
 *            jarak ke hub, radius layanan, Fokus Rute, dan Hubungi. Tidak ada
 *            rute yang sedang berjalan untuk kurir yang sedang bergerak.
 */
export function CourierDetailPanel({
  courier,
  isFocusingRoute,
  onClose,
  onFocusRoute,
}: CourierDetailPanelProps) {
  const isIdle = courier.status === 'IDLE';
  const hasRoute = !!courier.route && courier.route.polyline.length > 1;
  const hasAnomaly = !!courier.coldChainAnomaly;

  // Kartu paket hanya untuk kurir IDLE; paket paling mendesak jadi wajahnya.
  const shownPkg: ActivePackage | undefined = isIdle
    ? courier.activePackages.reduce<ActivePackage | undefined>(
        (worst, pkg) =>
          !worst || pkg.slaRemainingMinutes < worst.slaRemainingMinutes ? pkg : worst,
        undefined,
      )
    : undefined;

  const isFrozen = shownPkg?.serviceType === 'Frozen';

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
                  <VehicleIcon type={courier.vehicle} />
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

      {/* ── Posisi relatif terhadap hub ── */}
      <div className="px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#475569] flex items-center gap-1.5">
            <MapPin size={12} className="text-[#C91076]" />
            Jarak ke hub
          </span>
          <span className="text-[12px] font-bold text-[#0F172A]">
            {courier.distanceFromHubM === undefined ? '—' : formatDistance(courier.distanceFromHubM)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#475569]">Nomor telepon</span>
          <a
            href={`tel:${courier.phone.replace(/\s+/g, '')}`}
            className="text-[12px] font-bold text-[#C91076] flex items-center gap-1 hover:underline"
            title={`Telepon ${courier.name}`}
          >
            <Phone size={12} aria-hidden="true" />
            {courier.phone}
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#475569]">Radius layanan</span>
          <span
            className={cn(
              'text-[12px] font-bold flex items-center gap-1',
              courier.insideRadius === false ? 'text-red-600' : 'text-emerald-600',
            )}
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                courier.insideRadius === false ? 'bg-red-500' : 'bg-emerald-500',
              )}
            />
            {courier.insideRadius === false
              ? `Di luar ${courier.hubRadiusKm ?? '—'} km`
              : `Di dalam ${courier.hubRadiusKm ?? '—'} km`}
          </span>
        </div>
      </div>

      {/* ── Paket dalam rute (khusus kurir IDLE) ── */}
      {shownPkg && (
        <div className="px-4 py-3 flex flex-col gap-3 border-b border-[#E2E8F0]">
          {/* Label + service badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
              Paket Dalam Rute
            </span>
            <span className="flex items-center gap-1.5">
              <Badge
                variant={
                  shownPkg.serviceType === 'Same Day' ? 'same-day' :
                  shownPkg.serviceType === 'Frozen'   ? 'frozen'   :
                  shownPkg.serviceType === 'PHARMA'   ? 'pharma'   : 'regular'
                }
              >
                {shownPkg.serviceType}
              </Badge>
            </span>
          </div>

          {/* Waybill + weight */}
          <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] px-3 py-2.5">
            <span className="flex items-center gap-2 font-mono text-[14px] font-bold text-[#0F172A]">
              <Package size={14} className="text-[#C91076]" />
              {shownPkg.waybillNumber}
            </span>
            <span className="text-[13px] font-semibold text-[#475569]">{shownPkg.weightKg} Kg</span>
          </div>

          {/* Recipient */}
          <div className="flex items-start gap-2">
            <MapPin size={15} className="text-[#C91076] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-[#0F172A]">{shownPkg.recipientName}</p>
              <p className="text-[12px] text-[#475569] leading-snug mt-0.5">{shownPkg.recipientAddress}</p>
            </div>
          </div>

          {/* SLA bar */}
          <SlaBar
            remainingMinutes={shownPkg.slaRemainingMinutes}
            elapsedPct={shownPkg.slaElapsedPct}
          />

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
      <div className="px-4 pb-4 pt-3 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
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
          {/* Status rute: kurir yang sedang bergerak tidak punya rute berjalan. */}
          <span className={cn(
            'flex items-center justify-center gap-1 text-[10px] font-semibold leading-tight text-center',
            hasRoute ? 'text-[#64748B]' : 'text-[#94A3B8]',
          )}>
            <Route size={10} aria-hidden="true" />
            {hasRoute ? 'Kurir → titik drop' : 'Tidak ada rute aktif'}
          </span>
        </div>

        <a
          href={`tel:${courier.phone.replace(/\s+/g, '')}`}
          className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-semibold rounded-lg transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076] focus-visible:ring-offset-1 bg-white text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] active:bg-[#F1F5F9] shadow-sm font-semibold text-[13px] self-start"
          title={`Telepon ${courier.name} di ${courier.phone}`}
        >
          <Phone size={14} aria-hidden="true" />
          Hubungi
        </a>
      </div>
    </div>
  );
}
