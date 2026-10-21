import { Injectable } from '@nestjs/common';
import { DatabaseConnection } from '../database/database-connection.js';
import type { Event } from './event.js';
import type { EventCategory, EventPriority } from './event.types.js';

export interface NewEventRecord {
  userId: string;
  title: string;
  description?: string | null;
  date: string;
  time: string;
  category: EventCategory;
  priority: EventPriority;
}

@Injectable()
export class EventsRepository {
  constructor(private readonly database: DatabaseConnection) {}

  async insert({
    userId,
    title,
    description = null,
    date,
    time,
    category,
    priority,
  }: NewEventRecord): Promise<Event> {
    const { rows } = await this.database.query<Event>(
      `INSERT INTO events (user_id, title, description, date, time, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING
         id,
         user_id AS "userId",
         title,
         description,
         to_char(date, 'YYYY-MM-DD') AS date,
         to_char(time, 'HH24:MI') AS time,
         category,
         priority,
         created_at AS "createdAt",
         updated_at AS "updatedAt"`,
      [userId, title, description, date, time, category, priority],
    );
    return rows[0];
  }

  async findById(id: string): Promise<Event | undefined> {
    const { rows } = await this.database.query<Event>(
      `SELECT
         id,
         user_id AS "userId",
         title,
         description,
         to_char(date, 'YYYY-MM-DD') AS date,
         to_char(time, 'HH24:MI') AS time,
         category,
         priority,
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM events
       WHERE id = $1`,
      [id],
    );
    return rows[0];
  }

  async findByUserId(userId: string): Promise<Event[]> {
    const { rows } = await this.database.query<Event>(
      `SELECT
         id,
         user_id AS "userId",
         title,
         description,
         to_char(date, 'YYYY-MM-DD') AS date,
         to_char(time, 'HH24:MI') AS time,
         category,
         priority,
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM events
       WHERE user_id = $1
       ORDER BY date ASC, time ASC`,
      [userId],
    );
    return rows;
  }
}
