import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  type CardElevation,
  type CardPadding,
  resolveCardStyles,
} from '@/components/card-model';
import { useTheme } from '@/hooks/use-theme';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  elevation?: CardElevation;
  padding?: CardPadding;
  bordered?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

export function Card({
  children,
  onPress,
  elevation = 'sm',
  padding = 'md',
  bordered = true,
  accessibilityLabel,
  accessibilityHint,
  testID,
  style,
}: CardProps) {
  const theme = useTheme();

  const getGlassOverlay = (pressed: boolean) => ({
    backgroundColor: pressed
      ? theme.isDark
        ? 'rgba(30, 41, 59, 0.85)'
        : 'rgba(241, 245, 249, 0.92)'
      : theme.isDark
        ? 'rgba(17, 24, 39, 0.72)'
        : 'rgba(255, 255, 255, 0.78)',
    borderColor: pressed
      ? theme.primary
      : theme.isDark
        ? 'rgba(255, 255, 255, 0.14)'
        : 'rgba(15, 23, 42, 0.08)',
  });

  if (onPress) {
    return (
      <Pressable
        testID={testID}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={({ pressed }) => {
          const config = resolveCardStyles({
            theme,
            elevation,
            padding,
            bordered,
            pressed,
          });
          const glass = getGlassOverlay(pressed);

          return [
            styles.base,
            {
              padding: config.padding,
              borderRadius: config.borderRadius,
              backgroundColor: glass.backgroundColor,
              borderColor: bordered ? glass.borderColor : 'transparent',
              borderWidth: config.borderWidth,
              transform: [{ scale: pressed ? 0.982 : 1 }],
              ...config.shadow,
            },
            style,
          ];
        }}>
        {children}
      </Pressable>
    );
  }

  const config = resolveCardStyles({
    theme,
    elevation,
    padding,
    bordered,
    pressed: false,
  });
  const glass = getGlassOverlay(false);

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {
          padding: config.padding,
          borderRadius: config.borderRadius,
          backgroundColor: glass.backgroundColor,
          borderColor: bordered ? glass.borderColor : 'transparent',
          borderWidth: config.borderWidth,
          ...config.shadow,
        },
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(18px) saturate(180%)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%)',
        boxShadow:
          'inset 0 1px 1px rgba(255, 255, 255, 0.22), 0 6px 20px rgba(0, 0, 0, 0.06)',
        transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease',
      } as any,
      default: {},
    }),
  },
});
