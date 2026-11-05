/**
 * Registro de iconos vectoriales de la app.
 *
 * Cada icono es una lista de trazos SVG (viewBox 24x24, estilo de línea redondeado, trazo 2) basados en
 * el set de código abierto Lucide (licencia ISC, https://lucide.dev). Se dibujan con `react-native-svg`,
 * así se ven idénticos en web, iOS y Android y no dependen de emojis ni de fuentes del sistema.
 */
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
  | 'chevronLeft'
  | 'error'
  | 'refresh'
  | 'empty'
  | 'sun'
  | 'moon'
  | 'mail'
  | 'lock'
  | 'tag'
  | 'flag'
  | 'bell'
  | 'text'
  | 'eye'
  | 'eyeOff'
  | 'briefcase'
  | 'book'
  | 'heart';

export interface IconDefinition {
  /** Trazos SVG en un viewBox de 24x24. */
  paths: string[];
  defaultLabel: string;
}

export const IconRegistry: Record<AppIconName, IconDefinition> = {
  calendar: {
    paths: [
      'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      'M16 2v4',
      'M8 2v4',
      'M3 10h18',
    ],
    defaultLabel: 'Calendario',
  },
  clock: {
    paths: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 6v6l4 2'],
    defaultLabel: 'Hora',
  },
  close: {
    paths: ['M18 6 6 18', 'M6 6l12 12'],
    defaultLabel: 'Cerrar',
  },
  check: {
    paths: ['M20 6 9 17l-5-5'],
    defaultLabel: 'Aceptar',
  },
  back: {
    paths: ['M19 12H5', 'M12 19l-7-7 7-7'],
    defaultLabel: 'Regresar',
  },
  add: {
    paths: ['M5 12h14', 'M12 5v14'],
    defaultLabel: 'Agregar',
  },
  edit: {
    paths: ['M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z', 'M15 5l4 4'],
    defaultLabel: 'Editar',
  },
  delete: {
    paths: [
      'M3 6h18',
      'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6',
      'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2',
      'M10 11v6',
      'M14 11v6',
    ],
    defaultLabel: 'Eliminar',
  },
  logout: {
    paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'],
    defaultLabel: 'Cerrar sesión',
  },
  filter: {
    paths: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
    defaultLabel: 'Filtrar',
  },
  download: {
    paths: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'M7 10l5 5 5-5', 'M12 15V3'],
    defaultLabel: 'Descargar',
  },
  warning: {
    paths: [
      'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
      'M12 9v4',
      'M12 17h.01',
    ],
    defaultLabel: 'Advertencia',
  },
  info: {
    paths: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 16v-4', 'M12 8h.01'],
    defaultLabel: 'Información',
  },
  user: {
    paths: [
      'M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0',
      'M9 10a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
      'M7 20.66V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.66',
    ],
    defaultLabel: 'Usuario',
  },
  chevronRight: {
    paths: ['M9 18l6-6-6-6'],
    defaultLabel: 'Siguiente',
  },
  chevronLeft: {
    paths: ['M15 18l-6-6 6-6'],
    defaultLabel: 'Anterior',
  },
  error: {
    paths: ['M2 12a10 10 0 1 0 20 0a10 10 0 1 0-20 0', 'M12 8v4', 'M12 16h.01'],
    defaultLabel: 'Error',
  },
  refresh: {
    paths: ['M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8', 'M21 3v5h-5'],
    defaultLabel: 'Reintentar',
  },
  empty: {
    paths: [
      'M22 12h-6l-2 3h-4l-2-3H2',
      'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    ],
    defaultLabel: 'Vacío',
  },
  sun: {
    paths: [
      'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0',
      'M12 2v2',
      'M12 20v2',
      'M4.93 4.93l1.41 1.41',
      'M17.66 17.66l1.41 1.41',
      'M2 12h2',
      'M20 12h2',
      'M6.34 17.66l-1.41 1.41',
      'M19.07 4.93l-1.41 1.41',
    ],
    defaultLabel: 'Tema claro',
  },
  moon: {
    paths: ['M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z'],
    defaultLabel: 'Tema oscuro',
  },
  mail: {
    paths: [
      'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
      'M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7',
    ],
    defaultLabel: 'Correo',
  },
  lock: {
    paths: [
      'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z',
      'M7 11V7a5 5 0 0 1 10 0v4',
    ],
    defaultLabel: 'Contraseña',
  },
  tag: {
    paths: [
      'M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z',
      'M7 7h.01',
    ],
    defaultLabel: 'Categoría',
  },
  flag: {
    paths: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
    defaultLabel: 'Prioridad',
  },
  bell: {
    paths: ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9', 'M10.3 21a1.94 1.94 0 0 0 3.4 0'],
    defaultLabel: 'Recordatorio',
  },
  text: {
    paths: ['M17 6H3', 'M21 12H3', 'M15 18H3'],
    defaultLabel: 'Descripción',
  },
  eye: {
    paths: [
      'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z',
      'M9 12a3 3 0 1 0 6 0a3 3 0 1 0-6 0',
    ],
    defaultLabel: 'Mostrar',
  },
  eyeOff: {
    paths: [
      'M9.88 9.88a3 3 0 1 0 4.24 4.24',
      'M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68',
      'M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61',
      'M2 2l20 20',
    ],
    defaultLabel: 'Ocultar',
  },
  briefcase: {
    paths: [
      'M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16',
      'M2 7h20v13a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z',
    ],
    defaultLabel: 'Trabajo',
  },
  book: {
    paths: [
      'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z',
      'M4 19.5a2.5 2.5 0 0 0 2.5 2.5H20',
    ],
    defaultLabel: 'Estudio',
  },
  heart: {
    paths: [
      'M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z',
    ],
    defaultLabel: 'Salud',
  },
};

export function getIconDefinition(name: AppIconName): IconDefinition {
  return IconRegistry[name] ?? IconRegistry.info;
}
