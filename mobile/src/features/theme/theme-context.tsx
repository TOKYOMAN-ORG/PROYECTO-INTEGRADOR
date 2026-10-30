import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Dimensions, Platform, StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import {
  loadThemePreference,
  resolveScheme,
  saveThemePreference,
  toggleScheme,
  type ResolvedScheme,
  type ThemePreference,
} from './theme-preference';
import { clampOrigin, computeRevealRadius, type RevealOrigin } from './theme-reveal';
import { ThemeRevealOverlay, type RevealState } from './theme-reveal-overlay';
import { prefersReducedMotionWeb } from './theme-view-transition';

interface ThemePreferenceValue {
  preference: ThemePreference;
  scheme: ResolvedScheme;
  setPreference: (preference: ThemePreference) => void;
  /** Alterna claro/oscuro; con `origin` la animación crece desde ese punto de la pantalla. */
  toggle: (origin?: RevealOrigin) => void;
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
  const [reveal, setReveal] = useState<RevealState | null>(null);
  const revealId = useRef(0);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void saveThemePreference(next);
  }, []);

  const toggle = useCallback(
    (origin?: RevealOrigin) => {
      if (reveal) return; // Evita apilar animaciones si se pulsa varias veces.
      const target = toggleScheme(scheme);
      const { width, height } = Dimensions.get('window');
      const start = clampOrigin(origin ?? { x: width - 40, y: 40 }, width, height);
      const radius = Math.ceil(computeRevealRadius(start, width, height)) + 30;

      const startOverlay = () => {
        revealId.current += 1;
        setReveal({
          ...start,
          radius,
          target,
          backgroundColor: Colors[target].background,
          id: revealId.current,
        });
      };

      if (Platform.OS === 'web') {
        if (prefersReducedMotionWeb()) {
          setPreference(target);
          return;
        }
        startOverlay();
        return;
      }

      AccessibilityInfo.isReduceMotionEnabled()
        .then((reduced) => (reduced ? setPreference(target) : startOverlay()))
        .catch(startOverlay);
    },
    [reveal, scheme, setPreference],
  );

  const value = useMemo(
    () => ({ preference, scheme, setPreference, toggle }),
    [preference, scheme, setPreference, toggle],
  );

  return (
    <ThemePreferenceContext.Provider value={value}>
      <View style={styles.root}>
        {children}
        {reveal && (
          <ThemeRevealOverlay
            reveal={reveal}
            onCovered={() => setPreference(reveal.target)}
            onDone={() => setReveal(null)}
          />
        )}
      </View>
    </ThemePreferenceContext.Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});

/** Devuelve `null` fuera del proveedor para que `useTheme` pueda caer al tema del sistema. */
export function useThemePreferenceOptional(): ThemePreferenceValue | null {
  return useContext(ThemePreferenceContext);
}

export function useThemePreference(): ThemePreferenceValue {
  const value = useContext(ThemePreferenceContext);
  if (!value) throw new Error('useThemePreference debe usarse dentro de AppThemeProvider');
  return value;
}
