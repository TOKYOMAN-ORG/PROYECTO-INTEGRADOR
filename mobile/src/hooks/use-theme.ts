import {
  Colors,
  Duration,
  Elevation,
  Radius,
  Typography,
  type ColorTheme,
} from '@/constants/theme';
import { useThemePreferenceOptional } from '@/features/theme/theme-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type Theme = ColorTheme & {
  colors: ColorTheme;
  typography: typeof Typography;
  radius: typeof Radius;
  elevation: typeof Elevation;
  duration: typeof Duration;
  isDark: boolean;
  scheme: 'light' | 'dark';
};

export function useTheme(): Theme {
  const systemScheme = useColorScheme();
  const preference = useThemePreferenceOptional();
  const scheme = preference ? preference.scheme : systemScheme;
  const activeScheme: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light';
  const colors = Colors[activeScheme];

  return {
    ...colors,
    colors,
    typography: Typography,
    radius: Radius,
    elevation: Elevation,
    duration: Duration,
    isDark: activeScheme === 'dark',
    scheme: activeScheme,
  };
}
