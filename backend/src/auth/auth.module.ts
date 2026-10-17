import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt';
import type { AppConfigService } from '../config/app-config.module.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: 'HS256',
          // El formato ("15m", "1h") lo acepta jsonwebtoken; el tipo estricto de `ms` no admite un `string` cualquiera.
          expiresIn: config.get('JWT_EXPIRES_IN', {
            infer: true,
          }) as JwtSignOptions['expiresIn'],
        },
        // Fija el algoritmo al verificar: evita aceptar tokens `alg: none` o firmados con otro algoritmo.
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  // Lo que `JwtAuthGuard` necesita para resolverse en el módulo que lo use con `@UseGuards`.
  exports: [JwtAuthGuard, JwtModule, UsersModule],
})
export class AuthModule {}
