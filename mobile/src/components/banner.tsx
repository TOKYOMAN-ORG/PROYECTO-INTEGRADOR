import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { type BannerTone, resolveBannerConfig } from '@/components/banner-model';
import { Button } from '@/components/button';
import { Icon, IconButton } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export interface BannerProps {
  tone?: BannerTone;
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Banner({
  tone = 'info',
  title,
  message,
  actionLabel,
  onAction,
  onClose,
  style,
  testID,
}: BannerProps) {
  const theme = useTheme();
  const config = resolveBannerConfig(tone, theme);

  return (
    <View
      testID={testID}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
          borderRadius: config.borderRadius,
        },
        style,
      ]}>
      <View style={styles.contentRow}>
        <View style={styles.iconWrapper}>
          <Icon name={config.iconName} size={20} color={config.iconColor} />
        </View>

        <View style={styles.textContainer}>
          {title && (
            <ThemedText
              style={[
                styles.title,
                {
                  color: config.textColor,
                },
              ]}>
              {title}
            </ThemedText>
          )}
          <ThemedText
            style={[
              styles.message,
              {
                color: config.textColor,
              },
            ]}>
            {message}
          </ThemedText>

          {actionLabel && onAction && (
            <View style={styles.actionRow}>
              <Button
                title={actionLabel}
                variant="outline"
                size="sm"
                onPress={onAction}
                style={[styles.actionButton, { borderColor: config.borderColor }]}
              />
            </View>
          )}
        </View>

        {onClose && (
          <IconButton
            name="close"
            accessibilityLabel="Cerrar aviso"
            size={18}
            color={config.textColor}
            onPress={onClose}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    marginRight: 10,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
    minHeight: 36,
  },
});
