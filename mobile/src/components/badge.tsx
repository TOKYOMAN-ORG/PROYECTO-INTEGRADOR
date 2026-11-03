import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import {
  type BadgeSize,
  type BadgeTone,
  getAccessibleBadgeLabel,
  resolveBadgeColors,
  resolveBadgeSize,
} from '@/components/badge-model';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  accessibleLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

export function Badge({
  label,
  tone = 'neutral',
  size = 'md',
  accessibleLabel,
  style,
  textStyle,
  testID,
}: BadgeProps) {
  const theme = useTheme();
  const colors = resolveBadgeColors(tone, theme);
  const dimensions = resolveBadgeSize(size);
  const accessibilityText = getAccessibleBadgeLabel(tone, label, accessibleLabel);

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={accessibilityText}
      style={[
        styles.container,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          paddingHorizontal: dimensions.paddingHorizontal,
          paddingVertical: dimensions.paddingVertical,
          borderRadius: dimensions.borderRadius,
          minHeight: dimensions.minHeight,
        },
        style,
      ]}>
      <ThemedText
        numberOfLines={1}
        style={[
          styles.text,
          {
            color: colors.textColor,
            fontSize: dimensions.fontSize,
            lineHeight: dimensions.lineHeight,
          },
          textStyle,
        ]}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  text: {
    fontWeight: '600',
  },
});
