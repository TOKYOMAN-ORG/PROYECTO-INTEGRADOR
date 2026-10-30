import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Banner } from '@/components/banner';
import {
  createToastItem,
  filterOutToast,
  type ToastMessage,
  type ToastTone,
} from '@/components/toast-model';

import { Duration } from '@/constants/theme';

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

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: Duration.fast,
      useNativeDriver: true,
    }).start();
  }, [anim]);

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.toastWrapper,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [-8, 0],
              }),
            },
          ],
        },
      ]}>
      <Banner
        tone={toast.tone}
        message={toast.message}
        onClose={onDismiss}
      />
    </Animated.View>
  );
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
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismiss(toast.id)}
          />
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
