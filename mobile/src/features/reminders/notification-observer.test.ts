import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

import type { Event } from '../events/event-types.ts';

// `expo-notifications` simulado: un mapa de notificaciones programadas por identificador.
type Scheduled = {
  identifier: string;
  content: { title: string; data?: Record<string, unknown> };
  trigger: { type: string; date: Date; channelId?: string };
};
const scheduled = new Map<string, Scheduled>();
let granted = true;

mock.module('expo-notifications', {
  exports: {
    AndroidImportance: { HIGH: 6 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationHandler: () => {},
    setNotificationChannelAsync: async () => null,
    getPermissionsAsync: async () => ({ granted, canAskAgain: false }),
    requestPermissionsAsync: async () => ({ granted }),
    scheduleNotificationAsync: async (request: Scheduled) => {
      scheduled.set(request.identifier, request);
      return request.identifier;
    },
    cancelScheduledNotificationAsync: async (identifier: string) => {
      scheduled.delete(identifier);
    },
    getAllScheduledNotificationsAsync: async () =>
      [...scheduled.values()].map(({ identifier, content }) => ({ identifier, content })),
  },
});

const { NotificationObserver } = await import('./notification-observer.ts');
const { getReminderDate } = await import('./reminder-date.ts');
const { REMINDERS_CHANNEL_ID } = await import('./notifications.ts');

const NOW = new Date(2026, 10, 1, 12, 0); // 1 de noviembre de 2026, 12:00 local

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'ev-1',
    userId: 'user-1',
    title: 'Reunión de avance',
    description: null,
    date: '2026-11-10',
    time: '09:00',
    category: 'trabajo',
    priority: 'alta',
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
    ...overrides,
  };
}

beforeEach(() => {
  scheduled.clear();
  granted = true;
});

describe('getReminderDate', () => {
  it('devuelve las 08:50 locales para un evento de las 09:00', () => {
    const reminder = getReminderDate('2026-11-10', '09:00', NOW);
    assert.deepEqual(reminder, new Date(2026, 10, 10, 8, 50));
  });

  it('acepta horas con segundos', () => {
    assert.deepEqual(getReminderDate('2026-11-10', '09:00:00', NOW), new Date(2026, 10, 10, 8, 50));
  });

  it('devuelve null si el instante de aviso ya pasó', () => {
    assert.equal(getReminderDate('2026-11-01', '12:05', NOW), null);
    assert.equal(getReminderDate('2026-10-31', '09:00', NOW), null);
  });

  it('devuelve null con fecha u hora inválidas', () => {
    assert.equal(getReminderDate('10/11/2026', '09:00', NOW), null);
    assert.equal(getReminderDate('2026-11-10', '9am', NOW), null);
  });
});

describe('NotificationObserver', () => {
  it('created programa una notificación con el id del evento, su título y disparo 10 minutos antes', async () => {
    const observer = new NotificationObserver(() => NOW);
    observer.update({ type: 'created', event: makeEvent() });
    await observer.idle();

    const notification = scheduled.get('ev-1');
    assert.ok(notification);
    assert.equal(notification.content.title, 'Reunión de avance');
    assert.equal(notification.trigger.type, 'date');
    assert.equal(notification.trigger.channelId, REMINDERS_CHANNEL_ID);
    assert.deepEqual(notification.trigger.date, new Date(2026, 10, 10, 8, 50));
  });

  it('updated reemplaza el recordatorio anterior sin dejar duplicados', async () => {
    const observer = new NotificationObserver(() => NOW);
    observer.update({ type: 'created', event: makeEvent() });
    observer.update({ type: 'updated', event: makeEvent({ time: '18:30', title: 'Reunión movida' }) });
    await observer.idle();

    assert.equal(scheduled.size, 1);
    const notification = scheduled.get('ev-1');
    assert.equal(notification?.content.title, 'Reunión movida');
    assert.deepEqual(notification?.trigger.date, new Date(2026, 10, 10, 18, 20));
  });

  it('updated a una hora ya pasada cancela el recordatorio y no programa otro', async () => {
    const observer = new NotificationObserver(() => NOW);
    observer.update({ type: 'created', event: makeEvent() });
    observer.update({ type: 'updated', event: makeEvent({ date: '2026-10-01' }) });
    await observer.idle();

    assert.equal(scheduled.size, 0);
  });

  it('deleted cancela el recordatorio del evento', async () => {
    const observer = new NotificationObserver(() => NOW);
    observer.update({ type: 'created', event: makeEvent() });
    observer.update({ type: 'deleted', id: 'ev-1' });
    await observer.idle();

    assert.equal(scheduled.size, 0);
  });

  it('loaded programa solo los eventos futuros que no tienen recordatorio', async () => {
    const observer = new NotificationObserver(() => NOW);
    observer.update({ type: 'created', event: makeEvent({ id: 'ya-programado', title: 'Original' }) });
    observer.update({
      type: 'loaded',
      events: [
        makeEvent({ id: 'ya-programado', title: 'No debe reprogramarse' }),
        makeEvent({ id: 'futuro', date: '2026-11-15' }),
        makeEvent({ id: 'pasado', date: '2026-10-20' }),
      ],
    });
    await observer.idle();

    assert.deepEqual([...scheduled.keys()].sort(), ['futuro', 'ya-programado']);
    assert.equal(scheduled.get('ya-programado')?.content.title, 'Original');
  });

  it('created de un evento cuyo aviso ya pasó no programa nada', async () => {
    const observer = new NotificationObserver(() => NOW);
    observer.update({ type: 'created', event: makeEvent({ date: '2026-11-01', time: '12:05' }) });
    await observer.idle();

    assert.equal(scheduled.size, 0);
  });

  it('sin permiso concedido no programa nada y no lanza', async () => {
    granted = false;
    const observer = new NotificationObserver(() => NOW);

    assert.doesNotThrow(() => {
      observer.update({ type: 'created', event: makeEvent() });
      observer.update({ type: 'loaded', events: [makeEvent({ id: 'otro' })] });
    });
    await observer.idle();

    assert.equal(scheduled.size, 0);
  });

  it('un fallo del API nativo no se propaga y no detiene los cambios siguientes', async () => {
    const observer = new NotificationObserver(() => NOW);
    const realWarn = console.warn;
    console.warn = () => {};
    try {
      observer.update({ type: 'created', event: makeEvent({ date: 'fecha-rota' }) });
      observer.update({ type: 'loaded', events: null as unknown as Event[] });
      observer.update({ type: 'created', event: makeEvent({ id: 'ev-2' }) });
      await observer.idle();
    } finally {
      console.warn = realWarn;
    }

    assert.deepEqual([...scheduled.keys()], ['ev-2']);
  });
});
