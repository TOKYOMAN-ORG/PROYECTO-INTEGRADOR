import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { EventCard } from '@/components/event-card';
import { EventDetailModal } from '@/components/event-detail-modal';
import { FadeInView } from '@/components/fade-in-view';
import { Icon, IconButton } from '@/components/icon';
import type { AppIconName } from '@/components/icon-model';
import { LoadingState } from '@/components/loading-state';
import { MonthCalendar } from '@/components/month-calendar';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import type { SegmentedOption } from '@/components/segmented-control-model';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { useAuth } from '@/features/auth/auth-context';
import {
  formatDateIso,
  formatDisplayDate,
  getEventsForDate,
  getMonthDateRange,
  groupEventsByDate,
  MONTH_NAMES,
} from '@/features/events/calendar-utils';
import type { Event } from '@/features/events/event-types';
import { deleteEvent, getEvents } from '@/features/events/events-api';
import { Elevation, Radius, Typography } from '@/constants/theme';
import { useThemePreference } from '@/features/theme/theme-context';
import { getPressOrigin } from '@/features/theme/theme-reveal';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, NetworkError } from '@/services/http-client';
import { getToken } from '@/storage/secure-token-storage';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/utils/haptics';
import { useSizeClass } from '@/utils/window-size';

export type AgendaViewMode = 'all' | 'day';

export default function HomeScreen() {
  const router = useRouter();
  const { created, updated, eventTitle } = useLocalSearchParams<{
    created?: string;
    updated?: string;
    eventTitle?: string;
  }>();
  const { signOut } = useAuth();
  const theme = useTheme();
  const { toggle: toggleTheme } = useThemePreference();
  const sizeConfig = useSizeClass();
  const confirm = useConfirm();
  const toast = useToast();

  const [signingOut, setSigningOut] = useState(false);
  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => formatDateIso(today), [today]);

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [viewMode, setViewMode] = useState<AgendaViewMode>('all');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Reemplazo de parámetros de ruta por toasts accesibles
  useEffect(() => {
    if (created === '1') {
      toast.show({
        tone: 'success',
        message: `Evento ${eventTitle ? `«${eventTitle}» ` : ''}creado exitosamente`,
      });
      router.replace('/(app)/' as any);
    } else if (updated === '1') {
      toast.show({
        tone: 'success',
        message: `Evento ${eventTitle ? `«${eventTitle}» ` : ''}actualizado exitosamente`,
      });
      router.replace('/(app)/' as any);
    }
  }, [created, updated, eventTitle, toast, router]);

  // Carga de eventos del mes
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
          'No se pudieron cargar los eventos. Revisa tu conexión e inténtalo de nuevo.'
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [currentYear, currentMonth, reloadToken]);

  const eventsByDate = useMemo(() => {
    const record: Record<string, Event[]> = {};
    for (const ev of events) {
      if (!record[ev.date]) {
        record[ev.date] = [];
      }
      record[ev.date].push(ev);
    }
    return record;
  }, [events]);

  const selectedDateEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate]
  );

  const dayGroups = useMemo(
    () => groupEventsByDate(events, todayIso),
    [events, todayIso]
  );

  const viewModeOptions = useMemo<SegmentedOption<AgendaViewMode>[]>(
    () => [
      {
        value: 'all',
        label: 'Todos los eventos',
        count: events.length,
      },
      {
        value: 'day',
        label: 'Día seleccionado',
        count: selectedDateEvents.length,
      },
    ],
    [events.length, selectedDateEvents.length]
  );

  const viewModeIcons: Partial<Record<AgendaViewMode, AppIconName>> = {
    all: 'calendar',
    day: 'clock',
  };

  function handleSelectDay(dateIso: string) {
    triggerLightHaptic();
    setSelectedDate(dateIso);
    setViewMode('day');
    const parts = dateIso.split('-');
    const cellYear = parseInt(parts[0], 10);
    const cellMonth = parseInt(parts[1], 10) - 1;
    if (cellYear !== currentYear || cellMonth !== currentMonth) {
      setLoading(true);
      setCurrentYear(cellYear);
      setCurrentMonth(cellMonth);
    }
  }

  function handleGoToToday() {
    triggerLightHaptic();
    if (
      currentYear !== today.getFullYear() ||
      currentMonth !== today.getMonth()
    ) {
      setLoading(true);
      setCurrentYear(today.getFullYear());
      setCurrentMonth(today.getMonth());
    }
    setSelectedDate(todayIso);
    setViewMode('day');
  }

  function handleEditEvent(event: Event) {
    setDeleteError(null);
    setSelectedEvent(null);
    router.push({
      pathname: '/(app)/events/new',
      params: {
        id: event.id,
        initialTitle: event.title,
        initialDescription: event.description ?? '',
        initialDate: event.date,
        initialTime: event.time,
        initialCategory: event.category,
        initialPriority: event.priority,
      },
    } as any);
  }

  async function handleDeleteEvent(event: Event) {
    if (deleting) return;
    const confirmed = await confirm({
      title: 'Eliminar evento',
      message: `¿Estás seguro de que deseas eliminar «${event.title}»? Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      cancelLabel: 'Cancelar',
      destructive: true,
    });
    if (!confirmed) return;

    setDeleting(true);
    setDeleteError(null);
    try {
      const token = await getToken();
      if (!token) {
        setDeleteError('No hay token de sesión.');
        return;
      }
      await deleteEvent(event.id, token);
      triggerSuccessHaptic();
      setSelectedEvent(null);
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
      toast.show({
        tone: 'success',
        message: 'Evento eliminado correctamente',
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setSelectedEvent(null);
        setEvents((prev) => prev.filter((e) => e.id !== event.id));
        toast.show({
          tone: 'warning',
          message: 'El evento ya no existía en el servidor.',
        });
      } else if (error instanceof NetworkError) {
        setDeleteError(
          'No se pudo conectar con el servidor. El evento no fue eliminado.'
        );
      } else {
        setDeleteError(
          'Ocurrió un error inesperado al intentar eliminar el evento.'
        );
      }
    } finally {
      setDeleting(false);
    }
  }

  async function handleSignOut() {
    if (signingOut) return;
    const confirmed = await confirm({
      title: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas salir de tu cuenta?',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'Cancelar',
      destructive: false,
    });
    if (!confirmed) return;

    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <Screen
      scrollable={true}
      header={
        <View
          style={[
            styles.appHeader,
            {
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.85)'
                : 'rgba(255, 255, 255, 0.88)',
              borderBottomColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}>
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.appTitle, { color: theme.text }]}>
              SecurePlan
            </ThemedText>
            <ThemedText
              style={[styles.appSubtitle, { color: theme.textSecondary }]}>
              Mi agenda
            </ThemedText>
          </View>
          <View style={styles.headerActions}>
            <IconButton
              name={theme.isDark ? 'sun' : 'moon'}
              accessibilityLabel={theme.isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              size={20}
              onPress={(event) => toggleTheme(getPressOrigin(event))}
            />
            <IconButton
              name="logout"
              accessibilityLabel="Cerrar sesión"
              size={20}
              onPress={handleSignOut}
              disabled={signingOut}
            />
          </View>
        </View>
      }
      footer={
        <View pointerEvents="box-none" style={styles.fabWrapper}>
          <Button
            title="Crear evento"
            icon="add"
            variant="primary"
            size="md"
            accessibilityLabel="Crear nuevo evento"
            onPress={() => router.push('/(app)/events/new' as any)}
            style={styles.fabButton}
          />
        </View>
      }
      contentContainerStyle={styles.contentContainer}>
      {/* Disposición adaptable: 2 columnas en pantallas expandidas (>= 840 dp), 1 columna en teléfonos */}
      <View style={sizeConfig.isExpanded ? styles.twoColumnWrap : styles.singleColumnWrap}>
        <View style={sizeConfig.isExpanded ? styles.leftColumn : styles.fullColumn}>
          {/* Componente Calendario */}
          <MonthCalendar
            year={currentYear}
            month={currentMonth}
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            onSelectDate={handleSelectDay}
            onChangeMonth={(y, m) => {
              setCurrentYear(y);
              setCurrentMonth(m);
              setLoading(true);
            }}
            onToday={handleGoToToday}
          />
        </View>

        <View style={sizeConfig.isExpanded ? styles.rightColumn : styles.fullColumn}>
          {/* Cabecera de la sección de agenda */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
                {viewMode === 'all'
                  ? `Agenda de ${MONTH_NAMES[currentMonth]}`
                  : `Eventos para ${formatDisplayDate(selectedDate)}`}
              </ThemedText>
              <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
                ({viewMode === 'all' ? events.length : selectedDateEvents.length})
              </ThemedText>
            </View>
          </View>

          {/* Selector de modo estilo iOS: Todos los eventos vs Día seleccionado */}
          <SegmentedControl
            options={viewModeOptions}
            value={viewMode}
            onChange={setViewMode}
            icons={viewModeIcons}
          />

          {/* Estados: Carga, Error, Vacío o Lista */}
          {loading ? (
            <LoadingState message="Cargando tu agenda..." />
          ) : fetchError ? (
            <ErrorState
              title="Error al cargar eventos"
              message={fetchError}
              onRetry={() => {
                setLoading(true);
                setReloadToken((t) => t + 1);
              }}
            />
          ) : viewMode === 'day' ? (
            selectedDateEvents.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No hay eventos para este día"
                message="No tienes actividades registradas para la fecha seleccionada."
                actionLabel="Ver todos los eventos del mes"
                onAction={() => setViewMode('all')}
              />
            ) : (
              <View style={styles.eventsList}>
                {selectedDateEvents.map((item, index) => (
                  <FadeInView key={`${item.id}-${selectedDate}`} index={index}>
                    <EventCard
                      event={item}
                      onPress={(ev) => {
                        setDeleteError(null);
                        setSelectedEvent(ev);
                      }}
                    />
                  </FadeInView>
                ))}
              </View>
            )
          ) : events.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="Sin eventos en este mes"
              message="Aprovecha tu mes libre o programa una nueva actividad en tu agenda."
              actionLabel="Programar un evento"
              onAction={() => router.push('/(app)/events/new' as any)}
            />
          ) : (
            <View style={styles.dayGroupsContainer}>
              {dayGroups.map((group) => (
                <View key={group.date} style={styles.dayGroupBlock}>
                  {/* Cabecera del día con acceso directo para ver solo ese día */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Ver solo eventos de ${group.header}`}
                    onPress={() => {
                      triggerLightHaptic();
                      setSelectedDate(group.date);
                      setViewMode('day');
                    }}
                    style={[
                      styles.dayGroupHeader,
                      group.isToday && [
                        styles.dayGroupHeaderToday,
                        {
                          backgroundColor: theme.isDark
                            ? 'rgba(59, 130, 246, 0.15)'
                            : 'rgba(26, 111, 208, 0.08)',
                          borderColor: theme.primary,
                        },
                      ],
                    ]}>
                    <View style={styles.dayGroupHeaderLeft}>
                      <Icon
                        name={group.isToday ? 'calendar' : 'clock'}
                        size={14}
                        color={group.isToday ? theme.primary : theme.textSecondary}
                      />
                      <ThemedText
                        type={group.isToday ? 'smallBold' : 'small'}
                        style={{
                          color: group.isToday ? theme.primary : theme.text,
                          fontSize: 13,
                        }}>
                        {group.header}
                      </ThemedText>
                    </View>
                    <ThemedText
                      type="small"
                      style={[styles.dayGroupCount, { color: theme.textSecondary }]}>
                      {group.events.length} {group.events.length === 1 ? 'evento' : 'eventos'}
                    </ThemedText>
                  </Pressable>

                  {/* Lista de eventos de este día */}
                  <View style={styles.eventsList}>
                    {group.events.map((item, index) => (
                      <FadeInView key={`${item.id}-${group.date}`} index={index}>
                        <EventCard
                          event={item}
                          onPress={(ev) => {
                            setDeleteError(null);
                            setSelectedEvent(ev);
                          }}
                        />
                      </FadeInView>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Modal de Detalle del Evento */}
      <EventDetailModal
        event={selectedEvent}
        visible={Boolean(selectedEvent)}
        onClose={() => {
          setDeleteError(null);
          setSelectedEvent(null);
        }}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        deleting={deleting}
        deleteError={deleteError}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 80, // Espacio para que el FAB no tape el último elemento
  },
  appHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      } as any,
      default: {},
    }),
  },
  headerInfo: {
    flex: 1,
  },
  appTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: Typography.label.fontSize,
    fontWeight: '500',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginVertical: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
  },
  dayGroupsContainer: {
    width: '100%',
    gap: 16,
    marginTop: 8,
  },
  dayGroupBlock: {
    width: '100%',
    gap: 6,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dayGroupHeaderToday: {
    borderWidth: 1,
  },
  dayGroupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayGroupCount: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '600',
  },
  eventsList: {
    width: '100%',
  },
  fabWrapper: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    zIndex: 99,
  },
  fabButton: {
    ...Elevation.md,
  },
  twoColumnWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 24,
    width: '100%',
  },
  singleColumnWrap: {
    width: '100%',
  },
  leftColumn: {
    flex: 1,
    maxWidth: 440,
  },
  rightColumn: {
    flex: 1.2,
  },
  fullColumn: {
    width: '100%',
  },
});
