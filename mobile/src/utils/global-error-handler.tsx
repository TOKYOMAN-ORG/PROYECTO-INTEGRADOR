let installed = false;

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  try {
    const ErrorUtilsModule = require('react-native')?.ErrorUtils;
    if (ErrorUtilsModule && typeof ErrorUtilsModule.setGlobalHandler === 'function') {
      const defaultHandler = typeof ErrorUtilsModule.getGlobalHandler === 'function'
        ? ErrorUtilsModule.getGlobalHandler()
        : undefined;

      ErrorUtilsModule.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Global error:', error?.message);
        } else {
          console.error('Global error occurred');
        }
        if (typeof defaultHandler === 'function') {
          try {
            defaultHandler(error, isFatal);
          } catch {
            // ignore
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
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          console.error('Unhandled promise rejection:', event?.reason?.message);
        } else {
          console.error('Unhandled promise rejection');
        }
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
