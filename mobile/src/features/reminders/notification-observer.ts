/**
 * Observer concreto del patrón Observer (SCRUM-60 / SCRUM-70): convierte los cambios de la agenda que publica
 * `eventsSubject` en recordatorios locales nativos. Es el único observer que usa `expo-notifications`.
 *
 * - `created` / `updated`: cancela el recordatorio previo del evento y programa uno nuevo (id del evento como
 *   identificador, título como contenido, disparo 10 minutos antes en hora local; si ese momento ya pasó pero el
 *   evento aún no empieza, avisa a la hora exacta del evento).
 * - `deleted`: cancela el recordatorio del evento.
 * - `loaded`: programa los eventos futuros que aún no tienen recordatorio.
 *
 * Sin permiso concedido no programa nada. Los cambios se procesan en orden y ningún fallo sale del observer.
 */

import * as Notifications from 'expo-notifications';

import type { Event } from '../events/event-types.ts';
import type { EventChange, EventObserver } from '../events/events-subject.ts';
import { formatTime12h } from '../../utils/format-time.ts';
import { REMINDERS_CHANNEL_ID, ensureNotificationPermission } from './notifications.ts';
import { getReminderDate } from './reminder-date.ts';

export class NotificationObserver implements EventObserver {
  private queue: Promise<void> = Promise.resolve();
  private readonly now: () => Date;

  constructor(now: () => Date = () => new Date()) {
    this.now = now;
  }

  update(change: EventChange): void {
    // `update` es síncrono para el Subject: el trabajo asíncrono se encadena para respetar el orden de los cambios.
    this.queue = this.queue
      .then(() => this.handle(change))
      .catch((error) => {
        console.warn('No se pudo actualizar un recordatorio', error);
      });
  }

  /** Resuelve cuando se procesaron todos los cambios recibidos hasta ahora. */
  idle(): Promise<void> {
    return this.queue;
  }

  private async handle(change: EventChange): Promise<void> {
    switch (change.type) {
      case 'created':
      case 'updated':
        await cancelReminder(change.event.id);
        // Evento recién creado o editado: si ya pasó la anticipación, avisa a la hora exacta.
        if (await ensureNotificationPermission()) await this.schedule(change.event, true);
        return;
      case 'deleted':
        await cancelReminder(change.id);
        return;
      case 'loaded': {
        if (!(await ensureNotificationPermission())) return;
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        const pending = new Set(scheduled.map((notification) => notification.identifier));
        for (const event of change.events) {
          if (!pending.has(event.id)) await this.schedule(event);
        }
        return;
      }
    }
  }

  private async schedule(event: Event, atStartIfLate = false): Promise<void> {
    const now = this.now();
    // Con anticipación 0 el aviso cae en el inicio del evento; solo se usa al crear o editar, no al cargar la agenda
    // (si no, un evento cuyo aviso ya sonó se avisaría otra vez al recargar).
    const date =
      getReminderDate(event.date, event.time, now) ??
      (atStartIfLate ? getReminderDate(event.date, event.time, now, 0) : null);
    if (!date) return;
    await Notifications.scheduleNotificationAsync({
      identifier: event.id,
      content: {
        title: event.title,
        body: `Tu evento empieza a las ${formatTime12h(event.time)}`,
        data: { eventId: event.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
        channelId: REMINDERS_CHANNEL_ID,
      },
    });
  }
}

async function cancelReminder(eventId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(eventId);
}
