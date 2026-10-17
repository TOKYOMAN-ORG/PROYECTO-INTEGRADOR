import {
  Controller,
  Get,
  Logger,
  Module,
  UseGuards,
  type INestApplication,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { AuthModule } from '../src/auth/auth.module.js';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { configureApp } from '../src/common/app-setup.js';
import { DatabaseConnection } from '../src/database/database-connection.js';
import { PasswordService } from '../src/users/password.service.js';

const PASSWORD = 'Secreta123';
const STORED = {
  id: '7f1c2b34-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
};

/** Ruta de otro módulo protegida con una sola línea: demuestra que el guard se reutiliza fuera de `AuthModule`. */
@Controller('probe')
class ProbeController {
  @Get()
  @UseGuards(JwtAuthGuard)
  probe() {
    return { ok: true };
  }
}

@Module({ imports: [AuthModule], controllers: [ProbeController] })
class ProbeModule {}

const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString('base64url');

describe('Inicio de sesión con JWT (e2e)', () => {
  const database = { query: vi.fn() };
  let app: INestApplication<App>;
  let jwt: JwtService;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await new PasswordService().hash(PASSWORD);
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, ProbeModule],
    })
      .overrideProvider(DatabaseConnection)
      .useValue(database)
      .compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    jwt = app.get(JwtService, { strict: false });
  });

  afterAll(async () => {
    await app.close();
  });

  /** Base simulada con un único usuario; falla ante cualquier consulta que no sea de las dos que hace la API. */
  beforeEach(() => {
    database.query.mockReset();
    database.query.mockImplementation(
      async (text: string, params: unknown[]) => {
        if (text.includes('password_hash AS')) {
          return {
            rows:
              params[0] === STORED.email ? [{ ...STORED, passwordHash }] : [],
          };
        }
        if (text.includes('WHERE id = $1')) {
          return { rows: params[0] === STORED.id ? [STORED] : [] };
        }
        throw new Error(`Consulta inesperada: ${text}`);
      },
    );
  });

  const login = (body: unknown) =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send(body as object);
  const me = (authorization?: string) => {
    const req = request(app.getHttpServer()).get('/api/auth/me');
    return authorization ? req.set('Authorization', authorization) : req;
  };
  const validToken = () => jwt.signAsync({ sub: STORED.id });

  describe('POST /api/auth/login', () => {
    it('responde 200 con un accessToken firmado con JWT_SECRET', async () => {
      const response = await login({
        email: STORED.email,
        password: PASSWORD,
      }).expect(200);

      expect(Object.keys(response.body)).toEqual(['accessToken']);
      await expect(
        jwt.verifyAsync(response.body.accessToken, {
          secret: process.env.JWT_SECRET,
        }),
      ).resolves.toBeDefined();
    });

    it('el token usa HS256, lleva sub y exp, y ni correo ni contraseña', async () => {
      const response = await login({
        email: STORED.email,
        password: PASSWORD,
      }).expect(200);

      const { header, payload } = jwt.decode(response.body.accessToken, {
        complete: true,
      }) as {
        header: { alg: string };
        payload: { sub: string; iat: number; exp: number };
      };
      expect(header.alg).toBe('HS256');
      expect(payload.sub).toBe(STORED.id);
      expect(payload.exp).toEqual(expect.any(Number));
      expect(payload.exp - payload.iat).toBe(15 * 60); // JWT_EXPIRES_IN=15m
      expect(Object.keys(payload).sort()).toEqual(['exp', 'iat', 'sub']);
      expect(JSON.stringify(payload)).not.toMatch(
        new RegExp(`${STORED.email}|${PASSWORD}|hash`, 'i'),
      );
    });

    it('no distingue mayúsculas en el correo', async () => {
      await login({ email: 'ANA@Mail.com', password: PASSWORD }).expect(200);

      expect(database.query.mock.calls[0][1]).toEqual([STORED.email]);
    });

    it('responde el mismo 401 con el mismo cuerpo si el correo no existe o la contraseña es incorrecta', async () => {
      const unknownEmail = await login({
        email: 'nadie@mail.com',
        password: PASSWORD,
      }).expect(401);
      const wrongPassword = await login({
        email: STORED.email,
        password: 'OtraClave123',
      }).expect(401);

      expect(unknownEmail.body).toEqual(wrongPassword.body);
      expect(unknownEmail.body.message).toBe('Credenciales inválidas');
      expect(JSON.stringify(unknownEmail.body)).not.toContain(PASSWORD);
    });

    describe('entradas hostiles: nunca 500 ni autenticación', () => {
      it("rechaza con 400 un correo como ' OR '1'='1 sin tocar la base", async () => {
        const response = await login({
          email: "' OR '1'='1",
          password: PASSWORD,
        }).expect(400);

        expect(response.body.errors.email.length).toBeGreaterThan(0);
        expect(database.query).not.toHaveBeenCalled();
      });

      it('con un correo sintácticamente válido que contiene SQL responde 401 y lo envía como parámetro', async () => {
        const email = `"' OR '1'='1"@mail.com`;

        const response = await login({ email, password: PASSWORD }).expect(401);

        expect(response.body.accessToken).toBeUndefined();
        const [text, params] = database.query.mock.calls[0];
        expect(text).not.toMatch(/or '1'='1/i);
        expect(params).toEqual([email.toLowerCase()]);
      });

      it.each([
        ['contraseña ausente', { email: STORED.email }, 'password'],
        ['contraseña vacía', { email: STORED.email, password: '' }, 'password'],
        [
          'contraseña que no es texto',
          { email: STORED.email, password: 12345678 },
          'password',
        ],
        [
          'contraseña de más de 128 caracteres',
          { email: STORED.email, password: 'a'.repeat(129) },
          'password',
        ],
        [
          'correo de más de 255 caracteres',
          { email: `${'a'.repeat(250)}@mail.com`, password: PASSWORD },
          'email',
        ],
        ['correo ausente', { password: PASSWORD }, 'email'],
      ])('%s: 400 sin tocar la base', async (_caso, body, field) => {
        const response = await login(body).expect(400);

        expect(response.body.errors[field].length).toBeGreaterThan(0);
        expect(database.query).not.toHaveBeenCalled();
      });

      it('rechaza con 400 las propiedades extra y un cuerpo vacío', async () => {
        await login({
          email: STORED.email,
          password: PASSWORD,
          role: 'admin',
        }).expect(400);
        await request(app.getHttpServer()).post('/api/auth/login').expect(400);

        expect(database.query).not.toHaveBeenCalled();
      });
    });

    it('ante un fallo inesperado de la base responde 500 genérico sin exponer detalles ni la contraseña', async () => {
      const logError = vi
        .spyOn(Logger.prototype, 'error')
        .mockImplementation(() => {});
      database.query.mockRejectedValue(
        new Error('connect ECONNREFUSED 127.0.0.1:5433'),
      );

      const response = await login({
        email: STORED.email,
        password: PASSWORD,
      }).expect(500);

      expect(JSON.stringify(response.body)).not.toMatch(
        /ECONNREFUSED|Secreta123/,
      );
      logError.mockRestore();
    });
  });

  describe('verificación del token', () => {
    it('rechaza un token firmado con otro secreto', async () => {
      const forged = await new JwtService({ secret: 'otro-secreto' }).signAsync(
        { sub: STORED.id },
      );

      await expect(jwt.verifyAsync(forged)).rejects.toThrow();
      await me(`Bearer ${forged}`).expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('con un token válido responde 200 con { id, name, email } y sin hash', async () => {
      const response = await me(`Bearer ${await validToken()}`).expect(200);

      expect(response.body).toEqual(STORED);
      expect(JSON.stringify(response.body)).not.toMatch(/password|hash/i);
    });

    it('acepta el esquema Bearer sin distinguir mayúsculas', async () => {
      await me(`bearer ${await validToken()}`).expect(200);
    });

    it('el token que entrega el login sirve en /me (flujo completo)', async () => {
      const { body } = await login({
        email: STORED.email,
        password: PASSWORD,
      }).expect(200);

      const response = await me(`Bearer ${body.accessToken}`).expect(200);

      expect(response.body).toEqual(STORED);
    });

    describe('responde 401', () => {
      it('sin cabecera Authorization', async () => {
        await me().expect(401);
      });

      it.each(['Basic dXNlcjpwYXNz', 'Bearer', 'Bearer ', 'token-suelto'])(
        'con la cabecera mal formada %j',
        async (header) => {
          await me(header).expect(401);
        },
      );

      it('con un token con basura', async () => {
        await me('Bearer no.es.jwt').expect(401);
      });

      it('con el payload alterado y la firma original', async () => {
        const [header, , signature] = (await validToken()).split('.');
        const payload = base64url({
          sub: '00000000-0000-4000-8000-000000000099',
          exp: Math.floor(Date.now() / 1000) + 3600,
        });

        await me(`Bearer ${header}.${payload}.${signature}`).expect(401);
      });

      it('con un token expirado', async () => {
        const expired = await jwt.signAsync(
          { sub: STORED.id },
          { expiresIn: -10 },
        );

        await me(`Bearer ${expired}`).expect(401);
      });

      it('con un token sin firma (alg: none)', async () => {
        const unsigned = `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url(
          {
            sub: STORED.id,
            exp: Math.floor(Date.now() / 1000) + 3600,
          },
        )}.`;

        await me(`Bearer ${unsigned}`).expect(401);
      });

      it('con un token firmado con HS512 en lugar de HS256', async () => {
        const hs512 = await jwt.signAsync(
          { sub: STORED.id },
          { algorithm: 'HS512' },
        );

        await me(`Bearer ${hs512}`).expect(401);
      });

      it('con un token válido cuyo usuario ya no existe', async () => {
        database.query.mockImplementation(async () => ({ rows: [] }));

        await me(`Bearer ${await validToken()}`).expect(401);
      });

      it('con un token válido sin sub', async () => {
        await me(`Bearer ${await jwt.signAsync({ foo: 'bar' })}`).expect(401);
        expect(database.query).not.toHaveBeenCalled();
      });

      it('con el mismo cuerpo en todos los casos, sin detalle del fallo', async () => {
        const noHeader = await me().expect(401);
        const expired = await me(
          `Bearer ${await jwt.signAsync({ sub: STORED.id }, { expiresIn: -10 })}`,
        ).expect(401);

        expect(expired.body).toEqual(noHeader.body);
      });
    });
  });

  describe('JwtAuthGuard en otro módulo', () => {
    it('protege una ruta ajena a AuthModule con solo @UseGuards', async () => {
      await request(app.getHttpServer()).get('/api/probe').expect(401);
      await request(app.getHttpServer())
        .get('/api/probe')
        .set('Authorization', `Bearer ${await validToken()}`)
        .expect(200, { ok: true });
    });
  });
});
