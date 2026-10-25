import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Event } from './event-types.ts';
import {
  EventsSubject,
  eventsSubject,
  type EventChange,
  type EventObserver,
} from './events-subject.ts';

const sampleEvent: Event = {
  id: 'ev-1',
  userId: 'user-1',
  title: 'Reunión de avance',
  description: null,
  date: '2026-10-30',
  time: '10:00',
  category: 'trabajo',
  priority: 'alta',
  createdAt: '2026-10-25T10:00:00.000Z',
  updatedAt: '2026-10-25T10:00:00.000Z',
};

function recorder(): EventObserver & { received: EventChange[] } {
  const received: EventChange[] = [];
  return {
    received,
    update(change) {
      received.push(change);
    },
  };
}

function silenceWarnings<T>(fn: () => T): T {
  const realWarn = console.warn;
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.warn = realWarn;
  }
}

describe('EventsSubject', () => {
  it('entrega cada tipo de cambio a todos los observers suscritos', () => {
    const subject = new EventsSubject();
    const a = recorder();
    const b = recorder();
    subject.subscribe(a);
    subject.subscribe(b);

    const changes: EventChange[] = [
      { type: 'loaded', events: [sampleEvent] },
      { type: 'created', event: sampleEvent },
      { type: 'updated', event: sampleEvent },
      { type: 'deleted', id: 'ev-1' },
    ];
    for (const change of changes) subject.notify(change);

    assert.deepEqual(a.received, changes);
    assert.deepEqual(b.received, changes);
  });

  it('subscribe devuelve una función que cancela la suscripción', () => {
    const subject = new EventsSubject();
    const observer = recorder();
    const unsubscribe = subject.subscribe(observer);

    subject.notify({ type: 'deleted', id: 'ev-1' });
    unsubscribe();
    subject.notify({ type: 'deleted', id: 'ev-2' });

    assert.deepEqual(observer.received, [{ type: 'deleted', id: 'ev-1' }]);
  });

  it('suscribir el mismo observer dos veces no duplica las notificaciones', () => {
    const subject = new EventsSubject();
    const observer = recorder();
    subject.subscribe(observer);
    subject.subscribe(observer);

    subject.notify({ type: 'created', event: sampleEvent });

    assert.equal(observer.received.length, 1);
  });

  it('un observer que lanza no impide que los demás reciban el cambio ni propaga el error', () => {
    const subject = new EventsSubject();
    const before = recorder();
    const after = recorder();
    subject.subscribe(before);
    subject.subscribe({
      update() {
        throw new Error('fallo del observer');
      },
    });
    subject.subscribe(after);

    assert.doesNotThrow(() =>
      silenceWarnings(() => subject.notify({ type: 'deleted', id: 'ev-1' })),
    );
    assert.equal(before.received.length, 1);
    assert.equal(after.received.length, 1);
  });

  it('un observer que se cancela durante la difusión no impide que los demás reciban el cambio', () => {
    const subject = new EventsSubject();
    const other = recorder();
    let unsubscribe = () => {};
    unsubscribe = subject.subscribe({
      update() {
        unsubscribe();
      },
    });
    subject.subscribe(other);

    subject.notify({ type: 'deleted', id: 'ev-1' });

    assert.equal(other.received.length, 1);
  });

  it('exporta una instancia única compartida', () => {
    assert.ok(eventsSubject instanceof EventsSubject);
  });
});
