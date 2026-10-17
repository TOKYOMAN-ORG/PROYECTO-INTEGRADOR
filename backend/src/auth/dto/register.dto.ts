import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Límites superiores: el de `email` es el de la columna (si no, un correo largo fallaría en la base con 500)
 * y el de `password` evita que un cuerpo enorme encarezca el hash Argon2.
 */
export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El nombre es obligatorio' })
  @Length(2, 100, { message: 'El nombre debe tener entre 2 y 100 caracteres' })
  name: string;

  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(255, { message: 'El correo no puede superar 255 caracteres' })
  email: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede superar 128 caracteres' })
  password: string;
}
