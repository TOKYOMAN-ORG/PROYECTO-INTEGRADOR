import { ConflictException, Injectable } from '@nestjs/common';
import { PasswordService } from './password.service.js';
import type { User } from './user.js';
import { UsersRepository } from './users.repository.js';

/** Código SQLSTATE de PostgreSQL para una violación de restricción única. */
const UNIQUE_VIOLATION = '23505';

export interface NewUser {
  name: string;
  email: string;
  /** Texto plano: solo existe aquí, se cifra y no se conserva ni se registra en logs. */
  password: string;
}

const normalizeEmail = (email: string) => email.toLowerCase();

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly passwords: PasswordService,
  ) {}

  /** Lanza 409 si el correo ya existe (la unicidad la garantiza el índice, así no hay condiciones de carrera). */
  async create({ name, email, password }: NewUser): Promise<User> {
    const passwordHash = await this.passwords.hash(password);
    try {
      return await this.repository.insert({
        name,
        email: normalizeEmail(email),
        passwordHash,
      });
    } catch (error) {
      if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
        throw new ConflictException('El correo ya está registrado');
      }
      throw error;
    }
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.repository.findByEmail(normalizeEmail(email));
  }

  findById(id: string): Promise<User | undefined> {
    return this.repository.findById(id);
  }
}
