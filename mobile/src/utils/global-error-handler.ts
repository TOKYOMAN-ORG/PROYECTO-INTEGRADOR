import { reportError } from './report-error.ts';

let installed = false;

export function handleUncaughtError(error: Error, isFatal?: boolean): void {
  reportError(error);
  void isFatal;
}

export function handleUnhandledRejection(reason: unknown): void {
  reportError(reason);
}

export function installGlobalErrorHandlers(): void {
  if (installed) return;
  installed = true;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const rn = typeof require === 'function' ? (require('react-native') as any) : undefined;
    const ErrorUtilsModule = (globalThis as any).ErrorUtils ?? rn?.ErrorUtils;
    if (ErrorUtilsModule && typeof ErrorUtilsModule.setGlobalHandler === 'function') {
      const defaultHandler =
        typeof ErrorUtilsModule.getGlobalHandler === 'function'
          ? ErrorUtilsModule.getGlobalHandler()
          : undefined;

      ErrorUtilsModule.setGlobalHandler((error: Error, isFatal?: boolean) => {
        handleUncaughtError(error, isFatal);
        if (typeof defaultHandler === 'function') {
          try {
            defaultHandler(error, isFatal);
          } catch {
            // Evitar crasheos en cadena
          }
        }
      });
    }
  } catch (error) {
    console.warn('[error-handler] No se pudo instalar el manejador global', error);
  }

  try {
    if (typeof (global as any).addEventListener === 'function') {
      (global as any).addEventListener('unhandledrejection', (event: any) => {
        handleUnhandledRejection(event?.reason);
        try {
          event?.preventDefault?.();
        } catch {
          // ignore
        }
      });
    }
  } catch (error) {
    console.warn('[error-handler] No se pudo instalar el manejador de promesas rechazadas', error);
  }
}

/** Para restablecer en pruebas unitarias */
export function resetGlobalErrorHandlersInstalledForTest(): void {
  installed = false;
}
