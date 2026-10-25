import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ApiError, NetworkError } from '../../services/http-client.ts';
import {
  createEvent,
  deleteEvent,
  getEvents,
  updateEvent,
  type CreateEventInput,
} from './events-api.ts';
import type { Event } from './event-types.ts';
import { eventsSubject, type EventChange } from './events-subject.ts';

const realFetch = globalThis.fetch;
const realApiUrl = process.env.EXPO_PUBLIC_API_URL;

let received: EventChange[] = [];
let unsubscribe = () => {};

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
  received = [];
  unsubscribe = eventsSubject.subscribe({
    update(change) {
      received.push(change);
    },
  });
});

afterEach(() => {
  unsubscribe();
  globalThis.fetch = realFetch;
  if (realApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = realApiUrl;
});

const sampleInput: CreateEventInput = {
  title: 'Reunión de avance',
  date: '2026-10-30',
  time: '10:00',
  category: 'trabajo',
  priority: 'alta',
};

const sampleEvent: Event = {
  id: 'ev-1',
  userId: 'user-1',
  ...sampleInput,
  description: null,
  createdAt: '2026-10-25T10:00:00.000Z',
  updatedAt: '2026-10-25T10:00:00.000Z',
};

function respondWith(body: unknown, status: number) {
  globalThis.fetch = (async () =>
    new Response(body === null ? null : JSON.stringify(body), {
      status,
    })) as unknown as typeof fetch;
}

function failNetwork() {
  globalThis.fetch = (async () => {
    throw new TypeError('Network request failed');
  }) as unknown as typeof fetch;
}

describe('events-api publica los cambios de la agenda en el Subject', () => {
  it('getEvents publica loaded con los eventos recibidos', async () => {
    respondWith([sampleEvent], 200);
    await getEvents('mock-jwt-token');
    assert.deepEqual(received, [{ type: 'loaded', events: [sampleEvent] }]);
  });

  it('createEvent publica created con el evento devuelto por la API', async () => {
    respondWith(sampleEvent, 201);
    await createEvent(sampleInput, 'mock-jwt-token');
    assert.deepEqual(received, [{ type: 'created', event: sampleEvent }]);
  });

  it('updateEvent publica updated con el evento devuelto por la API', async () => {
    respondWith(sampleEvent, 200);
    await updateEvent('ev-1', sampleInput, 'mock-jwt-token');
    assert.deepEqual(received, [{ type: 'updated', event: sampleEvent }]);
  });

  it('deleteEvent publica deleted con el id', async () => {
    respondWith(null, 204);
    await deleteEvent('ev-1', 'mock-jwt-token');
    assert.deepEqual(received, [{ type: 'deleted', id: 'ev-1' }]);
  });

  it('no publica nada y propaga ApiError cuando la API responde con error', async () => {
    respondWith({ message: 'Not Found' }, 404);
    await assert.rejects(
      updateEvent('ev-1', sampleInput, 'mock-jwt-token'),
      (err: unknown) => err instanceof ApiError && err.status === 404,
    );
    respondWith({ message: 'Not Found' }, 404);
    await assert.rejects(
      deleteEvent('ev-1', 'mock-jwt-token'),
      (err: unknown) => err instanceof ApiError && err.status === 404,
    );
    assert.deepEqual(received, []);
  });

  it('no publica nada y propaga NetworkError cuando falla la conexión', async () => {
    failNetwork();
    await assert.rejects(getEvents('mock-jwt-token'), NetworkError);
    await assert.rejects(createEvent(sampleInput, 'mock-jwt-token'), NetworkError);
    assert.deepEqual(received, []);
  });

  it('no publica nada si no hay token', async () => {
    await assert.rejects(getEvents(''), ApiError);
    assert.deepEqual(received, []);
  });
});
