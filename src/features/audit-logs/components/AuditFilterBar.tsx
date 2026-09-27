import { Search, X, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { DateFilterType, CategoryFilterType, CategoryCount } from '../types';

interface AuditFilterBarProps {
  search: string;
  dateFilter: DateFilterType;
  categoryFilter: CategoryFilterType;
  categoryCounts: CategoryCount[];
  onSearchChange: (value: string) => void;
  onDateFilterChange: (value: DateFilterType) => void;
  onCategoryFilterChange: (value: CategoryFilterType) => void;
  onReset: () => void;
}

const DATE_TABS: { key: DateFilterType; label: string; hint: string }[] = [
  { key: 'all',   label: 'Semua',           hint: 'Tampilkan semua catatan' },
  { key: 'today', label: 'Hari Ini',        hint: 'Catatan hari ini saja'   },
  { key: '7days', label: '7 Hari Terakhir', hint: 'Catatan 7 hari ke belakang' },
  { key: 'month', label: 'Bulan Ini',       hint: 'Catatan bulan berjalan'  },
];

export function AuditFilterBar({
  search,
  dateFilter,
  categoryFilter,
  categoryCounts,
  onSearchChange,
  onDateFilterChange,
  onCategoryFilterChange,
  onReset,
}: AuditFilterBarProps) {
  const isFiltered = search.trim() !== '' || dateFilter !== 'all' || categoryFilter !== 'all';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm overflow-hidden">

      {/* ── Search + Date tabs ── */}
      <div className="flex items-center border-b border-[#F3F4F6]">

        {/* Search */}
        <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5">
          <Search size={17} className="text-[#9CA3AF] flex-shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nomor resi atau nama kurir..."
            className="flex-1 h-9 bg-transparent text-[14px] text-[#111827] placeholder-[#9CA3AF] outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              title="Hapus pencarian"
              className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center text-[#6B7280] transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Divider vertikal */}
        <div className="w-px h-10 bg-[#E5E7EB] flex-shrink-0" />

        {/* Date tabs */}
        <nav className="flex items-center px-2" aria-label="Filter rentang waktu">
          {DATE_TABS.map((tab) => {
            const isActive = dateFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onDateFilterChange(tab.key)}
                title={tab.hint}
                className={cn(
                  'relative px-4 py-3.5 text-[13.5px] font-semibold transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'text-[#C91076] font-bold'
                    : 'text-[#6B7280] hover:text-[#111827]',
                )}
              >
                {tab.label}
                {/* Garis bawah aktif — indikator*/}
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2.5px] bg-[#C91076] rounded-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Label + Category pills + Reset ── */}
      <div className="flex items-center gap-3 px-4 py-3 flex-wrap">

        {/* Label dengan icon */}
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          title="Saring catatan berdasarkan jenis masalah yang terjadi"
        >
          <SlidersHorizontal size={14} className="text-[#6B7280]" />
          <span className="text-[12px] font-bold uppercase tracking-wider text-[#374151] whitespace-nowrap">
            Kategori Kendala:
          </span>
        </div>

        {/* Pills */}
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {categoryCounts.map((cat) => {
            const isActive = categoryFilter === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => onCategoryFilterChange(cat.key)}
                title={`Tampilkan hanya: ${cat.label}`}
                className={cn(
                  'pill-hover-glow inline-flex items-center px-4 py-1.5 rounded-full text-[13px] font-semibold',
                  'border transition-all duration-150 whitespace-nowrap',
                  isActive
                    ? 'bg-[#C91076] text-white border-[#C91076] shadow-sm scale-[1.03]'
                    : 'bg-white text-[#4B5563] border-[#D1D5DB] hover:border-[#C91076] hover:text-[#C91076] hover:bg-[#FFF0F6]',
                )}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Reset Filter */}
        <button
          onClick={onReset}
          disabled={!isFiltered}
          title="Hapus semua filter aktif"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold',
            'border transition-all duration-150 whitespace-nowrap',
            isFiltered
              ? 'text-[#C91076] border-[#F9A8D4] bg-[#FFF0F6] hover:bg-[#FFE4F0]'
              : 'text-[#D1D5DB] border-[#E5E7EB] cursor-not-allowed bg-white',
          )}
        >
          <RotateCcw size={13} className={isFiltered ? 'text-[#C91076]' : 'text-[#D1D5DB]'} />
          Reset Filter
        </button>

      </div>
    </div>
  );
}
