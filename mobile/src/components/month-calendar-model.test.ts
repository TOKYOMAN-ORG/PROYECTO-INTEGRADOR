import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Colors } from '../constants/theme.ts';
import {
  formatCellAccessibilityLabel,
  getHighestPriority,
  getPriorityDotColor,
  resolveDayCellStyles,
} from './month-calendar-model.ts';

describe('month-calendar-model', () => {
  it('calcula la prioridad más alta de una lista de eventos', () => {
    assert.equal(getHighestPriority([]), null);
    assert.equal(getHighestPriority(undefined), null);
    assert.equal(getHighestPriority([{ priority: 'baja' }]), 'baja');
    assert.equal(
      getHighestPriority([{ priority: 'baja' }, { priority: 'media' }]),
      'media'
    );
    assert.equal(
      getHighestPriority([
        { priority: 'baja' },
        { priority: 'alta' },
        { priority: 'media' },
      ]),
      'alta'
    );
  });

  it('devuelve el color de token correspondiente a la prioridad', () => {
    assert.equal(
      getPriorityDotColor('alta', Colors.light),
      Colors.light.priorityHigh
    );
    assert.equal(
      getPriorityDotColor('media', Colors.light),
      Colors.light.priorityMedium
    );
    assert.equal(
      getPriorityDotColor('baja', Colors.light),
      Colors.light.priorityLow
    );
    assert.equal(getPriorityDotColor(null, Colors.light), null);
  });

  it('resuelve estilos de celda seleccionada usando onPrimary para contraste óptimo', () => {
    const light = resolveDayCellStyles({
      isSelected: true,
      isToday: false,
      isCurrentMonth: true,
      theme: Colors.light,
    });
    assert.equal(light.backgroundColor, Colors.light.primary);
    assert.equal(light.textColor, Colors.light.onPrimary);

    const dark = resolveDayCellStyles({
      isSelected: true,
      isToday: false,
      isCurrentMonth: true,
      theme: Colors.dark,
    });
    assert.equal(dark.backgroundColor, Colors.dark.primary);
    assert.equal(dark.textColor, Colors.dark.onPrimary);
  });

  it('resuelve días de otros meses con textSecondary en lugar de opacidades ilegibles', () => {
    const otherMonth = resolveDayCellStyles({
      isSelected: false,
      isToday: false,
      isCurrentMonth: false,
      theme: Colors.light,
    });
    assert.equal(otherMonth.textColor, Colors.light.textSecondary);
  });

  it('formatea la etiqueta accesible completa', () => {
    const label = formatCellAccessibilityLabel({
      dateString: '2026-11-03',
      day: 3,
      isSelected: true,
      isToday: true,
      eventsCount: 2,
      highestPriority: 'alta',
    });
    assert.equal(
      label,
      'Día 3, hoy, seleccionado, 2 eventos, prioridad más alta alta'
    );
  });
});
