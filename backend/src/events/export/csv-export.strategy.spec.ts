import { describe, expect, it } from 'vitest';
import type { Event } from '../event.js';
import { CsvExportStrategy } from './csv-export.strategy.js';

const HEADER = 'id,title,description,date,time,category,priority';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-uuid-1',
    userId: 'user-uuid-1',
    title: 'Entrega Proyecto',
    description: 'Subir el reporte final',
    date: '2026-10-27',
    time: '18:00',
    category: 'estudio',
    priority: 'alta',
    createdAt: new Date('2026-10-20T10:00:00.000Z'),
    updatedAt: new Date('2026-10-20T10:00:00.000Z'),
    ...overrides,
  };
}

/** Lector CSV mínimo según RFC 4180, para comprobar que el texto original se recupera. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\r' && text[i + 1] === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
      i += 1;
    } else {
      cell += char;
    }
  }
  row.push(cell);
  rows.push(row);
  return rows;
}

describe('CsvExportStrategy', () => {
  const strategy = new CsvExportStrategy();

  it('se identifica con el formato csv y su Content-Type', () => {
    expect(strategy.format).toBe('csv');
    expect(strategy.contentType).toBe('text/csv; charset=utf-8');
  });

  it('emite el encabezado y una fila por evento en el orden de columnas, separadas por \\r\\n', () => {
    const output = strategy.serialize([
      makeEvent(),
      makeEvent({ id: 'event-uuid-2', title: 'Gimnasio', category: 'salud' }),
    ]);

    expect(output).toBe(
      [
        HEADER,
        'event-uuid-1,Entrega Proyecto,Subir el reporte final,2026-10-27,18:00,estudio,alta',
        'event-uuid-2,Gimnasio,Subir el reporte final,2026-10-27,18:00,salud,alta',
      ].join('\r\n'),
    );
    expect(output).not.toContain('user-uuid-1');
  });

  it('entrecomilla campos con coma, comillas o salto de línea y duplica las comillas internas', () => {
    const title = 'Revisar "avance", parte 1\nnotas';
    const output = strategy.serialize([makeEvent({ title })]);

    expect(output).toContain('"Revisar ""avance"", parte 1\nnotas"');
    expect(parseCsv(output)[1][1]).toBe(title);
  });

  it.each(['=', '+', '-', '@', '\t', '\r'])(
    'neutraliza fórmulas: una celda que empieza con %j lleva el prefijo \'',
    (trigger) => {
      const title = `${trigger}SUM(A1:A2)`;
      const description = `${trigger}HYPERLINK("http://malicioso")`;
      const [, row] = parseCsv(strategy.serialize([makeEvent({ title, description })]));

      expect(row[1]).toBe(`'${title}`);
      expect(row[2]).toBe(`'${description}`);
    },
  );

  it('con una lista vacía devuelve solo el encabezado', () => {
    expect(strategy.serialize([])).toBe(HEADER);
  });

  it('emite una descripción nula como celda vacía', () => {
    const output = strategy.serialize([makeEvent({ description: null })]);
    expect(output.split('\r\n')[1]).toBe(
      'event-uuid-1,Entrega Proyecto,,2026-10-27,18:00,estudio,alta',
    );
  });
});
