import * as SecureStore from 'expo-secure-store';

/**
 * Único lugar donde vive el JWT. Es también el único módulo que importa `expo-secure-store`.
 *
 * - Nativo (iOS/Android): el almacén seguro del sistema (Keychain en iOS, Keystore en Android).
 * - Web: `expo-secure-store` no tiene implementación (su módulo web está vacío), así que el token
 *   vive SOLO en memoria de la pestaña: nunca se escribe en `localStorage` ni en disco y desaparece
 *   al recargar, por lo que en web tampoco hay sesión persistente.
 *
 * Ninguna función lanza: si el almacén falla devuelven `false` / `null` y el llamador decide qué mostrar.
 */

// Las claves solo admiten letras, dígitos, ".", "-" y "_".
const TOKEN_KEY = 'secureplan.access-token';

/**
 * ¿Estamos en el navegador? Se comprueba `document` porque existe solo allí: ni en Node (tests) ni en
 * React Native nativo (tiene `window`, pero no `document`). Así no hace falta importar `react-native`,
 * lo que rompería los tests de Node, y el camino nativo sigue usando SecureStore sin cambios.
 */
const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

// Copia en memoria del token. Solo se usa en web y se pierde al recargar/cerrar la pestaña.
let memoryToken: string | null = null;

/** `true` si el token quedó guardado. */
export async function saveToken(token: string): Promise<boolean> {
  if (isWeb) {
    memoryToken = token;
    return true;
  }
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    return true;
  } catch {
    return false;
  }
}

/** El token guardado, o `null` si no hay ninguno o el almacén falla. */
export async function getToken(): Promise<string | null> {
  if (isWeb) return memoryToken;
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** `true` si no queda token guardado. */
export async function deleteToken(): Promise<boolean> {
  if (isWeb) {
    memoryToken = null;
    return true;
  }
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    return true;
  } catch {
    return false;
  }
}
