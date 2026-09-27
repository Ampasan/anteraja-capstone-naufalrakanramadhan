import { useState, useMemo } from 'react';
import { mockSlaOrders } from '../../../data/mockOrders';
import type { SlaOrder } from '../../../data/mockOrders';
import type {
  RiskFilter,
  ServiceFilter,
  SlaSummary,
  ServicePill,
  PaginationState,
} from '../types';

const PAGE_SIZE = 8;

const SERVICE_TOTALS: Record<ServiceFilter, number> = {
  Semua:       162,
  Regular:      38,
  'Same Day':   34,
  'Next Day':   42,
  Instant:      18,
  Dokumen:       8,
  Cargo:         7,
  'Mini Cargo':  5,
  PHARMA:        3,
  Frozen:        7,
};

export function useSlaRisk() {
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
  const [selectedOrder, setSelectedOrder] = useState<SlaOrder | null>(null);

  const summary: SlaSummary = useMemo(() => ({
    kritis:  mockSlaOrders.filter((o) => o.slaRisk === 'Kritis').length,
    waspada: mockSlaOrders.filter((o) => o.slaRisk === 'Waspada').length,
    aman:    mockSlaOrders.filter((o) => o.slaRisk === 'Aman').length,
    // Design spec: total is 162 (full dataset); our mock has 8 for page 1
    total: 162,
  }), []);

  const filteredOrders: SlaOrder[] = useMemo(() => {
    return mockSlaOrders.filter((order) => {
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
  }, [searchQuery, riskFilter, serviceFilter]);

  const paginatedOrders: SlaOrder[] = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize;
    return filteredOrders.slice(start, start + pagination.pageSize);
  }, [filteredOrders, pagination]);

  const isUnfiltered = !searchQuery && riskFilter === 'Semua' && serviceFilter === 'Semua';
  const displayTotal = isUnfiltered ? 162 : filteredOrders.length;
  const totalPages   = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));

  const servicePills: ServicePill[] = useMemo(() => {
    const keys: ServiceFilter[] = [
      'Semua', 'Instant', 'Same Day', 'Next Day', 'Regular',
      'Dokumen', 'Cargo', 'Mini Cargo', 'PHARMA',
    ];
    return keys.map((key) => ({
      key,
      label: key,
      count: SERVICE_TOTALS[key],
    }));
  }, []);

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

  const openDetail = (order: SlaOrder) => setSelectedOrder(order);
  const closeDetail = () => setSelectedOrder(null);

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
    handleSearch,
    handleRiskFilter,
    handleServiceFilter,
    resetFilters,
    goToPage,
    openDetail,
    closeDetail,
  };
}
