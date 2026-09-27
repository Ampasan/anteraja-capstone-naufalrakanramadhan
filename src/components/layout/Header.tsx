import { useState, useRef, useEffect } from 'react';
import { Building2, LogOut } from 'lucide-react';

const HUB_NAME = 'Hub Tebet – Jakarta Selatan';
const STATS = { total: 38, online: 32, idle: 4 };
const USER = { name: 'Reza Bramantyo', role: 'Admin Hub', initials: 'RB' };

interface HeaderProps {
  onLogout?: () => void;
}

export function Header({ onLogout }: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      className="relative z-20 flex-shrink-0 h-14 bg-white border-b border-[#E2E8F0] flex items-center px-4 gap-3 shadow-[0_1px_3px_0_rgba(15,23,42,0.06)]"
    >
      {/* ── Hub aktif ── */}
      <p
        title="Hub operasional yang sedang aktif"
        className="flex items-center gap-2.5 bg-[#FFF0F6] border border-[#F9A8D4] rounded-xl px-3.5 py-1.5 flex-shrink-0 cursor-default m-0"
      >
        <Building2 size={15} className="text-[#C91076] flex-shrink-0" aria-hidden="true" />
        <span className="flex flex-col leading-none">
          <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#C91076] mb-0.5">
            Active Hub
          </span>
          <span className="text-[13.5px] font-extrabold text-[#111827] whitespace-nowrap">
            {HUB_NAME}
          </span>
        </span>
      </p>

      {/* ── Statistik armada ── */}
      <section
        aria-label="Statistik armada kurir"
        className="absolute left-1/2 -translate-x-1/2"
      >

        <dl className="flex items-center gap-5 m-0">

          <div className="flex flex-col items-center leading-none gap-1 cursor-default">
            <dt
              title="Total armada kurir terdaftar di hub ini"
              className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]"
            >
              Total Satria
            </dt>
            <dd className="text-[17px] font-extrabold text-[#111827] font-mono leading-none m-0">
              {STATS.total}
            </dd>
          </div>

          <span aria-hidden="true" className="w-px h-7 bg-[#E2E8F0]" />

          <div
            title="Kurir sedang aktif bertugas di lapangan"
            className="flex items-center gap-2 cursor-default"
          >
            {/* Dot pulse hijau — status live */}
            <span className="relative flex-shrink-0" aria-hidden="true">
              <span
                className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"
                style={{ animation: 'onlinePulse 2s ease-out infinite' }}
              />
              <span
                className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-400 opacity-0"
                style={{ animation: 'onlineRing 2s ease-out infinite' }}
              />
            </span>
            <div className="flex flex-col items-start leading-none gap-0.5">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Online
              </dt>
              <dd className="text-[17px] font-extrabold text-emerald-600 font-mono leading-none m-0">
                {STATS.online}
              </dd>
            </div>
          </div>

          <span aria-hidden="true" className="w-px h-7 bg-[#E2E8F0]" />

          <div
            title="Kurir tidak bergerak lebih dari 5 menit — perlu perhatian"
            className="flex items-center gap-2 cursor-default"
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"
              aria-hidden="true"
            />
            <div className="flex flex-col items-start leading-none gap-0.5">
              <dt className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                Idle
              </dt>
              <dd className="text-[17px] font-extrabold text-amber-500 font-mono leading-none m-0">
                {STATS.idle}
              </dd>
            </div>
          </div>

        </dl>
      </section>

      <span className="flex-1" aria-hidden="true" />

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
          title={`Login sebagai: ${USER.name} — ${USER.role}`}
          onClick={() => setDropdownOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-[#FFF0F6] transition-colors duration-150 cursor-pointer"
        >
          <span className="flex flex-col items-end leading-none md:flex">
            <span className="text-[13.5px] font-bold text-[#111827]">{USER.name}</span>
            <span className="text-[11.5px] text-[#6B7280] mt-0.5 font-medium">{USER.role}</span>
          </span>
          {/* Avatar */}
          <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C91076] to-[#8B004F] flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-[#F9A8D4] ring-offset-1" aria-hidden="true">
            <span className="text-[12px] font-extrabold text-white tracking-wide">{USER.initials}</span>
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
                  <span className="text-[12px] font-extrabold text-white tracking-wide">{USER.initials}</span>
                </span>
                <span className="flex flex-col leading-none">
                  <span className="text-[13px] font-bold text-[#111827]">{USER.name}</span>
                  <span className="text-[11px] text-[#6B7280] mt-0.5">{USER.role}</span>
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
