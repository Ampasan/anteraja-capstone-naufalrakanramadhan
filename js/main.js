import { initMap } from "./map.js";

// Set topbar date on page load
document.getElementById("topbar-date").textContent =
  new Date().toLocaleDateString("id-ID", {
    weekday: "short",
    day:     "numeric",
    month:   "short",
    year:    "numeric",
  });

// Expose initMap to global scope for the Google Maps API `callback=initMap` parameter
window.initMap = initMap;
