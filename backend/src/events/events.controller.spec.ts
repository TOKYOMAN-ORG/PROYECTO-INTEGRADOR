import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { Event } from './event.js';
import { EventsController } from './events.controller.js';
import type { EventsService } from './events.service.js';

describe('EventsController', () => {
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
  };

  const controller = new EventsController(
    service as unknown as EventsService,
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
});
