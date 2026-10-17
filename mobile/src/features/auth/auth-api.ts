import { ApiError, NetworkError, request } from '../../services/http-client.ts';
import { saveToken } from '../../storage/secure-token-storage.ts';
import type { RegisterField, RegisterFormErrors } from './register-validation.ts';

export type RegisterInput = { name: string; email: string; password: string };
export type RegisteredUser = { id: string; name: string; email: string };

/** Crea la cuenta (`POST /api/auth/register`). La contraseña solo viaja en el cuerpo de la petición. */
export function register(input: RegisterInput): Promise<RegisteredUser> {
  return request<RegisteredUser>('/api/auth/register', { method: 'POST', body: input });
}

export type LoginInput = { email: string; password: string };

/**
 * Inicia sesión (`POST /api/auth/login`) y guarda el `accessToken` solo en SecureStore: la función no lo devuelve
 * ni lo registra. Rechaza con `ApiError` (401 si las credenciales no son válidas; también si la respuesta 200 no trae
 * un token), `NetworkError`, o `Error` si el token no pudo guardarse; en ningún caso queda un token guardado.
 */
export async function login(input: LoginInput): Promise<void> {
  const body = await request<{ accessToken?: unknown } | undefined>('/api/auth/login', {
    method: 'POST',
    body: input,
  });
  const accessToken = body?.accessToken;
  if (typeof accessToken !== 'string' || !accessToken) throw new ApiError(200, 'Respuesta de la API no válida');
  if (!(await saveToken(accessToken))) throw new Error('No se pudo guardar el token de sesión');
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

const INVALID_CREDENTIALS = 'Credenciales inválidas';

/** Traduce un fallo de `login()` en el mensaje general del formulario. */
export function describeLoginError(error: unknown): string {
  if (error instanceof NetworkError) return NO_CONNECTION;
  if (error instanceof ApiError) {
    if (error.status === 401) return INVALID_CREDENTIALS;
    if (error.status === 400) return error.message;
  }
  return UNEXPECTED;
}

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
