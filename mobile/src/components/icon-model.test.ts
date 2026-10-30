import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  IconRegistry,
  getIconDefinition,
  type AppIconName,
} from './icon-model.ts';

describe('Icon Registry (SCRUM-97)', () => {
  const expectedIcons: AppIconName[] = [
    'calendar',
    'clock',
    'close',
    'check',
    'back',
    'add',
    'edit',
    'delete',
    'logout',
    'filter',
    'download',
    'warning',
    'info',
    'user',
  ];

  for (const name of expectedIcons) {
    test(`icono ${name} tiene definidos nombres para ios, android, webFallback y defaultLabel`, () => {
      const def = getIconDefinition(name);
      assert.ok(def.ios.length > 0, `${name} debe tener nombre iOS`);
      assert.ok(def.android.length > 0, `${name} debe tener nombre Android`);
      assert.ok(def.webFallback.length > 0, `${name} debe tener fallback Web`);
      assert.ok(def.defaultLabel.length > 0, `${name} debe tener defaultLabel accesible`);
    });
  }

  test('sustituye los emojis por identificadores semánticos limpios', () => {
    assert.equal(IconRegistry.calendar.ios, 'calendar');
    assert.equal(IconRegistry.clock.android, 'schedule');
    assert.equal(IconRegistry.close.ios, 'xmark');
    assert.equal(IconRegistry.delete.ios, 'trash');
  });
});
