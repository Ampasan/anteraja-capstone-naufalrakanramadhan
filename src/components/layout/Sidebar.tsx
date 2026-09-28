import { AlertTriangle, ArrowLeftRight, ClipboardList, LayoutDashboard, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import anterajaLogo from '../../assets/anteraja_logo.png';

type NavItem = { to: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }>; description: string };

const NAV_ITEMS: NavItem[] = [
  { to: '/monitoring', label: 'Live Monitoring Map', icon: LayoutDashboard, description: 'Pantau posisi semua kurir secara real-time di peta' },
  { to: '/sla', label: 'SLA Risk Panel', icon: AlertTriangle, description: 'Lihat risiko keterlambatan & kurir yang perlu perhatian segera' },
  { to: '/incidents', label: 'Incident & Reassign', icon: ArrowLeftRight, description: 'Tangani insiden dan alihkan paket ke kurir pengganti' },
  { to: '/audit', label: 'Audit Log & Riwayat', icon: ClipboardList, description: 'Lihat riwayat lengkap pengalihan paket' },
];

const HUB_CAPACITY = { used: 2410, total: 2850, pct: 84 };

interface SidebarProps { onCloseMobile?: () => void; }

export function Sidebar({ onCloseMobile }: SidebarProps) {
  return (
    <nav aria-label="Navigasi modul dispatch" className="flex h-full w-full flex-col overflow-y-auto border-r border-[#E2E8F0] bg-white">
      <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-[#E2E8F0] px-4">
        <div className="flex min-w-0 items-center gap-3"><img src={anterajaLogo} alt="Logo Anteraja" className="h-8 w-auto flex-shrink-0 object-contain" /><span className="flex flex-col leading-none"><span className="text-[15px] font-extrabold leading-tight tracking-tight text-[#C91076]">Anteraja</span><span className="mt-0.5 text-[11px] font-semibold tracking-wide text-[#6B7280]">Dispatch</span></span></div>
        {onCloseMobile && <button type="button" onClick={onCloseMobile} className="min-h-11 min-w-11 rounded-lg text-[#475569] hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076] lg:hidden" aria-label="Tutup navigasi"><X size={18} className="mx-auto" /></button>}
      </header>
      <p className="m-0 px-4 pb-2 pt-4 text-[11px] font-bold uppercase tracking-widest text-[#6B7280]">Dispatch Modules</p>
      <ul className="m-0 flex flex-1 list-none flex-col gap-0.5 p-2" role="list">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return <li key={item.to}><NavLink to={item.to} title={item.description} onClick={onCloseMobile} className={({ isActive }) => cn('flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C91076] focus-visible:ring-offset-2', isActive ? 'bg-[#C91076] text-white shadow-sm' : 'text-[#374151] hover:bg-[#FFF0F6] hover:text-[#C91076]')}>
            {({ isActive }) => <><span aria-hidden="true" className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg', isActive ? 'bg-white/20' : 'bg-[#F3F4F6]')}><Icon size={16} className={isActive ? 'text-white' : 'text-[#6B7280]'} /></span><span className="text-[14px] font-semibold leading-tight">{item.label}</span>{isActive && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/80" />}</>}
          </NavLink></li>;
        })}
      </ul>
      <footer className="border-t border-[#E2E8F0] p-4"><div className="mb-2 flex items-center justify-between"><span className="text-[12px] font-bold uppercase tracking-wide text-[#374151]">Hub Capacity</span><span className="font-mono text-[13px] font-extrabold text-[#C91076]">{HUB_CAPACITY.pct}%</span></div><div role="progressbar" aria-valuenow={HUB_CAPACITY.pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Kapasitas hub ${HUB_CAPACITY.pct}%`} className="mb-2 h-2 overflow-hidden rounded-full bg-[#F3F4F6]"><span className="block h-full rounded-full bg-[#C91076]" style={{ width: `${HUB_CAPACITY.pct}%` }} /></div><p className="m-0 font-mono text-[12px] font-semibold text-[#4B5563]">{HUB_CAPACITY.used.toLocaleString('id-ID')} / {HUB_CAPACITY.total.toLocaleString('id-ID')} paket</p></footer>
    </nav>
  );
}
