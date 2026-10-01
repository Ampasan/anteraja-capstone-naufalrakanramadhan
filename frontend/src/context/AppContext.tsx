import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AppContext } from './AppContextStore';

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(null);
  const selectCourier = useCallback((courierId: string | null) => setSelectedCourierId(courierId), []);
  const value = useMemo(() => ({ selectedCourierId, selectCourier }), [selectedCourierId, selectCourier]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
