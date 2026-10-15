import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DatabaseConnection } from '../database/database-connection.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly database: DatabaseConnection) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    try {
      await this.database.query('SELECT 1');
    } catch (error) {
      // El detalle va solo al log del servidor; la respuesta HTTP no expone nada interno.
      this.logger.error(
        `La base de datos no responde: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException();
    }
    return { status: 'ok' };
  }
}
