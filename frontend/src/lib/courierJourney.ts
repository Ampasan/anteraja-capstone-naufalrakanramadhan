import type { LatLng } from '../features/monitoring/types';
import { readStored, writeStored } from './storage';

/**
 * Perjalanan kurir dihitung di sisi klien. Titik awalnya direkam sekali per tab
 * saat halaman monitoring dibuka, lalu penanda merambat di atas geometri jalan
 * menuju titik drop. Karena titik awalnya bertahan di sessionStorage, refresh
 * atau pindah halaman selalu mengulang perjalanan dari titik yang sama.
 */

const ORIGIN_KEY = 'anteraja.monitoring.origins';
const EARTH_RADIUS_M = 6_371_000;

type OriginStore = Record<string, LatLng>;

let originCache: OriginStore | null = null;

function loadOrigins(): OriginStore {
  const stored = readStored<unknown>(ORIGIN_KEY);
  return stored && typeof stored === 'object' ? (stored as OriginStore) : {};
}

function isLatLng(value: unknown): value is LatLng {
  const point = value as LatLng | null;
  return !!point && Number.isFinite(point.lat) && Number.isFinite(point.lng);
}

/** Titik awal perjalanan kurir. `fallback` hanya dipakai saat belum ada catatan. */
export function journeyOrigin(courierId: string, fallback: LatLng): LatLng {
  if (!originCache) originCache = loadOrigins();

  const stored = originCache[courierId];
  if (isLatLng(stored)) return stored;

  originCache[courierId] = { lat: fallback.lat, lng: fallback.lng };
  writeStored(ORIGIN_KEY, originCache);
  return originCache[courierId];
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Jarak lingkaran besar dalam meter. Dipakai untuk sisa rute dan jarak ke hub. */
export function metresBetween(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface Journey {
  points: LatLng[];
  /** Jarak kumulatif dari titik awal ke tiap titik, dalam meter. */
  cumulative: number[];
  total: number;
}

/** Ubah daftar titik menjadi perjalanan yang bisa dirambat. butuh minimal 2 titik. */
export function measure(points: LatLng[]): Journey {
  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + metresBetween(points[i - 1], points[i]));
  }
  return { points, cumulative, total: cumulative[cumulative.length - 1] };
}

export interface PositionOnJourney {
  point: LatLng;
  /** Sisa garis dari `point` sampai titik drop. Titik pertamanya persis penanda. */
  remaining: LatLng[];
}

/** Ambil posisi pada jarak `distance` meter dari awal; lebih dari total berhenti di drop. */
export function travel(journey: Journey, distance: number): PositionOnJourney {
  const { points, cumulative, total } = journey;
  const lastSegment = points.length - 2;
  if (lastSegment < 0) return { point: points[0], remaining: points };

  const target = Math.min(Math.max(distance, 0), total);
  let index = lastSegment;
  for (let i = 0; i <= lastSegment; i++) {
    if (cumulative[i + 1] >= target) {
      index = i;
      break;
    }
  }

  const span = cumulative[index + 1] - cumulative[index];
  const ratio = span > 0 ? Math.min(1, (target - cumulative[index]) / span) : 0;
  const from = points[index];
  const to = points[index + 1];
  const point = {
    lat: from.lat + (to.lat - from.lat) * ratio,
    lng: from.lng + (to.lng - from.lng) * ratio,
  };

  // ratio 1 berarti penanda tepat di titik berikutnya; titik itu tidak boleh
  // muncul dua kali di ujung rute.
  const tail = ratio >= 1 ? points.slice(index + 2) : points.slice(index + 1);
  return { point, remaining: [point, ...tail] };
}
