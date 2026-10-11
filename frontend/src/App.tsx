import { Suspense, lazy, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './features/auth/LoginPage';
import { FieldReportPage } from './features/field-report/FieldReportPage';
import { NotFoundPage } from './features/NotFoundPage';
import { apiVoid, invalidateApiCache, UNAUTHORIZED_EVENT } from './lib/api';
import { clearSession, hasSession } from './lib/session';
import { warmAppShell } from './lib/prefetch';
import { disconnectRealtime } from './lib/realtime';

const AuditLogsPage = lazy(() =>
  import('./features/audit-logs/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
);
const IncidentsPage = lazy(() =>
  import('./features/incidents/IncidentsPage').then((m) => ({ default: m.IncidentsPage })),
);
const MonitoringPage = lazy(() =>
  import('./features/monitoring/MonitoringPage').then((m) => ({ default: m.MonitoringPage })),
);
const SlaRiskPage = lazy(() =>
  import('./features/sla-risk/SlaRiskPage').then((m) => ({ default: m.SlaRiskPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#F9A8D4] border-t-[#C91076]"
          aria-hidden="true"
        />
        <p className="text-[13px] font-semibold text-[#64748B]">Memuat modul…</p>
      </div>
    </div>
  );
}

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(() => hasSession());

  useEffect(() => {
    if (isAuthenticated) warmAppShell();
  }, [isAuthenticated]);

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      disconnectRealtime();
      navigate('/login', { replace: true });
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate]);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    navigate('/monitoring', { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    void apiVoid('/auth/logout', { method: 'POST' }).catch(() => undefined);
    clearSession();
    invalidateApiCache();
    disconnectRealtime();
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const navigateToCourierMap = useCallback(
    (courierId: string) => navigate(`/monitoring?courier=${encodeURIComponent(courierId)}`),
    [navigate],
  );

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="/monitoring" element={<Navigate to="/login" replace />} />
        <Route path="/sla" element={<Navigate to="/login" replace />} />
        <Route path="/incidents" element={<Navigate to="/login" replace />} />
        <Route path="/audit" element={<Navigate to="/login" replace />} />
        <Route path="/lapor-insiden" element={<FieldReportPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/monitoring" replace />} />
      <Route element={<MainLayout onLogout={handleLogout} />}>
        <Route index element={<Navigate to="/monitoring" replace />} />
        <Route path="/monitoring" element={lazyRoute(<MonitoringPage />)} />
        <Route
          path="/sla"
          element={lazyRoute(<SlaRiskPage onNavigateToMap={navigateToCourierMap} />)}
        />
        <Route path="/incidents" element={lazyRoute(<IncidentsPage />)} />
        <Route path="/audit" element={lazyRoute(<AuditLogsPage />)} />
      </Route>
      <Route path="/lapor-insiden" element={<FieldReportPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
