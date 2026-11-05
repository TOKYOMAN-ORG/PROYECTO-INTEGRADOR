import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

import {
  getIconDefinition,
  type AppIconName,
} from '@/components/icon-model';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface IconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function Icon({
  name,
  size = 20,
  color,
  accessibilityLabel,
  style,
}: IconProps) {
  const theme = useTheme();
  const def = getIconDefinition(name);
  const resolvedColor = color ?? theme.text;

  const isDecorative = !accessibilityLabel;

  return (
    <View
      accessible={!isDecorative}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? 'no' : 'yes'}
      aria-hidden={isDecorative}
      accessibilityRole={isDecorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      style={[styles.fallbackContainer, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        {def.paths.map((d, index) => (
          <Path
            key={index}
            d={d}
            stroke={resolvedColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    </View>
  );
}

export interface IconButtonProps extends Omit<PressableProps, 'style'> {
  name: AppIconName;
  accessibilityLabel: string;
  size?: number;
  color?: string;
  variant?: 'ghost' | 'secondary' | 'outline' | 'danger';
  style?: StyleProp<ViewStyle>;
}

export function IconButton({
  name,
  accessibilityLabel,
  size = 20,
  color,
  variant = 'ghost',
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();
  const resolvedColor =
    color ??
    (variant === 'danger'
      ? theme.danger
      : variant === 'ghost'
        ? theme.textSecondary
        : theme.text);

  const backgroundColor =
    variant === 'secondary'
      ? theme.backgroundElement
      : 'transparent';

  const borderColor = variant === 'outline' ? theme.border : undefined;
  const borderWidth = variant === 'outline' ? 1 : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      style={({ pressed }) => [
        styles.iconButton,
        {
          backgroundColor,
          borderColor,
          borderWidth,
          opacity: disabled ? 0.4 : pressed ? 0.7 : 1,
          transform: [{ scale: disabled ? 1 : pressed ? 0.9 : 1 }],
        },
        style,
      ]}
      {...rest}>
      <Icon name={name} size={size} color={resolvedColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
