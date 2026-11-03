import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  type GestureResponderEvent,
} from 'react-native';

import { Icon } from '@/components/icon';
import { useThemePreference } from '@/features/theme/theme-context';
import { getPressOrigin } from '@/features/theme/theme-reveal';
import { useTheme } from '@/hooks/use-theme';
import { triggerLightHaptic } from '@/utils/haptics';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface ThemeToggleButtonProps {
  size?: number;
}

/**
 * Botón Liquid Glass para alternar entre modo claro y oscuro con animación
 * elástica de rotación, pulso de escala y onda expansiva desde el origen del toque.
 */
export function ThemeToggleButton({ size = 20 }: ThemeToggleButtonProps) {
  const theme = useTheme();
  const { toggle } = useThemePreference();

  const [spinAnim] = useState(() => new Animated.Value(0));
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    spinAnim.setValue(0);
    pulseAnim.setValue(0.72);

    Animated.parallel([
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.back(1.6)),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 4,
        tension: 120,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [theme.isDark, spinAnim, pulseAnim]);

  const rotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-120deg', '0deg'],
  });

  const handlePress = (event: GestureResponderEvent) => {
    triggerLightHaptic();
    toggle(getPressOrigin(event));
  };

  const iconColor = theme.isDark ? '#FBBF24' : '#1A6FD0';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        theme.isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'
      }
      hitSlop={8}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.glassButton,
        {
          backgroundColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.08)'
            : 'rgba(255, 255, 255, 0.72)',
          borderColor: theme.isDark
            ? 'rgba(255, 255, 255, 0.22)'
            : 'rgba(15, 23, 42, 0.1)',
          transform: [{ scale: pressed ? 0.88 : 1 }],
        },
      ]}>
      <Animated.View
        style={{
          transform: [{ rotate: rotation }, { scale: pulseAnim }],
        }}>
        <Icon
          name={theme.isDark ? 'sun' : 'moon'}
          size={size}
          color={iconColor}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glassButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.35), 0 4px 12px rgba(0, 0, 0, 0.08)',
      } as any,
      default: {},
    }),
  },
});
