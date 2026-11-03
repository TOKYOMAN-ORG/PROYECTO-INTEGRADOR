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
    'error',
    'refresh',
    'empty',
    'sun',
    'moon',
  ];

  for (const name of Object.keys(IconRegistry) as AppIconName[]) {
    test(`icono ${name} tiene trazos SVG y defaultLabel accesible`, () => {
      const def = getIconDefinition(name);
      assert.ok(def.paths.length > 0, `${name} debe tener al menos un trazo`);
      assert.ok(def.paths.every((d) => /^M/.test(d)), `${name}: cada trazo debe iniciar con M`);
      assert.ok(def.defaultLabel.length > 0, `${name} debe tener defaultLabel accesible`);
    });
  }

  test('los iconos esperados están todos registrados', () => {
    for (const name of expectedIcons) {
      assert.ok(name in IconRegistry, `${name} falta en el registro`);
    }
  });

  test('ningún icono usa emojis ni caracteres no ASCII en sus trazos', () => {
    for (const [name, def] of Object.entries(IconRegistry)) {
      for (const d of def.paths) {
        assert.ok(/^[\x20-\x7e]+$/.test(d), `${name} contiene caracteres no válidos en un trazo`);
      }
    }
  });
});
