import type { EventCategory } from '@/features/events/event-types';

export type CategoryFilter = 'todas' | EventCategory;

export interface SegmentedOption<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export const CATEGORY_FILTER_OPTIONS: SegmentedOption<CategoryFilter>[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'trabajo', label: 'Trabajo' },
  { value: 'estudio', label: 'Estudio' },
  { value: 'personal', label: 'Personal' },
  { value: 'salud', label: 'Salud' },
  { value: 'otro', label: 'Otro' },
];

/** Filtra una lista de eventos según la categoría seleccionada ('todas' devuelve todos los eventos) */
export function filterEventsByCategory<T extends { category: EventCategory }>(
  events: T[],
  filter: CategoryFilter
): T[] {
  if (filter === 'todas') return events;
  return events.filter((item) => item.category === filter);
}

/** Calcula el conteo de eventos para cada categoría del filtro */
export function getCategoryCounts<T extends { category: EventCategory }>(
  events: T[]
): Record<CategoryFilter, number> {
  const counts: Record<CategoryFilter, number> = {
    todas: events.length,
    trabajo: 0,
    estudio: 0,
    personal: 0,
    salud: 0,
    otro: 0,
  };

  for (const event of events) {
    if (event.category in counts) {
      counts[event.category] += 1;
    }
  }

  return counts;
}
