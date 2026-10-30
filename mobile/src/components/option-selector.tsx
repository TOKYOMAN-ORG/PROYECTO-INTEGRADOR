import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import {
  type OptionItem,
  formatOptionAccessibilityLabel,
  resolveOptionItemStyle,
} from '@/components/option-selector-model';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type { OptionItem };

export interface OptionSelectorProps<T extends string | number> {
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  options: OptionItem<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function OptionSelector<T extends string | number>({
  label,
  helperText,
  error,
  required = false,
  options,
  value,
  onChange,
  disabled = false,
  style,
  testID,
}: OptionSelectorProps<T>) {
  const theme = useTheme();

  return (
    <View testID={testID} style={[styles.container, style]}>
      {label && (
        <View style={styles.labelRow}>
          <ThemedText style={[styles.label, { color: theme.text }]}>
            {label}
            {required && (
              <ThemedText
                accessibilityLabel="campo requerido"
                style={{ color: theme.danger }}>
                {' *'}
              </ThemedText>
            )}
          </ThemedText>
        </View>
      )}

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={styles.optionsWrap}>
        {options.map((option) => {
          const isSelected = option.value === value;
          const config = resolveOptionItemStyle({
            isSelected,
            theme,
            tone: option.tone,
            disabled,
          });
          const accessibilityLabel = formatOptionAccessibilityLabel(
            option.label,
            isSelected,
            option.hint
          );

          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, disabled }}
              accessibilityLabel={accessibilityLabel}
              accessibilityHint={option.hint}
              disabled={disabled}
              onPress={() => !disabled && onChange(option.value)}
              style={({ pressed }) => [
                styles.optionItem,
                {
                  backgroundColor: config.backgroundColor,
                  borderColor: config.borderColor,
                  borderWidth: config.borderWidth,
                  borderRadius: config.borderRadius,
                  minHeight: config.minHeight,
                  minWidth: config.minWidth,
                  transform: [{ scale: pressed && !disabled ? 0.94 : 1 }],
                },
              ]}>
              {config.indicatorColor && (
                <View
                  style={[
                    styles.indicatorDot,
                    {
                      backgroundColor: config.indicatorColor,
                    },
                  ]}
                />
              )}
              <ThemedText
                style={[
                  styles.optionText,
                  {
                    color: config.textColor,
                    fontWeight: isSelected ? '700' : '500',
                  },
                ]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <ThemedText
          accessibilityRole="alert"
          style={[styles.feedbackText, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText style={[styles.feedbackText, { color: theme.textSecondary }]}>
          {helperText}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
  },
  feedbackText: {
    fontSize: 12,
    marginTop: 6,
  },
});
