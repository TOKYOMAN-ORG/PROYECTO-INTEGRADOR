import { useWindowDimensions } from 'react-native';

import {
  getSizeClassConfig,
  type WindowSizeClass,
  type WindowSizeConfig,
} from '@/utils/window-size-model';

export type { WindowSizeClass, WindowSizeConfig };
export { getSizeClass, getSizeClassConfig } from '@/utils/window-size-model';

/**
 * Hook reactivo para obtener la clase de tamaño y configuración ante cambios de dimensiones y rotaciones.
 */
export function useSizeClass(): WindowSizeConfig {
  const { width } = useWindowDimensions();
  return getSizeClassConfig(width);
}

export const useBreakpoint = useSizeClass;
