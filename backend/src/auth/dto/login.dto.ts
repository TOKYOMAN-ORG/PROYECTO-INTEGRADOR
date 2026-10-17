import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Sin mínimo de longitud en la contraseña: no hay que revelar la política de contraseñas a quien prueba credenciales.
 * El máximo evita que un cuerpo enorme encarezca la verificación Argon2.
 */
export class LoginDto {
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(255, { message: 'El correo no puede superar 255 caracteres' })
  email: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(128, { message: 'La contraseña no puede superar 128 caracteres' })
  password: string;
}
