import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Colors } from '../constants/theme.ts';
import {
  getAccessibleBadgeLabel,
  isCategoryTone,
  isPriorityTone,
  resolveBadgeColors,
  resolveBadgeSize,
} from './badge-model.ts';

describe('badge-model', () => {
  it('identifica correctamente tonos de prioridad y categoría', () => {
    assert.equal(isPriorityTone('alta'), true);
    assert.equal(isPriorityTone('priority-high'), true);
    assert.equal(isPriorityTone('category-work'), false);
    assert.equal(isPriorityTone('neutral'), false);

    assert.equal(isCategoryTone('trabajo'), true);
    assert.equal(isCategoryTone('category-work'), true);
    assert.equal(isCategoryTone('alta'), false);
  });

  it('resuelve los colores de tokens para prioridades en tema claro y oscuro', () => {
    const lightHigh = resolveBadgeColors('alta', Colors.light);
    assert.equal(lightHigh.backgroundColor, Colors.light.priorityHighMuted);
    assert.equal(lightHigh.textColor, Colors.light.onPriorityHigh);

    const darkHigh = resolveBadgeColors('alta', Colors.dark);
    assert.equal(darkHigh.backgroundColor, Colors.dark.priorityHighMuted);
    assert.equal(darkHigh.textColor, Colors.dark.onPriorityHigh);

    const lightMed = resolveBadgeColors('media', Colors.light);
    assert.equal(lightMed.backgroundColor, Colors.light.priorityMediumMuted);
    assert.equal(lightMed.textColor, Colors.light.onPriorityMedium);
  });

  it('resuelve los colores para categorías y estados semánticos', () => {
    const work = resolveBadgeColors('trabajo', Colors.light);
    assert.equal(work.backgroundColor, Colors.light.categoryWorkMuted);
    assert.equal(work.textColor, Colors.light.onCategoryWork);

    const success = resolveBadgeColors('success', Colors.light);
    assert.equal(success.backgroundColor, Colors.light.successMuted);
    assert.equal(success.textColor, Colors.light.onSuccessMuted);
  });

  it('genera etiquetas accesibles contextuales automáticas si no se provee explícita', () => {
    assert.equal(getAccessibleBadgeLabel('alta', 'Alta'), 'Prioridad Alta');
    assert.equal(getAccessibleBadgeLabel('trabajo', 'Trabajo'), 'Categoría Trabajo');
    assert.equal(getAccessibleBadgeLabel('neutral', 'Activo'), 'Activo');
    assert.equal(
      getAccessibleBadgeLabel('alta', 'Alta', 'Prioridad máxima requerida'),
      'Prioridad máxima requerida'
    );
  });

  it('resuelve dimensiones para sm y md', () => {
    const sm = resolveBadgeSize('sm');
    assert.equal(sm.fontSize, 11);
    assert.equal(sm.minHeight, 20);

    const md = resolveBadgeSize('md');
    assert.equal(md.fontSize, 12);
    assert.equal(md.minHeight, 24);
  });
});
