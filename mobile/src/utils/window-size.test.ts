import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { getSizeClass, getSizeClassConfig } from './window-size-model.ts';

describe('window-size utility (SCRUM-108)', () => {
  it('clasifica correctamente en 0, 320, 599, 600, 839, 840 y 1280 dp', () => {
    // Compact: < 600
    assert.equal(getSizeClass(0), 'compact');
    assert.equal(getSizeClass(320), 'compact');
    assert.equal(getSizeClass(599), 'compact');

    // Medium: 600 - 839
    assert.equal(getSizeClass(600), 'medium');
    assert.equal(getSizeClass(839), 'medium');

    // Expanded: >= 840
    assert.equal(getSizeClass(840), 'expanded');
    assert.equal(getSizeClass(1280), 'expanded');
  });

  it('resuelve la configuración de diseño para cada tamaño', () => {
    const compactNarrow = getSizeClassConfig(320);
    assert.equal(compactNarrow.isNarrow, true);

    const compactConfig = getSizeClassConfig(360);
    assert.equal(compactConfig.sizeClass, 'compact');
    assert.equal(compactConfig.isCompact, true);
    assert.equal(compactConfig.isNarrow, false);
    assert.equal(compactConfig.paddingHorizontal, 16);
    assert.equal(compactConfig.numColumns, 1);

    const mediumConfig = getSizeClassConfig(768);
    assert.equal(mediumConfig.sizeClass, 'medium');
    assert.equal(mediumConfig.isMedium, true);
    assert.equal(mediumConfig.isNarrow, false);
    assert.equal(mediumConfig.paddingHorizontal, 24);

    const expandedConfig = getSizeClassConfig(1024);
    assert.equal(expandedConfig.sizeClass, 'expanded');
    assert.equal(expandedConfig.isExpanded, true);
    assert.equal(expandedConfig.isNarrow, false);
    assert.equal(expandedConfig.paddingHorizontal, 32);
    assert.equal(expandedConfig.numColumns, 2);
  });
});
