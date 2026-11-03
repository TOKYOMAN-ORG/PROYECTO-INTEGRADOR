import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function LoadingState({
  message = 'Cargando...',
  size = 'large',
  style,
  testID,
}: LoadingStateProps) {
  const theme = useTheme();

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLiveRegion="polite"
      accessibilityLabel={message}
      style={[styles.container, style]}>
      <ActivityIndicator size={size} color={theme.primary} />
      {message ? (
        <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  message: {
    fontSize: 14,
    marginTop: 12,
    textAlign: 'center',
  },
});
