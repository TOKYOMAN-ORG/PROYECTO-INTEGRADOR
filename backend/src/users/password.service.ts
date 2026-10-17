import { Injectable } from '@nestjs/common';
import { argon2id, hash, verify } from 'argon2';

/** Cifrado de contraseñas con Argon2id; asíncrono, corre en el threadpool de libuv sin bloquear el event loop. */
@Injectable()
export class PasswordService {
  /** Devuelve el hash codificado (`$argon2id$...`); la sal es aleatoria, así que cambia en cada llamada. */
  hash(password: string): Promise<string> {
    return hash(password, { type: argon2id });
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    try {
      return await verify(passwordHash, password);
    } catch {
      // Hash corrupto o de formato desconocido: no puede coincidir.
      return false;
    }
  }
}
