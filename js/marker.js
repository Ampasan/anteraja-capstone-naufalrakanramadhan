import { STATUS } from "./data.js";
import { buildInfoWindow } from "./infowindow.js";

/**
 * Generate a colored SVG pin icon for Google Maps.
 * @param {string} color - CSS hex color for the pin fill.
 * @returns {google.maps.Icon} Icon descriptor object.
 */
export function markerIcon(color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
    <filter id="ds" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity=".25"/>
    </filter>
    <g filter="url(#ds)">
      <path d="M17 1C8.716 1 2 7.716 2 16c0 11.5 15 29 15 29S32 27.5 32 16C32 7.716 25.284 1 17 1z" fill="${color}"/>
      <circle cx="17" cy="16" r="6.5" fill="#fff"/>
    </g>
  </svg>`;
  return {
    url:        "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg.trim()),
    scaledSize: new google.maps.Size(34, 46),
    anchor:     new google.maps.Point(17, 46),
  };
}

/**
 * Add a marker for a shipment to the map and register it in markerMap.
 * @param {google.maps.Map} map
 * @param {google.maps.InfoWindow} sharedIW - Single shared InfoWindow instance.
 * @param {object} shipment - Shipment data object.
 * @param {google.maps.LatLng|{lat:number,lng:number}} position
 * @param {Map<string, {marker, map, iw}>} markerMap - Registry keyed by trackingNumber.
 */
export function addMarker(map, sharedIW, shipment, position, markerMap) {
  const st     = STATUS[shipment.status] || { color: "#444" };
  const marker = new google.maps.Marker({
    position,
    map,
    title:     `${shipment.trackingNumber} – ${shipment.courierName}`,
    icon:      markerIcon(st.color),
    optimized: false,
  });

  marker.addListener("click", () => {
    sharedIW.close();
    sharedIW.setContent(buildInfoWindow(shipment));
    sharedIW.open({ anchor: marker, map, shouldFocus: false });
    map.panTo(marker.getPosition());

    // Sync sidebar highlight
    document.querySelectorAll(".shipment-item").forEach(el => el.classList.remove("active"));
    const row = document.querySelector(`[data-id="${shipment.trackingNumber}"]`);
    if (row) row.classList.add("active");
  });

  markerMap.set(shipment.trackingNumber, { marker, map, iw: sharedIW });
}
