import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  formatDateAccessibilityLabel,
  formatIsoDate,
  formatReadableDate,
  parseIsoDate,
} from '@/components/date-time-picker-model';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface DateFieldProps {
  label: string;
  value: string; // 'YYYY-MM-DD'
  onChange: (dateIso: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function DateField({
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  placeholder = 'Selecciona una fecha',
  style,
  testID,
}: DateFieldProps) {
  const theme = useTheme();
  const [showPicker, setShowPicker] = useState(false);

  const parsedDate = useMemo(() => {
    return parseIsoDate(value) ?? new Date();
  }, [value]);

  const readableText = useMemo(() => {
    if (!value) return '';
    return formatReadableDate(value);
  }, [value]);

  const accessibilityLabel = useMemo(() => {
    return formatDateAccessibilityLabel(label, value || placeholder);
  }, [label, value, placeholder]);

  const handlePress = () => {
    if (!disabled) {
      setShowPicker(true);
    }
  };

  const handleNativeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (event.type === 'set' && selectedDate) {
      onChange(formatIsoDate(selectedDate));
    }
    if (event.type === 'dismissed') {
      setShowPicker(false);
    }
  };

  const hasError = Boolean(error);
  const borderColor = hasError
    ? theme.danger
    : showPicker
      ? theme.primary
      : theme.border;

  return (
    <View testID={testID} style={[styles.container, style]}>
      {/* Etiqueta accesible con indicador de requerido */}
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

      {/* Campo tocable con aspecto de entrada */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={handlePress}
        style={[
          styles.fieldBox,
          {
            backgroundColor: theme.backgroundElement,
            borderColor,
          },
        ]}>
        <View style={styles.iconWrapper}>
          <Icon name="calendar" size={18} color={theme.textSecondary} />
        </View>

        <ThemedText
          style={[
            styles.valueText,
            {
              color: readableText ? theme.text : theme.textSecondary,
            },
          ]}>
          {readableText || placeholder}
        </ThemedText>

        {Platform.OS === 'web' && !disabled && (
          <input
            type="date"
            value={value}
            aria-label={accessibilityLabel}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer',
            }}
          />
        )}
      </Pressable>

      {/* Selector nativo (Android / iOS) */}
      {showPicker && Platform.OS !== 'web' && (
        <DateTimePicker
          value={parsedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={handleNativeChange}
        />
      )}

      {/* Mensaje de error o ayuda */}
      {hasError ? (
        <ThemedText
          accessibilityRole="alert"
          style={[styles.feedbackText, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : helperText ? (
        <ThemedText
          style={[styles.feedbackText, { color: theme.textSecondary }]}>
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
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  iconWrapper: {
    marginRight: 10,
  },
  valueText: {
    fontSize: 15,
    flex: 1,
  },
  feedbackText: {
    fontSize: 12,
    marginTop: 6,
  },
});
