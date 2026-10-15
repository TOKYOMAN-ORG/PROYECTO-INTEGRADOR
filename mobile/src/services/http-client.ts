/** Cliente HTTP base. `request` solo rechaza con `NetworkError` o `ApiError`, nunca con una excepción cruda. */

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

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Se serializa como JSON. */
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
};

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

  const { method = 'GET', body, headers, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
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
        ...headers,
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
    throw new ApiError(response.status, messageFrom(data, `Error ${response.status} de la API`));
  }
  if (unreadable) throw new ApiError(response.status, 'Respuesta de la API no válida');
  return data as T;
}
