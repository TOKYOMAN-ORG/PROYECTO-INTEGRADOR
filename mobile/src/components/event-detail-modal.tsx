import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { Badge } from '@/components/badge';
import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import {
  getCategoryLabel,
  getPriorityLabel,
} from '@/components/event-card-model';
import { Icon, IconButton } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius } from '@/constants/theme';
import { formatDisplayDate } from '@/features/events/calendar-utils';
import type { Event } from '@/features/events/event-types';
import { useTheme } from '@/hooks/use-theme';

export interface EventDetailModalProps {
  event: Event | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (event: Event) => void;
  onDelete: (event: Event) => void;
  deleting?: boolean;
  deleteError?: string | null;
  testID?: string;
}

export function EventDetailModal({
  event,
  visible,
  onClose,
  onEdit,
  onDelete,
  deleting = false,
  deleteError,
  testID,
}: EventDetailModalProps) {
  const theme = useTheme();

  if (!event) return null;

  return (
    <Modal
      testID={testID}
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => !deleting && onClose()}
      accessibilityViewIsModal={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar modal de detalle"
          style={styles.backdropDismiss}
          onPress={() => !deleting && onClose()}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
            },
          ]}>
          {/* Cabecera del modal */}
          <View style={styles.modalHeader}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {event.title}
            </ThemedText>
            <IconButton
              name="close"
              accessibilityLabel="Cerrar detalle"
              size={20}
              disabled={deleting}
              onPress={onClose}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={styles.scrollArea}>
            {/* Metadatos: Hora y Fecha */}
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Icon name="clock" size={16} color={theme.textSecondary} />
                <ThemedText
                  style={[styles.metaText, { color: theme.textSecondary }]}>
                  {event.time}
                </ThemedText>
              </View>

              <View style={styles.metaItem}>
                <Icon name="calendar" size={16} color={theme.textSecondary} />
                <ThemedText
                  style={[styles.metaText, { color: theme.textSecondary }]}>
                  {formatDisplayDate(event.date)}
                </ThemedText>
              </View>
            </View>

            {/* Badges de Categoría y Prioridad */}
            <View style={styles.badgesRow}>
              <Icon name="tag" size={16} color={theme.textSecondary} />
              <Badge
                label={getCategoryLabel(event.category)}
                tone={event.category}
                size="md"
              />
              <Icon name="flag" size={16} color={theme.textSecondary} />
              <Badge
                label={getPriorityLabel(event.priority)}
                tone={event.priority}
                size="md"
              />
            </View>

            {/* Descripción completa */}
            {Boolean(event.description) && (
              <View
                style={[
                  styles.descriptionBox,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}>
                <ThemedText
                  style={[styles.descriptionText, { color: theme.text }]}>
                  {event.description}
                </ThemedText>
              </View>
            )}

            {/* Banner de error de eliminación */}
            {Boolean(deleteError) && (
              <Banner tone="error" message={deleteError!} />
            )}
          </ScrollView>

          {/* Acciones del detalle */}
          <View style={styles.actionsContainer}>
            <Button
              title="Editar evento"
              variant="outline"
              icon="edit"
              size="md"
              disabled={deleting}
              onPress={() => onEdit(event)}
              style={styles.actionBtn}
            />
            <Button
              title="Eliminar evento"
              variant="destructive"
              icon="delete"
              size="md"
              loading={deleting}
              onPress={() => onDelete(event)}
              style={styles.actionBtn}
            />
            <Button
              title="Cerrar"
              variant="ghost"
              size="md"
              disabled={deleting}
              onPress={onClose}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    ...Elevation.lg,
    zIndex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    marginRight: 12,
  },
  scrollArea: {
    flexGrow: 0,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  descriptionBox: {
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    width: '100%',
  },
});
