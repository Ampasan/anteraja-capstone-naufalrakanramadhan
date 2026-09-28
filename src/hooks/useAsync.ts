import { useCallback, useEffect, useRef, useState } from 'react';

export interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

type Request<T> = (signal: AbortSignal) => Promise<T>;

/** Reusable request state with cancellation-safe updates. */
export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({ data: null, error: null, isLoading: false });
  const activeRequest = useRef(0);

  useEffect(() => () => { activeRequest.current += 1; }, []);

  const execute = useCallback(async (request: Request<T>, signal: AbortSignal): Promise<void> => {
    const requestId = ++activeRequest.current;
    setState((previous) => ({ ...previous, error: null, isLoading: true }));
    try {
      const data = await request(signal);
      if (activeRequest.current === requestId && !signal.aborted) {
        setState({ data, error: null, isLoading: false });
      }
    } catch (reason) {
      if (signal.aborted || activeRequest.current !== requestId) return;
      setState((previous) => ({ ...previous, error: reason instanceof Error ? reason.message : 'Terjadi kesalahan saat memuat data.', isLoading: false }));
    }
  }, []);

  return { ...state, execute };
}
