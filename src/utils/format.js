/**
 * Format a dwell time in hours to a readable string.
 * e.g. 1.5 -> "1j 30m" | 0.75 -> "45m"
 */
export function formatDwell(hours) {
  if (hours == null || isNaN(hours)) return '—';
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}j`;
  return `${h}j ${m}m`;
}

/**
 * Format large numbers with thousands separator.
 */
export function formatNumber(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('id-ID');
}
