import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/app-setup.js';
import { DatabaseConnection } from '../src/database/database-connection.js';

const USER_A = { id: '7f1c2b34-0000-4000-8000-000000000001', name: 'Ana', email: 'ana@mail.com' };
const USER_B = { id: '7f1c2b34-0000-4000-8000-000000000002', name: 'Beto', email: 'beto@mail.com' };

const EVENTS = [
  {
    id: '99999999-9999-4000-8000-000000000001',
    userId: USER_A.id,
    title: 'Revisión, "avance" y cierre',
    description: '=HYPERLINK("http://malicioso")',
    date: '2026-10-25',
    time: '10:00',
    category: 'trabajo',
    priority: 'alta',
    createdAt: '2026-10-20T09:00:00.000Z',
    updatedAt: '2026-10-20T09:00:00.000Z',
  },
  {
    id: '99999999-9999-4000-8000-000000000002',
    userId: USER_B.id,
    title: 'Evento privado de Beto',
    description: 'Notas confidenciales',
    date: '2026-10-26',
    time: '09:00',
    category: 'personal',
    priority: 'media',
    createdAt: '2026-10-20T10:00:00.000Z',
    updatedAt: '2026-10-20T10:00:00.000Z',
  },
];

describe('Exportación de la agenda (e2e) — SCRUM-58 / SCRUM-66', () => {
  const database = { query: vi.fn() };
  let app: INestApplication<App>;
  let tokenA: string;
  let tokenB: string;
  let expiredToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseConnection)
      .useValue(database)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    const jwt = app.get(JwtService, { strict: false });
    tokenA = await jwt.signAsync({ sub: USER_A.id });
    tokenB = await jwt.signAsync({ sub: USER_B.id });
    expiredToken = await jwt.signAsync({ sub: USER_A.id }, { expiresIn: '-1h' });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    database.query.mockReset();
    database.query.mockImplementation(async (text: string, params: unknown[] = []) => {
      if (text.includes('FROM users WHERE id = $1')) {
        const user = [USER_A, USER_B].find((u) => u.id === params[0]);
        return { rows: user ? [user] : [] };
      }
      if (text.includes('FROM events') && text.includes('WHERE id = $1 AND user_id = $2')) {
        const found = EVENTS.find((e) => e.id === params[0] && e.userId === params[1]);
        return { rows: found ? [found] : [] };
      }
      if (text.includes('FROM events') && text.includes('WHERE user_id = $1')) {
        return { rows: EVENTS.filter((e) => e.userId === params[0]) };
      }
      throw new Error(`Consulta no simulada: ${text}`);
    });
  });

  function exportQueries() {
    return database.query.mock.calls.filter(([text]) =>
      (text as string).includes('FROM events'),
    );
  }

  it('format=json responde 200 con Content-Type y Content-Disposition de JSON y solo los eventos del usuario', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events/export?format=json')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.headers['content-type']).toBe('application/json; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="agenda.json"');
    const body = JSON.parse(res.text) as Record<string, unknown>[];
    expect(body).toEqual([
      {
        id: EVENTS[0].id,
        title: EVENTS[0].title,
        description: EVENTS[0].description,
        date: '2026-10-25',
        time: '10:00',
        category: 'trabajo',
        priority: 'alta',
      },
    ]);
  });

  it('format=csv responde 200 con text/csv, encabezado, escape y fórmulas neutralizadas', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events/export?format=csv')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);

    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(res.headers['content-disposition']).toBe('attachment; filename="agenda.csv"');
    expect(res.text.split('\r\n')).toEqual([
      'id,title,description,date,time,category,priority',
      `${EVENTS[0].id},"Revisión, ""avance"" y cierre","'=HYPERLINK(""http://malicioso"")",2026-10-25,10:00,trabajo,alta`,
    ]);
  });

  it('cada usuario exporta solo sus eventos y la consulta es parametrizada con el id del token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/events/export?format=json')
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(200);

    const body = JSON.parse(res.text) as { id: string }[];
    expect(body.map((e) => e.id)).toEqual([EVENTS[1].id]);
    expect(res.text).not.toContain(EVENTS[0].title);

    const [[text, params]] = exportQueries();
    expect(text).toContain('WHERE user_id = $1');
    expect(text).not.toContain(USER_B.id);
    expect(params).toEqual([USER_B.id]);
  });

  it.each([
    ['ausente', '/api/events/export'],
    ['desconocido', '/api/events/export?format=pdf'],
    ['repetido', '/api/events/export?format=json&format=csv'],
  ])('format %s responde 400 con el detalle del campo y no consulta eventos', async (_case, url) => {
    const res = await request(app.getHttpServer())
      .get(url)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);

    expect((res.body as { errors: Record<string, string[]> }).errors.format).toEqual([
      'format debe ser json o csv',
    ]);
    expect(exportQueries()).toHaveLength(0);
  });

  it('format con propiedades no declaradas responde 400', async () => {
    await request(app.getHttpServer())
      .get('/api/events/export?format=json&userId=' + USER_B.id)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);
    expect(exportQueries()).toHaveLength(0);
  });

  it.each([
    ['sin cabecera', undefined],
    ['con token expirado', () => expiredToken],
    ['con token alterado', () => `${tokenA.slice(0, -6)}XYZ123`],
  ])('responde 401 %s', async (_case, token) => {
    const req = request(app.getHttpServer()).get('/api/events/export?format=json');
    if (token) req.set('Authorization', `Bearer ${token()}`);
    await req.expect(401);
  });

  it('GET /api/events/:id sigue funcionando y "export" no se interpreta como id', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/events/${EVENTS[0].id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect((res.body as { id: string }).id).toBe(EVENTS[0].id);

    await request(app.getHttpServer())
      .get('/api/events/no-es-uuid')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(400);
  });
});
