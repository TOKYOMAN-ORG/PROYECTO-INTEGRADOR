import type { Event } from './event-types.ts';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export { MONTH_NAMES, WEEKDAY_NAMES_SHORT };

/**
 * Formatea un Date a 'YYYY-MM-DD' en hora local.
 */
export function formatDateIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Devuelve el rango 'from' y 'to' para un mes y año dados ('YYYY-MM-01' a 'YYYY-MM-DD').
 */
export function getMonthDateRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const paddedMonth = String(month + 1).padStart(2, '0');
  const from = `${year}-${paddedMonth}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const to = `${year}-${paddedMonth}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
}

export type CalendarCell = {
  dateString: string;
  day: number;
  isCurrentMonth: boolean;
};

/**
 * Genera la cuadrícula de días para el mes indicado (incluye días del mes anterior y siguiente para completar semanas).
 */
export function getCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: CalendarCell[] = [];

  // Días del mes anterior
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(year, month - 1, day);
    cells.push({
      dateString: formatDateIso(prevDate),
      day,
      isCurrentMonth: false,
    });
  }

  // Días del mes actual
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const curDate = new Date(year, month, day);
    cells.push({
      dateString: formatDateIso(curDate),
      day,
      isCurrentMonth: true,
    });
  }

  // Días del mes siguiente para completar la última semana (múltiplo de 7)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day);
    cells.push({
      dateString: formatDateIso(nextDate),
      day,
      isCurrentMonth: false,
    });
  }

  return cells;
}

/**
 * Formatea una fecha ISO 'YYYY-MM-DD' para mostrar en cabecera: Ej. "21 de octubre de 2026"
 */
export function formatDisplayDate(dateIso: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateIso;
  return `${day} de ${MONTH_NAMES[month].toLowerCase()} de ${year}`;
}

/**
 * Filtra y ordena cronológicamente los eventos de una fecha dada.
 */
export function getEventsForDate(events: Event[], dateIso: string): Event[] {
  return events
    .filter((e) => e.date === dateIso)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export interface DayGroup {
  date: string;
  header: string;
  isToday: boolean;
  events: Event[];
}

/**
 * Formatea la cabecera de un grupo diario: Ej. "Hoy · Viernes, 30 de octubre" o "Sábado, 31 de octubre"
 */
export function formatDayGroupHeader(dateIso: string, todayIso: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  const weekdayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d.getDay()];
  const formatted = `${weekdayName}, ${day} de ${MONTH_NAMES[month].toLowerCase()}`;
  return dateIso === todayIso ? `Hoy · ${formatted}` : formatted;
}

/**
 * Agrupa los eventos ordenados por fecha y hora cronológica para la vista de agenda.
 */
export function groupEventsByDate(events: Event[], todayIso: string): DayGroup[] {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const list = map.get(ev.date) ?? [];
    list.push(ev);
    map.set(ev.date, list);
  }

  const sortedDates = Array.from(map.keys()).sort();

  return sortedDates.map((date) => {
    const dayEvents = (map.get(date) ?? []).sort((a, b) => a.time.localeCompare(b.time));
    return {
      date,
      header: formatDayGroupHeader(date, todayIso),
      isToday: date === todayIso,
      events: dayEvents,
    };
  });
}

/**
 * Ajusta una hora en formato 'HH:MM' sumando o restando una cantidad de minutos,
 * manteniendo el formato de 24 horas ('00:00' - '23:59').
 */
export function adjustTimeMinutes(currentTime: string, deltaMinutes: number): string {
  const parts = currentTime.split(':');
  let hours = parseInt(parts[0] || '12', 10);
  let minutes = parseInt(parts[1] || '00', 10);
  if (Number.isNaN(hours)) hours = 12;
  if (Number.isNaN(minutes)) minutes = 0;

  let totalMinutes = hours * 60 + minutes + deltaMinutes;
  const dayMinutes = 24 * 60;
  totalMinutes = ((totalMinutes % dayMinutes) + dayMinutes) % dayMinutes;

  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

