import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  validateCreateEvent,
  type CreateEventValues,
} from './create-event-validation.ts';

const valid: CreateEventValues = {
  title: 'Reunión de avance',
  description: 'Revisión de sprint',
  date: '2026-10-25',
  time: '14:30',
  category: 'trabajo',
  priority: 'alta',
};

describe('validateCreateEvent', () => {
  it('no reporta errores con datos válidos', () => {
    assert.deepEqual(validateCreateEvent(valid), {});
  });

  it('permite omitir la descripción opcional', () => {
    const { description: _, ...withoutDesc } = valid;
    assert.deepEqual(validateCreateEvent(withoutDesc as CreateEventValues), {});
  });

  it('reporta error si todos los campos obligatorios están vacíos', () => {
    const errors = validateCreateEvent({
      title: '',
      date: '',
      time: '',
      category: '',
      priority: '',
    });
    assert.deepEqual(Object.keys(errors).sort(), [
      'category',
      'date',
      'priority',
      'time',
      'title',
    ]);
  });

  it('un título con solo espacios cuenta como vacío', () => {
    assert.equal(
      validateCreateEvent({ ...valid, title: '   ' }).title,
      'El título es obligatorio',
    );
  });

  it('rechaza títulos que superen 100 caracteres', () => {
    assert.equal(
      validateCreateEvent({ ...valid, title: 'a'.repeat(100) }).title,
      undefined,
    );
    assert.ok(
      validateCreateEvent({ ...valid, title: 'a'.repeat(101) }).title,
    );
  });

  it('rechaza descripciones que superen 500 caracteres', () => {
    assert.equal(
      validateCreateEvent({ ...valid, description: 'a'.repeat(500) })
        .description,
      undefined,
    );
    assert.ok(
      validateCreateEvent({ ...valid, description: 'a'.repeat(501) })
        .description,
    );
  });

  it('valida formato y calendario de la fecha', () => {
    assert.ok(validateCreateEvent({ ...valid, date: '25/10/2026' }).date);
    assert.ok(validateCreateEvent({ ...valid, date: '2026-02-30' }).date);
    assert.equal(
      validateCreateEvent({ ...valid, date: '2026-10-25' }).date,
      undefined,
    );
  });

  it('valida formato de la hora', () => {
    assert.ok(validateCreateEvent({ ...valid, time: '25:00' }).time);
    assert.ok(validateCreateEvent({ ...valid, time: '12:60' }).time);
    assert.equal(
      validateCreateEvent({ ...valid, time: '09:15' }).time,
      undefined,
    );
    assert.equal(
      validateCreateEvent({ ...valid, time: '18:30:00' }).time,
      undefined,
    );
  });

  it('exige y valida categoría y prioridad', () => {
    assert.ok(
      validateCreateEvent({
        ...valid,
        category: 'desconocida' as unknown as CreateEventValues['category'],
      }).category,
    );
    assert.ok(
      validateCreateEvent({
        ...valid,
        priority: 'urgente' as unknown as CreateEventValues['priority'],
      }).priority,
    );
  });
});
