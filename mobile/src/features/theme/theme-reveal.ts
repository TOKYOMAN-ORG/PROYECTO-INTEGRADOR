/**
 * Utilidades puras para la transición circular de cambio de tema.
 */

export interface RevealOrigin {
  x: number;
  y: number;
}

/** Radio mínimo del círculo para cubrir toda la pantalla desde `origin` (distancia a la esquina más lejana). */
export function computeRevealRadius(origin: RevealOrigin, width: number, height: number): number {
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  return Math.hypot(dx, dy);
}

/** Limita el origen a la pantalla para que un toque en el borde no genere un círculo fuera de lugar. */
export function clampOrigin(origin: RevealOrigin, width: number, height: number): RevealOrigin {
  return {
    x: Math.min(Math.max(origin.x, 0), width),
    y: Math.min(Math.max(origin.y, 0), height),
  };
}

/** Extrae las coordenadas de pantalla de un evento de pulsación (nativo o web); `undefined` si no las trae. */
export function getPressOrigin(event: unknown): RevealOrigin | undefined {
  const native = (event as { nativeEvent?: Record<string, unknown> } | null)?.nativeEvent;
  if (!native) return undefined;
  const x = typeof native.pageX === 'number' ? native.pageX : (native.clientX as number | undefined);
  const y = typeof native.pageY === 'number' ? native.pageY : (native.clientY as number | undefined);
  if (typeof x !== 'number' || typeof y !== 'number') return undefined;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined;
  return { x, y };
}

/** Retardo escalonado para animar listas: cada elemento entra un poco después, con un tope. */
export function getStaggerDelay(index: number, step = 60, max = 360): number {
  return Math.min(Math.max(index, 0) * step, max);
}
