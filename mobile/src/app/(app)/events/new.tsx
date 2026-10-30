import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, type TextInput, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { Icon, IconButton } from '@/components/icon';
import { type OptionItem, OptionSelector } from '@/components/option-selector';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { TimeField } from '@/components/time-field';
import { useToast } from '@/components/toast';
import { Elevation, Radius, Typography } from '@/constants/theme';
import { adjustTimeMinutes, formatDateIso } from '@/features/events/calendar-utils';
import {
  type CreateEventField,
  type CreateEventFormErrors,
  type CreateEventValues,
  validateCreateEvent,
} from '@/features/events/create-event-validation';
import {
  type EventCategory,
  type EventPriority,
} from '@/features/events/event-types';
import {
  createEvent,
  describeCreateEventError,
  updateEvent,
} from '@/features/events/events-api';
import { useTheme } from '@/hooks/use-theme';
import { getToken } from '@/storage/secure-token-storage';
import { triggerLightHaptic, triggerSuccessHaptic } from '@/utils/haptics';

const CATEGORY_OPTIONS: OptionItem<EventCategory>[] = [
  { value: 'trabajo', label: 'Trabajo', tone: 'trabajo', icon: 'briefcase' },
  { value: 'estudio', label: 'Estudio', tone: 'estudio', icon: 'book' },
  { value: 'personal', label: 'Personal', tone: 'personal', icon: 'user' },
  { value: 'salud', label: 'Salud', tone: 'salud', icon: 'heart' },
  { value: 'otro', label: 'Otro', tone: 'otro', icon: 'tag' },
];

const PRIORITY_OPTIONS: OptionItem<EventPriority>[] = [
  { value: 'baja', label: 'Baja', tone: 'baja', icon: 'flag' },
  { value: 'media', label: 'Media', tone: 'media', icon: 'flag' },
  { value: 'alta', label: 'Alta', tone: 'alta', icon: 'flag' },
];

const TIME_PRESETS = ['09:00', '12:00', '15:00', '18:00', '20:00'];

export default function NewEventScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();

  const titleInputRef = useRef<TextInput>(null);
  const descInputRef = useRef<TextInput>(null);

  const params = useLocalSearchParams<{
    id?: string;
    initialTitle?: string;
    initialDescription?: string;
    initialDate?: string;
    initialTime?: string;
    initialCategory?: string;
    initialPriority?: string;
  }>();

  const isEditing = Boolean(params.id);

  // Inicialización con fecha local para evitar saltar al día siguiente (SCRUM-106)
  const [values, setValues] = useState<CreateEventValues>(() => ({
    title: params.initialTitle ?? '',
    description: params.initialDescription ?? '',
    date: params.initialDate ?? formatDateIso(new Date()),
    time: params.initialTime ?? '12:00',
    category: (params.initialCategory as EventCategory) ?? 'personal',
    priority: (params.initialPriority as EventPriority) ?? 'media',
  }));

  const [errors, setErrors] = useState<CreateEventFormErrors>({});
  const [generalError, setGeneralError] = useState<string>();
  const [isNotFound, setIsNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Accesos rápidos de fecha calculados una vez por render
  const quickDates = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const inTwoDays = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);

    return [
      { label: 'Hoy', value: formatDateIso(today) },
      { label: 'Mañana', value: formatDateIso(tomorrow) },
      { label: 'En 2 días', value: formatDateIso(inTwoDays) },
    ];
  }, []);

  const update = (field: CreateEventField) => (text: string) => {
    setValues((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setCategory = (cat: EventCategory) => {
    setValues((prev) => ({ ...prev, category: cat }));
    setErrors((prev) => ({ ...prev, category: undefined }));
  };

  const setPriority = (pri: EventPriority) => {
    setValues((prev) => ({ ...prev, priority: pri }));
    setErrors((prev) => ({ ...prev, priority: undefined }));
  };

  async function handleSubmit() {
    if (submitting) return;
    setGeneralError(undefined);
    setIsNotFound(false);

    const clientErrors = validateCreateEvent(values);
    setErrors(clientErrors);

    if (Object.keys(clientErrors).length > 0) {
      if (clientErrors.title) {
        titleInputRef.current?.focus();
      } else if (clientErrors.description) {
        descInputRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        setGeneralError('No se encontró sesión activa. Vuelve a iniciar sesión.');
        return;
      }

      const payload = {
        title: values.title.trim(),
        description: values.description?.trim() || undefined,
        date: values.date.trim(),
        time: values.time.trim(),
        category: values.category as EventCategory,
        priority: values.priority as EventPriority,
      };

      if (isEditing && params.id) {
        await updateEvent(params.id, payload, token);
        triggerSuccessHaptic();
        toast.show({
          tone: 'success',
          message: `Evento «${values.title.trim()}» actualizado exitosamente`,
        });
      } else {
        await createEvent(payload, token);
        triggerSuccessHaptic();
        toast.show({
          tone: 'success',
          message: `Evento «${values.title.trim()}» creado exitosamente`,
        });
      }

      router.replace('/(app)/' as any);
    } catch (error) {
      const failure = describeCreateEventError(error);
      setErrors(failure.fields);
      setGeneralError(failure.message);
      if (failure.message === 'El evento ya no existe') {
        setIsNotFound(true);
      }
      if (failure.fields.title) {
        titleInputRef.current?.focus();
      } else if (failure.fields.description) {
        descInputRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const titleLength = values.title.length;
  const descLength = (values.description ?? '').length;

  return (
    <Screen
      scrollable={true}
      header={
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.isDark
                ? 'rgba(15, 23, 42, 0.85)'
                : 'rgba(255, 255, 255, 0.88)',
              borderBottomColor: theme.isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            },
          ]}>
          <IconButton
            name="back"
            accessibilityLabel="Regresar a la agenda"
            size={22}
            onPress={() => router.back()}
          />
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
            {isEditing ? 'Editar evento' : 'Nuevo evento'}
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
      }
      contentContainerStyle={styles.contentContainer}>
      <View style={styles.formCard}>
        {/* Banner general de error si falla la validación del servidor */}
        {generalError && (
          <View style={styles.bannerWrapper}>
            <Banner
              tone="error"
              title="No se pudo guardar el evento"
              message={generalError}
              actionLabel={isNotFound ? 'Volver a la agenda' : undefined}
              onAction={isNotFound ? () => router.replace('/(app)/' as any) : undefined}
            />
          </View>
        )}

        {/* Sección 1: Información general (Estilo Apple) */}
        <View style={styles.sectionCard}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Información del evento
          </ThemedText>
          <View
            style={[
              styles.sectionBody,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            {/* Título con contador 0/100 y foco guiado */}
            <TextField
              ref={titleInputRef}
              label="Título del evento"
              required
              value={values.title}
              onChangeText={update('title')}
              error={errors.title}
              helperText={`${titleLength}/100`}
              placeholder="Ej. Reunión de planeación"
              maxLength={100}
              returnKeyType="next"
              onSubmitEditing={() => descInputRef.current?.focus()}
            />

            {/* Descripción con contador 0/500 */}
            <TextField
              ref={descInputRef}
              label="Descripción (opcional)"
              value={values.description ?? ''}
              onChangeText={update('description')}
              error={errors.description}
              helperText={`${descLength}/500`}
              placeholder="Detalles adicionales del evento..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
        </View>

        {/* Sección 2: Fecha y Horario (Estilo Apple con accesos rápidos) */}
        <View style={styles.sectionCard}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Fecha y horario
          </ThemedText>
          <View
            style={[
              styles.sectionBody,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            {/* Accesos rápidos de fecha */}
            <View style={styles.quickGroup}>
              <ThemedText style={[styles.fieldSublabel, { color: theme.textSecondary }]}>
                Atajos de fecha
              </ThemedText>
              <View style={styles.chipsRow}>
                {quickDates.map((item) => {
                  const isSelected = values.date === item.value;
                  return (
                    <Pressable
                      key={item.label}
                      accessibilityRole="button"
                      accessibilityLabel={`Fijar fecha a ${item.label}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        triggerLightHaptic();
                        update('date')(item.value);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isSelected ? theme.primary : theme.border,
                          transform: [{ scale: pressed ? 0.94 : 1 }],
                        },
                      ]}>
                      <Icon
                        name="calendar"
                        size={13}
                        color={isSelected ? theme.onPrimary : theme.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.chipText,
                          { color: isSelected ? theme.onPrimary : theme.text },
                        ]}>
                        {item.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Selector de fecha con DatePicker nativo */}
            <DateField
              label="Fecha"
              required
              value={values.date}
              onChange={(dateIso) => update('date')(dateIso)}
              error={errors.date}
            />

            {/* Accesos rápidos de hora y ajuste dinámico +/-30m */}
            <View style={styles.quickGroup}>
              <ThemedText style={[styles.fieldSublabel, { color: theme.textSecondary }]}>
                Horarios sugeridos y ajuste rápido
              </ThemedText>
              <View style={styles.chipsRow}>
                {TIME_PRESETS.map((preset) => {
                  const isSelected = values.time === preset;
                  return (
                    <Pressable
                      key={preset}
                      accessibilityRole="button"
                      accessibilityLabel={`Fijar hora a ${preset}`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        triggerLightHaptic();
                        update('time')(preset);
                      }}
                      style={({ pressed }) => [
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? theme.primary
                            : theme.isDark
                            ? 'rgba(255, 255, 255, 0.06)'
                            : 'rgba(0, 0, 0, 0.04)',
                          borderColor: isSelected ? theme.primary : theme.border,
                          transform: [{ scale: pressed ? 0.94 : 1 }],
                        },
                      ]}>
                      <Icon
                        name="clock"
                        size={13}
                        color={isSelected ? theme.onPrimary : theme.textSecondary}
                      />
                      <ThemedText
                        style={[
                          styles.chipText,
                          { color: isSelected ? theme.onPrimary : theme.text },
                        ]}>
                        {preset}
                      </ThemedText>
                    </Pressable>
                  );
                })}
                {/* Botones de ajuste +/- 30 minutos */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Restar 30 minutos a la hora actual"
                  onPress={() => {
                    triggerLightHaptic();
                    update('time')(adjustTimeMinutes(values.time, -30));
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.stepperChip,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: theme.border,
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}>
                  <ThemedText style={[styles.chipText, { color: theme.text }]}>-30m</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Sumar 30 minutos a la hora actual"
                  onPress={() => {
                    triggerLightHaptic();
                    update('time')(adjustTimeMinutes(values.time, 30));
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    styles.stepperChip,
                    {
                      backgroundColor: theme.isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.05)',
                      borderColor: theme.border,
                      transform: [{ scale: pressed ? 0.94 : 1 }],
                    },
                  ]}>
                  <ThemedText style={[styles.chipText, { color: theme.text }]}>+30m</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Selector de hora con TimePicker nativo */}
            <TimeField
              label="Hora"
              required
              value={values.time}
              onChange={(time) => update('time')(time)}
              error={errors.time}
            />
          </View>
        </View>

        {/* Sección 3: Clasificación (Categoría con iconos vectoriales y Prioridad) */}
        <View style={styles.sectionCard}>
          <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Clasificación
          </ThemedText>
          <View
            style={[
              styles.sectionBody,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            {/* Selector de Categoría accesible con iconos de Lucide */}
            <OptionSelector
              label="Categoría"
              required
              options={CATEGORY_OPTIONS}
              value={values.category}
              onChange={(cat) => setCategory(cat as EventCategory)}
              error={errors.category}
            />

            {/* Selector de Prioridad accesible con iconos */}
            <OptionSelector
              label="Prioridad"
              required
              options={PRIORITY_OPTIONS}
              value={values.priority}
              onChange={(pri) => setPriority(pri as EventPriority)}
              error={errors.priority}
            />
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.buttonActions}>
          <Button
            title={isEditing ? 'Guardar cambios' : 'Crear evento'}
            variant="primary"
            size="md"
            loading={submitting}
            onPress={handleSubmit}
          />
          <Button
            title="Cancelar"
            variant="ghost"
            size="md"
            disabled={submitting}
            onPress={() => router.back()}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 32,
  },
  formCard: {
    width: '100%',
    maxWidth: 580,
    alignSelf: 'center',
    gap: 20,
  },
  header: {
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
  headerTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44, // Equilibra el espacio del IconButton
  },
  bannerWrapper: {
    width: '100%',
  },
  sectionCard: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  sectionBody: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    ...Elevation.sm,
  },
  quickGroup: {
    gap: 8,
  },
  fieldSublabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
    minHeight: 34,
  },
  stepperChip: {
    paddingHorizontal: 10,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  buttonActions: {
    gap: 10,
    marginTop: 4,
  },
});
