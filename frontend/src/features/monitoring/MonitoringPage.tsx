import { useCallback, useEffect, useState } from 'react';
import { MapPin, ChevronsRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMonitoring } from './hooks/useMonitoring';
import { CourierList } from './components/CourierList';
import { CourierDetailPanel } from './components/CourierDetailPanel';
import { MapView } from './components/MapView';
import { MapControls } from './components/MapControls';
import { IncidentAlertToast } from './components/IncidentAlertToast';
import { useHubs } from '../../hooks/useHubs';
import type { Courier } from './types';
import type { Map as LeafletMap } from 'leaflet';

export function MonitoringPage() {
  const state = useMonitoring();
  const { activeHub } = useHubs();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const focusCourierId = searchParams.get('courier') ?? undefined;

  const [listOpen, setListOpen] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      state.mapRef?.invalidateSize();
    }, 350);
    return () => clearTimeout(timer);
  }, [state.isFullscreen, state.mapRef]);

  // Auto-focus a courier when arriving from the SLA panel.
  // Parameter URL baru dihapus setelah kurir benar-benar ditemukan — kalau
  // dihapus sejak awal, saat data kurir belum termuat pilihannya langsung
  // hilang dan halaman peta tidak pernah menyorot kurir yang sama.
  useEffect(() => {
    if (!focusCourierId) return;
    const target = state.allCouriers.find((c) => c.id === focusCourierId);
    if (!target) return;

    state.selectCourier(target);
    state.mapRef?.flyTo([target.position.lat, target.position.lng], 16, { duration: 0.8 });
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCourierId, setSearchParams, state.allCouriers, state.mapRef, state.selectCourier]);

  const handleMapReady = useCallback(
    (map: LeafletMap) => state.setMapRef(map),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleToggleFullscreen = useCallback(() => {
    setListOpen(state.isFullscreen);
    state.toggleFullscreen();
  }, [state]);

  const handleShowCourierList = useCallback(() => {
    if (state.isFullscreen) handleToggleFullscreen();
    else setListOpen(true);
  }, [state, handleToggleFullscreen]);

  const handleCourierClick = useCallback(
    (courier: Courier) => state.selectCourier(courier),
    [state],
  );

  /**
   * Tombol "Alihkan Paket" pada toast insiden.
   *
   * Toast peringatan sengaja tidak dibawa ke halaman tujuan: operator sudah
   * membacanya, cukup halaman Incident & Reassign yang terbuka dengan insiden
   * itu tersorot lewat parameter `?incident=`.
   */
  const handleReassignPacket = useCallback(() => {
    const incidentId = state.currentIncident?.id;
    navigate(incidentId ? `/incidents?incident=${incidentId}` : '/incidents');
  }, [navigate, state.currentIncident]);

  return (

    <section
      aria-labelledby="monitoring-title"
      className="flex flex-col h-full overflow-hidden bg-[#F8FAFC]"
    >
      {/* ─ Title bar halaman ─ */}
      <header className="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 bg-white border-b border-[#E2E8F0]">
        {/* Judul + ikon roket */}
        <h2
          id="monitoring-title"
          className="flex items-center gap-2 text-[13px] sm:text-[15px] font-bold text-[#0F172A] m-0"
        >
          <svg
            aria-hidden="true"
            width="17" height="17" viewBox="0 0 24 24"
            fill="none" stroke="#C91076" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
          </svg>
          <span className="hidden sm:inline">Monitoring Armada Aktif</span>
          <span className="sm:hidden">Live Monitoring</span>
        </h2>

        {/* Kontrol peta: Pusatkan Hub + Peta Penuh */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              if (!activeHub) return;
              state.mapRef?.flyTo(
                [activeHub.position.lat, activeHub.position.lng],
                14,
                { duration: 0.8 },
              );
            }}
            className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold text-[#475569] bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-lg px-2 sm:px-3 h-8 sm:h-9 transition-colors"
          >
            <MapPin size={12} className="text-[#C91076]" aria-hidden="true" />
            <span className="hidden sm:inline">Pusatkan Hub</span>
            <span className="sm:hidden">Hub</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-pressed={state.isFullscreen}
            aria-label={state.isFullscreen ? 'Keluar dari mode peta penuh' : 'Aktifkan mode peta penuh'}
            className={`flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[13px] font-semibold rounded-lg px-2 sm:px-3 h-8 sm:h-9 border transition-colors ${
              state.isFullscreen
                ? 'bg-[#C91076] text-white border-[#C91076] hover:bg-[#E51A8A]'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
          >
            <svg
              aria-hidden="true"
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
            >
              {state.isFullscreen
                ? <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>
                : <><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></>
              }
            </svg>
            <span aria-hidden="true" className="hidden sm:inline">
              {state.isFullscreen ? 'Keluar Peta Penuh' : 'Peta Penuh'}
            </span>
          </button>
        </div>
      </header>

      {/* ─ Body row: daftar kurir | peta ─ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ① Panel daftar kurir — collapsible, disembunyikan di fullscreen */}
        {!state.isFullscreen && (
          <CourierList
            couriers={state.filteredCouriers}
            selectedCourier={state.selectedCourier}
            activeFilter={state.activeFilter}
            searchQuery={state.searchQuery}
            counts={state.counts}
            totalCount={state.counts.all}
            isLoading={state.isLoading}
            onSelectCourier={handleCourierClick}
            onFilterChange={state.setFilter}
            onSearchChange={state.setSearchQuery}
            isOpen={listOpen}
            onToggle={() => setListOpen((v) => !v)}
          />
        )}

        {/* ② Peta interaktif — konten mandiri, self-contained */}
        <article
          aria-label="Peta live monitoring kurir"
          className="flex-1 relative min-w-0"
        >
          {activeHub && (
            <MapView
              couriers={state.allCouriers}
              hub={activeHub}
              selectedCourier={state.selectedCourier}
              showRoutes={state.showRoutes}
              onCourierClick={handleCourierClick}
              onMapReady={handleMapReady}
            />
          )}

          {/* Overlay kontrol peta (radius, toggle rute, fullscreen) */}
          <MapControls
            showRoutes={state.showRoutes}
            isFullscreen={state.isFullscreen}
            onToggleRoutes={state.toggleShowRoutes}
            onToggleFullscreen={handleToggleFullscreen}
            onShowCourierList={handleShowCourierList}
            courierCount={state.counts.all}
            hubRadiusKm={activeHub?.radiusKm ?? 5}
            listCollapsed={!listOpen && !state.isFullscreen}
          />

          {/* Tombol expand list — muncul saat panel kurir diciutkan */}
          {!listOpen && !state.isFullscreen && (
            <button
              type="button"
              onClick={() => setListOpen(true)}
              className="absolute top-3 left-3 z-[400] flex items-center gap-1.5 bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs font-bold text-[#C91076] shadow-md hover:bg-[#FFF0F6] transition-colors pointer-events-auto"
            >
              <ChevronsRight size={13} aria-hidden="true" />
              Tampilkan Daftar Kurir ({state.counts.all})
            </button>
          )}

          {/* Panel detail kurir — mengambang kanan atas, sembunyikan saat fullscreen */}
          {state.selectedCourier && !state.isFullscreen && (
            <div className="absolute top-3 right-3 z-[450] pointer-events-auto">
              <CourierDetailPanel
                courier={state.selectedCourier}
                isFocusingRoute={state.isFocusingRoute}
                onClose={() => state.selectCourier(null)}
                onFocusRoute={state.toggleFocusRoute}
                onContact={() => {
                  alert(`Hubungi ${state.selectedCourier!.name}: ${state.selectedCourier!.phone}`);
                }}
              />
            </div>
          )}

          {/* Toast insiden di kanan bawah. Tombol utamanya membawa operator ke
              halaman Incident & Reassign, tanpa membawa toast yang sama. */}
          {state.showAnomalyToast && state.currentAlert && (
            <IncidentAlertToast
              incident={state.currentAlert}
              onReassign={handleReassignPacket}
              onDismiss={state.dismissCurrentIncident}
            />
          )}
        </article>
      </div>
    </section>
  );
}
