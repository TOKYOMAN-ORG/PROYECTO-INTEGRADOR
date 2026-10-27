/**
 * Base nativa de las notificaciones locales (SCRUM-69).
 *
 * - `configureNotifications()` muestra las alertas con la app en primer plano y crea en Android el canal
 *   «Recordatorios» con importancia alta. En iOS y web crear el canal no hace nada.
 * - `ensureNotificationPermission()` pide el permiso una sola vez y devuelve si está concedido.
 *
 * Solo el módulo de recordatorios importa `expo-notifications`: las pantallas no conocen este API.
 * Ninguna función lanza: si el API nativo falla devuelven `false` y la app sigue funcionando sin avisos.
 */

import { Platform } from 'react-native';

export const REMINDERS_CHANNEL_ID = 'reminders';

let NotificationsModule: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  NotificationsModule = require('expo-notifications');
} catch (error) {
  console.warn('[reminders] expo-notifications no disponible en este entorno', error);
}

function getNotifications() {
  return NotificationsModule;
}

let configuration: Promise<void> | null = null;
let permissionRequest: Promise<boolean> | null = null;

/** Configura el handler de primer plano y el canal de Android; idempotente. */
export function configureNotifications(): Promise<void> {
  configuration ??= (async () => {
    const Notifications = getNotifications();
    if (!Notifications) return;
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      if (Platform.OS === 'android' && Notifications.setNotificationChannelAsync) {
        await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
          name: 'Recordatorios',
          importance: Notifications.AndroidImportance?.HIGH ?? 4,
        });
      }
    } catch (error) {
      console.warn('No se pudieron configurar las notificaciones locales', error);
    }
  })();
  return configuration;
}

/**
 * `true` si el permiso de notificaciones está concedido. Si aún no se decidió lo solicita una sola vez;
 * si el usuario lo niega devuelve `false` sin lanzar.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) return false;
  try {
    // En Android 13+ el canal debe existir antes de pedir el permiso para que aparezca el diálogo.
    await configureNotifications();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    permissionRequest ??= Notifications.requestPermissionsAsync().then(
      (response) => response.granted,
      () => false,
    );
    return await permissionRequest;
  } catch {
    return false;
  }
}

/** Cancela todos los recordatorios programados en el dispositivo. No lanza. */
export async function cancelAllReminders(): Promise<void> {
  const Notifications = getNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('No se pudieron cancelar los recordatorios', error);
  }
}
