import { useState, useMemo, useCallback, useEffect } from 'react';
import { apiCached } from '../../../lib/api';
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
/** Panel SLA ikut memutakhirkan tiap 10 detik (FRD-02). */
const POLL_MS = 10_000;
const CACHE_TTL_MS = 8_000;

export function useSlaRisk() {
  const [orders, setOrders] = useState<SlaOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── Filters ───
  const [searchQuery, setSearchQuery]       = useState('');
  const [riskFilter, setRiskFilter]         = useState<RiskFilter>('Semua');
  const [serviceFilter, setServiceFilter]   = useState<ServiceFilter>('Semua');

  // ── Pagination ───
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: PAGE_SIZE,
  });

  // ── Modal ───
  // Disimpan berdasarkan waybill supaya selalu menunjuk versi data terbaru
  // tanpa effect yang menulis state.
  const [selectedWaybill, setSelectedWaybill] = useState<string | null>(null);

  // Rantai .then agar setState hanya berjalan di dalam callback.
  const load = useCallback(
    () =>
      Promise.all([
        apiCached<{ orders: RawOrder[] }>('/orders/sla-risk', CACHE_TTL_MS),
        apiCached<{ couriers: RawCourier[] }>('/couriers', CACHE_TTL_MS),
      ])
        .then(([slaRes, couriersRes]) => {
          setOrders(mapSlaOrders(slaRes.orders ?? [], couriersRes.couriers ?? []));
          setErrorMessage(null);
        })
        .catch((error: unknown) => {
          setErrorMessage(error instanceof Error ? error.message : 'Gagal memuat data SLA.');
        })
        .finally(() => setIsLoading(false)),
    [],
  );

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  const selectedOrder = useMemo(
    () =>
      selectedWaybill ? orders.find((o) => o.waybillNumber === selectedWaybill) ?? null : null,
    [orders, selectedWaybill],
  );

  const summary: SlaSummary = useMemo(() => ({
    kritis: orders.filter((o) => o.slaRisk === 'Kritis').length,
    waspada: orders.filter((o) => o.slaRisk === 'Waspada').length,
    aman: orders.filter((o) => o.slaRisk === 'Aman').length,
    total: orders.length,
  }), [orders]);

  const filteredOrders: SlaOrder[] = useMemo(() => {
    return orders.filter((order) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        order.waybillNumber.toLowerCase().includes(q) ||
        order.destinationName.toLowerCase().includes(q) ||
        order.destinationArea.toLowerCase().includes(q);

      const matchesRisk =
        riskFilter === 'Semua' || order.slaRisk === riskFilter;

      const matchesService =
        serviceFilter === 'Semua' || order.serviceType === serviceFilter;

      return matchesSearch && matchesRisk && matchesService;
    });
  }, [orders, searchQuery, riskFilter, serviceFilter]);

  const paginatedOrders: SlaOrder[] = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return filteredOrders.slice(start, start + pagination.pageSize);
  }, [filteredOrders, pagination]);

  const isUnfiltered = !searchQuery && riskFilter === 'Semua' && serviceFilter === 'Semua';
  const displayTotal = isUnfiltered ? orders.length : filteredOrders.length;
  const totalPages   = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));

  const servicePills: ServicePill[] = useMemo(() => {
    const keys: ServiceFilter[] = [
      'Semua', 'Instant', 'Same Day', 'Next Day', 'Regular',
      'Dokumen', 'Cargo', 'Mini Cargo', 'PHARMA', 'Frozen',
    ];
    return keys.map((key) => ({
      key,
      label: key,
      count: key === 'Semua' ? orders.length : orders.filter((order) => order.serviceType === key).length,
    }));
  }, [orders]);

  // ── Actions ───
  const resetFilters = () => {
    setSearchQuery('');
    setRiskFilter('Semua');
    setServiceFilter('Semua');
    setPagination({ page: 1, pageSize: PAGE_SIZE });
  };

  const goToPage = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const openDetail = (order: SlaOrder) => setSelectedWaybill(order.waybillNumber);
  const closeDetail = () => setSelectedWaybill(null);

  const handleRiskFilter = (filter: RiskFilter) => {
    setRiskFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleServiceFilter = (filter: ServiceFilter) => {
    setServiceFilter(filter);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return {
    searchQuery,
    riskFilter,
    serviceFilter,
    pagination,
    selectedOrder,
    summary,
    filteredOrders,
    paginatedOrders,
    servicePills,
    totalPages,
    displayTotal,
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
