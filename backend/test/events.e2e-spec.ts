import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { describe, beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/app-setup.js';
import { DatabaseConnection } from '../src/database/database-connection.js';

interface StoredEvent {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  category: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

const USER_A = {
  id: '7f1c2b34-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
};

const USER_B = {
  id: '7f1c2b34-0000-4000-8000-000000000002',
  name: 'Beto',
  email: 'beto@mail.com',
};

const VALID_EVENT = {
  title: 'Reunión de equipo',
  description: 'Planificación semanal',
  date: '2026-10-25',
  time: '10:00',
  category: 'trabajo',
  priority: 'alta',
};

describe('Eventos (e2e) — SCRUM-38 / SCRUM-53: Aislamiento IDOR, inyecciones y seguridad', () => {
  const database = { query: vi.fn() };
  let app: INestApplication<App>;
  let jwt: JwtService;
  let tokenA: string;
  let tokenB: string;
  let expiredToken: string;
  let tamperedToken: string;

  // Almacén simulado en memoria para persistencia y verificación de estado
  let eventsStore: StoredEvent[] = [];
  let eventB: StoredEvent;
  let eventA: StoredEvent;

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

    tokenA = await jwt.signAsync({ sub: USER_A.id });
    tokenB = await jwt.signAsync({ sub: USER_B.id });
    // Token expirado con timestamp en el pasado
    expiredToken = await jwt.signAsync(
      { sub: USER_A.id },
      { expiresIn: '-1h' },
    );
    // Token alterado (firma manipulada)
    tamperedToken = `${tokenA.slice(0, -6)}XYZ123`;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    database.query.mockReset();

    // Eventos iniciales sembrados en memoria
    eventB = {
      id: '99999999-9999-4000-8000-000000000002',
      userId: USER_B.id,
      title: 'Evento Privado de Beto',
      description: 'Notas confidenciales de Beto',
      date: '2026-10-25',
      time: '10:00',
      category: 'trabajo',
      priority: 'alta',
      createdAt: '2026-10-20T10:00:00.000Z',
      updatedAt: '2026-10-20T10:00:00.000Z',
    };

    eventA = {
      id: '99999999-9999-4000-8000-000000000001',
      userId: USER_A.id,
      title: 'Evento Inicial de Ana',
      description: 'Notas de Ana',
      date: '2026-10-25',
      time: '10:00',
      category: 'personal',
      priority: 'media',
      createdAt: '2026-10-20T09:00:00.000Z',
      updatedAt: '2026-10-20T09:00:00.000Z',
    };

    eventsStore = [structuredClone(eventA), structuredClone(eventB)];

    // Simulación de base de datos en memoria respetando filtros SQL estrictos
    database.query.mockImplementation(async (text: string, params: unknown[] = []) => {
      // 1. Verificación de usuario (JwtAuthGuard)
      if (text.includes('FROM users WHERE id = $1')) {
        const userId = params[0];
        if (userId === USER_A.id) return { rows: [USER_A] };
        if (userId === USER_B.id) return { rows: [USER_B] };
        return { rows: [] };
      }

      // 2. Inserción de evento (INSERT INTO events)
      if (text.includes('INSERT INTO events')) {
        const [userId, title, description, date, time, category, priority] = params as [
          string, string, string | null, string, string, string, string
        ];
        const newEvent: StoredEvent = {
          id: randomUUID(),
          userId,
          title,
          description: description ?? null,
          date,
          time,
          category,
          priority,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        eventsStore.push(newEvent);
        return { rows: [newEvent] };
      }

      // 3. Listado por rango y usuario (SELECT ... FROM events WHERE user_id = $1)
      if (text.includes('SELECT') && text.includes('FROM events') && text.includes('user_id = $1') && !text.includes('WHERE id = $1')) {
        const [userId, from, to] = params as [string, string | null, string | null];
        const filtered = eventsStore
          .filter((e) => e.userId === userId)
          .filter((e) => (from ? e.date >= from : true))
          .filter((e) => (to ? e.date <= to : true))
          .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
        return { rows: filtered, rowCount: filtered.length };
      }

      // 4. Búsqueda por ID y usuario (SELECT ... WHERE id = $1 AND user_id = $2)
      if (text.includes('SELECT') && text.includes('FROM events') && text.includes('WHERE id = $1 AND user_id = $2')) {
        const [id, userId] = params as [string, string];
        const found = eventsStore.find((e) => e.id === id && e.userId === userId);
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
      }

      // 5. Búsqueda por ID solo (SELECT ... WHERE id = $1)
      if (text.includes('SELECT') && text.includes('FROM events') && text.includes('WHERE id = $1') && !text.includes('user_id = $2')) {
        const [id] = params as [string];
        const found = eventsStore.find((e) => e.id === id);
        return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
      }

      // 6. Actualización (UPDATE events ... WHERE id = $7 AND user_id = $8)
      if (text.includes('UPDATE events')) {
        const [title, description, date, time, category, priority, id, userId] = params as [
          string, string | null, string, string, string, string, string, string
        ];
        const idx = eventsStore.findIndex((e) => e.id === id && e.userId === userId);
        if (idx === -1) return { rows: [] };
        const updated: StoredEvent = {
          ...eventsStore[idx],
          title,
          description: description ?? null,
          date,
          time,
          category,
          priority,
          updatedAt: new Date().toISOString(),
        };
        eventsStore[idx] = updated;
        return { rows: [updated] };
      }

      // 7. Eliminación (DELETE FROM events WHERE id = $1 AND user_id = $2)
      if (text.includes('DELETE FROM events')) {
        const [id, userId] = params as [string, string];
        const idx = eventsStore.findIndex((e) => e.id === id && e.userId === userId);
        if (idx === -1) return { rowCount: 0 };
        eventsStore.splice(idx, 1);
        return { rowCount: 1 };
      }

      return { rows: [], rowCount: 0 };
    });
  });

  describe('Autenticación y tokens en todos los verbos HTTP', () => {
    it('rechaza la petición sin cabecera Authorization con 401 en POST, GET, PUT y DELETE', async () => {
      await request(app.getHttpServer()).post('/api/events').send(VALID_EVENT).expect(401);
      await request(app.getHttpServer()).get('/api/events').expect(401);
      await request(app.getHttpServer()).get(`/api/events/${eventA.id}`).expect(401);
      await request(app.getHttpServer()).put(`/api/events/${eventA.id}`).send(VALID_EVENT).expect(401);
      await request(app.getHttpServer()).delete(`/api/events/${eventA.id}`).expect(401);
    });

    it('rechaza la petición con token expirado con 401 en POST, GET, PUT y DELETE', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(VALID_EVENT)
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/events')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      await request(app.getHttpServer())
        .get(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      await request(app.getHttpServer())
        .put(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .send(VALID_EVENT)
        .expect(401);

      await request(app.getHttpServer())
        .delete(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('rechaza la petición con token alterado / inválido con 401 en POST, GET, PUT y DELETE', async () => {
      await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .send(VALID_EVENT)
        .expect(401);

      await request(app.getHttpServer())
        .get('/api/events')
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      await request(app.getHttpServer())
        .get(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);

      await request(app.getHttpServer())
        .put(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${tamperedToken}`)
        .send(VALID_EVENT)
        .expect(401);

      await request(app.getHttpServer())
        .delete(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${tamperedToken}`)
        .expect(401);
    });
  });

  describe('Aislamiento entre usuarios (Mitigación IDOR)', () => {
    it('el listado de Ana no contiene eventos de Beto aunque compartan fechas exactas', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events?from=2026-10-01&to=2026-10-31')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(eventA.id);
      expect(response.body[0].userId).toBe(USER_A.id);
      expect(response.body.some((e: StoredEvent) => e.id === eventB.id)).toBe(false);
    });

    it('el listado de Beto no contiene eventos de Ana', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events?from=2026-10-01&to=2026-10-31')
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].id).toBe(eventB.id);
      expect(response.body[0].userId).toBe(USER_B.id);
      expect(response.body.some((e: StoredEvent) => e.id === eventA.id)).toBe(false);
    });

    it('Ana no puede leer el evento de Beto por id (responde 404 y evento de Beto permanece intacto)', async () => {
      await request(app.getHttpServer())
        .get(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      // Verificación en el almacén de que el evento de Beto sigue idéntico
      const foundInStore = eventsStore.find((e) => e.id === eventB.id);
      expect(foundInStore).toEqual(eventB);
    });

    it('Ana no puede modificar el evento de Beto con PUT (responde 404 y evento de Beto permanece intacto)', async () => {
      const maliciousUpdate = {
        title: 'Intento de sobreescritura maliciosa por Ana',
        description: 'Texto alterado',
        date: '2026-10-29',
        time: '18:00',
        category: 'personal',
        priority: 'baja',
      };

      await request(app.getHttpServer())
        .put(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send(maliciousUpdate)
        .expect(404);

      // Verificación de integridad: el evento de Beto no fue modificado
      const foundInStore = eventsStore.find((e) => e.id === eventB.id);
      expect(foundInStore).toEqual(eventB);
    });

    it('Ana no puede eliminar el evento de Beto con DELETE (responde 404 y evento de Beto permanece intacto)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);

      // Verificación de integridad: el evento de Beto sigue existiendo en el almacén
      const foundInStore = eventsStore.find((e) => e.id === eventB.id);
      expect(foundInStore).toBeDefined();
      expect(foundInStore).toEqual(eventB);
    });

    it('Beto puede consultar, modificar y eliminar su propio evento exitosamente', async () => {
      // 1. GET propio -> 200
      const getRes = await request(app.getHttpServer())
        .get(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(200);
      expect(getRes.body.title).toBe(eventB.title);

      // 2. PUT propio -> 200
      const updateData = {
        title: 'Evento de Beto Modificado',
        description: 'Actualizado correctamente',
        date: '2026-10-26',
        time: '11:00',
        category: 'personal',
        priority: 'alta',
      };
      const putRes = await request(app.getHttpServer())
        .put(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .send(updateData)
        .expect(200);
      expect(putRes.body.title).toBe('Evento de Beto Modificado');

      // 3. DELETE propio -> 204
      await request(app.getHttpServer())
        .delete(`/api/events/${eventB.id}`)
        .set('Authorization', `Bearer ${tokenB}`)
        .expect(204);

      // 4. Verificación de que fue removido
      expect(eventsStore.find((e) => e.id === eventB.id)).toBeUndefined();
    });
  });

  describe('Prevención de inyecciones SQL y manejo seguro de payloads', () => {
    it('guarda cargas de inyección SQL en título como texto literal sin alterar otros registros', async () => {
      const sqlPayload = "' OR '1'='1";
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...VALID_EVENT,
          title: sqlPayload,
        })
        .expect(201);

      expect(response.body.title).toBe(sqlPayload);
      // El evento de Beto sigue existiendo intacto
      expect(eventsStore.find((e) => e.id === eventB.id)).toEqual(eventB);
    });

    it('guarda carga de destrucción SQL en título como texto literal sin ejecutar comandos', async () => {
      const dropPayload = "'; DROP TABLE events;--";
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...VALID_EVENT,
          title: dropPayload,
        })
        .expect(201);

      expect(response.body.title).toBe(dropPayload);
      // La "tabla" de eventos sigue existiendo y los registros de otros usuarios están intactos
      expect(eventsStore.find((e) => e.id === eventB.id)).toEqual(eventB);
    });

    it('guarda cargas de inyección en description como texto literal en POST y PUT', async () => {
      const injectionDescription = "prueba' OR 'a'='a'; DROP TABLE events;--";
      // En POST
      const postRes = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...VALID_EVENT,
          description: injectionDescription,
        })
        .expect(201);
      expect(postRes.body.description).toBe(injectionDescription);

      const createdId = postRes.body.id;

      // En PUT
      const putRes = await request(app.getHttpServer())
        .put(`/api/events/${createdId}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...VALID_EVENT,
          title: "Actualizado con SQL: ' OR 1=1--",
          description: injectionDescription,
        })
        .expect(200);

      expect(putRes.body.title).toBe("Actualizado con SQL: ' OR 1=1--");
      expect(putRes.body.description).toBe(injectionDescription);

      // Evento de Beto permanece inalterado
      expect(eventsStore.find((e) => e.id === eventB.id)).toEqual(eventB);
    });

    it('rechaza inyección en parámetro ID en ruta con 400 por validación de UUID sin ejecutar SQL', async () => {
      const maliciousId = "99999999-9999-4000-8000-000000000001' OR '1'='1";
      const response = await request(app.getHttpServer())
        .get(`/api/events/${encodeURIComponent(maliciousId)}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      // No expone trazas de SQL ni nombres de tablas en el cuerpo del error
      expect(JSON.stringify(response.body)).not.toMatch(/SELECT|INSERT|UPDATE|DELETE|events|pg_|syntax error/i);
    });

    it('ninguna respuesta de error expone SQL, nombres de tablas ni errores de pg', async () => {
      // 1. Error 400 de validación
      const res400 = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ title: '', date: 'invalida' })
        .expect(400);
      expect(JSON.stringify(res400.body)).not.toMatch(/SELECT|INSERT|UPDATE|DELETE|FROM events|syntax error/i);

      // 2. Error 404 no encontrado
      const res404 = await request(app.getHttpServer())
        .get('/api/events/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
      expect(JSON.stringify(res404.body)).not.toMatch(/SELECT|INSERT|UPDATE|DELETE|FROM events|syntax error/i);
    });
  });

  describe('Prevención de asignación masiva (Mass Assignment)', () => {
    it('rechaza con 400 cuando el cuerpo incluye userId en POST', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...VALID_EVENT,
          userId: USER_B.id,
        })
        .expect(400);

      expect(response.body.errors).toHaveProperty('userId');
    });

    it('rechaza con 400 cuando el cuerpo incluye userId en PUT', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          ...VALID_EVENT,
          userId: USER_B.id,
        })
        .expect(400);

      expect(response.body.errors).toHaveProperty('userId');
    });
  });

  describe('Validación de campos y reglas de negocio', () => {
    it('rechaza con 400 cuando from es posterior a to en GET /api/events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events?from=2026-10-31&to=2026-10-01')
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(400);

      expect(response.body.errors).toHaveProperty('from');
    });

    it('rechaza con 400 cuando los campos son inválidos (detalle por campo)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/events')
        .set('Authorization', `Bearer ${tokenA}`)
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

    it('responde 404 si se repite el DELETE de un evento ya eliminado', async () => {
      // Primer DELETE -> 204
      await request(app.getHttpServer())
        .delete(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(204);

      // Segundo DELETE -> 404
      await request(app.getHttpServer())
        .delete(`/api/events/${eventA.id}`)
        .set('Authorization', `Bearer ${tokenA}`)
        .expect(404);
    });
  });
});
