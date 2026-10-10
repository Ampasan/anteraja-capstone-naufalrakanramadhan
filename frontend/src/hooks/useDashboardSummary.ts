import { useCallback, useState } from 'react';
import { usePolling } from './usePolling';
import { apiCached, invalidateApiCache, STALE_WHILE_REVALIDATE_MS } from '../lib/api';

export interface DashboardSummary {
  hub: {
    id: string;
    name: string;
    city?: string;
    capacity_used: number;
    capacity_total: number;
  };
  couriers: { total: number; online: number; idle: number };
  orders: { active: number; critical: number };
  incidents: { open: number };
}

const TTL_MS = 30_000;
const POLL_MS = 30_000;

/**
 * Ringkasan dasbor (header + sidebar).
 */
export function useDashboardSummary(): {
  summary: DashboardSummary | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
} {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Terapkan payload — dipakai hasil langsung maupun hasil revalidasi latar. */
  const apply = useCallback((payload: DashboardSummary) => setSummary(payload), []);

  const load = useCallback(
    () =>
      apiCached<DashboardSummary>('/dashboard/summary', TTL_MS, {
        staleMs: STALE_WHILE_REVALIDATE_MS,
        onRevalidated: apply,
      })
        .then(apply)
        .catch(() => {
          // Biarkan nilai terakhir yang tampil; panel lain tetap bekerja.
        })
        .finally(() => setIsLoading(false)),
    [apply],
  );

  usePolling(load, POLL_MS);

  /** Paksa ambil terbaru — dipanggil setelah aksi mengubah data. */
  const refresh = useCallback(() => {
    invalidateApiCache('/dashboard/summary');
    return load();
  }, [load]);

  return { summary, isLoading, refresh };
}
