import { useEffect, useRef } from 'react';
import { subscribeHub, type RealtimeEvent } from '../lib/realtime';

/**
 * Berlangganan event realtime hub aktif.
 *
 * Callback disimpan lewat ref sehingga perubahan fungsi di dalam komponen
 * tidak memutus langganan (dan tidak membuat koneksi WebSocket baru).
 */
export function useRealtime(
  hubId: string | undefined | null,
  onEvent: (event: RealtimeEvent) => void,
): void {
  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!hubId) return;
    return subscribeHub(hubId, (event) => callbackRef.current(event));
  }, [hubId]);
}
