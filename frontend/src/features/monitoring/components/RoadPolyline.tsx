import { useEffect, useMemo, useState } from 'react';
import { Polyline } from 'react-leaflet';
import type { PathOptions } from 'leaflet';
import { fetchRoadRoute, roadRouteKey, toLeafletPositions } from '../../../lib/roadRoute';
import { metresBetween } from '../../../lib/courierJourney';
import type { LatLng } from '../types';

/**
 * Batas jarak titik awal geometri jalan terhadap posisi penanda. Kunci cache
 * OSRM dikuantisasi ±55 m, jadi geserannya wajar di bawah ini; lebih dari itu
 * berarti permintaan terakhir gagal dan garisnya sudah tertinggal jauh.
 */
const STALE_GEOMETRY_M = 150;

/**
 * Pengganti `<Polyline>` biasa: garisnya dibentuk ulang mengikuti jaringan
 * jalan, bukan garis lurus yang memotong blok.
 *
 * Bentuk jalan terakhir tetap dipakai selama permintaan berikutnya selesai,
 * jadi penanda yang bergerak tiap seperempat detik tidak pernah membuat garis
 * berkedip kembali ke garis lurus. Kalau layanan routing tidak terjangkau,
 * `polyline` asli yang dipakai sejak awal.
 */
interface RoadPolylineProps {
  /** Titik rute logis: kurir -> titik drop. Sekaligus cadangan garis lurus. */
  polyline: LatLng[];
  pathOptions: PathOptions;
  /**
   * `true` bila polyline sudah geometri hasil routing (sisa perjalanan kurir).
   * Gambar apa adanya agar OSRM tidak diminta menyusun ulang rute yang sama.
   */
  snapped?: boolean;
}

export function RoadPolyline({ polyline, pathOptions, snapped }: RoadPolylineProps) {
  const [roadGeometry, setRoadGeometry] = useState<LatLng[] | null>(null);

  /**
   * Kunci terkuantisasi (±55 m) dipakai sebagai dependensi efek. Larik
   * `polyline` dibuat baru tiap 200 ms oleh animasi penanda, padahal titiknya
   * sering tidak bergeser sama sekali; dengan kunci ini permintaan tidak
   * dijalankan ulang untuk rute yang sudah diminta sebelumnya.
   */
  const routeKey = useMemo(() => roadRouteKey(polyline), [polyline]);

  useEffect(() => {
    if (snapped) return;

    let alive = true;

    void fetchRoadRoute(polyline).then((geometry) => {
      if (!alive || !geometry) return;
      // Referensi sama berarti hasil cache tidak berubah — jangan re-render.
      setRoadGeometry((previous) => (previous === geometry ? previous : geometry));
    });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `polyline` sengaja digantikan `routeKey`: selama titik-titik tidak bergeser, isi lariknya identik.
  }, [routeKey, snapped]);

  // Geometri jalan diambil dari permintaan sebelumnya; kalau permintaan
  // pengbaruannya gagal, titik awalnya bisa tertinggal jauh dari penanda dan
  // rute tampak terputus dari kurir. Lewati geometri itu, pakai polyline hidup.
  const staleGeometry =
    !!roadGeometry?.length && metresBetween(roadGeometry[0], polyline[0]) > STALE_GEOMETRY_M;

  return (
    <Polyline
      positions={toLeafletPositions(
        snapped || staleGeometry ? polyline : (roadGeometry ?? polyline),
      )}
      pathOptions={pathOptions}
    />
  );
}
