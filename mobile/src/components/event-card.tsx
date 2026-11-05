import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Badge } from '@/components/badge';
import { Card } from '@/components/card';
import {
  formatEventAccessibilityLabel,
  getCategoryLabel,
  getPriorityLabel,
} from '@/components/event-card-model';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import type { Event, EventCategory } from '@/features/events/event-types';
import { useTheme } from '@/hooks/use-theme';
import { formatTime12h } from '@/utils/format-time';

export interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

function getCategoryAccentColor(
  category: EventCategory,
  theme: ReturnType<typeof useTheme>
): string {
  switch (category) {
    case 'trabajo':
      return theme.categoryWork;
    case 'estudio':
      return theme.categoryStudy;
    case 'personal':
      return theme.categoryPersonal;
    case 'salud':
      return theme.categoryHealth;
    case 'otro':
    default:
      return theme.categoryOther;
  }
}

export function EventCard({
  event,
  onPress,
  style,
  testID,
}: EventCardProps) {
  const theme = useTheme();
  const accessibilityLabel = formatEventAccessibilityLabel(event);
  const accentColor = getCategoryAccentColor(event.category, theme);

  return (
    <Card
      testID={testID}
      onPress={() => onPress(event)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, style]}>
      <View style={styles.innerRow}>
        {/* Barra lateral luminosa según la categoría */}
        <View
          style={[
            styles.accentBar,
            {
              backgroundColor: accentColor,
            },
          ]}
        />

        <View style={styles.contentColumn}>
          {/* Fila superior: Hora en cápsula Liquid Glass + Badges de categoría y prioridad */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.timePill,
                {
                  backgroundColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(15, 23, 42, 0.05)',
                  borderColor: theme.isDark
                    ? 'rgba(255, 255, 255, 0.14)'
                    : 'rgba(15, 23, 42, 0.08)',
                },
              ]}>
              <Icon name="clock" size={14} color={theme.primary} />
              <ThemedText style={[styles.timeText, { color: theme.text }]}>
                {formatTime12h(event.time)}
              </ThemedText>
            </View>

            <View style={styles.badgesWrapper}>
              <Badge
                label={getCategoryLabel(event.category)}
                tone={event.category}
                size="sm"
              />
              <Badge
                label={getPriorityLabel(event.priority)}
                tone={event.priority}
                size="sm"
              />
            </View>
          </View>

          {/* Título del evento */}
          <ThemedText
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[styles.title, { color: theme.text }]}>
            {event.title}
          </ThemedText>

          {/* Descripción truncada a 2 líneas */}
          {Boolean(event.description) && (
            <ThemedText
              numberOfLines={2}
              style={[styles.description, { color: theme.textSecondary }]}>
              {event.description}
            </ThemedText>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  accentBar: {
    width: 4,
    borderRadius: Radius.full,
    marginVertical: 2,
  },
  contentColumn: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
