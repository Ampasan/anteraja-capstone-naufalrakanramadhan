import { useContext } from 'react';
import { AppContext } from './AppContextStore';
import type { AppContextValue } from './AppContextTypes';

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext harus digunakan di dalam AppProvider.');
  return context;
}
