import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  formatDateIso,
  formatDisplayDate,
  getCalendarGrid,
  getEventsForDate,
  getMonthDateRange,
  MONTH_NAMES,
} from './calendar-utils.ts';
import type { Event } from './event-types.ts';

describe('calendar-utils', () => {
  it('MONTH_NAMES contiene los 12 meses del año en español', () => {
    assert.equal(MONTH_NAMES.length, 12);
    assert.equal(MONTH_NAMES[0], 'Enero');
    assert.equal(MONTH_NAMES[9], 'Octubre');
  });

  it('formatDateIso formatea fechas en YYYY-MM-DD', () => {
    const d = new Date(2026, 9, 21); // Octubre es mes 9 (0-indexed)
    assert.equal(formatDateIso(d), '2026-10-21');
  });

  it('getMonthDateRange devuelve primer y último día del mes en formato ISO', () => {
    const oct = getMonthDateRange(2026, 9); // Octubre 2026 (31 días)
    assert.equal(oct.from, '2026-10-01');
    assert.equal(oct.to, '2026-10-31');

    const febLeap = getMonthDateRange(2024, 1); // Febrero bisiesto (29 días)
    assert.equal(febLeap.from, '2024-02-01');
    assert.equal(febLeap.to, '2024-02-29');

    const febNormal = getMonthDateRange(2025, 1); // Febrero no bisiesto (28 días)
    assert.equal(febNormal.from, '2025-02-01');
    assert.equal(febNormal.to, '2025-02-28');
  });

  it('getCalendarGrid genera celdas completas en múltiplos de 7', () => {
    const grid = getCalendarGrid(2026, 9); // Octubre 2026
    assert.equal(grid.length % 7, 0);

    const octDays = grid.filter((c) => c.isCurrentMonth);
    assert.equal(octDays.length, 31);
    assert.equal(octDays[0].day, 1);
    assert.equal(octDays[0].dateString, '2026-10-01');
    assert.equal(octDays[30].day, 31);
    assert.equal(octDays[30].dateString, '2026-10-31');
  });

  it('formatDisplayDate formatea legiblemente la fecha en español', () => {
    assert.equal(formatDisplayDate('2026-10-25'), '25 de octubre de 2026');
    assert.equal(formatDisplayDate('2026-01-01'), '1 de enero de 2026');
  });

  it('getEventsForDate filtra y ordena cronológicamente por hora', () => {
    const events: Event[] = [
      {
        id: '1',
        userId: 'u1',
        title: 'Tarde',
        description: null,
        date: '2026-10-21',
        time: '18:00',
        category: 'personal',
        priority: 'baja',
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z',
      },
      {
        id: '2',
        userId: 'u1',
        title: 'Mañana',
        description: null,
        date: '2026-10-21',
        time: '09:00',
        category: 'trabajo',
        priority: 'alta',
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z',
      },
      {
        id: '3',
        userId: 'u1',
        title: 'Otro día',
        description: null,
        date: '2026-10-22',
        time: '10:00',
        category: 'salud',
        priority: 'media',
        createdAt: '2026-10-21T00:00:00Z',
        updatedAt: '2026-10-21T00:00:00Z',
      },
    ];

    const result = getEventsForDate(events, '2026-10-21');
    assert.equal(result.length, 2);
    assert.equal(result[0].id, '2'); // 09:00 antes que 18:00
    assert.equal(result[1].id, '1');

    const empty = getEventsForDate(events, '2026-10-23');
    assert.equal(empty.length, 0);
  });
});
