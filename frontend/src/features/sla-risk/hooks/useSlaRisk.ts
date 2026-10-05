import { useState, useMemo, useCallback, useEffect } from 'react';
import { apiCached, STALE_WHILE_REVALIDATE_MS } from '../../../lib/api';
import { mapSlaOrders, type RawCourier, type RawOrder } from '../../../lib/mappers';
import type { SlaOrder } from '../types';
import type {
  RiskFilter,
  ServiceFilter,
  SlaSummary,
  ServicePill,
  PaginationState,
} from '../types';

const PAGE_SIZE = 8;
const POLL_MS = 10_000;
const CACHE_TTL_MS = 8_000;
const TABLE_TTL_MS = 4_000;
const COURIERS_TTL_MS = 60_000;
const SEARCH_DEBOUNCE_MS = 300;

/** Respons /api/tugas/tabel — server-side processing. */
interface TabelTugas {
  data: RawOrder[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

export function useSlaRisk() {
  // ── Tabel (server-side) ──
  const [rawOrders, setRawOrders] = useState<RawOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Ringkasan + pill (dari /orders/sla-risk, cache 10 dtk) ──
  const [summary, setSummary] = useState<SlaSummary>({ kritis: 0, waspada: 0, aman: 0, total: 0 });
  const [servicePills, setServicePills] = useState<ServicePill[]>([]);

  // ── Daftar kurir ──
  const [couriers, setCouriers] = useState<RawCourier[]>([]);

  // ── Filters ───
  const [searchQuery, setSearchQuery]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [riskFilter, setRiskFilter]         = useState<RiskFilter>('Semua');
  const [serviceFilter, setServiceFilter]   = useState<ServiceFilter>('Semua');

  // ── Pagination (server-side) ───
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // ── Modal ───
  const [selectedWaybill, setSelectedWaybill] = useState<string | null>(null);

  const orders = useMemo(() => mapSlaOrders(rawOrders, couriers), [rawOrders, couriers]);

  /** Terapkan ringkasan + pill — juga dipakai hasil revalidasi latar. */
  const loadSummary = useCallback(() => {
    const apply = (res: { orders: RawOrder[]; summary: SlaSummary }) => {
      // Filter risiko di frontend
      const filteredOrders = riskFilter === 'Semua'
        ? res.orders
        : res.orders.filter((order) => order.risk_level === riskFilter);

      setSummary({
        kritis: riskFilter === 'Semua' ? res.summary.kritis : (riskFilter === 'Kritis' ? filteredOrders.length : 0),
        waspada: riskFilter === 'Semua' ? res.summary.waspada : (riskFilter === 'Waspada' ? filteredOrders.length : 0),
        aman: riskFilter === 'Semua' ? res.summary.aman : (riskFilter === 'Aman' ? filteredOrders.length : 0),
        total: filteredOrders.length,
      });

      const keys: ServiceFilter[] = [
        'Semua', 'Instant', 'Same Day', 'Next Day', 'Regular',
        'Dokumen', 'Cargo', 'Mini Cargo', 'PHARMA', 'Frozen',
      ];

      // Satu pemetaan baris untuk semua pill dari data yang sudah difilter
      const byService = new Map<string, number>();
      for (const order of filteredOrders) {
        byService.set(order.service_type, (byService.get(order.service_type) ?? 0) + 1);
      }

      setServicePills(
        keys.map((key) => ({
          key,
          label: key,
          count: key === 'Semua' ? filteredOrders.length : (byService.get(key) ?? 0),
        })),
      );
    };

    apiCached<{ orders: RawOrder[]; summary: SlaSummary }>('/orders/sla-risk?scope=panel', CACHE_TTL_MS, {
      staleMs: STALE_WHILE_REVALIDATE_MS,
      onRevalidated: apply,
    })
      .then(apply)
      .catch(() => {
        // Ringkasan gagal — tabel tetap jalan dengan data kosong.
      });
  }, [riskFilter]);

  const loadPage = useCallback(
    (page: number, search: string, risk: RiskFilter, service: ServiceFilter) => {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(PAGE_SIZE),
      });
      if (search) params.set('search', search);
      if (risk !== 'Semua') params.set('risk', risk);
      if (service !== 'Semua') params.set('service', service);

      apiCached<TabelTugas>(`/tugas/tabel?${params.toString()}`, TABLE_TTL_MS)
        .then((res) => {
          setRawOrders(res.data);
          setTotal(res.total);
          setLastPage(res.last_page);
          setErrorMessage(null);
        })
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat data SLA.');
        })
        .finally(() => setIsLoading(false));
    },
    [],
  );

  // Kurir: dibutuhkan agar rincian kiriman menampilkan armada & muatan asli.
  const loadCouriers = useCallback(() => {
    const apply = (res: { couriers: RawCourier[] }) => setCouriers(res.couriers ?? []);

    apiCached<{ couriers: RawCourier[] }>('/couriers', COURIERS_TTL_MS, {
      staleMs: STALE_WHILE_REVALIDATE_MS,
      onRevalidated: apply,
    })
      .then(apply)
      .catch(() => {
        // Gagal memuat kurir — tabel tetap jalan, hanya detailnya yang polos.
      });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchQuery), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  // Summary harus ikut berubah saat riskFilter berubah
  useEffect(() => {
    loadCouriers();
    loadSummary();
  }, [loadCouriers, loadSummary]);

  // Polling tetap berjalan
  useEffect(() => {
    const timer = window.setInterval(() => {
      loadCouriers();
      loadSummary();
    }, POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadCouriers, loadSummary]);

  useEffect(() => {
    loadPage(pagination.page, debouncedSearch, riskFilter, serviceFilter);

    const timer = window.setInterval(() => {
      loadPage(pagination.page, debouncedSearch, riskFilter, serviceFilter);
    }, POLL_MS);

    return () => window.clearInterval(timer);
  }, [loadPage, pagination.page, debouncedSearch, riskFilter, serviceFilter]);

  const ordersByWaybill = useMemo(
    () => new Map(orders.map((order) => [order.waybillNumber, order])),
    [orders],
  );

  const selectedOrder = useMemo(
    () => (selectedWaybill ? (ordersByWaybill.get(selectedWaybill) ?? null) : null),
    [ordersByWaybill, selectedWaybill],
  );

  // ── Actions ───
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedSearch('');
    setRiskFilter('Semua');
    setServiceFilter('Semua');
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const goToPage = useCallback(
    (page: number) => {
      setPagination((prev) => ({ ...prev, page: Math.min(Math.max(1, page), lastPage) }));
    },
    [lastPage],
  );

  const openDetail = useCallback((order: SlaOrder) => setSelectedWaybill(order.waybillNumber), []);
  const closeDetail = useCallback(() => setSelectedWaybill(null), []);

  const handleRiskFilter = useCallback((filter: RiskFilter) => {
    setRiskFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleServiceFilter = useCallback((filter: ServiceFilter) => {
    setServiceFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  return {
    searchQuery,
    riskFilter,
    serviceFilter,
    pagination,
    total,
    lastPage,
    selectedOrder,
    summary,
    servicePills,
    orders,
    isLoading,
    errorMessage,
    handleSearch,
    handleRiskFilter,
    handleServiceFilter,
    resetFilters,
    goToPage,
    openDetail,
    closeDetail,
  };
}
