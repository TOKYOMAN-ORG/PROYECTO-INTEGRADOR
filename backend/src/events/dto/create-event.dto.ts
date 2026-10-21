import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  type EventCategory,
  type EventPriority,
} from '../event.types.js';

export class CreateEventDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MaxLength(100, { message: 'El título no puede superar 100 caracteres' })
  title: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(500, { message: 'La descripción no puede superar 500 caracteres' })
  description?: string;

  @IsString({ message: 'La fecha es obligatoria' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'La fecha debe tener el formato YYYY-MM-DD',
  })
  date: string;

  @IsString({ message: 'La hora es obligatoria' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'La hora debe tener el formato HH:mm o HH:mm:ss',
  })
  time: string;

  @IsIn(EVENT_CATEGORIES, {
    message: `La categoría debe ser una de: ${EVENT_CATEGORIES.join(', ')}`,
  })
  category: EventCategory;

  @IsIn(EVENT_PRIORITIES, {
    message: `La prioridad debe ser una de: ${EVENT_PRIORITIES.join(', ')}`,
  })
  priority: EventPriority;
}
