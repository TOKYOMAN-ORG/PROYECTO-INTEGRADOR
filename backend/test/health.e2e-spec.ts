import { Logger, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/app-setup.js';
import { DatabaseConnection } from '../src/database/database-connection.js';

const SERVICE_UNAVAILABLE = {
  statusCode: 503,
  message: 'Service Unavailable',
};

async function createApp(
  database?: Pick<DatabaseConnection, 'query'>,
): Promise<INestApplication<App>> {
  const builder = Test.createTestingModule({ imports: [AppModule] });
  if (database) {
    builder.overrideProvider(DatabaseConnection).useValue(database);
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

describe('GET /api/health (e2e)', () => {
  let app: INestApplication<App>;
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    await app.close();
    logError.mockRestore();
  });

  it('responde 200 cuando la base de datos contesta', async () => {
    const database = { query: vi.fn().mockResolvedValue({ rows: [] }) };
    app = await createApp(database);

    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200, { status: 'ok' });

    expect(database.query).toHaveBeenCalledWith('SELECT 1');
  });

  it('responde 503 sin exponer el mensaje de error de la base de datos', async () => {
    const database = {
      query: vi
        .fn()
        .mockRejectedValue(
          new Error('connect ECONNREFUSED 127.0.0.1:5433 password for "app"'),
        ),
    };
    app = await createApp(database);

    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(503);

    expect(response.body).toEqual(SERVICE_UNAVAILABLE);
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it('responde 503 con el Singleton real cuando no hay base de datos accesible', async () => {
    app = await createApp();

    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(503);

    expect(response.body).toEqual(SERVICE_UNAVAILABLE);
    expect(JSON.stringify(response.body)).not.toMatch(
      /ECONNREFUSED|127\.0\.0\.1/,
    );
  }, 15_000);

  it('cierra el pool y libera el Singleton al cerrar la aplicación', async () => {
    app = await createApp();
    expect(() => DatabaseConnection.getInstance()).not.toThrow();

    await app.close();

    expect(() => DatabaseConnection.getInstance()).toThrow(
      'requiere la configuración',
    );
  });
});
