import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { IsCalendarDate } from './is-calendar-date.js';

class Probe {
  @IsCalendarDate()
  date: unknown;
}

const isValid = async (date: unknown): Promise<boolean> => {
  const probe = new Probe();
  probe.date = date;
  return (await validate(probe)).length === 0;
};

describe('IsCalendarDate', () => {
  it.each(['2026-11-05', '2024-02-29', '2026-12-31', '0001-01-01', '0026-05-10'])(
    'acepta la fecha existente %s',
    async (date) => {
      expect(await isValid(date)).toBe(true);
    },
  );

  it.each(['2026-13-45', '2026-02-30', '2025-02-29', '2026-00-10', '2026-04-31', '0000-01-01'])(
    'rechaza la fecha inexistente %s (PostgreSQL daría 500)',
    async (date) => {
      expect(await isValid(date)).toBe(false);
    },
  );

  it.each(['no-es-fecha', '', 20261105, null])(
    'no duplica el error de formato: deja pasar %j para que lo reporte @Matches/@IsString',
    async (value) => {
      expect(await isValid(value)).toBe(true);
    },
  );
});
