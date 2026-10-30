import { Logger, type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/app-setup.js';
import { EventsRepository } from '../src/events/events.repository.js';
import { UsersService } from '../src/users/users.service.js';

describe('Global Exception Filter & Error Leaks (SCRUM-75 e2e)', () => {
  let app: INestApplication<App>;
  let logErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    logErrorSpy.mockRestore();
  });

  it('un fallo simulado del repositorio responde 500 con el cuerpo genérico exacto y sin datos internos', async () => {
    const mockUser = {
      id: '7f1c2b34-0000-4000-8000-000000000001',
      name: 'Usuario Seguro',
      email: 'seguro@example.com',
    };

    const brokenRepo = {
      findAllByUserId: vi.fn().mockImplementation(() => {
        throw new Error('connect ECONNREFUSED 127.0.0.1:5432 at /home/app/src/events.repository.ts:42 (postgres connection pool failure)');
      }),
    };

    const mockUsersService = {
      findById: vi.fn().mockResolvedValue(mockUser),
    };

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EventsRepository)
      .useValue(brokenRepo)
      .overrideProvider(UsersService)
      .useValue(mockUsersService)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const jwtService = app.get(JwtService);
    const validToken = jwtService.sign({ sub: mockUser.id });

    const response = await request(app.getHttpServer())
      .get('/api/events')
      .set('Authorization', `Bearer ${validToken}`)
      .expect(500);

    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Error interno del servidor',
    });

    const bodyString = JSON.stringify(response.body);
    expect(bodyString).not.toMatch(/stack/i);
    expect(bodyString).not.toMatch(/\/home/i);
    expect(bodyString).not.toMatch(/node_modules/i);
    expect(bodyString).not.toMatch(/\.ts/i);
    expect(bodyString).not.toMatch(/ECONNREFUSED/i);
    expect(bodyString).not.toMatch(/postgres/i);

    expect(logErrorSpy).toHaveBeenCalled();
  });

  it('el JSON malformado enviado a /api/auth/login responde 400 sin texto interno del analizador', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "incompleto", invalid json}')
      .expect(400);

    expect(response.body.statusCode).toBe(400);
    expect(response.body.message).toBe('Sintaxis JSON inválida');

    const bodyString = JSON.stringify(response.body);
    expect(bodyString).not.toMatch(/Unexpected token/i);
    expect(bodyString).not.toMatch(/position/i);
    expect(bodyString).not.toMatch(/SyntaxError/i);
    expect(bodyString).not.toMatch(/\/home/i);
    expect(bodyString).not.toMatch(/\.ts/i);
  });

  it('una ruta inexistente responde 404 sin exponer datos internos ni trazas del sistema', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .get('/api/ruta-totalmente-inexistente-123')
      .expect(404);

    expect(response.body.statusCode).toBe(404);
    const bodyString = JSON.stringify(response.body);
    expect(bodyString).not.toMatch(/stack/i);
    expect(bodyString).not.toMatch(/\/home/i);
    expect(bodyString).not.toMatch(/node_modules/i);
    expect(bodyString).not.toMatch(/\.ts/i);
  });
});
