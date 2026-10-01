import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { apiCached, invalidateApiCache } from '../../../lib/api';
import {
  mapCourierDetail,
  mapCouriers,
  mapEmergencyPayload,
  mapIncident,
  mapIncidentAlert,
  type RawCourier,
  type RawCourierDetail,
  type RawIncident,
  type RawOrder,
} from '../../../lib/mappers';
import { getUser } from '../../../lib/session';
import { useRealtime } from '../../../hooks/useRealtime';
import { useAppContext } from '../../../context/useAppContext';
import type {
  Courier,
  CourierFilter,
  EmergencyReassignPayload,
  IncidentAlert,
  LatLng,
} from '../types';
import type { IncidentReport } from '../../incidents/types';

/** Panel monitoring menyegarkan data tiap 10 detik (FRD-01). */
const POLL_MS = 10_000;
/** TTL lebih pendek dari interval poll supaya tiap siklus benar-benar menembus server. */
const CACHE_TTL_MS = 8_000;
/** Jarak minimal dua refresh yang dipicu realtime, supaya API tidak dibanjiri. */
const REALTIME_THROTTLE_MS = 2_000;

const DEFAULT_HUB_POSITION: LatLng = { lat: -6.2651893, lng: 106.8767953 };

export interface MonitoringState {
  allCouriers: Courier[];
  filteredCouriers: Courier[];
  selectedCourier: Courier | null;
  activeFilter: CourierFilter;
  searchQuery: string;
  isFocusingRoute: boolean;
  isFullscreen: boolean;
  showAnomalyToast: boolean;
  showReassignModal: boolean;
  showRoutes: boolean;
  mapRef: LeafletMap | null;
  counts: { all: number; online: number; idle: number };
  incidentAlerts: IncidentAlert[];
  currentIncidentIndex: number;
  /** Payload modal pengalihan darurat untuk insiden yang sedang tampil. */
  reassignPayload: EmergencyReassignPayload | null;
  isLoading: boolean;
  errorMessage: string | null;
}

export interface MonitoringActions {
  selectCourier: (courier: Courier | null) => void;
  setFilter: (filter: CourierFilter) => void;
  setSearchQuery: (q: string) => void;
  toggleFocusRoute: () => void;
  toggleFullscreen: () => void;
  dismissAnomalyToast: () => void;
  openReassignModal: () => void;
  closeReassignModal: () => void;
  toggleShowRoutes: () => void;
  setMapRef: (map: LeafletMap | null) => void;
  nextIncident: () => void;
  dismissCurrentIncident: () => void;
  refreshData: () => void;
}

export function useMonitoring(): MonitoringState & MonitoringActions {
  const { selectedCourierId, selectCourier: selectCourierId } = useAppContext();

  const [allCouriers, setAllCouriers] = useState<Courier[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [detailState, setDetailState] = useState<{ id: string; courier: Courier } | null>(null);
  const [activeFilter, setActiveFilter] = useState<CourierFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocusingRoute, setIsFocusingRoute] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnomalyToast, setShowAnomalyToast] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);
  const [currentIncidentIndex, setCurrentIncidentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Snapshot baris SLA — dipakai menghitung sisa/estimasi SLA pada panel
  // detail kurir tanpa menambah request baru.
  const slaOrdersRef = useRef<RawOrder[]>([]);
  const knownIncidentIds = useRef<Set<string>>(new Set());
  const hasLoadedOnce = useRef(false);
  const lastRefreshAt = useRef(0);

  // Rantai .then agar setState hanya berjalan di dalam callback.
  const load = useCallback(
    () =>
      Promise.all([
        apiCached<{ couriers: RawCourier[] }>('/couriers', CACHE_TTL_MS),
        apiCached<{ orders: RawOrder[] }>('/orders/sla-risk', CACHE_TTL_MS),
        apiCached<{ incidents: RawIncident[] }>('/incidents', CACHE_TTL_MS),
      ])
        .then(([couriersRes, slaRes, incidentsRes]) => {
          const orders = slaRes.orders ?? [];
          slaOrdersRef.current = orders;
          setAllCouriers(mapCouriers(couriersRes.couriers ?? [], orders));

          const mapped = (incidentsRes.incidents ?? []).map(mapIncident);

          // Insiden yang belum pernah terlihat -> nyalakan kembali toast peringatan.
          let newIncidents = 0;
          for (const incident of mapped) {
            if (!knownIncidentIds.current.has(incident.id)) newIncidents++;
            knownIncidentIds.current.add(incident.id);
          }
          if (newIncidents > 0 && hasLoadedOnce.current) setShowAnomalyToast(true);
          hasLoadedOnce.current = true;

          setIncidents(mapped);
          setErrorMessage(null);
        })
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat data monitoring.');
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  // ── Polling utama ──
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  // ── Realtime: penyegaran ekstra saat ada kejadian baru dari Reverb ──
  const hubId = getUser()?.hub_id;
  const handleRealtime = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshAt.current < REALTIME_THROTTLE_MS) return;
    lastRefreshAt.current = now;
    invalidateApiCache();
    void load();
  }, [load]);
  useRealtime(hubId, handleRealtime);

  // ── Detail kurir terpilih (nama penerima + paket lengkap) ──
  // Hasil disimpan berpasangan (id, courier) sehingga data lama otomatis
  // diabaikan ketika user memilih kurir lain — tanpa menulis state di effect.
  useEffect(() => {
    if (!selectedCourierId) return;

    let cancelled = false;
    const refreshDetail = () => {
      apiCached<RawCourierDetail>(`/couriers/${selectedCourierId}`, 6000)
        .then((raw) => {
          if (cancelled) return;
          setDetailState({
            id: selectedCourierId,
            courier: mapCourierDetail(raw, undefined, slaOrdersRef.current),
          });
        })
        .catch(() => undefined);
    };

    refreshDetail();
    const timer = window.setInterval(refreshDetail, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedCourierId]);

  const selectedCourier = useMemo(() => {
    if (!selectedCourierId) return null;
    if (detailState && detailState.id === selectedCourierId) return detailState.courier;
    return allCouriers.find((courier) => courier.id === selectedCourierId) ?? null;
  }, [selectedCourierId, detailState, allCouriers]);

  const counts = useMemo(
    () => ({
      all: allCouriers.length,
      online: allCouriers.filter((c) => c.status === 'ONLINE').length,
      idle: allCouriers.filter((c) => c.status === 'IDLE').length,
    }),
    [allCouriers],
  );

  const filteredCouriers = useMemo(() => {
    let list = allCouriers;

    if (activeFilter === 'online') {
      list = list.filter((c) => c.status === 'ONLINE' || c.status === 'ALERT');
    } else if (activeFilter === 'idle') {
      list = list.filter((c) => c.status === 'IDLE');
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.activePackages.some((p) => p.waybillNumber.toLowerCase().includes(q)),
      );
    }

    return list;
  }, [allCouriers, activeFilter, searchQuery]);

  // Toast anomali hanya untuk insiden yang masih aktif — insiden RESOLVED
  // tidak boleh muncul sebagai peringatan hidup.
  const incidentAlerts = useMemo(
    () => incidents.filter((incident) => incident.status !== 'RESOLVED').map(mapIncidentAlert),
    [incidents],
  );

  const activeAlertIndex =
    incidentAlerts.length === 0 ? 0 : currentIncidentIndex % incidentAlerts.length;

  const reassignPayload = useMemo<EmergencyReassignPayload | null>(() => {
    if (incidents.length === 0) return null;
    const incident = incidents[activeAlertIndex];
    if (!incident) return null;
    const hubPosition = allCouriers[0]?.hubPosition ?? DEFAULT_HUB_POSITION;
    return mapEmergencyPayload(incident, hubPosition);
  }, [incidents, activeAlertIndex, allCouriers]);

  // Auto-rotasi insiden tiap 8 detik.
  useEffect(() => {
    if (!showAnomalyToast || incidentAlerts.length < 2) return;
    const timer = window.setInterval(() => {
      setCurrentIncidentIndex((prev) => (prev + 1) % incidentAlerts.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [showAnomalyToast, incidentAlerts.length]);

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

  const dismissAnomalyToast = useCallback(() => setShowAnomalyToast(false), []);
  const openReassignModal = useCallback(() => setShowReassignModal(true), []);
  const closeReassignModal = useCallback(() => setShowReassignModal(false), []);
  const toggleShowRoutes = useCallback(() => setShowRoutes((prev) => !prev), []);
  const handleSetFilter = useCallback((f: CourierFilter) => setActiveFilter(f), []);
  const handleSetSearch = useCallback((q: string) => setSearchQuery(q), []);
  const handleSetMapRef = useCallback((m: LeafletMap | null) => setMapRef(m), []);

  const nextIncident = useCallback(() => {
    setCurrentIncidentIndex((prev) => (prev + 1) % Math.max(incidentAlerts.length, 1));
  }, [incidentAlerts.length]);

  const dismissCurrentIncident = useCallback(() => setShowAnomalyToast(false), []);

  /** Segarkan paksa: buang cache lalu ambil ulang dari server. */
  const refreshData = useCallback(() => {
    invalidateApiCache();
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
    showAnomalyToast,
    showReassignModal,
    showRoutes,
    mapRef,
    counts,
    incidentAlerts,
    currentIncidentIndex: activeAlertIndex,
    reassignPayload,
    isLoading,
    errorMessage,
    selectCourier,
    setFilter: handleSetFilter,
    setSearchQuery: handleSetSearch,
    toggleFocusRoute,
    toggleFullscreen,
    dismissAnomalyToast,
    openReassignModal,
    closeReassignModal,
    toggleShowRoutes,
    setMapRef: handleSetMapRef,
    nextIncident,
    dismissCurrentIncident,
    refreshData,
  };
}
