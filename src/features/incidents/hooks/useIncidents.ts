import { useState, useMemo, useCallback } from 'react';
import { mockIncidents, incidentKpiSummary } from '../../../data/mockIncidents';
import type {
  IncidentReport,
  CandidateCourier,
  IncidentFilters,
  StatusFilterTab,
  ServiceType,
  ReassignmentPayload,
} from '../types';

export interface UseIncidentsReturn {
  incidents: IncidentReport[];
  filteredIncidents: IncidentReport[];
  kpi: typeof incidentKpiSummary;

  selectedIncidentId: string | null;
  selectedIncident: IncidentReport | null;
  selectedCandidateId: string | null;
  selectedCandidate: CandidateCourier | null;

  filters: IncidentFilters;
  serviceTypeCounts: Record<string, number>;

  isSuccessModalOpen: boolean;
  lastReassignment: ReassignmentPayload | null;

  selectIncident: (id: string) => void;
  selectCandidate: (id: string) => void;
  setSearch: (value: string) => void;
  setStatusTab: (tab: StatusFilterTab) => void;
  setServiceFilter: (service: ServiceType | 'Semua') => void;
  resetFilters: () => void;
  confirmReassignment: () => void;
  closeSuccessModal: () => void;
  refreshData: () => void;
}

const DEFAULT_FILTERS: IncidentFilters = {
  search: '',
  statusTab: 'Semua',
  serviceType: 'Semua',
};

const SEVERITY_TAB_MAP: Record<StatusFilterTab, string | null> = {
  'Semua': null,
  'Kritis': 'CRITICAL',
  'Waspada': 'WARNING',
  'Aman': 'SAFE',
};

export function useIncidents(): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<IncidentReport[]>(mockIncidents);
  const [filters, setFilters] = useState<IncidentFilters>(DEFAULT_FILTERS);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [lastReassignment, setLastReassignment] = useState<ReassignmentPayload | null>(null);

  const selectedIncident = useMemo(
    () => incidents.find((i) => i.id === selectedIncidentId) ?? null,
    [incidents, selectedIncidentId],
  );

  const selectedCandidate = useMemo(() => {
    if (!selectedIncident || !selectedCandidateId) return null;
    return selectedIncident.candidates.find((c) => c.id === selectedCandidateId) ?? null;
  }, [selectedIncident, selectedCandidateId]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
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
  }, [incidents, filters]);

  const serviceTypeCounts = useMemo(() => {
    const counts: Record<string, number> = { 'Semua': incidents.length };
    incidents.forEach((inc) => {
      counts[inc.serviceType] = (counts[inc.serviceType] ?? 0) + 1;
    });
    return counts;
  }, [incidents]);

  const selectIncident = useCallback((id: string) => {
    setSelectedIncidentId((prevSelectedId) => {
      // Tidak perlu re-render jika klik insiden yang sama
      if (prevSelectedId === id) return prevSelectedId;

      setIncidents((prev) => {
        return prev.map((inc) => {
          // Insiden yang baru dipilih: ubah ke 'Sedang Ditinjau' jika masih 'Klik untuk Evaluasi'
          if (inc.id === id) {
            // Auto-select kandidat terbaik
            const recommended = inc.candidates.find((c) => c.isRecommended);
            setSelectedCandidateId(recommended?.id ?? inc.candidates[0]?.id ?? null);
            return inc.statusLabel === 'Klik untuk Evaluasi'
              ? { ...inc, statusLabel: 'Sedang Ditinjau' }
              : inc;
          }
          // Insiden yang sebelumnya dipilih: kembalikan ke 'Klik untuk Evaluasi' jika bukan yang sudah selesai
          if (inc.id === prevSelectedId && inc.statusLabel === 'Sedang Ditinjau') {
            return { ...inc, statusLabel: 'Klik untuk Evaluasi' };
          }
          return inc;
        });
      });

      return id;
    });
  }, []);

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

  const confirmReassignment = useCallback(() => {
    if (!selectedIncident || !selectedCandidate) return;

    const payload: ReassignmentPayload = {
      incidentId: selectedIncident.id,
      waybillNumber: selectedIncident.waybillNumber,
      originalCourier: selectedIncident.courier,
      selectedCandidate,
      confirmedAt: new Date().toISOString(),
    };

    setLastReassignment(payload);
    setIsSuccessModalOpen(true);

    // Tandai insiden sebagai telah dialihkan
    setIncidents((prev) =>
      prev.map((inc) =>
        inc.id === selectedIncident.id
          ? { ...inc, status: 'REASSIGNED', statusLabel: 'Telah Dialihkan' }
          : inc,
      ),
    );
  }, [selectedIncident, selectedCandidate]);

  const closeSuccessModal = useCallback(() => {
    setIsSuccessModalOpen(false);
    setSelectedIncidentId(null);
    setSelectedCandidateId(null);
  }, []);

  const refreshData = useCallback(() => {
    setIncidents([...mockIncidents]);
    setFilters(DEFAULT_FILTERS);
    setSelectedIncidentId(null);
    setSelectedCandidateId(null);
    setLastReassignment(null);
  }, []);

  return {
    incidents,
    filteredIncidents,
    kpi: incidentKpiSummary,
    selectedIncidentId,
    selectedIncident,
    selectedCandidateId,
    selectedCandidate,
    filters,
    serviceTypeCounts,
    isSuccessModalOpen,
    lastReassignment,
    selectIncident,
    selectCandidate,
    setSearch,
    setStatusTab,
    setServiceFilter,
    resetFilters,
    confirmReassignment,
    closeSuccessModal,
    refreshData,
  };
}
