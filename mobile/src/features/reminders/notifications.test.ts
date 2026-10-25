import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';

// `expo-notifications` necesita los módulos nativos de Expo y no se puede cargar en Node: se simula.
const calls = {
  handler: 0,
  channels: [] as { id: string; importance: number }[],
  requests: 0,
  cancelAll: 0,
};
let permission = { granted: false, canAskAgain: true };
let requestResult = { granted: false };

mock.module('expo-notifications', {
  exports: {
    AndroidImportance: { HIGH: 6 },
    setNotificationHandler: (handler: { handleNotification: () => Promise<unknown> }) => {
      calls.handler += 1;
      lastHandler = handler;
    },
    setNotificationChannelAsync: async (id: string, channel: { importance: number }) => {
      calls.channels.push({ id, importance: channel.importance });
      return null;
    },
    getPermissionsAsync: async () => permission,
    requestPermissionsAsync: async () => {
      calls.requests += 1;
      permission = { granted: requestResult.granted, canAskAgain: true };
      return requestResult;
    },
    cancelAllScheduledNotificationsAsync: async () => {
      calls.cancelAll += 1;
    },
  },
});

let lastHandler: { handleNotification: () => Promise<unknown> } | null = null;

const { REMINDERS_CHANNEL_ID, cancelAllReminders, configureNotifications, ensureNotificationPermission } =
  await import('./notifications.ts');

describe('notifications', () => {
  it('configura una sola vez el handler de primer plano y el canal de Android con importancia alta', async () => {
    await configureNotifications();
    await configureNotifications();

    assert.equal(calls.handler, 1);
    assert.deepEqual(calls.channels, [{ id: REMINDERS_CHANNEL_ID, importance: 6 }]);
  });

  it('con la app en primer plano la notificación se muestra y no se descarta en silencio', async () => {
    const behavior = (await lastHandler?.handleNotification()) as Record<string, boolean>;
    assert.equal(behavior.shouldShowBanner, true);
    assert.equal(behavior.shouldShowList, true);
  });

  it('si el usuario niega el permiso devuelve false sin lanzar y no lo vuelve a pedir', async () => {
    permission = { granted: false, canAskAgain: true };
    requestResult = { granted: false };

    assert.equal(await ensureNotificationPermission(), false);
    assert.equal(await ensureNotificationPermission(), false);
    assert.equal(calls.requests, 1);
  });

  it('devuelve true sin pedir de nuevo cuando el permiso ya está concedido', async () => {
    permission = { granted: true, canAskAgain: true };

    assert.equal(await ensureNotificationPermission(), true);
    assert.equal(calls.requests, 1);
  });

  it('devuelve false sin pedir cuando el sistema ya no permite preguntar', async () => {
    permission = { granted: false, canAskAgain: false };

    assert.equal(await ensureNotificationPermission(), false);
    assert.equal(calls.requests, 1);
  });

  it('cancelAllReminders cancela todos los recordatorios programados', async () => {
    await cancelAllReminders();
    assert.equal(calls.cancelAll, 1);
  });
});
