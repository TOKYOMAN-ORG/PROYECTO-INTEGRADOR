import type { EventCategory, EventPriority } from './event.types.js';

export interface Event {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  category: EventCategory;
  priority: EventPriority;
  createdAt: Date;
  updatedAt: Date;
}
