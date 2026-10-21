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
    return this.findByUserIdAndRange(userId);
  }

  async findByUserIdAndRange(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<Event[]> {
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
         AND ($2::date IS NULL OR date >= $2::date)
         AND ($3::date IS NULL OR date <= $3::date)
       ORDER BY date ASC, time ASC`,
      [userId, from ?? null, to ?? null],
    );
    return rows;
  }

  async findByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<Event | undefined> {
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
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return rows[0];
  }

  async updateForUser(
    id: string,
    userId: string,
    {
      title,
      description = null,
      date,
      time,
      category,
      priority,
    }: Omit<NewEventRecord, 'userId'>,
  ): Promise<Event | undefined> {
    const { rows } = await this.database.query<Event>(
      `UPDATE events
       SET title = $1,
           description = $2,
           date = $3,
           time = $4,
           category = $5,
           priority = $6,
           updated_at = now()
       WHERE id = $7 AND user_id = $8
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
      [title, description, date, time, category, priority, id, userId],
    );
    return rows[0];
  }
}
