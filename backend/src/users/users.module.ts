import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { PasswordService } from './password.service.js';
import { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [UsersRepository, UsersService, PasswordService],
  exports: [UsersService],
})
export class UsersModule {}
