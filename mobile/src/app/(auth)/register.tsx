import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { describeRegisterError, register } from '@/features/auth/auth-api';
import {
  validateRegister,
  type RegisterField,
  type RegisterFormErrors,
  type RegisterValues,
} from '@/features/auth/register-validation';

const EMPTY_VALUES: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' };

export default function RegisterScreen() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const update = (field: RegisterField) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function submit() {
    if (submitting) return;
    setFormError(undefined);

    const found = validateRegister(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.replace({ pathname: '/login', params: { registered: '1' } });
    } catch (error) {
      const failure = describeRegisterError(error);
      setErrors(failure.fields);
      setFormError(failure.message);
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
            <ThemedText type="subtitle">Crear cuenta</ThemedText>

            <TextField
              label="Nombre"
              value={values.name}
              onChangeText={update('name')}
              error={errors.name}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
            />
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
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="next"
            />
            <TextField
              label="Confirmar contraseña"
              value={values.confirmPassword}
              onChangeText={update('confirmPassword')}
              error={errors.confirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="done"
              onSubmitEditing={submit}
            />

            {formError ? (
              <ThemedText themeColor="error" accessibilityLiveRegion="polite">
                {formError}
              </ThemedText>
            ) : null}

            <Button title="Registrarme" onPress={submit} loading={submitting} />

            <Link href="/login" style={styles.link}>
              <ThemedText type="linkPrimary">¿Ya tienes cuenta? Inicia sesión</ThemedText>
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
