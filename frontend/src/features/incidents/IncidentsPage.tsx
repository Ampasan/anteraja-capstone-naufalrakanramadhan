import { useState, useCallback } from 'react';
import { ArrowLeftRight, RefreshCw, Radio, Download, AlertTriangle } from 'lucide-react';
import { useIncidents } from './hooks/useIncidents';
import { IncidentSummaryCards } from './components/IncidentSummaryCards';
import { IncidentFilterBar } from './components/IncidentFilterBar';
import { IncidentList } from './components/IncidentList';
import { ReassignPanel } from './components/ReassignPanel';
import { ReassignSuccessModal } from './components/ReassignSuccessModal';
import { Button } from '../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { downloadFile } from '../../lib/api';
import { EvidencePhotoModal, type EvidenceModalData } from '../../components/evidence/EvidencePhotoModal';
import type { IncidentReport } from './types';

export function IncidentsPage() {
  const navigate = useNavigate();
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceModalData | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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
    isSubmitting,
    errorMessage,
    selectIncident,
    selectCandidate,
    setSearch,
    setStatusTab,
    setServiceFilter,
    resetFilters,
    clearError,
    confirmReassignment,
    closeSuccessModal,
    refreshData,
  } = useIncidents();

  /** Unduh laporan harian insiden (CSV) langsung dari endpoint backend. */
  const handleExportDailyReport = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await downloadFile('/incidents/export', `laporan-insiden-${today}.csv`);
    } catch (error) {
      window.alert(
        error instanceof Error ? error.message : 'Gagal mengunduh laporan insiden.',
      );
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const handleViewEvidence = useCallback((inc: IncidentReport) => {
    if (!inc.evidenceImageUrl) return;
    setSelectedEvidence({
      resi: inc.waybillNumber,
      serviceType: inc.serviceLabel,
      category: inc.kendala,
      detail: inc.kendalaDetail ?? inc.kendala,
      caption: inc.evidenceCaption,
      imageUrl: inc.evidenceImageUrl,
      publicId: inc.evidencePublicId,
      timestamp: inc.reportedAt ? new Date(inc.reportedAt).toLocaleString('id-ID') : undefined,
      fromCourier: inc.courier.name,
      fromCourierCode: `${inc.courier.vehicleType} · ${inc.courier.vehiclePlate}`,
      location: inc.stoppedLocation,
    });
  }, []);

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
          {/* Kanan: tombol laporan & refresh */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline-magenta"
              size="sm"
              onClick={handleExportDailyReport}
              loading={isExporting}
              disabled={isExporting}
              className="gap-1.5 rounded-full px-3 sm:px-4 hover:scale-105 active:scale-95 transition-transform duration-150"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Laporan Harian</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={refreshData}
              className="gap-1.5 rounded-full px-3 sm:px-4 hover:scale-105 active:scale-95 transition-transform duration-150"
            >
              <RefreshCw size={13} />
              <span className="hidden sm:inline">Segarkan Data</span>
            </Button>
          </div>
        </div>

        {/* Galat API (409 konflik, 422 muatan berlebih, dsb) */}
        {errorMessage && (
          <div
            role="alert"
            className="animate-fade-up flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700"
          >
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
            <span className="flex-1">{errorMessage}</span>
            <button
              type="button"
              onClick={clearError}
              className="font-bold underline underline-offset-2 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

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
              onViewEvidence={handleViewEvidence}
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
              onViewEvidence={handleViewEvidence}
              isSubmitting={isSubmitting}
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
          navigate('/audit');
        }}
      />

      {/* Pop-up Modal Foto Bukti */}
      <EvidencePhotoModal
        open={!!selectedEvidence}
        data={selectedEvidence}
        onClose={() => setSelectedEvidence(null)}
      />
    </div>
  );
}
