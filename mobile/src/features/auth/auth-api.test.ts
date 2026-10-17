import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { ApiError, NetworkError } from '../../services/http-client.ts';
import { describeRegisterError, register } from './auth-api.ts';

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
