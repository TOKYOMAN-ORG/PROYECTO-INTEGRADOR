import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateRegister, type RegisterValues } from './register-validation.ts';

const valid: RegisterValues = {
  name: 'Ana Pérez',
  email: 'ana@mail.com',
  password: 'Secreta123',
  confirmPassword: 'Secreta123',
};

describe('validateRegister', () => {
  it('no reporta errores con datos válidos', () => {
    assert.deepEqual(validateRegister(valid), {});
  });

  it('con todos los campos vacíos reporta un mensaje por campo', () => {
    const errors = validateRegister({ name: '', email: '', password: '', confirmPassword: '' });

    assert.deepEqual(Object.keys(errors).sort(), ['confirmPassword', 'email', 'name', 'password']);
  });

  it('un nombre solo con espacios cuenta como vacío', () => {
    assert.equal(validateRegister({ ...valid, name: '   ' }).name, 'El nombre es obligatorio');
  });

  it('valida los límites del nombre (2 a 100 caracteres, tras recortar espacios)', () => {
    assert.ok(validateRegister({ ...valid, name: 'A' }).name);
    assert.equal(validateRegister({ ...valid, name: ' Al ' }).name, undefined);
    assert.equal(validateRegister({ ...valid, name: 'a'.repeat(100) }).name, undefined);
    assert.ok(validateRegister({ ...valid, name: 'a'.repeat(101) }).name);
  });

  it('rechaza correos mal formados y acepta los válidos', () => {
    for (const email of ['ana', 'ana@', '@mail.com', 'ana@mail', 'a na@mail.com']) {
      assert.equal(
        validateRegister({ ...valid, email }).email,
        'El correo no tiene un formato válido',
        email,
      );
    }
    assert.equal(validateRegister({ ...valid, email: ' ana@mail.com ' }).email, undefined);
  });

  it('rechaza un correo de más de 255 caracteres', () => {
    const email = `${'a'.repeat(250)}@mail.com`;

    assert.ok(validateRegister({ ...valid, email }).email);
  });

  it('exige entre 8 y 128 caracteres en la contraseña', () => {
    const short = '1234567';
    assert.ok(validateRegister({ ...valid, password: short, confirmPassword: short }).password);
    const edge = '12345678';
    assert.equal(
      validateRegister({ ...valid, password: edge, confirmPassword: edge }).password,
      undefined,
    );
    const long = 'a'.repeat(129);
    assert.ok(validateRegister({ ...valid, password: long, confirmPassword: long }).password);
  });

  it('la confirmación debe coincidir con la contraseña', () => {
    const errors = validateRegister({ ...valid, confirmPassword: 'Secreta124' });

    assert.equal(errors.confirmPassword, 'Las contraseñas no coinciden');
    assert.equal(errors.password, undefined);
  });
});
