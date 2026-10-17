import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  /** El mismo 401 si el correo no existe o la contraseña no coincide: no revela qué correos están registrados. */
  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.users.authenticate(email, password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    // El payload lleva solo `sub`; `exp` lo agrega la firma. Nada de correo ni datos del usuario.
    return { accessToken: await this.jwt.signAsync({ sub: user.id }) };
  }
}
