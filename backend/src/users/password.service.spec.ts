import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  const service = new PasswordService();

  describe('hash', () => {
    it('devuelve un hash Argon2id que no contiene la contraseña', async () => {
      const hash = await service.hash('Secreta123');

      expect(hash.startsWith('$argon2id$')).toBe(true);
      expect(hash).not.toContain('Secreta123');
    });

    it('es distinto en cada llamada (sal aleatoria)', async () => {
      const [first, second] = await Promise.all([
        service.hash('Secreta123'),
        service.hash('Secreta123'),
      ]);

      expect(first).not.toBe(second);
    });
  });

  describe('verify', () => {
    it('devuelve true con la contraseña correcta', async () => {
      const hash = await service.hash('Secreta123');

      await expect(service.verify('Secreta123', hash)).resolves.toBe(true);
    });

    it('devuelve false con una contraseña incorrecta', async () => {
      const hash = await service.hash('Secreta123');

      await expect(service.verify('secreta123', hash)).resolves.toBe(false);
    });

    it('devuelve false, sin lanzar, si el hash está corrupto', async () => {
      await expect(service.verify('Secreta123', 'no-es-un-hash')).resolves.toBe(
        false,
      );
      await expect(service.verify('Secreta123', '')).resolves.toBe(false);
    });
  });
});
