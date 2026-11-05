import { Link, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Platform, StyleSheet, type TextInput, View } from 'react-native';

import { Banner } from '@/components/banner';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { ThemedText } from '@/components/themed-text';
import { describeRegisterError, register } from '@/features/auth/auth-api';
import {
  type RegisterField,
  type RegisterFormErrors,
  type RegisterValues,
  validateRegister,
} from '@/features/auth/register-validation';
import { Elevation, Radius, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const EMPTY_VALUES: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' };

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

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
    if (Object.keys(found).length > 0) {
      if (found.name) {
        nameRef.current?.focus();
      } else if (found.email) {
        emailRef.current?.focus();
      } else if (found.password) {
        passwordRef.current?.focus();
      } else if (found.confirmPassword) {
        confirmPasswordRef.current?.focus();
      }
      return;
    }

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
      if (failure.fields.name) {
        nameRef.current?.focus();
      } else if (failure.fields.email) {
        emailRef.current?.focus();
      } else if (failure.fields.password) {
        passwordRef.current?.focus();
      } else if (failure.fields.confirmPassword) {
        confirmPasswordRef.current?.focus();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      scrollable={true}
      header={
        <View style={styles.topBar}>
          <ThemeToggleButton size={20} />
        </View>
      }
      contentContainerStyle={styles.content}>
      {/* Encabezado con identidad de marca */}
      <View style={styles.brandHeader}>
        <ThemedText style={[styles.brandTitle, { color: theme.text }]}>
          SecurePlan
        </ThemedText>
        <ThemedText style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
          Crea tu cuenta de productividad segura
        </ThemedText>
      </View>

      <View
        style={[
          styles.formCard,
          {
            backgroundColor: theme.isDark
              ? 'rgba(17, 24, 39, 0.72)'
              : 'rgba(255, 255, 255, 0.78)',
            borderColor: theme.isDark
              ? 'rgba(255, 255, 255, 0.14)'
              : 'rgba(15, 23, 42, 0.08)',
          },
        ]}>
        <ThemedText style={[styles.formTitle, { color: theme.text }]}>
          Crear cuenta
        </ThemedText>

        {/* Banner de error general del registro */}
        {formError && (
          <View style={styles.bannerWrapper}>
            <Banner tone="error" message={formError} />
          </View>
        )}

        {/* Campos con foco guiado */}
        <TextField
          ref={nameRef}
          label="Nombre"
          leftIcon="user"
          required
          value={values.name}
          onChangeText={update('name')}
          error={errors.name}
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

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
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        <TextField
          ref={confirmPasswordRef}
          label="Confirmar contraseña"
          leftIcon="lock"
          required
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

        <View style={styles.actions}>
          <Button
            title="Registrarme"
            variant="primary"
            size="md"
            onPress={submit}
            loading={submitting}
          />

          <Link href="/login" asChild>
            <Button
              title="¿Ya tienes cuenta? Inicia sesión"
              variant="ghost"
              size="md"
              accessibilityLabel="¿Ya tienes cuenta? Inicia sesión aquí"
            />
          </Link>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
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
    padding: 24,
    borderRadius: Radius.xl,
    borderWidth: 1,
    ...Elevation.sm,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(22px) saturate(185%)',
        WebkitBackdropFilter: 'blur(22px) saturate(185%)',
        boxShadow:
          'inset 0 1px 1px rgba(255, 255, 255, 0.25), 0 12px 32px rgba(0, 0, 0, 0.08)',
      } as any,
      default: {},
    }),
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
