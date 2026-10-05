import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchRoadRoute } from '../../../lib/roadRoute';
import {
  journeyOrigin,
  measure,
  travel,
  type Journey,
} from '../../../lib/courierJourney';
import { nearestDropPoint } from '../../../lib/mappers';
import type { ActiveRoute, Courier, LatLng } from '../types';

/** Interval gambar ulang penanda; 5 Hz masih halus untuk 30-45 km/j. */
const TICK_MS = 200;
/** Kegagalan routing jalan diulang setelah jeda ini, bukan tiap siklus poll. */
const RETRY_MS = 60_000;
/** Kecepatan cadangan bila telemetri belum membawa nilai. */
const FALLBACK_SPEED_KMH = 35;

/** Perubahan yang diterapkan ke satu kurir: posisi penanda dan sisa rutenya. */
export interface MotionOverride {
  position: LatLng;
  route?: ActiveRoute;
}

interface JourneyTarget {
  key: string;
  courierId: string;
  origin: LatLng;
  drop: LatLng;
  /** Rute lurus origin -> drop; dipakai sementara geometri jalan belum siap. */
  straight: Journey;
  eta: string;
  speedKmh: number;
}

function targetKey(courierId: string, origin: LatLng, drop: LatLng): string {
  const cell = (point: LatLng) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
  return `${courierId}|${cell(origin)}|${cell(drop)}`;
}

/**
 * Perjalanan kurir di sisi klien. Penanda mulai dari titik awal yang direkam
 * saat halaman ini dibuka, merambat di atas geometri jalan ke titik drop, lalu
 * berhenti di sana; membuka ulang atau menyegarkan halaman mengulanginya dari
 * titik yang sama. Kurir tanpa rute tetap memakai posisi server.
 */
export function useCourierMotion(couriers: Courier[]): Map<string, MotionOverride> {
  const [journeys, setJourneys] = useState<ReadonlyMap<string, Journey>>(new Map());
  const [elapsedS, setElapsedS] = useState(0);
  const journeysRef = useRef<Map<string, Journey>>(new Map());
  const inFlight = useRef(new Set<string>());
  const failedAt = useRef(new Map<string, number>());
  const mounted = useRef(true);

  const targets = useMemo(() => {
    const list: JourneyTarget[] = [];

    for (const courier of couriers) {
      if (!courier.route) continue;
      const origin = journeyOrigin(courier.id, courier.position);
      const drop = nearestDropPoint(courier.activePackages, origin);
      if (!drop) continue;

      list.push({
        key: targetKey(courier.id, origin, drop),
        courierId: courier.id,
        origin,
        drop,
        straight: measure([origin, drop]),
        eta: courier.route.eta,
        speedKmh: courier.speedKmh ?? FALLBACK_SPEED_KMH,
      });
    }

    return list;
  }, [couriers]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    for (const target of targets) {
      const failedAtMs = failedAt.current.get(target.key);
      if (journeysRef.current.has(target.key)) continue;
      if (inFlight.current.has(target.key)) continue;
      if (failedAtMs !== undefined && Date.now() - failedAtMs < RETRY_MS) continue;

      inFlight.current.add(target.key);
      void fetchRoadRoute([target.origin, target.drop])
        .then((geometry) => {
          inFlight.current.delete(target.key);
          if (!mounted.current) return;
          if (!geometry || geometry.length < 2) {
            failedAt.current.set(target.key, Date.now());
            return;
          }
          const next = new Map(journeysRef.current);
          next.set(target.key, measure(geometry));
          journeysRef.current = next;
          setJourneys(next);
        })
        .catch(() => {
          inFlight.current.delete(target.key);
          if (mounted.current) failedAt.current.set(target.key, Date.now());
        });
    }
  }, [targets]);

  // Jeda saat tab disembunyikan: tidak ada yang melihat penanda. Waktunya
  // diakumulasi, bukan dibaca dari jam, supaya perjalanan berhenti di tempat
  // dan lanjut saat tab kembali, alih-alih melompat langsung ke titik drop.
  useEffect(() => {
    let timer = 0;
    let segmentStart = 0;
    let accumulatedS = 0;

    const advance = () => setElapsedS(accumulatedS + (Date.now() - segmentStart) / 1000);

    const start = () => {
      if (timer) return;
      segmentStart = Date.now();
      advance();
      timer = window.setInterval(advance, TICK_MS);
    };
    const stop = () => {
      if (!timer) return;
      accumulatedS += (Date.now() - segmentStart) / 1000;
      window.clearInterval(timer);
      timer = 0;
    };
    const handleVisibility = () => (document.hidden ? stop() : start());

    if (!document.hidden) start();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return useMemo(() => {
    const overrides = new Map<string, MotionOverride>();

    for (const target of targets) {
      const road = journeys.get(target.key);
      const journey = road ?? target.straight;
      const travelled = Math.min(elapsedS * (target.speedKmh / 3.6), journey.total);
      const { point, remaining } = travel(journey, travelled);

      overrides.set(target.courierId, {
        position: point,
        route: { polyline: remaining, eta: target.eta, snapped: road !== undefined },
      });
    }

    return overrides;
  }, [targets, journeys, elapsedS]);
}
