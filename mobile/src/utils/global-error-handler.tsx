import { ErrorUtils } from 'react-native';

let installed = false;

export function installGlobalErrorHandlers() {
  if (installed) return;
  installed = true;

  const defaultHandler = ErrorUtils.getGlobalHandler?.();

  ErrorUtils.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
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

  const rejectionTracking = (global as any).ErrorUtils || ErrorUtils;
  const originalRejectionHandler =
    (global as any).onunhandledrejection ||
    (global as any).HermesInternal?.hasPromise?.onunhandledrejection;

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
}
