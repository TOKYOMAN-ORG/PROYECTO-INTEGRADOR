import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfigService } from '../config/app-config.module.js';
import { DatabaseConnection } from './database-connection.js';

@Module({
  providers: [
    {
      provide: DatabaseConnection,
      inject: [ConfigService],
      useFactory: (config: AppConfigService) =>
        DatabaseConnection.getInstance({
          host: config.get('DB_HOST', { infer: true }),
          port: config.get('DB_PORT', { infer: true }),
          database: config.get('DB_NAME', { infer: true }),
          user: config.get('DB_USER', { infer: true }),
          password: config.get('DB_PASSWORD', { infer: true }),
        }),
    },
  ],
  exports: [DatabaseConnection],
})
export class DatabaseModule {}
