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
    findCredentialsByEmail: vi.fn(),
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

  describe('authenticate', () => {
    let passwordHash: string;
    beforeAll(async () => {
      passwordHash = await passwords.hash('Secreta123');
    });

    it('devuelve solo id, name y email cuando el correo y la contraseña coinciden', async () => {
      repository.findCredentialsByEmail.mockResolvedValue({
        ...stored,
        passwordHash,
      });

      const user = await service.authenticate('ANA@Mail.com', 'Secreta123');

      expect(user).toEqual(stored);
      expect(JSON.stringify(user)).not.toContain('argon2');
      expect(repository.findCredentialsByEmail).toHaveBeenCalledWith(
        'ana@mail.com',
      );
    });

    it('devuelve undefined con una contraseña incorrecta', async () => {
      repository.findCredentialsByEmail.mockResolvedValue({
        ...stored,
        passwordHash,
      });

      await expect(
        service.authenticate('ana@mail.com', 'OtraClave123'),
      ).resolves.toBeUndefined();
    });

    it('con un correo inexistente devuelve undefined pero verifica igualmente contra un hash Argon2id ficticio', async () => {
      repository.findCredentialsByEmail.mockResolvedValue(undefined);
      const verify = vi.spyOn(passwords, 'verify');

      await expect(
        service.authenticate('nadie@mail.com', 'Secreta123'),
      ).resolves.toBeUndefined();

      expect(verify).toHaveBeenCalledTimes(1);
      expect(verify.mock.calls[0][1]).toMatch(/^\$argon2id\$/);
      verify.mockRestore();
    });

    it('calcula el hash ficticio una sola vez aunque haya varios correos inexistentes', async () => {
      const fresh = new UsersService(
        repository as unknown as UsersRepository,
        passwords,
      );
      repository.findCredentialsByEmail.mockResolvedValue(undefined);
      const hash = vi.spyOn(passwords, 'hash');

      await fresh.authenticate('a@mail.com', 'Secreta123');
      await fresh.authenticate('b@mail.com', 'Secreta123');

      expect(hash).toHaveBeenCalledTimes(1);
      hash.mockRestore();
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
