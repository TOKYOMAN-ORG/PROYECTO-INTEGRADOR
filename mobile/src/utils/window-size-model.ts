export type WindowSizeClass = 'compact' | 'medium' | 'expanded';

export interface WindowSizeConfig {
  sizeClass: WindowSizeClass;
  maxWidth: number;
  paddingHorizontal: number;
  isCompact: boolean;
  isMedium: boolean;
  isExpanded: boolean;
  numColumns: number;
}

/**
 * Determina la clase de tamaño de ventana según los estándares de Material 3 / responsive design:
 * - compact: < 600 dp (teléfonos en vertical)
 * - medium: 600 - 839 dp (tablets pequeñas, teléfonos plegables, teléfonos en horizontal)
 * - expanded: >= 840 dp (tablets grandes, pantallas de escritorio)
 */
export function getSizeClass(width: number): WindowSizeClass {
  if (width < 600) {
    return 'compact';
  }
  if (width < 840) {
    return 'medium';
  }
  return 'expanded';
}

/**
 * Devuelve la configuración de diseño para cada clase de tamaño.
 */
export function getSizeClassConfig(width: number): WindowSizeConfig {
  const sizeClass = getSizeClass(width);

  switch (sizeClass) {
    case 'expanded':
      return {
        sizeClass: 'expanded',
        maxWidth: 1040,
        paddingHorizontal: 32,
        isCompact: false,
        isMedium: false,
        isExpanded: true,
        numColumns: 2,
      };
    case 'medium':
      return {
        sizeClass: 'medium',
        maxWidth: 768,
        paddingHorizontal: 24,
        isCompact: false,
        isMedium: true,
        isExpanded: false,
        numColumns: 1,
      };
    case 'compact':
    default:
      return {
        sizeClass: 'compact',
        maxWidth: 600,
        paddingHorizontal: 16,
        isCompact: true,
        isMedium: false,
        isExpanded: false,
        numColumns: 1,
      };
  }
}
