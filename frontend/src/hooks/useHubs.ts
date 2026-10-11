import { useEffect, useMemo, useState } from 'react';
import { apiCached, STALE_WHILE_REVALIDATE_MS } from '../lib/api';
import { mapHub, type RawHub } from '../lib/mappers';
import { getUser } from '../lib/session';
import type { Hub } from '../features/monitoring/types';

const HUBS_TTL_MS = 60_000;

function envNumber(name: string, fallback: number): number {
  const value = Number((import.meta.env as Record<string, unknown>)[name]);
  return Number.isFinite(value) ? value : fallback;
}

function envString(name: string, fallback: string): string {
  const value = (import.meta.env as Record<string, unknown>)[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/** Cadangan bila endpoint /hubs tidak terjangkau — tetap menjaga peta tetap fokus. */
const FALLBACK_HUB: Hub = {
  id: '',
  name: envString('VITE_ACTIVE_HUB_NAME', 'Hub Halim - Jakarta Timur'),
  shortName: envString('VITE_ACTIVE_HUB_CODE', 'HUB HALIM'),
  position: {
    lat: envNumber('VITE_ACTIVE_HUB_LAT', -6.2651893),
    lng: envNumber('VITE_ACTIVE_HUB_LNG', 106.8767953),
  },
  radiusKm: 5,
  capacityUsed: 0,
  capacityTotal: 0,
};

/**
 * Hub awal yang langsung tersedia pada render pertama.
 */
function seedHub(): Hub {
  const user = getUser();
  return {
    ...FALLBACK_HUB,
    id: user?.hub_id ?? '',
    name: user?.hub_name ?? FALLBACK_HUB.name,
  };
}

/**
 * Daftar semua hub + hub milik user yang sedang login.
 */
export function useHubs(): {
  hubs: Hub[];
  activeHub: Hub | null;
  loading: boolean;
} {
  const [hubs, setHubs] = useState<Hub[]>(() => [seedHub()]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Berlaku untuk hasil langsung maupun hasil revalidasi latar belakang:
    // tanpa onRevalidated, cadangan tahan-simpan yang tampil pertama tidak
    // pernah diganti sampai komponen dipasang ulang.
    const apply = (payload: { hubs: RawHub[] }) => {
      if (cancelled) return;
      const mapped = (payload.hubs ?? []).map(mapHub);
      setHubs(mapped.length > 0 ? mapped : [FALLBACK_HUB]);
    };

    const fail = () => {
      if (!cancelled) setHubs([FALLBACK_HUB]);
    };

    apiCached<{ hubs: RawHub[] }>('/hubs', HUBS_TTL_MS, {
      staleMs: STALE_WHILE_REVALIDATE_MS,
      onRevalidated: apply,
    })
      .then(apply)
      .catch(fail)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const activeHub = useMemo(() => {
    if (hubs.length === 0) return null;
    const hubId = getUser()?.hub_id;
    return hubs.find((hub) => hub.id === hubId) ?? hubs[0];
  }, [hubs]);

  return { hubs, activeHub, loading };
}
