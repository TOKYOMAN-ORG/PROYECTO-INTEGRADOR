import { EnvironmentVariables, validateEnv } from './env.validation.js';

const validEnv: Record<string, string> = {
  DB_HOST: 'localhost',
  DB_PORT: '5433',
  DB_NAME: 'secureplan',
  DB_USER: 'unit_test_user',
  DB_PASSWORD: 'unit-test-password',
  JWT_SECRET: 'unit-test-jwt-secret',
  JWT_EXPIRES_IN: '15m',
  PORT: '3000',
};
const REQUIRED_VARIABLES = Object.keys(validEnv);

function errorMessageOf(action: () => unknown): string {
  try {
    action();
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error('Se esperaba que la validación lanzara un error');
}

describe('validateEnv', () => {
  it('devuelve el entorno tipado con los puertos convertidos a número', () => {
    const env = validateEnv(validEnv);

    expect(env).toBeInstanceOf(EnvironmentVariables);
    expect(env.DB_HOST).toBe('localhost');
    expect(env.DB_PORT).toBe(5433);
    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('15m');
  });

  it('ignora las variables del proceso que no son del backend', () => {
    expect(() => validateEnv({ ...validEnv, HOME: '/home/x' })).not.toThrow();
  });

  it.each(REQUIRED_VARIABLES)('nombra %s cuando falta', (name) => {
    const env = { ...validEnv };
    delete env[name];

    expect(() => validateEnv(env)).toThrow(`Faltan o están vacías: ${name}`);
  });

  it.each(REQUIRED_VARIABLES)('trata %s vacía como faltante', (name) => {
    expect(() => validateEnv({ ...validEnv, [name]: '' })).toThrow(
      `Faltan o están vacías: ${name}`,
    );
  });

  it('lista todas las variables faltantes en un solo error', () => {
    const message = errorMessageOf(() => validateEnv({}));

    for (const name of REQUIRED_VARIABLES) {
      expect(message).toContain(name);
    }
  });

  it.each(['abc', '0', '-1', '70000', '3.5'])(
    'rechaza DB_PORT con el valor inválido "%s"',
    (value) => {
      expect(() => validateEnv({ ...validEnv, DB_PORT: value })).toThrow(
        'DB_PORT debe ser un puerto entero entre 1 y 65535',
      );
    },
  );

  it('rechaza PORT inválido', () => {
    expect(() => validateEnv({ ...validEnv, PORT: 'abc' })).toThrow(
      'PORT debe ser un puerto entero entre 1 y 65535',
    );
  });

  it('nunca incluye los valores de las variables en el mensaje', () => {
    const message = errorMessageOf(() =>
      validateEnv({ ...validEnv, DB_PORT: 'valor-invalido', PORT: '' }),
    );

    expect(message).not.toContain('valor-invalido');
    expect(message).not.toContain(validEnv.DB_PASSWORD);
    expect(message).not.toContain(validEnv.JWT_SECRET);
  });
});
