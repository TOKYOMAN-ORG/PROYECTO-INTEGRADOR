import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateEventDto } from './dto/create-event.dto.js';
import type { EventsFilterDto } from './dto/events-filter.dto.js';
import type { Event } from './event.js';
import { EventsRepository } from './events.repository.js';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async create(userId: string, dto: CreateEventDto): Promise<Event> {
    return this.eventsRepository.insert({
      userId,
      title: dto.title,
      description: dto.description ?? null,
      date: dto.date,
      time: dto.time,
      category: dto.category,
      priority: dto.priority,
    });
  }

  async findAll(
    userId: string,
    filter: EventsFilterDto = {},
  ): Promise<Event[]> {
    if (filter.from && filter.to && filter.from > filter.to) {
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['from no puede ser posterior a to'],
        errors: { from: ['from no puede ser posterior a to'] },
      });
    }
    return this.eventsRepository.findByUserIdAndRange(
      userId,
      filter.from,
      filter.to,
    );
  }

  async findOne(userId: string, id: string): Promise<Event> {
    const event = await this.eventsRepository.findByIdAndUserId(id, userId);
    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }
    return event;
  }
}
