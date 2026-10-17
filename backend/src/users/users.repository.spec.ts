import type { DatabaseConnection } from '../database/database-connection.js';
import { UsersRepository } from './users.repository.js';

const user = {
  id: '7f1c2b34-0000-4000-8000-000000000001',
  name: 'Ana',
  email: 'ana@mail.com',
};

describe('UsersRepository', () => {
  const query = vi.fn();
  const repository = new UsersRepository({
    query,
  } as unknown as DatabaseConnection);

  beforeEach(() => {
    query.mockReset();
  });

  it('insert guarda el hash por parámetros y devuelve el usuario sin el hash', async () => {
    query.mockResolvedValue({ rows: [user] });

    const created = await repository.insert({
      name: 'Ana',
      email: 'ana@mail.com',
      passwordHash: '$argon2id$hash',
    });

    expect(query).toHaveBeenCalledWith(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
      ['Ana', 'ana@mail.com', '$argon2id$hash'],
    );
    expect(created).toEqual(user);
  });

  it('findByEmail consulta por parámetro y devuelve undefined si no existe', async () => {
    query
      .mockResolvedValueOnce({ rows: [user] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.findByEmail('ana@mail.com')).resolves.toEqual(user);
    await expect(
      repository.findByEmail('nadie@mail.com'),
    ).resolves.toBeUndefined();
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('lower(email) = $1'),
      ['ana@mail.com'],
    );
  });

  it('findById consulta por parámetro y devuelve undefined si no existe', async () => {
    query
      .mockResolvedValueOnce({ rows: [user] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(repository.findById(user.id)).resolves.toEqual(user);
    await expect(repository.findById('otro')).resolves.toBeUndefined();
    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('id = $1'),
      [user.id],
    );
  });

  it('findCredentialsByEmail devuelve el hash junto al usuario, consultando por parámetro', async () => {
    const credentials = { ...user, passwordHash: '$argon2id$hash' };
    query
      .mockResolvedValueOnce({ rows: [credentials] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      repository.findCredentialsByEmail("x'; DROP TABLE users; --"),
    ).resolves.toEqual(credentials);
    await expect(
      repository.findCredentialsByEmail('nadie@mail.com'),
    ).resolves.toBeUndefined();

    const [text, params] = query.mock.calls[0];
    expect(text).toContain('password_hash AS "passwordHash"');
    expect(text).toContain('lower(email) = $1');
    expect(text).not.toContain('DROP TABLE');
    expect(params).toEqual(["x'; DROP TABLE users; --"]);
  });

  it('ninguna consulta selecciona password_hash ni interpola valores en el texto', async () => {
    query.mockResolvedValue({ rows: [] });

    await repository.findByEmail("x'; DROP TABLE users; --");
    await repository.findById("x'; DROP TABLE users; --");

    for (const [text] of query.mock.calls) {
      expect(text).not.toMatch(/password_hash/);
      expect(text).not.toContain('DROP TABLE');
    }
  });
});
