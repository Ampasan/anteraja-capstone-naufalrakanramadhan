import { useState, useMemo, useCallback, useEffect } from 'react';
import { apiCached, invalidateApiCache, STALE_WHILE_REVALIDATE_MS } from '../../../lib/api';
import {
  mapAuditKpi,
  mapAuditLogs,
  type RawAuditLog,
  type RawAuditSummary,
} from '../../../lib/mappers';
import { operationalNow } from '../../../lib/operationalClock';
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

/**
 * Urutkan terbaru di atas — jaminan pengurutan tidak bergantung pada urutan server.
 * Waktu operasional dibekukan, jadi beberapa baris bisa berbagi `completedAt`
 * identik; `id` UUIDv7 menurun dipakai sebagai pembuat keputusan terakhir.
 */
function newestFirst(entries: AuditLogEntry[]): AuditLogEntry[] {
  return [...entries].sort((a, b) => {
    const byTime = new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
    return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
  });
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isWithinRange(iso: string, filter: DateFilterType, now = operationalNow()): boolean {
  if (filter === 'all') return true;
  const date = new Date(iso);

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
  
  const apply = useCallback(
    (payload: { logs: RawAuditLog[]; summary?: RawAuditSummary }) => {
      const mapped = mapAuditLogs(payload.logs ?? []);
      // Tabel riwayat wajib terbaru di atas; urutan ini dijaga di sini
      // sehingga filter dan pagination tetap mewarisi urutan yang sama.
      setLogs(newestFirst(mapped));
      setKpi(mapAuditKpi(payload.summary, mapped));
      setErrorMessage(null);
    },
    [],
  );

  const load = useCallback(
    () =>
      apiCached<{ logs: RawAuditLog[]; summary?: RawAuditSummary }>('/audit-logs', CACHE_TTL_MS, {
        staleMs: STALE_WHILE_REVALIDATE_MS,
        onRevalidated: apply,
      })
        .then(apply)
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat audit log.');
        })
        .finally(() => setIsLoading(false)),
    [apply],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const { filtered: filteredAll, categoryCounts } = useMemo<{
    filtered: AuditLogEntry[];
    categoryCounts: CategoryCount[];
  }>(() => {
    const q = filters.search.trim().toLowerCase();
    // Sekarang dihitung satu kali per pass; sebelumnya `operationalNow()`
    // dipanggil untuk tiap baris, dua kali lipat, lewat dua memo terpisah.
    const now = operationalNow();

    const filtered: AuditLogEntry[] = [];
    const counts: Record<string, number> = {};
    let base = 0;

    // Satu pass menghasilkan baris terfilter dan hitungan kategori sekaligus.
    // `logs` sudah terurut terbaru-di-atas sejak `load`, jadi urutannya
    // diwarisi apa adanya tanpa pengurutan ulang di setiap ketikan.
    for (const entry of logs) {
      if (
        q &&
        !entry.resi.toLowerCase().includes(q) &&
        !entry.fromCourier.toLowerCase().includes(q) &&
        !entry.toCourier.toLowerCase().includes(q)
      ) {
        continue;
      }
      if (!isWithinRange(entry.completedAt, filters.dateFilter, now)) continue;

      base++;
      counts[entry.incidentCategory] = (counts[entry.incidentCategory] ?? 0) + 1;

      if (filters.categoryFilter !== 'all' && entry.incidentCategory !== filters.categoryFilter) {
        continue;
      }
      filtered.push(entry);
    }

    return {
      filtered,
      categoryCounts: [
        { key: 'all',               label: `Semua (${base})`,                                      count: base },
        { key: 'Cuaca / Hujan',     label: `Cuaca / Hujan (${counts['Cuaca / Hujan'] ?? 0})`,       count: counts['Cuaca / Hujan'] ?? 0 },
        { key: 'Anomali Suhu',      label: `Anomali Suhu (${counts['Anomali Suhu'] ?? 0})`,         count: counts['Anomali Suhu'] ?? 0 },
        { key: 'Mogok Kendaraan',   label: `Mogok Kendaraan (${counts['Mogok Kendaraan'] ?? 0})`,   count: counts['Mogok Kendaraan'] ?? 0 },
        { key: 'Ban Bocor',         label: `Ban Bocor (${counts['Ban Bocor'] ?? 0})`,               count: counts['Ban Bocor'] ?? 0 },
        { key: 'Alamat tidak ditemukan', label: `Alamat tidak ditemukan (${counts['Alamat tidak ditemukan'] ?? 0})`, count: counts['Alamat tidak ditemukan'] ?? 0 },
        { key: 'Banjir',            label: `Banjir (${counts['Banjir'] ?? 0})`,                     count: counts['Banjir'] ?? 0 },
        { key: 'Macet Total',       label: `Macet Total (${counts['Macet Total'] ?? 0})`,           count: counts['Macet Total'] ?? 0 },
      ] as CategoryCount[],
    };
  }, [logs, filters]);

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
