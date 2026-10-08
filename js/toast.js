// ── Toast notification for geocoding results

const toast  = document.getElementById("geocode-toast");
const typeEl = document.getElementById("toast-type");
const msgEl  = document.getElementById("toast-msg");

/**
 * Show a toast notification.
 * @param {string} msg  - Message body text.
 * @param {"success"|"error"} type - Controls border color and label.
 */
export function showToast(msg, type) {
  typeEl.textContent = type === "success" ? "Geocoding Berhasil" : "Geocoding Gagal";
  msgEl.textContent  = msg;
  toast.className = `show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.className = ""; }, 7000);
}
