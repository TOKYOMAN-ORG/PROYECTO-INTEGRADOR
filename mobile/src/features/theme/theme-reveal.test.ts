import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  clampOrigin,
  computeRevealRadius,
  getPressOrigin,
  getStaggerDelay,
} from './theme-reveal.ts';

describe('theme-reveal', () => {
  test('computeRevealRadius llega a la esquina más lejana', () => {
    assert.equal(computeRevealRadius({ x: 0, y: 0 }, 300, 400), 500);
    assert.equal(computeRevealRadius({ x: 300, y: 400 }, 300, 400), 500);
    assert.equal(computeRevealRadius({ x: 150, y: 200 }, 300, 400), 250);
  });

  test('clampOrigin mantiene el origen dentro de la pantalla', () => {
    assert.deepEqual(clampOrigin({ x: -20, y: 900 }, 300, 400), { x: 0, y: 400 });
    assert.deepEqual(clampOrigin({ x: 10, y: 20 }, 300, 400), { x: 10, y: 20 });
  });

  test('getPressOrigin lee pageX/pageY y cae a clientX/clientY', () => {
    assert.deepEqual(getPressOrigin({ nativeEvent: { pageX: 10, pageY: 20 } }), { x: 10, y: 20 });
    assert.deepEqual(getPressOrigin({ nativeEvent: { clientX: 5, clientY: 6 } }), { x: 5, y: 6 });
  });

  test('getPressOrigin devuelve undefined si no hay coordenadas válidas', () => {
    assert.equal(getPressOrigin(undefined), undefined);
    assert.equal(getPressOrigin({}), undefined);
    assert.equal(getPressOrigin({ nativeEvent: {} }), undefined);
    assert.equal(getPressOrigin({ nativeEvent: { pageX: NaN, pageY: 1 } }), undefined);
  });

  test('getStaggerDelay escala por índice con tope', () => {
    assert.equal(getStaggerDelay(0), 0);
    assert.equal(getStaggerDelay(2), 120);
    assert.equal(getStaggerDelay(50), 360);
    assert.equal(getStaggerDelay(-3), 0);
  });
});
