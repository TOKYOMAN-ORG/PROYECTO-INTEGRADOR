export interface ErrorBoundaryState {
  hasError: boolean;
}

export function createInitialErrorBoundaryState(): ErrorBoundaryState {
  return { hasError: false };
}

export function getDerivedErrorState(): ErrorBoundaryState {
  return { hasError: true };
}

export function resetErrorState(onReset?: () => void): ErrorBoundaryState {
  onReset?.();
  return { hasError: false };
}
