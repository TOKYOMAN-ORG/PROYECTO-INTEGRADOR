import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Colors } from '../constants/theme.ts';
import { getCardPaddingValue, resolveCardStyles } from './card-model.ts';

describe('card-model', () => {
  it('resuelve los paddings esperados para cada tamaño', () => {
    assert.equal(getCardPaddingValue('none'), 0);
    assert.equal(getCardPaddingValue('sm'), 8);
    assert.equal(getCardPaddingValue('md'), 16);
    assert.equal(getCardPaddingValue('lg'), 24);
  });

  it('resuelve estilos en modo reposo con borde y sombra sm por defecto', () => {
    const config = resolveCardStyles({
      theme: Colors.light,
    });

    assert.equal(config.padding, 16);
    assert.equal(config.backgroundColor, Colors.light.surface);
    assert.equal(config.borderColor, Colors.light.border);
    assert.equal(config.borderWidth, 1);
    assert.equal(config.shadow.shadowOpacity, 0.08);
  });

  it('en estado presionado oscurece la superficie, intensifica el borde y desactiva la sombra', () => {
    const config = resolveCardStyles({
      theme: Colors.light,
      pressed: true,
    });

    assert.equal(config.backgroundColor, Colors.light.backgroundElement);
    assert.equal(config.borderColor, Colors.light.borderStrong);
    assert.equal(config.shadow.shadowOpacity, 0);
  });

  it('respeta bordered=false poniendo borderWidth en 0', () => {
    const config = resolveCardStyles({
      theme: Colors.dark,
      bordered: false,
    });

    assert.equal(config.borderWidth, 0);
    assert.equal(config.backgroundColor, Colors.dark.surface);
  });
});
