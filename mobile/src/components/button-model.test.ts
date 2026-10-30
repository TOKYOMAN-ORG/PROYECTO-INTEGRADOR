import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import { Colors } from '../constants/theme.ts';
import { getButtonConfig, type ButtonVariant } from './button-model.ts';

describe('Button Model (SCRUM-95)', () => {
  const light = Colors.light;
  const dark = Colors.dark;

  test('variante primary usa primary y onPrimary de cada tema', () => {
    const lightCfg = getButtonConfig(light, 'primary');
    assert.equal(lightCfg.backgroundColor, light.primary);
    assert.equal(lightCfg.textColor, light.onPrimary);

    const darkCfg = getButtonConfig(dark, 'primary');
    assert.equal(darkCfg.backgroundColor, dark.primary);
    assert.equal(darkCfg.textColor, dark.onPrimary);
  });

  test('variante destructive usa danger y onDanger de cada tema', () => {
    const lightCfg = getButtonConfig(light, 'destructive');
    assert.equal(lightCfg.backgroundColor, light.danger);
    assert.equal(lightCfg.textColor, light.onDanger);

    const darkCfg = getButtonConfig(dark, 'destructive');
    assert.equal(darkCfg.backgroundColor, dark.danger);
    assert.equal(darkCfg.textColor, dark.onDanger);
  });

  test('variante outline tiene fondo transparente y borde borderStrong', () => {
    const cfg = getButtonConfig(light, 'outline');
    assert.equal(cfg.backgroundColor, 'transparent');
    assert.equal(cfg.borderColor, light.borderStrong);
    assert.equal(cfg.borderWidth, 1.5);
    assert.equal(cfg.textColor, light.text);
  });

  test('variante ghost tiene fondo transparente y texto primary', () => {
    const cfg = getButtonConfig(light, 'ghost');
    assert.equal(cfg.backgroundColor, 'transparent');
    assert.equal(cfg.textColor, light.primary);
  });

  test('tamaño md mide minHeight 48 px (área táctil nativa)', () => {
    const cfg = getButtonConfig(light, 'primary', 'md');
    assert.equal(cfg.minHeight, 48);
    assert.equal(cfg.hitSlop, undefined);
  });

  test('tamaño sm mide minHeight 36 px y provee hitSlop para garantizar >= 44 dp', () => {
    const cfg = getButtonConfig(light, 'primary', 'sm');
    assert.equal(cfg.minHeight, 36);
    assert.ok(cfg.hitSlop);
    assert.ok(cfg.minHeight + cfg.hitSlop.top + cfg.hitSlop.bottom >= 44);
  });
});
