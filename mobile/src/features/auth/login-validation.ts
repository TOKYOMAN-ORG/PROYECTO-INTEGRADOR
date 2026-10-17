import { validateEmail } from './register-validation.ts';

/** Validación del formulario de Login: solo forma y campos obligatorios; las credenciales las decide el backend. */

export type LoginValues = { email: string; password: string };

export type LoginField = keyof LoginValues;
export type LoginFormErrors = Partial<Record<LoginField, string>>;

export function validateLogin(values: LoginValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;

  // Sin mínimo de longitud: no se revela la política de contraseñas a quien prueba credenciales.
  if (!values.password) errors.password = 'La contraseña es obligatoria';

  return errors;
}
