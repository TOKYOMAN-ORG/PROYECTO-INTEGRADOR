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

import * as Notifications from 'expo-notifications';

export const REMINDERS_CHANNEL_ID = 'reminders';

let configuration: Promise<void> | null = null;
let permissionRequest: Promise<boolean> | null = null;

/** Configura el handler de primer plano y el canal de Android; idempotente. */
export function configureNotifications(): Promise<void> {
  configuration ??= (async () => {
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      await Notifications.setNotificationChannelAsync(REMINDERS_CHANNEL_ID, {
        name: 'Recordatorios',
        importance: Notifications.AndroidImportance.HIGH,
      });
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
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('No se pudieron cancelar los recordatorios', error);
  }
}
