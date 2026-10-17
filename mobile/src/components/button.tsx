import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

// Fondo fijo con texto blanco (contraste ≈ 5:1) para que se lea igual en tema claro y oscuro.
const BUTTON_COLOR = '#1A6FD0';

export type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  /** Muestra un indicador de carga y deshabilita el botón, evitando el doble envío. */
  loading?: boolean;
};

export function Button({ title, loading = false, disabled, style, ...rest }: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      style={(state) => [
        styles.button,
        { backgroundColor: BUTTON_COLOR, opacity: inactive ? 0.6 : state.pressed ? 0.85 : 1 },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <ThemedText type="default" style={styles.title}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontWeight: 600,
  },
});
