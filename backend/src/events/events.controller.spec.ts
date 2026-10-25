import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { Event } from './event.js';
import { EventsController } from './events.controller.js';
import type { EventsService } from './events.service.js';
import type { EventsExportService } from './export/events-export.service.js';

describe('EventsController', () => {
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  const exportService = { export: vi.fn() };

  const controller = new EventsController(
    service as unknown as EventsService,
    exportService as unknown as EventsExportService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('llama a eventsService.create extrayendo el userId de req.user.id', async () => {
    const mockRequest = {
      user: {
        id: 'user-uuid-123',
        name: 'Ana',
        email: 'ana@example.com',
      },
    } as AuthenticatedRequest;

    const dto: CreateEventDto = {
      title: 'Entrega Proyecto',
      date: '2026-10-27',
      time: '18:00',
      category: 'estudio',
      priority: 'alta',
    };

    const mockEvent: Event = {
      id: 'event-uuid-456',
      userId: 'user-uuid-123',
      title: dto.title,
      description: null,
      date: dto.date,
      time: dto.time,
      category: dto.category,
      priority: dto.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    service.create.mockResolvedValue(mockEvent);

    const response = await controller.create(mockRequest, dto);

    expect(service.create).toHaveBeenCalledWith('user-uuid-123', dto);
    expect(response).toEqual(mockEvent);
  });

  it('llama a eventsService.findAll con el userId y filter', async () => {
    const mockRequest = {
      user: { id: 'user-uuid-123', name: 'Ana', email: 'ana@example.com' },
    } as AuthenticatedRequest;

    service.findAll = vi.fn().mockResolvedValue([]);

    await controller.findAll(mockRequest, { from: '2026-10-01', to: '2026-10-31' });

    expect(service.findAll).toHaveBeenCalledWith('user-uuid-123', {
      from: '2026-10-01',
      to: '2026-10-31',
    });
  });

  it('llama a eventsService.findOne con el userId y id', async () => {
    const mockRequest = {
      user: { id: 'user-uuid-123', name: 'Ana', email: 'ana@example.com' },
    } as AuthenticatedRequest;

    service.findOne = vi.fn().mockResolvedValue({ id: 'event-uuid-456' });

    const result = await controller.findOne(mockRequest, 'event-uuid-456');

    expect(service.findOne).toHaveBeenCalledWith('user-uuid-123', 'event-uuid-456');
    expect(result).toEqual({ id: 'event-uuid-456' });
  });

  it('llama a eventsService.update con id, userId y dto', async () => {
    const mockRequest = {
      user: { id: 'user-uuid-123', name: 'Ana', email: 'ana@example.com' },
    } as AuthenticatedRequest;

    const dto: CreateEventDto = {
      title: 'Entrega Modificada',
      date: '2026-10-28',
      time: '19:00',
      category: 'estudio',
      priority: 'alta',
    };

    const mockUpdated = {
      id: 'event-uuid-456',
      title: dto.title,
      description: null,
      date: dto.date,
      time: dto.time,
      category: dto.category,
      priority: dto.priority,
    };

    service.update = vi.fn().mockResolvedValue(mockUpdated);

    const result = await controller.update(mockRequest, 'event-uuid-456', dto);

    expect(service.update).toHaveBeenCalledWith('event-uuid-456', 'user-uuid-123', dto);
    expect(result).toEqual(mockUpdated);
  });

  it('llama a eventsService.remove con id y userId', async () => {
    const mockRequest = {
      user: { id: 'user-uuid-123', name: 'Ana', email: 'ana@example.com' },
    } as AuthenticatedRequest;

    service.remove = vi.fn().mockResolvedValue(undefined);

    await controller.remove(mockRequest, 'event-uuid-456');

    expect(service.remove).toHaveBeenCalledWith('event-uuid-456', 'user-uuid-123');
  });

  it('export delega en EventsExportService con el userId del token y fija Content-Type y Content-Disposition', async () => {
    const mockRequest = {
      user: { id: 'user-uuid-123', name: 'Ana', email: 'ana@example.com' },
    } as AuthenticatedRequest;
    const res = { setHeader: vi.fn() };
    exportService.export.mockResolvedValue({
      content: 'id,title',
      contentType: 'text/csv; charset=utf-8',
      filename: 'agenda.csv',
    });

    const body = await controller.export(
      mockRequest,
      { format: 'csv' },
      res as unknown as Parameters<EventsController['export']>[2],
    );

    expect(exportService.export).toHaveBeenCalledWith('user-uuid-123', 'csv');
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="agenda.csv"',
    );
    expect(body).toBe('id,title');
  });
});
