import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { RiskFilter, ServiceFilter, ServicePill } from '../types';

interface SlaFilterBarProps {
  searchQuery: string;
  riskFilter: RiskFilter;
  serviceFilter: ServiceFilter;
  servicePills: ServicePill[];
  onSearch: (q: string) => void;
  onRiskFilter: (f: RiskFilter) => void;
  onServiceFilter: (f: ServiceFilter) => void;
  onReset: () => void;
}

const RISK_TABS: { key: RiskFilter; label: string; hint: string }[] = [
  { key: 'Semua',   label: 'Semua',   hint: 'Tampilkan semua paket'         },
  { key: 'Kritis',  label: '🔴 Kritis',  hint: 'Paket SLA < 15 menit'       },
  { key: 'Waspada', label: '🟡 Waspada', hint: 'Paket SLA 15–30 menit'      },
  { key: 'Aman',    label: '🟢 Aman',    hint: 'Paket SLA > 30 menit'       },
];

export function SlaFilterBar({
  searchQuery, riskFilter, serviceFilter, servicePills,
  onSearch, onRiskFilter, onServiceFilter, onReset,
}: SlaFilterBarProps) {
  const isFiltered = searchQuery !== '' || riskFilter !== 'Semua' || serviceFilter !== 'Semua';

  return (
    <div className="animate-fade-up stagger-4 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] overflow-hidden">

      {/* ── Section header ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <SlidersHorizontal size={13} className="text-[#C91076]" />
        <span className="text-xs font-bold text-[#475569]">Filter & Pencarian</span>
        {isFiltered && (
          <span className="ml-auto text-[10px] font-bold text-[#C91076] bg-[#FFF0F6] border border-[#F9A8D4] rounded-full px-2 py-0.5">
            Filter aktif
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-4">

        {/* ── Row 1: Search + Risk Tabs ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Ketik no. resi atau nama jalan tujuan..."
              title="Cari berdasarkan nomor resi (contoh: 100024000529) atau nama jalan tujuan"
              className="w-full pl-9 pr-3 h-10 text-sm rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] placeholder:text-[#B0BEC5] focus:outline-none focus:ring-2 focus:ring-[#C91076]/25 focus:border-[#C91076] transition-all duration-200"
            />
          </div>

          <div className="flex-1" />

          {/* Risk tabs */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8] px-1">Filter Status SLA</span>
            <div className="flex items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-0.5 gap-0.5">
              {RISK_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => onRiskFilter(tab.key)}
                  title={tab.hint}
                  className={cn(
                    'px-3.5 h-8 text-sm font-semibold rounded-md transition-all duration-150 whitespace-nowrap',
                    riskFilter === tab.key
                      ? 'bg-white text-[#0F172A] shadow-sm border border-[#E2E8F0] font-bold'
                      : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/70',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Row 2: Service pills ── */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748B]">
              Filter Jenis Layanan Anteraja
            </span>
            <span className="text-[10px] text-[#94A3B8]">— pilih satu untuk menyaring tabel</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {servicePills.map((pill) => {
              const isActive = serviceFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  onClick={() => onServiceFilter(pill.key)}
                  title={`Tampilkan paket layanan ${pill.label} saja`}
                  className={cn(
                    'inline-flex items-center h-8 px-3.5 rounded-full text-xs font-semibold border',
                    'transition-all duration-200 whitespace-nowrap',
                    'hover:scale-[1.03] active:scale-[0.97]',
                    isActive
                      ? 'bg-[#C91076] text-white border-[#C91076] shadow-md scale-[1.03]'
                      : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#C91076] hover:text-[#C91076]',
                  )}
                >
                  {pill.label}
                  <span className={cn(
                    'ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F1F5F9] text-[#64748B]',
                  )}>
                    {pill.count}
                  </span>
                </button>
              );
            })}

            {/* Reset */}
            <button
              onClick={onReset}
              title="Hapus semua filter yang aktif"
              className={cn(
                'inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-semibold',
                'border transition-all duration-200 whitespace-nowrap ml-auto',
                'hover:scale-[1.03] active:scale-[0.97]',
                isFiltered
                  ? 'text-[#C91076] border-[#F9A8D4] bg-[#FFF0F6] hover:bg-[#FFE0F0]'
                  : 'text-[#94A3B8] border-[#E2E8F0] bg-transparent hover:bg-[#F8FAFC] hover:text-[#64748B]',
              )}
            >
              <RotateCcw size={11} className={isFiltered ? 'text-[#C91076]' : 'text-[#94A3B8]'} />
              Reset Filter
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
