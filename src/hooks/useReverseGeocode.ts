import { useCallback, useEffect } from 'react';
import { reverseGeocode } from '../api/nominatim';
import { useAsync } from './useAsync';

export function useReverseGeocode(latitude: number, longitude: number) {
  const { data, error, isLoading, execute } = useAsync<Awaited<ReturnType<typeof reverseGeocode>>>();
  const reload = useCallback((signal: AbortSignal) => execute(
    (requestSignal) => reverseGeocode(latitude, longitude, requestSignal),
    signal,
  ), [execute, latitude, longitude]);

  useEffect(() => {
    const controller = new AbortController();
    void reload(controller.signal);
    return () => controller.abort();
  }, [reload]);

  const refetch = useCallback(() => {
    const controller = new AbortController();
    void reload(controller.signal);
  }, [reload]);

  return { location: data, error, isLoading, refetch };
}
