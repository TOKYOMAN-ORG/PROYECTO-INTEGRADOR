import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputFocusEventData,
  type TextInputProps,
} from 'react-native';

import { getTextFieldBorderConfig } from '@/components/text-field-model';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  /** Mensaje de error bajo el campo; resalta el borde en color danger. */
  error?: string;
  /** Texto de ayuda informativo cuando no existe error. */
  helperText?: string;
  /** Indica si el campo es obligatorio, añadiendo un indicador visual y de accesibilidad. */
  required?: boolean;
};

/** Input accesible con etiqueta, estado de foco guiado, mensaje de ayuda/error y multilínea. */
export function TextField({
  label,
  error,
  helperText,
  required = false,
  secureTextEntry,
  multiline = false,
  numberOfLines,
  style,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const hidden = secureTextEntry && !revealed;

  const borderConfig = getTextFieldBorderConfig(theme, !!error, focused);

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  const minHeight = multiline ? (numberOfLines ? numberOfLines * 24 + 24 : 96) : 48;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {required && (
          <ThemedText
            type="smallBold"
            themeColor="danger"
            accessibilityLabel="campo obligatorio">
            {' *'}
          </ThemedText>
        )}
      </View>
      <View
        style={[
          styles.inputRow,
          {
            backgroundColor: borderConfig.backgroundColor,
            borderColor: borderConfig.borderColor,
            borderWidth: borderConfig.borderWidth,
            borderRadius: borderConfig.borderRadius,
            minHeight,
            alignItems: multiline ? 'flex-start' : 'center',
          },
        ]}>
        <TextInput
          accessibilityLabel={`${label}${required ? ', campo obligatorio' : ''}`}
          accessibilityHint={error ?? helperText}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={hidden}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.input,
            {
              color: theme.text,
              minHeight,
              paddingTop: multiline ? Spacing.two : undefined,
              paddingBottom: multiline ? Spacing.two : undefined,
            },
            style,
          ]}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            hitSlop={8}
            onPress={() => setRevealed((value) => !value)}
            style={styles.toggle}>
            <ThemedText type="smallBold" themeColor="primary">
              {revealed ? 'Ocultar' : 'Mostrar'}
            </ThemedText>
          </Pressable>
        )}
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText type="small" themeColor="textSecondary">
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  toggle: {
    paddingLeft: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
  },
});
