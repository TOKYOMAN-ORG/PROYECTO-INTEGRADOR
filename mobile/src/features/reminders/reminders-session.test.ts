import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import type { Event } from '../events/event-types.ts';

const scheduled = new Map<string, { identifier: string }>();

mock.module('expo-notifications', {
  exports: {
    AndroidImportance: { HIGH: 6 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    setNotificationHandler: () => {},
    setNotificationChannelAsync: async () => null,
    getPermissionsAsync: async () => ({ granted: true, canAskAgain: true }),
    requestPermissionsAsync: async () => ({ granted: true }),
    scheduleNotificationAsync: async (request: { identifier: string }) => {
      scheduled.set(request.identifier, request);
      return request.identifier;
    },
    cancelScheduledNotificationAsync: async (identifier: string) => {
      scheduled.delete(identifier);
    },
    cancelAllScheduledNotificationsAsync: async () => {
      scheduled.clear();
    },
    getAllScheduledNotificationsAsync: async () => [...scheduled.values()],
  },
});

const { REMINDERS_WINDOW_DAYS, startReminders, stopReminders } = await import('./reminders-session.ts');
const { eventsSubject } = await import('../events/events-subject.ts');

const NOW = new Date(2026, 10, 1, 12, 0);
const realFetch = globalThis.fetch;
const realApiUrl = process.env.EXPO_PUBLIC_API_URL;

function makeEvent(id: string, date: string): Event {
  return {
    id,
    userId: 'user-1',
    title: `Evento ${id}`,
    description: null,
    date,
    time: '09:00',
    category: 'trabajo',
    priority: 'media',
    createdAt: '2026-10-25T10:00:00.000Z',
    updatedAt: '2026-10-25T10:00:00.000Z',
  };
}

let requestedUrls: string[] = [];

function serveEvents(events: Event[]) {
  globalThis.fetch = (async (url: string) => {
    requestedUrls.push(url);
    return new Response(JSON.stringify(events), { status: 200 });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
  scheduled.clear();
  requestedUrls = [];
});

afterEach(async () => {
  await stopReminders();
  globalThis.fetch = realFetch;
  if (realApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = realApiUrl;
});

describe('reminders-session', () => {
  it('al iniciar sesión carga la ventana de 30 días y programa sus recordatorios', async () => {
    serveEvents([makeEvent('a', '2026-11-05'), makeEvent('b', '2026-11-20')]);

    await startReminders('mock-jwt-token', NOW);

    assert.equal(REMINDERS_WINDOW_DAYS, 30);
    assert.deepEqual(requestedUrls, ['http://api.test/api/events?from=2026-11-01&to=2026-12-01']);
    assert.deepEqual([...scheduled.keys()].sort(), ['a', 'b']);
  });

  it('iniciar sesión de nuevo no duplica los recordatorios ya programados', async () => {
    serveEvents([makeEvent('a', '2026-11-05')]);

    await startReminders('mock-jwt-token', NOW);
    await startReminders('mock-jwt-token', NOW);

    assert.equal(scheduled.size, 1);
  });

  it('al cerrar sesión no queda ningún recordatorio y el observer ya no recibe cambios', async () => {
    serveEvents([makeEvent('a', '2026-11-05')]);
    await startReminders('mock-jwt-token', NOW);

    await stopReminders();
    assert.equal(scheduled.size, 0);

    eventsSubject.notify({ type: 'created', event: makeEvent('tras-cerrar', '2026-11-06') });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(scheduled.size, 0);
  });

  it('si la carga falla por falta de red no lanza y la suscripción sigue activa', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;

    await assert.doesNotReject(startReminders('mock-jwt-token', NOW));

    eventsSubject.notify({ type: 'created', event: makeEvent('luego', '2026-11-06') });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual([...scheduled.keys()], ['luego']);
  });
});
