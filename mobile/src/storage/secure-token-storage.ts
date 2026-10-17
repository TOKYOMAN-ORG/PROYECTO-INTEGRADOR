import * as SecureStore from 'expo-secure-store';

/**
 * Único lugar donde vive el JWT: el almacén seguro del sistema (Keychain en iOS, Keystore en Android).
 * Es también el único módulo que importa `expo-secure-store`.
 *
 * Ninguna función lanza: si el almacén falla devuelven `false` / `null` y el llamador decide qué mostrar.
 * En web `expo-secure-store` no está soportado, así que allí todo falla de forma controlada y no hay sesión persistente.
 */

// Las claves solo admiten letras, dígitos, ".", "-" y "_".
const TOKEN_KEY = 'secureplan.access-token';

/** `true` si el token quedó guardado. */
export async function saveToken(token: string): Promise<boolean> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

/** El token guardado, o `null` si no hay ninguno o el almacén falla. */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** `true` si no queda token guardado. */
export async function deleteToken(): Promise<boolean> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}
