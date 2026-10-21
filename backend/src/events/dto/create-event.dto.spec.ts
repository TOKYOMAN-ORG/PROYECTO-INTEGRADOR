import { ValidationPipe } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { CreateEventDto } from './create-event.dto.js';

describe('CreateEventDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  const validPayload = {
    title: 'Reunión de planificación',
    description: 'Definir el backlog del Sprint 2',
    date: '2026-10-25',
    time: '10:30',
    category: 'trabajo',
    priority: 'alta',
  };

  it('acepta un cuerpo válido con todas las propiedades', async () => {
    const result = await pipe.transform(validPayload, {
      type: 'body',
      metatype: CreateEventDto,
    });
    expect(result).toMatchObject(validPayload);
  });

  it('acepta un cuerpo válido sin descripción (opcional)', async () => {
    const { description: _, ...withoutDescription } = validPayload;
    const result = await pipe.transform(withoutDescription, {
      type: 'body',
      metatype: CreateEventDto,
    });
    expect(result.title).toBe(validPayload.title);
    expect(result.description).toBeUndefined();
  });

  it('rechaza propiedades no declaradas como userId (criterio de seguridad contra mass-assignment)', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, userId: '11111111-1111-1111-1111-111111111111' },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });

  it('rechaza si el título está vacío o supera 100 caracteres', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, title: '   ' },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();

    await expect(
      pipe.transform(
        { ...validPayload, title: 'a'.repeat(101) },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });

  it('rechaza si la descripción supera 500 caracteres', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, description: 'a'.repeat(501) },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });

  it('rechaza fecha mal formada', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, date: '25-10-2026' },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });

  it('rechaza hora mal formada', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, time: '25:70' },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });

  it('rechaza categorías no permitidas', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, category: 'invalida' },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });

  it('rechaza prioridades no permitidas', async () => {
    await expect(
      pipe.transform(
        { ...validPayload, priority: 'urgente' },
        { type: 'body', metatype: CreateEventDto },
      ),
    ).rejects.toThrow();
  });
});
