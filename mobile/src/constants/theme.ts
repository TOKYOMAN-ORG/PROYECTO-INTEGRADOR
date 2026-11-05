export const Fonts = {
  sans: 'system-ui',
  serif: 'serif',
  rounded: 'normal',
  mono: 'monospace',
} as const;

export const Colors = {
  light: {
    // Base y superficies
    text: '#0F172A',
    textSecondary: '#475569',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E2E8F0',
    border: '#E2E8F0',
    borderStrong: '#64748B',

    // Marca principal
    primary: '#1A6FD0',
    primaryMuted: '#EBF3FE',
    onPrimary: '#FFFFFF',
    onPrimaryMuted: '#0D47A1',

    // Estados
    success: '#15803D',
    successMuted: '#DCFCE7',
    onSuccess: '#FFFFFF',
    onSuccessMuted: '#14532D',

    warning: '#B45309',
    warningMuted: '#FEF3C7',
    onWarning: '#FFFFFF',
    onWarningMuted: '#78350F',

    danger: '#B91C1C',
    dangerMuted: '#FEE2E2',
    onDanger: '#FFFFFF',
    onDangerMuted: '#7F1D1D',

    error: '#B91C1C', // alias alineado con danger para compatibilidad

    info: '#1D4ED8',
    infoMuted: '#DBEAFE',
    onInfo: '#FFFFFF',
    onInfoMuted: '#1E3A8A',

    // Prioridades
    priorityHigh: '#B91C1C',
    priorityHighMuted: '#FEE2E2',
    onPriorityHigh: '#7F1D1D',

    priorityMedium: '#B45309',
    priorityMediumMuted: '#FEF3C7',
    onPriorityMedium: '#78350F',

    priorityLow: '#15803D',
    priorityLowMuted: '#DCFCE7',
    onPriorityLow: '#14532D',

    // Categorías
    categoryWork: '#4338CA',
    categoryWorkMuted: '#E0E7FF',
    onCategoryWork: '#312E81',

    categoryStudy: '#0F766E',
    categoryStudyMuted: '#CCFBF1',
    onCategoryStudy: '#115E59',

    categoryPersonal: '#6D28D9',
    categoryPersonalMuted: '#EDE9FE',
    onCategoryPersonal: '#4C1D95',

    categoryHealth: '#BE123C',
    categoryHealthMuted: '#FFE4E6',
    onCategoryHealth: '#881337',

    categoryOther: '#475569',
    categoryOtherMuted: '#F1F5F9',
    onCategoryOther: '#1E293B',
  },
  dark: {
    // Base y superficies
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0B0F19',
    surface: '#111827',
    backgroundElement: '#1E293B',
    backgroundSelected: '#334155',
    border: '#334155',
    borderStrong: '#64748B',

    // Marca principal
    primary: '#38BDF8',
    primaryMuted: '#0C4A6E',
    onPrimary: '#082F49',
    onPrimaryMuted: '#E0F2FE',

    // Estados
    success: '#4ADE80',
    successMuted: '#14532D',
    onSuccess: '#052E16',
    onSuccessMuted: '#DCFCE7',

    warning: '#FBBF24',
    warningMuted: '#78350F',
    onWarning: '#451A03',
    onWarningMuted: '#FEF3C7',

    danger: '#F87171',
    dangerMuted: '#7F1D1D',
    onDanger: '#450A0A',
    onDangerMuted: '#FEE2E2',

    error: '#F87171', // alias alineado con danger

    info: '#60A5FA',
    infoMuted: '#1E3A8A',
    onInfo: '#172554',
    onInfoMuted: '#DBEAFE',

    // Prioridades
    priorityHigh: '#F87171',
    priorityHighMuted: '#450A0A',
    onPriorityHigh: '#FECACA',

    priorityMedium: '#FBBF24',
    priorityMediumMuted: '#451A03',
    onPriorityMedium: '#FDE68A',

    priorityLow: '#4ADE80',
    priorityLowMuted: '#052E16',
    onPriorityLow: '#BBF7D0',

    // Categorías
    categoryWork: '#818CF8',
    categoryWorkMuted: '#1E1B4B',
    onCategoryWork: '#E0E7FF',

    categoryStudy: '#2DD4BF',
    categoryStudyMuted: '#134E4A',
    onCategoryStudy: '#CCFBF1',

    categoryPersonal: '#A78BFA',
    categoryPersonalMuted: '#2E1065',
    onCategoryPersonal: '#EDE9FE',

    categoryHealth: '#FB7185',
    categoryHealthMuted: '#4C0519',
    onCategoryHealth: '#FFE4E6',

    categoryOther: '#94A3B8',
    categoryOtherMuted: '#1E293B',
    onCategoryOther: '#F1F5F9',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorTheme = Record<ThemeColor, string>;

export const Typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700' as const,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
  },
} as const;

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Elevation = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const Duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;


export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;

/**
 * Cálculo del ratio de contraste WCAG 2.x
 */
export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(foreground: string, background: string): number {
  const [r1, g1, b1] = hexToRgb(foreground);
  const [r2, g2, b2] = hexToRgb(background);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
