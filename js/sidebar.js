import { shipments, STATUS } from "./data.js";
import { buildInfoWindow } from "./infowindow.js";

/**
 * Render the stats pills and shipment list in the sidebar.
 * Safe to call multiple times — clears existing content before rebuilding.
 * @param {Map<string, {marker, map, iw}>} markerMap
 */
export function buildSidebar(markerMap) {
  _renderStats();
  _renderList(markerMap);
  document.getElementById("sidebar-count").textContent =
    `${shipments.length} shipment aktif`;
}

function _renderStats() {
  const statsRow = document.getElementById("stats-row");
  statsRow.innerHTML = ""; // clear before rebuild

  const counts = {};
  shipments.forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });

  Object.entries(counts).forEach(([status, n]) => {
    const st   = STATUS[status] || { label: status, color: "#666", bg: "#eee" };
    const pill = document.createElement("span");
    pill.className = "stat-pill";
    pill.style.cssText = `background:${st.bg};color:${st.color}`;
    pill.textContent = `${n} ${st.label}`;
    statsRow.appendChild(pill);
  });
}

function _renderList(markerMap) {
  const list = document.getElementById("shipment-list");
  list.innerHTML = ""; // clear before rebuild

  shipments.forEach(s => {
    const st = STATUS[s.status] || { color: "#aaa", label: s.status };
    const el = document.createElement("div");
    el.className = "shipment-item";
    el.setAttribute("role", "listitem");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `${s.trackingNumber}, ${s.courierName}, ${st.label}`);
    el.dataset.id = s.trackingNumber;
    el.innerHTML = `
      <div class="item-dot" style="background:${st.color}" aria-hidden="true"></div>
      <div class="item-body">
        <div class="item-tracking">${s.trackingNumber}</div>
        <div class="item-courier">${s.courierName}</div>
      </div>
      <span class="item-badge" style="background:${STATUS[s.status]?.bg || "#eee"};color:${st.color}">${st.label}</span>
    `;

    // Click: pan to marker and open info window
    el.addEventListener("click", () => {
      const entry = markerMap.get(s.trackingNumber);
      if (!entry) return;
      entry.iw.setContent(buildInfoWindow(s));
      entry.iw.open({ anchor: entry.marker, map: entry.map, shouldFocus: false });
      entry.map.panTo(entry.marker.getPosition());
      entry.map.setZoom(15);
      document.querySelectorAll(".shipment-item").forEach(item => item.classList.remove("active"));
      el.classList.add("active");
    });

    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); el.click(); }
    });

    list.appendChild(el);
  });
}
