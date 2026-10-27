import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/features/auth/auth-context';
import { installGlobalErrorHandlers } from '@/utils/global-error-handler';

installGlobalErrorHandlers();

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ErrorBoundary>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { status, sessionError, retryRestore } = useAuth();

  // Mientras se restaura la sesión no se monta ningún navegador: evita el parpadeo de Login o de la pila privada.
  if (status === 'loading') {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SessionLoading />
      </ThemeProvider>
    );
  }

  // Con token guardado pero sin red (o fallo inesperado): mensaje controlado con reintento; el token se conserva.
  if (sessionError) {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SessionError onRetry={retryRestore} />
      </ThemeProvider>
    );
  }

  // Dos pilas separadas: cada pantalla solo existe en un grupo según el estado de sesión.
  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={status === 'authenticated'}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={status === 'unauthenticated'}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function SessionLoading() {
  return (
    <ThemedView style={styles.center}>
      <ActivityIndicator accessibilityLabel="Cargando sesión" />
      <ThemedText type="small">Cargando sesión…</ThemedText>
    </ThemedView>
  );
}

function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.center}>
        <ThemedText type="subtitle" style={styles.centerText}>
          No se pudo verificar tu sesión
        </ThemedText>
        <ThemedText style={styles.centerText}>
          Revisa tu conexión a internet e inténtalo de nuevo. No cerramos tu sesión.
        </ThemedText>
        <Button title="Reintentar" onPress={onRetry} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  centerText: {
    textAlign: 'center',
  },
});
