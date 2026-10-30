import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { Colors } from '../constants/theme.ts';
import { resolveBannerConfig } from './banner-model.ts';

describe('banner-model', () => {
  it('resuelve los 4 tonos con fondos suaves y textos legibles', () => {
    const success = resolveBannerConfig('success', Colors.light);
    assert.equal(success.backgroundColor, Colors.light.successMuted);
    assert.equal(success.textColor, Colors.light.onSuccessMuted);
    assert.equal(success.iconName, 'check');

    const error = resolveBannerConfig('error', Colors.light);
    assert.equal(error.backgroundColor, Colors.light.dangerMuted);
    assert.equal(error.textColor, Colors.light.onDangerMuted);
    assert.equal(error.iconName, 'error');

    const warning = resolveBannerConfig('warning', Colors.light);
    assert.equal(warning.backgroundColor, Colors.light.warningMuted);
    assert.equal(warning.textColor, Colors.light.onWarningMuted);
    assert.equal(warning.iconName, 'warning');

    const info = resolveBannerConfig('info', Colors.light);
    assert.equal(info.backgroundColor, Colors.light.infoMuted);
    assert.equal(info.textColor, Colors.light.onInfoMuted);
    assert.equal(info.iconName, 'info');
  });

  it('resuelve correctamente los tokens correspondientes en modo oscuro', () => {
    const errorDark = resolveBannerConfig('error', Colors.dark);
    assert.equal(errorDark.backgroundColor, Colors.dark.dangerMuted);
    assert.equal(errorDark.textColor, Colors.dark.onDangerMuted);
    assert.equal(errorDark.iconColor, Colors.dark.danger);
  });
});
