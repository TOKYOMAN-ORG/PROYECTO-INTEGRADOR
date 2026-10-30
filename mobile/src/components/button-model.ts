import { type ColorTheme, Radius, Spacing } from '../constants/theme.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonStyleConfig {
  backgroundColor: string;
  borderColor?: string;
  borderWidth?: number;
  textColor: string;
  minHeight: number;
  paddingHorizontal: number;
  borderRadius: number;
  hitSlop?: { top: number; bottom: number; left: number; right: number };
}

export function getButtonConfig(
  theme: ColorTheme,
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md'
): ButtonStyleConfig {
  const isSm = size === 'sm';
  const minHeight = isSm ? 36 : 48;
  const paddingHorizontal = isSm ? Spacing.two + Spacing.one : Spacing.three; // 12 or 16
  const borderRadius = isSm ? Radius.sm : Radius.md; // 6 or 10

  // Si mide 36 px de alto, agregamos hitSlop de 6 px arriba y abajo para alcanzar 48 >= 44 dp mínimos táctiles
  const hitSlop = isSm ? { top: 6, bottom: 6, left: 6, right: 6 } : undefined;

  switch (variant) {
    case 'secondary':
      return {
        backgroundColor: theme.backgroundElement,
        textColor: theme.text,
        minHeight,
        paddingHorizontal,
        borderRadius,
        hitSlop,
      };
    case 'outline':
      return {
        backgroundColor: 'transparent',
        borderColor: theme.borderStrong,
        borderWidth: 1.5,
        textColor: theme.text,
        minHeight,
        paddingHorizontal,
        borderRadius,
        hitSlop,
      };
    case 'destructive':
      return {
        backgroundColor: theme.danger,
        textColor: theme.onDanger,
        minHeight,
        paddingHorizontal,
        borderRadius,
        hitSlop,
      };
    case 'ghost':
      return {
        backgroundColor: 'transparent',
        textColor: theme.primary,
        minHeight,
        paddingHorizontal,
        borderRadius,
        hitSlop,
      };
    case 'primary':
    default:
      return {
        backgroundColor: theme.primary,
        textColor: theme.onPrimary,
        minHeight,
        paddingHorizontal,
        borderRadius,
        hitSlop,
      };
  }
}
