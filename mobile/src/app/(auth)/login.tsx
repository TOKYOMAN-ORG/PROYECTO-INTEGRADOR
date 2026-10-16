import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

// shortcut: pantalla mínima que solo muestra la confirmación del registro; el formulario de Login llega con SCRUM-26.
export default function LoginScreen() {
  const { registered } = useLocalSearchParams<{ registered?: string }>();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle">Iniciar sesión</ThemedText>
        {registered ? (
          <ThemedText accessibilityLiveRegion="polite">
            Cuenta creada correctamente. Ya puedes iniciar sesión.
          </ThemedText>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
});
