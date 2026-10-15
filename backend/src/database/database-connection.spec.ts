import { Logger } from '@nestjs/common';
import {
  DatabaseConnection,
  type DatabaseConfig,
} from './database-connection.js';

const pg = vi.hoisted(() => ({
  Pool: vi.fn(),
  query: vi.fn(),
  end: vi.fn(),
  on: vi.fn(),
}));
vi.mock('pg', () => ({ Pool: pg.Pool }));

const config: DatabaseConfig = {
  host: 'localhost',
  port: 5433,
  database: 'secureplan',
  user: 'unit_test_user',
  password: 'unit-test-password',
};

describe('DatabaseConnection', () => {
  let connection: DatabaseConnection | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    pg.Pool.mockImplementation(function () {
      return { query: pg.query, end: pg.end, on: pg.on };
    });
    pg.end.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await connection?.onApplicationShutdown();
    connection = undefined;
  });

  describe('getInstance', () => {
    it('devuelve siempre el mismo objeto', () => {
      connection = DatabaseConnection.getInstance(config);

      expect(DatabaseConnection.getInstance()).toBe(connection);
      expect(DatabaseConnection.getInstance()).toBe(
        DatabaseConnection.getInstance(),
      );
    });

    it('crea un único Pool aunque se pida la instancia varias veces', () => {
      connection = DatabaseConnection.getInstance(config);
      DatabaseConnection.getInstance();
      DatabaseConnection.getInstance(config);

      expect(pg.Pool).toHaveBeenCalledTimes(1);
    });

    it('ignora una configuración distinta en llamadas posteriores', () => {
      connection = DatabaseConnection.getInstance(config);

      const second = DatabaseConnection.getInstance({
        ...config,
        host: 'otro-host',
      });

      expect(second).toBe(connection);
      expect(pg.Pool).toHaveBeenCalledTimes(1);
    });

    it('lanza un error si se pide antes de inicializarla con la configuración', () => {
      expect(() => DatabaseConnection.getInstance()).toThrow(
        'requiere la configuración',
      );
      expect(pg.Pool).not.toHaveBeenCalled();
    });
  });

  describe('Pool', () => {
    it('se crea con las credenciales recibidas y con límites definidos', () => {
      connection = DatabaseConnection.getInstance(config);

      expect(pg.Pool).toHaveBeenCalledWith(
        expect.objectContaining({
          ...config,
          max: expect.any(Number),
          idleTimeoutMillis: expect.any(Number),
          connectionTimeoutMillis: expect.any(Number),
          query_timeout: expect.any(Number),
          application_name: 'secureplan-backend',
        }),
      );
      expect(pg.Pool.mock.calls[0][0].max).toBeGreaterThan(0);
    });

    it('registra un listener de error para que una conexión inactiva caída no tumbe el proceso', () => {
      const logError = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      connection = DatabaseConnection.getInstance(config);

      expect(pg.on).toHaveBeenCalledWith('error', expect.any(Function));
      const onError = pg.on.mock.calls[0][1];
      expect(() => onError(new Error('terminating connection'))).not.toThrow();
      expect(logError).toHaveBeenCalledWith(
        expect.stringContaining('terminating connection'),
      );
      logError.mockRestore();
    });
  });

  describe('query', () => {
    it('delega en el pool con el texto y los parámetros', async () => {
      pg.query.mockResolvedValue({ rows: [{ one: 1 }] });
      connection = DatabaseConnection.getInstance(config);

      const result = await connection.query('SELECT $1::int AS one', [1]);

      expect(pg.query).toHaveBeenCalledWith('SELECT $1::int AS one', [1]);
      expect(result.rows).toEqual([{ one: 1 }]);
    });

    it('usa una lista de parámetros vacía cuando no se indican', async () => {
      pg.query.mockResolvedValue({ rows: [] });
      connection = DatabaseConnection.getInstance(config);

      await connection.query('SELECT 1');

      expect(pg.query).toHaveBeenCalledWith('SELECT 1', []);
    });

    it('propaga el error del pool', async () => {
      pg.query.mockRejectedValue(new Error('conexión rechazada'));
      connection = DatabaseConnection.getInstance(config);

      await expect(connection.query('SELECT 1')).rejects.toThrow(
        'conexión rechazada',
      );
    });
  });

  describe('onApplicationShutdown', () => {
    it('cierra el pool una sola vez aunque se invoque varias veces', async () => {
      connection = DatabaseConnection.getInstance(config);

      await connection.onApplicationShutdown();
      await connection.onApplicationShutdown();

      expect(pg.end).toHaveBeenCalledTimes(1);
    });

    it('libera el Singleton: después hay que inicializarlo de nuevo', async () => {
      const first = DatabaseConnection.getInstance(config);

      await first.onApplicationShutdown();

      expect(() => DatabaseConnection.getInstance()).toThrow();
      connection = DatabaseConnection.getInstance(config);
      expect(connection).not.toBe(first);
      expect(pg.Pool).toHaveBeenCalledTimes(2);
    });
  });
});
