import { ConflictException } from '@nestjs/common';
import { PasswordService } from './password.service.js';
import type { UsersRepository } from './users.repository.js';
import { UsersService } from './users.service.js';

const stored = {
  id: '7f1c2b34-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
};

describe('UsersService', () => {
  const repository = {
    insert: vi.fn(),
    findByEmail: vi.fn(),
    findById: vi.fn(),
  };
  const passwords = new PasswordService();
  const service = new UsersService(
    repository as unknown as UsersRepository,
    passwords,
  );

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    it('guarda el correo en minúsculas y un hash Argon2id, nunca la contraseña', async () => {
      repository.insert.mockResolvedValue(stored);

      await service.create({
        name: 'Ana',
        email: 'Ana@Mail.COM',
        password: 'Secreta123',
      });

      const record = repository.insert.mock.calls[0][0];
      expect(record.email).toBe('ana@mail.com');
      expect(record.passwordHash.startsWith('$argon2id$')).toBe(true);
      expect(JSON.stringify(record)).not.toContain('Secreta123');
      await expect(
        passwords.verify('Secreta123', record.passwordHash),
      ).resolves.toBe(true);
    });

    it('devuelve solo id, name y email', async () => {
      repository.insert.mockResolvedValue(stored);

      const user = await service.create({
        name: 'Ana',
        email: 'ana@mail.com',
        password: 'Secreta123',
      });

      expect(Object.keys(user).sort()).toEqual(['email', 'id', 'name']);
    });

    it('lanza 409 cuando la base reporta una violación de unicidad', async () => {
      repository.insert.mockRejectedValue(
        Object.assign(new Error('duplicate'), { code: '23505' }),
      );

      await expect(
        service.create({
          name: 'Ana',
          email: 'ana@mail.com',
          password: 'Secreta123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('propaga cualquier otro error de la base sin convertirlo en 409', async () => {
      const failure = Object.assign(new Error('connection lost'), {
        code: '08006',
      });
      repository.insert.mockRejectedValue(failure);

      await expect(
        service.create({
          name: 'Ana',
          email: 'ana@mail.com',
          password: 'Secreta123',
        }),
      ).rejects.toBe(failure);
    });
  });

  describe('búsquedas', () => {
    it('findByEmail normaliza el correo a minúsculas', async () => {
      repository.findByEmail.mockResolvedValue(stored);

      await expect(service.findByEmail('ANA@Mail.com')).resolves.toEqual(
        stored,
      );
      expect(repository.findByEmail).toHaveBeenCalledWith('ana@mail.com');
    });

    it('findById delega en el repositorio y devuelve undefined si no existe', async () => {
      repository.findById.mockResolvedValue(undefined);

      await expect(service.findById(stored.id)).resolves.toBeUndefined();
      expect(repository.findById).toHaveBeenCalledWith(stored.id);
    });
  });
});
