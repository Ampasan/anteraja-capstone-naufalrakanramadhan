import type Echo from 'laravel-echo';

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

type EchoInstance = Echo<'reverb'>;
type Channel = ReturnType<EchoInstance['channel']>;

let echo: EchoInstance | null = null;
let pending: Promise<EchoInstance | null> | null = null;
let channel: Channel | null = null;
let channelName: string | null = null;
let watchdog: number | null = null;
let unavailable = false;
let generation = 0;

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
  generation++;
  try {
    echo?.disconnect();
  } catch {
    // abaikan
  }
  echo = null;
  pending = null;
  channel = null;
  channelName = null;
  unavailable = true;
}

function connect(): Promise<EchoInstance | null> {
  if (unavailable) return Promise.resolve(null);
  if (echo) return Promise.resolve(echo);
  if (pending) return pending;

  const gen = generation;

  const attempt: Promise<EchoInstance | null> = Promise.all([
    import('laravel-echo'),
    import('pusher-js'),
  ])
    .then(([echoModule, pusherModule]) => {
      if (unavailable || gen !== generation) return null;

      const instance = new echoModule.default<'reverb'>({
        broadcaster: 'reverb',
        key: env('VITE_REVERB_APP_KEY', 'anteraja-local-key'),
        wsHost: env('VITE_REVERB_HOST', '127.0.0.1'),
        wsPort: Number(env('VITE_REVERB_PORT', '8080')),
        wssPort: Number(env('VITE_REVERB_PORT', '8080')),
        forceTLS: env('VITE_REVERB_SCHEME', 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
        Pusher: pusherModule.default,
      });

      echo = instance;

      watchdog = window.setTimeout(() => {
        const state = echo?.connector.pusher.connection.state;
        if (state !== 'connected') disable();
      }, CONNECT_TIMEOUT_MS);

      return instance;
    })
    .catch(() => {
      unavailable = true;
      return null;
    })
    .finally(() => {
      if (pending === attempt) pending = null;
    });

  pending = attempt;
  return attempt;
}

async function getChannel(hubId: string): Promise<Channel | null> {
  const instance = await connect();
  if (!instance) return null;

  if (channel && channelName === `hub.${hubId}`) return channel;

  // Ganti channel bila user berpindah hub.
  if (channel && channelName) instance.leave(channelName);
  channelName = `hub.${hubId}`;
  channel = instance.channel(channelName);
  return channel;
}

export function subscribeHub(
  hubId: string,
  onEvent: (event: RealtimeEvent) => void,
): () => void {
  let active = true;
  let bindings: { event: RealtimeEvent; handler: () => void }[] = [];
  let boundChannel: Channel | null = null;

  void getChannel(hubId).then((target) => {
    if (!target) return;

    const attached = EVENTS.map((event) => {
      const handler = () => onEvent(event);
      target.listen(`.${event}`, handler);
      return { event, handler };
    });

    if (active) {
      boundChannel = target;
      bindings = attached;
      return;
    }

    for (const { event, handler } of attached) {
      try {
        target.stopListening(`.${event}`, handler);
      } catch {
        // channel sudah dilepas
      }
    }
  });

  return () => {
    if (!active) return;
    active = false;
    for (const { event, handler } of bindings) {
      try {
        boundChannel?.stopListening(`.${event}`, handler);
      } catch {
        // channel sudah dilepas
      }
    }
    bindings = [];
  };
}

/** Putus koneksi realtime (dipanggil saat logout). */
export function disconnectRealtime(): void {
  disable();
  // Sesi berikutnya boleh mencoba menyambung lagi.
  unavailable = false;
}
