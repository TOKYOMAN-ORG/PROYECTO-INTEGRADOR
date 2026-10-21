import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-context';

/**
 * `Alert.alert` no está implementado en react-native-web, así que allí se usa `window.confirm`.
 * Resuelve `false` también al descartar el diálogo (botón atrás en Android).
 */
function confirmSignOut(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm('¿Cerrar sesión?'));
  }
  return new Promise((resolve) => {
    Alert.alert(
      'Cerrar sesión',
      '¿Quieres cerrar la sesión?',
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Cerrar sesión', style: 'destructive', onPress: () => resolve(true) },
      ],
      { onDismiss: () => resolve(false) },
    );
  });
}

export default function HomeScreen() {
  const router = useRouter();
  const { created, eventTitle } = useLocalSearchParams<{
    created?: string;
    eventTitle?: string;
  }>();
  const { signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    if (signingOut) return;
    // El token solo se borra si el usuario confirma (criterio de aceptación de SCRUM-8).
    if (!(await confirmSignOut())) return;
    setSigningOut(true);
    try {
      // Al borrar el token el guard del root layout redirige solo a la pila `(auth)`.
      await signOut();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.center}>
        <ThemedText type="title" style={styles.title}>
          SecurePlan
        </ThemedText>
        <ThemedText style={styles.centerText}>Tu agenda de productividad segura</ThemedText>

        {created === '1' && (
          <View style={styles.confirmationBox}>
            <ThemedText style={styles.confirmationText}>
              ✓ Evento {eventTitle ? `«${eventTitle}»` : ''} creado exitosamente
            </ThemedText>
          </View>
        )}

        <View style={styles.actions}>
          <Button
            title="+ Crear evento"
            onPress={() => router.push('/(app)/events/new' as any)}
          />
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.secondaryButton,
              { opacity: signingOut ? 0.6 : pressed ? 0.85 : 1 },
            ]}
            onPress={handleSignOut}
            disabled={signingOut}>
            <ThemedText type="default">
              {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </ThemedText>
          </Pressable>
        </View>
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
  title: {
    textAlign: 'center',
  },
  centerText: {
    textAlign: 'center',
  },
  confirmationBox: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    backgroundColor: '#E8F5E9',
    borderRadius: Spacing.one,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginTop: Spacing.one,
  },
  confirmationText: {
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
});

