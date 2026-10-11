import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  fetchRoadRoute,
  resetRoadRouteCache,
  roadRouteKey,
  toLeafletPositions,
} from '../roadRoute';
import type { LatLng } from '../../features/monitoring/types';

const fetchMock = vi.fn();

const HUB: LatLng = { lat: -6.23, lng: 106.87 };
const COURIER: LatLng = { lat: -6.203, lng: 106.845 };
const DROP: LatLng = { lat: -6.213, lng: 106.855 };

const ROUTE = [HUB, COURIER, DROP];

function osrmBody(coordinates: number[][]): Response {
  const body = { code: 'Ok', routes: [{ geometry: { coordinates } }] };
  return new Response(JSON.stringify(body), { status: 200 });
}

function requestedUrl(): string {
  return fetchMock.mock.calls[0][0] as string;
}

describe('roadRoute', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    resetRoadRouteCache();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mengirim waypoint sebagai lintang-bujur dan memetakan geometri kembali', async () => {
    fetchMock.mockResolvedValue(
      osrmBody([
        [106.869, -6.229],
        [106.85, -6.21],
      ]),
    );

    const geometry = await fetchRoadRoute(ROUTE);

    expect(requestedUrl()).toContain('driving/106.87,-6.23;106.845,-6.203;106.855,-6.213');
    expect(requestedUrl()).toContain('overview=full&geometries=geojson');
    // Ujung asli dipasang kembali agar garis menyambung ke penanda.
    expect(geometry).toEqual([
      HUB,
      { lat: -6.229, lng: 106.869 },
      { lat: -6.21, lng: 106.85 },
      DROP,
    ]);
  });

  it('memakai ulang cache untuk rute yang sama', async () => {
    fetchMock.mockResolvedValue(osrmBody([[106.869, -6.229], [106.85, -6.21]]));

    const first = await fetchRoadRoute(ROUTE);
    const second = await fetchRoadRoute(ROUTE);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('berbagi cache untuk posisi kurir yang berbeda di dalam sel yang sama', async () => {
    fetchMock.mockResolvedValue(osrmBody([[106.869, -6.229], [106.85, -6.21]]));

    await fetchRoadRoute(ROUTE);
    await fetchRoadRoute([HUB, { ...COURIER, lat: COURIER.lat + 0.0002 }, DROP]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('menghasilkan kunci berbeda untuk sel yang berbeda', () => {
    const nearby = [HUB, { ...COURIER, lat: COURIER.lat + 0.001 }, DROP];

    expect(roadRouteKey(nearby)).not.toBe(roadRouteKey(ROUTE));
  });

  it('jatuh ke null saat layanan routing tidak terjangkau', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));

    await expect(fetchRoadRoute(ROUTE)).resolves.toBeNull();
  });

  it('jatuh ke null saat respons gagal atau tidak berisi rute', async () => {
    fetchMock.mockResolvedValueOnce(new Response('pesanan terlalu banyak', { status: 429 }));
    await expect(fetchRoadRoute(ROUTE)).resolves.toBeNull();

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'NoRoute', routes: [] }), { status: 200 }),
    );
    await expect(fetchRoadRoute([HUB, DROP])).resolves.toBeNull();
  });

  it('tidak memanggil layanan routing untuk rute yang terlalu pendek', async () => {
    await expect(fetchRoadRoute([HUB])).resolves.toBeNull();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('menghitung posisi Leaflet sekali per identitas daftar', () => {
    const points = [HUB, DROP];

    expect(toLeafletPositions(points)).toBe(toLeafletPositions(points));
    expect(toLeafletPositions(points)).toEqual([
      [-6.23, 106.87],
      [-6.213, 106.855],
    ]);
  });
});
