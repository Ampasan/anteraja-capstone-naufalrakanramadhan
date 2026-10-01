import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../lib/utils';
import type { StatusFilterTab, ServiceType } from '../types';

const SERVICE_TYPES: Array<ServiceType | 'Semua'> = [
  'Semua',
  'Instant',
  'Same Day',
  'Next Day',
  'Regular',
  'Dokumen',
  'Cargo',
  'Mini Cargo',
  'PHARMA',
  'Frozen',
];

const STATUS_TABS: StatusFilterTab[] = ['Semua', 'Kritis', 'Waspada', 'Aman'];

// Warna aktif per tab
const TAB_ACTIVE: Record<StatusFilterTab, string> = {
  Semua:   'bg-[#0F172A] text-white',
  Kritis:  'bg-red-500 text-white',
  Waspada: 'bg-amber-400 text-white',
  Aman:    'bg-emerald-500 text-white',
};

// Warna teks inaktif per tab
const TAB_INACTIVE_TEXT: Record<StatusFilterTab, string> = {
  Semua:   'text-[#475569]',
  Kritis:  'text-red-500',
  Waspada: 'text-amber-500',
  Aman:    'text-emerald-600',
};

interface IncidentFilterBarProps {
  search: string;
  statusTab: StatusFilterTab;
  serviceType: ServiceType | 'Semua';
  serviceTypeCounts: Record<string, number>;
  onSearchChange: (value: string) => void;
  onStatusTabChange: (tab: StatusFilterTab) => void;
  onServiceTypeChange: (service: ServiceType | 'Semua') => void;
  onReset: () => void;
}

export function IncidentFilterBar({
  search,
  statusTab,
  serviceType,
  serviceTypeCounts,
  onSearchChange,
  onStatusTabChange,
  onServiceTypeChange,
  onReset,
}: IncidentFilterBarProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] flex flex-col gap-3 sm:gap-4">

      {/* ── Baris 1: Search + Status Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        {/* Search */}
        <div className="flex-1 min-w-0">
          <Input
            leftIcon={<Search size={14} />}
            placeholder="Cari no. resi atau nama kurir..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 text-[13px]"
          />
        </div>

        {/* Status Tabs — pill style */}
        <div className="flex items-center gap-1 flex-shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-1 overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const isActive = statusTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onStatusTabChange(tab)}
                className={cn(
                  'px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-[12px] font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0',
                  isActive
                    ? TAB_ACTIVE[tab] + ' shadow-sm scale-105'
                    : TAB_INACTIVE_TEXT[tab] + ' hover:bg-white hover:shadow-sm',
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Baris label + Reset ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={12} className="text-[#94A3B8]" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#94A3B8]">
            Filter Jenis Layanan
          </span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-[12px] font-semibold text-[#C91076] hover:text-[#A00060] transition-colors hover:gap-1.5"
        >
          <RotateCcw size={11} />
          Reset Filter
        </button>
      </div>

      {/* ── Baris 2: Service Type Pills — 9 layanan selalu tampil ── */}
      <div className="flex items-center gap-1.5 flex-wrap -mt-1">
        {SERVICE_TYPES.map((svc) => {
          const count = svc === 'Semua'
            ? (serviceTypeCounts['Semua'] ?? 0)
            : (serviceTypeCounts[svc] ?? 0);
          const isActive = serviceType === svc;

          return (
            <button
              key={svc}
              onClick={() => onServiceTypeChange(svc as ServiceType | 'Semua')}
              className={cn(
                'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all duration-200 leading-none whitespace-nowrap',
                isActive
                  ? 'bg-[#C91076] text-white border-[#C91076] shadow-md scale-105'
                  : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#C91076] hover:text-[#C91076] hover:scale-105',
              )}
            >
              {svc}
              {count > 0 && (
                <span
                  className={cn(
                    'text-[10px] font-extrabold leading-none',
                    isActive ? 'text-pink-200' : 'text-[#94A3B8]',
                  )}
                >
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
