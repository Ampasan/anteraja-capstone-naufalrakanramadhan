import { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, LogOut, Menu } from 'lucide-react';
import { useDashboardSummary } from '../../hooks/useDashboardSummary';
import { getUser, type SessionUser } from '../../lib/session';

/** Inisial dari nama pengguna, mis. "Siti Rahmawati" -> "SR". */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function displayRole(role?: string): string {
  if (!role) return 'Admin Hub';
  const normalized = role.toLowerCase();
  if (normalized === 'admin') return 'Admin Hub';
  if (normalized === 'supervisor') return 'Supervisor Hub';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

/**
 * Nama hub versi pendek untuk layar sempit.
 *
 * "Hub Halim - Jakarta Timur" -> "Hub Halim"
 * "ANTERAJA HUB HALIM"        -> "HUB HALIM"
 */
function shortHubName(name: string): string {
  const withoutBrand = name.replace(/^ANTERAJA\s+/i, '');
  return withoutBrand.split(' - ')[0].trim() || withoutBrand;
}

interface HeaderProps {
  onLogout?: () => void;
  onToggleMobileNav?: () => void;
}

export function Header({ onLogout, onToggleMobileNav }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { summary } = useDashboardSummary();
  // Profil berasal dari respons login
  const user = useMemo<SessionUser | null>(() => getUser(), []);

  const hubName = summary?.hub.name ?? user?.hub_name ?? 'Hub Halim - Jakarta Timur';
  const stats = summary?.couriers ?? { total: 0, online: 0, idle: 0 };
  const userName = user?.name ?? 'Pengguna';
  const userRole = displayRole(user?.role);
  const userInitials = initialsOf(userName);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  return (
    <header
      style={{ animation: 'headerSlideDown 0.3s ease both' }}
      className="relative z-20 flex-shrink-0 h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-3 sm:px-4 gap-2 sm:gap-3 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)]"
    >
      {/* ── Sisi Kiri: Menu Hamburger (Tablet/Mobile) + Hub Aktif ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Tombol Hamburger Drawer */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Buka navigasi menu"
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[#E2E8F0] text-[#475569] hover:bg-[#FFF0F6] hover:text-[#C91076] transition-colors flex-shrink-0 cursor-pointer"
        >
          <Menu size={18} />
        </button>

        {/* Hub aktif */}
        <p
          title="Hub operasional yang sedang aktif"
          className="flex items-center gap-2 bg-[#FFF0F6] border border-[#F9A8D4] rounded-xl px-2.5 sm:px-3.5 py-1.5 flex-shrink-0 cursor-default m-0"
        >
          <Building2 size={15} className="text-[#C91076] flex-shrink-0" aria-hidden="true" />
          <span className="flex flex-col leading-none">
            <span className="text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider text-[#C91076] mb-0.5">
              Active Hub
            </span>
            <span className="text-[12px] sm:text-[13.5px] font-extrabold text-[#111827] whitespace-nowrap">
              <span className="hidden sm:inline">{hubName}</span>
              <span className="sm:inline md:hidden">{shortHubName(hubName)}</span>
            </span>
          </span>
        </p>
      </div>

      {/* ── Statistik armada: Desktop & Tablet ── */}
      <section
        aria-label="Statistik armada kurir"
        className="hidden md:flex items-center justify-center flex-1 min-w-0 px-2"
      >
        <dl className="flex items-center gap-3 lg:gap-5 m-0 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-1.5 cursor-default">
            <dt
              title="Total armada kurir terdaftar di hub ini"
              className="text-[10.5px] lg:text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]"
            >
              <span className="hidden xl:inline">Total </span>Satria:
            </dt>
            <dd className="text-[14px] lg:text-[16px] font-extrabold text-[#111827] font-mono leading-none m-0">
              {stats.total}
            </dd>
          </div>

          <span aria-hidden="true" className="w-px h-4.5 bg-[#E2E8F0]" />

          <div
            title="Kurir sedang aktif bertugas di lapangan"
            className="flex items-center gap-1.5 cursor-default"
          >
            <span className="relative flex-shrink-0" aria-hidden="true">
              <span
                className="w-2 h-2 rounded-full bg-emerald-500 block"
                style={{ animation: 'onlinePulse 2s ease-out infinite' }}
              />
            </span>
            <dt className="text-[10.5px] lg:text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Online:
            </dt>
            <dd className="text-[14px] lg:text-[16px] font-extrabold text-emerald-600 font-mono leading-none m-0">
              {stats.online}
            </dd>
          </div>

          <span aria-hidden="true" className="w-px h-4.5 bg-[#E2E8F0]" />

          <div
            title="Kurir tidak bergerak lebih dari 5 menit — perlu perhatian"
            className="flex items-center gap-1.5 cursor-default"
          >
            <span
              className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"
              aria-hidden="true"
            />
            <dt className="text-[10.5px] lg:text-[11px] font-bold uppercase tracking-wider text-[#9CA3AF]">
              Idle:
            </dt>
            <dd className="text-[14px] lg:text-[16px] font-extrabold text-amber-500 font-mono leading-none m-0">
              {stats.idle}
            </dd>
          </div>
        </dl>
      </section>

      {/* Spacer di layar mobile */}
      <div className="md:hidden flex-1" />

      {/* ── Profil pengguna + dropdown logout ── */}
      <section
        aria-label="Profil pengguna"
        className="relative flex-shrink-0"
        ref={dropdownRef}
      >
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
          title={`Login sebagai: ${userName} — ${userRole}`}
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-2 sm:gap-3 rounded-xl p-1 sm:px-2 sm:py-1 hover:bg-[#FFF0F6] transition-colors duration-150 cursor-pointer"
        >
          <span className="hidden sm:flex flex-col items-end leading-none">
            <span className="text-[13px] sm:text-[13.5px] font-bold text-[#111827]">{userName}</span>
            <span className="text-[11px] sm:text-[11.5px] text-[#6B7280] mt-0.5 font-medium">{userRole}</span>
          </span>
          {/* Avatar */}
          <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#C91076] to-[#8B004F] flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-[#F9A8D4] ring-offset-1" aria-hidden="true">
            <span className="text-[11px] sm:text-[12px] font-extrabold text-white tracking-wide">{userInitials}</span>
          </span>
        </button>

        {/* Dropdown menu */}
        {dropdownOpen && (
          <menu
            role="menu"
            aria-label="Menu akun"
            className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-1.5 z-50 list-none m-0 p-0"
            style={{ animation: 'fadeInDown 0.15s ease both' }}
          >
            {/* Info user */}
            <li role="none" className="px-4 py-3 border-b border-[#F1F5F9]">
              <address className="flex items-center gap-3 not-italic">
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C91076] to-[#8B004F] flex items-center justify-center flex-shrink-0 shadow-sm"
                >
                  <span className="text-[12px] font-extrabold text-white tracking-wide">{userInitials}</span>
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[13px] font-bold text-[#111827]">{userName}</span>
                  <span className="text-[11px] text-[#6B7280] mt-0.5">{userRole}</span>
                </span>
              </address>
            </li>

            {/* Logout */}
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors duration-100 font-medium"
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout?.();
                }}
              >
                <LogOut size={15} className="text-[#DC2626]" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </li>
          </menu>
        )}
      </section>
    </header>
  );
}
