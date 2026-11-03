import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel?: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function ErrorState({
  title = 'Ocurrió un error',
  message,
  retryLabel = 'Reintentar',
  onRetry,
  style,
  testID,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[styles.container, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.dangerMuted,
            borderColor: theme.danger,
          },
        ]}>
        <Icon name="error" size={36} color={theme.danger} />
      </View>

      <ThemedText style={[styles.title, { color: theme.text }]}>
        {title}
      </ThemedText>

      <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
        {message}
      </ThemedText>

      {onRetry && (
        <View style={styles.actionWrapper}>
          <Button
            title={retryLabel}
            variant="primary"
            size="md"
            icon="refresh"
            onPress={onRetry}
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
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  actionWrapper: {
    marginTop: 20,
  },
});
