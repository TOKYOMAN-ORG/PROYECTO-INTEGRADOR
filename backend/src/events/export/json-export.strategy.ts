import { Injectable } from '@nestjs/common';
import type { Event } from '../event.js';
import { toExportedEvent, type ExportStrategy } from './export-strategy.js';

/** Estrategia concreta: la agenda como arreglo JSON con los siete campos exportables. */
@Injectable()
export class JsonExportStrategy implements ExportStrategy {
  readonly format = 'json';
  readonly contentType = 'application/json; charset=utf-8';

  serialize(events: Event[]): string {
    return JSON.stringify(events.map(toExportedEvent));
  }
}
