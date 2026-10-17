/** Validación del formulario de Registro; replica las reglas de `RegisterDto` del backend. */

export type RegisterValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterField = keyof RegisterValues;
export type RegisterFormErrors = Partial<Record<RegisterField, string>>;

// Mismos límites que el backend: nombre 2-100, correo hasta 255 (columna), contraseña 8-128.
const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 255;
const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

// Comprobación básica de forma; el backend (`IsEmail`) sigue siendo la validación definitiva.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(values: RegisterValues): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const name = values.name.trim();
  if (!name) errors.name = 'El nombre es obligatorio';
  else if (name.length < NAME_MIN || name.length > NAME_MAX) {
    errors.name = `El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres`;
  }

  const email = values.email.trim();
  if (!email) errors.email = 'El correo es obligatorio';
  else if (!EMAIL_PATTERN.test(email) || email.length > EMAIL_MAX) {
    errors.email = 'El correo no tiene un formato válido';
  }

  if (!values.password) errors.password = 'La contraseña es obligatoria';
  else if (values.password.length < PASSWORD_MIN) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  } else if (values.password.length > PASSWORD_MAX) {
    errors.password = `La contraseña no puede superar ${PASSWORD_MAX} caracteres`;
  }

  if (!values.confirmPassword) errors.confirmPassword = 'Confirma tu contraseña';
  else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }

  return errors;
}
