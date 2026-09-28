import { ArrowLeftRight, RefreshCw, Radio } from 'lucide-react';
import { useIncidents } from './hooks/useIncidents';
import { IncidentSummaryCards } from './components/IncidentSummaryCards';
import { IncidentFilterBar } from './components/IncidentFilterBar';
import { IncidentList } from './components/IncidentList';
import { ReassignPanel } from './components/ReassignPanel';
import { ReassignSuccessModal } from './components/ReassignSuccessModal';
import { Button } from '../../components/ui/Button';
import type { PageId } from '../../components/layout/Sidebar';

interface IncidentsPageProps {
  onNavigate?: (page: PageId) => void;
}

export function IncidentsPage({ onNavigate }: IncidentsPageProps) {
  const {
    filteredIncidents,
    incidents,
    kpi,
    selectedIncidentId,
    selectedIncident,
    selectedCandidateId,
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
  } = useIncidents();

  return (
    <div className="h-full overflow-y-auto bg-[#F8FAFC]">
      <div className="flex flex-col gap-4 sm:gap-5 p-3 sm:p-5 min-w-0">

        {/* ── 0. Header card ── */}
        <div className="animate-fade-up bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_8px_0_rgba(201,16,118,0.06)] px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          {/* Kiri: icon box + judul + deskripsi */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-xl bg-[#FFF0F6] border border-[#F9A8D4] flex items-center justify-center flex-shrink-0">
              <ArrowLeftRight size={18} className="text-[#C91076]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[14px] sm:text-[19px] font-extrabold text-[#0F172A] leading-tight tracking-tight">
                  Incident &amp; One-Click Task Reassignment
                </h1>
                {/* Live badge */}
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                  <Radio size={9} className="animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="hidden sm:block text-[13px] text-[#64748B] font-medium mt-0.5 leading-snug">
                Pantau &amp; alihkan tugas kurir bermasalah dalam kurang dari 30 detik
              </p>
            </div>
          </div>
          {/* Kanan: tombol refresh */}
          <Button
            variant="primary"
            size="sm"
            onClick={refreshData}
            className="flex-shrink-0 gap-1.5 rounded-full px-3 sm:px-4 hover:scale-105 active:scale-95 transition-transform duration-150"
          >
            <RefreshCw size={13} />
            <span className="hidden sm:inline">Segarkan Data</span>
          </Button>
        </div>

        {/* 1. KPI Summary Cards */}
        <div className="animate-fade-up stagger-1">
          <IncidentSummaryCards kpi={kpi} />
        </div>

        {/* 2. Filter Bar */}
        <div className="animate-fade-up stagger-2">
          <IncidentFilterBar
            search={filters.search}
            statusTab={filters.statusTab}
            serviceType={filters.serviceType}
            serviceTypeCounts={serviceTypeCounts}
            onSearchChange={setSearch}
            onStatusTabChange={setStatusTab}
            onServiceTypeChange={setServiceFilter}
            onReset={resetFilters}
          />
        </div>

        {/* 3. Main two-column card */}
        <div className="animate-fade-up stagger-3 bg-white border border-[#E2E8F0] rounded-2xl shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] flex flex-col lg:flex-row gap-0 overflow-hidden">

          {/* Left: Incident List */}
          <div className="flex-[11] min-w-0 p-4 sm:p-5">
            <IncidentList
              incidents={filteredIncidents}
              totalCount={incidents.length}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={selectIncident}
            />
          </div>

          {/* Divider */}
          <div className="h-px lg:h-auto lg:w-px bg-[#F1F5F9] flex-shrink-0" />

          {/* Right: Reassign Panel */}
          <div className="flex-[9] min-w-0 p-4 bg-[#FFF8FB]">
            <ReassignPanel
              incident={selectedIncident}
              selectedCandidateId={selectedCandidateId}
              onSelectCandidate={selectCandidate}
              onConfirm={confirmReassignment}
            />
          </div>

        </div>

      </div>

      {/* Success Modal */}
      <ReassignSuccessModal
        open={isSuccessModalOpen}
        payload={lastReassignment}
        serviceLabel={
          lastReassignment
            ? (incidents.find((i) => i.id === lastReassignment.incidentId)?.serviceLabel ?? 'Cargo')
            : undefined
        }
        onClose={closeSuccessModal}
        onGoToAuditLog={() => {
          closeSuccessModal();
          onNavigate?.('audit');
        }}
      />
    </div>
  );
}
