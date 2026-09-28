import { useState, type ReactNode } from 'react';
import { Sidebar, type PageId } from './Sidebar';
import { Header } from './Header';
import { cn } from '../../lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  hideSidebar?: boolean;
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onLogout?: () => void;
}

export function AppLayout({
  children,
  hideSidebar = false,
  activePage,
  onNavigate,
  onLogout,
}: AppLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Desktop Sidebar — collapsible on fullscreen */}
      <aside
        aria-label="Navigasi utama"
        className="hidden lg:block flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: hideSidebar ? 0 : 220 }}
      >
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
      </aside>

      {/* Mobile & Tablet Drawer Backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden animate-fade-in"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile & Tablet Drawer Sidebar */}
      <aside
        aria-label="Navigasi utama mobile"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[240px] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          mobileNavOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar
          activePage={activePage}
          onNavigate={(page) => {
            onNavigate(page);
            setMobileNavOpen(false);
          }}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      </aside>

      {/* Right column: top bar + page content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onLogout={onLogout}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
        />
        <main
          id="main-content"
          className="flex-1 min-h-0 relative z-0"
          tabIndex={-1}
          aria-label="Konten halaman"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
