export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface ConfirmDialogState extends ConfirmOptions {
  visible: boolean;
  loading?: boolean;
}

export const initialConfirmState: ConfirmDialogState = {
  visible: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  destructive: false,
  loading: false,
};

export function createConfirmState(options: ConfirmOptions): ConfirmDialogState {
  return {
    visible: true,
    title: options.title,
    message: options.message,
    confirmLabel: options.confirmLabel ?? 'Confirmar',
    cancelLabel: options.cancelLabel ?? 'Cancelar',
    destructive: options.destructive ?? false,
    loading: false,
  };
}
