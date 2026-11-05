import { ValidateBy, type ValidationOptions } from 'class-validator';

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Rechaza fechas con formato correcto pero inexistentes (`2026-02-30`, `2026-13-45`, año `0000`):
 * PostgreSQL las rechaza al insertar o filtrar y terminarían en un 500. El formato lo reporta `@Matches`,
 * por eso un valor que no es `YYYY-MM-DD` pasa aquí y no se duplica el mensaje.
 */
export function IsCalendarDate(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isCalendarDate',
      validator: {
        validate: (value: unknown): boolean => {
          const parts = typeof value === 'string' ? ISO_DATE.exec(value) : null;
          if (!parts) {
            return true;
          }
          const [year, month, day] = parts.slice(1).map(Number);
          // `setUTCFullYear` evita que `Date.UTC` trate los años 0-99 como 1900-1999.
          const date = new Date(0);
          date.setUTCFullYear(year, month - 1, day);
          return (
            year >= 1 &&
            date.getUTCFullYear() === year &&
            date.getUTCMonth() === month - 1 &&
            date.getUTCDate() === day
          );
        },
      },
    },
    options,
  );
}
