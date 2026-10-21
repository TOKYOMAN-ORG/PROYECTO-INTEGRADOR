import { ApiError, NetworkError, request } from '../../services/http-client.ts';
import type {
  CreateEventField,
  CreateEventFormErrors,
} from './create-event-validation.ts';
import type { Event, EventCategory, EventPriority } from './event-types.ts';

export type CreateEventInput = {
  title: string;
  description?: string;
  date: string;
  time: string;
  category: EventCategory;
  priority: EventPriority;
};

export async function createEvent(
  input: CreateEventInput,
  token: string,
): Promise<Event> {
  if (!token) throw new ApiError(401, 'No hay token de sesión');
  return request<Event>('/api/events', {
    method: 'POST',
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getEvents(
  token: string,
  from?: string,
  to?: string,
): Promise<Event[]> {
  if (!token) throw new ApiError(401, 'No hay token de sesión');
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  const endpoint = qs ? `/api/events?${qs}` : '/api/events';
  return request<Event[]>(endpoint, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function updateEvent(
  id: string,
  input: CreateEventInput,
  token: string,
): Promise<Event> {
  if (!token) throw new ApiError(401, 'No hay token de sesión');
  return request<Event>(`/api/events/${id}`, {
    method: 'PUT',
    body: input,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteEvent(id: string, token: string): Promise<void> {
  if (!token) throw new ApiError(401, 'No hay token de sesión');
  await request<void>(`/api/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}



export type CreateEventFailure = {
  fields: CreateEventFormErrors;
  message?: string;
};

const NO_CONNECTION =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const UNEXPECTED = 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.';
const SESSION_EXPIRED = 'Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.';

const SERVER_FIELDS: CreateEventField[] = [
  'title',
  'description',
  'date',
  'time',
  'category',
  'priority',
];

export function describeCreateEventError(error: unknown): CreateEventFailure {
  if (error instanceof NetworkError) {
    return { fields: {}, message: NO_CONNECTION };
  }

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return { fields: {}, message: SESSION_EXPIRED };
    }

    if (error.status === 404) {
      return { fields: {}, message: 'El evento ya no existe' };
    }

    if (error.status === 400) {
      const serverErrors = (
        error.body as { errors?: Record<string, unknown> } | undefined
      )?.errors;
      const fields: CreateEventFormErrors = {};
      for (const field of SERVER_FIELDS) {
        const messages = serverErrors?.[field];
        if (Array.isArray(messages) && typeof messages[0] === 'string') {
          fields[field] = messages[0];
        }
      }
      if (Object.keys(fields).length > 0) return { fields };
      return { fields: {}, message: error.message };
    }
  }

  return { fields: {}, message: UNEXPECTED };
}
