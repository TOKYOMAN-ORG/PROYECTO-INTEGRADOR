import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  isThemePreference,
  loadThemePreference,
  resolveScheme,
  saveThemePreference,
  toggleScheme,
} from './theme-preference.ts';

describe('theme-preference', () => {
  test('resolveScheme respeta la preferencia explícita sobre el sistema', () => {
    assert.equal(resolveScheme('light', 'dark'), 'light');
    assert.equal(resolveScheme('dark', 'light'), 'dark');
  });

  test('resolveScheme con system usa el tema del dispositivo y claro por defecto', () => {
    assert.equal(resolveScheme('system', 'dark'), 'dark');
    assert.equal(resolveScheme('system', 'light'), 'light');
    assert.equal(resolveScheme('system', null), 'light');
    assert.equal(resolveScheme('system', undefined), 'light');
  });

  test('toggleScheme alterna entre claro y oscuro', () => {
    assert.equal(toggleScheme('dark'), 'light');
    assert.equal(toggleScheme('light'), 'dark');
  });

  test('isThemePreference valida solo valores permitidos', () => {
    assert.equal(isThemePreference('system'), true);
    assert.equal(isThemePreference('light'), true);
    assert.equal(isThemePreference('dark'), true);
    assert.equal(isThemePreference('sepia'), false);
    assert.equal(isThemePreference(null), false);
  });

  test('load/save no lanzan sin almacén disponible y devuelven system', async () => {
    await saveThemePreference('dark');
    assert.equal(await loadThemePreference(), 'system');
  });
});
