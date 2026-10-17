import { Logger, type OnApplicationShutdown } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

const POOL_MAX_CONNECTIONS = 10;
const POOL_IDLE_TIMEOUT_MS = 30_000;
const POOL_CONNECTION_TIMEOUT_MS = 5_000;
const QUERY_TIMEOUT_MS = 10_000;
/** Identifica las conexiones de la app en `pg_stat_activity`. */
const APPLICATION_NAME = 'secureplan-backend';

/**
 * Patrón Singleton: única instancia de la aplicación que posee el `Pool` de PostgreSQL.
 *
 * Todo acceso a la base de datos del backend pasa por `query`; el pool no se expone, así que
 * ningún otro módulo puede abrir conexiones por su cuenta.
 */
export class DatabaseConnection implements OnApplicationShutdown {
  private static instance: DatabaseConnection | undefined;

  private readonly logger = new Logger(DatabaseConnection.name);
  private readonly pool: Pool;
  private closed = false;

  private constructor(config: DatabaseConfig) {
    this.pool = new Pool({
      ...config,
      max: POOL_MAX_CONNECTIONS,
      idleTimeoutMillis: POOL_IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: POOL_CONNECTION_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
      application_name: APPLICATION_NAME,
    });
    // Sin este listener, el error de una conexión inactiva (p. ej. la base se detiene) se lanza
    // como excepción no capturada y tumba el proceso.
    this.pool.on('error', (error) => {
      this.logger.error(`Error en una conexión inactiva: ${error.message}`);
    });
  }

  /**
   * Devuelve la única instancia. La primera llamada debe recibir la configuración; las siguientes
   * pueden omitirla y, si la pasan, se ignora.
   */
  static getInstance(config?: DatabaseConfig): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      if (!config) {
        throw new Error(
          'DatabaseConnection no está inicializada: la primera llamada a getInstance() requiere la configuración.',
        );
      }
      DatabaseConnection.instance = new DatabaseConnection(config);
    }
    return DatabaseConnection.instance;
  }

  /**
   * Ejecuta una consulta parametrizada. `text` debe ser una sentencia fija con marcadores
   * `$1…$n` y los datos del usuario viajan solo en `params`; nunca se concatenan en `text`.
   */
  query<R extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<R>> {
    return this.pool.query<R>(text, params);
  }

  /** Cierra el pool y libera el Singleton; es idempotente. */
  async onApplicationShutdown(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    DatabaseConnection.instance = undefined;
    await this.pool.end();
  }
}
