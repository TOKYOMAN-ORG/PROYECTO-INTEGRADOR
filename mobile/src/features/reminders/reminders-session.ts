/**
 * Ciclo de vida de los recordatorios ligado a la sesión (SCRUM-71).
 *
 * - `startReminders(token)`: suscribe el `NotificationObserver` al Subject de la agenda y carga los eventos de hoy
 *   a 30 días para que se publique `loaded` y se reprogramen sus avisos. La ventana respeta el límite de
 *   64 notificaciones pendientes de iOS.
 * - `stopReminders()`: desuscribe el observer y cancela todos los recordatorios, para que los avisos de una cuenta
 *   no se muestren a otra en el mismo dispositivo.
 *
 * Ninguna función lanza: si la carga falla (por ejemplo sin red) el inicio de sesión no se interrumpe.
 */

import { formatDateIso } from '../events/calendar-utils.ts';
import { getEvents } from '../events/events-api.ts';
import { eventsSubject } from '../events/events-subject.ts';
import { NotificationObserver } from './notification-observer.ts';
import { cancelAllReminders } from './notifications.ts';

export const REMINDERS_WINDOW_DAYS = 30;

const observer = new NotificationObserver();
let unsubscribe: (() => void) | null = null;

export async function startReminders(token: string, now: Date = new Date()): Promise<void> {
  unsubscribe ??= eventsSubject.subscribe(observer);

  const until = new Date(now.getFullYear(), now.getMonth(), now.getDate() + REMINDERS_WINDOW_DAYS);
  try {
    await getEvents(token, formatDateIso(now), formatDateIso(until));
    await observer.idle();
  } catch {
    // Sin red o error del servidor: los avisos se reprogramarán en la siguiente carga de la agenda.
  }
}

export async function stopReminders(): Promise<void> {
  unsubscribe?.();
  unsubscribe = null;
  // Se espera a los cambios en curso para que ningún aviso se programe después de la cancelación.
  await observer.idle();
  await cancelAllReminders();
}
