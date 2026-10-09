import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { formatDwell } from '../utils/format';

// Leaflet default icon path fix for Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * HubMap — Leaflet map rendered via vanilla Leaflet (not react-leaflet)
 * to avoid the "map already initialized" error and give full control
 * over marker state and popups.
 *
 * Props:
 *   hubs       — filtered hub list (shared state from App)
 *   selectedId — currently selected hub_id
 *   onSelect   — callback(hub_id | null)
 */
export default function HubMap({ hubs, selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // hub_id -> L.CircleMarker

  // --- Initialize map once ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [-2.5, 112.0],
      zoom: 5,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // --- Sync markers whenever hubs or selectedId changes ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove markers no longer in hubs
    const currentIds = new Set(hubs.map((h) => h.hub_id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add or update markers
    hubs.forEach((hub) => {
      if (hub.lat == null || hub.lng == null) return;

      const isSelected = hub.hub_id === selectedId;
      const isPriority = hub.priority;

      const markerColor = isPriority ? '#E3008C' : '#10B981';
      const radius = isSelected ? 12 : 8;
      const weight = isSelected ? 3 : 2;

      const options = {
        radius,
        fillColor: markerColor,
        color: '#ffffff',
        weight,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.85,
      };

      if (markersRef.current[hub.hub_id]) {
        // Update existing marker style
        markersRef.current[hub.hub_id].setStyle(options);
        markersRef.current[hub.hub_id].setRadius(radius);
      } else {
        // Create new marker
        const marker = L.circleMarker([hub.lat, hub.lng], options);

        // Popup content (plain HTML, no executable code)
        const popupContent = `
          <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;padding:12px 14px;">
            <div style="font-size:13px;font-weight:700;color:#0F172A;margin-bottom:4px">${escapeHtml(hub.name)}</div>
            <div style="font-size:11px;color:#94A3B8;margin-bottom:10px">${escapeHtml(hub.hub_id)}</div>
            <table style="width:100%;border-collapse:collapse;font-size:12px;">
              <tr><td style="color:#64748B;padding:2px 0">Rata-rata dwell</td><td style="font-weight:700;color:${isPriority ? '#E3008C' : '#0F172A'};text-align:right">${formatDwell(hub.mean_dwell)}</td></tr>
              <tr><td style="color:#64748B;padding:2px 0">Min dwell</td><td style="font-weight:600;text-align:right;color:#0F172A">${formatDwell(hub.min_dwell)}</td></tr>
              <tr><td style="color:#64748B;padding:2px 0">Max dwell</td><td style="font-weight:600;text-align:right;color:#0F172A">${formatDwell(hub.max_dwell)}</td></tr>
              <tr><td style="color:#64748B;padding:2px 0">Kunjungan selesai</td><td style="font-weight:600;text-align:right;color:#0F172A">${hub.completed_visits.toLocaleString('id-ID')}</td></tr>
            </table>
            ${isPriority ? `<div style="margin-top:8px;padding:5px 8px;background:#FDF2F8;border:1px solid #FCE7F3;border-radius:6px;font-size:11px;color:#E3008C;font-weight:600;">Prioritas investigasi</div>` : ''}
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 240,
          minWidth: 220,
          offset: [0, -4],
        });

        marker.on('click', () => {
          onSelect(hub.hub_id);
        });

        marker.addTo(map);
        markersRef.current[hub.hub_id] = marker;
      }
    });
  }, [hubs, selectedId, onSelect]);

  // --- Open popup for selected hub ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedId && markersRef.current[selectedId]) {
      const marker = markersRef.current[selectedId];
      marker.openPopup();
      map.setView(marker.getLatLng(), Math.max(map.getZoom(), 7), {
        animate: true,
        duration: 0.4,
      });
    }
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      aria-label="Peta lokasi hub Anteraja"
      style={{
        width: '100%',
        height: '100%',
        minHeight: '200px',
        borderLeft: '1px solid #E2E8F0',
        borderRight: '1px solid #E2E8F0',
        overflow: 'hidden',
      }}
    />
  );
}

/** Prevent XSS when inserting external data into popup HTML */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
