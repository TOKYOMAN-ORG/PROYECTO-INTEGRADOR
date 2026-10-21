import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ApiError, NetworkError } from '../../services/http-client.ts';
import {
  createEvent,
  describeCreateEventError,
  type CreateEventInput,
} from './events-api.ts';
import type { Event } from './event-types.ts';

const realFetch = globalThis.fetch;
const realApiUrl = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = realApiUrl;
});

const sampleInput: CreateEventInput = {
  title: 'Reunión de avance',
  description: 'Revisión general',
  date: '2026-10-25',
  time: '14:30',
  category: 'trabajo',
  priority: 'alta',
};

const sampleEvent: Event = {
  id: 'ev-1',
  userId: 'user-1',
  ...sampleInput,
  description: sampleInput.description ?? null,
  createdAt: '2026-10-21T10:00:00.000Z',
  updatedAt: '2026-10-21T10:00:00.000Z',
};

describe('createEvent', () => {
  it('envía POST /api/events con Authorization: Bearer y el body en JSON', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(sampleEvent), { status: 201 });
    }) as unknown as typeof fetch;

    const result = await createEvent(sampleInput, 'mock-jwt-token');

    assert.deepEqual(result, sampleEvent);
    assert.equal(calls[0].url, 'http://api.test/api/events');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(
      (calls[0].init.headers as Record<string, string>)?.Authorization,
      'Bearer mock-jwt-token',
    );
  });

  it('rechaza con ApiError 401 si no se proporciona token', async () => {
    await assert.rejects(
      async () => createEvent(sampleInput, ''),
      (err: unknown) => err instanceof ApiError && err.status === 401,
    );
  });
});

describe('describeCreateEventError', () => {
  it('traduce errores 400 por campo del backend', () => {
    const error = new ApiError(400, 'Error de validación', {
      errors: {
        title: ['El título no puede superar 100 caracteres'],
        date: ['La fecha debe tener el formato YYYY-MM-DD'],
      },
    });

    const result = describeCreateEventError(error);
    assert.deepEqual(result.fields, {
      title: 'El título no puede superar 100 caracteres',
      date: 'La fecha debe tener el formato YYYY-MM-DD',
    });
  });

  it('traduce error 401 como sesión expirada', () => {
    const error = new ApiError(401, 'Unauthorized');
    const result = describeCreateEventError(error);
    assert.equal(
      result.message,
      'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.',
    );
  });

  it('traduce NetworkError como error de conexión', () => {
    const error = new NetworkError('Timeout');
    const result = describeCreateEventError(error);
    assert.equal(
      result.message,
      'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
    );
  });
});
