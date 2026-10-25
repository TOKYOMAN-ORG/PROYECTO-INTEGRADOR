export const EVENT_CATEGORIES = [
  'trabajo',
  'estudio',
  'personal',
  'salud',
  'otro',
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const EVENT_PRIORITIES = ['baja', 'media', 'alta'] as const;

export type EventPriority = (typeof EVENT_PRIORITIES)[number];
