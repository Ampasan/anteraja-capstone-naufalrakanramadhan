import { STATUS } from "./data.js";

/**
 * Build the HTML string rendered inside a Google Maps InfoWindow.
 * @param {object} shipment - A shipment object from data.js.
 * @returns {string} HTML string.
 */
export function buildInfoWindow(shipment) {
  const st = STATUS[shipment.status] || { label: shipment.status, color: "#666", bg: "#eee" };
  return `<div class="iw">
    <div class="iw-no">${shipment.trackingNumber}</div>
    <div class="iw-courier">${shipment.courierName}</div>
    <div class="iw-row">
      <span class="iw-key">Status</span>
      <span class="iw-badge" style="background:${st.bg};color:${st.color}">${st.label}</span>
    </div>
    <div class="iw-row">
      <span class="iw-key">Tujuan</span>
      <span class="iw-val">${shipment.destination}</span>
    </div>
    <div class="iw-row">
      <span class="iw-key">ETA</span>
      <span class="iw-val">${shipment.eta}</span>
    </div>
    <div class="iw-row">
      <span class="iw-key">Berat</span>
      <span class="iw-val">${shipment.weight}</span>
    </div>
  </div>`;
}
