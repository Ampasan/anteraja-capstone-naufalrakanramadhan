import { type ReactNode } from 'react';
import { Sidebar, type PageId } from './Sidebar';
import { Header } from './Header';

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
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC]">
      {/* Sidebar — collapsible left navigation column */}
      <aside
        aria-label="Navigasi utama"
        className="flex-shrink-0 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ width: hideSidebar ? 0 : 220 }}
      >
        <Sidebar activePage={activePage} onNavigate={onNavigate} />
      </aside>

      {/* Right column: top bar + page content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onLogout={onLogout} />
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
