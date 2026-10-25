import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Event } from '../event.js';
import type { EventsRepository } from '../events.repository.js';
import { CsvExportStrategy } from './csv-export.strategy.js';
import { EventsExportService } from './events-export.service.js';
import type { ExportStrategy } from './export-strategy.js';
import { JsonExportStrategy } from './json-export.strategy.js';

const event: Event = {
  id: 'event-uuid-1',
  userId: 'user-uuid-1',
  title: 'Entrega Proyecto',
  description: null,
  date: '2026-10-27',
  time: '18:00',
  category: 'estudio',
  priority: 'alta',
  createdAt: new Date('2026-10-20T10:00:00.000Z'),
  updatedAt: new Date('2026-10-20T10:00:00.000Z'),
};

describe('EventsExportService', () => {
  const repository = { findAllByUserIdForExport: vi.fn() };
  const service = new EventsExportService(
    [new JsonExportStrategy(), new CsvExportStrategy()],
    repository as unknown as EventsRepository,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    repository.findAllByUserIdForExport.mockResolvedValue([event]);
  });

  it('elige la estrategia JSON y consulta solo los eventos del usuario', async () => {
    const file = await service.export('user-uuid-1', 'json');

    expect(repository.findAllByUserIdForExport).toHaveBeenCalledWith('user-uuid-1');
    expect(file.contentType).toBe('application/json; charset=utf-8');
    expect(file.filename).toBe('agenda.json');
    expect(JSON.parse(file.content)).toHaveLength(1);
  });

  it('elige la estrategia CSV', async () => {
    const file = await service.export('user-uuid-1', 'csv');

    expect(file.contentType).toBe('text/csv; charset=utf-8');
    expect(file.filename).toBe('agenda.csv');
    expect(file.content.split('\r\n')).toHaveLength(2);
  });

  it('un formato nuevo solo requiere registrar otra estrategia', async () => {
    const tsv: ExportStrategy = {
      format: 'tsv',
      contentType: 'text/tab-separated-values',
      serialize: (events) => events.map((e) => e.title).join('\n'),
    };
    const extended = new EventsExportService(
      [new JsonExportStrategy(), tsv],
      repository as unknown as EventsRepository,
    );

    const file = await extended.export('user-uuid-1', 'tsv');

    expect(file).toEqual({
      content: 'Entrega Proyecto',
      contentType: 'text/tab-separated-values',
      filename: 'agenda.tsv',
    });
  });

  it('rechaza un formato sin estrategia con 400 y no consulta la base', async () => {
    await expect(service.export('user-uuid-1', 'pdf')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(repository.findAllByUserIdForExport).not.toHaveBeenCalled();
  });
});
