import { AlertTriangle } from 'lucide-react';
import { useSlaRisk } from './hooks/useSlaRisk';
import { SlaSummaryCards } from './components/SlaSummaryCards';
import { SlaFilterBar } from './components/SlaFilterBar';
import { SlaTable } from './components/SlaTable';
import { SlaDetailModal } from './components/SlaDetailModal';
import type { SlaOrder } from './types';

interface SlaRiskPageProps {
  onNavigateToMap?: (courierId: string) => void;
}

export function SlaRiskPage({ onNavigateToMap }: SlaRiskPageProps) {
  const {
    searchQuery, riskFilter, serviceFilter,
    pagination, selectedOrder, summary,
    paginatedOrders, servicePills, totalPages, displayTotal,
    handleSearch, handleRiskFilter, handleServiceFilter,
    resetFilters, goToPage, openDetail, closeDetail,
  } = useSlaRisk();

  const handleOpenMap = (order: SlaOrder) => onNavigateToMap?.(order.courierId);

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC]">
      <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5">

        {/* ── 0. Header card ── */}
          <div className="animate-fade-up bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] px-4 sm:px-5 py-3 sm:py-4 flex items-center gap-3">
          {/* Icon box */}
          <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={18} className="text-[#C91076]" />
          </div>
          {/* Judul + deskripsi */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-[19px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
                SLA Risk Indicator Panel
              </h1>
              {/* Live badge */}
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-[12px] sm:text-[13px] text-[#64748B] font-medium mt-0.5 leading-snug">
              Pantau risiko keterlambatan semua pengiriman aktif secara real-time.{' '}
              <span className="hidden sm:inline text-[#94A3B8]">Klik <strong className="text-[#0F172A]">Detail</strong> atau <strong className="text-[#0F172A]">Peta</strong> untuk tindak lanjut.</span>
            </p>
          </div>
        </div>

        {/* ── 1. KPI Cards ── */}
        <div className="animate-fade-up stagger-1">
          <SlaSummaryCards summary={summary} />
        </div>

        {/* ── 2. Filter ── */}
        <SlaFilterBar
          searchQuery={searchQuery}
          riskFilter={riskFilter}
          serviceFilter={serviceFilter}
          servicePills={servicePills}
          onSearch={handleSearch}
          onRiskFilter={handleRiskFilter}
          onServiceFilter={handleServiceFilter}
          onReset={resetFilters}
        />

        {/* ── 3. Table ── */}
        <SlaTable
          orders={paginatedOrders}
          displayTotal={displayTotal}
          currentPage={pagination.page}
          totalPages={totalPages}
          onPageChange={goToPage}
          onOpenDetail={openDetail}
          onOpenMap={handleOpenMap}
        />

      </div>

      <SlaDetailModal
        order={selectedOrder}
        onClose={closeDetail}
        onOpenMap={handleOpenMap}
      />
    </div>
  );
}
