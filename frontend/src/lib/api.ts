/**
 * Klien API Laravel — Courier Admin Mini Panel.
 */

import { clearSession, getToken } from './session';

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
).replace(/\/$/, '');

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

// ─── Status permintaan: success | accepted | failed ─────────────────────────

/**
 * Tiga keadaan yang bisa dialami sebuah permintaan:
 *
 *  - `success`  server sudah menyelesaikan pekerjaannya (2xx selain 202)
 *  - `accepted` server menerima permintaan, pengerjaannya lanjut di belakang
 *               layar lewat antrean (202) — belum tentu sudah tuntas
 *  - `failed`   server menolak atau gagal (4xx/5xx) — disampaikan lewat `ApiError`
 */
export type RequestStatus = 'success' | 'accepted' | 'failed';

export interface ApiResult<T> {
  status: RequestStatus;
  http: number;
  data: T;
}

export async function apiWithStatus<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
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

  return {
    status: response.status === 202 ? 'accepted' : 'success',
    http: response.status,
    data: payload.data,
  };
}

// ─── Status pekerjaan asinkron ──────────────────────────────────────────────

export interface AsyncTask {
  id: string;
  type: string;
  status: 'accepted' | 'processing' | 'completed' | 'failed';
  message: string;
  updated_at: string;
  meta?: Record<string, unknown>;
}

export async function fetchTaskStatus(taskId: string): Promise<ApiResult<AsyncTask>> {
  return apiWithStatus<AsyncTask>(`/tasks/${encodeURIComponent(taskId)}`);
}

export async function waitForTask(
  taskId: string,
  options: {
    attempts?: number;
    intervalMs?: number;
    onUpdate?: (task: AsyncTask) => void;
  } = {},
): Promise<AsyncTask | null> {
  const { attempts = 6, intervalMs = 1000, onUpdate } = options;
  let latest: AsyncTask | null = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await fetchTaskStatus(taskId);
      latest = result.data;
      onUpdate?.(latest);
      if (latest.status === 'completed' || latest.status === 'failed') return latest;
    } catch {
      return latest;
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  return latest;
}

// ─── Micro-cache untuk GET berulang ──────────────────────────────────────────

interface CacheEntry {
  at: number;
  data: unknown;
}

const MAX_CACHE_ENTRIES = 100;

const responseCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();

function storeCached(key: string, data: unknown): void {
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = responseCache.keys().next();
    if (!oldest.done) responseCache.delete(oldest.value);
  }
  responseCache.set(key, { at: Date.now(), data });
}

export async function apiCached<T>(path: string, ttlMs: number): Promise<T> {
  const cached = responseCache.get(path);
  if (cached && Date.now() - cached.at < ttlMs) return cached.data as T;

  const running = inFlight.get(path);
  if (running) return running as Promise<T>;

  const request = api<T>(path)
    .then((data) => {
      storeCached(path, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(path);
    });

  inFlight.set(path, request);
  return request;
}

export function invalidateApiCache(prefix?: string | string[]): void {
  if (!prefix) {
    responseCache.clear();
    return;
  }
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  if (prefixes.length === 0) return;
  for (const key of [...responseCache.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) responseCache.delete(key);
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
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export { API_BASE_URL };
