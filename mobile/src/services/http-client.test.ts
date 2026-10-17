import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ApiError, NetworkError, request } from './http-client.ts';

const realFetch = globalThis.fetch;
const realApiUrl = process.env.EXPO_PUBLIC_API_URL;

let calls: { url: string; init: RequestInit }[];

function mockFetch(impl: (init: RequestInit) => Promise<Response | object>) {
  calls = [];
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return impl(init);
  }) as unknown as typeof fetch;
}

/** Promesa que se rechaza cuando el cliente aborta la petición (timeout). */
function hangUntilAborted(init: RequestInit): Promise<never> {
  return new Promise((_resolve, reject) => {
    init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
  });
}

async function failure(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('se esperaba un rechazo');
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = realApiUrl;
});

describe('request: éxito', () => {
  it('GET devuelve el JSON parseado sin Content-Type', async () => {
    mockFetch(async () => json({ status: 'ok' }));

    assert.deepEqual(await request('/api/health'), { status: 'ok' });
    assert.equal(calls[0].url, 'http://api.test/api/health');
    assert.equal(calls[0].init.method, 'GET');
    assert.equal(calls[0].init.body, undefined);
    assert.equal((calls[0].init.headers as Record<string, string>)['Content-Type'], undefined);
  });

  it('POST serializa el cuerpo como JSON y respeta las cabeceras del llamador', async () => {
    mockFetch(async () => json({ ok: true }, 201));

    await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c' },
      headers: { 'X-Test': '1' },
    });

    assert.equal(calls[0].init.body, '{"email":"a@b.c"}');
    assert.deepEqual(calls[0].init.headers, {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test': '1',
    });
  });

  it('une base y ruta sin duplicar ni omitir la barra', async () => {
    mockFetch(async () => json({}));
    process.env.EXPO_PUBLIC_API_URL = 'http://api.test///';

    await request('/api/a');
    await request('api/b');

    assert.deepEqual(
      calls.map((c) => c.url),
      ['http://api.test/api/a', 'http://api.test/api/b'],
    );
  });

  it('una respuesta 204 sin cuerpo devuelve undefined', async () => {
    mockFetch(async () => new Response(null, { status: 204 }));

    assert.equal(await request('/api/logout', { method: 'POST' }), undefined);
  });
});

describe('request: respuestas no 2xx', () => {
  it('4xx se traduce a ApiError con status y message', async () => {
    mockFetch(async () => json({ statusCode: 401, message: 'Credenciales inválidas' }, 401));

    const error = await failure(request('/api/auth/login'));

    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 401);
    assert.equal(error.message, 'Credenciales inválidas');
  });

  it('une la lista de mensajes del ValidationPipe de NestJS', async () => {
    mockFetch(async () => json({ message: ['email must be an email', 'password too short'] }, 400));

    const error = await failure(request('/api/auth/register'));

    assert.ok(error instanceof ApiError);
    assert.equal(error.message, 'email must be an email. password too short');
  });

  it('ApiError conserva el cuerpo JSON de la respuesta (errores por campo)', async () => {
    const body = { message: ['email must be an email'], errors: { email: ['email must be an email'] } };
    mockFetch(async () => json(body, 400));

    const error = await failure(request('/api/auth/register'));

    assert.ok(error instanceof ApiError);
    assert.deepEqual(error.body, body);
  });

  it('5xx sin JSON usa un mensaje genérico con el status', async () => {
    mockFetch(async () => new Response('<html>Bad gateway</html>', { status: 502 }));

    const error = await failure(request('/api/health'));

    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 502);
    assert.equal(error.message, 'Error 502 de la API');
  });

  it('un 2xx con cuerpo que no es JSON es un ApiError, no una excepción cruda', async () => {
    mockFetch(async () => new Response('no es json', { status: 200 }));

    const error = await failure(request('/api/health'));

    assert.ok(error instanceof ApiError);
    assert.equal(error.status, 200);
  });
});

describe('request: fallos de red', () => {
  it('si fetch rechaza (sin red, host inalcanzable) lanza NetworkError', async () => {
    mockFetch(async () => {
      throw new TypeError('Network request failed');
    });

    assert.ok((await failure(request('/api/health'))) instanceof NetworkError);
  });

  it('si la API no responde lanza NetworkError dentro del timeout', async () => {
    mockFetch(hangUntilAborted);
    const start = Date.now();

    const error = await failure(request('/api/health', { timeoutMs: 50 }));

    assert.ok(error instanceof NetworkError);
    assert.match(error.message, /50 ms/);
    assert.ok(Date.now() - start < 1000);
  });

  it('el timeout también cubre la lectura del cuerpo', async () => {
    mockFetch(async (init) => ({ ok: true, status: 200, text: () => hangUntilAborted(init) }));

    const error = await failure(request('/api/health', { timeoutMs: 50 }));

    assert.ok(error instanceof NetworkError);
  });

  it('sin EXPO_PUBLIC_API_URL lanza NetworkError y no llama a fetch', async () => {
    mockFetch(async () => json({}));
    delete process.env.EXPO_PUBLIC_API_URL;

    const error = await failure(request('/api/health'));

    assert.ok(error instanceof NetworkError);
    assert.equal(calls.length, 0);
  });
});
