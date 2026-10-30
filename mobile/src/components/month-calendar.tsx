import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon';
import {
  type DayEventSummary,
  formatCellAccessibilityLabel,
  getHighestPriority,
  getPriorityDotColor,
  resolveDayCellStyles,
} from '@/components/month-calendar-model';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import {
  formatDateIso,
  getCalendarGrid,
  MONTH_NAMES,
  WEEKDAY_NAMES_SHORT,
} from '@/features/events/calendar-utils';
import { useTheme } from '@/hooks/use-theme';

export interface MonthCalendarProps {
  year: number;
  month: number;
  selectedDate: string;
  eventsByDate?: Record<string, DayEventSummary[]>;
  onSelectDate: (dateIso: string) => void;
  onChangeMonth: (year: number, month: number) => void;
  onToday?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function MonthCalendar({
  year,
  month,
  selectedDate,
  eventsByDate = {},
  onSelectDate,
  onChangeMonth,
  onToday,
  style,
  testID,
}: MonthCalendarProps) {
  const theme = useTheme();

  const todayIso = useMemo(() => formatDateIso(new Date()), []);
  const gridCells = useMemo(() => getCalendarGrid(year, month), [year, month]);

  const handlePrevMonth = () => {
    if (month === 0) {
      onChangeMonth(year - 1, 11);
    } else {
      onChangeMonth(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      onChangeMonth(year + 1, 0);
    } else {
      onChangeMonth(year, month + 1);
    }
  };

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        style,
      ]}>
      {/* Encabezado del mes con navegación */}
      <View style={styles.header}>
        <View style={styles.monthTitleWrapper}>
          <ThemedText style={[styles.monthTitle, { color: theme.text }]}>
            {MONTH_NAMES[month]} {year}
          </ThemedText>
        </View>

        <View style={styles.navControls}>
          {onToday && (
            <Button
              title="Hoy"
              variant="ghost"
              size="sm"
              onPress={onToday}
              style={styles.todayButton}
            />
          )}
          <IconButton
            name="chevronLeft"
            accessibilityLabel="Mes anterior"
            size={18}
            onPress={handlePrevMonth}
          />
          <IconButton
            name="chevronRight"
            accessibilityLabel="Mes siguiente"
            size={18}
            onPress={handleNextMonth}
          />
        </View>
      </View>

      {/* Fila de días de la semana */}
      <View style={styles.weekdayRow}>
        {WEEKDAY_NAMES_SHORT.map((weekday, i) => (
          <View key={`${weekday}-${i}`} style={styles.weekdayCell}>
            <ThemedText
              maxFontSizeMultiplier={1.3}
              style={[styles.weekdayText, { color: theme.textSecondary }]}>
              {weekday}
            </ThemedText>
          </View>
        ))}
      </View>

      {/* Cuadrícula de días */}
      <View style={styles.grid}>
        {gridCells.map((cell) => {
          const isSelected = cell.dateString === selectedDate;
          const isToday = cell.dateString === todayIso;
          const dayEvents = eventsByDate[cell.dateString] || [];
          const highestPriority = getHighestPriority(dayEvents);
          const dotColor = getPriorityDotColor(highestPriority, theme);

          const cellStyles = resolveDayCellStyles({
            isSelected,
            isToday,
            isCurrentMonth: cell.isCurrentMonth,
            theme,
          });

          const accessibilityLabel = formatCellAccessibilityLabel({
            dateString: cell.dateString,
            day: cell.day,
            isSelected,
            isToday,
            eventsCount: dayEvents.length,
            highestPriority,
          });

          return (
            <Pressable
              key={cell.dateString}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={accessibilityLabel}
              onPress={() => onSelectDate(cell.dateString)}
              style={({ pressed }) => [
                styles.dayCellContainer,
                { transform: [{ scale: pressed ? 0.92 : 1 }] },
              ]}>
              <View
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: cellStyles.backgroundColor,
                    borderColor: cellStyles.borderColor,
                    borderWidth: cellStyles.borderWidth,
                  },
                ]}>
                <ThemedText
                  maxFontSizeMultiplier={1.3}
                  style={[
                    styles.dayText,
                    {
                      color: cellStyles.textColor,
                      fontWeight: cellStyles.fontWeight,
                    },
                  ]}>
                  {cell.day}
                </ThemedText>

                {/* Punto indicador de prioridad */}
                {dotColor && (
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: isSelected
                          ? theme.onPrimary
                          : dotColor,
                      },
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTitleWrapper: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  todayButton: {
    marginRight: 4,
    minHeight: 36,
  },
  weekdayRow: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCellContainer: {
    width: '14.2857%',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  dayCell: {
    minWidth: 36,
    minHeight: 36,
    borderRadius: 18,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 14,
    textAlign: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    position: 'absolute',
    bottom: 4,
  },
});
