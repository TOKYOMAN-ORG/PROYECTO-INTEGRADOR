import { type ColorTheme, Radius } from '../constants/theme.ts';

export interface TextFieldBorderConfig {
  borderColor: string;
  borderWidth: number;
  backgroundColor: string;
  borderRadius: number;
}

export function getTextFieldBorderConfig(
  theme: ColorTheme,
  hasError: boolean,
  isFocused: boolean
): TextFieldBorderConfig {
  if (hasError) {
    return {
      borderColor: theme.danger,
      borderWidth: 1.5,
      backgroundColor: theme.backgroundElement,
      borderRadius: Radius.md,
    };
  }

  if (isFocused) {
    return {
      borderColor: theme.primary,
      borderWidth: 1.5,
      backgroundColor: theme.backgroundElement,
      borderRadius: Radius.md,
    };
  }

  return {
    borderColor: theme.border,
    borderWidth: 1,
    backgroundColor: theme.backgroundElement,
    borderRadius: Radius.md,
  };
}
