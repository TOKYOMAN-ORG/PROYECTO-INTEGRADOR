import type { ColorTheme } from '../constants/theme.ts';

export type EventPriorityType = 'alta' | 'media' | 'baja';

export interface DayEventSummary {
  priority: EventPriorityType;
}

export function getHighestPriority(
  events?: DayEventSummary[]
): EventPriorityType | null {
  if (!events || events.length === 0) return null;
  if (events.some((e) => e.priority === 'alta')) return 'alta';
  if (events.some((e) => e.priority === 'media')) return 'media';
  if (events.some((e) => e.priority === 'baja')) return 'baja';
  return null;
}

export function getPriorityDotColor(
  priority: EventPriorityType | null,
  theme: ColorTheme
): string | null {
  if (!priority) return null;
  switch (priority) {
    case 'alta':
      return theme.priorityHigh;
    case 'media':
      return theme.priorityMedium;
    case 'baja':
      return theme.priorityLow;
    default:
      return null;
  }
}

export interface DayCellStyleConfig {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  borderWidth: number;
  fontWeight: '400' | '500' | '600' | '700';
}

export function resolveDayCellStyles(params: {
  isSelected: boolean;
  isToday: boolean;
  isCurrentMonth: boolean;
  theme: ColorTheme;
}): DayCellStyleConfig {
  const { isSelected, isToday, isCurrentMonth, theme } = params;

  if (isSelected) {
    return {
      backgroundColor: theme.primary,
      textColor: theme.onPrimary,
      borderColor: theme.primary,
      borderWidth: 0,
      fontWeight: '700',
    };
  }

  if (isToday) {
    return {
      backgroundColor: 'transparent',
      textColor: isCurrentMonth ? theme.text : theme.textSecondary,
      borderColor: theme.primary,
      borderWidth: 2,
      fontWeight: '700',
    };
  }

  if (isCurrentMonth) {
    return {
      backgroundColor: 'transparent',
      textColor: theme.text,
      borderColor: 'transparent',
      borderWidth: 0,
      fontWeight: '500',
    };
  }

  return {
    backgroundColor: 'transparent',
    textColor: theme.textSecondary,
    borderColor: 'transparent',
    borderWidth: 0,
    fontWeight: '400',
  };
}

export function formatCellAccessibilityLabel(params: {
  dateString: string;
  day: number;
  isSelected: boolean;
  isToday: boolean;
  eventsCount: number;
  highestPriority: EventPriorityType | null;
}): string {
  const parts: string[] = [`Día ${params.day}`];

  if (params.isToday) {
    parts.push('hoy');
  }

  if (params.isSelected) {
    parts.push('seleccionado');
  }

  if (params.eventsCount === 0) {
    parts.push('sin eventos');
  } else if (params.eventsCount === 1) {
    parts.push('1 evento');
    if (params.highestPriority) {
      parts.push(`prioridad ${params.highestPriority}`);
    }
  } else {
    parts.push(`${params.eventsCount} eventos`);
    if (params.highestPriority) {
      parts.push(`prioridad más alta ${params.highestPriority}`);
    }
  }

  return parts.join(', ');
}
