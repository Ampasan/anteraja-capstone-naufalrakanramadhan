/**
 * Klien API Laravel — Courier Admin Mini Panel.
 *
 * Semua endpoint memakai envelope `{ ok, data, message }` sehingga cukup satu
 * jalur penanganan error. Token Bearer disisipkan otomatis dari `session.ts`.
 */

import { clearSession, getToken } from './session';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
).replace(/\/$/, '');

/** Dipancarkan saat server menjawab 401 — App.tsx memakainya untuk logout paksa. */
export const UNAUTHORIZED_EVENT = 'anteraja:unauthorized';

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function buildHeaders(init?: RequestInit, hasBody = false): Headers {
  const headers = new Headers(init?.headers);
  headers.set('Accept', 'application/json');
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

function emitUnauthorized(): void {
  clearSession();
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

/** Pesan error yang layak ditampilkan ke pengguna (tanpa membocorkan detail server). */
async function readError(response: Response): Promise<ApiError> {
  if (response.status === 401) emitUnauthorized();

  let message = 'Server tidak dapat memproses permintaan.';
  try {
    const payload = (await response.json()) as ApiEnvelope<unknown> | null;
    if (payload?.message) message = payload.message;
  } catch {
    if (response.status === 404) message = 'Data tidak ditemukan.';
    else if (response.status >= 500) message = 'Terjadi gangguan pada server. Coba lagi.';
    else if (response.status === 429) message = 'Terlalu banyak permintaan. Tunggu sebentar.';
  }
  return new ApiError(message, response.status);
}

/**
 * Panggil endpoint JSON dan kembalikan `data` dari envelope.
 * Lempar `ApiError` (bernomor status) bila gagal.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init, hasBody),
  });

  if (!response.ok) throw await readError(response);

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!payload || payload.ok !== true) {
    throw new ApiError(
      payload?.message ?? 'Server tidak dapat memproses permintaan.',
      response.status,
    );
  }
  return payload.data;
}

/** Versi ringkas untuk request tanpa membaca body (mis. logout). */
export async function apiVoid(path: string, init?: RequestInit): Promise<void> {
  const hasBody = init?.body !== undefined && init.body !== null;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(init, hasBody),
  });
  if (!response.ok) throw await readError(response);
}

// ─── Micro-cache untuk GET berulang ──────────────────────────────────────────
// Header dan Sidebar sama-sama butuh /dashboard/summary; halaman monitoring
// butuh /couriers + /orders/sla-risk. Cache ini menyatukan panggilan
// paralel yang identik dan menghemat round-trip ke Supabase (~200 ms/query).
// Request mutasi (POST) sengaja TIDAK lewat sini.

interface CacheEntry {
  at: number;
  data: unknown;
}

const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

export async function apiCached<T>(path: string, ttlMs: number): Promise<T> {
  const cached = responseCache.get(path);
  if (cached && Date.now() - cached.at < ttlMs) return cached.data as T;

  const running = inFlight.get(path);
  if (running) return running as Promise<T>;

  const request = api<T>(path)
    .then((data) => {
      responseCache.set(path, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      inFlight.delete(path);
    });

  inFlight.set(path, request);
  return request;
}

/** Buang hasil cache agar fetch berikutnya benar-benar menembus server. */
export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    responseCache.clear();
    return;
  }
  for (const key of [...responseCache.keys()]) {
    if (key.startsWith(prefix)) responseCache.delete(key);
  }
}

// ─── Unduhan (ekspor CSV / XLSX / PDF) ──────────────────────────────────────

function filenameFrom(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!match) return fallback;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

/**
 * Unduh berkas dari endpoint ekspor. Karena endpoint memerlukan Bearer token,
 * berkas tidak bisa dibuka via `window.open` — harus lewat fetch + Blob.
 */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, { headers: buildHeaders() });
  if (!response.ok) throw await readError(response);

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filenameFrom(response.headers.get('content-disposition'), fallbackName);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  // Beri waktu browser mengambil blob sebelum URL dicabut.
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export { API_BASE_URL };
