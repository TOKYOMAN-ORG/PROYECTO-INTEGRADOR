import { Radius, type ColorTheme } from '../constants/theme.ts';

export type PriorityTone = 'alta' | 'media' | 'baja' | 'priority-high' | 'priority-medium' | 'priority-low';
export type CategoryTone =
  | 'trabajo'
  | 'estudio'
  | 'personal'
  | 'salud'
  | 'otro'
  | 'category-work'
  | 'category-study'
  | 'category-personal'
  | 'category-health'
  | 'category-other';
export type SemanticTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeTone = PriorityTone | CategoryTone | SemanticTone;
export type BadgeSize = 'sm' | 'md';

export interface BadgeColorConfig {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export interface BadgeSizeConfig {
  paddingHorizontal: number;
  paddingVertical: number;
  fontSize: number;
  lineHeight: number;
  borderRadius: number;
  minHeight: number;
}

export function isPriorityTone(tone: BadgeTone): boolean {
  return (
    tone === 'alta' ||
    tone === 'media' ||
    tone === 'baja' ||
    tone === 'priority-high' ||
    tone === 'priority-medium' ||
    tone === 'priority-low'
  );
}

export function isCategoryTone(tone: BadgeTone): boolean {
  return (
    tone === 'trabajo' ||
    tone === 'estudio' ||
    tone === 'personal' ||
    tone === 'salud' ||
    tone === 'otro' ||
    tone === 'category-work' ||
    tone === 'category-study' ||
    tone === 'category-personal' ||
    tone === 'category-health' ||
    tone === 'category-other'
  );
}

export function resolveBadgeColors(tone: BadgeTone = 'neutral', theme: ColorTheme): BadgeColorConfig {
  switch (tone) {
    // Prioridades
    case 'alta':
    case 'priority-high':
      return {
        backgroundColor: theme.priorityHighMuted,
        textColor: theme.onPriorityHigh,
        borderColor: theme.priorityHigh,
      };
    case 'media':
    case 'priority-medium':
      return {
        backgroundColor: theme.priorityMediumMuted,
        textColor: theme.onPriorityMedium,
        borderColor: theme.priorityMedium,
      };
    case 'baja':
    case 'priority-low':
      return {
        backgroundColor: theme.priorityLowMuted,
        textColor: theme.onPriorityLow,
        borderColor: theme.priorityLow,
      };

    // Categorías
    case 'trabajo':
    case 'category-work':
      return {
        backgroundColor: theme.categoryWorkMuted,
        textColor: theme.onCategoryWork,
        borderColor: theme.categoryWork,
      };
    case 'estudio':
    case 'category-study':
      return {
        backgroundColor: theme.categoryStudyMuted,
        textColor: theme.onCategoryStudy,
        borderColor: theme.categoryStudy,
      };
    case 'personal':
    case 'category-personal':
      return {
        backgroundColor: theme.categoryPersonalMuted,
        textColor: theme.onCategoryPersonal,
        borderColor: theme.categoryPersonal,
      };
    case 'salud':
    case 'category-health':
      return {
        backgroundColor: theme.categoryHealthMuted,
        textColor: theme.onCategoryHealth,
        borderColor: theme.categoryHealth,
      };
    case 'otro':
    case 'category-other':
      return {
        backgroundColor: theme.categoryOtherMuted,
        textColor: theme.onCategoryOther,
        borderColor: theme.categoryOther,
      };

    // Semánticos
    case 'success':
      return {
        backgroundColor: theme.successMuted,
        textColor: theme.onSuccessMuted,
        borderColor: theme.success,
      };
    case 'warning':
      return {
        backgroundColor: theme.warningMuted,
        textColor: theme.onWarningMuted,
        borderColor: theme.warning,
      };
    case 'danger':
      return {
        backgroundColor: theme.dangerMuted,
        textColor: theme.onDangerMuted,
        borderColor: theme.danger,
      };
    case 'info':
      return {
        backgroundColor: theme.infoMuted,
        textColor: theme.onInfoMuted,
        borderColor: theme.info,
      };
    case 'neutral':
    default:
      return {
        backgroundColor: theme.backgroundElement,
        textColor: theme.textSecondary,
        borderColor: theme.border,
      };
  }
}

export function resolveBadgeSize(size: BadgeSize = 'md'): BadgeSizeConfig {
  if (size === 'sm') {
    return {
      paddingHorizontal: 8,
      paddingVertical: 2,
      fontSize: 11,
      lineHeight: 14,
      borderRadius: Radius.sm,
      minHeight: 20,
    };
  }

  return {
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 12,
    lineHeight: 16,
    borderRadius: Radius.sm,
    minHeight: 24,
  };
}

export function getAccessibleBadgeLabel(tone: BadgeTone, label: string, explicitLabel?: string): string {
  if (explicitLabel) return explicitLabel;
  if (isPriorityTone(tone)) return `Prioridad ${label}`;
  if (isCategoryTone(tone)) return `Categoría ${label}`;
  return label;
}
