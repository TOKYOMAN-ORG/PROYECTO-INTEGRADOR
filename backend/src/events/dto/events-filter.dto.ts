import { IsOptional, Matches } from 'class-validator';
import { IsCalendarDate } from './is-calendar-date.js';

export class EventsFilterDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from debe tener el formato YYYY-MM-DD',
  })
  @IsCalendarDate({ message: 'from no existe en el calendario' })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to debe tener el formato YYYY-MM-DD',
  })
  @IsCalendarDate({ message: 'to no existe en el calendario' })
  to?: string;
}
