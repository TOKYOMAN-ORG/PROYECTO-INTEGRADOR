import { randomUUID } from 'node:crypto';
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
  // shortcut: el primer correo inexistente paga además el cálculo del hash ficticio; precalcularlo en onModuleInit si esa diferencia puntual importa.
  private dummyHash?: Promise<string>;

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

  /**
   * El usuario si el correo y la contraseña coinciden; `undefined` en cualquier otro caso. Si el correo no existe se
   * verifica igualmente contra un hash ficticio, para que ambos fallos tarden lo mismo y no revelen qué correos existen.
   */
  async authenticate(
    email: string,
    password: string,
  ): Promise<User | undefined> {
    const credentials = await this.repository.findCredentialsByEmail(
      normalizeEmail(email),
    );
    const matches = await this.passwords.verify(
      password,
      credentials?.passwordHash ?? (await this.getDummyHash()),
    );
    if (!credentials || !matches) {
      return undefined;
    }
    return {
      id: credentials.id,
      name: credentials.name,
      email: credentials.email,
    };
  }

  /** Hash descartable con los mismos parámetros que los reales; la contraseña que lo generó no se conserva. */
  private getDummyHash(): Promise<string> {
    return (this.dummyHash ??= this.passwords.hash(randomUUID()));
  }

  findByEmail(email: string): Promise<User | undefined> {
    return this.repository.findByEmail(normalizeEmail(email));
  }

  findById(id: string): Promise<User | undefined> {
    return this.repository.findById(id);
  }
}
