import {
  Colors,
  Duration,
  Elevation,
  Radius,
  Typography,
  type ColorTheme,
} from '@/constants/theme';
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
  const scheme = useColorScheme();
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
