import { getToken } from '../storage/secure-token-storage.ts';

/** Cliente HTTP base con soporte de interceptores globales. `request` solo rechaza con `NetworkError` o `ApiError`. */

export const DEFAULT_TIMEOUT_MS = 10_000;

/** La API no se pudo alcanzar: sin red, host inalcanzable, timeout o URL sin configurar. */
export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

/** La API respondió con un estado no 2xx (o con un cuerpo ilegible). */
export class ApiError extends Error {
  readonly status: number;
  /** Cuerpo JSON de la respuesta (p. ej. `errors` por campo del backend); `undefined` si no era JSON. */
  readonly body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Se serializa como JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

export type RequestInterceptorContext = {
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
};

export type RequestInterceptor = (
  context: RequestInterceptorContext,
) => Promise<void> | void;

/** Comprueba si una ruta es pública y debe omitir la cabecera Authorization. */
export function isPublicPath(path: string): boolean {
  const clean = path.replace(/^\/+/, '').split('?')[0].toLowerCase();
  return clean === 'api/auth/login' || clean === 'api/auth/register';
}

const requestInterceptors: RequestInterceptor[] = [];

/** Registra un interceptor de petición. Retorna una función para desregistrarlo. */
export function addRequestInterceptor(interceptor: RequestInterceptor): () => void {
  requestInterceptors.push(interceptor);
  return () => {
    const idx = requestInterceptors.indexOf(interceptor);
    if (idx !== -1) requestInterceptors.splice(idx, 1);
  };
}

/** Elimina todos los interceptores de petición registrados. */
export function clearRequestInterceptors(): void {
  requestInterceptors.length = 0;
}

/** Interceptor por defecto: adjunta JWT en rutas privadas si existe un token en el almacén seguro. */
export const jwtRequestInterceptor: RequestInterceptor = async (context) => {
  if (isPublicPath(context.path)) return;
  try {
    const token = await getToken();
    if (token) {
      const hasAuth = Object.keys(context.headers).some(
        (key) => key.toLowerCase() === 'authorization',
      );
      if (!hasAuth) {
        context.headers['Authorization'] = `Bearer ${token}`;
      }
    }
  } catch {
    // Si el almacén falla, la petición continúa sin cabecera y sin lanzar error
  }
};

/** Restablece los interceptores a su configuración por defecto. */
export function resetDefaultInterceptors(): void {
  clearRequestInterceptors();
  addRequestInterceptor(jwtRequestInterceptor);
}

// Inicializar interceptores por defecto
addRequestInterceptor(jwtRequestInterceptor);

/** Extrae `message` del error de NestJS (string, o lista de ValidationPipe). */
function messageFrom(body: unknown, fallback: string): string {
  const message = (body as { message?: unknown } | null | undefined)?.message;
  if (typeof message === 'string' && message) return message;
  if (Array.isArray(message) && message.length) return message.join('. ');
  return fallback;
}

/** `path` es relativo a `EXPO_PUBLIC_API_URL`, p. ej. `/api/health`. */
export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) throw new NetworkError('EXPO_PUBLIC_API_URL no está configurada');

  const { method = 'GET', body, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const headers: Record<string, string> = { ...(options.headers ?? {}) };

  // Ejecución de interceptores de petición
  const context: RequestInterceptorContext = { path, method, headers, body };
  for (const interceptor of requestInterceptors) {
    await interceptor(context);
  }

  const hasBody = body !== undefined;
  const payload = hasBody ? JSON.stringify(body) : undefined;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: { ok: boolean; status: number; text: string };
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(hasBody && { 'Content-Type': 'application/json' }),
        ...context.headers,
      },
      body: payload,
      signal: controller.signal,
    });
    // El cuerpo se lee dentro del timeout: una API que responde cabeceras y se cuelga también cuenta.
    response = { ok: res.ok, status: res.status, text: await res.text() };
  } catch {
    throw new NetworkError(
      controller.signal.aborted
        ? `La API no respondió en ${timeoutMs} ms`
        : 'No se pudo conectar con la API',
    );
  } finally {
    clearTimeout(timer);
  }

  let data: unknown;
  let unreadable = false;
  try {
    data = response.text ? JSON.parse(response.text) : undefined;
  } catch {
    unreadable = true;
  }

  if (!response.ok) {
    throw new ApiError(response.status, messageFrom(data, `Error ${response.status} de la API`), data);
  }
  if (unreadable) throw new ApiError(response.status, 'Respuesta de la API no válida');
  return data as T;
}

