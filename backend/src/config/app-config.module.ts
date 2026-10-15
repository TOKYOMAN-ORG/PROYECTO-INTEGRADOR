import type { ConfigService } from '@nestjs/config';
import { ConfigModule } from '@nestjs/config';
import { validateEnv, type EnvironmentVariables } from './env.validation.js';

/** `ConfigService` tipado con las variables ya validadas: `get('DB_PORT', { infer: true })` es `number`. */
export type AppConfigService = ConfigService<EnvironmentVariables, true>;

/**
 * Carga el `.env` de la raíz del repositorio (el backend se ejecuta desde `backend/`) y valida el
 * entorno antes de que arranque cualquier otro módulo. Las variables ya definidas en el proceso
 * tienen prioridad sobre el archivo.
 */
export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '../.env',
  validate: validateEnv,
});
