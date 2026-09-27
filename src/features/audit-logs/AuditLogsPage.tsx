import { ClipboardList } from 'lucide-react';
import { useState } from 'react';
import { useAuditLogs } from './hooks/useAuditLogs';
import { AuditSummaryCards } from './components/AuditSummaryCards';
import { AuditFilterBar } from './components/AuditFilterBar';
import { AuditTable } from './components/AuditTable';
import { ExportDropdown } from './components/ExportDropdown';

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div
      style={{
        animation: `auditFadeIn 0.38s cubic-bezier(0.22,0.61,0.36,1) ${delay}ms both`,
      }}
    >
      {children}
    </div>
  );
}

export function AuditLogsPage() {
  const {
    pagedData,
    filteredAll,
    kpi,
    filters,
    categoryCounts,
    setSearch,
    setDateFilter,
    setCategoryFilter,
    resetFilters,
    pagination,
    goToPage,
  } = useAuditLogs();

  const [exportOpen, setExportOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC]">
      <div className="flex flex-col gap-5 p-5">

        {/* ── 0. Header card ── */}
        <FadeUp delay={0}>
          <div className="bg-white border border-[#E5E7EB] rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
            {/* Kiri: icon box + judul + deskripsi */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center">
                <ClipboardList size={22} className="text-[#C91076]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[19px] font-extrabold text-[#111827] leading-tight tracking-tight">
                  Audit Log &amp; Riwayat Operasional
                </h1>
                <p className="text-[13px] text-[#4B5563] mt-0.5 leading-snug font-medium">
                  Rekapitulasi jejak digital pengalihan paket dan penanganan kendala{' '}
                  <span className="font-semibold text-[#C91076]">Hub Tebet</span>
                </p>
              </div>
            </div>
            {/* Kanan: hint + export */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-[11px] font-semibold text-[#9CA3AF] leading-none">Unduh laporan</p>
                <p className="text-[10px] text-[#9CA3AF] mt-0.5">Excel atau PDF</p>
              </div>
              <ExportDropdown
                entries={filteredAll}
                open={exportOpen}
                onToggle={() => setExportOpen((v) => !v)}
                onClose={() => setExportOpen(false)}
              />
            </div>
          </div>
        </FadeUp>

        {/* ── 1. Summary Cards ── */}
        <FadeUp delay={80}>
          <AuditSummaryCards kpi={kpi} />
        </FadeUp>

        {/* ── 2. Filter Bar ── */}
        <FadeUp delay={160}>
          <AuditFilterBar
            search={filters.search}
            dateFilter={filters.dateFilter}
            categoryFilter={filters.categoryFilter}
            categoryCounts={categoryCounts}
            onSearchChange={setSearch}
            onDateFilterChange={setDateFilter}
            onCategoryFilterChange={setCategoryFilter}
            onReset={resetFilters}
          />
        </FadeUp>

        {/* ── 3. Table ── */}
        <FadeUp delay={240}>
          <AuditTable
            data={pagedData}
            pagination={pagination}
            onPageChange={goToPage}
          />
        </FadeUp>

      </div>
    </div>
  );
}
