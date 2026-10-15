import {
  Body,
  Controller,
  Get,
  Post,
  type INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { IsString } from 'class-validator';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { configureApp } from '../src/common/app-setup.js';

class CreateItemDto {
  @IsString()
  name: string;
}

@Controller('items')
class ItemsController {
  @Get()
  list(): string[] {
    return [];
  }

  @Post()
  create(@Body() dto: CreateItemDto): CreateItemDto {
    return dto;
  }
}

describe('configureApp (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ItemsController],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('prefijo global', () => {
    it('responde las rutas bajo /api', () => {
      return request(app.getHttpServer()).get('/api/items').expect(200, []);
    });

    it('no responde las rutas sin el prefijo', () => {
      return request(app.getHttpServer()).get('/items').expect(404);
    });
  });

  describe('ValidationPipe global', () => {
    it('acepta un cuerpo que cumple el DTO', () => {
      return request(app.getHttpServer())
        .post('/api/items')
        .send({ name: 'agenda' })
        .expect(201, { name: 'agenda' });
    });

    it('rechaza con 400 las propiedades no declaradas en el DTO', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/items')
        .send({ name: 'agenda', role: 'admin' })
        .expect(400);

      expect(response.body.message).toContain('property role should not exist');
    });

    it('rechaza con 400 un cuerpo que incumple las validaciones del DTO', () => {
      return request(app.getHttpServer())
        .post('/api/items')
        .send({ name: 42 })
        .expect(400);
    });
  });
});
