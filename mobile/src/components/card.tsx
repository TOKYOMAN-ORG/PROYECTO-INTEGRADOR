import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

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

          return [
            styles.base,
            {
              padding: config.padding,
              borderRadius: config.borderRadius,
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
              borderWidth: config.borderWidth,
              transform: [{ scale: pressed ? 0.985 : 1 }],
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

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.base,
        {
          padding: config.padding,
          borderRadius: config.borderRadius,
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
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
  },
});
