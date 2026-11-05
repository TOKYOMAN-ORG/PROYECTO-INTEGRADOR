import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CATEGORY_FILTER_OPTIONS,
  filterEventsByCategory,
  getCategoryCounts,
} from './segmented-control-model.ts';
import type { Event } from '../features/events/event-types.ts';

describe('segmented-control-model', () => {
  const sampleEvents: Event[] = [
    {
      id: '1',
      title: 'Daily Standup',
      description: null,
      category: 'trabajo',
      priority: 'media',
      date: '2026-10-30',
      time: '09:00',
      userId: 'u1',
      createdAt: '2026-10-30T00:00:00.000Z',
      updatedAt: '2026-10-30T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Examen de Matemáticas',
      description: null,
      category: 'estudio',
      priority: 'alta',
      date: '2026-10-30',
      time: '11:00',
      userId: 'u1',
      createdAt: '2026-10-30T00:00:00.000Z',
      updatedAt: '2026-10-30T00:00:00.000Z',
    },
    {
      id: '3',
      title: 'Comprar víveres',
      description: null,
      category: 'personal',
      priority: 'baja',
      date: '2026-10-30',
      time: '14:00',
      userId: 'u1',
      createdAt: '2026-10-30T00:00:00.000Z',
      updatedAt: '2026-10-30T00:00:00.000Z',
    },
    {
      id: '4',
      title: 'Cita médica dentista',
      description: null,
      category: 'salud',
      priority: 'alta',
      date: '2026-10-30',
      time: '16:00',
      userId: 'u1',
      createdAt: '2026-10-30T00:00:00.000Z',
      updatedAt: '2026-10-30T00:00:00.000Z',
    },
    {
      id: '5',
      title: 'Revisión técnica coche',
      description: null,
      category: 'otro',
      priority: 'media',
      date: '2026-10-30',
      time: '18:00',
      userId: 'u1',
      createdAt: '2026-10-30T00:00:00.000Z',
      updatedAt: '2026-10-30T00:00:00.000Z',
    },
  ];

  it('CATEGORY_FILTER_OPTIONS contains all required filter options including todas', () => {
    assert.equal(CATEGORY_FILTER_OPTIONS.length, 6);
    assert.deepEqual(
      CATEGORY_FILTER_OPTIONS.map((o) => o.value),
      ['todas', 'trabajo', 'estudio', 'personal', 'salud', 'otro']
    );
  });

  describe('filterEventsByCategory', () => {
    it('returns all events when filter is todas', () => {
      const result = filterEventsByCategory(sampleEvents, 'todas');
      assert.equal(result.length, 5);
    });

    it('returns only events matching the selected category', () => {
      const trabajo = filterEventsByCategory(sampleEvents, 'trabajo');
      assert.equal(trabajo.length, 1);
      assert.equal(trabajo[0].title, 'Daily Standup');

      const salud = filterEventsByCategory(sampleEvents, 'salud');
      assert.equal(salud.length, 1);
      assert.equal(salud[0].title, 'Cita médica dentista');
    });

    it('returns empty array when no events match category', () => {
      const emptyEvents: Event[] = [];
      const result = filterEventsByCategory(emptyEvents, 'trabajo');
      assert.deepEqual(result, []);
    });
  });

  describe('getCategoryCounts', () => {
    it('accurately counts events per category and total for todas', () => {
      const counts = getCategoryCounts(sampleEvents);
      assert.equal(counts.todas, 5);
      assert.equal(counts.trabajo, 1);
      assert.equal(counts.estudio, 1);
      assert.equal(counts.personal, 1);
      assert.equal(counts.salud, 1);
      assert.equal(counts.otro, 1);
    });

    it('handles zero events gracefully', () => {
      const counts = getCategoryCounts([]);
      assert.equal(counts.todas, 0);
      assert.equal(counts.trabajo, 0);
      assert.equal(counts.estudio, 0);
    });
  });
});
