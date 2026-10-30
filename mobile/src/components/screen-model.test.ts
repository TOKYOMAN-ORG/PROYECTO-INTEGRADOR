import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { MaxContentWidth, Spacing } from '../constants/theme.ts';
import { getScreenLayoutConfig } from './screen-model.ts';

describe('Screen Model (SCRUM-98)', () => {
  test('aplica maxWidth 800 para consistencia en tablets y desktop', () => {
    const config = getScreenLayoutConfig(false);
    assert.equal(config.maxWidth, MaxContentWidth);
    assert.equal(config.maxWidth, 800);
  });

  test('configura padding en iOS y undefined en Android/Web para KeyboardAvoidingView', () => {
    const iosConfig = getScreenLayoutConfig(true);
    assert.equal(iosConfig.keyboardBehavior, 'padding');

    const androidConfig = getScreenLayoutConfig(false);
    assert.equal(androidConfig.keyboardBehavior, undefined);
  });

  test('incluye todas las aristas de SafeArea por defecto', () => {
    const config = getScreenLayoutConfig(false);
    assert.deepEqual(config.defaultEdges, ['top', 'right', 'bottom', 'left']);
    assert.equal(config.paddingHorizontal, Spacing.four);
    assert.equal(config.paddingVertical, Spacing.three);
  });
});
