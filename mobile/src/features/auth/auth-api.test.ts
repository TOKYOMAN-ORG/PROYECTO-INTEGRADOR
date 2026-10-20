import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { ApiError, NetworkError } from '../../services/http-client.ts';

// `auth-api` importa el almacén seguro, que importa `expo-secure-store` (no se puede cargar en Node): se sustituye
// por un almacén en memoria antes de cargar `auth-api`.
const items = new Map<string, string>();
let storeFails = false;

mock.module('expo-secure-store', {
  exports: {
    setItemAsync: async (key: string, value: string) => {
      if (storeFails) throw new Error('almacén no disponible');
      items.set(key, value);
    },
    getItemAsync: async (key: string) => items.get(key) ?? null,
    deleteItemAsync: async (key: string) => void items.delete(key),
  },
});

const { classifyRestoreError, describeLoginError, describeRegisterError, getMe, login, register } =
  await import('./auth-api.ts');

const realFetch = globalThis.fetch;
const realApiUrl = process.env.EXPO_PUBLIC_API_URL;

beforeEach(() => {
  process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
  items.clear();
  storeFails = false;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = realApiUrl;
});

describe('register', () => {
  it('hace POST /api/auth/register con el cuerpo en JSON y devuelve el usuario creado', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const created = { id: 'u1', name: 'Ana', email: 'ana@mail.com' };
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(created), { status: 201 });
    }) as unknown as typeof fetch;

    const user = await register({ name: 'Ana', email: 'ana@mail.com', password: 'Secreta123' });

    assert.deepEqual(user, created);
    assert.equal(calls[0].url, 'http://api.test/api/auth/register');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(
      calls[0].init.body,
      '{"name":"Ana","email":"ana@mail.com","password":"Secreta123"}',
    );
  });
});

describe('describeRegisterError', () => {
  it('400: muestra el primer mensaje del servidor bajo cada campo', () => {
    const body = {
      message: ['a', 'b', 'c'],
      errors: { name: ['Nombre mal'], email: ['Correo mal', 'otro'], password: ['Clave mal'] },
    };

    const failure = describeRegisterError(new ApiError(400, 'a. b. c', body));

    assert.deepEqual(failure, {
      fields: { name: 'Nombre mal', email: 'Correo mal', password: 'Clave mal' },
    });
  });

  it('400: ignora campos desconocidos y, sin campos conocidos, usa un mensaje general', () => {
    const failure = describeRegisterError(
      new ApiError(400, 'property role should not exist', {
        errors: { role: ['property role should not exist'] },
      }),
    );

    assert.deepEqual(failure, { fields: {}, message: 'property role should not exist' });
  });

  it('409: marca el campo de correo como ya registrado', () => {
    const failure = describeRegisterError(new ApiError(409, 'El correo ya está registrado'));

    assert.deepEqual(failure, { fields: { email: 'El correo ya está registrado' } });
  });

  it('error de red: mensaje de conexión', () => {
    const failure = describeRegisterError(new NetworkError('No se pudo conectar con la API'));

    assert.match(failure.message ?? '', /conectar con el servidor/);
    assert.deepEqual(failure.fields, {});
  });

  it('5xx y errores desconocidos: mensaje genérico que no expone el detalle del servidor', () => {
    for (const error of [new ApiError(500, 'Internal server error'), new Error('boom'), 'x']) {
      const failure = describeRegisterError(error);

      assert.equal(failure.message, 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.');
      assert.deepEqual(failure.fields, {});
    }
  });
});

describe('login', () => {
  const credentials = { email: 'ana@mail.com', password: 'Secreta123' };
  const TOKEN = 'header.payload.firma';

  const respondWith = (status: number, body: unknown) => {
    const calls: { url: string; init: RequestInit }[] = [];
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(body), { status });
    }) as unknown as typeof fetch;
    return calls;
  };

  it('hace POST /api/auth/login con el cuerpo en JSON y guarda el token en el almacén seguro', async () => {
    const calls = respondWith(200, { accessToken: TOKEN });

    await login(credentials);

    assert.equal(calls[0].url, 'http://api.test/api/auth/login');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.body, '{"email":"ana@mail.com","password":"Secreta123"}');
    assert.deepEqual([...items.values()], [TOKEN]);
  });

  it('no devuelve el token, no lo envía en la URL ni lo escribe en la consola', async () => {
    const calls = respondWith(200, { accessToken: TOKEN });
    const logged: unknown[][] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      mock.method(console, method, (...args: unknown[]) => void logged.push(args)),
    );

    const result = await login(credentials);
    spies.forEach((spy) => spy.mock.restore());

    assert.equal(result, undefined);
    assert.ok(!calls[0].url.includes(TOKEN));
    assert.deepEqual(logged, []);
  });

  it('con credenciales inválidas rechaza con ApiError 401 y no guarda ningún token', async () => {
    respondWith(401, { statusCode: 401, message: 'Credenciales inválidas' });

    await assert.rejects(login(credentials), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      return true;
    });
    assert.equal(items.size, 0);
  });

  it('con la API apagada rechaza con NetworkError y no guarda ningún token', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;

    await assert.rejects(login(credentials), NetworkError);
    assert.equal(items.size, 0);
  });

  it('si el almacén seguro falla, rechaza sin incluir el token en el error', async () => {
    respondWith(200, { accessToken: TOKEN });
    storeFails = true;

    await assert.rejects(login(credentials), (error: unknown) => {
      assert.ok(error instanceof Error);
      assert.ok(!error.message.includes(TOKEN));
      return true;
    });
    assert.equal(items.size, 0);
  });

  it('una respuesta 200 sin un accessToken de texto no guarda nada y rechaza', async () => {
    for (const body of [{}, { accessToken: '' }, { accessToken: 123 }, null]) {
      respondWith(200, body);

      await assert.rejects(login(credentials), ApiError);
      assert.equal(items.size, 0);
    }
  });
});

describe('describeLoginError', () => {
  it('401: "Credenciales inválidas"', () => {
    assert.equal(describeLoginError(new ApiError(401, 'Credenciales inválidas')), 'Credenciales inválidas');
  });

  it('400: muestra el mensaje del servidor', () => {
    assert.equal(
      describeLoginError(new ApiError(400, 'La contraseña no puede superar 128 caracteres')),
      'La contraseña no puede superar 128 caracteres',
    );
  });

  it('error de red: mensaje de conexión', () => {
    assert.match(describeLoginError(new NetworkError('No se pudo conectar con la API')), /conectar con el servidor/);
  });

  it('5xx y errores desconocidos: mensaje genérico que no expone el detalle', () => {
    for (const error of [new ApiError(500, 'Internal server error'), new Error('boom'), 'x']) {
      assert.equal(describeLoginError(error), 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.');
    }
  });
});

describe('getMe', () => {
  const TOKEN = 'header.payload.firma';

  it('hace GET /api/auth/me con Authorization: Bearer y devuelve el usuario', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const user = { id: 'u1', name: 'Ana', email: 'ana@mail.com' };
    globalThis.fetch = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(user), { status: 200 });
    }) as unknown as typeof fetch;

    const me = await getMe(TOKEN);

    assert.deepEqual(me, user);
    assert.equal(calls[0].url, 'http://api.test/api/auth/me');
    assert.equal(calls[0].init.method, 'GET');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, `Bearer ${TOKEN}`);
  });

  it('con token inválido el backend responde 401 y se propaga como ApiError', async () => {
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ statusCode: 401, message: 'No autorizado' }), {
        status: 401,
      })) as unknown as typeof fetch;

    await assert.rejects(getMe('malformado'), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 401);
      return true;
    });
  });

  it('con la API apagada rechaza con NetworkError', async () => {
    globalThis.fetch = (async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;

    await assert.rejects(getMe(TOKEN), NetworkError);
  });
});

describe('classifyRestoreError', () => {
  it('401 → invalid: el token ya no sirve y debe borrarse', () => {
    assert.equal(classifyRestoreError(new ApiError(401, 'No autorizado')), 'invalid');
  });

  it('error de red → offline: se conserva el token y se ofrece reintento', () => {
    assert.equal(classifyRestoreError(new NetworkError('No se pudo conectar con la API')), 'offline');
  });

  it('5xx u otros errores → unknown: no se cierra la sesión por un fallo transitorio', () => {
    for (const error of [new ApiError(500, 'Internal server error'), new Error('boom'), 'x']) {
      assert.equal(classifyRestoreError(error), 'unknown');
    }
  });
});
