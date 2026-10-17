import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { describeLoginError, login } from '@/features/auth/auth-api';
import {
  validateLogin,
  type LoginField,
  type LoginFormErrors,
  type LoginValues,
} from '@/features/auth/login-validation';

const EMPTY_VALUES: LoginValues = { email: '', password: '' };

export default function LoginScreen() {
  const router = useRouter();
  const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const update = (field: LoginField) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function submit() {
    if (submitting) return;
    setFormError(undefined);

    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await login({ email: values.email.trim(), password: values.password });
      // La pila privada `(app)` llega con SCRUM-29; hasta entonces la pantalla de inicio es el destino.
      router.replace('/');
    } catch (error) {
      setFormError(describeLoginError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <ThemedText type="subtitle">Iniciar sesión</ThemedText>

            {registered ? (
              <ThemedText accessibilityLiveRegion="polite">
                Cuenta creada correctamente. Ya puedes iniciar sesión.
              </ThemedText>
            ) : null}

            <TextField
              label="Correo electrónico"
              value={values.email}
              onChangeText={update('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <TextField
              label="Contraseña"
              value={values.password}
              onChangeText={update('password')}
              error={errors.password}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            {formError ? (
              <ThemedText themeColor="error" accessibilityLiveRegion="polite">
                {formError}
              </ThemedText>
            ) : null}

            <Button title="Iniciar sesión" onPress={submit} loading={submitting} />

            <Link href="/register" style={styles.link}>
              <ThemedText type="linkPrimary">¿No tienes cuenta? Regístrate</ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // `flexGrow` centra el formulario en pantallas grandes y, en las pequeñas, deja que el scroll muestre todos los campos.
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  link: {
    textAlign: 'center',
  },
});
