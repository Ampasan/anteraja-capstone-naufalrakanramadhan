import { useState, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import type { PageId } from './components/layout/Sidebar';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { SlaRiskPage } from './features/sla-risk/SlaRiskPage';
import { IncidentsPage } from './features/incidents/IncidentsPage';
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage';
import { LoginPage } from './features/auth/LoginPage';

function App() {
  // ── Auth gate ──
  const [isAuthenticated, setIsAuthenticated] = useState(() =>
    sessionStorage.getItem('isAuthenticated') === 'true',
  );

  const handleLoginSuccess = useCallback(() => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('activePage');
    setIsAuthenticated(false);
  }, []);

  // ── Dashboard navigation ───
  const [activePage, setActivePage] = useState<PageId>(() => {
    const saved = sessionStorage.getItem('activePage') as PageId | null;
    const valid: PageId[] = ['monitoring', 'sla', 'incidents', 'audit'];
    return saved && valid.includes(saved) ? saved : 'monitoring';
  });

  const [hideSidebar, setHideSidebar] = useState(false);
  const [focusCourierId, setFocusCourierId] = useState<string | undefined>();

  const [animKey, setAnimKey] = useState(0);

  const handleNavigate = useCallback((page: PageId) => {
    setActivePage(page);
    setAnimKey((k) => k + 1);
    sessionStorage.setItem('activePage', page);
    if (page !== 'monitoring') setHideSidebar(false);
  }, []);

  const handleNavigateToMap = useCallback((courierId: string) => {
    setFocusCourierId(courierId);
    setActivePage('monitoring');
    setAnimKey((k) => k + 1);
    sessionStorage.setItem('activePage', 'monitoring');
    setHideSidebar(false);
  }, []);

  // ── Render: Login gate ──
  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // ── Render: Dasbor operasional ──
  return (
    <AppLayout
      hideSidebar={hideSidebar}
      activePage={activePage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {/* Wrapper animasi — key berubah setiap ganti halaman */}
      <div
        key={animKey}
        className="animate-page-switch h-full"
      >
        {activePage === 'monitoring' && (
          <MonitoringPage
            onFullscreenChange={setHideSidebar}
            focusCourierId={focusCourierId}
            onFocusHandled={() => setFocusCourierId(undefined)}
          />
        )}

        {activePage === 'sla' && (
          <SlaRiskPage onNavigateToMap={handleNavigateToMap} />
        )}

        {activePage === 'incidents' && (
          <IncidentsPage onNavigate={handleNavigate} />
        )}

        {activePage === 'audit' && (
          <AuditLogsPage />
        )}
      </div>
    </AppLayout>
  );
}

export default App;
