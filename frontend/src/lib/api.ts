/**
 * Klien API Laravel — Courier Admin Mini Panel.
 */

import { clearSession, getToken } from './session';
import { readStored, writeStored } from './storage';

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

/**
 * Umur cadangan tahan-simpan untuk endpoint yang menentukan tampilan pertama
 * halaman. Setelah reload, isi lama tampil lebih dulu dan diganti oleh
 * permintaan yang berjalan di latar belakang.
 */
export const STALE_WHILE_REVALIDATE_MS = 5 * 60_000;

const PERSIST_KEY = 'anteraja.api.cache';
/** sessionStorage cuma 5 MB; pagu entri dan panjang per entri menjaganya aman. */
const PERSIST_LIMIT = 8;
const PERSIST_MAX_CHARS = 150_000;
/**
 * Jeda minimum antar tulis per kunci. Polling ber-`staleMs` (mis. monitoring
 * tiap 2 detik) sebelumnya menjalankan stringify + parse + stringify +
 * setItem tiap respons sukses; isi cadangan ini hanya penolong gambar pertama
 * saat reload, jadi menyegarnya tiap 10 detik sudah lebih dari cukup.
 */
const PERSIST_THROTTLE_MS = 10_000;
const lastPersistedAt = new Map<string, number>();

type PersistedCache = Record<string, CacheEntry>;

function loadPersisted(): PersistedCache {
  const stored = readStored<unknown>(PERSIST_KEY);
  return stored && typeof stored === 'object' ? (stored as PersistedCache) : {};
}

function persistCached(key: string, data: unknown): void {
  const now = Date.now();
  if (now - (lastPersistedAt.get(key) ?? 0) < PERSIST_THROTTLE_MS) return;
  lastPersistedAt.set(key, now);

  // Ukuran dicek dulu: payload yang kebesaran tidak ditulis, tapi tetap
  // kena jeda throttle supaya tidak diserialisasi ulang tiap kali.
  if (JSON.stringify(data).length > PERSIST_MAX_CHARS) return;

  const cache = loadPersisted();
  cache[key] = { at: Date.now(), data };

  const keys = Object.keys(cache);
  if (keys.length > PERSIST_LIMIT) {
    keys
      .sort((a, b) => cache[a].at - cache[b].at)
      .slice(0, keys.length - PERSIST_LIMIT)
      .forEach((expired) => delete cache[expired]);
  }

  writeStored(PERSIST_KEY, cache);
}

function dropPersisted(prefixes: string[]): void {
  const cache = loadPersisted();
  let changed = false;
  for (const key of Object.keys(cache)) {
    if (!prefixes.some((prefix) => key.startsWith(prefix))) continue;
    delete cache[key];
    changed = true;
  }
  if (changed) writeStored(PERSIST_KEY, cache);
}

function startRequest<T>(path: string, staleMs?: number): Promise<T> {
  const request = api<T>(path)
    .then((data) => {
      storeCached(path, data);
      if (staleMs) persistCached(path, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(path);
    });

  inFlight.set(path, request);
  return request;
}

/**
 * Ambil GET lewat micro-cache `ttlMs`.
 *
 * `staleMs` mengaktifkan stale-while-revalidate: setelah reload, cadangan
 * tahan-simpan tampil lebih dulu sambil permintaan segar jalan di belakang.
 * `onRevalidated` menerima hasil segar itu — tanpanya hasil revalidasi cuma
 * masuk ke memori, sehingga state pemanggil tetap basi sampai ttl habis
 * (atau selamanya bila pemanggil tidak polling).
 */
export async function apiCached<T>(
  path: string,
  ttlMs: number,
  options?: { staleMs?: number; onRevalidated?: (data: T) => void },
): Promise<T> {
  const cached = responseCache.get(path);
  if (cached && Date.now() - cached.at < ttlMs) return cached.data as T;

  const staleMs = options?.staleMs;
  const onRevalidated = options?.onRevalidated;
  const pending = inFlight.get(path) as Promise<T> | undefined;
  const request = pending ?? startRequest<T>(path, staleMs);

  // Reload halaman: memori masih kosong, jadi isi terakhir dipakai untuk memberi
  // gambar pertama tanpa menunggu Supabase. Poll berikutnya sudah punya memori
  // dan kembali menunggu data segar seperti biasa.
  if (!cached && staleMs) {
    const stale = loadPersisted()[path];
    if (stale && Date.now() - stale.at < staleMs) {
      if (onRevalidated) void request.then(onRevalidated).catch(() => undefined);
      else void request.catch(() => undefined);
      return stale.data as T;
    }
  }

  return request;
}

export function invalidateApiCache(prefix?: string | string[]): void {
  if (!prefix) {
    responseCache.clear();
    lastPersistedAt.clear();
    dropPersisted(['']);
    return;
  }
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  if (prefixes.length === 0) return;
  for (const key of [...responseCache.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) responseCache.delete(key);
  }
  for (const key of [...lastPersistedAt.keys()]) {
    if (prefixes.some((p) => key.startsWith(p))) lastPersistedAt.delete(key);
  }
  dropPersisted(prefixes);
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
