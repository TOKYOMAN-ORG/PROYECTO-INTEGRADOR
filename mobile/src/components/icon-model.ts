export type AppIconName =
  | 'calendar'
  | 'clock'
  | 'close'
  | 'check'
  | 'back'
  | 'add'
  | 'edit'
  | 'delete'
  | 'logout'
  | 'filter'
  | 'download'
  | 'warning'
  | 'info'
  | 'user'
  | 'chevronRight'
  | 'error'
  | 'refresh'
  | 'empty';

export interface IconDefinition {
  ios: string;
  android: string;
  webFallback: string;
  defaultLabel: string;
}

export const IconRegistry: Record<AppIconName, IconDefinition> = {
  calendar: {
    ios: 'calendar',
    android: 'calendar_today',
    webFallback: '📅',
    defaultLabel: 'Calendario',
  },
  clock: {
    ios: 'clock',
    android: 'schedule',
    webFallback: '⏰',
    defaultLabel: 'Hora',
  },
  close: {
    ios: 'xmark',
    android: 'close',
    webFallback: '✕',
    defaultLabel: 'Cerrar',
  },
  check: {
    ios: 'checkmark',
    android: 'check',
    webFallback: '✓',
    defaultLabel: 'Aceptar',
  },
  back: {
    ios: 'chevron.left',
    android: 'arrow_back',
    webFallback: '←',
    defaultLabel: 'Regresar',
  },
  add: {
    ios: 'plus',
    android: 'add',
    webFallback: '+',
    defaultLabel: 'Agregar',
  },
  edit: {
    ios: 'pencil',
    android: 'edit',
    webFallback: '✎',
    defaultLabel: 'Editar',
  },
  delete: {
    ios: 'trash',
    android: 'delete',
    webFallback: '🗑',
    defaultLabel: 'Eliminar',
  },
  logout: {
    ios: 'rectangle.portrait.and.arrow.right',
    android: 'logout',
    webFallback: '⇥',
    defaultLabel: 'Cerrar sesión',
  },
  filter: {
    ios: 'line.3.horizontal.decrease.circle',
    android: 'filter_list',
    webFallback: '▼',
    defaultLabel: 'Filtrar',
  },
  download: {
    ios: 'square.and.arrow.down',
    android: 'download',
    webFallback: '↓',
    defaultLabel: 'Descargar',
  },
  warning: {
    ios: 'exclamationmark.triangle',
    android: 'warning',
    webFallback: '⚠',
    defaultLabel: 'Advertencia',
  },
  info: {
    ios: 'info.circle',
    android: 'info',
    webFallback: 'ℹ',
    defaultLabel: 'Información',
  },
  user: {
    ios: 'person.crop.circle',
    android: 'account_circle',
    webFallback: '👤',
    defaultLabel: 'Usuario',
  },
  chevronRight: {
    ios: 'chevron.right',
    android: 'chevron_right',
    webFallback: '›',
    defaultLabel: 'Siguiente',
  },
  error: {
    ios: 'exclamationmark.circle',
    android: 'error',
    webFallback: '!',
    defaultLabel: 'Error',
  },
  refresh: {
    ios: 'arrow.clockwise',
    android: 'refresh',
    webFallback: '↻',
    defaultLabel: 'Reintentar',
  },
  empty: {
    ios: 'tray',
    android: 'inbox',
    webFallback: '📭',
    defaultLabel: 'Vacío',
  },
};

export function getIconDefinition(name: AppIconName): IconDefinition {
  return IconRegistry[name] ?? IconRegistry.info;
}
