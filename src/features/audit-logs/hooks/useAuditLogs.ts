import { useState, useMemo, useCallback } from 'react';
import { mockAuditLogs, auditKpi } from '../../../data/mockAuditLogs';
import type {
  AuditLogEntry,
  AuditFilters,
  DateFilterType,
  CategoryFilterType,
  PaginationState,
  CategoryCount,
} from '../types';

const PAGE_SIZE = 5;

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
  const [filters, setFilters] = useState<AuditFilters>({
    search: '',
    dateFilter: 'all',
    categoryFilter: 'all',
  });

  const [page, setPage] = useState(1);

  const filteredAll = useMemo<AuditLogEntry[]>(() => {
    const q = filters.search.trim().toLowerCase();

    return mockAuditLogs.filter((entry) => {
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
  }, [filters]);

  const categoryCounts = useMemo<CategoryCount[]>(() => {
    const q = filters.search.trim().toLowerCase();
    const base = mockAuditLogs.filter((entry) => {
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
  }, [filters.search, filters.dateFilter]);

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

  return {
    pagedData,
    filteredAll,
    kpi: auditKpi,
    filters,
    categoryCounts,
    setSearch,
    setDateFilter,
    setCategoryFilter,
    resetFilters,
    pagination,
    goToPage,
  };
}
