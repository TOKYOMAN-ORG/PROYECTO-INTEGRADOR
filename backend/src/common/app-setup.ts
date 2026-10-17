import {
  BadRequestException,
  ValidationPipe,
  type INestApplication,
  type ValidationError,
} from '@nestjs/common';

export const API_PREFIX = 'api';

/**
 * 400 con `message` (lista plana, como el formato por defecto de Nest) y `errors` (mensajes por campo,
 * para que el cliente los muestre junto a cada input).
 * shortcut: solo campos de primer nivel, no recorre DTO anidados; ampliar cuando exista un DTO anidado.
 */
function validationException(errors: ValidationError[]): BadRequestException {
  const byField = Object.fromEntries(
    errors.map(({ property, constraints }) => [
      property,
      Object.values(constraints ?? {}),
    ]),
  );
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: Object.values(byField).flat(),
    errors: byField,
  });
}

/** Configuración HTTP compartida por el arranque real (`main.ts`) y las pruebas e2e. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: validationException,
    }),
  );
}
