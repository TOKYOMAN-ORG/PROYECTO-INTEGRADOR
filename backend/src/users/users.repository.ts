import { Injectable } from '@nestjs/common';
import { DatabaseConnection } from '../database/database-connection.js';
import type { User } from './user.js';

export interface NewUserRecord {
  name: string;
  /** Ya normalizado a minúsculas por `UsersService`. */
  email: string;
  passwordHash: string;
}

/** Acceso a la tabla `users`. Solo consultas parametrizadas; ninguna selecciona `password_hash`. */
@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseConnection) {}

  async insert({ name, email, passwordHash }: NewUserRecord): Promise<User> {
    const { rows } = await this.database.query<User>(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, passwordHash],
    );
    return rows[0];
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const { rows } = await this.database.query<User>(
      'SELECT id, name, email FROM users WHERE lower(email) = $1',
      [email],
    );
    return rows[0];
  }

  async findById(id: string): Promise<User | undefined> {
    const { rows } = await this.database.query<User>(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id],
    );
    return rows[0];
  }
}
