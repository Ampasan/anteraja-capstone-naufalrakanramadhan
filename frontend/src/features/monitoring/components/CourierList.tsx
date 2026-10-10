import { useEffect, useRef } from 'react';
import { Search, ChevronsLeft } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { cn } from '../../../lib/utils';
import { CourierCard } from './CourierCard';
import type { Courier, CourierFilter } from '../types';

interface CourierListProps {
  couriers: Courier[];
  selectedCourier: Courier | null;
  activeFilter: CourierFilter;
  searchQuery: string;
  counts: { all: number; online: number; idle: number };
  onSelectCourier: (courier: Courier) => void;
  onFilterChange: (filter: CourierFilter) => void;
  onSearchChange: (q: string) => void;
  totalCount: number;
  isLoading?: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

type Tab = { id: CourierFilter; label: string; count: number };

export function CourierList({
  couriers,
  selectedCourier,
  activeFilter,
  searchQuery,
  counts,
  onSelectCourier,
  onFilterChange,
  onSearchChange,
  totalCount,
  isLoading = false,
  isOpen,
  onToggle,
}: CourierListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedId = selectedCourier?.id;

  /**
   * Aksi "Peta" di SLA Risk Panel membawa operator ke halaman ini dengan
   * kurirnya sudah terpilih, jadi daftar ikut menyorot kartu itu — bukan
   * hanya penanda di peta. `block: 'nearest'` dipakai supaya memilih kartu
   * yang sedang terlihat (klik daftar atau penanda) tidak ikut menggeser
   * daftar: elemen yang sudah kelihatan dianggap cukup.
   */
  useEffect(() => {
    if (!selectedId) return;
    scrollRef.current
      ?.querySelector(`[data-courier-card="${selectedId}"]`)
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const tabs: Tab[] = [
    { id: 'all',    label: `Semua (${counts.all})`,     count: counts.all    },
    { id: 'online', label: `Standby (${counts.online})`, count: counts.online },
    { id: 'idle',   label: `Mengantar (${counts.idle})`, count: counts.idle   },
  ];

  return (
    <div
      className={cn(
        'flex flex-col h-full bg-white border-r border-[#E2E8F0] flex-shrink-0 transition-all duration-300 overflow-hidden',
        'z-[420]',
        'max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:shadow-2xl',
        isOpen ? 'w-[290px] sm:w-[320px]' : 'w-0 border-r-0',
      )}
    >
      {/* Search bar + collapse button */}
      <div className="px-3 pt-3 pb-2.5 border-b border-[#E2E8F0] flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <Input
            leftIcon={<Search size={15} />}
            placeholder="Cari resi atau nama Satria..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="text-[13px] h-10"
          />
        </div>
        {/* Collapse button */}
        <button
          onClick={onToggle}
          title="Sembunyikan daftar kurir"
          className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-[#E2E8F0] text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#475569] transition-colors"
        >
          <ChevronsLeft size={17} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-3 py-2.5 border-b border-[#E2E8F0]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={cn(
              'flex-1 h-9 rounded-lg text-[13px] font-bold transition-colors px-1',
              activeFilter === tab.id
                ? 'bg-[#C91076] text-white'
                : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:bg-[#F1F5F9]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable card list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 no-scrollbar">
        {couriers.length === 0 && isLoading ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2.5 text-[#94A3B8]">
            <span
              className="h-6 w-6 animate-spin rounded-full border-[3px] border-[#F9A8D4] border-t-[#C91076]"
              aria-hidden="true"
            />
            <span className="text-[13px] font-medium">Memuat daftar kurir…</span>
          </div>
        ) : couriers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-[#94A3B8]">
            <Search size={24} className="mb-2 opacity-40" />
            <span className="text-[13px] font-medium">Kurir tidak ditemukan</span>
            <span className="text-[12px] mt-1">Coba kata kunci lain</span>
          </div>
        ) : (
          couriers.map((courier) => (
            <div key={courier.id} data-courier-card={courier.id}>
              <CourierCard
                courier={courier}
                isSelected={selectedCourier?.id === courier.id}
                onClick={onSelectCourier}
              />
            </div>
          ))
        )}
      </div>

      {/* Footer — hanya ringkasan jumlah; tombol "Lihat Semua" dihapus karena
          daftar ini sudah memuat seluruh kurir aktif hub (ONLINE + IDLE). */}
      <div className="px-3 py-2.5 border-t border-[#E2E8F0]">
        <span className="text-[12px] font-medium text-[#64748B]">
          Menampilkan {couriers.length} dari {totalCount} Satria
        </span>
      </div>
    </div>
  );
}
