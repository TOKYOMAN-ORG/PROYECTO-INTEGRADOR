import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatTime12h } from './format-time.ts';

describe('formatTime12h', () => {
  it('distingue la mañana de la noche: 11:04 es AM y 23:04 es PM', () => {
    assert.equal(formatTime12h('11:04'), '11:04 AM');
    assert.equal(formatTime12h('23:04'), '11:04 PM');
  });

  it('resuelve los bordes: medianoche, mediodía y la primera hora de la tarde', () => {
    assert.equal(formatTime12h('00:00'), '12:00 AM');
    assert.equal(formatTime12h('00:30'), '12:30 AM');
    assert.equal(formatTime12h('12:00'), '12:00 PM');
    assert.equal(formatTime12h('13:05'), '1:05 PM');
    assert.equal(formatTime12h('09:00'), '9:00 AM');
    assert.equal(formatTime12h('23:59'), '11:59 PM');
  });

  it('acepta HH:mm:ss e ignora los segundos', () => {
    assert.equal(formatTime12h('18:30:45'), '6:30 PM');
  });

  it('devuelve el texto tal cual si no es una hora válida', () => {
    for (const invalid of ['', '24:00', '9:5', '12:60', 'abc', '14:30 PM']) {
      assert.equal(formatTime12h(invalid), invalid);
    }
  });
});
