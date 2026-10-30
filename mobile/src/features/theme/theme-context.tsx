import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  loadThemePreference,
  resolveScheme,
  saveThemePreference,
  toggleScheme,
  type ResolvedScheme,
  type ThemePreference,
} from './theme-preference';

interface ThemePreferenceValue {
  preference: ThemePreference;
  scheme: ResolvedScheme;
  setPreference: (preference: ThemePreference) => void;
  toggle: () => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let active = true;
    loadThemePreference().then((stored) => {
      if (active) setPreferenceState(stored);
    });
    return () => {
      active = false;
    };
  }, []);

  const scheme = resolveScheme(preference, systemScheme);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void saveThemePreference(next);
  }, []);

  const toggle = useCallback(() => {
    setPreference(toggleScheme(scheme));
  }, [scheme, setPreference]);

  const value = useMemo(
    () => ({ preference, scheme, setPreference, toggle }),
    [preference, scheme, setPreference, toggle],
  );

  return <ThemePreferenceContext.Provider value={value}>{children}</ThemePreferenceContext.Provider>;
}

/** Devuelve `null` fuera del proveedor para que `useTheme` pueda caer al tema del sistema. */
export function useThemePreferenceOptional(): ThemePreferenceValue | null {
  return useContext(ThemePreferenceContext);
}

export function useThemePreference(): ThemePreferenceValue {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference debe usarse dentro de AppThemeProvider');
  return value;
}
