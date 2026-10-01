import { useState, useMemo, useCallback, useEffect } from 'react';
import { apiCached, invalidateApiCache } from '../../../lib/api';
import {
  mapAuditKpi,
  mapAuditLogs,
  type RawAuditLog,
  type RawAuditSummary,
} from '../../../lib/mappers';
import type {
  AuditLogEntry,
  AuditFilters,
  AuditKpi,
  DateFilterType,
  CategoryFilterType,
  PaginationState,
  CategoryCount,
} from '../types';

const PAGE_SIZE = 5;
/** Audit trail tetap menyegar tiap 20 detik agar pengalihan baru langsung terlihat. */
const POLL_MS = 20_000;
const CACHE_TTL_MS = 19_000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isWithinRange(iso: string, filter: DateFilterType): boolean {
  if (filter === 'all') return true;
  const date = new Date(iso);
  const now = new Date();

  if (filter === 'today') {
    return date >= startOfDay(now);
  }
  if (filter === '7days') {
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= cutoff;
  }
  if (filter === 'month') {
    return (
      date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
    );
  }
  return true;
}

export function useAuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [kpi, setKpi] = useState<AuditKpi>({
    totalCompleted: 0,
    avgHandlingSeconds: 0,
    slaComplianceRate: 0,
    slaCompliantCount: 0,
  });

  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    dateFilter: 'all',
    categoryFilter: 'all',
  });

  const [page, setPage] = useState(1);

  // Rantai .then agar setState hanya berjalan di dalam callback, bukan
  // sinkron dari dalam effect (react-hooks/set-state-in-effect).
  const load = useCallback(
    () =>
      apiCached<{ logs: RawAuditLog[]; summary?: RawAuditSummary }>('/audit-logs', CACHE_TTL_MS)
        .then((payload) => {
          const mapped = mapAuditLogs(payload.logs ?? []);
          setLogs(mapped);
          setKpi(mapAuditKpi(payload.summary, mapped));
          setErrorMessage(null);
        })
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat audit log.');
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const filteredAll = useMemo<AuditLogEntry[]>(() => {
    const q = filters.search.trim().toLowerCase();

    return logs.filter((entry) => {
      // Search: resi or courier name
      if (q && !entry.resi.toLowerCase().includes(q) &&
          !entry.fromCourier.toLowerCase().includes(q) &&
          !entry.toCourier.toLowerCase().includes(q)) {
        return false;
      }

      // Date filter
      if (!isWithinRange(entry.completedAt, filters.dateFilter)) return false;

      // Category filter
      if (filters.categoryFilter !== 'all') {
        if (entry.incidentCategory !== filters.categoryFilter) return false;
      }

      return true;
    });
  }, [logs, filters]);

  const categoryCounts = useMemo<CategoryCount[]>(() => {
    const q = filters.search.trim().toLowerCase();
    const base = logs.filter((entry) => {
      if (q && !entry.resi.toLowerCase().includes(q) &&
          !entry.fromCourier.toLowerCase().includes(q) &&
          !entry.toCourier.toLowerCase().includes(q)) return false;
      if (!isWithinRange(entry.completedAt, filters.dateFilter)) return false;
      return true;
    });

    const counts = base.reduce<Record<string, number>>((acc, e) => {
      acc[e.incidentCategory] = (acc[e.incidentCategory] ?? 0) + 1;
      return acc;
    }, {});

    return [
      { key: 'all',               label: `Semua (${base.length})`,                                      count: base.length },
      { key: 'Cuaca / Hujan',     label: `Cuaca / Hujan (${counts['Cuaca / Hujan'] ?? 0})`,             count: counts['Cuaca / Hujan'] ?? 0 },
      { key: 'Anomali Suhu',      label: `Anomali Suhu (${counts['Anomali Suhu'] ?? 0})`,               count: counts['Anomali Suhu'] ?? 0 },
      { key: 'Mogok Kendaraan',   label: `Mogok Kendaraan (${counts['Mogok Kendaraan'] ?? 0})`,         count: counts['Mogok Kendaraan'] ?? 0 },
      { key: 'Ban Bocor',         label: `Ban Bocor (${counts['Ban Bocor'] ?? 0})`,                     count: counts['Ban Bocor'] ?? 0 },
      { key: 'Banjir',            label: `Banjir (${counts['Banjir'] ?? 0})`,                           count: counts['Banjir'] ?? 0 },
    ] as CategoryCount[];
  }, [logs, filters.search, filters.dateFilter]);

  const totalItems = filteredAll.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const safeCurrentPage = Math.min(page, totalPages);

  const pagedData = useMemo<AuditLogEntry[]>(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredAll.slice(start, start + PAGE_SIZE);
  }, [filteredAll, safeCurrentPage]);

  const pagination: PaginationState = {
    page: safeCurrentPage,
    pageSize: PAGE_SIZE,
    totalItems,
    totalPages,
  };

  const setSearch = useCallback((value: string) => {
    setFilters((f) => ({ ...f, search: value }));
    setPage(1);
  }, []);

  const setDateFilter = useCallback((value: DateFilterType) => {
    setFilters((f) => ({ ...f, dateFilter: value }));
    setPage(1);
  }, []);

  const setCategoryFilter = useCallback((value: CategoryFilterType) => {
    setFilters((f) => ({ ...f, categoryFilter: value }));
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ search: '', dateFilter: 'all', categoryFilter: 'all' });
    setPage(1);
  }, []);

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)));
  }, [totalPages]);

  /** Segarkan paksa: buang cache lalu ambil ulang dari server. */
  const refresh = useCallback(() => {
    invalidateApiCache('/audit-logs');
    return load();
  }, [load]);

  return {
    pagedData,
    filteredAll,
    kpi,
    isLoading,
    errorMessage,
    filters,
    categoryCounts,
    setSearch,
    setDateFilter,
    setCategoryFilter,
    resetFilters,
    pagination,
    goToPage,
    refresh,
  };
}
