import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Colors } from '../constants/theme.ts';
import {
  formatOptionAccessibilityLabel,
  resolveOptionItemStyle,
} from './option-selector-model.ts';

describe('option-selector-model', () => {
  it('garantiza altura y ancho mínimo de 44 dp para cualquier opción', () => {
    const unselected = resolveOptionItemStyle({
      isSelected: false,
      theme: Colors.light,
    });
    assert.ok(unselected.minHeight >= 44);
    assert.ok(unselected.minWidth >= 44);

    const selected = resolveOptionItemStyle({
      isSelected: true,
      theme: Colors.light,
      tone: 'alta',
    });
    assert.ok(selected.minHeight >= 44);
    assert.ok(selected.minWidth >= 44);
  });

  it('aplica tokens de tono seleccionado con borde destacado y fondo suave', () => {
    const highSelected = resolveOptionItemStyle({
      isSelected: true,
      theme: Colors.light,
      tone: 'alta',
    });

    assert.equal(highSelected.backgroundColor, Colors.light.priorityHighMuted);
    assert.equal(highSelected.textColor, Colors.light.onPriorityHigh);
    assert.equal(highSelected.borderColor, Colors.light.priorityHigh);
    assert.equal(highSelected.borderWidth, 2);
  });

  it('en estado no seleccionado muestra superficie y borde estándar con punto indicador', () => {
    const highUnselected = resolveOptionItemStyle({
      isSelected: false,
      theme: Colors.light,
      tone: 'alta',
    });

    assert.equal(highUnselected.backgroundColor, Colors.light.surface);
    assert.equal(highUnselected.textColor, Colors.light.text);
    assert.equal(highUnselected.indicatorColor, Colors.light.priorityHigh);
    assert.equal(highUnselected.borderWidth, 1);
  });

  it('formatea la etiqueta de accesibilidad con estado de selección y pista opcional', () => {
    assert.equal(
      formatOptionAccessibilityLabel('Alta', true),
      'Alta, seleccionado'
    );
    assert.equal(
      formatOptionAccessibilityLabel('Trabajo', false, 'Eventos laborales'),
      'Trabajo, no seleccionado. Eventos laborales'
    );
  });
});
