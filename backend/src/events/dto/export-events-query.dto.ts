import { IsIn } from 'class-validator';

export const EXPORT_FORMATS = ['json', 'csv'] as const;

export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export class ExportEventsQueryDto {
  // Sin @IsOptional: un `format` ausente, repetido (llega como arreglo) o desconocido no pasa @IsIn y responde 400.
  @IsIn(EXPORT_FORMATS, { message: 'format debe ser json o csv' })
  format!: ExportFormat;
}
