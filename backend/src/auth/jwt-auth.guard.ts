import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';

export type AuthenticatedRequest = Request & { user: User };

/**
 * Exige `Authorization: Bearer <token>` con un JWT válido de un usuario que aún existe y deja el usuario en
 * `request.user`. Se aplica con `@UseGuards(JwtAuthGuard)`; el módulo que lo use debe importar `AuthModule`.
 * Todos los fallos responden el mismo 401 sin detalle para no ayudar a quien manipula tokens.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      throw new UnauthorizedException();
    }

    let subject: unknown;
    try {
      ({ sub: subject } = await this.jwt.verifyAsync<{ sub?: unknown }>(token));
    } catch {
      // Firma inválida, token alterado o expirado.
      throw new UnauthorizedException();
    }

    const user =
      typeof subject === 'string'
        ? await this.users.findById(subject)
        : undefined;
    if (!user) {
      throw new UnauthorizedException();
    }
    request.user = user;
    return true;
  }
}
