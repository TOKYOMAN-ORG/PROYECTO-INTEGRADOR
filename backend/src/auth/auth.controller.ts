import { Body, Controller, Post } from '@nestjs/common';
import type { User } from '../users/user.js';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly users: UsersService) {}

  /** 201 con `{ id, name, email }`; 409 si el correo ya existe. La contraseña nunca se devuelve. */
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<User> {
    return this.users.create(dto);
  }
}
