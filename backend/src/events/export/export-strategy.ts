import type { Event } from '../event.js';

/**
 * Patrón Strategy (SCRUM-58): cada formato de exportación de la agenda es una clase que implementa esta interfaz.
 * El servicio de exportación solo conoce la abstracción; agregar un formato requiere una clase nueva y
 * registrarla en `EXPORT_STRATEGIES` (`EventsModule`). No depende de Express, de Nest ni del repositorio.
 */
export interface ExportStrategy {
  /** Valor de `?format=` que selecciona esta estrategia; también es la extensión del archivo. */
  readonly format: string;
  /** Valor de la cabecera `Content-Type` de la respuesta. */
  readonly contentType: string;
  serialize(events: Event[]): string;
}

/** Token de inyección con la lista de estrategias registradas. */
export const EXPORT_STRATEGIES = Symbol('EXPORT_STRATEGIES');

/** Campos que se exportan, en orden. El archivo nunca incluye `userId`, `createdAt` ni `updatedAt`. */
export const EXPORTED_FIELDS = [
  'id',
  'title',
  'description',
  'date',
  'time',
  'category',
  'priority',
] as const;

export type ExportedEvent = Pick<Event, (typeof EXPORTED_FIELDS)[number]>;

export function toExportedEvent(event: Event): ExportedEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date,
    time: event.time,
    category: event.category,
    priority: event.priority,
  };
}
