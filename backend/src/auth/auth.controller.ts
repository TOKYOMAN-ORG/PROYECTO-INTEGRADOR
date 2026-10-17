import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard, type AuthenticatedRequest } from './jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly users: UsersService,
    private readonly auth: AuthService,
  ) {}

  /** 201 con `{ id, name, email }`; 409 si el correo ya existe. La contraseña nunca se devuelve. */
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<User> {
    return this.users.create(dto);
  }

  /** 200 con `{ accessToken }`; 401 "Credenciales inválidas" si el correo no existe o la contraseña no coincide. */
  @Post('login')
  @HttpCode(200)
  login(
    @Body() { email, password }: LoginDto,
  ): Promise<{ accessToken: string }> {
    return this.auth.login(email, password);
  }

  /** `{ id, name, email }` del dueño del token; 401 si falta, está alterado, expiró o el usuario ya no existe. */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() { user }: AuthenticatedRequest): User {
    return user;
  }
}
