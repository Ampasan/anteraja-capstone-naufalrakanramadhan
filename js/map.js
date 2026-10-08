import { HUB, shipments } from "./data.js";
import { addMarker } from "./marker.js";
import { buildSidebar } from "./sidebar.js";
import { showToast } from "./toast.js";

// Custom map styles: clean, minimal POI clutter
const MAP_STYLES = [
  { featureType: "poi",           elementType: "labels",      stylers: [{ visibility: "off" }] },
  { featureType: "transit",       elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road",          elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water",         elementType: "geometry",    stylers: [{ color: "#cce8f4" }] },
  { featureType: "landscape",     elementType: "geometry",    stylers: [{ color: "#f5f5f0" }] },
  { featureType: "road.highway",  elementType: "geometry",    stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "geometry",    stylers: [{ color: "#ffffff" }] },
  { featureType: "road.local",    elementType: "geometry",    stylers: [{ color: "#f9f9f9" }] },
];

/**
 * Google Maps API callback. Initializes the map, markers, geocoding, and sidebar.
 * Exposed on window so the Maps script `callback=initMap` can invoke it.
 */
export function initMap() {
  const map = new google.maps.Map(document.getElementById("map"), {
    center:            HUB,
    zoom:              13,
    mapTypeControl:    false,
    streetViewControl: false,
    fullscreenControl: false,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_CENTER,
    },
    styles: MAP_STYLES,
  });

  const sharedIW  = new google.maps.InfoWindow({ maxWidth: 260 });
  const markerMap = new Map(); // trackingNumber → { marker, map, iw }

  // Clear sidebar highlight when info window is closed
  sharedIW.addListener("closeclick", () => {
    document.querySelectorAll(".shipment-item").forEach(el => el.classList.remove("active"));
  });

  // Place markers for shipments that already have coordinates
  shipments
    .filter(s => s.lat !== undefined && s.lng !== undefined)
    .forEach(s => addMarker(map, sharedIW, s, { lat: s.lat, lng: s.lng }, markerMap));

  // Geocode shipments that only have an address string (e.g. ANJ-00006)
  const needGeocode = shipments.filter(s => s.address && s.lat === undefined);
  if (needGeocode.length > 0) {
    const geocoder = new google.maps.Geocoder();
    needGeocode.forEach(s => {
      geocoder.geocode({ address: s.address }, (results, status) => {
        if (status === "OK" && results.length > 0) {
          addMarker(map, sharedIW, s, results[0].geometry.location, markerMap);
          buildSidebar(markerMap); // refresh sidebar to include the newly geocoded marker
          showToast(`${s.trackingNumber}: ${results[0].formatted_address}`, "success");
        } else {
          console.warn("Geocoding failed:", s.trackingNumber, status);
          showToast(`${s.trackingNumber} gagal di-geocode (${status})`, "error");
        }
      });
    });
  }

  buildSidebar(markerMap);
}
