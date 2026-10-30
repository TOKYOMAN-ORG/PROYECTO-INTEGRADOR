import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { useConfirm } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { EventCard } from '@/components/event-card';
import { EventDetailModal } from '@/components/event-detail-modal';
import { FadeInView } from '@/components/fade-in-view';
import { IconButton } from '@/components/icon';
import { LoadingState } from '@/components/loading-state';
import { MonthCalendar } from '@/components/month-calendar';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { useAuth } from '@/features/auth/auth-context';
import {
  formatDateIso,
  formatDisplayDate,
  getEventsForDate,
  getMonthDateRange,
} from '@/features/events/calendar-utils';
import type { Event } from '@/features/events/event-types';
import { deleteEvent, getEvents } from '@/features/events/events-api';
import { Elevation, Typography } from '@/constants/theme';
import { useThemePreference } from '@/features/theme/theme-context';
import { getPressOrigin } from '@/features/theme/theme-reveal';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, NetworkError } from '@/services/http-client';
import { getToken } from '@/storage/secure-token-storage';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/utils/haptics';
import { useSizeClass } from '@/utils/window-size';

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

  function handleSelectDay(dateIso: string) {
    triggerLightHaptic();
    setSelectedDate(dateIso);
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
        <View style={styles.appHeader}>
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
          {/* Sección del día seleccionado */}
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Eventos para {formatDisplayDate(selectedDate)}
            </ThemedText>
            <ThemedText style={[styles.sectionCount, { color: theme.textSecondary }]}>
              ({selectedDateEvents.length})
            </ThemedText>
          </View>

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
          ) : selectedDateEvents.length === 0 ? (
            <EmptyState
              icon="calendar"
              title="No hay eventos para este día"
              message="Aprovecha tu día libre o programa una nueva actividad."
              actionLabel="Programar un evento"
              onAction={() => router.push('/(app)/events/new' as any)}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: Typography.body.fontSize,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
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
