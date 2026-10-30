import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDateAccessibilityLabel,
  formatIsoDate,
  formatReadableDate,
  formatTimeAccessibilityLabel,
  formatTimeString,
  parseIsoDate,
  parseTimeString,
  timeStringToDate,
} from './date-time-picker-model.ts';

describe('date-time-picker-model (SCRUM-105)', () => {
  it('conversión ida y vuelta de fechas ISO en hora local', () => {
    const input = '2026-11-03';
    const parsed = parseIsoDate(input);
    assert.ok(parsed instanceof Date);
    assert.equal(parsed.getFullYear(), 2026);
    assert.equal(parsed.getMonth(), 10); // Noviembre es mes 10 (0-indexed)
    assert.equal(parsed.getDate(), 3);

    const formatted = formatIsoDate(parsed);
    assert.equal(formatted, input);
  });

  it('maneja correctamente fines de mes válidos', () => {
    const d1 = parseIsoDate('2026-02-28');
    assert.ok(d1 !== null);
    assert.equal(formatIsoDate(d1), '2026-02-28');

    const d2 = parseIsoDate('2026-04-30');
    assert.ok(d2 !== null);
    assert.equal(formatIsoDate(d2), '2026-04-30');
  });

  it('rechaza fechas inválidas y desbordamientos de mes', () => {
    assert.equal(parseIsoDate('2026-02-31'), null);
    assert.equal(parseIsoDate('2026-04-31'), null);
    assert.equal(parseIsoDate('invalid-date'), null);
    assert.equal(parseIsoDate(''), null);
  });

  it('conversión ida y vuelta de horas con límites 00:00 y 23:59', () => {
    const tStart = parseTimeString('00:00');
    assert.deepEqual(tStart, { hours: 0, minutes: 0 });

    const tEnd = parseTimeString('23:59');
    assert.deepEqual(tEnd, { hours: 23, minutes: 59 });

    const dStart = timeStringToDate('00:00');
    assert.ok(dStart !== null);
    assert.equal(formatTimeString(dStart), '00:00');

    const dEnd = timeStringToDate('23:59');
    assert.ok(dEnd !== null);
    assert.equal(formatTimeString(dEnd), '23:59');
  });

  it('rechaza horas inválidas fuera de rango', () => {
    assert.equal(parseTimeString('24:00'), null);
    assert.equal(parseTimeString('12:60'), null);
    assert.equal(parseTimeString('-01:30'), null);
    assert.equal(parseTimeString('abc'), null);
  });

  it('genera formato legible y etiquetas de accesibilidad completas', () => {
    const readable = formatReadableDate('2026-11-03');
    assert.equal(readable, 'martes 3 de noviembre de 2026');

    const dateA11y = formatDateAccessibilityLabel('Fecha del evento', '2026-11-03');
    assert.equal(dateA11y, 'Fecha del evento, martes 3 de noviembre de 2026, botón');

    const timeA11y = formatTimeAccessibilityLabel('Hora de inicio', '14:30');
    assert.equal(timeA11y, 'Hora de inicio, 14:30, botón');
  });
});
