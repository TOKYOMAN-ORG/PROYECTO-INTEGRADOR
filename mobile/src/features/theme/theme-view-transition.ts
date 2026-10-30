import { clampOrigin, type RevealOrigin } from './theme-reveal';

interface ViewTransitionLike {
  ready: Promise<void>;
}

type DocumentWithTransitions = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransitionLike;
};

const STYLE_ID = 'secureplan-theme-transition';

/** Desactiva el fundido por defecto de View Transitions para que solo se vea el círculo que crece. */
function ensureTransitionStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    ::view-transition-old(root), ::view-transition-new(root) {
      animation: none;
      mix-blend-mode: normal;
    }
    ::view-transition-old(root) { z-index: 1; }
    ::view-transition-new(root) { z-index: 2; }
  `;
  document.head.appendChild(style);
}

export function prefersReducedMotionWeb(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Cambio de tema con un círculo que crece desde `origin` usando la API View Transitions del navegador.
 * Devuelve `false` si el navegador no la soporta (el llamador usa entonces la animación de respaldo).
 */
export function startCircularTransition(
  origin: RevealOrigin,
  radius: number,
  apply: () => void,
): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as DocumentWithTransitions;
  if (typeof doc.startViewTransition !== 'function') return false;

  ensureTransitionStyle();
  const { x, y } = clampOrigin(origin, window.innerWidth, window.innerHeight);

  const transition = doc.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        apply();
        // Dos fotogramas para que React pinte el tema nuevo antes de que el navegador tome la captura final.
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );

  transition.ready
    .then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        },
      );
    })
    .catch(() => {
      // Si la transición se cancela el tema ya quedó aplicado.
    });

  return true;
}
