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
import type { Event } from '@/features/events/event-types';
import { useTheme } from '@/hooks/use-theme';

export interface EventCardProps {
  event: Event;
  onPress: (event: Event) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function EventCard({
  event,
  onPress,
  style,
  testID,
}: EventCardProps) {
  const theme = useTheme();
  const accessibilityLabel = formatEventAccessibilityLabel(event);

  return (
    <Card
      testID={testID}
      onPress={() => onPress(event)}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, style]}>
      {/* Fila superior: Hora + Badges de categoría y prioridad */}
      <View style={styles.headerRow}>
        <View style={styles.timeWrapper}>
          <Icon name="clock" size={16} color={theme.textSecondary} />
          <ThemedText style={[styles.timeText, { color: theme.textSecondary }]}>
            {event.time}
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
      <ThemedText style={[styles.title, { color: theme.text }]}>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
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
