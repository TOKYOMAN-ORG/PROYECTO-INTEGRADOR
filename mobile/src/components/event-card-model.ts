import type { Event, EventCategory, EventPriority } from '../features/events/event-types.ts';

export function getCategoryLabel(category: EventCategory): string {
  switch (category) {
    case 'trabajo':
      return 'Trabajo';
    case 'estudio':
      return 'Estudio';
    case 'personal':
      return 'Personal';
    case 'salud':
      return 'Salud';
    case 'otro':
    default:
      return 'Otro';
  }
}

export function getPriorityLabel(priority: EventPriority): string {
  switch (priority) {
    case 'alta':
      return 'Alta';
    case 'media':
      return 'Media';
    case 'baja':
    default:
      return 'Baja';
  }
}

export function formatEventAccessibilityLabel(event: Event): string {
  const catLabel = getCategoryLabel(event.category).toLowerCase();
  const priLabel = getPriorityLabel(event.priority).toLowerCase();
  const descPart = event.description ? `, ${event.description}` : '';
  return `${event.title}, ${event.time}, prioridad ${priLabel}, categoría ${catLabel}${descPart}`;
}
