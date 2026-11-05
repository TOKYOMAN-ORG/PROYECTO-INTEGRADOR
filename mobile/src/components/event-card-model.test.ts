import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import type { Event } from '../features/events/event-types.ts';
import {
  formatEventAccessibilityLabel,
  getCategoryLabel,
  getPriorityLabel,
} from './event-card-model.ts';

describe('event-card-model', () => {
  it('obtiene etiquetas capitalizadas para categoría y prioridad', () => {
    assert.equal(getCategoryLabel('trabajo'), 'Trabajo');
    assert.equal(getCategoryLabel('estudio'), 'Estudio');
    assert.equal(getPriorityLabel('alta'), 'Alta');
    assert.equal(getPriorityLabel('media'), 'Media');
  });

  it('formatea la etiqueta de accesibilidad completa requerida por SCRUM-103', () => {
    const mockEvent: Event = {
      id: 'evt-1',
      userId: 'usr-1',
      title: 'Reunión de planeación',
      description: 'Revisar backlog del sprint',
      date: '2026-11-03',
      time: '14:30',
      category: 'trabajo',
      priority: 'alta',
      createdAt: '2026-10-30T00:00:00Z',
      updatedAt: '2026-10-30T00:00:00Z',
    };

    const label = formatEventAccessibilityLabel(mockEvent);
    assert.equal(
      label,
      'Reunión de planeación, 14:30, prioridad alta, categoría trabajo, Revisar backlog del sprint'
    );
  });
});
