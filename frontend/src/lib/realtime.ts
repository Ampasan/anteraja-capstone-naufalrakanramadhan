/**
 * Koneksi realtime (Laravel Reverb via Laravel Echo + pusher-js).
 *
 * Realtime bersifat PELengkap: seluruh panel tetap memutakhirkan data lewat
 * polling REST. Bila server WebSocket tidak tersedia, koneksi diputus setelah
 * beberapa detik supaya tidak membanjiri konsol dan menghemat resource —
 * tidak ada satu pun alur data yang bergantung pada koneksi ini.
 */

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

export type RealtimeEvent =
  | 'incident.reported'
  | 'incident.escalated'
  | 'incident.reassigned'
  | 'courier.telemetry';

const EVENTS: RealtimeEvent[] = [
  'incident.reported',
  'incident.escalated',
  'incident.reassigned',
  'courier.telemetry',
];

/** Berapa lama menunggu sebelum menyerah menyalakan WebSocket. */
const CONNECT_TIMEOUT_MS = 6000;

type Channel = ReturnType<Echo<'reverb'>['channel']>;

let echo: Echo<'reverb'> | null = null;
let channel: Channel | null = null;
let channelName: string | null = null;
let watchdog: number | null = null;
/** Setelah gagal sekali, jangan coba lagi selama satu sesi halaman. */
let unavailable = false;

function env(name: string, fallback: string): string {
  const value = (import.meta.env as Record<string, unknown>)[name];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function clearWatchdog(): void {
  if (watchdog !== null) {
    window.clearTimeout(watchdog);
    watchdog = null;
  }
}

function disable(): void {
  clearWatchdog();
  try {
    echo?.disconnect();
  } catch {
    // abaikan
  }
  echo = null;
  channel = null;
  channelName = null;
  unavailable = true;
}

function connect(): Echo<'reverb'> | null {
  if (unavailable) return null;
  if (echo) return echo;

  const host = env('VITE_REVERB_HOST', '127.0.0.1');
  const port = Number(env('VITE_REVERB_PORT', '8080'));
  const scheme = env('VITE_REVERB_SCHEME', 'http');

  try {
    echo = new Echo<'reverb'>({
      broadcaster: 'reverb',
      key: env('VITE_REVERB_APP_KEY', 'anteraja-local-key'),
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      Pusher,
    });
  } catch {
    unavailable = true;
    return null;
  }

  // Watchdog: bila Reverb tidak menjawab dalam beberapa detik, putuskan
  // koneksi dan andalkan polling saja.
  watchdog = window.setTimeout(() => {
    const state = echo?.connector.pusher.connection.state;
    if (state !== 'connected') disable();
  }, CONNECT_TIMEOUT_MS);

  return echo;
}

function getChannel(hubId: string): Channel | null {
  const instance = connect();
  if (!instance) return null;

  if (channel && channelName === `hub.${hubId}`) return channel;

  // Ganti channel bila user berpindah hub.
  if (channel && channelName) instance.leave(channelName);
  channelName = `hub.${hubId}`;
  channel = instance.channel(channelName);
  return channel;
}

/**
 * Berlangganan seluruh event operasional hub. Mengembalikan fungsi
 * pembatal langganan yang aman dipanggil berkali-kali.
 */
export function subscribeHub(
  hubId: string,
  onEvent: (event: RealtimeEvent) => void,
): () => void {
  const target = getChannel(hubId);
  if (!target) return () => undefined;

  const bindings = EVENTS.map((event) => {
    const handler = () => onEvent(event);
    // Echo menambahkan titik di depan nama event hasil broadcastAs().
    target.listen(`.${event}`, handler);
    return { event, handler };
  });

  let active = true;

  return () => {
    if (!active) return;
    active = false;
    for (const { event, handler } of bindings) {
      try {
        target.stopListening(`.${event}`, handler);
      } catch {
        // channel sudah dilepas
      }
    }
  };
}

/** Putus koneksi realtime (dipanggil saat logout). */
export function disconnectRealtime(): void {
  unavailable = false;
  disable();
  unavailable = false;
}
