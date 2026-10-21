import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  validateCreateEvent,
  type CreateEventField,
  type CreateEventFormErrors,
  type CreateEventValues,
} from '@/features/events/create-event-validation';
import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  type EventCategory,
  type EventPriority,
} from '@/features/events/event-types';
import {
  createEvent,
  describeCreateEventError,
} from '@/features/events/events-api';
import { getToken } from '@/storage/secure-token-storage';

const INITIAL_VALUES: CreateEventValues = {
  title: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  time: '12:00',
  category: 'personal',
  priority: 'media',
};

export default function NewEventScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colorScheme = scheme === 'dark' ? 'dark' : 'light';
  const palette = Colors[colorScheme];

  const [values, setValues] = useState<CreateEventValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<CreateEventFormErrors>({});
  const [generalError, setGeneralError] = useState<string>();
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

    const clientErrors = validateCreateEvent(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    try {
      const token = await getToken();
      if (!token) {
        setGeneralError('No se encontró sesión activa. Vuelve a iniciar sesión.');
        return;
      }

      await createEvent(
        {
          title: values.title.trim(),
          description: values.description?.trim() || undefined,
          date: values.date.trim(),
          time: values.time.trim(),
          category: values.category as EventCategory,
          priority: values.priority as EventPriority,
        },
        token,
      );

      // Regresar a la pantalla de inicio con bandera de evento creado
      router.replace({
        pathname: '/(app)',
        params: { created: '1', eventTitle: values.title.trim() },
      });
    } catch (error) {
      const failure = describeCreateEventError(error);
      setErrors(failure.fields);
      setGeneralError(failure.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <ThemedText type="subtitle">Nuevo evento</ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                Organiza tus actividades diarias en tu agenda
              </ThemedText>
            </View>

            {generalError && (
              <View
                style={[
                  styles.generalErrorBox,
                  { backgroundColor: palette.error + '1A', borderColor: palette.error },
                ]}>
                <ThemedText style={{ color: palette.error }}>{generalError}</ThemedText>
              </View>
            )}

            <TextField
              label="Título del evento"
              value={values.title}
              onChangeText={update('title')}
              error={errors.title}
              placeholder="Ej. Reunión de planeación"
              maxLength={100}
              returnKeyType="next"
            />

            <TextField
              label="Descripción (opcional)"
              value={values.description ?? ''}
              onChangeText={update('description')}
              error={errors.description}
              placeholder="Detalles adicionales del evento..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <View style={styles.row}>
              <View style={styles.halfCol}>
                <TextField
                  label="Fecha (YYYY-MM-DD)"
                  value={values.date}
                  onChangeText={update('date')}
                  error={errors.date}
                  placeholder="2026-10-25"
                />
              </View>
              <View style={styles.halfCol}>
                <TextField
                  label="Hora (HH:mm)"
                  value={values.time}
                  onChangeText={update('time')}
                  error={errors.time}
                  placeholder="14:30"
                />
              </View>
            </View>

            {/* Selector de Categoría */}
            <View style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>
                Categoría
              </ThemedText>
              <View style={styles.chipsContainer}>
                {EVENT_CATEGORIES.map((cat) => {
                  const isSelected = values.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? palette.primary
                            : palette.backgroundElement,
                          borderColor: isSelected
                            ? palette.primary
                            : palette.backgroundSelected,
                        },
                      ]}>
                      <ThemedText
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? '#ffffff'
                              : palette.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              {errors.category && (
                <ThemedText style={[styles.fieldError, { color: palette.error }]}>
                  {errors.category}
                </ThemedText>
              )}
            </View>

            {/* Selector de Prioridad */}
            <View style={styles.section}>
              <ThemedText type="default" style={styles.sectionTitle}>
                Prioridad
              </ThemedText>
              <View style={styles.chipsContainer}>
                {EVENT_PRIORITIES.map((pri) => {
                  const isSelected = values.priority === pri;
                  const priorityColor =
                    pri === 'alta'
                      ? '#E53935'
                      : pri === 'media'
                        ? '#FB8C00'
                        : '#43A047';

                  return (
                    <Pressable
                      key={pri}
                      onPress={() => setPriority(pri)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: isSelected
                            ? priorityColor
                            : palette.backgroundElement,
                          borderColor: isSelected
                            ? priorityColor
                            : palette.backgroundSelected,
                        },
                      ]}>
                      <ThemedText
                        style={[
                          styles.chipText,
                          {
                            color: isSelected
                              ? '#ffffff'
                              : palette.text,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}>
                        {pri.toUpperCase()}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              {errors.priority && (
                <ThemedText style={[styles.fieldError, { color: palette.error }]}>
                  {errors.priority}
                </ThemedText>
              )}
            </View>

            <View style={styles.actions}>
              <Button
                title="Crear evento"
                onPress={handleSubmit}
                loading={submitting}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.cancelButton,
                  {
                    borderColor: palette.backgroundSelected,
                    opacity: submitting ? 0.5 : pressed ? 0.8 : 1,
                  },
                ]}>
                <ThemedText type="default">Cancelar</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.two,
  },
  subtitle: {
    opacity: 0.7,
  },
  generalErrorBox: {
    padding: Spacing.three,
    borderRadius: 8,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  halfCol: {
    flex: 1,
  },
  section: {
    gap: Spacing.one,
    marginTop: Spacing.one,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  fieldError: {
    fontSize: 12,
    marginTop: Spacing.half,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  cancelButton: {
    minHeight: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
