/**
 * 'HH:mm' o 'HH:mm:ss' (24 h) → '11:04 PM'. La API y la base de datos siguen en 24 h; esto solo cambia lo que
 * se muestra, para que nadie confunda las 11:04 AM con las 11:04 PM. Si el texto no es una hora válida se devuelve igual.
 */
export function formatTime12h(time: string): string {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(time);
  if (!match) return time;
  const hours = Number(match[1]);
  return `${hours % 12 || 12}:${match[2]} ${hours < 12 ? 'AM' : 'PM'}`;
}
