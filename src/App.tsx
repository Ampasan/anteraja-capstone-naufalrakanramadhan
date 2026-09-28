import { useCallback, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './features/auth/LoginPage';
import { AuditLogsPage } from './features/audit-logs/AuditLogsPage';
import { IncidentsPage } from './features/incidents/IncidentsPage';
import { MonitoringPage } from './features/monitoring/MonitoringPage';
import { NotFoundPage } from './features/NotFoundPage';
import { SlaRiskPage } from './features/sla-risk/SlaRiskPage';

function App() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('isAuthenticated') === 'true',
  );

  const handleLoginSuccess = useCallback(() => {
    sessionStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
    navigate('/monitoring', { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const navigateToCourierMap = useCallback(
    (courierId: string) => navigate(`/monitoring?courier=${encodeURIComponent(courierId)}`),
    [navigate],
  );

  if (!isAuthenticated) {
    return <Routes><Route path="/" element={<Navigate to="/login" replace />} /><Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} /><Route path="/monitoring" element={<Navigate to="/login" replace />} /><Route path="/sla" element={<Navigate to="/login" replace />} /><Route path="/incidents" element={<Navigate to="/login" replace />} /><Route path="/audit" element={<Navigate to="/login" replace />} /><Route path="*" element={<NotFoundPage />} /></Routes>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/monitoring" replace />} />
      <Route element={<MainLayout onLogout={handleLogout} />}>
        <Route index element={<Navigate to="/monitoring" replace />} />
        <Route path="/monitoring" element={<MonitoringPage />} />
        <Route path="/sla" element={<SlaRiskPage onNavigateToMap={navigateToCourierMap} />} />
        <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/audit" element={<AuditLogsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
