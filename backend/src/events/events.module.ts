import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsController } from './events.controller.js';
import { EventsRepository } from './events.repository.js';
import { EventsService } from './events.service.js';
import { CsvExportStrategy } from './export/csv-export.strategy.js';
import { EventsExportService } from './export/events-export.service.js';
import { EXPORT_STRATEGIES } from './export/export-strategy.js';
import { JsonExportStrategy } from './export/json-export.strategy.js';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [EventsController],
  providers: [
    EventsRepository,
    EventsService,
    // Patrón Strategy: para agregar un formato basta con crear su clase y sumarla a esta lista.
    JsonExportStrategy,
    CsvExportStrategy,
    {
      provide: EXPORT_STRATEGIES,
      useFactory: (json: JsonExportStrategy, csv: CsvExportStrategy) => [
        json,
        csv,
      ],
      inject: [JsonExportStrategy, CsvExportStrategy],
    },
    EventsExportService,
  ],
  exports: [EventsService, EventsRepository],
})
export class EventsModule {}
