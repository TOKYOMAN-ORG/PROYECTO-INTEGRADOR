import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TextFieldProps = TextInputProps & {
  label: string;
  /** Mensaje bajo el campo; también marca el borde en rojo. */
  error?: string;
};

/** Input con etiqueta y mensaje de error. Con `secureTextEntry` oculta el texto y añade el control de mostrar/ocultar. */
export function TextField({ label, error, secureTextEntry, style, ...rest }: TextFieldProps) {
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const hidden = secureTextEntry && !revealed;

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.inputRow,
          { backgroundColor: theme.backgroundElement, borderColor: error ? theme.error : theme.backgroundSelected },
        ]}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={theme.textSecondary}
          secureTextEntry={hidden}
          style={[styles.input, { color: theme.text }, style]}
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
        <ThemedText type="small" themeColor="error" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
  },
  toggle: {
    paddingLeft: Spacing.two,
    justifyContent: 'center',
    minHeight: 48,
  },
});
