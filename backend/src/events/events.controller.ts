import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../auth/jwt-auth.guard.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { EventsFilterDto } from './dto/events-filter.dto.js';
import type { Event } from './event.js';
import { EventsService } from './events.service.js';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEventDto,
  ): Promise<Event> {
    return this.eventsService.create(req.user.id, dto);
  }

  @Get()
  async findAll(
    @Req() req: AuthenticatedRequest,
    @Query() filter: EventsFilterDto,
  ): Promise<Event[]> {
    return this.eventsService.findAll(req.user.id, filter);
  }

  @Get(':id')
  async findOne(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Event> {
    return this.eventsService.findOne(req.user.id, id);
  }

  @Put(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreateEventDto,
  ): Promise<Event> {
    return this.eventsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    await this.eventsService.remove(id, req.user.id);
  }
}

