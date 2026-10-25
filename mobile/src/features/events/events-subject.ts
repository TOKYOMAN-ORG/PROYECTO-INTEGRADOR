import type { Event } from './event-types.ts';

// Patrón Observer (SCRUM-59): EventsSubject publica los cambios de la agenda y
// cada EventObserver reacciona sin que las pantallas lo conozcan. Este módulo no
// depende de React, de expo-notifications ni de la capa de red.

export type EventChange =
  | { type: 'loaded'; events: Event[] }
  | { type: 'created'; event: Event }
  | { type: 'updated'; event: Event }
  | { type: 'deleted'; id: string };

export interface EventObserver {
  update(change: EventChange): void;
}

export class EventsSubject {
  private readonly observers = new Set<EventObserver>();

  subscribe(observer: EventObserver): () => void {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  notify(change: EventChange): void {
    // Copia para que un observer que se cancela durante la difusión no altere el recorrido.
    for (const observer of [...this.observers]) {
      try {
        observer.update(change);
      } catch (error) {
        // Un observer que falla no impide que los demás reciban el cambio
        // ni rompe el flujo de quien notifica.
        console.warn('Un observer de la agenda falló al procesar un cambio', error);
      }
    }
  }
}

export const eventsSubject = new EventsSubject();
