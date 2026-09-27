import { LayoutDashboard, AlertTriangle, ArrowLeftRight, ClipboardList } from 'lucide-react';
import { cn } from '../../lib/utils';
import anterajaLogo from '../../assets/anteraja_logo.png';

export type PageId = 'monitoring' | 'sla' | 'incidents' | 'audit';

type NavItem = {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    id: 'monitoring',
    label: 'Live Monitoring Map',
    icon: LayoutDashboard,
    description: 'Pantau posisi semua kurir secara real-time di peta',
  },
  {
    id: 'sla',
    label: 'SLA Risk Panel',
    icon: AlertTriangle,
    description: 'Lihat risiko keterlambatan & kurir yang perlu perhatian segera',
  },
  {
    id: 'incidents',
    label: 'Incident & Reassign',
    icon: ArrowLeftRight,
    description: 'Tangani insiden dan alihkan paket ke kurir pengganti',
  },
  {
    id: 'audit',
    label: 'Audit Log & Riwayat',
    icon: ClipboardList,
    description: 'Lihat riwayat lengkap semua pengalihan paket yang sudah diselesaikan',
  },
];

const HUB_CAPACITY = { used: 2410, total: 2850, pct: 84 };

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <nav
      aria-label="Navigasi modul dispatch"
      style={{ animation: 'sidebarSlideIn 0.32s cubic-bezier(0.22,0.61,0.36,1) both' }}
      className="flex flex-col h-full bg-white border-r border-[#E2E8F0] w-[220px] flex-shrink-0"
    >
      {/* ── Branding ── */}
      <header className="flex items-center gap-3 px-4 h-14 flex-shrink-0 border-b border-[#E2E8F0]">
        <img
          src={anterajaLogo}
          alt="Logo Anteraja"
          className="h-8 w-auto object-contain flex-shrink-0"
        />
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-extrabold text-[#C91076] tracking-tight leading-tight">
            Anteraja
          </span>
          <span className="text-[11px] font-semibold text-[#9CA3AF] tracking-wide mt-0.5">
            Dispatch
          </span>
        </span>
      </header>

      {/* ── Section label  ── */}
      <p
        role="presentation"
        aria-hidden="true"
        className="px-4 pt-4 pb-2 m-0 text-[11px] font-bold uppercase tracking-widest text-[#6B7280]"
      >
        Dispatch Modules
      </p>

      {/* ── Daftar navigasi ── */}
      <ul className="flex flex-col gap-0.5 px 2 flex-1 list-none m-0 p-0 px-2" role="list">
        {NAV_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                title={item.description}
                aria-current={isActive ? 'page' : undefined}
                style={{
                  animation: `navItemIn 0.28s ease ${80 + idx * 55}ms both`,
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left',
                  'transition-all duration-150',
                  isActive
                    ? 'bg-[#C91076] text-white shadow-sm'
                    : 'text-[#374151] hover:bg-[#FFF0F6] hover:text-[#C91076]',
                )}
              >
                {/* Icon container */}
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors duration-150',
                    isActive ? 'bg-white/20' : 'bg-[#F3F4F6]',
                  )}
                >
                  <Icon
                    size={16}
                    className={isActive ? 'text-white' : 'text-[#6B7280]'}
                  />
                </span>

                {/* Label */}
                <span
                  className={cn(
                    'leading-tight font-semibold text-[14px]',
                    isActive ? 'text-white' : 'text-[#374151]',
                  )}
                >
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="ml-auto flex-shrink-0 w-1.5 h-1.5 rounded-full bg-white opacity-80"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {/* ── Hub Capacity — metadata operasional ── */}
      <footer className="p-4 border-t border-[#E2E8F0]">
        <dl className="m-0">
          {/* Label + persentase */}
          <div className="flex items-center justify-between mb-2">
            <dt
              className="text-[12px] font-bold uppercase tracking-wide text-[#374151]"
              title="Kapasitas penampungan paket di Hub Tebet saat ini"
            >
              Hub Capacity
            </dt>
            <dd
              className={cn(
                'text-[13px] font-extrabold m-0',
                HUB_CAPACITY.pct >= 90 ? 'text-[#EF4444]' : 'text-[#C91076]',
              )}
            >
              {HUB_CAPACITY.pct}%
            </dd>
          </div>

          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={HUB_CAPACITY.pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Kapasitas hub ${HUB_CAPACITY.pct}%`}
            className="h-2 bg-[#F3F4F6] rounded-full overflow-hidden mb-2"
          >
            <span
              aria-hidden="true"
              className="block h-full rounded-full transition-all duration-500"
              style={{
                width: `${HUB_CAPACITY.pct}%`,
                background: 'linear-gradient(90deg, #C91076, #E51A8A)',
              }}
            />
          </div>

          {/* Angka paket + badge hub */}
          <div className="flex items-center justify-between">
            <dd
              className="text-[12px] font-semibold text-[#4B5563] font-mono m-0"
              title="Paket saat ini / Kapasitas maksimum"
            >
              {HUB_CAPACITY.used.toLocaleString('id-ID')} / {HUB_CAPACITY.total.toLocaleString('id-ID')} paket
            </dd>
            <span className="text-[11px] font-bold text-[#C91076] bg-[#FFF0F6] border border-[#F9A8D4] rounded-md px-2 py-0.5">
              Tebet
            </span>
          </div>
        </dl>
      </footer>
    </nav>
  );
}
