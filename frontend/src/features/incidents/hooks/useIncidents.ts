import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { apiWithStatus, apiCached, invalidateApiCache, waitForTask, STALE_WHILE_REVALIDATE_MS, type AsyncTask } from '../../../lib/api';
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
  notification: AsyncTask | null;
  isSubmitting: boolean;
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

/** Isi `data` dari POST /incidents/{id}/reassign. */
interface ReassignResult {
  confirmation_code?: string;
  audit_log_id?: string;
  notification?: { task_id?: string; status?: string; message?: string };
}

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
  const [notification, setNotification] = useState<AsyncTask | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /**
   * Kepatuhan pengalihan 1-klik (%) dari server. Disimpan terpisah dari
   * `incidents` karena tidak bisa dihitung dari daftar insiden: insiden
   * yang masih berjalan belum punya durasi penanganan.
   */
  const [oneClickRate, setOneClickRate] = useState<number | null>(null);

  // Kunci anti klik-ganda pada tombol konfirmasi.
  const submitLock = useRef(false);

  // Rantai .then agar setState hanya berjalan di dalam callback.
  const apply = useCallback(
    (payload: { incidents: RawIncident[]; summary?: { one_click_rate?: number } }) => {
      setIncidents(mapIncidents(payload.incidents ?? []));
      setOneClickRate(payload.summary?.one_click_rate ?? null);
      setErrorMessage(null);
    },
    [],
  );

  const load = useCallback(
    () =>
      apiCached<{ incidents: RawIncident[]; summary?: { one_click_rate?: number } }>(
        '/incidents',
        CACHE_TTL_MS,
        { staleMs: STALE_WHILE_REVALIDATE_MS, onRevalidated: apply },
      )
        .then(apply)
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat data insiden.');
        })
        .finally(() => setIsLoading(false)),
    [apply],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  /**
   * Versi tampilan: tampilkan SEMUA insiden (termasuk RESOLVED).
   * Insiden berstatus REPORTED/ESCALATED diberi label "Sedang Ditinjau"
   * begitu dipilih — keduanya sama-sama menunggu evaluasi admin.
   */
  const displayIncidents = useMemo(
    () =>
      incidents.map((inc) =>
        inc.id === selectedIncidentId &&
        inc.statusLabel === REVIEWABLE_LABEL &&
        (inc.status === 'REPORTED' || inc.status === 'ESCALATED')
          ? { ...inc, statusLabel: REVIEWING_LABEL }
          : inc,
      ),
    [incidents, selectedIncidentId],
  );

  // Indeks id -> baris tampilan. Dibangun sekali tiap daftar berubah, lalu
  // dipakai pemilihan insiden dan pencarian kandidat tanpa pemindaian linear.
  const displayById = useMemo(
    () => new Map(displayIncidents.map((inc) => [inc.id, inc])),
    [displayIncidents],
  );

  const selectedIncident = useMemo(
    () => (selectedIncidentId ? (displayById.get(selectedIncidentId) ?? null) : null),
    [displayById, selectedIncidentId],
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
    const counts: Record<string, number> = { 'Semua': filteredIncidents.length };
    filteredIncidents.forEach((inc) => {
      counts[inc.serviceType] = (counts[inc.serviceType] ?? 0) + 1;
    });
    return counts;
  }, [filteredIncidents]);

  const selectIncident = useCallback(
    (id: string) => {
      if (selectedIncidentId === id) return;
      setSelectedIncidentId(id);

      // Auto-select kandidat terbaik saat insiden dibuka.
      const target = displayById.get(id);
      const recommended = target?.candidates.find((c) => c.isRecommended);
      setSelectedCandidateId(recommended?.id ?? target?.candidates[0]?.id ?? null);
    },
    [displayById, selectedIncidentId],
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
      const result = await apiWithStatus<ReassignResult>(
        `/incidents/${selectedIncident.id}/reassign`,
        {
          method: 'POST',
          body: JSON.stringify({ replacement_courier_id: selectedCandidate.id }),
        },
      );

      const payload: ReassignmentPayload = {
        incidentId: selectedIncident.id,
        waybillNumber: selectedIncident.waybillNumber,
        serviceLabel: selectedIncident.serviceLabel,
        originalCourier: selectedIncident.courier,
        selectedCandidate,
        confirmedAt: new Date().toISOString(),
      };
      setLastReassignment(payload);
      setIsSuccessModalOpen(true);

      const taskId = result.data?.notification?.task_id;
      if (taskId) {
        setNotification({
          id: taskId,
          type: 'notifikasi_pengalihan',
          status: result.data?.notification?.status === 'processing' ? 'processing' : 'accepted',
          message: result.data?.notification?.message ?? 'Permintaan diterima, menunggu diproses.',
          updated_at: new Date().toISOString(),
        });
        void waitForTask(taskId, { onUpdate: setNotification });
      } else {
        setNotification(null);
      }

      invalidateApiCache([
        '/incidents',
        '/audit-logs',
        '/dashboard/summary',
        '/orders/sla-risk',
        '/tugas/tabel',
        '/couriers',
      ]);
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

  const refreshData = useCallback(() => {
    invalidateApiCache('/incidents');
    void load();
  }, [load]);

  const kpi = useMemo<IncidentKpiSummary>(() => {
    let resolved = 0;
    let critical = 0;
    let warning = 0;

    for (const incident of incidents) {
      if (incident.status === 'RESOLVED') resolved++;
    }
    for (const incident of displayIncidents) {
      if (incident.severity === 'CRITICAL') critical++;
      else if (incident.severity === 'WARNING') warning++;
    }

    const safePercent =
      oneClickRate ?? (incidents.length ? Math.round((resolved / incidents.length) * 100) : 0);

    return { critical, warning, safePercent };
  }, [displayIncidents, incidents, oneClickRate]);

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
    notification,
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
