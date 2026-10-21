import { Injectable } from '@nestjs/common';
import type { CreateEventDto } from './dto/create-event.dto.js';
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

  async findByUserId(userId: string): Promise<Event[]> {
    return this.eventsRepository.findByUserId(userId);
  }
}
