import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createToastItem, filterOutToast, type ToastMessage } from './toast-model.ts';

describe('toast-model', () => {
  it('crea un item de toast con id único, duración por defecto de 3500ms y tono info por defecto', () => {
    const item = createToastItem({
      message: 'Evento creado exitosamente',
    });

    assert.ok(item.id.startsWith('toast-'));
    assert.equal(item.tone, 'info');
    assert.equal(item.message, 'Evento creado exitosamente');
    assert.equal(item.duration, 3500);
  });

  it('respeta tono y duración personalizados', () => {
    const item = createToastItem({
      tone: 'success',
      message: 'Guardado',
      duration: 5000,
    });

    assert.equal(item.tone, 'success');
    assert.equal(item.duration, 5000);
  });

  it('elimina el toast indicado por id de la lista', () => {
    const t1: ToastMessage = { id: '1', tone: 'info', message: 'uno' };
    const t2: ToastMessage = { id: '2', tone: 'success', message: 'dos' };
    const list = [t1, t2];

    const filtered = filterOutToast(list, '1');
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].id, '2');
  });
});
