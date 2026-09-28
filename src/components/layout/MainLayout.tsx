import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  onLogout: () => void;
}

export function MainLayout({ onLogout }: MainLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-[100svh] w-full overflow-hidden bg-[#F8FAFC]">
      <aside aria-label="Navigasi utama" className="hidden w-[220px] flex-shrink-0 lg:block">
        <Sidebar />
      </aside>
      {mobileNavOpen && <button type="button" aria-label="Tutup navigasi" className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
      <aside aria-label="Navigasi utama mobile" className={cn('fixed inset-y-0 left-0 z-50 w-[240px] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden', mobileNavOpen ? 'translate-x-0' : '-translate-x-full')}>
        <Sidebar onCloseMobile={() => setMobileNavOpen(false)} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onLogout={onLogout} onToggleMobileNav={() => setMobileNavOpen((open) => !open)} />
        <main id="main-content" tabIndex={-1} aria-label="Konten halaman" className="relative z-0 min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
