import type { LatLng } from '../features/monitoring/types';

/**
 * Rute di peta tadinya digambar sebagai garis lurus (kurir -> drop), jadi
 * garisnya memotong blok permukiman. Di sini bentuknya diganti hasil
 * routing di atas jaringan jalan OpenStreetMap — sumber yang sama dengan tile
 * peta — lewat OSRM.
 *
 * Setiap kegagalan (offline, timeout, layanan sedang penuh) mengembalikan
 * `null` sehingga pemanggil jatuh ke garis lurus. Peta tidak pernah kosong
 * hanya karena layanan routing tidak terjangkau.
 */

const OSRM_BASE: string =
  import.meta.env.VITE_OSRM_URL ?? 'https://router.project-osrm.org/route/v1/driving';

/**
 * Kuantisasi kunci cache setara ±55 m. Kurir bergeser ±11 m tiap 2 detik, jadi
 * sel sebesar ini menahan permintaan ke OSRM pada kisaran tiap 10 detik,
 * bukan tiap siklus polling.
 */
const KEY_STEP_DEG = 0.0005;

/** Batas entri cache; lewat itu entri paling lama dibuang. */
const CACHE_LIMIT = 200;

const TIMEOUT_MS = 6_000;

interface OsrmResponse {
  code?: string;
  routes?: Array<{ geometry?: { coordinates?: number[][] } }>;
}

const geometryCache = new Map<string, LatLng[]>();
const inflight = new Map<string, Promise<LatLng[] | null>>();
const leafletCache = new WeakMap<LatLng[], [number, number][]>();

/** Kunci identitas sebuah rute setelah kuantisasi — dipakai cache dan dependensi efek. */
export function roadRouteKey(waypoints: LatLng[]): string {
  return waypoints.map((point) => `${quantise(point.lat)},${quantise(point.lng)}`).join(';');
}

/**
 * Ambil geometri jalan untuk sekumpulan waypoint, atau `null` bila gagal.
 * Panggilan dengan kunci sama berbagi satu request dan satu hasil cache.
 */
export async function fetchRoadRoute(waypoints: LatLng[]): Promise<LatLng[] | null> {
  if (waypoints.length < 2) return null;

  const key = roadRouteKey(waypoints);

  const cached = geometryCache.get(key);
  if (cached) {
    // Tarik ke akhir agar entri yang dipakai tidak terbuang lebih dulu.
    geometryCache.delete(key);
    geometryCache.set(key, cached);

    return cached;
  }

  const pending = inflight.get(key);
  if (pending) return pending;

  const request = requestRoadRoute(waypoints)
    .then((geometry) => {
      if (geometry) remember(key, geometry);

      return geometry;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);

  return request;
}

/** Ubah geometri jadi pasangan `[lat, lng]` Leaflet, disimpan per identitas daftar. */
export function toLeafletPositions(points: LatLng[]): [number, number][] {
  const cached = leafletCache.get(points);
  if (cached) return cached;

  const positions = points.map((point) => [point.lat, point.lng] as [number, number]);
  leafletCache.set(points, positions);

  return positions;
}

/** Hanya untuk pengujian: kosongkan cache geometri dan request yang sedang berjalan. */
export function resetRoadRouteCache(): void {
  geometryCache.clear();
  inflight.clear();
}

function quantise(value: number): number {
  return Math.round(value / KEY_STEP_DEG);
}

function remember(key: string, geometry: LatLng[]): void {
  geometryCache.delete(key);
  geometryCache.set(key, geometry);

  if (geometryCache.size > CACHE_LIMIT) {
    const oldest = geometryCache.keys().next().value;
    if (oldest !== undefined) geometryCache.delete(oldest);
  }
}

function osrmUrl(waypoints: LatLng[]): string {
  const path = waypoints.map((point) => `${point.lng},${point.lat}`).join(';');

  return `${OSRM_BASE}/${path}?alternatives=false&steps=false&overview=full&geometries=geojson`;
}

async function requestRoadRoute(waypoints: LatLng[]): Promise<LatLng[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(osrmUrl(waypoints), { signal: controller.signal });
    if (!response.ok) return null;

    const payload = (await response.json()) as OsrmResponse;
    const coordinates = payload.routes?.[0]?.geometry?.coordinates;
    if (payload.code !== 'Ok' || !coordinates || coordinates.length < 2) return null;

    return withExactEndpoints(
      waypoints,
      coordinates.map(([lng, lat]) => ({ lat, lng })),
    );
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * OSRM menyetel ujung rute ke titik jalan terdekat, sehingga garisnya bisa
 * putus beberapa meter dari penanda hub/tujuan. Titik awal dan akhir asli
 * dipasang kembali supaya garis selalu menyambung ke penandanya.
 */
function withExactEndpoints(waypoints: LatLng[], geometry: LatLng[]): LatLng[] {
  const points = [...geometry];
  const from = waypoints[0];
  const to = waypoints[waypoints.length - 1];

  if (!samePoint(points[0], from)) points.unshift(from);
  if (!samePoint(points[points.length - 1], to)) points.push(to);

  return points;
}

function samePoint(point: LatLng | undefined, reference: LatLng): boolean {
  return point !== undefined && point.lat === reference.lat && point.lng === reference.lng;
}
