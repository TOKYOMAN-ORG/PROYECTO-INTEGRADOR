import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { validateLogin } from './login-validation.ts';

describe('validateLogin', () => {
  it('no reporta errores con correo y contraseña válidos', () => {
    assert.deepEqual(validateLogin({ email: 'ana@mail.com', password: 'x' }), {});
  });

  it('con campos vacíos reporta un mensaje por campo', () => {
    assert.deepEqual(validateLogin({ email: '', password: '' }), {
      email: 'El correo es obligatorio',
      password: 'La contraseña es obligatoria',
    });
  });

  it('un correo solo con espacios cuenta como vacío', () => {
    assert.equal(validateLogin({ email: '   ', password: 'x' }).email, 'El correo es obligatorio');
  });

  it('rechaza un correo mal formado o de más de 255 caracteres', () => {
    for (const email of ['ana', 'ana@', 'ana@mail', '@mail.com', 'a b@mail.com', `${'a'.repeat(250)}@mail.com`]) {
      assert.equal(validateLogin({ email, password: 'x' }).email, 'El correo no tiene un formato válido', email);
    }
  });

  it('recorta los espacios del correo antes de validarlo', () => {
    assert.equal(validateLogin({ email: ' ana@mail.com ', password: 'x' }).email, undefined);
  });

  it('no exige longitud mínima de contraseña: eso lo decide el backend', () => {
    assert.equal(validateLogin({ email: 'ana@mail.com', password: '1' }).password, undefined);
  });
});
