import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createConfirmState, initialConfirmState } from './confirm-dialog-model.ts';

describe('confirm-dialog-model', () => {
  it('tiene estado inicial cerrado', () => {
    assert.equal(initialConfirmState.visible, false);
    assert.equal(initialConfirmState.title, '');
    assert.equal(initialConfirmState.confirmLabel, 'Confirmar');
    assert.equal(initialConfirmState.cancelLabel, 'Cancelar');
  });

  it('crea estado abierto aplicando etiquetas por defecto si no se especifican', () => {
    const state = createConfirmState({
      title: 'Eliminar evento',
      message: '¿Estás seguro de eliminar este evento?',
      destructive: true,
    });

    assert.equal(state.visible, true);
    assert.equal(state.title, 'Eliminar evento');
    assert.equal(state.confirmLabel, 'Confirmar');
    assert.equal(state.cancelLabel, 'Cancelar');
    assert.equal(state.destructive, true);
  });

  it('respeta etiquetas personalizadas', () => {
    const state = createConfirmState({
      title: 'Cerrar sesión',
      message: '¿Quieres salir?',
      confirmLabel: 'Sí, salir',
      cancelLabel: 'Quedarme',
    });

    assert.equal(state.confirmLabel, 'Sí, salir');
    assert.equal(state.cancelLabel, 'Quedarme');
    assert.equal(state.destructive, false);
  });
});
