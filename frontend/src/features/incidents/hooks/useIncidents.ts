import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { api, apiCached, invalidateApiCache } from '../../../lib/api';
import { mapIncidents, type RawIncident } from '../../../lib/mappers';
import type {
  IncidentReport,
  CandidateCourier,
  IncidentFilters,
  StatusFilterTab,
  ServiceType,
  ReassignmentPayload,
  IncidentKpiSummary,
} from '../types';

export interface UseIncidentsReturn {
  incidents: IncidentReport[];
  filteredIncidents: IncidentReport[];
  kpi: IncidentKpiSummary;

  selectedIncidentId: string | null;
  selectedIncident: IncidentReport | null;
  selectedCandidateId: string | null;
  selectedCandidate: CandidateCourier | null;

  filters: IncidentFilters;
  serviceTypeCounts: Record<string, number>;

  isSuccessModalOpen: boolean;
  lastReassignment: ReassignmentPayload | null;

  /** Sedang mengirim pengalihan ke server. */
  isSubmitting: boolean;
  /** Pesan galat terakhir (409 konflik, 422 muatan berlebih, dsb). */
  errorMessage: string | null;
  isLoading: boolean;

  selectIncident: (id: string) => void;
  selectCandidate: (id: string) => void;
  setSearch: (value: string) => void;
  setStatusTab: (tab: StatusFilterTab) => void;
  setServiceFilter: (service: ServiceType | 'Semua') => void;
  resetFilters: () => void;
  clearError: () => void;
  confirmReassignment: () => Promise<void>;
  closeSuccessModal: () => void;
  refreshData: () => void;
}

const DEFAULT_FILTERS: IncidentFilters = {
  search: '',
  statusTab: 'Semua',
  serviceType: 'Semua',
};

/** Insiden ditandai "Sedang Ditinjau" hanya di tampilan, bukan di data asli. */
const REVIEWING_LABEL = 'Sedang Ditinjau';
const REVIEWABLE_LABEL = 'Klik untuk Evaluasi';

const SEVERITY_TAB_MAP: Record<StatusFilterTab, string | null> = {
  'Semua': null,
  'Kritis': 'CRITICAL',
  'Waspada': 'WARNING',
  'Aman': 'SAFE',
};

const POLL_MS = 10_000;
const CACHE_TTL_MS = 8_000;

export function useIncidents(): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [filters, setFilters] = useState<IncidentFilters>(DEFAULT_FILTERS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastReassignment, setLastReassignment] = useState<ReassignmentPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kunci anti klik-ganda pada tombol konfirmasi.
  const submitLock = useRef(false);

  // Rantai .then agar setState hanya berjalan di dalam callback.
  const load = useCallback(
    () =>
      apiCached<{ incidents: RawIncident[] }>('/incidents', CACHE_TTL_MS)
        .then((payload) => {
          setIncidents(mapIncidents(payload.incidents ?? []));
          setErrorMessage(null);
        })
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat data insiden.');
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  /** Versi tampilan: insiden terpilih diberi label "Sedang Ditinjau". */
  const displayIncidents = useMemo(
    () =>
      incidents.map((inc) =>
        inc.id === selectedIncidentId &&
        inc.statusLabel === REVIEWABLE_LABEL &&
        inc.status === 'REPORTED'
          ? { ...inc, statusLabel: REVIEWING_LABEL }
          : inc,
      ),
    [incidents, selectedIncidentId],
  );

  const selectedIncident = useMemo(
    () => displayIncidents.find((i) => i.id === selectedIncidentId) ?? null,
    [displayIncidents, selectedIncidentId],
  );

  const selectedCandidate = useMemo(() => {
    if (!selectedIncident || !selectedCandidateId) return null;
    return selectedIncident.candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [selectedIncident, selectedCandidateId]);

  const filteredIncidents = useMemo(() => {
    return displayIncidents.filter((inc) => {
      // Search: resi atau nama kurir
      if (filters.search.trim()) {
        const q = filters.search.toLowerCase();
        const matchesWaybill = inc.waybillNumber.toLowerCase().includes(q);
        const matchesCourier = inc.courier.name.toLowerCase().includes(q);
        if (!matchesWaybill && !matchesCourier) return false;
      }

      // Status tab
      const severityFilter = SEVERITY_TAB_MAP[filters.statusTab];
      if (severityFilter && inc.severity !== severityFilter) return false;

      // Service type
      if (filters.serviceType !== 'Semua' && inc.serviceType !== filters.serviceType) return false;

      return true;
    });
  }, [displayIncidents, filters]);

  const serviceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Semua': displayIncidents.length };
    displayIncidents.forEach((inc) => {
      counts[inc.serviceType] = (counts[inc.serviceType] ?? 0) + 1;
    });
    return counts;
  }, [displayIncidents]);

  const selectIncident = useCallback(
    (id: string) => {
      if (selectedIncidentId === id) return;
      setSelectedIncidentId(id);

      // Auto-select kandidat terbaik saat insiden dibuka.
      const target = displayIncidents.find((inc) => inc.id === id);
      const recommended = target?.candidates.find((c) => c.isRecommended);
      setSelectedCandidateId(recommended?.id ?? target?.candidates[0]?.id ?? null);
    },
    [displayIncidents, selectedIncidentId],
  );

  const selectCandidate = useCallback((id: string) => {
    setSelectedCandidateId(id);
  }, []);

  const setSearch = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const setStatusTab = useCallback((tab: StatusFilterTab) => {
    setFilters((prev) => ({ ...prev, statusTab: tab }));
  }, []);

  const setServiceFilter = useCallback((service: ServiceType | 'Semua') => {
    setFilters((prev) => ({ ...prev, serviceType: service }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  /** Kirim pengalihan 1-klik ke backend (FRD-03). */
  const confirmReassignment = useCallback(async () => {
    if (!selectedIncident || !selectedCandidate || submitLock.current) return;

    submitLock.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await api(`/incidents/${selectedIncident.id}/reassign`, {
        method: 'POST',
        body: JSON.stringify({ replacement_courier_id: selectedCandidate.id }),
      });

      const payload: ReassignmentPayload = {
        incidentId: selectedIncident.id,
        waybillNumber: selectedIncident.waybillNumber,
        originalCourier: selectedIncident.courier,
        selectedCandidate,
        confirmedAt: new Date().toISOString(),
      };
      setLastReassignment(payload);
      setIsSuccessModalOpen(true);

      // Insiden sudah berstatus RESOLVED di server — muat ulang agar panel,
      // KPI, dan audit trail langsung mencerminkan hasilnya.
      invalidateApiCache();
      await load();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Pengalihan gagal dilakukan. Coba lagi.',
      );
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  }, [selectedIncident, selectedCandidate, load]);

  const closeSuccessModal = useCallback(() => {
    setIsSuccessModalOpen(false);
    setSelectedIncidentId(null);
    setSelectedCandidateId(null);
  }, []);

  /** Segarkan paksa: buang cache lalu ambil ulang dari server. */
  const refreshData = useCallback(() => {
    invalidateApiCache('/incidents');
    void load();
  }, [load]);

  const kpi = useMemo<IncidentKpiSummary>(() => {
    // Insiden RESOLVED sudah ditangani — jangan lagi dihitung sebagai kendala aktif.
    const active = displayIncidents.filter((incident) => incident.status !== 'RESOLVED');

    return {
      critical: active.filter((incident) => incident.severity === 'CRITICAL').length,
      warning: active.filter((incident) => incident.severity === 'WARNING').length,
      safePercent: displayIncidents.length
        ? Math.round(
            (displayIncidents.filter((incident) => incident.status === 'RESOLVED').length /
              displayIncidents.length) *
              100,
          )
        : 0,
    };
  }, [displayIncidents]);

  return {
    incidents: displayIncidents,
    filteredIncidents,
    kpi,
    selectedIncidentId,
    selectedIncident,
    selectedCandidateId,
    selectedCandidate,
    filters,
    serviceTypeCounts,
    isSuccessModalOpen,
    lastReassignment,
    isSubmitting,
    errorMessage,
    isLoading,
    selectIncident,
    selectCandidate,
    setSearch,
    setStatusTab,
    setServiceFilter,
    resetFilters,
    clearError,
    confirmReassignment,
    closeSuccessModal,
    refreshData,
  };
}
