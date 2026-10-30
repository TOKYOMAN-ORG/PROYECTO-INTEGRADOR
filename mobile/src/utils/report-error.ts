/**
 * Helper centralizado para registrar errores en la app móvil (SCRUM-72 / SCRUM-73).
 *
 * - Omite credenciales, tokens JWT (patrón `eyJ...`), contraseñas y cabeceras sensibles.
 * - Registra en consola mediante `console.error` de manera controlada.
 * - Deduplica registros idénticos consecutivos para evitar spam en bucles de error.
 */

const SENSITIVE_PATTERNS = [
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, // JWTs
  /("?password"?\s*:\s*)"[^"]+"/gi,                     // Passwords en JSON
  /(bearer\s+)[a-zA-Z0-9._-]+/gi,                        // Authorization headers
];

let lastLoggedError: string | null = null;
let lastLoggedTime = 0;

export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export function reportError(error: unknown): void {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  const cleanMessage = sanitizeErrorMessage(rawMessage || 'Unknown error');
  const now = Date.now();

  // Deduplicación simple dentro de una ventana de 500ms
  if (lastLoggedError === cleanMessage && now - lastLoggedTime < 500) {
    return;
  }

  lastLoggedError = cleanMessage;
  lastLoggedTime = now;

  console.error('[SecurePlan Error]:', cleanMessage);
}

/** Para uso exclusivo en pruebas unitarias */
export function resetReportErrorHistory(): void {
  lastLoggedError = null;
  lastLoggedTime = 0;
}
