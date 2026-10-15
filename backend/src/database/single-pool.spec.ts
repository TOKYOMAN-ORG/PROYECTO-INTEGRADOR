import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC_DIR = fileURLToPath(new URL('../', import.meta.url));
const SINGLETON_FILE = 'database/database-connection.ts';
const DIRECT_CONNECTION = /\bnew\s+(Pool|Client)\s*\(/;

const sourceFiles = readdirSync(SRC_DIR, { recursive: true })
  .map((file) => String(file).replaceAll('\\', '/'))
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'));

describe('acceso a PostgreSQL', () => {
  it('solo la clase Singleton crea conexiones (sin new Pool( ni new Client( en el resto de src)', () => {
    const offenders = sourceFiles.filter(
      (file) =>
        file !== SINGLETON_FILE &&
        DIRECT_CONNECTION.test(readFileSync(join(SRC_DIR, file), 'utf8')),
    );

    expect(offenders).toEqual([]);
  });

  it('el Singleton crea exactamente un Pool', () => {
    const source = readFileSync(join(SRC_DIR, SINGLETON_FILE), 'utf8');

    expect(source.match(/\bnew\s+Pool\s*\(/g)).toHaveLength(1);
  });
});
