import { Logger, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/common/app-setup.js';
import { DatabaseConnection } from '../src/database/database-connection.js';

const VALID = { name: 'Ana', email: 'Ana@Mail.com', password: 'Secreta123' };
const STORED = {
  id: '7f1c2b34-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
};

describe('POST /api/auth/register (e2e)', () => {
  const database = { query: vi.fn() };
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DatabaseConnection)
      .useValue(database)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    database.query.mockReset();
  });

  const register = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/auth/register')
      .send(body as object);

  describe('registro válido', () => {
    it('responde 201 con { id, name, email } y sin contraseña ni hash', async () => {
      database.query.mockResolvedValue({ rows: [STORED] });

      const response = await register(VALID).expect(201);

      expect(response.body).toEqual(STORED);
      expect(JSON.stringify(response.body)).not.toMatch(
        /password|hash|Secreta123/i,
      );
    });

    it('guarda el correo en minúsculas y password_hash con prefijo $argon2id$', async () => {
      database.query.mockResolvedValue({ rows: [STORED] });

      await register(VALID).expect(201);

      const [text, params] = database.query.mock.calls[0];
      expect(text).toContain('password_hash');
      expect(params[0]).toBe('Ana');
      expect(params[1]).toBe('ana@mail.com');
      expect(params[2]).toMatch(/^\$argon2id\$/);
      expect(params).not.toContain('Secreta123');
    });

    it('recorta los espacios del nombre antes de guardarlo', async () => {
      database.query.mockResolvedValue({ rows: [STORED] });

      await register({ ...VALID, name: '  Ana  ' }).expect(201);

      expect(database.query.mock.calls[0][1][0]).toBe('Ana');
    });
  });

  describe('correo ya registrado', () => {
    it('responde 409 cuando la base reporta una violación de unicidad', async () => {
      database.query.mockRejectedValue(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );

      const response = await register(VALID).expect(409);

      expect(response.body.message).toBe('El correo ya está registrado');
    });
  });

  describe('datos inválidos: 400 con el error por campo y sin tocar la base', () => {
    it.each([
      ['correo mal formado', { ...VALID, email: 'no-es-correo' }, 'email'],
      [
        'correo de más de 255 caracteres',
        { ...VALID, email: `${'a'.repeat(250)}@mail.com` },
        'email',
      ],
      [
        'contraseña de 7 caracteres',
        { ...VALID, password: '1234567' },
        'password',
      ],
      [
        'contraseña de más de 128 caracteres',
        { ...VALID, password: 'a'.repeat(129) },
        'password',
      ],
      ['nombre vacío', { ...VALID, name: '' }, 'name'],
      ['nombre solo con espacios', { ...VALID, name: '   ' }, 'name'],
      ['nombre de 1 carácter', { ...VALID, name: 'A' }, 'name'],
      [
        'nombre de más de 100 caracteres',
        { ...VALID, name: 'a'.repeat(101) },
        'name',
      ],
      ['campo ausente', { name: 'Ana', email: 'ana@mail.com' }, 'password'],
      ['tipo incorrecto', { ...VALID, password: 12345678 }, 'password'],
    ])('%s', async (_caso, body, field) => {
      const response = await register(body).expect(400);

      expect(response.body.errors[field]).toEqual(expect.any(Array));
      expect(response.body.errors[field].length).toBeGreaterThan(0);
      expect(database.query).not.toHaveBeenCalled();
    });

    it('informa cada campo inválido por separado', async () => {
      const response = await register({
        name: '',
        email: 'x',
        password: '1',
      }).expect(400);

      expect(Object.keys(response.body.errors).sort()).toEqual([
        'email',
        'name',
        'password',
      ]);
    });

    it('no repite la contraseña enviada en el mensaje de error', async () => {
      const response = await register({ ...VALID, password: 'corta1' }).expect(
        400,
      );

      expect(JSON.stringify(response.body)).not.toContain('corta1');
    });

    it('rechaza con 400 las propiedades extra, como role', async () => {
      await register({ ...VALID, role: 'admin' }).expect(400);

      expect(database.query).not.toHaveBeenCalled();
    });

    it('rechaza con 400 un cuerpo vacío', async () => {
      await request(app.getHttpServer()).post('/api/auth/register').expect(400);

      expect(database.query).not.toHaveBeenCalled();
    });
  });

  describe('fallo inesperado de la base', () => {
    it('responde 500 genérico sin exponer el detalle ni la contraseña', async () => {
      const logError = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      database.query.mockRejectedValue(
        new Error('connect ECONNREFUSED 127.0.0.1:5433'),
      );

      const response = await register(VALID).expect(500);

      expect(JSON.stringify(response.body)).not.toMatch(
        /ECONNREFUSED|Secreta123/,
      );
      logError.mockRestore();
    });
  });
});
