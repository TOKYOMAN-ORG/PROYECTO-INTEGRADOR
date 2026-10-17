import { ApiError, NetworkError, request } from '../../services/http-client.ts';
import type { RegisterField, RegisterFormErrors } from './register-validation.ts';

export type RegisterInput = { name: string; email: string; password: string };
export type RegisteredUser = { id: string; name: string; email: string };

/** Crea la cuenta (`POST /api/auth/register`). La contraseña solo viaja en el cuerpo de la petición. */
export function register(input: RegisterInput): Promise<RegisteredUser> {
  return request<RegisteredUser>('/api/auth/register', { method: 'POST', body: input });
}

export type RegisterFailure = {
  /** Errores para mostrar bajo cada campo. */
  fields: RegisterFormErrors;
  /** Mensaje general del formulario cuando el fallo no pertenece a un campo. */
  message?: string;
};

// `confirmPassword` es solo del cliente: el backend nunca lo recibe ni lo valida.
const SERVER_FIELDS: RegisterField[] = ['name', 'email', 'password'];

const EMAIL_TAKEN = 'El correo ya está registrado';
const NO_CONNECTION = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
const UNEXPECTED = 'Ocurrió un error inesperado. Inténtalo de nuevo más tarde.';

/** Traduce un fallo de `register()` en mensajes por campo (400, 409) o un mensaje general (red, 5xx). */
export function describeRegisterError(error: unknown): RegisterFailure {
  if (error instanceof NetworkError) return { fields: {}, message: NO_CONNECTION };

  if (error instanceof ApiError) {
    if (error.status === 409) return { fields: { email: EMAIL_TAKEN } };

    if (error.status === 400) {
      const serverErrors = (error.body as { errors?: Record<string, unknown> } | undefined)?.errors;
      const fields: RegisterFormErrors = {};
      for (const field of SERVER_FIELDS) {
        const messages = serverErrors?.[field];
        if (Array.isArray(messages) && typeof messages[0] === 'string') fields[field] = messages[0];
      }
      if (Object.keys(fields).length > 0) return { fields };
      return { fields: {}, message: error.message };
    }
  }

  return { fields: {}, message: UNEXPECTED };
}
