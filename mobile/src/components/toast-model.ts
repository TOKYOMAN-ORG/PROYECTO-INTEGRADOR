export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  tone: ToastTone;
  message: string;
  duration?: number;
}

export function createToastItem(params: {
  tone?: ToastTone;
  message: string;
  duration?: number;
}): ToastMessage {
  return {
    id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tone: params.tone ?? 'info',
    message: params.message,
    duration: params.duration ?? 3500,
  };
}

export function filterOutToast(toasts: ToastMessage[], id: string): ToastMessage[] {
  return toasts.filter((t) => t.id !== id);
}
