import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StyleSheet, type TextInput, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { DateField } from '@/components/date-field';
import { IconButton } from '@/components/icon';
import { type OptionItem, OptionSelector } from '@/components/option-selector';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { TimeField } from '@/components/time-field';
import { useToast } from '@/components/toast';
import { formatDateIso } from '@/features/events/calendar-utils';
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

const CATEGORY_OPTIONS: OptionItem<EventCategory>[] = [
  { value: 'trabajo', label: 'Trabajo', tone: 'trabajo' },
  { value: 'estudio', label: 'Estudio', tone: 'estudio' },
  { value: 'personal', label: 'Personal', tone: 'personal' },
  { value: 'salud', label: 'Salud', tone: 'salud' },
  { value: 'otro', label: 'Otro', tone: 'otro' },
];

const PRIORITY_OPTIONS: OptionItem<EventPriority>[] = [
  { value: 'baja', label: 'Baja', tone: 'baja' },
  { value: 'media', label: 'Media', tone: 'media' },
  { value: 'alta', label: 'Alta', tone: 'alta' },
];

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
        toast.show({
          tone: 'success',
          message: `Evento «${values.title.trim()}» actualizado exitosamente`,
        });
      } else {
        await createEvent(payload, token);
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
        <View style={styles.header}>
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

      {/* Selectores de Fecha y Hora con DateTimePicker nativo */}
      <View style={styles.row}>
        <View style={styles.halfCol}>
          <DateField
            label="Fecha"
            required
            value={values.date}
            onChange={(dateIso) => update('date')(dateIso)}
            error={errors.date}
          />
        </View>
        <View style={styles.halfCol}>
          <TimeField
            label="Hora"
            required
            value={values.time}
            onChange={(time) => update('time')(time)}
            error={errors.time}
          />
        </View>
      </View>

      {/* Selector de Categoría accesible */}
      <OptionSelector
        label="Categoría"
        required
        options={CATEGORY_OPTIONS}
        value={values.category}
        onChange={(cat) => setCategory(cat as EventCategory)}
        error={errors.category}
      />

      {/* Selector de Prioridad accesible */}
      <OptionSelector
        label="Prioridad"
        required
        options={PRIORITY_OPTIONS}
        value={values.priority}
        onChange={(pri) => setPriority(pri as EventPriority)}
        error={errors.priority}
      />

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
    </Screen>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 44, // Equilibra el espacio del IconButton
  },
  bannerWrapper: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCol: {
    flex: 1,
  },
  buttonActions: {
    gap: 12,
    marginTop: 20,
    marginBottom: 32,
  },
});
