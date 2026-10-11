import { memo } from 'react';
import { Radio, Route, List } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface MapControlsProps {
  showRoutes: boolean;
  isFullscreen: boolean;
  onToggleRoutes: () => void;
  onToggleFullscreen: () => void;
  onShowCourierList: () => void;
  courierCount: number;
  hubRadiusKm: number;
  listCollapsed?: boolean;
}

function MapControlsComponent({
  showRoutes,
  isFullscreen,
  onToggleRoutes,
  onShowCourierList,
  courierCount,
  hubRadiusKm,
  listCollapsed = false,
}: MapControlsProps) {
  return (
    <>
      {/* ─ Top-left overlay ─ */}
      <div className="absolute top-3 left-3 z-[400] flex flex-col gap-2 pointer-events-auto">

        {/* "Tampilkan Daftar Kurir" — fullscreen mode only (non-fullscreen handled by MonitoringPage) */}
        {isFullscreen && (
          <button
            onClick={onShowCourierList}
            className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#C91076] shadow-md hover:bg-[#FFF0F6] transition-colors"
          >
            <List size={13} />
            » Tampilkan Daftar Kurir ({courierCount})
          </button>
        )}

        {!listCollapsed && (
          <>
            {/* Radius Hub */}
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-sm">
              <Radio size={13} className="text-[#C91076]" />
              <span className="text-xs font-semibold text-[#475569]">
                Radius Hub:{' '}
                <span className="font-black text-[#C91076]">{hubRadiusKm} KM</span>
              </span>
            </div>

            {/* Route toggle */}
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-sm">
              <Route size={13} className="text-[#C91076]" />
              <span className="text-xs font-semibold text-[#475569]">Rute Aktif</span>
              <button
                onClick={onToggleRoutes}
                role="switch"
                aria-checked={showRoutes}
                className={cn(
                  'relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ml-1',
                  showRoutes ? 'bg-[#C91076]' : 'bg-[#CBD5E1]',
                )}
              >
                <span
                  className={cn(
                    'inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5',
                    showRoutes ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>
          </>
        )}

        {/* When collapsed: show radius + route controls below the expand button */}
        {listCollapsed && (
          <div className="flex flex-col gap-2 mt-8">
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-sm">
              <Radio size={13} className="text-[#C91076]" />
              <span className="text-xs font-semibold text-[#475569]">
                Radius Hub:{' '}
                <span className="font-black text-[#C91076]">{hubRadiusKm} KM</span>
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 shadow-sm">
              <Route size={13} className="text-[#C91076]" />
              <span className="text-xs font-semibold text-[#475569]">Rute Aktif</span>
              <button
                onClick={onToggleRoutes}
                role="switch"
                aria-checked={showRoutes}
                className={cn(
                  'relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ml-1',
                  showRoutes ? 'bg-[#C91076]' : 'bg-[#CBD5E1]',
                )}
              >
                <span
                  className={cn(
                    'inline-block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 mt-0.5',
                    showRoutes ? 'translate-x-4' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─ Bottom legend ─ */}
      <div className="absolute bottom-3 left-3 z-[400] pointer-events-none">
        <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm border border-[#E2E8F0] rounded-lg px-3 py-1.5 shadow-sm">
          <Dot color="#10B981" label="Standby" />
          <Sep />
          <Dot color="#F59E0B" label="Mengantar" />
          <Sep />
          <Dot color="#EF4444" label="Cold-Chain Kritis" />
        </div>
      </div>
    </>
  );
}

function Dot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#475569]">
      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}
/** Dibungkus `memo`: kontrol tidak ikut re-render tiap kelipatan animasi penanda. */
export const MapControls = memo(MapControlsComponent);

function Sep() {
  return <span className="text-[#CBD5E1] text-sm leading-none">·</span>;
}
