import {
  EVENT_CATEGORIES,
  EVENT_PRIORITIES,
  type EventCategory,
  type EventPriority,
} from './event-types.ts';

export type CreateEventValues = {
  title: string;
  description?: string;
  date: string;
  time: string;
  category: EventCategory | '';
  priority: EventPriority | '';
};

export type CreateEventField = keyof CreateEventValues;
export type CreateEventFormErrors = Partial<Record<CreateEventField, string>>;

const TITLE_MAX = 100;
const DESCRIPTION_MAX = 500;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export function validateCreateEvent(
  values: CreateEventValues,
): CreateEventFormErrors {
  const errors: CreateEventFormErrors = {};

  const title = values.title.trim();
  if (!title) {
    errors.title = 'El título es obligatorio';
  } else if (title.length > TITLE_MAX) {
    errors.title = `El título no puede superar ${TITLE_MAX} caracteres`;
  }

  if (values.description) {
    const description = values.description.trim();
    if (description.length > DESCRIPTION_MAX) {
      errors.description = `La descripción no puede superar ${DESCRIPTION_MAX} caracteres`;
    }
  }

  const date = values.date.trim();
  if (!date) {
    errors.date = 'La fecha es obligatoria';
  } else if (!DATE_PATTERN.test(date)) {
    errors.date = 'La fecha debe tener el formato YYYY-MM-DD';
  } else {
    const [year, month, day] = date.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    if (
      parsedDate.getFullYear() !== year ||
      parsedDate.getMonth() !== month - 1 ||
      parsedDate.getDate() !== day
    ) {
      errors.date = 'La fecha no es válida en el calendario';
    }
  }

  const time = values.time.trim();
  if (!time) {
    errors.time = 'La hora es obligatoria';
  } else if (!TIME_PATTERN.test(time)) {
    errors.time = 'La hora debe tener el formato HH:mm o HH:mm:ss';
  }

  if (!values.category) {
    errors.category = 'Selecciona una categoría';
  } else if (!EVENT_CATEGORIES.includes(values.category as EventCategory)) {
    errors.category = 'La categoría seleccionada no es válida';
  }

  if (!values.priority) {
    errors.priority = 'Selecciona una prioridad';
  } else if (!EVENT_PRIORITIES.includes(values.priority as EventPriority)) {
    errors.priority = 'La prioridad seleccionada no es válida';
  }

  return errors;
}
