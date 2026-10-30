import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  getButtonConfig,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/button-model';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title?: string;
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled,
  style,
  hitSlop: customHitSlop,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const config = getButtonConfig(theme, variant, size);
  const inactive = disabled || loading;

  const resolvedHitSlop = customHitSlop ?? config.hitSlop;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: loading }}
      disabled={inactive}
      hitSlop={resolvedHitSlop}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          borderWidth: config.borderWidth,
          minHeight: config.minHeight,
          paddingHorizontal: config.paddingHorizontal,
          borderRadius: config.borderRadius,
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={config.textColor} size={size === 'sm' ? 'small' : 'small'} />
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          {title ? (
            <ThemedText
              type={size === 'sm' ? 'smallBold' : 'default'}
              style={[styles.text, { color: config.textColor }]}>
              {title}
            </ThemedText>
          ) : (
            children
          )}
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.two,
  },
  iconRight: {
    marginLeft: Spacing.two,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
