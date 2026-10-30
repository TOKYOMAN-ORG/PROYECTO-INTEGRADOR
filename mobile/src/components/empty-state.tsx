import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import type { AppIconName } from '@/components/icon-model';
import { ThemedText } from '@/components/themed-text';
import { Elevation } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerLightHaptic } from '@/utils/haptics';

export interface EmptyStateProps {
  icon?: AppIconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Acción directa con botón circular e icono (ej. '+' para crear evento) */
  quickActionIcon?: AppIconName;
  quickActionLabel?: string;
  onQuickAction?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EmptyState({
  icon = 'empty',
  title,
  message,
  actionLabel,
  onAction,
  quickActionIcon = 'add',
  quickActionLabel,
  onQuickAction,
  style,
  testID,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessible={true}
      accessibilityRole="summary"
      style={[styles.container, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
          },
        ]}>
        <Icon name={icon} size={36} color={theme.textSecondary} />
      </View>

      <ThemedText style={[styles.title, { color: theme.text }]}>
        {title}
      </ThemedText>

      {message && (
        <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      )}

      {/* Acción directa: Botón circular con icono (ej. '+' crear evento) */}
      {onQuickAction && (
        <View style={styles.quickActionWrapper}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={quickActionLabel ?? 'Crear evento'}
            onPress={() => {
              triggerLightHaptic();
              onQuickAction();
            }}
            style={({ pressed }) => [
              styles.quickActionCircle,
              {
                backgroundColor: theme.primary,
                transform: [{ scale: pressed ? 0.92 : 1 }],
              },
            ]}>
            <Icon name={quickActionIcon} size={26} color={theme.onPrimary} />
          </Pressable>
          {quickActionLabel && (
            <ThemedText
              type="smallBold"
              style={[styles.quickActionText, { color: theme.primary }]}>
              {quickActionLabel}
            </ThemedText>
          )}
        </View>
      )}

      {/* Acción secundaria (ej. "Ver todos los eventos del mes") */}
      {actionLabel && onAction && (
        <View style={styles.actionWrapper}>
          <Button
            title={actionLabel}
            variant={onQuickAction ? 'ghost' : 'primary'}
            size="md"
            onPress={onAction}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  quickActionWrapper: {
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  quickActionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...Elevation.md,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionWrapper: {
    marginTop: 14,
  },
});
