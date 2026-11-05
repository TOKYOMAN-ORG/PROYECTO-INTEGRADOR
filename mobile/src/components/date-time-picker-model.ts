const MONTH_NAMES_FULL = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const WEEKDAY_NAMES_FULL = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/**
 * Parsea una cadena 'YYYY-MM-DD' en hora local para evitar desplazamientos por zona horaria.
 */
export function parseIsoDate(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') return null;
  const parts = dateString.trim().split('-');
  if (parts.length !== 3) return null;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;

  const date = new Date(year, month, day);
  // Verificar si hubo desbordamiento de fin de mes (ej. 31 de febrero)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
}

/**
 * Formatea un Date a 'YYYY-MM-DD' usando la fecha local.
 */
export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parsea una cadena 'HH:mm' en componentes numéricos.
 */
export function parseTimeString(timeString: string): { hours: number; minutes: number } | null {
  if (!timeString || typeof timeString !== 'string') return null;
  const parts = timeString.trim().split(':');
  if (parts.length < 2) return null;

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return { hours, minutes };
}

/**
 * Crea o ajusta un Date a partir de una cadena 'HH:mm' en hora local.
 */
export function timeStringToDate(timeString: string, baseDate?: Date): Date | null {
  const parsed = parseTimeString(timeString);
  if (!parsed) return null;

  const date = baseDate ? new Date(baseDate.getTime()) : new Date();
  date.setHours(parsed.hours, parsed.minutes, 0, 0);
  return date;
}

/**
 * Formatea un Date a 'HH:mm' local.
 */
export function formatTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Convierte 'YYYY-MM-DD' a una etiqueta legible en español: "martes 3 de noviembre de 2026".
 */
export function formatReadableDate(dateString: string): string {
  const date = parseIsoDate(dateString);
  if (!date) return dateString;

  const weekday = WEEKDAY_NAMES_FULL[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES_FULL[date.getMonth()];
  const year = date.getFullYear();

  return `${weekday} ${day} de ${month} de ${year}`;
}

/**
 * Etiqueta de accesibilidad para DateField.
 */
export function formatDateAccessibilityLabel(label: string, dateString: string): string {
  const readable = formatReadableDate(dateString);
  return `${label}, ${readable}, botón`;
}

/**
 * Etiqueta de accesibilidad para TimeField.
 */
export function formatTimeAccessibilityLabel(label: string, timeString: string): string {
  return `${label}, ${timeString}, botón`;
}
