import { describe, expect, it } from 'vitest';
import type { Event } from '../event.js';
import { EXPORTED_FIELDS } from './export-strategy.js';
import { JsonExportStrategy } from './json-export.strategy.js';

const event: Event = {
  id: 'event-uuid-1',
  userId: 'user-uuid-1',
  title: 'Entrega Proyecto',
  description: 'Subir el reporte final',
  date: '2026-10-27',
  time: '18:00',
  category: 'estudio',
  priority: 'alta',
  createdAt: new Date('2026-10-20T10:00:00.000Z'),
  updatedAt: new Date('2026-10-20T10:00:00.000Z'),
};

describe('JsonExportStrategy', () => {
  const strategy = new JsonExportStrategy();

  it('se identifica con el formato json y su Content-Type', () => {
    expect(strategy.format).toBe('json');
    expect(strategy.contentType).toBe('application/json; charset=utf-8');
  });

  it('serializa un arreglo JSON válido solo con los siete campos exportables', () => {
    const parsed = JSON.parse(strategy.serialize([event])) as Record<string, unknown>[];

    expect(parsed).toEqual([
      {
        id: 'event-uuid-1',
        title: 'Entrega Proyecto',
        description: 'Subir el reporte final',
        date: '2026-10-27',
        time: '18:00',
        category: 'estudio',
        priority: 'alta',
      },
    ]);
    expect(Object.keys(parsed[0])).toEqual([...EXPORTED_FIELDS]);
    expect(parsed[0]).not.toHaveProperty('userId');
    expect(parsed[0]).not.toHaveProperty('createdAt');
    expect(parsed[0]).not.toHaveProperty('updatedAt');
  });

  it('conserva una descripción nula como null', () => {
    const parsed = JSON.parse(
      strategy.serialize([{ ...event, description: null }]),
    ) as Record<string, unknown>[];
    expect(parsed[0].description).toBeNull();
  });

  it('con una lista vacía devuelve [], un JSON válido', () => {
    const output = strategy.serialize([]);
    expect(output).toBe('[]');
    expect(JSON.parse(output)).toEqual([]);
  });
});
