import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SymbolView, type SFSymbol } from 'expo-symbols';

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

  // En iOS y Android nativo, SymbolView de expo-symbols renderiza SF Symbols o Material Symbols
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return (
      <View
        accessible={!isDecorative}
        accessibilityElementsHidden={isDecorative}
        importantForAccessibility={isDecorative ? 'no' : 'yes'}
        aria-hidden={isDecorative}
        accessibilityRole={isDecorative ? undefined : 'image'}
        accessibilityLabel={accessibilityLabel}>
        <SymbolView
          name={def.ios as SFSymbol}
          size={size}
          tintColor={resolvedColor}
          style={style}
        />
      </View>
    );
  }

  // Fallback para Web / entorno de prueba
  return (
    <View
      accessible={!isDecorative}
      accessibilityElementsHidden={isDecorative}
      importantForAccessibility={isDecorative ? 'no' : 'yes'}
      aria-hidden={isDecorative}
      accessibilityRole={isDecorative ? undefined : 'image'}
      accessibilityLabel={accessibilityLabel}
      style={[styles.fallbackContainer, { width: size, height: size }, style]}>
      <Text
        style={{ fontSize: size * 0.85, color: resolvedColor, textAlign: 'center' }}>
        {def.webFallback}
      </Text>
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
