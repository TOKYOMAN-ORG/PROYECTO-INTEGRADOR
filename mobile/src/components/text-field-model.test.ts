import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { Colors, Radius } from '../constants/theme.ts';
import { getTextFieldBorderConfig } from './text-field-model.ts';

describe('TextField Model (SCRUM-96)', () => {
  const light = Colors.light;
  const dark = Colors.dark;

  test('estado normal usa borde border y ancho 1', () => {
    const cfg = getTextFieldBorderConfig(light, false, false);
    assert.equal(cfg.borderColor, light.border);
    assert.equal(cfg.borderWidth, 1);
    assert.equal(cfg.borderRadius, Radius.md);
  });

  test('estado enfocado (focused) usa borde primary y ancho 1.5', () => {
    const cfg = getTextFieldBorderConfig(light, false, true);
    assert.equal(cfg.borderColor, light.primary);
    assert.equal(cfg.borderWidth, 1.5);
  });

  test('estado con error prioriza danger sobre foco y ancho 1.5', () => {
    const cfgFocused = getTextFieldBorderConfig(light, true, true);
    assert.equal(cfgFocused.borderColor, light.danger);
    assert.equal(cfgFocused.borderWidth, 1.5);

    const cfgBlurred = getTextFieldBorderConfig(dark, true, false);
    assert.equal(cfgBlurred.borderColor, dark.danger);
    assert.equal(cfgBlurred.borderWidth, 1.5);
  });
});
