/** Minutos de anticipación del recordatorio respecto al inicio del evento. */
export const REMINDER_LEAD_MINUTES = 10;

/**
 * Instante en que debe sonar el recordatorio de un evento: `fecha + hora − leadMinutes`, en hora local del
 * dispositivo (las columnas `date` y `time` no llevan zona horaria). Devuelve `null` si ese instante ya pasó
 * o si la fecha u hora no son válidas.
 */
export function getReminderDate(
  date: string,
  time: string,
  now: Date,
  leadMinutes: number = REMINDER_LEAD_MINUTES,
): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  // La API puede devolver `HH:mm` o `HH:mm:ss`; los segundos no importan para el aviso.
  const timeMatch = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  if (!dateMatch || !timeMatch) return null;

  const [, year, month, day] = dateMatch.map(Number);
  const [, hours, minutes] = timeMatch.map(Number);
  const reminder = new Date(year, month - 1, day, hours, minutes - leadMinutes, 0, 0);
  if (Number.isNaN(reminder.getTime())) return null;

  return reminder.getTime() > now.getTime() ? reminder : null;
}
