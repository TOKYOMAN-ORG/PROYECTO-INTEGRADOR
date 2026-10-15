import { ValidationPipe, type INestApplication } from '@nestjs/common';

export const API_PREFIX = 'api';

/** Configuración HTTP compartida por el arranque real (`main.ts`) y las pruebas e2e. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
  );
}
