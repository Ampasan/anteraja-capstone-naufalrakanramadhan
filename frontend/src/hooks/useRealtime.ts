import { useEffect, useRef } from 'react';
import { subscribeHub, type RealtimeEvent } from '../lib/realtime';

export type { RealtimeEvent };

/**
 * Berlangganan event realtime hub aktif.
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
