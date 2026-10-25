import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule, ObserveInstrument } from './app.module.js';
import { configureApp } from './common/app-setup.js';
import type { AppConfigService } from './config/app-config.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });
  configureApp(app);
  // La web de Expo se sirve en otro origen/puerto (p. ej. http://localhost:8081) y el navegador exige cabeceras
  // CORS antes de exponer la respuesta. La API autentica con Bearer tokens (no cookies), así que abrir el origen es seguro.
  app.enableCors();
  // Necesario para que SIGTERM/SIGINT ejecuten onApplicationShutdown y se cierre el pool.
  app.enableShutdownHooks();
  const config = app.get<AppConfigService>(ConfigService);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
