import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

import {
  Colors,
  Duration,
  Elevation,
  Radius,
  Typography,
  contrastRatio,
} from './theme.ts';

describe('contrastRatio (SCRUM-94)', () => {
  test('devuelve 21 para negro sobre blanco y 1 para blanco sobre blanco', () => {
    const blackOnWhite = contrastRatio('#000000', '#ffffff');
    const whiteOnWhite = contrastRatio('#ffffff', '#ffffff');

    assert.equal(Math.round(blackOnWhite), 21);
    assert.equal(Math.round(whiteOnWhite), 1);
  });

  test('soporta colores hexadecimales en formato corto #RGB', () => {
    const ratio = contrastRatio('#000', '#fff');
    assert.equal(Math.round(ratio), 21);
  });
});

describe('Verificación de Contraste WCAG AA en Temas de Color (SCRUM-92, SCRUM-94)', () => {
  for (const scheme of ['light', 'dark'] as const) {
    const theme = Colors[scheme];

    describe(`Tema ${scheme}`, () => {
      const textPairs: [string, string, string][] = [
        ['text sobre background', theme.text, theme.background],
        ['text sobre surface', theme.text, theme.surface],
        ['textSecondary sobre background', theme.textSecondary, theme.background],
        ['onPrimary sobre primary', theme.onPrimary, theme.primary],
        ['onPrimaryMuted sobre primaryMuted', theme.onPrimaryMuted, theme.primaryMuted],
        ['onSuccess sobre success', theme.onSuccess, theme.success],
        ['onSuccessMuted sobre successMuted', theme.onSuccessMuted, theme.successMuted],
        ['onWarning sobre warning', theme.onWarning, theme.warning],
        ['onWarningMuted sobre warningMuted', theme.onWarningMuted, theme.warningMuted],
        ['onDanger sobre danger', theme.onDanger, theme.danger],
        ['onDangerMuted sobre dangerMuted', theme.onDangerMuted, theme.dangerMuted],
        ['onInfo sobre info', theme.onInfo, theme.info],
        ['onInfoMuted sobre infoMuted', theme.onInfoMuted, theme.infoMuted],
        ['onPriorityHigh sobre priorityHighMuted', theme.onPriorityHigh, theme.priorityHighMuted],
        ['onPriorityMedium sobre priorityMediumMuted', theme.onPriorityMedium, theme.priorityMediumMuted],
        ['onPriorityLow sobre priorityLowMuted', theme.onPriorityLow, theme.priorityLowMuted],
        ['onCategoryWork sobre categoryWorkMuted', theme.onCategoryWork, theme.categoryWorkMuted],
        ['onCategoryStudy sobre categoryStudyMuted', theme.onCategoryStudy, theme.categoryStudyMuted],
        ['onCategoryPersonal sobre categoryPersonalMuted', theme.onCategoryPersonal, theme.categoryPersonalMuted],
        ['onCategoryHealth sobre categoryHealthMuted', theme.onCategoryHealth, theme.categoryHealthMuted],
        ['onCategoryOther sobre categoryOtherMuted', theme.onCategoryOther, theme.categoryOtherMuted],
      ];

      for (const [label, fg, bg] of textPairs) {
        test(`texto: ${label} cumple ratio >= 4.5:1`, () => {
          const ratio = contrastRatio(fg, bg);
          assert.ok(
            ratio >= 4.5,
            `El par ${label} (${fg} sobre ${bg}) tiene ratio ${ratio.toFixed(2)}:1, menor que 4.5:1 requerido`
          );
        });
      }

      const componentPairs: [string, string, string][] = [
        ['borderStrong sobre background', theme.borderStrong, theme.background],
        ['primary sobre background', theme.primary, theme.background],
        ['danger sobre background', theme.danger, theme.background],
      ];

      for (const [label, fg, bg] of componentPairs) {
        test(`componente: ${label} cumple ratio >= 3.0:1`, () => {
          const ratio = contrastRatio(fg, bg);
          assert.ok(
            ratio >= 3.0,
            `El componente ${label} (${fg} sobre ${bg}) tiene ratio ${ratio.toFixed(2)}:1, menor que 3.0:1 requerido`
          );
        });
      }
    });
  }
});

describe('Escalas de Tokens (SCRUM-93)', () => {
  test('Typography define escalas estándar con tamaño, interlineado y peso', () => {
    assert.ok(Typography.title.fontSize <= 32, 'title no debe ser excesivo en teléfonos');
    assert.ok(Typography.body.fontSize >= 14);
    assert.ok(Typography.caption.fontSize >= 12);
  });

  test('Radius define escalas sm, md, lg, xl, full', () => {
    assert.equal(Radius.sm, 6);
    assert.equal(Radius.md, 10);
    assert.equal(Radius.lg, 16);
    assert.equal(Radius.full, 9999);
  });

  test('Elevation define niveles none, sm, md, lg con elevación Android y sombra iOS', () => {
    assert.equal(Elevation.none.elevation, 0);
    assert.ok(Elevation.sm.elevation > 0);
    assert.ok(Elevation.md.elevation > Elevation.sm.elevation);
    assert.ok(Elevation.lg.elevation > Elevation.md.elevation);
  });

  test('Duration define transiciones rápida, normal y lenta', () => {
    assert.ok(Duration.fast < Duration.normal);
    assert.ok(Duration.normal < Duration.slow);
  });
});
