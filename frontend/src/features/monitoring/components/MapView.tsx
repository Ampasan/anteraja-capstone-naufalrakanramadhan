import { memo, useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import type { LeafletEventHandlerFnMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Courier, Hub } from '../types';
import { RoadPolyline } from './RoadPolyline';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const iconCache = new Map<string, L.DivIcon>();

/**
 * Pasangan `[lat, lng]` dikunci per nilai. react-leaflet membandingkan properti
 * Leaflet dengan identitas, jadi larik baru tiap render akan memaksa
 * `marker.setLatLng()` / `polyline.setLatLngs()` walau angkanya sama persis —
 * pekerjaan DOM/SVG yang terbuang percuma 5 kali per detik.
 */
const positionCache = new Map<string, [number, number]>();

function cachedPosition(lat: number, lng: number): [number, number] {
  const key = `${lat},${lng}`;
  const hit = positionCache.get(key);
  if (hit) {
    // Tarik ke akhir agar tidak terbuang lebih dulu oleh LRU di bawah.
    positionCache.delete(key);
    positionCache.set(key, hit);
    return hit;
  }

  const position: [number, number] = [lat, lng];
  positionCache.set(key, position);

  if (positionCache.size > 256) {
    const oldest = positionCache.keys().next();
    if (!oldest.done) positionCache.delete(oldest.value);
  }

  return position;
}

function cachedIcon(key: string, build: () => L.DivIcon): L.DivIcon {
  const existing = iconCache.get(key);
  if (existing) return existing;
  const created = build();
  iconCache.set(key, created);
  return created;
}

function makeCourierIcon(
  status: Courier['status'],
  isSelected: boolean,
  isCold: boolean,
): L.DivIcon {
  const size = isSelected ? 40 : 34;

  const markerClass = isSelected
    ? 'courier-marker-selected'
    : isCold
      ? 'courier-marker-cold'
      : status === 'IDLE'
        ? 'courier-marker-idle'
        : 'courier-marker-online';

  const bicycleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>
    <circle cx='5.5' cy='17.5' r='3.5'/>
    <circle cx='18.5' cy='17.5' r='3.5'/>
    <path d='M15 6a1 1 0 0 0-1-1h-1l-3.5 7H15'/>
    <path d='M18.5 17.5 13 6'/>
    <path d='m5.5 17.5 5-9'/>
  </svg>`;

  return cachedIcon(
    `courier:${markerClass}:${size}`,
    () =>
      L.divIcon({
        className: 'courier-marker-pop',
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 6)],
        html: `<div class="${markerClass}" style="
      width:${size}px;height:${size}px;
      display:flex;align-items:center;justify-content:center;
    ">${bicycleSvg}</div>`,
      }),
  );
}

// ─ Hub marker ─
function makeHubIcon(): L.DivIcon {
  return cachedIcon('hub', () =>
    L.divIcon({
      className: 'courier-marker-pop',
      iconAnchor: [24, 24],
      popupAnchor: [0, -28],
      html: `<div style="
      width:48px;height:48px;border-radius:10px;
      background:#1E293B;border:3px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 3px 10px rgba(0,0,0,0.35);
    ">
      <svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>
        <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/>
        <polyline points='9 22 9 12 15 12 15 22'/>
      </svg>
    </div>`,
    }),
  );
}

// ─ Drop-point marker ─
function makeDropIcon(): L.DivIcon {
  return cachedIcon('drop', () =>
    L.divIcon({
      className: 'courier-marker-pop',
      iconAnchor: [60, 44],
      popupAnchor: [0, -46],
      html: `<div style="display:inline-flex;flex-direction:column;align-items:center;pointer-events:none;">
      <div style="
        background:#C91076;color:white;border-radius:8px;
        padding:5px 10px;font-size:11px;font-weight:700;
        white-space:nowrap;
        box-shadow:0 2px 8px rgba(0,0,0,0.25);
        font-family:'Plus Jakarta Sans',system-ui,sans-serif;
        line-height:1;
      ">DROP POINT TUJUAN</div>
      <div style="width:2px;height:10px;background:#C91076;"></div>
      <div style="width:10px;height:10px;border-radius:50%;background:#C91076;box-shadow:0 0 0 3px rgba(201,16,118,0.25);"></div>
    </div>`,
    }),
  );
}

// ─ Map ref setter ─
function MapRefSetter({ onMapReady }: { onMapReady: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMapReady(map); }, [map, onMapReady]);
  return null;
}

// ─ Props ─
interface MapViewProps {
  couriers: Courier[];
  hub: Hub;
  selectedCourier: Courier | null;
  showRoutes: boolean;
  onCourierClick: (courierId: string) => void;
  onMapReady: (map: L.Map) => void;
}

/**
 * Kurir muatan dingin: sedang membawa paket Frozen atau anomali suhunya
 * terdeteksi. Status inilah yang memberi titik warna oranye di peta.
 */
function isColdChain(courier: Courier): boolean {
  return (
    courier.coldChainAnomaly !== undefined ||
    courier.activePackages.some((pkg) => pkg.serviceType === 'Frozen')
  );
}

const ROUTE_COLOUR = '#C91076';
const COLD_ROUTE_COLOUR = '#F97316';

/** Lingkar radius hub tidak pernah berubah, jadi objeknya dibuat sekali. */
const HUB_RADIUS_PATH: L.PathOptions = {
  color: '#C91076',
  fillColor: '#C91076',
  fillOpacity: 0.04,
  weight: 1.5,
  dashArray: '8 5',
};

/**
 * Gaya rute per kombinasi (terpilih, muatan dingin).
 */
const routePathCache = new Map<string, L.PathOptions>();

function pathOptionsFor(isSelected: boolean, isCold: boolean): L.PathOptions {
  const key = `${isSelected ? 1 : 0}${isCold ? 1 : 0}`;
  const cached = routePathCache.get(key);
  if (cached) return cached;

  const options: L.PathOptions = {
    color: isSelected ? ROUTE_COLOUR : isCold ? COLD_ROUTE_COLOUR : '#94A3B8',
    weight: isSelected ? 3.5 : 1.8,
    opacity: isSelected ? 1 : 0.45,
    dashArray: isSelected ? undefined : '6 5',
  };
  routePathCache.set(key, options);

  return options;
}

/**
 * Penanda kurir.
 *
 * Handler klik hanya dibuat saat id atau callback berubah, jadi objek
 * `eventHandlers` tetap identik selama penanda beranimasi lima kali per detik —
 * Leaflet tidak perlu melepas dan memasang ulang listener tiap kali posisi
 * berubah. Yang dikirim ke atas hanya id; data kurir terbarunya diambil oleh
 * parent saat klik benar-benar terjadi, bukan salinan yang tersimpan di sini.
 */
function CourierMarker({
  courierId,
  position,
  icon,
  isSelected,
  isCold,
  onCourierClick,
}: {
  courierId: string;
  position: [number, number];
  icon: L.DivIcon;
  isSelected: boolean;
  isCold: boolean;
  onCourierClick: (courierId: string) => void;
}) {
  const eventHandlers = useMemo<LeafletEventHandlerFnMap>(
    () => ({ click: () => onCourierClick(courierId) }),
    [courierId, onCourierClick],
  );

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={eventHandlers}
      zIndexOffset={isSelected ? 1000 : isCold ? 500 : 0}
    />
  );
}

export const MapView = memo(function MapView({
  couriers,
  hub,
  selectedCourier,
  showRoutes,
  onCourierClick,
  onMapReady,
}: MapViewProps) {
  return (
    <MapContainer
      center={cachedPosition(hub.position.lat, hub.position.lng)}
      zoom={14}
      zoomControl={false}
      className="w-full h-full"
      style={{ background: '#e8edf0' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapRefSetter onMapReady={onMapReady} />

      {/* Hub origin marker — no popup */}
      <Marker position={cachedPosition(hub.position.lat, hub.position.lng)} icon={makeHubIcon()} />

      {/* Hub 5 km radius dashed circle */}
      <Circle
        center={cachedPosition(hub.position.lat, hub.position.lng)}
        radius={hub.radiusKm * 1000}
        pathOptions={HUB_RADIUS_PATH}
      />

      {/* Per-courier: route polyline (berhenti di titik drop) + drop marker + courier marker */}
      {couriers.map((courier) => {
        const isSelected = selectedCourier?.id === courier.id;
        const isCold = isColdChain(courier);
        const drop = courier.route?.polyline[courier.route.polyline.length - 1];

        return (
          <div key={courier.id}>
            {/* Route polyline: kurir -> titik drop, lalu berhenti */}
            {showRoutes && courier.route && courier.route.polyline.length > 1 && (
              <RoadPolyline
                polyline={courier.route.polyline}
                pathOptions={pathOptionsFor(isSelected, isCold)}
                snapped={courier.route.snapped}
              />
            )}

            {/* Titik drop diambil dari ujung rute, bukan dihitung ulang dari
                posisi penanda: keduanya harus menunjuk paket yang sama walau
                penanda sudah jalan setengah perjalanan. */}
            {isSelected && drop && (
              <Marker position={cachedPosition(drop.lat, drop.lng)} icon={makeDropIcon()} />
            )}

            {/* Courier marker: klik membuka panel detail */}
            <CourierMarker
              courierId={courier.id}
              position={cachedPosition(courier.position.lat, courier.position.lng)}
              icon={makeCourierIcon(courier.status, isSelected, isCold)}
              isSelected={isSelected}
              isCold={isCold}
              onCourierClick={onCourierClick}
            />
          </div>
        );
      })}
    </MapContainer>
  );
});
