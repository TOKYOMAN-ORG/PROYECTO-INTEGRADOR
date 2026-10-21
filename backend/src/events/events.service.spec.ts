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
    findByUserIdAndRange: vi.fn(),
    findByIdAndUserId: vi.fn(),
    updateForUser: vi.fn(),
    deleteForUser: vi.fn(),
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

  describe('findAll', () => {
    it('obtiene los eventos por rango de fechas delegando al repositorio', async () => {
      const mockList: Event[] = [
        {
          id: 'event-uuid-1',
          userId: 'user-uuid-1',
          title: 'Evento 1',
          description: null,
          date: '2026-10-25',
          time: '10:00',
          category: 'trabajo',
          priority: 'alta',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      repository.findByUserIdAndRange = vi.fn().mockResolvedValue(mockList);

      const result = await service.findAll('user-uuid-1', {
        from: '2026-10-01',
        to: '2026-10-31',
      });

      expect(repository.findByUserIdAndRange).toHaveBeenCalledWith(
        'user-uuid-1',
        '2026-10-01',
        '2026-10-31',
      );
      expect(result).toEqual(mockList);
    });

    it('lanza BadRequestException si from es posterior a to', async () => {
      await expect(
        service.findAll('user-uuid-1', {
          from: '2026-10-31',
          to: '2026-10-01',
        }),
      ).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('devuelve el evento si existe y pertenece al usuario', async () => {
      const mockEvent: Event = {
        id: 'event-uuid-1',
        userId: 'user-uuid-1',
        title: 'Evento 1',
        description: null,
        date: '2026-10-25',
        time: '10:00',
        category: 'trabajo',
        priority: 'alta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findByIdAndUserId = vi.fn().mockResolvedValue(mockEvent);

      const result = await service.findOne('user-uuid-1', 'event-uuid-1');

      expect(repository.findByIdAndUserId).toHaveBeenCalledWith(
        'event-uuid-1',
        'user-uuid-1',
      );
      expect(result).toEqual(mockEvent);
    });

    it('lanza NotFoundException si el evento no existe o es de otro usuario', async () => {
      repository.findByIdAndUserId = vi.fn().mockResolvedValue(undefined);

      await expect(
        service.findOne('user-uuid-1', 'event-inexistente'),
      ).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('actualiza el evento si existe y pertenece al usuario', async () => {
      const dto: CreateEventDto = {
        title: 'Título Editado',
        description: 'Descripción editada',
        date: '2026-10-27',
        time: '11:00',
        category: 'estudio',
        priority: 'media',
      };

      const updatedEvent: Event = {
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

      repository.updateForUser = vi.fn().mockResolvedValue(updatedEvent);

      const result = await service.update('event-uuid-1', 'user-uuid-1', dto);

      expect(repository.updateForUser).toHaveBeenCalledWith(
        'event-uuid-1',
        'user-uuid-1',
        {
          title: dto.title,
          description: dto.description,
          date: dto.date,
          time: dto.time,
          category: dto.category,
          priority: dto.priority,
        },
      );
      expect(result).toEqual(updatedEvent);
    });

    it('lanza NotFoundException si updateForUser devuelve undefined (ajeno o inexistente)', async () => {
      repository.updateForUser = vi.fn().mockResolvedValue(undefined);

      await expect(
        service.update('event-uuid-1', 'user-uuid-1', {
          title: 'T',
          date: '2026-10-25',
          time: '10:00',
          category: 'otro',
          priority: 'baja',
        }),
      ).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('elimina el evento si existe y pertenece al usuario', async () => {
      repository.deleteForUser.mockResolvedValue(true);

      await expect(
        service.remove('event-uuid-1', 'user-uuid-1'),
      ).resolves.toBeUndefined();

      expect(repository.deleteForUser).toHaveBeenCalledWith(
        'event-uuid-1',
        'user-uuid-1',
      );
    });

    it('lanza NotFoundException si deleteForUser devuelve false (ajeno o inexistente)', async () => {
      repository.deleteForUser.mockResolvedValue(false);

      await expect(
        service.remove('event-uuid-1', 'user-uuid-1'),
      ).rejects.toThrow();
    });
  });
});
