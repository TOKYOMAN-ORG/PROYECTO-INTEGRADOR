import { Radius, type ColorTheme } from '../constants/theme.ts';
import { type BadgeTone, resolveBadgeColors } from './badge-model.ts';
import type { AppIconName } from './icon-model.ts';

export interface OptionItem<T extends string | number> {
  value: T;
  label: string;
  tone?: BadgeTone;
  hint?: string;
  icon?: AppIconName;
}

export interface OptionItemStyleConfig {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  textColor: string;
  indicatorColor: string | null;
  borderRadius: number;
  minHeight: number;
  minWidth: number;
}

export function resolveOptionItemStyle(params: {
  isSelected: boolean;
  theme: ColorTheme;
  tone?: BadgeTone;
  disabled?: boolean;
}): OptionItemStyleConfig {
  const { isSelected, theme, tone, disabled } = params;

  if (disabled) {
    return {
      backgroundColor: theme.backgroundElement,
      borderColor: theme.border,
      borderWidth: 1,
      textColor: theme.textSecondary,
      indicatorColor: null,
      borderRadius: Radius.full,
      minHeight: 44,
      minWidth: 44,
    };
  }

  if (tone) {
    const toneColors = resolveBadgeColors(tone, theme);

    if (isSelected) {
      return {
        backgroundColor: toneColors.backgroundColor,
        borderColor: toneColors.borderColor,
        borderWidth: 2,
        textColor: toneColors.textColor,
        indicatorColor: toneColors.borderColor,
        borderRadius: Radius.full,
        minHeight: 44,
        minWidth: 44,
      };
    }

    return {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: 1,
      textColor: theme.text,
      indicatorColor: toneColors.borderColor,
      borderRadius: Radius.full,
      minHeight: 44,
      minWidth: 44,
    };
  }

  // Sin tono específico (genérico)
  if (isSelected) {
    return {
      backgroundColor: theme.primaryMuted,
      borderColor: theme.primary,
      borderWidth: 2,
      textColor: theme.onPrimaryMuted,
      indicatorColor: theme.primary,
      borderRadius: Radius.full,
      minHeight: 44,
      minWidth: 44,
    };
  }

  return {
    backgroundColor: theme.surface,
    borderColor: theme.border,
    borderWidth: 1,
    textColor: theme.text,
    indicatorColor: null,
    borderRadius: Radius.full,
    minHeight: 44,
    minWidth: 44,
  };
}

export function formatOptionAccessibilityLabel(label: string, isSelected: boolean, hint?: string): string {
  const status = isSelected ? 'seleccionado' : 'no seleccionado';
  if (hint) {
    return `${label}, ${status}. ${hint}`;
  }
  return `${label}, ${status}`;
}
