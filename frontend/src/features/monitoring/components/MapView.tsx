import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Courier, Hub } from '../types';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

// ── Custom courier DivIcon ──
function makeCourierIcon(status: Courier['status'], isSelected: boolean): L.DivIcon {
  const size = isSelected ? 40 : 34;
  const bg =
    isSelected          ? '#C91076'  :
    status === 'ONLINE' ? '#10B981'  :
    status === 'IDLE'   ? '#F59E0B'  :
    /* ALERT */           '#EF4444';

  const shadow =
    isSelected
      ? '0 0 0 4px rgba(201,16,118,0.35),0 2px 8px rgba(0,0,0,0.3)'
      : status === 'IDLE'
        ? '0 0 0 3px rgba(245,158,11,0.3),0 2px 5px rgba(0,0,0,0.2)'
        : status === 'ALERT'
          ? '0 0 0 3px rgba(239,68,68,0.35),0 2px 5px rgba(0,0,0,0.2)'
          : '0 0 0 2.5px rgba(16,185,129,0.25),0 2px 5px rgba(0,0,0,0.15)';

  // Bicycle SVG path
  const bicycleSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>
    <circle cx='5.5' cy='17.5' r='3.5'/>
    <circle cx='18.5' cy='17.5' r='3.5'/>
    <path d='M15 6a1 1 0 0 0-1-1h-1l-3.5 7H15'/>
    <path d='M18.5 17.5 13 6'/>
    <path d='m5.5 17.5 5-9'/>
  </svg>`;

  return L.divIcon({
    className: '',
    iconAnchor:  [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 6)],
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:2.5px solid white;
      display:flex;align-items:center;justify-content:center;
      box-shadow:${shadow};
    ">${bicycleSvg}</div>`,
  });
}

// ─ Hub marker ─
function makeHubIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconAnchor:  [24, 24],
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
  });
}

// ─ Drop-point marker ─
function makeDropIcon(): L.DivIcon {
  return L.divIcon({
    className: '',
    iconAnchor:  [60, 44],
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
  });
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
  onCourierClick: (courier: Courier) => void;
  onMapReady: (map: L.Map) => void;
}

const ROUTE_COLOUR = '#C91076';
const ALERT_COLOUR = '#EF4444';

export function MapView({
  couriers,
  hub,
  selectedCourier,
  showRoutes,
  onCourierClick,
  onMapReady,
}: MapViewProps) {
  return (
    <MapContainer
      center={[hub.position.lat, hub.position.lng]}
      zoom={14}
      zoomControl={false}
      className="w-full h-full"
      style={{ background: '#e8edf0' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />

      <MapRefSetter onMapReady={onMapReady} />

      {/* Hub origin marker — no popup */}
      <Marker position={[hub.position.lat, hub.position.lng]} icon={makeHubIcon()} />

      {/* Hub 5 km radius dashed circle */}
      <Circle
        center={[hub.position.lat, hub.position.lng]}
        radius={hub.radiusKm * 1000}
        pathOptions={{
          color:       '#C91076',
          fillColor:   '#C91076',
          fillOpacity: 0.04,
          weight:      1.5,
          dashArray:   '8 5',
        }}
      />

      {/* Per-courier: route polyline + drop marker + courier marker */}
      {couriers.map((courier) => {
        const isSelected = selectedCourier?.id === courier.id;
        const isAlert    = courier.status === 'ALERT';

        return (
          <div key={courier.id}>
            {/* Route polyline */}
            {showRoutes && courier.route && courier.route.polyline.length > 1 && (
              <Polyline
                positions={courier.route.polyline.map((p) => [p.lat, p.lng] as [number, number])}
                pathOptions={{
                  color:     isSelected ? ROUTE_COLOUR : isAlert ? ALERT_COLOUR : '#94A3B8',
                  weight:    isSelected ? 3.5 : 1.8,
                  opacity:   isSelected ? 1 : 0.45,
                  dashArray: isSelected ? undefined : '6 5',
                }}
              />
            )}

            {/* Drop-point pin — no popup; clicking opens side panel via courier marker */}
            {isSelected && courier.activePackages[0] && (
              <Marker
                position={[
                  courier.activePackages[0].dropLat,
                  courier.activePackages[0].dropLng,
                ]}
                icon={makeDropIcon()}
              />
            )}

            {/* Courier marker — click opens side detail panel */}
            <Marker
              position={[courier.position.lat, courier.position.lng]}
              icon={makeCourierIcon(courier.status, isSelected)}
              eventHandlers={{ click: () => onCourierClick(courier) }}
              zIndexOffset={isSelected ? 1000 : isAlert ? 500 : 0}
            />
          </div>
        );
      })}
    </MapContainer>
  );
}
