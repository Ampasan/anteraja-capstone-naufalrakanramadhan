import { apiCached, STALE_WHILE_REVALIDATE_MS } from './api';

/** TTL sengaja lebih pendek dari interval poll, supaya halaman tetap menyegar. */
const CORE_TTL_MS = 8_000;
const SHELL_TTL_MS = 30_000;

const ROUTE_MODULES = [
  () => import('../features/monitoring/MonitoringPage'),
  () => import('../features/sla-risk/SlaRiskPage'),
  () => import('../features/incidents/IncidentsPage'),
  () => import('../features/audit-logs/AuditLogsPage'),
];

let warmed = false;

function warm(): void {
  for (const load of ROUTE_MODULES) void load().catch(() => undefined);

  void apiCached('/dashboard/summary', SHELL_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }).catch(() => undefined);
  void apiCached('/hubs', SHELL_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }).catch(() => undefined);
  void apiCached('/couriers', CORE_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }).catch(() => undefined);
  void apiCached('/orders/sla-risk', CORE_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }).catch(() => undefined);
  void apiCached('/incidents', CORE_TTL_MS, { staleMs: STALE_WHILE_REVALIDATE_MS }).catch(() => undefined);
}

/** Panggil sesaat sesudah sesi terbaca. Aman dipanggil berkali-kali. */
export function warmAppShell(): void {
  if (warmed) return;
  warmed = true;
  try {
    warm();
  } catch {
    // Pemanasan gagal dijalankan — abaikan; halaman tetap meminta datanya sendiri.
  }
}

export function warmPublicShell(): void {
  void apiCached('/hubs', SHELL_TTL_MS).catch(() => undefined);
}
