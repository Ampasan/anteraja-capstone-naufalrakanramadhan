import { useState, useMemo, useCallback } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { mockCouriers } from '../../../data/mockCouriers';
import type { Courier, CourierFilter } from '../types';

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
}

export function useMonitoring(): MonitoringState & MonitoringActions {
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [activeFilter, setActiveFilter] = useState<CourierFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocusingRoute, setIsFocusingRoute] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnomalyToast, setShowAnomalyToast] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
  const [mapRef, setMapRef] = useState<LeafletMap | null>(null);

  const allCouriers = mockCouriers;

  const counts = useMemo(() => ({
    all:    allCouriers.length,
    online: allCouriers.filter((c) => c.status === 'ONLINE').length,
    idle:   allCouriers.filter((c) => c.status === 'IDLE').length,
  }), [allCouriers]);

  const filteredCouriers = useMemo(() => {
    let list = allCouriers;

    // Status filter
    if (activeFilter === 'online') {
      list = list.filter((c) => c.status === 'ONLINE' || c.status === 'ALERT');
    } else if (activeFilter === 'idle') {
      list = list.filter((c) => c.status === 'IDLE');
    }

    // Search filter
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

  /** Select a courier — also fly map to their position */
  const selectCourier = useCallback((courier: Courier | null) => {
    setSelectedCourier(courier);
    setIsFocusingRoute(false);
    if (courier && mapRef) {
      mapRef.flyTo([courier.position.lat, courier.position.lng], 16, { duration: 0.8 });
    }
  }, [mapRef]);

  /** Toggle route focus — zoom in and follow the active route */
  const toggleFocusRoute = useCallback(() => {
    setIsFocusingRoute((prev) => {
      const next = !prev;
      if (next && selectedCourier && mapRef) {
        if (selectedCourier.route && selectedCourier.route.polyline.length > 0) {
          // Fit the map bounds to the full route
          const lats = selectedCourier.route.polyline.map((p) => p.lat);
          const lngs = selectedCourier.route.polyline.map((p) => p.lng);
          mapRef.fitBounds(
            [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]],
            { padding: [40, 40], maxZoom: 17, animate: true, duration: 0.9 },
          );
        } else {
          mapRef.flyTo([selectedCourier.position.lat, selectedCourier.position.lng], 17, { duration: 0.9 });
        }
      }
      return next;
    });
  }, [selectedCourier, mapRef]);

  /** Toggle fullscreen — hide sidebar + courier list */
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    // When exiting fullscreen also cancel focus mode
    if (isFullscreen) setIsFocusingRoute(false);
  }, [isFullscreen]);

  const dismissAnomalyToast = useCallback(() => setShowAnomalyToast(false), []);
  const openReassignModal   = useCallback(() => setShowReassignModal(true), []);
  const closeReassignModal  = useCallback(() => setShowReassignModal(false), []);
  const toggleShowRoutes    = useCallback(() => setShowRoutes((p) => !p), []);
  const handleSetFilter     = useCallback((f: CourierFilter) => setActiveFilter(f), []);
  const handleSetSearch     = useCallback((q: string) => setSearchQuery(q), []);
  const handleSetMapRef     = useCallback((m: LeafletMap | null) => setMapRef(m), []);

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
  };
}
