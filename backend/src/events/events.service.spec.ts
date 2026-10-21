import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { Event } from './event.js';
import type { EventsRepository } from './events.repository.js';
import { EventsService } from './events.service.js';

describe('EventsService', () => {
  const repository = {
    insert: vi.fn(),
    findById: vi.fn(),
    findByUserId: vi.fn(),
  };

  const service = new EventsService(repository as unknown as EventsRepository);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('crea un evento delegando al repositorio con el userId del token', async () => {
    const dto: CreateEventDto = {
      title: 'Sprint Planning',
      description: 'Revisión del backlog',
      date: '2026-10-25',
      time: '09:00',
      category: 'trabajo',
      priority: 'alta',
    };

    const mockEvent: Event = {
      id: 'event-uuid-1',
      userId: 'user-uuid-1',
      title: dto.title,
      description: dto.description ?? null,
      date: dto.date,
      time: dto.time,
      category: dto.category,
      priority: dto.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    repository.insert.mockResolvedValue(mockEvent);

    const result = await service.create('user-uuid-1', dto);

    expect(repository.insert).toHaveBeenCalledWith({
      userId: 'user-uuid-1',
      title: dto.title,
      description: dto.description,
      date: dto.date,
      time: dto.time,
      category: dto.category,
      priority: dto.priority,
    });
    expect(result).toEqual(mockEvent);
  });

  it('asigna null a description si no viene en el dto', async () => {
    const dto: CreateEventDto = {
      title: 'Dentista',
      date: '2026-10-26',
      time: '15:30',
      category: 'salud',
      priority: 'media',
    };

    repository.insert.mockResolvedValue({
      id: 'event-uuid-2',
      userId: 'user-uuid-1',
      title: dto.title,
      description: null,
      date: dto.date,
      time: dto.time,
      category: dto.category,
      priority: dto.priority,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await service.create('user-uuid-1', dto);

    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        description: null,
      }),
    );
  });
});
