import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { Button } from '@/components/button';
import {
  createConfirmState,
  initialConfirmState,
  type ConfirmDialogState,
  type ConfirmOptions,
} from '@/components/confirm-dialog-model';
import { ThemedText } from '@/components/themed-text';
import { Elevation, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
  }
  return context.confirm;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmDialogState>(initialConfirmState);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);
  const theme = useTheme();

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState(createConfirmState(options));
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const resolver = resolveRef.current;
    resolveRef.current = null;
    setState((prev) => ({ ...prev, visible: false }));
    resolver?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    const resolver = resolveRef.current;
    resolveRef.current = null;
    setState((prev) => ({ ...prev, visible: false }));
    resolver?.(false);
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        visible={state.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
        accessibilityViewIsModal={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.backdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar cuadro de diálogo"
            style={styles.backdropDismiss}
            onPress={handleCancel}
          />
          <View
            accessibilityRole="alert"
            style={[
              styles.dialogCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              {state.title}
            </ThemedText>

            <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
              {state.message}
            </ThemedText>

            <View style={styles.buttonRow}>
              <View style={styles.buttonFlex}>
                <Button
                  title={state.cancelLabel ?? 'Cancelar'}
                  variant="outline"
                  size="md"
                  onPress={handleCancel}
                />
              </View>
              <View style={styles.buttonFlex}>
                <Button
                  title={state.confirmLabel ?? 'Confirmar'}
                  variant={state.destructive ? 'destructive' : 'primary'}
                  size="md"
                  loading={state.loading}
                  onPress={handleConfirm}
                />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ConfirmContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backdropDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: 24,
    ...Elevation.lg,
    zIndex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonFlex: {
    flex: 1,
  },
});
