import { Link, useLocalSearchParams } from 'expo-router';
import React, { useRef, useState } from 'react';
import { StyleSheet, type TextInput, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { describeLoginError } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/auth-context';
import {
  type LoginField,
  type LoginFormErrors,
  type LoginValues,
  validateLogin,
} from '@/features/auth/login-validation';
import { Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EMPTY_VALUES: LoginValues = { email: '', password: '' };

export default function LoginScreen() {
  const { signInWithCredentials, sessionExpired, clearSessionExpired } = useAuth();
  const { registered, expired } = useLocalSearchParams<{ registered?: string; expired?: string }>();
  const theme = useTheme();

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [formError, setFormError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const isExpired = Boolean(expired) || sessionExpired;

  const update = (field: LoginField) => (text: string) => {
    setValues((current) => ({ ...current, [field]: text }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  async function submit() {
    if (submitting) return;
    setFormError(undefined);
    clearSessionExpired();

    const found = validateLogin(values);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      if (found.email) {
        emailRef.current?.focus();
      } else if (found.password) {
        passwordRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);
    try {
      await signInWithCredentials({ email: values.email.trim(), password: values.password });
    } catch (error) {
      const msg = describeLoginError(error);
      setFormError(msg);
      passwordRef.current?.focus();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      scrollable={true}
      contentContainerStyle={styles.content}>
      {/* Encabezado con identidad de marca y jerarquía tipográfica */}
      <View style={styles.brandHeader}>
        <ThemedText style={[styles.brandTitle, { color: theme.text }]}>
          SecurePlan
        </ThemedText>
        <ThemedText style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
          Tu agenda de productividad segura
        </ThemedText>
      </View>

      <View style={styles.formCard}>
        <ThemedText style={[styles.formTitle, { color: theme.text }]}>
          Iniciar sesión
        </ThemedText>

        {/* Banners informativos y de error */}
        {registered && (
          <View style={styles.bannerWrapper}>
            <Banner
              tone="success"
              message="Cuenta creada correctamente. Ya puedes iniciar sesión."
            />
          </View>
        )}

        {isExpired && (
          <View style={styles.bannerWrapper}>
            <Banner
              tone="warning"
              title="Sesión expirada"
              message="Tu sesión ha finalizado por seguridad. Ingresa tus credenciales de nuevo."
            />
          </View>
        )}

        {formError && (
          <View style={styles.bannerWrapper}>
            <Banner tone="error" message={formError} />
          </View>
        )}

        {/* Campos con foco guiado */}
        <TextField
          ref={emailRef}
          label="Correo electrónico"
          leftIcon="mail"
          required
          value={values.email}
          onChangeText={update('email')}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <TextField
          ref={passwordRef}
          label="Contraseña"
          leftIcon="lock"
          required
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

        <View style={styles.actions}>
          <Button
            title="Iniciar sesión"
            variant="primary"
            size="md"
            onPress={submit}
            loading={submitting}
          />

          <Link href="/register" asChild>
            <Button
              title="¿No tienes cuenta? Regístrate"
              variant="ghost"
              size="md"
              accessibilityLabel="¿No tienes cuenta? Regístrate aquí"
            />
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: Typography.display.fontSize,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: Typography.caption.fontSize,
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: 16,
  },
  formTitle: {
    fontSize: Typography.title.fontSize,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerWrapper: {
    width: '100%',
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
});
