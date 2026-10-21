import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';
import {
  formatDateIso,
  formatDisplayDate,
  getCalendarGrid,
  getEventsForDate,
  getMonthDateRange,
  MONTH_NAMES,
  WEEKDAY_NAMES_SHORT,
} from '@/features/events/calendar-utils';
import type { Event, EventPriority } from '@/features/events/event-types';
import { getEvents } from '@/features/events/events-api';
import { getToken } from '@/storage/secure-token-storage';

function confirmSignOut(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm('¿Cerrar sesión?'));
  }
  return new Promise((resolve) => {
    Alert.alert(
      'Cerrar sesión',
      '¿Quieres cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => resolve(true) },
      ],
      { onDismiss: () => resolve(false) },
    );
  });
}

function getPriorityBadgeStyle(priority: EventPriority) {
  switch (priority) {
    case 'alta':
      return { bg: '#FFEBEE', text: '#C62828', label: 'Alta' };
    case 'media':
      return { bg: '#FFF3E0', text: '#EF6C00', label: 'Media' };
    case 'baja':
      return { bg: '#E8F5E9', text: '#2E7D32', label: 'Baja' };
    default:
      return { bg: '#ECEFF1', text: '#455A64', label: priority };
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { created, eventTitle } = useLocalSearchParams<{
    created?: string;
    eventTitle?: string;
  }>();
  const { signOut } = useAuth();
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];

  const [signingOut, setSigningOut] = useState(false);
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatDateIso(today), [today]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      const token = await getToken();
      if (!active) return;
      if (!token) {
        setFetchError('No se encontró sesión activa.');
        setLoading(false);
        return;
      }
      try {
        const { from, to } = getMonthDateRange(currentYear, currentMonth);
        const data = await getEvents(token, from, to);
        if (!active) return;
        setEvents(data);
        setFetchError(null);
      } catch {
        if (!active) return;
        setFetchError(
          'No se pudieron cargar los eventos. Revisa tu conexión e inténtalo de nuevo.',
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [currentYear, currentMonth, created, reloadToken]);

  const calendarGrid = useMemo(
    () => getCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  const eventsByDateMap = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of events) {
      const list = map.get(ev.date) ?? [];
      list.push(ev);
      map.set(ev.date, list);
    }
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate],
  );

  function handlePrevMonth() {
    setLoading(true);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function handleNextMonth() {
    setLoading(true);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function handleGoToToday() {
    if (
      currentYear !== today.getFullYear() ||
      currentMonth !== today.getMonth()
    ) {
      setLoading(true);
      setCurrentYear(today.getFullYear());
      setCurrentMonth(today.getMonth());
    }
    setSelectedDate(todayIso);
  }

  function handleSelectDay(cell: { dateString: string; isCurrentMonth: boolean }) {
    setSelectedDate(cell.dateString);
    if (!cell.isCurrentMonth) {
      const parts = cell.dateString.split('-');
      setLoading(true);
      setCurrentYear(parseInt(parts[0], 10));
      setCurrentMonth(parseInt(parts[1], 10) - 1);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    if (!(await confirmSignOut())) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header de la Aplicación */}
          <View style={styles.appHeader}>
            <View>
              <ThemedText type="title">SecurePlan</ThemedText>
              <ThemedText style={styles.subtitle}>
                Tu agenda de productividad segura
              </ThemedText>
            </View>
            <View style={styles.headerActions}>
              <Button
                title="+ Crear evento"
                onPress={() => router.push('/(app)/events/new' as any)}
              />
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.signOutButton,
                  {
                    borderColor: palette.backgroundSelected,
                    opacity: signingOut ? 0.6 : pressed ? 0.8 : 1,
                  },
                ]}
                onPress={handleSignOut}
                disabled={signingOut}>
                <ThemedText type="small">
                  {signingOut ? 'Saliendo…' : 'Cerrar sesión'}
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Mensaje de confirmación de creación */}
          {created === '1' && (
            <View style={styles.confirmationBox}>
              <ThemedText style={styles.confirmationText}>
                ✓ Evento {eventTitle ? `«${eventTitle}»` : ''} creado exitosamente
              </ThemedText>
            </View>
          )}

          {/* Banner de error con reintento */}
          {fetchError && (
            <View
              style={[
                styles.errorCard,
                { backgroundColor: palette.error + '1A', borderColor: palette.error },
              ]}>
              <ThemedText style={{ color: palette.error }}>{fetchError}</ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setLoading(true);
                  setReloadToken((t) => t + 1);
                }}
                style={styles.retryButton}>
                <ThemedText style={styles.retryText}>Reintentar</ThemedText>
              </Pressable>
            </View>
          )}

          {/* Componente Calendario */}
          <View
            style={[
              styles.calendarCard,
              {
                backgroundColor:
                  colorScheme === 'dark' ? palette.backgroundElement : '#FAFAFC',
                borderColor: palette.backgroundSelected,
              },
            ]}>
            {/* Cabecera del Mes y Navegación */}
            <View style={styles.monthHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mes anterior"
                onPress={handlePrevMonth}
                style={styles.navButton}>
                <ThemedText style={styles.navButtonText}>‹</ThemedText>
              </Pressable>

              <View style={styles.monthTitleWrapper}>
                <ThemedText type="subtitle" style={styles.monthTitle}>
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleGoToToday}
                  style={[
                    styles.todayButton,
                    { borderColor: palette.primary },
                  ]}>
                  <ThemedText style={[styles.todayButtonText, { color: palette.primary }]}>
                    Hoy
                  </ThemedText>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Mes siguiente"
                onPress={handleNextMonth}
                style={styles.navButton}>
                <ThemedText style={styles.navButtonText}>›</ThemedText>
              </Pressable>
            </View>

            {/* Días de la semana */}
            <View style={styles.weekdayRow}>
              {WEEKDAY_NAMES_SHORT.map((name) => (
                <View key={name} style={styles.weekdayCell}>
                  <ThemedText style={styles.weekdayText}>{name}</ThemedText>
                </View>
              ))}
            </View>

            {/* Cuadrícula de días */}
            <View style={styles.gridContainer}>
              {calendarGrid.map((cell) => {
                const isSelected = cell.dateString === selectedDate;
                const isToday = cell.dateString === todayIso;
                const hasEvents = (eventsByDateMap.get(cell.dateString)?.length ?? 0) > 0;

                return (
                  <Pressable
                    key={cell.dateString}
                    onPress={() => handleSelectDay(cell)}
                    accessibilityRole="button"
                    accessibilityLabel={`Día ${cell.day} de ${MONTH_NAMES[currentMonth]}`}
                    style={[
                      styles.dayCell,
                      isSelected && {
                        backgroundColor: palette.primary,
                        borderRadius: 12,
                      },
                      !isSelected && isToday && {
                        borderWidth: 1,
                        borderColor: palette.primary,
                        borderRadius: 12,
                      },
                    ]}>
                    <ThemedText
                      style={[
                        styles.dayNumber,
                        !cell.isCurrentMonth && {
                          color: palette.textSecondary,
                          opacity: 0.4,
                        },
                        isSelected && {
                          color: '#ffffff',
                          fontWeight: '700',
                        },
                        !isSelected && isToday && {
                          color: palette.primary,
                          fontWeight: '700',
                        },
                      ]}>
                      {cell.day}
                    </ThemedText>
                    {hasEvents && (
                      <View
                        style={[
                          styles.eventDot,
                          {
                            backgroundColor: isSelected ? '#ffffff' : palette.primary,
                          },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Sección de Lista de Eventos del Día Seleccionado */}
          <View style={styles.eventsSection}>
            <View style={styles.eventsHeaderRow}>
              <ThemedText type="subtitle">
                {formatDisplayDate(selectedDate)}
              </ThemedText>
              <ThemedText style={styles.eventCountText}>
                {selectedDateEvents.length}{' '}
                {selectedDateEvents.length === 1 ? 'evento' : 'eventos'}
              </ThemedText>
            </View>

            {loading ? (
              <View style={styles.centeredState}>
                <ActivityIndicator size="small" color={palette.primary} />
                <ThemedText style={styles.stateSubtitle}>Cargando eventos…</ThemedText>
              </View>
            ) : selectedDateEvents.length === 0 ? (
              /* Estado Vacío */
              <View
                style={[
                  styles.emptyStateCard,
                  {
                    backgroundColor:
                      colorScheme === 'dark' ? palette.backgroundElement : '#F7F8FA',
                    borderColor: palette.backgroundSelected,
                  },
                ]}>
                <ThemedText style={styles.emptyStateIcon}>📅</ThemedText>
                <ThemedText style={[styles.emptyStateTitle, { fontWeight: '600' }]}>
                  No tienes eventos programados
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtitle}>
                  No hay actividades registradas para esta fecha.
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/(app)/events/new' as any)}
                  style={[styles.addEventInlineBtn, { borderColor: palette.primary }]}>
                  <ThemedText style={[styles.addEventInlineText, { color: palette.primary }]}>
                    + Programar un evento
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              /* Lista de eventos del día */
              <View style={styles.eventsList}>
                {selectedDateEvents.map((item) => {
                  const badge = getPriorityBadgeStyle(item.priority);
                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.eventCard,
                        {
                          backgroundColor:
                            colorScheme === 'dark'
                              ? palette.backgroundElement
                              : '#ffffff',
                          borderColor: palette.backgroundSelected,
                        },
                      ]}>
                      <View style={styles.eventCardHeader}>
                        <View style={styles.timeWrapper}>
                          <ThemedText style={styles.timeIcon}>⏰</ThemedText>
                          <ThemedText style={styles.timeText}>{item.time}</ThemedText>
                        </View>

                        <View style={styles.badgesWrapper}>
                          <View
                            style={[
                              styles.categoryBadge,
                              { backgroundColor: palette.backgroundSelected },
                            ]}>
                            <ThemedText style={styles.categoryBadgeText}>
                              {item.category.charAt(0).toUpperCase() +
                                item.category.slice(1)}
                            </ThemedText>
                          </View>

                          <View
                            style={[
                              styles.priorityBadge,
                              { backgroundColor: badge.bg },
                            ]}>
                            <ThemedText
                              style={[
                                styles.priorityBadgeText,
                                { color: badge.text },
                              ]}>
                              {badge.label}
                            </ThemedText>
                          </View>
                        </View>
                      </View>

                      <ThemedText style={[styles.eventCardTitle, { fontWeight: '600' }]}>
                        {item.title}
                      </ThemedText>

                      {Boolean(item.description) && (
                        <ThemedText style={styles.eventCardDescription}>
                          {item.description}
                        </ThemedText>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: Spacing.half,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  signOutButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  confirmationBox: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#E8F5E9',
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  confirmationText: {
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
  },
  retryText: {
    fontWeight: '700',
    color: '#C62828',
  },
  calendarCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  monthTitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  monthTitle: {
    fontWeight: '700',
  },
  todayButton: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 24,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
    paddingBottom: Spacing.one,
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.6,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dayNumber: {
    fontSize: 15,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 2,
  },
  eventsSection: {
    gap: Spacing.two,
  },
  eventsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventCountText: {
    opacity: 0.7,
    fontSize: 13,
  },
  centeredState: {
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  stateSubtitle: {
    opacity: 0.7,
    fontSize: 13,
  },
  emptyStateCard: {
    padding: Spacing.four,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  emptyStateIcon: {
    fontSize: 32,
    marginBottom: Spacing.one,
  },
  emptyStateTitle: {
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    opacity: 0.7,
    textAlign: 'center',
    fontSize: 13,
  },
  addEventInlineBtn: {
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  addEventInlineText: {
    fontSize: 13,
    fontWeight: '600',
  },
  eventsList: {
    gap: Spacing.two,
  },
  eventCard: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    gap: Spacing.one,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeIcon: {
    fontSize: 13,
  },
  timeText: {
    fontWeight: '600',
    fontSize: 14,
  },
  badgesWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: 10,
  },
  priorityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  eventCardTitle: {
    fontSize: 16,
  },
  eventCardDescription: {
    fontSize: 13,
    opacity: 0.8,
    marginTop: 2,
  },
});
