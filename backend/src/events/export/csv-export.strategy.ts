import { Injectable } from '@nestjs/common';
import type { Event } from '../event.js';
import {
  EXPORTED_FIELDS,
  toExportedEvent,
  type ExportStrategy,
} from './export-strategy.js';

const LINE_BREAK = '\r\n';
// Caracteres con los que Excel o Google Sheets interpretan una celda como fórmula (CSV injection).
const FORMULA_TRIGGER = /^[=+\-@\t\r]/;
const NEEDS_QUOTES = /[",\r\n]/;

/**
 * Estrategia concreta: CSV según RFC 4180 (encabezado, una fila por evento, saltos `\r\n`). Las celdas que
 * empiezan como fórmula llevan el prefijo `'` y las que contienen coma, comillas o saltos de línea van entre
 * comillas con las comillas internas duplicadas.
 */
@Injectable()
export class CsvExportStrategy implements ExportStrategy {
  readonly format = 'csv';
  readonly contentType = 'text/csv; charset=utf-8';

  serialize(events: Event[]): string {
    const header = EXPORTED_FIELDS.join(',');
    const rows = events.map((event) => {
      const exported = toExportedEvent(event);
      return EXPORTED_FIELDS.map((field) => toCell(exported[field])).join(',');
    });
    return [header, ...rows].join(LINE_BREAK);
  }
}

function toCell(value: string | null): string {
  if (value === null) return '';
  const safe = FORMULA_TRIGGER.test(value) ? `'${value}` : value;
  return NEEDS_QUOTES.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}
