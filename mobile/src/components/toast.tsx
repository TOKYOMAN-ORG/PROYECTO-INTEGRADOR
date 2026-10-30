import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import {
  createToastItem,
  filterOutToast,
  type ToastMessage,
  type ToastTone,
} from '@/components/toast-model';

interface ShowToastOptions {
  tone?: ToastTone;
  message: string;
  duration?: number;
}

interface ToastContextType {
  show: (options: ShowToastOptions) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => filterOutToast(prev, id));
  }, []);

  const show = useCallback(
    ({ tone = 'info', message, duration = 3500 }: ShowToastOptions) => {
      const item = createToastItem({ tone, message, duration });
      setToasts((prev) => [...prev, item]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(item.id);
        }, duration);
      }
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ show, dismiss }}>
      {children}
      <View
        pointerEvents="box-none"
        style={[
          styles.container,
          {
            top: Math.max(insets.top + 8, 16),
          },
        ]}>
        {toasts.map((toast) => (
          <View
            key={toast.id}
            pointerEvents="auto"
            style={styles.toastWrapper}>
            <Banner
              tone={toast.tone}
              message={toast.message}
              onClose={() => dismiss(toast.id)}
            />
          </View>
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastWrapper: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
});
