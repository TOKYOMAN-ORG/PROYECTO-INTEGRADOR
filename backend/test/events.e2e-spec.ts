import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { describe, beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/app-setup.js';
import { DatabaseConnection } from '../src/database/database-connection.js';

const USER = {
  id: '7f1c2b34-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
};

const VALID_EVENT = {
  title: 'Reunión de equipo',
  description: 'Planificación semanal',
  date: '2026-10-25',
  time: '10:00',
  category: 'trabajo',
  priority: 'alta',
};

describe('Eventos (e2e)', () => {
  const database = { query: vi.fn() };
  let app: INestApplication<App>;
  let jwt: JwtService;
  let validToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseConnection)
      .useValue(database)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = app.get(JwtService, { strict: false });
    validToken = await jwt.signAsync({ sub: USER.id });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    database.query.mockReset();
    database.query.mockImplementation(async (text: string, params: unknown[]) => {
      // Búsqueda de usuario por ID (JwtAuthGuard)
      if (text.includes('FROM users WHERE id = $1')) {
        return {
          rows: params[0] === USER.id ? [USER] : [],
        };
      }
      // Inserción de evento
      if (text.includes('INSERT INTO events')) {
        return {
          rows: [
            {
              id: '99999999-9999-9999-9999-999999999999',
              userId: params[0],
              title: params[1],
              description: params[2],
              date: params[3],
              time: params[4],
              category: params[5],
              priority: params[6],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        };
      }
      return { rows: [] };
    });
  });

  it('rechaza la petición sin cabecera Authorization con 401', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .send(VALID_EVENT)
      .expect(401);
  });

  it('rechaza la petición con token inválido con 401', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', 'Bearer token_invalido')
      .send(VALID_EVENT)
      .expect(401);
  });

  it('crea un evento exitosamente con 201 asociado al usuario autenticado', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${validToken}`)
      .send(VALID_EVENT)
      .expect(201);

    expect(response.body).toMatchObject({
      id: '99999999-9999-9999-9999-999999999999',
      userId: USER.id,
      title: VALID_EVENT.title,
      description: VALID_EVENT.description,
      date: VALID_EVENT.date,
      time: VALID_EVENT.time,
      category: VALID_EVENT.category,
      priority: VALID_EVENT.priority,
    });

    // Verifica que en la consulta SQL se envió el userId del token
    const insertCall = database.query.mock.calls.find((call) =>
      (call[0] as string).includes('INSERT INTO events'),
    );
    expect(insertCall).toBeDefined();
    expect(insertCall![1][0]).toBe(USER.id);
  });

  it('rechaza con 400 cuando el cuerpo incluye userId (mass assignment)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        ...VALID_EVENT,
        userId: 'otro-user-id',
      })
      .expect(400);

    expect(response.body.errors).toHaveProperty('userId');
  });

  it('rechaza con 400 cuando los campos son inválidos (detalle por campo)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/events')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        title: '',
        date: 'fecha-invalida',
        time: 'hora-invalida',
        category: 'categoria-invalida',
        priority: 'prioridad-invalida',
      })
      .expect(400);

    expect(response.body.errors).toHaveProperty('title');
    expect(response.body.errors).toHaveProperty('date');
    expect(response.body.errors).toHaveProperty('time');
    expect(response.body.errors).toHaveProperty('category');
    expect(response.body.errors).toHaveProperty('priority');
  });
});
