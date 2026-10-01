import { createContext } from 'react';
import type { AppContextValue } from './AppContextTypes';

export const AppContext = createContext<AppContextValue | null>(null);
