import { applyDecorators } from '@nestjs/common';
import { plainToInstance, Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
  validateSync,
  type ValidationArguments,
} from 'class-validator';

const MAX_PORT = 65_535;

/** Texto obligatorio: la variable no puede faltar ni venir vacía. */
const RequiredString = () => applyDecorators(IsString(), IsNotEmpty());

/** Puerto TCP: llega como texto desde el entorno y se convierte a entero. */
const Port = () => {
  const message = ({ property }: ValidationArguments) =>
    `${property} debe ser un puerto entero entre 1 y ${MAX_PORT}`;
  return applyDecorators(
    Type(() => Number),
    IsInt({ message }),
    Min(1, { message }),
    Max(MAX_PORT, { message }),
  );
};

/** Variables de entorno obligatorias del backend; ver `.env.example`. */
export class EnvironmentVariables {
  @RequiredString()
  DB_HOST: string;

  @Port()
  DB_PORT: number;

  @RequiredString()
  DB_NAME: string;

  @RequiredString()
  DB_USER: string;

  @RequiredString()
  DB_PASSWORD: string;

  @RequiredString()
  JWT_SECRET: string;

  @RequiredString()
  JWT_EXPIRES_IN: string;

  @Port()
  PORT: number;
}

/**
 * Valida el entorno al arrancar y lo devuelve ya convertido a sus tipos.
 * Si algo falla lanza un error que nombra cada variable afectada; nunca incluye sus valores.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const env = plainToInstance(EnvironmentVariables, config);
  const errors = validateSync(env);
  if (errors.length === 0) {
    return env;
  }

  const missing: string[] = [];
  const invalid: string[] = [];
  for (const { property, constraints } of errors) {
    const raw = config[property];
    if (raw === undefined || raw === '') {
      missing.push(property);
    } else {
      invalid.push(Object.values(constraints ?? {})[0] ?? property);
    }
  }

  const details = [
    missing.length > 0 && `  - Faltan o están vacías: ${missing.join(', ')}`,
    ...invalid.map((message) => `  - Valor inválido: ${message}`),
  ].filter(Boolean);

  throw new Error(
    [
      'Configuración de entorno inválida; el servidor no puede arrancar.',
      ...details,
      'Copia .env.example a .env y completa los valores (ver README.md).',
    ].join('\n'),
  );
}
