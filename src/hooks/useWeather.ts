import { useCallback, useEffect } from 'react';
import { fetchCurrentWeather } from '../api/openMeteo';
import { useAsync } from './useAsync';

export function useWeather(latitude: number, longitude: number) {
  const { data, error, isLoading, execute } = useAsync<Awaited<ReturnType<typeof fetchCurrentWeather>>>();
  const reload = useCallback((signal: AbortSignal) => execute(
    (requestSignal) => fetchCurrentWeather(latitude, longitude, requestSignal),
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

  return { weather: data, error, isLoading, refetch };
}
