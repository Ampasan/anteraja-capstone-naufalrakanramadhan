import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { apiCached, invalidateApiCache, ApiError, STALE_WHILE_REVALIDATE_MS } from '../../../lib/api';
import {
  mapCourierDetail,
  mapCouriers,
  mapIncident,
  type RawCourier,
  type RawCourierDetail,
  type RawIncident,
  type RawOrder,
} from '../../../lib/mappers';
import { metresBetween } from '../../../lib/courierJourney';
import { readStored, writeStored } from '../../../lib/storage';
import { getUser } from '../../../lib/session';
import { useRealtime, type RealtimeEvent } from '../../../hooks/useRealtime';
import { useIncidentToast } from '../../../hooks/useIncidentToast';
import { useAppContext } from '../../../context/useAppContext';
import { useCourierMotion, type MotionOverride } from './useCourierMotion';
import type {
  Courier,
  CourierFilter,
  IncidentAlert,
} from '../types';
import type { IncidentReport } from '../../incidents/types';

/**
 * Penanda kurir disegarkan tiap 2 detik setelah login dan semua data selesai
 * dimuat. Interval pendek membuat pergerakan kurir terasa real-time.
 */
const POLL_MS = 2_000;
/** TTL lebih pendek dari interval poll supaya tiap siklus benar-benar menembus server. */
const CACHE_TTL_MS = 1_500;
/** Jarak minimal dua refresh yang dipicu realtime, supaya API tidak dibanjiri. */
const REALTIME_THROTTLE_MS = 2_000;

/** Pilihan tab status dan pencarian disimpan per tab agar tidak hilang saat refresh. */
const FILTER_PREF = 'anteraja.monitoring.filter';
const QUERY_PREF = 'anteraja.monitoring.query';

/**
 * Terapkan posisi animasi ke satu kurir. Jarak ke hub ikut dihitung ulang supaya
 * angka di panel detail tetap menjelaskan tempat penanda berada.
 */
function applyMotion(courier: Courier, motion: ReadonlyMap<string, MotionOverride>): Courier {
  const override = motion.get(courier.id);
  if (!override) return courier;

  const distanceFromHubM = Math.round(metresBetween(override.position, courier.hubPosition));
  return {
    ...courier,
    position: override.position,
    route: override.route,
    distanceFromHubM,
    insideRadius:
      courier.hubRadiusKm === undefined
        ? courier.insideRadius
        : distanceFromHubM <= courier.hubRadiusKm * 1000,
  };
}

export interface MonitoringState {
  allCouriers: Courier[];
  filteredCouriers: Courier[];
  selectedCourier: Courier | null;
  activeFilter: CourierFilter;
  searchQuery: string;
  isFocusingRoute: boolean;
  isFullscreen: boolean;
  /** Toast peringatan insiden (jeda 5 detik tiap muat halaman, refresh selalu mengulang). */
  showAnomalyToast: boolean;
  /** Insiden yang sedang dibawa toast, dipakai tombol "Alihkan Paket". */
  currentAlert: IncidentAlert | null;
  currentIncident: IncidentReport | null;
  showRoutes: boolean;
  mapRef: LeafletMap | null;
  counts: { all: number; online: number; idle: number };
  isLoading: boolean;
  errorMessage: string | null;
  /** Epoch ms terakhir siklus load berhasil; dipakai label "data diperbarui". */
  lastLoadedAt: number | null;
}

export interface MonitoringActions {
  selectCourier: (courier: Courier | null) => void;
  setFilter: (filter: CourierFilter) => void;
  setSearchQuery: (q: string) => void;
  toggleFocusRoute: () => void;
  toggleFullscreen: () => void;
  toggleShowRoutes: () => void;
  setMapRef: (map: LeafletMap | null) => void;
  dismissCurrentIncident: () => void;
  refreshData: () => void;
}

export function useMonitoring(): MonitoringState & MonitoringActions {
  const { selectedCourierId, selectCourier: selectCourierId } = useAppContext();

  const [serverCouriers, setServerCouriers] = useState<Courier[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [detailState, setDetailState] = useState<{ id: string; courier: Courier } | null>(null);
  const [activeFilter, setActiveFilter] = useState<CourierFilter>(
    () => readStored<CourierFilter>(FILTER_PREF) ?? 'all',
  );
  const [searchQuery, setSearchQuery] = useState(() => {
    const stored = readStored<unknown>(QUERY_PREF);
    return typeof stored === 'string' ? stored : '';
  });
  const [isFocusingRoute, setIsFocusingRoute] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  // Snapshot baris SLA — dipakai menghitung sisa/estimasi SLA pada panel
  // detail kurir tanpa menambah request baru.
  const slaOrdersRef = useRef<RawOrder[]>([]);
  const lastRefreshAt = useRef(0);

  // Posisi penanda dihitung di sisi klien; server tetap jalan untuk halaman lain.
  const motion = useCourierMotion(serverCouriers);

  const allCouriers = useMemo(
    () => serverCouriers.map((courier) => applyMotion(courier, motion)),
    [serverCouriers, motion],
  );

  // Indeks id -> kurir untuk panel detail, dibangun sekali tiap baris datang.
  const couriersById = useMemo(
    () => new Map(serverCouriers.map((courier) => [courier.id, courier])),
    [serverCouriers],
  );

  // ── Toast peringatan insiden: jeda 5 detik tiap muat halaman, jadi refresh
  //    peta selalu menampilkan peringatan itu lagi (hanya halaman Live
  //    Monitoring yang memasang hook ini).
  const incidentToast = useIncidentToast(incidents);

  // Rantai .then agar setState hanya berjalan di dalam callback.
  const load = useCallback(
    () =>
      Promise.all([
        apiCached<{ couriers: RawCourier[] }>('/couriers', CACHE_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }),
        apiCached<{ orders: RawOrder[] }>('/orders/sla-risk', CACHE_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }),
        apiCached<{ incidents: RawIncident[] }>('/incidents', CACHE_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }),
      ])
        .then(([couriersRes, slaRes, incidentsRes]) => {
          const orders = slaRes.orders ?? [];
          slaOrdersRef.current = orders;
          setServerCouriers(mapCouriers(couriersRes.couriers ?? [], orders));

          setIncidents((incidentsRes.incidents ?? []).map(mapIncident));
          setErrorMessage(null);
          setLastLoadedAt(Date.now());
        })
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat data monitoring.');
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  // ── Polling utama ──
  // Polling dijeda selama tab tersembunyi: hasilnya tidak dilihat siapa pun,
  // sementara siklus 2 detik tetap membebani Supabase dari tiap tab terbuka.
  useEffect(() => {
    void load();

    let timer = window.setInterval(() => void load(), POLL_MS);
    const pause = () => {
      window.clearInterval(timer);
      timer = 0;
    };
    const resume = () => {
      if (timer) return;
      void load();
      timer = window.setInterval(() => void load(), POLL_MS);
    };
    const handleVisibility = () => (document.hidden ? pause() : resume());

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      pause();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [load]);

  // ── Realtime: penyegaran ekstra saat ada kejadian baru dari Reverb ──
  const hubId = useMemo(() => getUser()?.hub_id, []);
  const handleRealtime = useCallback(
    (event: RealtimeEvent) => {
      const now = Date.now();
      if (now - lastRefreshAt.current < REALTIME_THROTTLE_MS) return;
      lastRefreshAt.current = now;
      // Hapus cache endpoint yang benar-benar berubah oleh event ini.
      // Menyapu seluruh cache membuat halaman audit, tabel tugas, dan dropdown
      // hub ikut kedinginan, lalu menembus Supabase lagi pada giliran berikutnya.
      invalidateApiCache(['/couriers', '/orders/sla-risk', '/dashboard/summary']);
      if (event !== 'courier.telemetry') invalidateApiCache('/incidents');
      void load();
    },
    [load],
  );
  useRealtime(hubId, handleRealtime);

  // ── Detail kurir terpilih (nama penerima + paket lengkap) ──
  // Hasil disimpan berpasangan (id, courier) sehingga data lama otomatis
  // diabaikan ketika user memilih kurir lain — tanpa menulis state di effect.
  useEffect(() => {
    if (!selectedCourierId) return;

    let cancelled = false;
    const refreshDetail = () => {
      apiCached<RawCourierDetail>(`/couriers/${selectedCourierId}`, 4000)
        .then((raw) => {
          if (cancelled) return;
          setDetailState({
            id: selectedCourierId,
            courier: mapCourierDetail(raw, undefined, slaOrdersRef.current),
          });
        })
        .catch((error: unknown) => {
          // Id yang sudah lenyap (setelah seeder dijalankan ulang) jangan terus
          // membebani server tiap dua detik.
          if (cancelled || !(error instanceof ApiError) || error.status !== 404) return;
          setDetailState(null);
          selectCourierId(null);
        });
    };

    refreshDetail();
    const timer = window.setInterval(refreshDetail, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedCourierId, selectCourierId]);

  const selectedCourier = useMemo(() => {
    if (!selectedCourierId) return null;
    // Pencarian berbasis Map: daftar kurir berubah tiap poll, jadi peta id ->
    // kurir dibangun sekali per perubahan daftar, bukan dijejaki per pemilihan.
    const base =
      detailState && detailState.id === selectedCourierId
        ? detailState.courier
        : couriersById.get(selectedCourierId) ?? null;

    return base ? applyMotion(base, motion) : null;
  }, [selectedCourierId, detailState, couriersById, motion]);

  // Satu pass untuk ketiga angka. Sebelumnya daftar dipindai tiga kali
  // (length + dua filter) tiap kali berubah — murah untuk 9 kurir, tetap
  // pemborosan yang tidak perlu karena efek ini berjalan tiap poll.
  const counts = useMemo(() => {
    let online = 0;
    let idle = 0;
    for (const courier of allCouriers) {
      if (courier.status === 'ONLINE') online++;
      else if (courier.status === 'IDLE') idle++;
    }
    return { all: allCouriers.length, online, idle };
  }, [allCouriers]);

  // Satu pass untuk filter status sekaligus pencarian. Versi lama menjalankan
  // dua `filter` berurutan, jadi tiap baris dua kali diuji dan array sementara
  // dibuat hanya untuk dilewati lagi oleh pencarian.
  const filteredCouriers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allCouriers.filter((courier) => {
      const matchesStatus =
        activeFilter === 'all' ||
        (activeFilter === 'online'
          ? courier.status === 'ONLINE' || courier.status === 'ALERT'
          : courier.status === 'IDLE');

      if (!matchesStatus) return false;
      if (!q) return true;

      return (
        courier.name.toLowerCase().includes(q) ||
        courier.activePackages.some((p) => p.waybillNumber.toLowerCase().includes(q))
      );
    });
  }, [allCouriers, activeFilter, searchQuery]);

  /** Pilih kurir — sekalian terbangkan peta ke posisinya. */
  const selectCourier = useCallback(
    (courier: Courier | null) => {
      selectCourierId(courier?.id ?? null);
      setIsFocusingRoute(false);
      if (courier && mapRef) {
        mapRef.flyTo([courier.position.lat, courier.position.lng], 16, { duration: 0.8 });
      }
    },
    [mapRef, selectCourierId],
  );

  const toggleFocusRoute = useCallback(() => {
    setIsFocusingRoute((prev) => {
      const next = !prev;
      if (next && selectedCourier && mapRef) {
        const route = selectedCourier.route;
        if (route && route.polyline.length > 0) {
          const lats = route.polyline.map((p) => p.lat);
          const lngs = route.polyline.map((p) => p.lng);
          mapRef.fitBounds(
            [
              [Math.min(...lats), Math.min(...lngs)],
              [Math.max(...lats), Math.max(...lngs)],
            ],
            { padding: [40, 40], maxZoom: 17, animate: true, duration: 0.9 },
          );
        } else {
          mapRef.flyTo([selectedCourier.position.lat, selectedCourier.position.lng], 17, {
            duration: 0.9,
          });
        }
      }
      return next;
    });
  }, [selectedCourier, mapRef]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => {
      // Keluar dari peta penuh sekaligus membatalkan mode fokus rute.
      if (prev) setIsFocusingRoute(false);
      return !prev;
    });
  }, []);

  const toggleShowRoutes = useCallback(() => setShowRoutes((prev) => !prev), []);
  const handleSetFilter = useCallback((f: CourierFilter) => {
    setActiveFilter(f);
    writeStored(FILTER_PREF, f);
  }, []);
  const handleSetSearch = useCallback((q: string) => {
    setSearchQuery(q);
    writeStored(QUERY_PREF, q);
  }, []);
  const handleSetMapRef = useCallback((m: LeafletMap | null) => setMapRef(m), []);

  /** Segarkan paksa: buang cache halaman ini lalu ambil ulang dari server. */
  const refreshData = useCallback(() => {
    invalidateApiCache(['/couriers', '/orders/sla-risk', '/incidents']);
    void load();
  }, [load]);

  return {
    allCouriers,
    filteredCouriers,
    selectedCourier,
    activeFilter,
    searchQuery,
    isFocusingRoute,
    isFullscreen,
    showAnomalyToast: incidentToast.visible,
    currentAlert: incidentToast.alert,
    currentIncident: incidentToast.incident,
    showRoutes,
    mapRef,
    counts,
    isLoading,
    errorMessage,
    lastLoadedAt,
    selectCourier,
    setFilter: handleSetFilter,
    setSearchQuery: handleSetSearch,
    toggleFocusRoute,
    toggleFullscreen,
    toggleShowRoutes,
    setMapRef: handleSetMapRef,
    dismissCurrentIncident: incidentToast.dismiss,
    refreshData,
  };
}
