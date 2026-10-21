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

  describe('GET /api/events', () => {
    it('rechaza con 401 si no hay token', async () => {
      await request(app.getHttpServer()).get('/api/events').expect(401);
    });

    it('devuelve los eventos del usuario con 200', async () => {
      const mockEvent = {
        id: '99999999-9999-4999-8999-999999999999',
        userId: USER.id,
        title: 'Evento 1',
        description: null,
        date: '2026-10-25',
        time: '10:00',
        category: 'trabajo',
        priority: 'alta',
      };

      database.query.mockImplementation(async (text: string, params: unknown[]) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('FROM events') && text.includes('user_id = $1')) {
          if (params[0] === USER.id) return { rows: [mockEvent] };
        }
        return { rows: [] };
      });

      const response = await request(app.getHttpServer())
        .get('/api/events?from=2026-10-01&to=2026-10-31')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual([mockEvent]);
    });

    it('rechaza con 400 cuando from es posterior a to', async () => {
      database.query.mockImplementation(async (text: string) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        return { rows: [] };
      });

      const response = await request(app.getHttpServer())
        .get('/api/events?from=2026-10-31&to=2026-10-01')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);

      expect(response.body.errors).toHaveProperty('from');
    });
  });

  describe('GET /api/events/:id', () => {
    const eventId = '99999999-9999-4999-8999-999999999999';

    it('rechaza con 401 si no hay token', async () => {
      await request(app.getHttpServer()).get(`/api/events/${eventId}`).expect(401);
    });

    it('devuelve 200 con el evento cuando pertenece al usuario autenticado', async () => {
      const mockEvent = {
        id: eventId,
        userId: USER.id,
        title: 'Evento 1',
        description: null,
        date: '2026-10-25',
        time: '10:00',
        category: 'trabajo',
        priority: 'alta',
      };

      database.query.mockImplementation(async (text: string, params: unknown[]) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('FROM events') && text.includes('user_id = $2')) {
          if (params[0] === eventId && params[1] === USER.id) {
            return { rows: [mockEvent] };
          }
        }
        return { rows: [] };
      });

      const response = await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body).toEqual(mockEvent);
    });

    it('devuelve 404 cuando el evento no existe o es de otro usuario', async () => {
      database.query.mockImplementation(async (text: string) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        return { rows: [] };
      });

      await request(app.getHttpServer())
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/events/:id', () => {
    const eventId = '99999999-9999-4999-8999-999999999999';
    const validUpdate = {
      title: 'Reunión Actualizada',
      description: 'Nuevos temas a tratar',
      date: '2026-10-28',
      time: '16:00',
      category: 'trabajo',
      priority: 'alta',
    };

    it('rechaza con 401 si no hay token', async () => {
      await request(app.getHttpServer())
        .put(`/api/events/${eventId}`)
        .send(validUpdate)
        .expect(401);
    });

    it('rechaza con 400 si el id no es un UUID válido', async () => {
      await request(app.getHttpServer())
        .put('/api/events/invalid-uuid')
        .set('Authorization', `Bearer ${validToken}`)
        .send(validUpdate)
        .expect(400);
    });

    it('rechaza con 400 si se envía userId en el cuerpo (mass-assignment)', async () => {
      await request(app.getHttpServer())
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validUpdate, userId: '00000000-0000-4000-8000-000000000000' })
        .expect(400);
    });

    it('rechaza con 400 si los campos no cumplen las reglas de validación', async () => {
      await request(app.getHttpServer())
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ ...validUpdate, date: 'fecha-invalida' })
        .expect(400);
    });

    it('devuelve 404 si el evento no existe o pertenece a otro usuario', async () => {
      database.query.mockImplementation(async (text: string) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('UPDATE events')) return { rows: [] };
        return { rows: [] };
      });

      await request(app.getHttpServer())
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(validUpdate)
        .expect(404);
    });

    it('devuelve 200 y el evento actualizado cuando el usuario es el dueño', async () => {
      const updatedMock = {
        id: eventId,
        userId: USER.id,
        ...validUpdate,
        createdAt: '2026-10-21T10:00:00.000Z',
        updatedAt: '2026-10-21T11:00:00.000Z',
      };

      database.query.mockImplementation(async (text: string, params: unknown[]) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('UPDATE events')) {
          if (params[6] === eventId && params[7] === USER.id) {
            return { rows: [updatedMock] };
          }
        }
        return { rows: [] };
      });

      const response = await request(app.getHttpServer())
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .send(validUpdate)
        .expect(200);

      expect(response.body).toEqual(updatedMock);
    });
  });

  describe('DELETE /api/events/:id', () => {
    const eventId = '99999999-9999-4999-8999-999999999999';

    it('rechaza con 401 si no hay token', async () => {
      await request(app.getHttpServer()).delete(`/api/events/${eventId}`).expect(401);
    });

    it('rechaza con 400 si el id no es un UUID válido', async () => {
      await request(app.getHttpServer())
        .delete('/api/events/invalid-uuid')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(400);
    });

    it('devuelve 404 si el evento no existe o pertenece a otro usuario', async () => {
      database.query.mockImplementation(async (text: string) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('DELETE FROM events')) return { rowCount: 0 };
        return { rows: [] };
      });

      await request(app.getHttpServer())
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });

    it('devuelve 204 cuando el usuario es el dueño y elimina el evento', async () => {
      database.query.mockImplementation(async (text: string, params: unknown[]) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('DELETE FROM events')) {
          if (params[0] === eventId && params[1] === USER.id) {
            return { rowCount: 1 };
          }
        }
        return { rows: [] };
      });

      await request(app.getHttpServer())
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(204);
    });

    it('responde 404 si se repite el DELETE del mismo evento ya eliminado', async () => {
      let deleted = false;
      database.query.mockImplementation(async (text: string, params: unknown[]) => {
        if (text.includes('FROM users WHERE id = $1')) return { rows: [USER] };
        if (text.includes('DELETE FROM events')) {
          if (!deleted && params[0] === eventId && params[1] === USER.id) {
            deleted = true;
            return { rowCount: 1 };
          }
          return { rowCount: 0 };
        }
        return { rows: [] };
      });

      // Primer DELETE -> 204
      await request(app.getHttpServer())
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(204);

      // Segundo DELETE -> 404
      await request(app.getHttpServer())
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${validToken}`)
        .expect(404);
    });
  });
});
