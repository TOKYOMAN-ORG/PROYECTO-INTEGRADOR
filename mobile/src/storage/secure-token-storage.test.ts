import assert from 'node:assert/strict';
import { beforeEach, describe, it, mock } from 'node:test';

// `expo-secure-store` necesita los módulos nativos de Expo y no se puede cargar en Node: se sustituye por un almacén en memoria.
const items = new Map<string, string>();
let failing = false;
const guard = () => {
  if (failing) throw new Error('almacén no disponible');
};

mock.module('expo-secure-store', {
  exports: {
    setItemAsync: async (key: string, value: string) => {
      guard();
      items.set(key, value);
    },
    getItemAsync: async (key: string) => {
      guard();
      return items.get(key) ?? null;
    },
    deleteItemAsync: async (key: string) => {
      guard();
      items.delete(key);
    },
  },
});

const { deleteToken, getToken, saveToken } = await import('./secure-token-storage.ts');

beforeEach(() => {
  items.clear();
  failing = false;
});

describe('secure-token-storage', () => {
  it('saveToken seguido de getToken devuelve el mismo token', async () => {
    assert.equal(await saveToken('abc'), true);
    assert.equal(await getToken(), 'abc');
  });

  it('guardar de nuevo reemplaza el token anterior: hay una única clave', async () => {
    await saveToken('uno');
    await saveToken('dos');

    assert.equal(await getToken(), 'dos');
    assert.equal(items.size, 1);
  });

  it('deleteToken elimina el token y getToken devuelve null', async () => {
    await saveToken('abc');

    assert.equal(await deleteToken(), true);
    assert.equal(await getToken(), null);
  });

  it('getToken devuelve null si nunca se guardó nada', async () => {
    assert.equal(await getToken(), null);
  });

  it('usa una clave válida para SecureStore (letras, dígitos, ".", "-" y "_")', async () => {
    await saveToken('abc');

    for (const key of items.keys()) assert.match(key, /^[\w.-]+$/);
  });

  it('si el almacén falla, ninguna función lanza y devuelven un resultado controlado', async () => {
    failing = true;

    assert.equal(await saveToken('abc'), false);
    assert.equal(await getToken(), null);
    assert.equal(await deleteToken(), false);
  });
});
