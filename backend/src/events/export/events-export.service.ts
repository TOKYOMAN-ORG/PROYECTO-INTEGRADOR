import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EventsRepository } from '../events.repository.js';
import { EXPORT_STRATEGIES, type ExportStrategy } from './export-strategy.js';

export interface ExportedFile {
  content: string;
  contentType: string;
  filename: string;
}

/**
 * Contexto del patrón Strategy (SCRUM-58): elige la estrategia registrada cuyo `format` coincide con el pedido y
 * serializa con ella los eventos del usuario. No contiene `if`/`switch` por formato.
 */
@Injectable()
export class EventsExportService {
  private readonly strategies: ReadonlyMap<string, ExportStrategy>;

  constructor(
    @Inject(EXPORT_STRATEGIES) strategies: ExportStrategy[],
    private readonly eventsRepository: EventsRepository,
  ) {
    this.strategies = new Map(
      strategies.map((strategy) => [strategy.format, strategy]),
    );
  }

  /** `userId` siempre proviene del JWT: la consulta solo devuelve eventos de ese usuario. */
  async export(userId: string, format: string): Promise<ExportedFile> {
    const strategy = this.strategies.get(format);
    if (!strategy) {
      // El DTO ya valida `format`; esto protege a quien llame al servicio sin pasar por el controlador.
      throw new BadRequestException({
        statusCode: 400,
        error: 'Bad Request',
        message: ['format debe ser json o csv'],
        errors: { format: ['format debe ser json o csv'] },
      });
    }

    const events = await this.eventsRepository.findAllByUserIdForExport(userId);
    return {
      content: strategy.serialize(events),
      contentType: strategy.contentType,
      filename: `agenda.${strategy.format}`,
    };
  }
}
