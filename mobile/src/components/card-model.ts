import { Elevation, Radius, type ColorTheme } from '../constants/theme.ts';

export type CardElevation = 'none' | 'sm' | 'md' | 'lg';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardStyleConfig {
  padding: number;
  borderRadius: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  shadow: (typeof Elevation)[keyof typeof Elevation];
}

export function getCardPaddingValue(padding: CardPadding = 'md'): number {
  switch (padding) {
    case 'none':
      return 0;
    case 'sm':
      return 8;
    case 'lg':
      return 24;
    case 'md':
    default:
      return 16;
  }
}

export function resolveCardStyles(params: {
  theme: ColorTheme;
  elevation?: CardElevation;
  padding?: CardPadding;
  bordered?: boolean;
  pressed?: boolean;
}): CardStyleConfig {
  const { theme, elevation = 'sm', padding = 'md', bordered = true, pressed = false } = params;

  const backgroundColor = pressed ? theme.backgroundElement : theme.surface;
  const borderColor = pressed ? theme.borderStrong : theme.border;
  const borderWidth = bordered ? 1 : 0;
  const shadow = pressed ? Elevation.none : Elevation[elevation];

  return {
    padding: getCardPaddingValue(padding),
    borderRadius: Radius.lg,
    backgroundColor,
    borderColor,
    borderWidth,
    shadow,
  };
}
