import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { AppContext } from './AppContextStore';
import { readStored, writeStored } from '../lib/storage';

/** Kurir terpilih bertahan selama tab terbuka, jadi panel detail tersambung lagi saat kembali. */
const SELECTED_COURIER_KEY = 'anteraja.monitoring.selectedCourier';

export function AppProvider({ children }: { children: ReactNode }) {
  const [selectedCourierId, setSelectedCourierId] = useState<string | null>(() => {
    const stored = readStored<unknown>(SELECTED_COURIER_KEY);
    return typeof stored === 'string' ? stored : null;
  });
  const selectCourier = useCallback((courierId: string | null) => {
    setSelectedCourierId(courierId);
    writeStored(SELECTED_COURIER_KEY, courierId);
  }, []);
  const value = useMemo(() => ({ selectedCourierId, selectCourier }), [selectedCourierId, selectCourier]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
